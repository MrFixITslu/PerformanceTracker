export type RowData = string[];

export interface KpiMetrics {
  mtta: number;
  mtti: number;
  mttr: number;
  ftr: number;
  sla: number;
  totalTickets: number;
  backlog: number;
}

export interface DplusKpiMetrics {
  overallMtti: { value: number; count: number };
  standaloneBbMtti: { value: number; count: number };
  overallMttr: { value: number; count: number };
}

export interface MonthlyData {
  month: string;
  mttr: number;
  mtti: number;
  volume: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
}

export interface BreakdownData {
  technician: BreakdownItem[];
  category: BreakdownItem[];
  subCategory: BreakdownItem[];
}

export interface InvalidRow {
  rowData: RowData;
  reason: string;
}

export interface OpenTicket {
  reqId: string;
  technician: string;
  category: string;
  createdTime: string;
  openDurationHours: number;
  rowData: RowData;
}

export interface DplusOpenTickets {
  installations: OpenTicket[];
  faults: OpenTicket[];
}

export interface DashboardData {
  kpis: KpiMetrics;
  dplusKpis?: DplusKpiMetrics;
  monthlyData: MonthlyData[];
  breakdowns: BreakdownData;
  invalidRows: InvalidRow[];
  headers: string[];
  allRows: RowData[];
  allTechnicians: string[];
  allCategories: string[];
  allMonths: string[];
  openTickets: OpenTicket[];
  dplusOpenTickets?: DplusOpenTickets;
}