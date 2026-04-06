import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import employeeService from '../../services/employeeService';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

const EmployeeBulkUpdate = ({ onUpdateSuccess, campusId }) => {
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

      const response = await employeeService.bulkUpdate(formData);
      
      setResult(response);
      
      if (response.success === false && response.file) {
        toast.error(`Update completed with errors. Please check the downloaded file.`);
      } else if (response.summary && response.summary.failed > 0) {
        toast.error(`Update completed with ${response.summary.failed} errors.`);
      } else {
        toast.success(response.message || 'Successfully updated employees');
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('employee-file-upload-update');
        if (fileInput) fileInput.value = '';
        
        if (onUpdateSuccess) {
            onUpdateSuccess();
        }
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update employees');
      toast.error(err.message || 'Failed to update employees');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Bulk Employee Update</h2>
      
      <div className="mb-6 bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li><strong>Export</strong> the employees you want to edit from the employee list.</li>
          <li><strong>Edit</strong> the downloaded Excel file. <span className="font-bold">Do not modify the Username column or locked fields.</span></li>
          <li><strong>Upload</strong> the edited file here to apply changes.</li>
        </ol>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
          <input
            id="employee-file-upload-update"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="employee-file-upload-update" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg font-medium text-gray-700">
                {file ? file.name : 'Click to upload edited Excel file'}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                Supported formats: .xlsx, .xls
              </span>
            </div>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
              !file || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Updating...
              </div>
            ) : (
              'Update Employees'
            )}
          </button>
        </div>
      </form>
      
      {result && result.summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Update Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
             <div className="text-green-600 font-semibold">Success: {result.summary.success}</div>
             <div className="text-red-600 font-semibold">Failed: {result.summary.failed}</div>
             <div className="text-gray-600">Total: {result.summary.total}</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EmployeeBulkUpdate;
