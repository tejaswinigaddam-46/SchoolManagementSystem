import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import employeeService from '../../services/employeeService';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

const EmployeeBulkUpdate = ({ onUpdateSuccess, onCancel, campusId }) => {
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
      
      <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li><strong>Export</strong> the employees you want to edit from the employee list.</li>
          <li><strong>Edit</strong> the downloaded Excel file. <span className="font-bold">Do not modify the Username column or locked fields.</span></li>
          <li><strong>Upload</strong> the edited file here to apply changes.</li>
        </ol>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center">
            <input
              id="employee-file-upload-update"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500">Supported formats: .xlsx, .xls</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              !file || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" color="white" className="mr-2" />
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
