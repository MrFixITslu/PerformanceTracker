import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${disabled 
              ? 'bg-gray-200' 
              : isDragOver 
                ? 'bg-blue-100' 
                : 'bg-blue-50'
            }
          `}>
            <svg 
              className={`w-8 h-8 ${disabled ? 'text-gray-400' : isDragOver ? 'text-blue-600' : 'text-blue-500'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
              {isDragOver ? 'Drop your CSV files here' : 'Upload CSV Files'}
            </h3>
            <p className={`text-sm mt-1 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {disabled 
                ? 'Processing files...' 
                : 'Drag and drop your CSV files here, or click to browse'
              }
            </p>
          </div>
          
          {!disabled && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported formats: CSV files (.csv)</p>
              <p>Multiple files can be uploaded at once</p>
            </div>
          )}
        </div>
        
        {/* Visual indicator for drag state */}
        {isDragOver && !disabled && (
          <div className="absolute inset-0 border-2 border-blue-400 rounded-lg bg-blue-50 bg-opacity-50 flex items-center justify-center">
            <div className="text-blue-600 font-medium">
              Drop files to upload
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Expected columns for ICT: RequestID, Technician, Request Status, Created Time, etc.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Expected columns for D+: JobNumber, Engineers, DepartmentName, JobStatusFull, etc.
        </p>
      </div>
    </div>
  );
};