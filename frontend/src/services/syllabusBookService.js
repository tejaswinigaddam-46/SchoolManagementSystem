import { api } from './apiClient.js';

export const syllabusBookService = {
  getBooks: async (params = {}) => {
    try {
      const response = await api.get('/syllabus-content/books', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createBook: async (data) => {
    try {
      const response = await api.post('/syllabus-content/books', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getBookByKey: async (academicYearId, subjectName, versionNo) => {
    try {
      const response = await api.get(
        `/syllabus-content/books/${academicYearId}/${encodeURIComponent(subjectName)}/${versionNo}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateBookByKey: async (academicYearId, subjectName, versionNo, data) => {
    try {
      const response = await api.put(
        `/syllabus-content/books/${academicYearId}/${encodeURIComponent(subjectName)}/${versionNo}`,
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteBookByKey: async (academicYearId, subjectName, versionNo) => {
    try {
      const response = await api.delete(
        `/syllabus-content/books/${academicYearId}/${encodeURIComponent(subjectName)}/${versionNo}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default syllabusBookService;

