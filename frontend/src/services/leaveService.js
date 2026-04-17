import { api } from './apiClient.js'

export const leaveService = {
  // Create a new leave request
  async createLeaveRequest(payload) {
    try {
      const res = await api.post('/leave-requests', payload)
      return res.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get current user's leave requests
  async getMyLeaveRequests(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      const res = await api.get(`/leave-requests/my?${queryParams.toString()}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get pending approvals assigned to current approver (optional)
  async getPendingApprovals(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      const res = await api.get(`/leave-requests/pending?${queryParams.toString()}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get completed approvals (history)
  async getCompletedApprovals(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      const res = await api.get(`/leave-requests/history?${queryParams.toString()}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Approve a leave request
  async approveLeaveRequest(id, status_reason = '') {
    try {
      const res = await api.patch(`/leave-requests/${id}/status`, { status: 'approved', status_reason })
      return res.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Reject a leave request
  async rejectLeaveRequest(id, status_reason = '') {
    try {
      const res = await api.patch(`/leave-requests/${id}/status`, { status: 'rejected', status_reason })
      return res.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
  ,
  // Cancel all pending approver rows for this request by requester
  async cancelLeaveRequest(id, status_reason = '') {
    try {
      const res = await api.patch(`/leave-requests/${id}/cancel`, { status_reason })
      return res.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

export default leaveService
