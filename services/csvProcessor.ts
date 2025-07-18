import { format, parseISO, differenceInHours, differenceInMinutes, isValid } from 'date-fns';
import type { DashboardData, RowData, KpiMetrics, MonthlyData, BreakdownItem, BreakdownData, InvalidRow, OpenTicket } from '../types';
import { PERFORMANCE_THRESHOLDS } from '../constants';

interface TicketData {
  reqId: string;
  technician: string;
  category: string;
  subCategory: string;
  status: string;
  createdTime: Date;
  assignedTime: Date | null;
  completedTime: Date | null;
  resolvedTime: Date | null;
  isResolved: boolean;
  isCompleted: boolean;
  mtta: number; // Minutes to Acknowledge
  mtti: number; // Hours to Complete/Resolve
  mttr: number; // Hours to Repair/Resolve
  isFirstTimeResolution: boolean;
  meetsSLA: boolean;
  openDurationHours: number;
  rowData: RowData;
}

export function processCsvData(csvData: RowData[], filters?: { technician?: string; category?: string; month?: string }): DashboardData {
  if (!csvData || csvData.length < 2) {
    throw new Error('Invalid CSV data: No data rows found');
  }

  const headers = csvData[0];
  const dataRows = csvData.slice(1);
  
  // Find column indices
  const getColumnIndex = (columnName: string): number => {
    const index = headers.findIndex(h => h && h.toLowerCase().trim() === columnName.toLowerCase());
    if (index === -1) {
      console.warn(`Column "${columnName}" not found. Available columns:`, headers);
    }
    return index;
  };

  const reqIdIndex = getColumnIndex('RequestID');
  const technicianIndex = getColumnIndex('Technician');
  const categoryIndex = getColumnIndex('Category') !== -1 ? getColumnIndex('Category') : getColumnIndex('Service Category');
  const subCategoryIndex = getColumnIndex('Sub Category') !== -1 ? getColumnIndex('Sub Category') : getColumnIndex('Service Sub Category');
  const statusIndex = getColumnIndex('Request Status');
  const createdTimeIndex = getColumnIndex('Created Time');
  const assignedTimeIndex = getColumnIndex('Assigned Time');
  const completedTimeIndex = getColumnIndex('Completed Time');
  const resolvedTimeIndex = getColumnIndex('Resolved Time');

  const requiredColumns = [reqIdIndex, technicianIndex, statusIndex, createdTimeIndex];
  if (requiredColumns.some(index => index === -1)) {
    throw new Error('Required columns missing: RequestID, Technician, Request Status, Created Time');
  }

  const tickets: TicketData[] = [];
  const invalidRows: InvalidRow[] = [];
  
  for (const row of dataRows) {
    try {
      const reqId = row[reqIdIndex]?.trim();
      const technician = row[technicianIndex]?.trim();
      const status = row[statusIndex]?.trim();
      const createdTimeStr = row[createdTimeIndex]?.trim();

      if (!reqId || !technician || !status || !createdTimeStr) {
        invalidRows.push({
          rowData: row,
          reason: 'Missing required fields (RequestID, Technician, Status, or Created Time)'
        });
        continue;
      }

      // Parse dates
      const createdTime = parseDate(createdTimeStr);
      if (!createdTime) {
        invalidRows.push({
          rowData: row,
          reason: `Invalid created time format: ${createdTimeStr}`
        });
        continue;
      }

      const assignedTime = assignedTimeIndex !== -1 ? parseDate(row[assignedTimeIndex]) : null;
      const completedTime = completedTimeIndex !== -1 ? parseDate(row[completedTimeIndex]) : null;
      const resolvedTime = resolvedTimeIndex !== -1 ? parseDate(row[resolvedTimeIndex]) : null;

      const category = categoryIndex !== -1 ? row[categoryIndex]?.trim() || 'Unknown' : 'Unknown';
      const subCategory = subCategoryIndex !== -1 ? row[subCategoryIndex]?.trim() || 'Unknown' : 'Unknown';

      // Determine if ticket is resolved/completed
      const isResolved = status.toLowerCase().includes('resolved') || status.toLowerCase().includes('closed');
      const isCompleted = status.toLowerCase().includes('completed') || isResolved;

      // Calculate metrics
      const mtta = assignedTime ? differenceInMinutes(assignedTime, createdTime) : 0;
      const endTime = resolvedTime || completedTime;
      const mtti = endTime ? differenceInHours(endTime, createdTime) : 0;
      const mttr = isResolved && resolvedTime ? differenceInHours(resolvedTime, createdTime) : 0;

      // First Time Resolution: if resolved without being reopened (simplified logic)
      const isFirstTimeResolution = isResolved && !status.toLowerCase().includes('reopened');

      // SLA compliance: resolved within 24 hours (configurable)
      const meetsSLA = isResolved ? mtti <= 24 : false;

      // Open duration for open tickets
      const openDurationHours = !isCompleted ? differenceInHours(new Date(), createdTime) : 0;

      tickets.push({
        reqId,
        technician,
        category,
        subCategory,
        status,
        createdTime,
        assignedTime,
        completedTime,
        resolvedTime,
        isResolved,
        isCompleted,
        mtta,
        mtti,
        mttr,
        isFirstTimeResolution,
        meetsSLA,
        openDurationHours,
        rowData: row
      });

    } catch (error) {
      invalidRows.push({
        rowData: row,
        reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  // Apply filters
  let filteredTickets = tickets;
  if (filters) {
    if (filters.technician) {
      filteredTickets = filteredTickets.filter(t => t.technician === filters.technician);
    }
    if (filters.category) {
      filteredTickets = filteredTickets.filter(t => t.category === filters.category);
    }
    if (filters.month) {
      filteredTickets = filteredTickets.filter(t => 
        format(t.createdTime, 'yyyy-MM') === filters.month
      );
    }
  }

  // Calculate KPIs
  const kpis = calculateKPIs(filteredTickets);
  
  // Generate monthly data
  const monthlyData = generateMonthlyData(filteredTickets);
  
  // Generate breakdowns
  const breakdowns = generateBreakdowns(filteredTickets);
  
  // Get open tickets
  const openTickets = getOpenTickets(filteredTickets);
  
  // Get unique values for filters
  const allTechnicians = [...new Set(tickets.map(t => t.technician))].sort();
  const allCategories = [...new Set(tickets.map(t => t.category))].sort();
  const allMonths = [...new Set(tickets.map(t => format(t.createdTime, 'yyyy-MM')))].sort();

  return {
    kpis,
    monthlyData,
    breakdowns,
    invalidRows,
    headers,
    allRows: csvData,
    allTechnicians,
    allCategories,
    allMonths,
    openTickets
  };
}

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  // Try various date formats
  const formats = [
    // ISO formats
    () => parseISO(dateStr),
    // Common formats
    () => new Date(dateStr),
    // DD/MM/YYYY HH:mm format
    () => {
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (match) {
        const [, day, month, year, hour, minute] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      }
      return null;
    },
    // MM/DD/YYYY HH:mm format
    () => {
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (match) {
        const [, month, day, year, hour, minute] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      }
      return null;
    }
  ];

  for (const parseAttempt of formats) {
    try {
      const date = parseAttempt();
      if (date && isValid(date)) {
        return date;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function calculateKPIs(tickets: TicketData[]): KpiMetrics {
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.isCompleted);
  const resolvedTickets = tickets.filter(t => t.isResolved);
  
  // MTTA (Mean Time to Acknowledge) - average minutes to assign
  const ticketsWithAssignment = tickets.filter(t => t.assignedTime);
  const mtta = ticketsWithAssignment.length > 0 
    ? ticketsWithAssignment.reduce((sum, t) => sum + t.mtta, 0) / ticketsWithAssignment.length / 60 // Convert to hours
    : 0;

  // MTTI (Mean Time to Complete) - average hours from creation to completion
  const mtti = completedTickets.length > 0
    ? completedTickets.reduce((sum, t) => sum + t.mtti, 0) / completedTickets.length
    : 0;

  // MTTR (Mean Time to Resolve) - average hours from creation to resolution
  const mttr = resolvedTickets.length > 0
    ? resolvedTickets.filter(t => t.mttr > 0).reduce((sum, t) => sum + t.mttr, 0) / resolvedTickets.length
    : 0;

  // FTR (First Time Resolution) - percentage resolved on first attempt
  const ftr = resolvedTickets.length > 0
    ? (resolvedTickets.filter(t => t.isFirstTimeResolution).length / resolvedTickets.length) * 100
    : 0;

  // SLA (Service Level Agreement) - percentage meeting SLA
  const sla = completedTickets.length > 0
    ? (completedTickets.filter(t => t.meetsSLA).length / completedTickets.length) * 100
    : 0;

  // Backlog - number of open tickets
  const backlog = tickets.filter(t => !t.isCompleted).length;

  return {
    mtta: Number(mtta.toFixed(2)),
    mtti: Number(mtti.toFixed(2)),
    mttr: Number(mttr.toFixed(2)),
    ftr: Number(ftr.toFixed(1)),
    sla: Number(sla.toFixed(1)),
    totalTickets,
    backlog
  };
}

function generateMonthlyData(tickets: TicketData[]): MonthlyData[] {
  const monthlyMap = new Map<string, { mttr: number[]; mtti: number[]; volume: number }>();

  for (const ticket of tickets) {
    const month = format(ticket.createdTime, 'yyyy-MM');
    
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { mttr: [], mtti: [], volume: 0 });
    }
    
    const monthData = monthlyMap.get(month)!;
    monthData.volume++;
    
    if (ticket.isCompleted) {
      monthData.mtti.push(ticket.mtti);
    }
    if (ticket.isResolved && ticket.mttr > 0) {
      monthData.mttr.push(ticket.mttr);
    }
  }

  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month: format(parseISO(month + '-01'), 'MMM yyyy'),
      mttr: data.mttr.length > 0 ? data.mttr.reduce((a, b) => a + b, 0) / data.mttr.length : 0,
      mtti: data.mtti.length > 0 ? data.mtti.reduce((a, b) => a + b, 0) / data.mtti.length : 0,
      volume: data.volume
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function generateBreakdowns(tickets: TicketData[]): BreakdownData {
  const technicianCount = new Map<string, number>();
  const categoryCount = new Map<string, number>();
  const subCategoryCount = new Map<string, number>();

  for (const ticket of tickets) {
    technicianCount.set(ticket.technician, (technicianCount.get(ticket.technician) || 0) + 1);
    categoryCount.set(ticket.category, (categoryCount.get(ticket.category) || 0) + 1);
    subCategoryCount.set(ticket.subCategory, (subCategoryCount.get(ticket.subCategory) || 0) + 1);
  }

  const sortBreakdown = (map: Map<string, number>): BreakdownItem[] =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  return {
    technician: sortBreakdown(technicianCount),
    category: sortBreakdown(categoryCount),
    subCategory: sortBreakdown(subCategoryCount)
  };
}

function getOpenTickets(tickets: TicketData[]): OpenTicket[] {
  return tickets
    .filter(t => !t.isCompleted)
    .map(t => ({
      reqId: t.reqId,
      technician: t.technician,
      category: t.category,
      createdTime: t.createdTime.toISOString(),
      openDurationHours: t.openDurationHours,
      rowData: t.rowData
    }))
    .sort((a, b) => b.openDurationHours - a.openDurationHours);
}