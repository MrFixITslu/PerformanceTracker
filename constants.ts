export const PERFORMANCE_THRESHOLDS = {
  MTTA_HOURS: 0.5,     // Poor if > 30 minutes to acknowledge
  MTTI_HOURS: 10,      // Poor if > 10 hours to complete (ICT)
  MTTR_HOURS: 8,       // Poor if > 8 hours to resolve
  FTR_PERCENT: 80,     // Poor if < 80% first-time resolution
  SLA_PERCENT: 90,     // Poor if < 90% SLA compliance
  
  // D+ specific thresholds
  DPLUS_INSTALLATION_HOURS: 48,  // Installation SLA
  DPLUS_FAULT_HOURS: 24,         // Fault repair SLA
  
  // Aging thresholds for open tickets
  AGING_WARNING_HOURS: 48,       // Yellow warning
  AGING_CRITICAL_HOURS: 72,      // Red critical
};

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  success: '#059669',
  gray: '#6B7280',
};

export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  month: 'MMM yyyy',
  iso: 'yyyy-MM-dd',
  datetime: 'MMM dd, yyyy HH:mm',
};

export const KPI_DESCRIPTIONS = {
  MTTA: 'Mean Time to Acknowledge - Average time from ticket creation to assignment',
  MTTI: 'Mean Time to Complete - Average time from creation to completion',
  MTTR: 'Mean Time to Resolve - Average time from creation to resolution',
  FTR: 'First Time Resolution - Percentage of tickets resolved on first attempt',
  SLA: 'Service Level Agreement - Percentage of tickets meeting SLA requirements',
  BACKLOG: 'Number of currently open tickets requiring attention',
};