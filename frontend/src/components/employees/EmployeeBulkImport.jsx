import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import employeeService from '../../services/employeeService';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import RequiredAsterisk from '../ui/RequiredAsterisk';

const EmployeeBulkImport = ({ onImportSuccess, onCancel, campusId }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
        setFile(null);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      await employeeService.downloadTemplate();
      toast.success('Template downloaded successfully');
    } catch (err) {
      console.error('Download template error:', err);
      toast.error('Failed to download template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);
      if (campusId) {
        formData.append('campusId', campusId);
      }

      const response = await employeeService.bulkImport(formData);
      
      setResult(response);
      
      if (response.failed > 0) {
        toast.error(`Import completed with ${response.failed} errors. Please check the downloaded file.`);
      } else {
        toast.success(`Successfully imported ${response.success} employees`);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('employee-file-upload');
        if (fileInput) fileInput.value = '';
        
        if (onImportSuccess) {
            onImportSuccess();
        }
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import employees');
      toast.error(err.message || 'Failed to import employees');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Bulk Employee Import</h2>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Download the Excel template using the button below.</li>
          <li>Fill in the employee details in the template. Required fields are marked with <RequiredAsterisk /></li>
          <li>Do not change the column headers.</li>
          <li>Save the file and upload it here.</li>
        </ol>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleDownloadTemplate}
          disabled={isLoading}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Download Template'}
        </button>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center">
            <input
              id="employee-file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500">Supported formats: .xlsx, .xls, .csv</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${
              !file || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" color="white" /> Processing...
              </span>
            ) : (
              'Import from file'
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-lg mb-2">Import Results</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-100 p-3 rounded-md text-center">
              <span className="block text-xs text-gray-500 uppercase">Total</span>
              <span className="text-xl font-bold">{result.total}</span>
            </div>
            <div className="bg-green-100 p-3 rounded-md text-center">
              <span className="block text-xs text-green-600 uppercase">Success</span>
              <span className="text-xl font-bold text-green-700">{result.success}</span>
            </div>
            <div className="bg-red-100 p-3 rounded-md text-center">
              <span className="block text-xs text-red-600 uppercase">Failed</span>
              <span className="text-xl font-bold text-red-700">{result.failed}</span>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
              <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {result.errors.map((err, index) => (
                  <li key={index}>
                    <span className="font-semibold">Row {err.row}:</span> {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default EmployeeBulkImport;
