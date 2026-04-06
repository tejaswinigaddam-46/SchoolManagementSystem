import { api } from './apiClient.js';

// Class API Service
export const classService = {
  // Get all classes with pagination and filters
  getAllClasses: async (params = {}) => {
    try {
      const response = await api.get('/classes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new class
  createClass: async (classData) => {
    try {
      const response = await api.post('/classes', classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get class by ID
  getClassById: async (classId) => {
    try {
      const response = await api.get(`/classes/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update existing class
  updateClass: async (classId, classData) => {
    try {
      const response = await api.put(`/classes/${classId}`, classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete class
  deleteClass: async (classId) => {
    try {
      const response = await api.delete(`/classes/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get classes by campus
  getClassesByCampus: async (campusId) => {
    try {
      const response = await api.get(`/classes/campus/${campusId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default classService;