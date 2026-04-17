import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckSquare, AlertCircle, Building2, Calendar, Layers, BookOpen, Clock, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import leaveService from '../services/leaveService';
import { PERMISSIONS } from '../config/permissions';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LeaveManagementPage = () => {
  const [activeTab, setActiveTab] = useState('request');
  const { getUserName, getPrimaryRole, getCampusId, hasPermission, getFullName } = useAuth();
  const username = useMemo(() => getUserName(), [getUserName]);
  const campusId = useMemo(() => getCampusId(), [getCampusId]);
  const role = useMemo(() => getPrimaryRole(), [getPrimaryRole]);
  const canViewApprovalTab = useMemo(
    () => (hasPermission ? hasPermission(PERMISSIONS.LEAVE_PENDING_LIST_READ) : false),
    [hasPermission]
  );

  // Tab configuration
  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: 'request',
        name: 'Leave Request',
        icon: ClipboardList,
        description: 'Apply for leaves and track your requests',
      }
    ];

    if (canViewApprovalTab) {
      baseTabs.push({
        id: 'approval',
        name: 'Leave Approval',
        icon: CheckSquare,
        description: 'Review and manage pending leave approvals',
      });
    }

    return baseTabs;
  }, [canViewApprovalTab]);

  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingMyLeaves, setLoadingMyLeaves] = useState(false);
  
  // Initialize dates: first of current month to today (UTC)
  const getInitialStartDate = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().split('T')[0];
  };
  const getInitialEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [myLeavesDates, setMyLeavesDates] = useState({ start: getInitialStartDate(), end: getInitialEndDate() });
  const [pendingDates, setPendingDates] = useState({ start: getInitialStartDate(), end: getInitialEndDate() });
  const [completedDates, setCompletedDates] = useState({ start: getInitialStartDate(), end: getInitialEndDate() });

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  const [completedApprovals, setCompletedApprovals] = useState([]);
  const [loadingCompletedApprovals, setLoadingCompletedApprovals] = useState(false);

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalAction, setReasonModalAction] = useState(null); // 'approve' | 'reject'
  const [reasonModalRequestId, setReasonModalRequestId] = useState(null);
  const [reasonText, setReasonText] = useState('');

  const [formState, setFormState] = useState({
    leave_date: '',
    duration_category: 'Full Day',
    duration_days: 1.0,
    leave_reason: ''
  });

  // Sync duration_days when category changes
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      duration_days: prev.duration_category === 'Half Day' ? 0.5 : 1.0
    }));
  }, [formState.duration_category]);

  const loadMyLeaves = async (dates = myLeavesDates) => {
    if (!username) return;
    try {
      setLoadingMyLeaves(true);
      const res = await leaveService.getMyLeaveRequests({
        startDate: dates.start,
        endDate: dates.end
      });
      let list = res?.data || res?.leaves || res || [];
      if (!Array.isArray(list)) list = [];
      
      // Local fallback filtering in case backend doesn't filter
      const filtered = list.filter(leave => {
        if (!leave.leave_date) return false;
        const leaveTime = new Date(leave.leave_date).setHours(0, 0, 0, 0);
        if (Number.isNaN(leaveTime)) return false;
        
        if (dates.start) {
          const startTime = new Date(dates.start).setHours(0, 0, 0, 0);
          if (!Number.isNaN(startTime) && leaveTime < startTime) return false;
        }
        if (dates.end) {
          const endTime = new Date(dates.end).setHours(0, 0, 0, 0);
          if (!Number.isNaN(endTime) && leaveTime > endTime) return false;
        }
        return true;
      });
      
      setMyLeaves(filtered);
    } catch (error) {
      toast.error(error?.message || 'Failed to load leave requests');
      setMyLeaves([]);
    } finally {
      setLoadingMyLeaves(false);
    }
  };

  const loadPendingApprovals = async (dates = pendingDates) => {
    if (!canViewApprovalTab) return;
    try {
      setLoadingApprovals(true);
      const res = await leaveService.getPendingApprovals({
        startDate: dates.start,
        endDate: dates.end
      });
      let list = res?.data || res?.requests || res || [];
      if (!Array.isArray(list)) list = [];

      // Local fallback filtering
      const filtered = list.filter(request => {
        if (!request.leave_date) return false;
        const leaveTime = new Date(request.leave_date).setHours(0, 0, 0, 0);
        if (Number.isNaN(leaveTime)) return false;
        
        if (dates.start) {
          const startTime = new Date(dates.start).setHours(0, 0, 0, 0);
          if (!Number.isNaN(startTime) && leaveTime < startTime) return false;
        }
        if (dates.end) {
          const endTime = new Date(dates.end).setHours(0, 0, 0, 0);
          if (!Number.isNaN(endTime) && leaveTime > endTime) return false;
        }
        return true;
      });

      setPendingApprovals(filtered);
    } catch (error) {
      toast.error(error?.message || 'Failed to load pending approvals');
      setPendingApprovals([]);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const loadCompletedApprovals = async (dates = completedDates) => {
    if (!canViewApprovalTab) return;
    try {
      setLoadingCompletedApprovals(true);
      const res = await leaveService.getCompletedApprovals({
        startDate: dates.start,
        endDate: dates.end
      });
      let list = res?.data || res?.requests || res || [];
      if (!Array.isArray(list)) list = [];

      // Local fallback filtering
      const filtered = list.filter(request => {
        if (!request.leave_date) return false;
        const leaveTime = new Date(request.leave_date).setHours(0, 0, 0, 0);
        if (Number.isNaN(leaveTime)) return false;
        
        if (dates.start) {
          const startTime = new Date(dates.start).setHours(0, 0, 0, 0);
          if (!Number.isNaN(startTime) && leaveTime < startTime) return false;
        }
        if (dates.end) {
          const endTime = new Date(dates.end).setHours(0, 0, 0, 0);
          if (!Number.isNaN(endTime) && leaveTime > endTime) return false;
        }
        return true;
      });

      setCompletedApprovals(filtered);
    } catch (error) {
      toast.error(error?.message || 'Failed to load completed approvals');
      setCompletedApprovals([]);
    } finally {
      setLoadingCompletedApprovals(false);
    }
  };



  /* Local filtering removed to prevent automatic updates on date change. 
     The Get Leaves button should be the only trigger for data refresh via loadMyLeaves. */
  
  const handleSubmitLeave = async () => {
    try {
      if (!username || !campusId || !role) {
        toast.error('Missing user or campus context');
        return;
      }

      if (!formState.leave_date || !formState.leave_reason) {
        toast.error('Please fill in leave date and reason');
        return;
      }

      const payload = {
        username,
        requester_role: role,
        campus_id: campusId,
        applied_to_username: username,
        approver_role: role,
        leave_date: formState.leave_date,
        leave_reason: formState.leave_reason,
        duration_days: formState.duration_days,
        duration_category: formState.duration_category
      };

      const res = await leaveService.createLeaveRequest(payload);
      if (res?.success) {
        toast.success(res?.message || 'Leave request submitted');
      } else {
        toast.success('Leave request submitted');
      }
      setFormState({
        leave_date: '',
        duration_category: 'Full Day',
        duration_days: 1.0,
        leave_reason: ''
      });
      loadMyLeaves();
    } catch (error) {
      toast.error(error?.message || 'Failed to submit leave request');
    }
  };

  const handleApprove = (id) => {
    setReasonModalAction('approve');
    setReasonModalRequestId(id);
    setReasonText('');
    setReasonModalOpen(true);
  };

  const handleReject = (id) => {
    setReasonModalAction('reject');
    setReasonModalRequestId(id);
    setReasonText('');
    setReasonModalOpen(true);
  };

  const handleWithdraw = async (id) => {
    try {
      const reason = '';
      const res = await leaveService.cancelLeaveRequest(id, reason);
      if (res?.success) toast.success('Withdrawn');
      setMyLeaves(prev => prev.map(item => item.id === id ? { ...item, status: 'cancelled' } : item));
      loadMyLeaves();
      loadPendingApprovals();
      loadCompletedApprovals();
    } catch (error) {
      toast.error(error?.message || 'Failed to withdraw');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Leave Management</h1>
        <p className="text-secondary-600">
          Welcome, {getFullName ? getFullName() : 'User'}! Manage leave requests and approvals for your campus.
        </p>
      </div>



      {/* Main Content */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-secondary-50/30 overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap min-w-max md:min-w-0 md:w-full gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 flex flex-col items-center justify-center py-4 px-6 rounded-xl transition-all duration-300 border
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-transparent shadow-md'
                          : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
                      <span className={`font-bold text-medium tracking-wide ${isActive ? 'text-primary-900' : ''}`}>
                        {tab.name}
                      </span>
                    </div>
                    <span className={`text-sm mt-1 font-medium ${isActive ? 'text-primary-600' : 'text-secondary-400'}`}>
                      {tab.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'request' && (
            <div className="space-y-6">
              {/* Apply for Leave Form */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-secondary-900">
                      Apply for Leave
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-blue-700">
                        Leave Date <span className="text-blue-500 text-xs ml-1">📅</span>
                      </label>
                      <input
                        type="date"
                        value={formState.leave_date}
                        onChange={(e) => setFormState(s => ({ ...s, leave_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 border-blue-400 bg-blue-50 focus:ring-blue-300 focus:border-blue-500 shadow-sm h-10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Reason</label>
                      <input
                        type="text"
                        value={formState.leave_reason}
                        onChange={(e) => setFormState(s => ({ ...s, leave_reason: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 h-9"
                        placeholder="Reason for leave"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Duration Category</label>
                      <select
                        value={formState.duration_category}
                        onChange={(e) => setFormState(s => ({ ...s, duration_category: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border-gray-300 bg-white h-9"
                      >
                        <option value="Full Day">Full Day</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Hourly">Hourly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Duration (days)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="5"
                        value={formState.duration_days}
                        onChange={(e) => setFormState(s => ({ ...s, duration_days: parseFloat(e.target.value || '1.0') }))}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitLeave}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md font-medium"
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              </Card>

              {/* My Leave Requests Table */}
              <Card>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="h-6 w-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-secondary-900">My Leave Requests</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-end w-full md:w-auto">
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">Start Date</label>
                        <input
                          type="date"
                          value={myLeavesDates.start}
                          onChange={(e) => {
                            setMyLeavesDates(prev => ({ ...prev, start: e.target.value }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-9"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">End Date</label>
                        <input
                          type="date"
                          value={myLeavesDates.end}
                          onChange={(e) => {
                            setMyLeavesDates(prev => ({ ...prev, end: e.target.value }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-9"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => loadMyLeaves()}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors h-9 whitespace-nowrap shadow-sm hover:shadow-md"
                      >
                        Get Leaves
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const initial = { start: getInitialStartDate(), end: getInitialEndDate() };
                          setMyLeavesDates(initial);
                          loadMyLeaves(initial);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50 transition-colors h-9 whitespace-nowrap"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto rounded-lg border border-secondary-200">
                    <table className="min-w-full divide-y divide-secondary-200">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Rejected Reason</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-secondary-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-secondary-200">
                        {loadingMyLeaves && (
                          <tr><td className="px-4 py-4 text-sm text-secondary-500 text-center" colSpan={7}><div className="flex items-center justify-center py-4"><LoadingSpinner size="sm" /> <span className="ml-2">Loading...</span></div></td></tr>
                        )}
                        {!loadingMyLeaves && myLeaves.length === 0 && (
                          <tr>
                            <td className="px-4 py-4 text-sm text-secondary-500 text-center" colSpan={7}>
                              {myLeavesDates.start || myLeavesDates.end ? 'No leave requests for selected dates' : 'No leave requests yet'}
                            </td>
                          </tr>
                        )}
                        {!loadingMyLeaves && myLeaves.map((leave) => (
                          <tr key={leave.id} className="hover:bg-secondary-50/50 transition-colors duration-150">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-secondary-900">{leave.leave_date}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{leave.duration_days}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{leave.duration_category}</td>
                            <td className="px-4 py-4 text-sm text-secondary-700 font-medium">{leave.leave_reason}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                leave.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leave.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-secondary-700 font-medium">
                              {leave.status === 'rejected' ? (
                                <div className="max-w-xs truncate" title={Array.isArray(leave.rejected_comments) ? leave.rejected_comments.filter(Boolean).join(', ') : ''}>
                                  <span>
                                    {(Array.isArray(leave.rejected_comments) ? leave.rejected_comments : []).filter(Boolean).join(', ') || '—'}
                                  </span>
                                  {Array.isArray(leave.rejected_by) && leave.rejected_by.length > 0 && (
                                    <span className="ml-2 text-secondary-400 text-xs font-normal italic">
                                      By: {leave.rejected_by.filter(Boolean).join(', ')}
                                    </span>
                                  )}
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-right">
                              {leave.status === 'pending' && (
                                <button
                                  onClick={() => handleWithdraw(leave.id)}
                                  className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
                                >
                                  Withdraw
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'approval' && canViewApprovalTab && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="h-6 w-6 text-secondary-600" />
                      <h2 className="text-xl font-semibold text-secondary-900">Pending Approvals</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-end w-full md:w-auto">
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">Start Date</label>
                        <input
                          type="date"
                          value={pendingDates.start}
                          onChange={(e) => {
                            setPendingDates(prev => ({ ...prev, start: e.target.value }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-9"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">End Date</label>
                        <input
                          type="date"
                          value={pendingDates.end}
                          onChange={(e) => {
                            setPendingDates(prev => ({ ...prev, end: e.target.value }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-9"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => loadPendingApprovals()}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors h-9 whitespace-nowrap shadow-sm hover:shadow-md"
                      >
                        Get Leaves
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const initial = { start: getInitialStartDate(), end: getInitialEndDate() };
                          setPendingDates(initial);
                          loadPendingApprovals(initial);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50 transition-colors h-9 whitespace-nowrap"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-secondary-200">
                    <table className="min-w-full divide-y divide-secondary-200">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Approver Chain</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-secondary-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-secondary-200">
                        {loadingApprovals && (
                          <tr><td className="px-4 py-4 text-sm text-secondary-500 text-center" colSpan={8}><div className="flex items-center justify-center py-4"><LoadingSpinner size="sm" /> <span className="ml-2">Loading...</span></div></td></tr>
                        )}
                        {!loadingApprovals && pendingApprovals.length === 0 && (
                          <tr><td className="px-4 py-4 text-sm text-secondary-500 text-center" colSpan={8}>No pending approvals found</td></tr>
                        )}
                        {!loadingApprovals && pendingApprovals.map((request) => (
                          <tr key={request.id} className="hover:bg-secondary-50/50 transition-colors duration-150">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-secondary-900">{request.username}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{request.leave_date}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{request.duration_days}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{request.duration_category}</td>
                            <td className="px-4 py-4 text-sm text-secondary-700 font-medium">{request.leave_reason}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                             <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider ${
                                request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-secondary-700 font-medium">
                              {Array.isArray(request.steps) && request.steps.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {request.steps.map((s, idx) => (
                                    <span key={`${request.id}-${s.approver_username}-${idx}`} className="px-2 py-0.5 bg-secondary-100 rounded text-xs font-bold">
                                      {s.approver_role}: {s.status}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-secondary-400 italic">No steps</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-right">
                            {(() => {
                              const myStep = Array.isArray(request.steps) ? request.steps.find(s => s.approver_username === username) : null;
                              return myStep && myStep.status === 'pending' ? (
                              <div className="flex justify-end space-x-3">
                                <button 
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-700 font-bold"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleReject(request.id)}
                                  className="text-red-600 hover:text-red-700 font-bold"
                                >
                                  Reject
                                </button>
                              </div>
                              ) : (
                                <span className="text-secondary-400 italic">No actions</span>
                              )
                            })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-6 w-6 text-green-600" />
                      <h2 className="text-xl font-semibold text-secondary-900">Completed Approvals</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-end w-full md:w-auto">
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">Start Date</label>
                        <input
                          type="date"
                          value={completedDates.start}
                          onChange={(e) => {
                            setCompletedDates(prev => ({ ...prev, start: e.target.value }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-9"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">End Date</label>
                        <input
                          type="date"
                          value={completedDates.end}
                          onChange={(e) => {
                            setCompletedDates(prev => ({ ...prev, end: e.target.value }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-9"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => loadCompletedApprovals()}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors h-9 whitespace-nowrap shadow-sm hover:shadow-md"
                      >
                        Get Leaves
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const initial = { start: getInitialStartDate(), end: getInitialEndDate() };
                          setCompletedDates(initial);
                          loadCompletedApprovals(initial);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50 transition-colors h-9 whitespace-nowrap"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-secondary-200">
                    <table className="min-w-full divide-y divide-secondary-200">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Approver Chain</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-secondary-200">
                        {loadingCompletedApprovals && (
                          <tr><td className="px-4 py-4 text-sm text-secondary-500 text-center" colSpan={7}><div className="flex items-center justify-center py-4"><LoadingSpinner size="sm" /> <span className="ml-2">Loading...</span></div></td></tr>
                        )}
                        {!loadingCompletedApprovals && completedApprovals.length === 0 && (
                          <tr><td className="px-4 py-4 text-sm text-secondary-500 text-center" colSpan={7}>No completed approvals found</td></tr>
                        )}
                        {!loadingCompletedApprovals && completedApprovals.map((request) => (
                          <tr key={request.id} className="hover:bg-secondary-50/50 transition-colors duration-150">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-secondary-900">{request.username}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{request.leave_date}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{request.duration_days}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">{request.duration_category}</td>
                            <td className="px-4 py-4 text-sm text-secondary-700 font-medium">{request.leave_reason}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                             <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider ${
                                request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-secondary-700 font-medium">
                              {Array.isArray(request.steps) && request.steps.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {request.steps.map((s, idx) => (
                                    <span key={`${request.id}-${s.approver_username}-${idx}`} className="px-2 py-0.5 bg-secondary-100 rounded text-xs font-bold">
                                      {s.approver_role}: {s.status}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-secondary-400 italic">No steps</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={reasonModalOpen}
        onClose={() => setReasonModalOpen(false)}
        title={reasonModalAction === 'approve' ? 'Approval Reason (optional)' : 'Rejection Reason (required)'}
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {reasonModalAction === 'approve' ? 'Reason (optional)' : 'Reason (required)'}
            </label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none resize-none"
              placeholder={reasonModalAction === 'approve' ? 'Add an optional note' : 'Provide a rejection reason'}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <button
              className="px-4 py-2 text-sm font-medium rounded-lg border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50 transition-colors"
              onClick={() => setReasonModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className={`px-6 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-all ${
                reasonModalAction === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-100' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-100'
              }`}
              onClick={async () => {
                try {
                  const id = reasonModalRequestId;
                  const reason = (reasonText || '').trim();
                  if (reasonModalAction === 'reject' && !reason) {
                    toast.error('Reason is required to reject');
                    return;
                  }
                  if (reasonModalAction === 'approve') {
                    const res = await leaveService.approveLeaveRequest(id, reason);
                    if (res?.success) toast.success('Approved');
                    setPendingApprovals(prev => prev.map(item => item.id === id ? { ...item, status: 'approved' } : item));
                  } else {
                    const res = await leaveService.rejectLeaveRequest(id, reason);
                    if (res?.success) toast.success('Rejected');
                    setPendingApprovals(prev => prev.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
                  }
                  setReasonModalOpen(false);
                  loadMyLeaves();
                  loadPendingApprovals();
                  loadCompletedApprovals();
                } catch (error) {
                  toast.error(error?.message || 'Action failed');
                }
              }}
            >
              {reasonModalAction === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveManagementPage;
