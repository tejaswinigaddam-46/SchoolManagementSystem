import { api } from './apiClient.js';
import config from '../config/env.config';

const withApiPrefixIfNeeded = (path) => {
  const p = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
  const baseUrl = String(config?.apiBaseUrl || '');
  if (baseUrl.endsWith('/api') || baseUrl.includes('/api/')) return p;
  return `/api${p}`;
};

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

export const syllabusTopicService = {
  getTopics: async (chapterId) => {
    try {
      const response = await api.get(`/syllabus-content/chapters/${chapterId}/topics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createTopic: async (data) => {
    try {
      const response = await api.post('/syllabus-content/topics', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getTopicById: async (topicId) => {
    try {
      const response = await api.get(`/syllabus-content/topics/${topicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateTopic: async (topicId, data) => {
    try {
      const response = await api.put(`/syllabus-content/topics/${topicId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteTopic: async (topicId) => {
    try {
      const response = await api.delete(`/syllabus-content/topics/${topicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const syllabusSubtopicService = {
  getSubtopics: async (topicId) => {
    try {
      const response = await api.get(`/syllabus-content/topics/${topicId}/subtopics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createSubtopic: async (data) => {
    try {
      const response = await api.post('/syllabus-content/subtopics', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getSubtopicById: async (subtopicId) => {
    try {
      const response = await api.get(`/syllabus-content/subtopics/${subtopicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateSubtopic: async (subtopicId, data) => {
    try {
      const response = await api.put(`/syllabus-content/subtopics/${subtopicId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteSubtopic: async (subtopicId) => {
    try {
      const response = await api.delete(`/syllabus-content/subtopics/${subtopicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const syllabusPlanService = {
  getPlans: async (params = {}) => {
    try {
      const response = await api.get(withApiPrefixIfNeeded('/syllabus-tracking/plans'), { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createPlan: async (data) => {
    try {
      const response = await api.post(withApiPrefixIfNeeded('/syllabus-tracking/plans'), data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updatePlan: async (data) => {
    try {
      const response = await api.put(withApiPrefixIfNeeded('/syllabus-tracking/plans'), data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const syllabusProgressService = {
  getProgress: async (params = {}) => {
    try {
      const response = await api.get(withApiPrefixIfNeeded('/syllabus-tracking/progress'), { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createProgress: async (data) => {
    try {
      const response = await api.post(withApiPrefixIfNeeded('/syllabus-tracking/progress'), data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateProgressBulk: async (updates = [], params = {}) => {
    try {
      const response = await api.put(withApiPrefixIfNeeded('/syllabus-tracking/progress'), updates, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateProgressById: async (progressId, data) => {
    try {
      const response = await api.put(withApiPrefixIfNeeded(`/syllabus-tracking/progress/${progressId}`), data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default syllabusBookService;
