import { api } from './apiClient.js';

export const payrollService = {
  getPayrollReport: async ({ roles = [], academicYear = null, fromDate, toDate }) => {
    try {
      const response = await api.post('/payroll/report', { roles, academicYear, fromDate, toDate });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getMyPayrollReport: async ({ academicYear = null, fromDate, toDate }) => {
    try {
      const response = await api.post('/payroll/my', { academicYear, fromDate, toDate });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default payrollService;
