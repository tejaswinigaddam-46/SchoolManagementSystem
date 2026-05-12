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
  getBookById: async (curriculumBookId) => {
    try {
      const response = await api.get(`/syllabus-content/books/${curriculumBookId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateBook: async (curriculumBookId, data) => {
    try {
      const response = await api.put(`/syllabus-content/books/${curriculumBookId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteBook: async (curriculumBookId) => {
    try {
      const response = await api.delete(`/syllabus-content/books/${curriculumBookId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const syllabusChapterService = {
  getChapters: async (params = {}) => {
    try {
      const response = await api.get('/syllabus-content/chapters', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createChapter: async (data) => {
    try {
      const response = await api.post('/syllabus-content/chapters', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getChapterById: async (chapterId) => {
    try {
      const response = await api.get(`/syllabus-content/chapters/${chapterId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateChapter: async (chapterId, data) => {
    try {
      const response = await api.put(`/syllabus-content/chapters/${chapterId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteChapter: async (chapterId) => {
    try {
      const response = await api.delete(`/syllabus-content/chapters/${chapterId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default syllabusBookService;
