import React from 'react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
  activeTab: 'ICT' | 'D+';
  onTabChange: (tab: 'ICT' | 'D+') => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasData, activeTab, onTabChange }) => {
  const handleExport = () => {
    // Export functionality using jsPDF (already included in index.html)
    if (typeof window !== 'undefined' && (window as any).jsPDF) {
      const doc = new (window as any).jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`${activeTab} Team Performance Report`, 20, 30);
      
      // Add generation date
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
      
      // Add basic info
      doc.text('This report contains performance metrics and analytics.', 20, 70);
      doc.text('For detailed charts and interactive features, please use the web dashboard.', 20, 85);
      
      // Save the PDF
      doc.save(`${activeTab}-performance-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      // Fallback: take screenshot of dashboard
      if ((window as any).html2canvas) {
        const dashboardElement = document.querySelector('main');
        if (dashboardElement) {
          (window as any).html2canvas(dashboardElement).then((canvas: HTMLCanvasElement) => {
            const link = document.createElement('a');
            link.download = `${activeTab}-dashboard-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
          });
        }
      }
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                ICT Performance Dashboard
              </h1>
            </div>
            
            {/* Tab Navigation */}
            <nav className="ml-8 flex space-x-4">
              <button
                onClick={() => onTabChange('ICT')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ICT'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                ICT Dashboard
              </button>
              <button
                onClick={() => onTabChange('D+')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'D+'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                D+ Dashboard
              </button>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {hasData && (
              <>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Report
                </button>
                
                <button
                  onClick={onReset}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};