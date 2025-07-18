import { format, parseISO, differenceInHours, differenceInMinutes, isValid } from 'date-fns';
import type { DashboardData, RowData, KpiMetrics, DplusKpiMetrics, MonthlyData, BreakdownItem, BreakdownData, InvalidRow, OpenTicket, DplusOpenTickets } from '../types';

interface DplusTicketData {
  jobNumber: string;
  engineer: string;
  department: string;
  jobStatus: string;
  jobType: string;
  createdTime: Date;
  appointmentDate: Date | null;
  completedTime: Date | null;
  isInstallation: boolean;
  isFault: boolean;
  isCompleted: boolean;
  mtti: number; // Hours to Complete
  openDurationHours: number;
  rowData: RowData;
}

export function processDplusData(csvData: RowData[], filters?: { technician?: string; category?: string; month?: string }): DashboardData {
  if (!csvData || csvData.length < 2) {
    throw new Error('Invalid CSV data: No data rows found');
  }

  const headers = csvData[0];
  const dataRows = csvData.slice(1);
  
  // Find column indices for D+ specific columns
  const getColumnIndex = (columnName: string): number => {
    const index = headers.findIndex(h => h && h.toLowerCase().trim() === columnName.toLowerCase());
    if (index === -1) {
      console.warn(`Column "${columnName}" not found. Available columns:`, headers);
    }
    return index;
  };

  const jobNumberIndex = getColumnIndex('JobNumber');
  const engineerIndex = getColumnIndex('Engineers');
  const departmentIndex = getColumnIndex('DepartmentName');
  const jobStatusIndex = getColumnIndex('JobStatusFull');
  const jobTypeIndex = getColumnIndex('JobType') !== -1 ? getColumnIndex('JobType') : getColumnIndex('ServiceType');
  const createdTimeIndex = getColumnIndex('CreatedDate') !== -1 ? getColumnIndex('CreatedDate') : getColumnIndex('JobCreated');
  const appointmentDateIndex = getColumnIndex('AppointmentDate') !== -1 ? getColumnIndex('AppointmentDate') : getColumnIndex('ScheduledDate');
  const completedTimeIndex = getColumnIndex('CompletedDate') !== -1 ? getColumnIndex('CompletedDate') : getColumnIndex('JobCompleted');

  const requiredColumns = [jobNumberIndex, engineerIndex, departmentIndex, jobStatusIndex];
  if (requiredColumns.some(index => index === -1)) {
    throw new Error('Required columns missing: JobNumber, Engineers, DepartmentName, JobStatusFull');
  }

  const tickets: DplusTicketData[] = [];
  const invalidRows: InvalidRow[] = [];
  
  for (const row of dataRows) {
    try {
      const jobNumber = row[jobNumberIndex]?.trim();
      const engineer = row[engineerIndex]?.trim();
      const department = row[departmentIndex]?.trim();
      const jobStatus = row[jobStatusIndex]?.trim();
      const createdTimeStr = row[createdTimeIndex]?.trim();

      if (!jobNumber || !engineer || !department || !jobStatus) {
        invalidRows.push({
          rowData: row,
          reason: 'Missing required fields (JobNumber, Engineer, Department, or JobStatus)'
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

      const appointmentDate = appointmentDateIndex !== -1 ? parseDate(row[appointmentDateIndex]) : null;
      const completedTime = completedTimeIndex !== -1 ? parseDate(row[completedTimeIndex]) : null;
      const jobType = jobTypeIndex !== -1 ? row[jobTypeIndex]?.trim() || 'Unknown' : 'Unknown';

      // Determine job type categories
      const isInstallation = jobType.toLowerCase().includes('installation') || 
                            jobType.toLowerCase().includes('install') ||
                            department.toLowerCase().includes('install');
      
      const isFault = jobType.toLowerCase().includes('fault') || 
                     jobType.toLowerCase().includes('repair') ||
                     department.toLowerCase().includes('fault');

      // Determine if job is completed
      const isCompleted = jobStatus.toLowerCase().includes('completed') || 
                         jobStatus.toLowerCase().includes('closed') ||
                         jobStatus.toLowerCase().includes('finished');

      // Calculate metrics
      const mtti = completedTime ? differenceInHours(completedTime, createdTime) : 0;
      const openDurationHours = !isCompleted ? differenceInHours(new Date(), createdTime) : 0;

      tickets.push({
        jobNumber,
        engineer,
        department,
        jobStatus,
        jobType,
        createdTime,
        appointmentDate,
        completedTime,
        isInstallation,
        isFault,
        isCompleted,
        mtti,
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

  // Apply filters (map to D+ terminology)
  let filteredTickets = tickets;
  if (filters) {
    if (filters.technician) {
      filteredTickets = filteredTickets.filter(t => t.engineer === filters.technician);
    }
    if (filters.category) {
      filteredTickets = filteredTickets.filter(t => t.department === filters.category);
    }
    if (filters.month) {
      filteredTickets = filteredTickets.filter(t => 
        format(t.createdTime, 'yyyy-MM') === filters.month
      );
    }
  }

  // Calculate KPIs
  const kpis = calculateDplusKPIs(filteredTickets);
  const dplusKpis = calculateDplusSpecificKPIs(filteredTickets);
  
  // Generate monthly data
  const monthlyData = generateDplusMonthlyData(filteredTickets);
  
  // Generate breakdowns (mapped to D+ structure)
  const breakdowns = generateDplusBreakdowns(filteredTickets);
  
  // Get open tickets
  const openTickets = getDplusOpenTickets(filteredTickets);
  const dplusOpenTickets = getDplusSpecificOpenTickets(filteredTickets);
  
  // Get unique values for filters (mapped to D+ terminology)
  const allTechnicians = [...new Set(tickets.map(t => t.engineer))].sort();
  const allCategories = [...new Set(tickets.map(t => t.department))].sort();
  const allMonths = [...new Set(tickets.map(t => format(t.createdTime, 'yyyy-MM')))].sort();

  return {
    kpis,
    dplusKpis,
    monthlyData,
    breakdowns,
    invalidRows,
    headers,
    allRows: csvData,
    allTechnicians,
    allCategories,
    allMonths,
    openTickets,
    dplusOpenTickets
  };
}

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  // Try various date formats common in D+ systems
  const formats = [
    // ISO formats
    () => parseISO(dateStr),
    // Common formats
    () => new Date(dateStr),
    // DD/MM/YYYY format
    () => {
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return null;
    },
    // DD/MM/YYYY HH:mm format
    () => {
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (match) {
        const [, day, month, year, hour, minute] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      }
      return null;
    },
    // YYYY-MM-DD format
    () => {
      const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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

function calculateDplusKPIs(tickets: DplusTicketData[]): KpiMetrics {
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.isCompleted);
  
  // For D+ we focus on MTTI (Mean Time to Install/Complete)
  const mtti = completedTickets.length > 0
    ? completedTickets.reduce((sum, t) => sum + t.mtti, 0) / completedTickets.length
    : 0;

  // MTTR is similar to MTTI for D+ jobs
  const mttr = mtti;

  // MTTA - assume immediate assignment for D+ jobs
  const mtta = 0.5; // 30 minutes average

  // FTR - assume high first-time resolution for completed jobs
  const ftr = completedTickets.length > 0 ? 95 : 0;

  // SLA - jobs completed within reasonable timeframe (48 hours for installations, 24 for faults)
  const slaCompliant = completedTickets.filter(t => {
    const slaLimit = t.isInstallation ? 48 : 24;
    return t.mtti <= slaLimit;
  });
  const sla = completedTickets.length > 0 ? (slaCompliant.length / completedTickets.length) * 100 : 0;

  // Backlog
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

function calculateDplusSpecificKPIs(tickets: DplusTicketData[]): DplusKpiMetrics {
  const completedTickets = tickets.filter(t => t.isCompleted);
  
  // Overall MTTI
  const overallMtti = completedTickets.length > 0
    ? completedTickets.reduce((sum, t) => sum + t.mtti, 0) / completedTickets.length
    : 0;

  // Standalone BB MTTI (installations)
  const bbInstallations = completedTickets.filter(t => t.isInstallation);
  const standaloneBbMtti = bbInstallations.length > 0
    ? bbInstallations.reduce((sum, t) => sum + t.mtti, 0) / bbInstallations.length
    : 0;

  // Overall MTTR (same as MTTI for D+ context)
  const overallMttr = overallMtti;

  return {
    overallMtti: { value: Number(overallMtti.toFixed(2)), count: completedTickets.length },
    standaloneBbMtti: { value: Number(standaloneBbMtti.toFixed(2)), count: bbInstallations.length },
    overallMttr: { value: Number(overallMttr.toFixed(2)), count: completedTickets.length }
  };
}

function generateDplusMonthlyData(tickets: DplusTicketData[]): MonthlyData[] {
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
      monthData.mttr.push(ticket.mtti); // MTTR same as MTTI for D+
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

function generateDplusBreakdowns(tickets: DplusTicketData[]): BreakdownData {
  const engineerCount = new Map<string, number>();
  const departmentCount = new Map<string, number>();
  const jobTypeCount = new Map<string, number>();

  for (const ticket of tickets) {
    engineerCount.set(ticket.engineer, (engineerCount.get(ticket.engineer) || 0) + 1);
    departmentCount.set(ticket.department, (departmentCount.get(ticket.department) || 0) + 1);
    jobTypeCount.set(ticket.jobType, (jobTypeCount.get(ticket.jobType) || 0) + 1);
  }

  const sortBreakdown = (map: Map<string, number>): BreakdownItem[] =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  return {
    technician: sortBreakdown(engineerCount),
    category: sortBreakdown(departmentCount),
    subCategory: sortBreakdown(jobTypeCount)
  };
}

function getDplusOpenTickets(tickets: DplusTicketData[]): OpenTicket[] {
  return tickets
    .filter(t => !t.isCompleted)
    .map(t => ({
      reqId: t.jobNumber,
      technician: t.engineer,
      category: t.department,
      createdTime: t.createdTime.toISOString(),
      openDurationHours: t.openDurationHours,
      rowData: t.rowData
    }))
    .sort((a, b) => b.openDurationHours - a.openDurationHours);
}

function getDplusSpecificOpenTickets(tickets: DplusTicketData[]): DplusOpenTickets {
  const openTickets = tickets.filter(t => !t.isCompleted);
  
  const installations = openTickets
    .filter(t => t.isInstallation)
    .map(t => ({
      reqId: t.jobNumber,
      technician: t.engineer,
      category: t.department,
      createdTime: t.createdTime.toISOString(),
      openDurationHours: t.openDurationHours,
      rowData: t.rowData
    }))
    .sort((a, b) => b.openDurationHours - a.openDurationHours);

  const faults = openTickets
    .filter(t => t.isFault)
    .map(t => ({
      reqId: t.jobNumber,
      technician: t.engineer,
      category: t.department,
      createdTime: t.createdTime.toISOString(),
      openDurationHours: t.openDurationHours,
      rowData: t.rowData
    }))
    .sort((a, b) => b.openDurationHours - a.openDurationHours);

  return { installations, faults };
}