import { api } from './apiClient.js';

export const feeService = {
  // Fee Types
  getFeeTypes: async (params = {}) => {
    try {
      const response = await api.get('/fees/fee-types', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createFeeType: async (data) => {
    try {
      const response = await api.post('/fees/fee-types', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateFeeType: async (id, data) => {
    try {
      const response = await api.put(`/fees/fee-types/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteFeeType: async (id) => {
    try {
      const response = await api.delete(`/fees/fee-types/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Fee Structures
  getAllFeeStructures: async (params = {}) => {
    try {
      const response = await api.get('/fees/fee-structures', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getFeeStructureById: async (id) => {
    try {
      const response = await api.get(`/fees/fee-structures/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createFeeStructure: async (data) => {
    try {
      const response = await api.post('/fees/fee-structures', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateFeeStructure: async (id, data) => {
    try {
      const response = await api.put(`/fees/fee-structures/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteFeeStructure: async (id) => {
    try {
      const response = await api.delete(`/fees/fee-structures/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Dues Generation
  generateDues: async (data) => {
    try {
      const response = await api.post('/fees/dues/generate', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reporting & Ledger
  getStudentDues: async (filters = {}) => {
    try {
      const response = await api.get('/fees/dues/student', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getAllPayments: async (filters = {}) => {
    try {
      const response = await api.get('/fees/payments', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  collectPayment: async (data) => {
    try {
      const response = await api.post('/fees/payments/collect', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default feeService;
