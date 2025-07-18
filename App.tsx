
import React, { useState, useCallback, useMemo } from 'react';
import type { ParseResult } from 'papaparse';
import { processCsvData } from './services/csvProcessor';
import { processDplusData } from './services/dplusCsvProcessor';
import type { DashboardData, RowData } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Define a type for the tab names
type DashboardTab = 'ICT' | 'D+';

// Define the shape of state for a single dashboard
interface DashboardState {
  dashboardData: DashboardData | null;
  rawCsvData: RowData[] | null;
  filters: { technician: string; category: string; month: string };
  isLoading: boolean;
  error: string | null;
  fileName: string;
}

// Define the initial state for a dashboard
const initialDashboardState: DashboardState = {
  dashboardData: null,
  rawCsvData: null,
  filters: { technician: 'All', category: 'All', month: 'All' },
  isLoading: false,
  error: null,
  fileName: '',
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('D+');
  
  // Create separate state slices for each dashboard
  const [ictState, setIctState] = useState<DashboardState>(initialDashboardState);
  const [dplusState, setDplusState] = useState<DashboardState>(initialDashboardState);

  // Use memoization to avoid re-calculating on every render
  const { activeState, setActiveState } = useMemo(() => ({
    activeState: activeTab === 'ICT' ? ictState : dplusState,
    setActiveState: activeTab === 'ICT' ? setIctState : setDplusState,
  }), [activeTab, ictState, dplusState]);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (!files || files.length === 0) return;

    setActiveState({
      ...initialDashboardState,
      isLoading: true,
      fileName: files.map(f => f.name).join(', '),
    });

    const parsePromises = files.map(file => {
      return new Promise<ParseResult<RowData>>((resolve, reject) => {
        (window as any).Papa.parse(file, {
          complete: (results: ParseResult<RowData>) => resolve(results),
          error: (err: Error) => reject(new Error(`Failed to parse ${file.name}: ${err.message}`)),
        });
      });
    });

    Promise.all(parsePromises)
      .then(resultsArray => {
        if (resultsArray.length === 0 || resultsArray.every(r => r.data.length === 0)) {
          throw new Error("No data found in the selected files.");
        }

        const firstResultWithData = resultsArray.find(r => r.data.length > 0);
        if (!firstResultWithData) {
          throw new Error("No data found in any of the selected files.");
        }

        const firstFileData = firstResultWithData.data;

        // Determine which headers to look for based on the active tab
        const KEY_HEADERS_TO_FIND = activeTab === 'ICT'
          ? ["Technician", "RequestID", "Request Status", "Assigned Time"]
          : ["Engineers", "JobNumber", "JobStatusFull", "DepartmentName"];
        
        let headerRowIndex = -1;
        for (let i = 0; i < firstFileData.length && i < 15; i++) {
          const rowAsHeaders = firstFileData[i].map(h => (h || '').trim().toLowerCase());
          const foundAllKeys = KEY_HEADERS_TO_FIND.every(key => rowAsHeaders.includes(key.toLowerCase()));
          if (foundAllKeys) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("Could not find a valid data header row. Please ensure files have consistent columns.");
        }

        const combinedHeaders = firstFileData[headerRowIndex];
        
        const allDataRows = resultsArray.flatMap(result =>
          result.data.length > headerRowIndex ? result.data.slice(headerRowIndex + 1) : []
        );
        
        const combinedRawCsvData = [combinedHeaders, ...allDataRows];

        const processor = activeTab === 'ICT' ? processCsvData : processDplusData;
        const data = processor(combinedRawCsvData);
        
        if (data.kpis.totalTickets === 0 && data.openTickets.length === 0) {
          setActiveState(prevState => ({
            ...prevState,
            error: "No valid tickets found in the files to process. Please check the data.",
            isLoading: false,
          }));
        } else {
          setActiveState(prevState => ({
            ...prevState,
            rawCsvData: combinedRawCsvData,
            dashboardData: data,
            isLoading: false,
          }));
        }
      })
      .catch(err => {
        setActiveState(prevState => ({
          ...prevState,
          error: `Error processing files: ${err.message}`,
          isLoading: false,
        }));
        console.error(err);
      });
  }, [activeTab, setActiveState]);
  
  const handleFilterChange = (type: 'technician' | 'category' | 'month', value: string) => {
    if (!activeState.rawCsvData) return;

    const newFilters = { ...activeState.filters, [type]: value };
    
    const effectiveFilters: { technician?: string; category?: string; month?: string } = {};
    if (newFilters.technician !== 'All') effectiveFilters.technician = newFilters.technician;
    if (newFilters.category !== 'All') effectiveFilters.category = newFilters.category;
    if (newFilters.month !== 'All') effectiveFilters.month = newFilters.month;
    
    const processor = activeTab === 'ICT' ? processCsvData : processDplusData;
    const data = processor(activeState.rawCsvData, Object.keys(effectiveFilters).length > 0 ? effectiveFilters : undefined);

    setActiveState(prevState => ({
      ...prevState,
      filters: newFilters,
      dashboardData: data,
    }));
  };

  const handleReset = () => {
    setActiveState(initialDashboardState);
  };
  
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
  };

  const labels = useMemo(() => ({
      technician: activeTab === 'ICT' ? 'Technician' : 'Engineers',
      category: activeTab === 'ICT' ? 'Category' : 'Department',
  }), [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header 
        onReset={handleReset} 
        hasData={!!activeState.dashboardData}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <FileUpload onFilesSelected={handleFilesSelected} disabled={activeState.isLoading} />
          {activeState.fileName && <p className="text-center text-slate-500 mt-2 text-sm max-w-2xl mx-auto truncate" title={activeState.fileName}>Files: {activeState.fileName}</p>}
          
          {activeState.isLoading && (
            <div className="text-center my-10">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-lg font-semibold text-slate-700">Processing data...</p>
            </div>
          )}

          {activeState.error && (
            <div className="text-center my-10 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-bold">An Error Occurred</p>
              <p>{activeState.error}</p>
            </div>
          )}
          
          {!activeState.isLoading && !activeState.error && activeState.dashboardData ? (
             <Dashboard 
                data={activeState.dashboardData} 
                filters={activeState.filters}
                onFilterChange={handleFilterChange}
                technicianLabel={labels.technician}
                categoryLabel={labels.category}
             />
          ) : (
            !activeState.isLoading && !activeState.error && <WelcomeScreen activeTab={activeTab} />
          )}
        </div>
      </main>
      {activeState.dashboardData && <Footer dashboardData={activeState.dashboardData} />}
    </div>
  );
};

export default App;
