import { api } from './apiClient';

export const attendanceService = {
  // Get attendance for a specific class/section/date
  getAttendance: async (params) => {
    try {
      const response = await api.get('/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Save/Update attendance
  saveAttendance: async (data) => {
    try {
      const response = await api.post('/attendance', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
