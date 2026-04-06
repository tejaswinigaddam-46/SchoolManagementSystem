import { api } from './apiClient';

export const specialWorkingDayService = {
  getAll: async (campusId, filters = {}) => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await api.get('/special-working-days', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch special working days';
    }
  },

  create: async (campusId, data) => {
    try {
      const response = await api.post('/special-working-days', data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create special working day';
    }
  },

  update: async (campusId, id, data) => {
    try {
      const response = await api.put(`/special-working-days/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update special working day';
    }
  },

  delete: async (campusId, id) => {
    try {
      const response = await api.delete(`/special-working-days/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to delete special working day';
    }
  }
};
