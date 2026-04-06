import { api } from './apiClient';

export const holidayService = {
  // Get all holidays
  getHolidays: async (campusId, filters = {}) => {
    try {
      const response = await api.get(`/holidays/${campusId}`, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Calculate holidays summary
  calculateHolidays: async (campusId, params = {}) => {
    try {
      const response = await api.get(`/holidays/${campusId}/calculated`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create holiday
  createHoliday: async (campusId, data) => {
    try {
      const response = await api.post(`/holidays/${campusId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update holiday
  updateHoliday: async (campusId, id, data) => {
    try {
      const response = await api.put(`/holidays/${campusId}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete holiday
  deleteHoliday: async (campusId, id) => {
    try {
      const response = await api.delete(`/holidays/${campusId}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
