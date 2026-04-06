import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import leaveService from '../services/leaveService';
import { PERMISSIONS } from '../config/permissions';

const LeaveManagementPage = () => {
  const [activeTab, setActiveTab] = useState('request');
  const { getUserName, getPrimaryRole, getCampusId, hasPermission } = useAuth();
  const username = useMemo(() => getUserName(), [getUserName]);
  const campusId = useMemo(() => getCampusId(), [getCampusId]);
  const role = useMemo(() => getPrimaryRole(), [getPrimaryRole]);
  const canViewApprovalTab = useMemo(
    () => (hasPermission ? hasPermission(PERMISSIONS.LEAVE_PENDING_LIST_READ) : false),
    [hasPermission]
  );

  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingMyLeaves, setLoadingMyLeaves] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

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

  const loadMyLeaves = async () => {
    if (!username) return;
    try {
      setLoadingMyLeaves(true);
      const res = await leaveService.getMyLeaveRequests();
      const list = res?.data || res?.leaves || res || [];
      setMyLeaves(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(error?.message || 'Failed to load leave requests');
      setMyLeaves([]);
    } finally {
      setLoadingMyLeaves(false);
    }
  };

  useEffect(() => {
    loadMyLeaves();
  }, [username]);

  const loadApprovals = async () => {
    if (!canViewApprovalTab) return;
    try {
      setLoadingApprovals(true);
      setLoadingCompletedApprovals(true);

      const [pendingRes, historyRes] = await Promise.all([
        leaveService.getPendingApprovals(),
        leaveService.getCompletedApprovals()
      ]);

      const pendingList = pendingRes?.data || pendingRes?.requests || pendingRes || [];
      setPendingApprovals(Array.isArray(pendingList) ? pendingList : []);

      const historyList = historyRes?.data || historyRes?.requests || historyRes || [];
      setCompletedApprovals(Array.isArray(historyList) ? historyList : []);
    } catch (error) {
      toast.error(error?.message || 'Failed to load approvals');
      setPendingApprovals([]);
      setCompletedApprovals([]);
    } finally {
      setLoadingApprovals(false);
      setLoadingCompletedApprovals(false);
    }
  };

  useEffect(() => {
    if (canViewApprovalTab) {
      loadApprovals();
    }
  }, [username, canViewApprovalTab]);

  const filteredMyLeaves = useMemo(() => {
    if (!startDateFilter && !endDateFilter) return myLeaves;
    return myLeaves.filter(leave => {
      if (!leave.leave_date) return false;
      const leaveTime = new Date(leave.leave_date).setHours(0, 0, 0, 0);
      if (Number.isNaN(leaveTime)) return false;
      if (startDateFilter) {
        const startTime = new Date(startDateFilter).setHours(0, 0, 0, 0);
        if (!Number.isNaN(startTime) && leaveTime < startTime) return false;
      }
      if (endDateFilter) {
        const endTime = new Date(endDateFilter).setHours(0, 0, 0, 0);
        if (!Number.isNaN(endTime) && leaveTime > endTime) return false;
      }
      return true;
    });
  }, [myLeaves, startDateFilter, endDateFilter]);

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
      loadApprovals();
    } catch (error) {
      toast.error(error?.message || 'Failed to withdraw');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Leave Management</h1>
          <p className="text-secondary-600 mt-1">Manage leave requests and approvals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-secondary-200">
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'request'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
          onClick={() => setActiveTab('request')}
        >
          Leave Request
        </button>
        {canViewApprovalTab && (
          <button
            className={`pb-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'approval'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-secondary-500 hover:text-secondary-700'
            }`}
            onClick={() => setActiveTab('approval')}
          >
            Leave Approval
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'request' && (
          <div className="space-y-6">
             <Card className="p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Apply for Leave</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Leave Date</label>
                  <input
                    type="date"
                    value={formState.leave_date}
                    onChange={(e) => setFormState(s => ({ ...s, leave_date: e.target.value }))}
                    className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
                  <input
                    type="text"
                    value={formState.leave_reason}
                    onChange={(e) => setFormState(s => ({ ...s, leave_reason: e.target.value }))}
                    className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Reason for leave"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Duration Category</label>
                  <select
                    value={formState.duration_category}
                    onChange={(e) => setFormState(s => ({ ...s, duration_category: e.target.value }))}
                    className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5"
                    value={formState.duration_days}
                    onChange={(e) => setFormState(s => ({ ...s, duration_days: parseFloat(e.target.value || '1.0') }))}
                    className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitLeave}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 gap-4">
                <h2 className="text-lg font-semibold text-secondary-900">My Leave Requests</h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }}
                    className="px-3 py-2 rounded-lg border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Rejected Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {loadingMyLeaves && (
                      <tr><td className="px-6 py-4 text-sm text-secondary-500" colSpan={7}>Loading...</td></tr>
                    )}
                    {!loadingMyLeaves && filteredMyLeaves.length === 0 && (
                      <tr>
                        <td className="px-6 py-4 text-sm text-secondary-500" colSpan={7}>
                          {startDateFilter || endDateFilter ? 'No leave requests for selected dates' : 'No leave requests yet'}
                        </td>
                      </tr>
                    )}
                    {!loadingMyLeaves && filteredMyLeaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{leave.leave_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{leave.duration_days}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{leave.duration_category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{leave.leave_reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            leave.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {leave.status === 'rejected' ? (
                            <>
                              <span>
                                {(Array.isArray(leave.rejected_comments) ? leave.rejected_comments : []).filter(Boolean).join(', ') || '—'}
                              </span>
                              {Array.isArray(leave.rejected_by) && leave.rejected_by.length > 0 && (
                                <span className="ml-2 text-secondary-400">
                                  By: {leave.rejected_by.filter(Boolean).join(', ')}
                                </span>
                              )}
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {leave.status === 'pending' && (
                            <button
                              onClick={() => handleWithdraw(leave.id)}
                              className="text-blue-600 hover:text-blue-900"
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
            </Card>
          </div>
        )}

        {activeTab === 'approval' && canViewApprovalTab && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Pending Approvals</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Approver Chain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {loadingApprovals && (
                      <tr><td className="px-6 py-4 text-sm text-secondary-500" colSpan={8}>Loading...</td></tr>
                    )}
                    {!loadingApprovals && pendingApprovals.length === 0 && (
                      <tr><td className="px-6 py-4 text-sm text-secondary-500" colSpan={8}>No pending approvals</td></tr>
                    )}
                    {!loadingApprovals && pendingApprovals.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{request.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.leave_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.duration_days}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.duration_category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.leave_reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {Array.isArray(request.steps) && request.steps.length > 0 ? (
                            request.steps.map((s, idx) => (
                              <span key={`${request.id}-${s.approver_username}-${idx}`} className="inline-block mr-2">
                                {s.approver_role} ({s.approver_username}): {s.status}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary-400">No steps</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(() => {
                          const myStep = Array.isArray(request.steps) ? request.steps.find(s => s.approver_username === username) : null;
                          return myStep && myStep.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                          ) : (
                            <span className="text-secondary-400">No actions</span>
                          )
                        })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Completed Approvals</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Approver Chain</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {loadingCompletedApprovals && (
                      <tr><td className="px-6 py-4 text-sm text-secondary-500" colSpan={7}>Loading...</td></tr>
                    )}
                    {!loadingCompletedApprovals && completedApprovals.length === 0 && (
                      <tr><td className="px-6 py-4 text-sm text-secondary-500" colSpan={7}>No completed approvals</td></tr>
                    )}
                    {!loadingCompletedApprovals && completedApprovals.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{request.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.leave_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.duration_days}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.duration_category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.leave_reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {Array.isArray(request.steps) && request.steps.length > 0 ? (
                            request.steps.map((s, idx) => (
                              <span key={`${request.id}-${s.approver_username}-${idx}`} className="inline-block mr-2">
                                {s.approver_role} ({s.approver_username}): {s.status}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary-400">No steps</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        <Modal
          isOpen={reasonModalOpen}
          onClose={() => setReasonModalOpen(false)}
          title={reasonModalAction === 'approve' ? 'Approval Reason (optional)' : 'Rejection Reason (required)'}
          size="sm"
        >
          <div className="p-6 space-y-4">
            <label className="block text-sm font-medium text-secondary-700">
              {reasonModalAction === 'approve' ? 'Reason (optional)' : 'Reason (required)'}
            </label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-secondary-300 focus:ring-primary-500 focus:border-primary-500"
              placeholder={reasonModalAction === 'approve' ? 'Add an optional note' : 'Provide a rejection reason'}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 rounded-lg border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50"
                onClick={() => setReasonModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white ${reasonModalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
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
                    loadApprovals();
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
    </div>
  );
};

export default LeaveManagementPage;
