import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { studentService } from '../../services/studentService';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import RequiredAsterisk from '../ui/RequiredAsterisk';

const StudentBulkImport = ({ onImportSuccess, onCancel, campusId }) => {
  const [file, setFile] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isStartingImport, setIsStartingImport] = useState(false);
  const [isDownloadingResult, setIsDownloadingResult] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const lastJobStatusRef = useRef(null);

  const isPolling = job?.status === 'queued' || job?.status === 'processing';
  const isBusy = isDownloadingTemplate || isStartingImport || isDownloadingResult || isPolling;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
        setJobId(null);
        setJob(null);
      } else {
        setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
        setFile(null);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await studentService.downloadTemplate();
      toast.success('Template downloaded successfully');
    } catch (err) {
      console.error('Download template error:', err);
      toast.error('Failed to download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsStartingImport(true);
      setError(null);
      setResult(null);
      setJobId(null);
      setJob(null);

      const formData = new FormData();
      formData.append('file', file);
      if (campusId) {
        formData.append('campusId', campusId);
      }

      const response = await studentService.startBulkImportAsync(formData);
      if (!response?.success || !response?.jobId) {
        throw new Error(response?.message || 'Failed to start import');
      }

      setJobId(response.jobId);
      toast.success('Import started');
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import students');
      toast.error(err.message || 'Failed to import students');
    } finally {
      setIsStartingImport(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    let isCancelled = false;
    let timer = null;

    const pollOnce = async () => {
      const res = await studentService.getBulkImportJob(jobId);
      if (isCancelled) return;

      const jobData = res?.job || res?.data || res;
      setJob(jobData);

      const progress = jobData?.progress || {};
      const total = progress.total ?? 0;
      const processed = progress.processed ?? 0;
      const success = progress.success ?? 0;
      const failed = progress.failed ?? 0;
      setResult({ total, processed, success, failed });

      const status = jobData?.status;
      if (status && status !== lastJobStatusRef.current) {
        lastJobStatusRef.current = status;

        if (status === 'done') {
          toast.success(`Finished loading ${success} students`);
          setFile(null);
          const fileInput = document.getElementById('file-upload');
          if (fileInput) fileInput.value = '';
          if (onImportSuccess) onImportSuccess();
          if (timer) clearInterval(timer);
        }

        if (status === 'failed') {
          const message = jobData?.message || jobData?.error || 'Import failed';
          setError(message);
          toast.error(message);
          if (timer) clearInterval(timer);
        }
      }
    };

    pollOnce();
    timer = setInterval(() => {
      pollOnce().catch((err) => {
        if (isCancelled) return;
        const message = err?.message || 'Failed to fetch import progress';
        setError(message);
      });
    }, 1000);

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [jobId, onImportSuccess]);

  const handleDownloadResult = async () => {
    if (!jobId) return;
    try {
      setIsDownloadingResult(true);
      await studentService.downloadBulkImportResult(jobId);
      toast.success('Result downloaded');
    } catch (err) {
      console.error('Download result error:', err);
      toast.error(err?.message || 'Failed to download result');
    } finally {
      setIsDownloadingResult(false);
    }
  };

  const progressTotal = result?.total || 0;
  const progressProcessed = result?.processed || 0;
  const progressPercent = progressTotal > 0 ? Math.min(100, Math.round((progressProcessed / progressTotal) * 100)) : 0;

  return (
    <Card className="w-full max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Bulk Student Import</h2>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Download the Excel template using the button below.</li>
          <li>Fill in the student details in the template. Required fields are marked with <RequiredAsterisk></RequiredAsterisk></li>
          <li>Do not change the column headers.</li>
          <li>For phone numbers, include country code (example: <span className="font-mono font-semibold">+919876543210</span>).</li>
          <li>Save the file and upload it here.</li>
        </ol>
        <div className="mt-3 text-xs text-blue-700">
          <div className="font-semibold text-blue-800 mb-1">Allowed values for dropdown fields:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Admission Type:</span> New, Transfer, Re-admission
            </div>
            <div>
              <span className="font-semibold">Blood Group:</span> A+, A-, B+, B-, AB+, AB-, O+, O-
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleDownloadTemplate}
          disabled={isBusy}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          {isDownloadingTemplate ? <LoadingSpinner size="sm" color="white" /> : 'Download Template'}
        </button>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center">
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isBusy}
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
              disabled={isBusy}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!file || isBusy}
            className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${
              !file || isBusy
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isStartingImport ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" color="white" /> Starting...
              </span>
            ) : isPolling ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" color="white" /> Importing...
              </span>
            ) : (
              'Import from file'
            )}
          </button>
        </div>
      </form>

      {jobId && (
        <div className="mt-6 border-t pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h3 className="font-semibold text-lg text-gray-900">Import Progress</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                Status: {job?.status || 'queued'}
              </span>
              <button
                type="button"
                onClick={handleDownloadResult}
                disabled={job?.status !== 'done' || isDownloadingResult}
                className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${
                  job?.status !== 'done' || isDownloadingResult ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isDownloadingResult ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" /> Downloading...
                  </span>
                ) : (
                  'Download Result'
                )}
              </button>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-2 text-sm text-gray-700 flex justify-between">
            <span>{progressProcessed} / {progressTotal} processed</span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      )}

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

          {job?.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="font-medium text-red-800 mb-1">Import Failed</h4>
              <div className="text-sm text-red-700">{error || job?.message || 'Import failed'}</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default StudentBulkImport;
