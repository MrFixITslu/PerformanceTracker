import React from 'react';

interface WelcomeScreenProps {
  activeTab: 'ICT' | 'D+';
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ activeTab }) => {
  const features = [
    {
      title: 'KPI Monitoring',
      description: 'Track MTTA, MTTI, MTTR, FTR, and SLA metrics with visual indicators',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Interactive Charts',
      description: 'Visualize trends and breakdowns with Chart.js powered graphs',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Real-time Filtering',
      description: 'Filter data by technician, category, and time period',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
        </svg>
      ),
    },
    {
      title: 'Open Ticket Tracking',
      description: 'Monitor backlog and identify aging tickets with priority indicators',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Export Reports',
      description: 'Generate PDF reports and export dashboard screenshots',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Performance Insights',
      description: 'Get actionable insights with threshold-based performance indicators',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  const expectedColumns = activeTab === 'ICT' 
    ? [
        'RequestID', 'Technician', 'Request Status', 'Created Time',
        'Assigned Time', 'Completed Time', 'Resolved Time',
        'Category', 'Sub Category'
      ]
    : [
        'JobNumber', 'Engineers', 'DepartmentName', 'JobStatusFull',
        'JobType', 'CreatedDate', 'AppointmentDate', 'CompletedDate'
      ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to {activeTab} Performance Dashboard
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your CSV data to generate comprehensive performance analytics with interactive visualizations, 
          KPI monitoring, and actionable insights for your {activeTab === 'ICT' ? 'IT support' : 'installation and maintenance'} team.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Data Requirements */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Expected CSV Format for {activeTab} Data
        </h3>
        <p className="text-gray-600 mb-4">
          Your CSV file should contain the following columns (case-insensitive):
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {expectedColumns.map((column, index) => (
            <div key={index} className="bg-white px-3 py-2 rounded border text-sm font-mono">
              {column}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for best results:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure date formats are consistent (e.g., MM/DD/YYYY or DD/MM/YYYY)</li>
            <li>• Include all required columns for accurate KPI calculations</li>
            <li>• Multiple CSV files can be uploaded and will be combined automatically</li>
            <li>• Invalid rows will be reported and excluded from calculations</li>
          </ul>
        </div>
      </div>

      {/* KPI Definitions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">MTTA - Mean Time to Acknowledge</h4>
            <p className="text-sm text-gray-600 mb-3">
              Average time from ticket creation to assignment. Lower is better.
            </p>
            
            <h4 className="font-semibold text-gray-900 mb-2">MTTI - Mean Time to Complete</h4>
            <p className="text-sm text-gray-600 mb-3">
              Average time from creation to completion. Lower is better.
            </p>
            
            <h4 className="font-semibold text-gray-900 mb-2">MTTR - Mean Time to Resolve</h4>
            <p className="text-sm text-gray-600">
              Average time from creation to resolution. Lower is better.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">FTR - First Time Resolution</h4>
            <p className="text-sm text-gray-600 mb-3">
              Percentage of tickets resolved on first attempt. Higher is better.
            </p>
            
            <h4 className="font-semibold text-gray-900 mb-2">SLA - Service Level Agreement</h4>
            <p className="text-sm text-gray-600 mb-3">
              Percentage of tickets meeting SLA requirements. Higher is better.
            </p>
            
            <h4 className="font-semibold text-gray-900 mb-2">Backlog</h4>
            <p className="text-sm text-gray-600">
              Number of currently open tickets requiring attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};