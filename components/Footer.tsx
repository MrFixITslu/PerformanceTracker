import React from 'react';
import type { DashboardData } from '../types';

interface FooterProps {
  dashboardData: DashboardData;
}

export const Footer: React.FC<FooterProps> = ({ dashboardData }) => {
  const currentTime = new Date().toLocaleString();
  
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Data Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Data Summary</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Total Records: {dashboardData.kpis.totalTickets}</li>
              <li>Valid Records: {dashboardData.kpis.totalTickets - dashboardData.invalidRows.length}</li>
              <li>Invalid Records: {dashboardData.invalidRows.length}</li>
              <li>Data Sources: {dashboardData.headers.length > 0 ? '1' : '0'} CSV file(s)</li>
            </ul>
          </div>

          {/* Performance Indicators */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Metrics</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Active Technicians: {dashboardData.allTechnicians.length}</li>
              <li>Categories: {dashboardData.allCategories.length}</li>
              <li>Time Periods: {dashboardData.allMonths.length}</li>
              <li>Open Tickets: {dashboardData.kpis.backlog}</li>
            </ul>
          </div>

          {/* Generation Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Report Information</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Generated: {currentTime}</li>
              <li>Dashboard Version: 2.0</li>
              <li>Data Processing: Real-time</li>
              <li>
                Status: 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  dashboardData.invalidRows.length === 0 
                    ? 'bg-green-600' 
                    : 'bg-yellow-600'
                }`}>
                  {dashboardData.invalidRows.length === 0 ? 'All Data Valid' : 'Some Invalid Rows'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Invalid Rows Warning */}
        {dashboardData.invalidRows.length > 0 && (
          <div className="mt-8 p-4 bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg">
            <h4 className="text-yellow-300 font-semibold mb-2">
              ⚠️ Data Quality Notice
            </h4>
            <p className="text-yellow-200 text-sm mb-2">
              {dashboardData.invalidRows.length} row(s) were excluded from calculations due to missing or invalid data.
            </p>
            <details className="text-xs text-yellow-200">
              <summary className="cursor-pointer hover:text-yellow-100">
                View invalid rows (click to expand)
              </summary>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {dashboardData.invalidRows.slice(0, 10).map((row, index) => (
                  <div key={index} className="py-1 border-b border-yellow-800">
                    <span className="font-mono">Row {index + 1}:</span> {row.reason}
                  </div>
                ))}
                {dashboardData.invalidRows.length > 10 && (
                  <div className="py-1 text-yellow-300">
                    ... and {dashboardData.invalidRows.length - 10} more
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            © 2024 ICT Performance Dashboard. Built with React, TypeScript & Chart.js
          </div>
          <div className="text-sm text-gray-400 mt-2 sm:mt-0">
            For support or questions, contact your IT administrator
          </div>
        </div>
      </div>
    </footer>
  );
};