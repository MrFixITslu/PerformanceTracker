import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { DashboardData } from '../types';
import { PERFORMANCE_THRESHOLDS } from '../constants';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardProps {
  data: DashboardData;
  filters: { technician: string; category: string; month: string };
  onFilterChange: (type: 'technician' | 'category' | 'month', value: string) => void;
  technicianLabel: string;
  categoryLabel: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  filters,
  onFilterChange,
  technicianLabel,
  categoryLabel,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'breakdowns' | 'open-tickets'>('overview');
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);

  // Chart color scheme
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#8B5CF6',
    success: '#059669',
  };

  const kpiCards = useMemo(() => [
    {
      key: 'mtta',
      title: 'MTTA',
      subtitle: 'Mean Time to Acknowledge',
      value: data.kpis.mtta,
      unit: 'hours',
      threshold: PERFORMANCE_THRESHOLDS.MTTA_HOURS,
      format: (val: number) => `${val.toFixed(2)}h`,
      description: 'Average time from ticket creation to assignment',
      isLowerBetter: true,
    },
    {
      key: 'mtti',
      title: 'MTTI',
      subtitle: 'Mean Time to Complete',
      value: data.kpis.mtti,
      unit: 'hours',
      threshold: PERFORMANCE_THRESHOLDS.MTTI_HOURS,
      format: (val: number) => `${val.toFixed(2)}h`,
      description: 'Average time from creation to completion',
      isLowerBetter: true,
    },
    {
      key: 'mttr',
      title: 'MTTR',
      subtitle: 'Mean Time to Resolve',
      value: data.kpis.mttr,
      unit: 'hours',
      threshold: PERFORMANCE_THRESHOLDS.MTTR_HOURS,
      format: (val: number) => `${val.toFixed(2)}h`,
      description: 'Average time from creation to resolution',
      isLowerBetter: true,
    },
    {
      key: 'ftr',
      title: 'FTR',
      subtitle: 'First Time Resolution',
      value: data.kpis.ftr,
      unit: '%',
      threshold: PERFORMANCE_THRESHOLDS.FTR_PERCENT,
      format: (val: number) => `${val.toFixed(1)}%`,
      description: 'Percentage of tickets resolved on first attempt',
      isLowerBetter: false,
    },
    {
      key: 'sla',
      title: 'SLA',
      subtitle: 'Service Level Agreement',
      value: data.kpis.sla,
      unit: '%',
      threshold: PERFORMANCE_THRESHOLDS.SLA_PERCENT,
      format: (val: number) => `${val.toFixed(1)}%`,
      description: 'Percentage of tickets meeting SLA',
      isLowerBetter: false,
    },
    {
      key: 'backlog',
      title: 'Backlog',
      subtitle: 'Open Tickets',
      value: data.kpis.backlog,
      unit: 'tickets',
      threshold: null,
      format: (val: number) => val.toString(),
      description: 'Number of currently open tickets',
      isLowerBetter: true,
    },
  ], [data.kpis]);

  const getKpiStatus = (kpi: typeof kpiCards[0]) => {
    if (!kpi.threshold) return 'neutral';
    
    if (kpi.isLowerBetter) {
      return kpi.value <= kpi.threshold ? 'good' : 'poor';
    } else {
      return kpi.value >= kpi.threshold ? 'good' : 'poor';
    }
  };

  const trendChartData = useMemo(() => ({
    labels: data.monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'MTTI (hours)',
        data: data.monthlyData.map(d => d.mtti),
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'MTTR (hours)',
        data: data.monthlyData.map(d => d.mttr),
        borderColor: colors.secondary,
        backgroundColor: colors.secondary + '20',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Volume',
        data: data.monthlyData.map(d => d.volume),
        borderColor: colors.warning,
        backgroundColor: colors.warning + '20',
        tension: 0.1,
        type: 'bar' as const,
        yAxisID: 'y1',
      },
    ],
  }), [data.monthlyData]);

  const technicianChartData = useMemo(() => ({
    labels: data.breakdowns.technician.slice(0, 10).map(t => t.name),
    datasets: [{
      label: 'Tickets',
      data: data.breakdowns.technician.slice(0, 10).map(t => t.count),
      backgroundColor: [
        colors.primary,
        colors.secondary,
        colors.warning,
        colors.danger,
        colors.info,
        colors.success,
        colors.primary + '80',
        colors.secondary + '80',
        colors.warning + '80',
        colors.danger + '80',
      ],
    }],
  }), [data.breakdowns.technician]);

  const categoryChartData = useMemo(() => ({
    labels: data.breakdowns.category.slice(0, 8).map(c => c.name),
    datasets: [{
      label: 'Tickets',
      data: data.breakdowns.category.slice(0, 8).map(c => c.count),
      backgroundColor: Object.values(colors).slice(0, 8),
    }],
  }), [data.breakdowns.category]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Hours',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Volume',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.y} tickets`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tickets',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const percentage = ((context.parsed / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {technicianLabel}
            </label>
            <select
              value={filters.technician}
              onChange={(e) => onFilterChange('technician', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All {technicianLabel}s</option>
              {data.allTechnicians.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {categoryLabel}
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All {categoryLabel}s</option>
              {data.allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => onFilterChange('month', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Months</option>
              {data.allMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'trends', label: 'Trends' },
              { key: 'breakdowns', label: 'Breakdowns' },
              { key: 'open-tickets', label: 'Open Tickets' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiCards.map(kpi => {
                  const status = getKpiStatus(kpi);
                  const isExpanded = expandedKpi === kpi.key;
                  
                  return (
                    <div
                      key={kpi.key}
                      className={`p-6 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                        status === 'poor' 
                          ? 'bg-red-50 border-red-200' 
                          : status === 'good'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setExpandedKpi(isExpanded ? null : kpi.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{kpi.title}</h3>
                          <p className="text-sm text-gray-600">{kpi.subtitle}</p>
                        </div>
                        <div className={`text-2xl font-bold ${
                          status === 'poor' ? 'text-red-600' : 
                          status === 'good' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {kpi.format(kpi.value)}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">{kpi.description}</p>
                          {kpi.threshold && (
                            <p className="text-xs text-gray-500">
                              Threshold: {kpi.isLowerBetter ? '≤' : '≥'} {kpi.format(kpi.threshold)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.kpis.totalTickets}</div>
                    <div className="text-sm text-gray-600">Total Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.kpis.totalTickets - data.kpis.backlog}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{data.kpis.backlog}</div>
                    <div className="text-sm text-gray-600">Open</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {data.allTechnicians.length}
                    </div>
                    <div className="text-sm text-gray-600">{technicianLabel}s</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                <div className="h-96">
                  <Line data={trendChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'breakdowns' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{technicianLabel} Distribution</h3>
                  <div className="h-80">
                    <Bar data={technicianChartData} options={barChartOptions} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{categoryLabel} Distribution</h3>
                  <div className="h-80">
                    <Doughnut data={categoryChartData} options={doughnutOptions} />
                  </div>
                </div>
              </div>
              
              {/* Top performers */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">By Volume</h4>
                    <div className="space-y-2">
                      {data.breakdowns.technician.slice(0, 5).map((tech, index) => (
                        <div key={tech.name} className="flex justify-between items-center">
                          <span className="text-sm">{index + 1}. {tech.name}</span>
                          <span className="text-sm font-medium">{tech.count} tickets</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Categories</h4>
                    <div className="space-y-2">
                      {data.breakdowns.category.slice(0, 5).map((cat, index) => (
                        <div key={cat.name} className="flex justify-between items-center">
                          <span className="text-sm">{index + 1}. {cat.name}</span>
                          <span className="text-sm font-medium">{cat.count} tickets</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'open-tickets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Open Tickets ({data.openTickets.length})</h3>
                <div className="text-sm text-gray-600">
                  Oldest: {data.openTickets.length > 0 ? 
                    Math.max(...data.openTickets.map(t => t.openDurationHours)).toFixed(1) + ' hours' : 
                    'N/A'
                  }
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {technicianLabel}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {categoryLabel}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age (Hours)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.openTickets.slice(0, 50).map((ticket, index) => (
                      <tr key={`${ticket.reqId}-${index}`} className={
                        ticket.openDurationHours > 72 ? 'bg-red-50' :
                        ticket.openDurationHours > 48 ? 'bg-yellow-50' : ''
                      }>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.reqId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.technician}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.createdTime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={`${
                            ticket.openDurationHours > 72 ? 'text-red-600' :
                            ticket.openDurationHours > 48 ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {ticket.openDurationHours.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {data.openTickets.length > 50 && (
                <p className="text-sm text-gray-500 text-center">
                  Showing first 50 of {data.openTickets.length} open tickets
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};