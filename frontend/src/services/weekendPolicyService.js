import { api } from './apiClient';

export const weekendPolicyService = {
  getAll: async (campusId) => {
    try {
      const response = await api.get(`/weekend-policies/${campusId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  save: async (campusId, data) => {
    try {
      const response = await api.post(`/weekend-policies/${campusId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  delete: async (campusId, id) => {
    try {
      const response = await api.delete(`/weekend-policies/${campusId}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
