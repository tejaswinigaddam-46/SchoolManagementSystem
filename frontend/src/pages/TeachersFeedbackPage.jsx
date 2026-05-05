import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import questionService from '../services/questionService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CURRICULUM_BOOKS = [
  { value: 'GOV_SSC_ENGLISH', label: 'SSC English' },
  { value: 'GOV_SSC_PHYSICS', label: 'SSC Physics' },
  { value: 'GOV_SSC_CHEMISTRY', label: 'SSC Chemistry' }
];

const normalizeStatus = (status) => {
  const raw = String(status || '').trim();
  const compact = raw.replace(/\s+/g, '').toLowerCase();

  if (compact === 'todo') return 'TODO';
  if (compact === 'inprogress') return 'InProgress';
  if (compact === 'completed') return 'completed';
  return raw || 'Unknown';
};

const statusColor = (normalized) => {
  if (normalized === 'TODO') return 'warning';
  if (normalized === 'InProgress') return 'primary';
  if (normalized === 'completed') return 'success';
  return 'secondary';
};

const TeachersFeedbackPage = ({ selectedBook }) => {
  const { getUserName } = useAuth();
  const studentUsername = String(getUserName?.() || '').trim();
  const [progressRows, setProgressRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const grouped = useMemo(() => {
    const groups = { TODO: [], InProgress: [], completed: [], Other: [] };
    for (const row of Array.isArray(progressRows) ? progressRows : []) {
      const normalized = normalizeStatus(row?.status);
      if (normalized === 'TODO') groups.TODO.push(row);
      else if (normalized === 'InProgress') groups.InProgress.push(row);
      else if (normalized === 'completed') groups.completed.push(row);
      else groups.Other.push(row);
    }
    return groups;
  }, [progressRows]);

  const fetchProgress = useCallback(async (opts = {}) => {
    const bookToUse = opts.book ?? selectedBook;
    const usernameToUse = opts.studentUsername ?? studentUsername;

    if (!bookToUse || !usernameToUse) return;

    setIsLoading(true);
    setErrorText('');

    try {
      const response = await questionService.getQuestionsProgress({
        studentusername: usernameToUse,
        book: bookToUse
      });

      const rowsCandidate =
        Array.isArray(response) ? response :
        Array.isArray(response?.data) ? response.data :
        Array.isArray(response?.results) ? response.results :
        [];

      setProgressRows(rowsCandidate);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch progress';
      setErrorText(message);
      setProgressRows([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBook, studentUsername]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const canFetch = Boolean(selectedBook && studentUsername);

  const renderGroup = (title, key) => {
    const items = grouped[key] || [];
    return (
      <div className="bg-white border border-secondary-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-secondary-800">{title}</div>
          <Badge color={statusColor(key)} variant="soft" size="sm">{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <div className="text-xs text-secondary-500">No items</div>
        ) : (
          <div className="space-y-2">
            {items.map((row) => {
              const normalized = normalizeStatus(row?.status);
              return (
                <div
                  key={row?.question_id ?? `${row?.question_name}-${row?.status}`}
                  className="flex items-start justify-between gap-3 p-2 rounded-lg bg-secondary-50/50 border border-secondary-100"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-secondary-900 truncate">
                      {row?.question_name || `Question ${row?.question_id ?? ''}`}
                    </div>
                    <div className="text-[11px] text-secondary-500">ID: {row?.question_id ?? '-'}</div>
                  </div>
                  <Badge color={statusColor(normalized)} variant="soft" size="sm">{normalized}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0">
      <Card className="p-4 md:p-6 border-secondary-200 rounded-2xl shadow-sm bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div className="flex-1">
              <div className="text-sm font-bold text-secondary-800">Questions Progress</div>
              <div className="text-xs text-secondary-500 mt-1">
                Student: <span className="font-medium text-secondary-700">{studentUsername || '-'}</span>
                {selectedBook ? (
                  <>
                    {' '}• Book: <span className="font-medium text-secondary-700">{CURRICULUM_BOOKS.find(b => b.value === selectedBook)?.label || selectedBook}</span>
                  </>
                ) : null}
              </div>
            </div>

            <button
              onClick={() => fetchProgress()}
              disabled={!canFetch || isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm bg-primary-600 text-white border-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {!canFetch ? (
            <div className="p-4 bg-secondary-50 border border-secondary-100 rounded-xl text-sm text-secondary-700">
              Select a curriculum book to view progress.
            </div>
          ) : isLoading ? (
            <div className="p-6 flex items-center justify-center gap-3 bg-secondary-50/30 border border-secondary-100 rounded-xl">
              <LoadingSpinner size="sm" color="primary" />
              <span className="text-sm text-secondary-600">Loading progress...</span>
            </div>
          ) : errorText ? (
            <div className="p-4 bg-error-50 border border-error-100 rounded-xl text-sm text-error-700">
              {errorText}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {renderGroup('TODO', 'TODO')}
              {renderGroup('In Progress', 'InProgress')}
              {renderGroup('Completed', 'completed')}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeachersFeedbackPage;
