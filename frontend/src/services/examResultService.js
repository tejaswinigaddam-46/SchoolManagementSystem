import apiClient from './apiClient';

const ExamResultService = {
  getResultsByExamId: async (examId) => {
    const response = await apiClient.get(`/exam-results/exam/${examId}`);
    return response.data;
  },

  getResultsByStudentId: async (studentId) => {
    const response = await apiClient.get(`/exam-results/student/${studentId}`);
    return response.data;
  },

  createResult: async (data) => {
    const response = await apiClient.post('/exam-results', data);
    return response.data;
  },

  createBulkResults: async (results) => {
    const response = await apiClient.post('/exam-results/bulk', { results });
    return response.data;
  },

  updateResult: async (id, data) => {
    const response = await apiClient.put(`/exam-results/${id}`, data);
    return response.data;
  },

  deleteResult: async (id) => {
    const response = await apiClient.delete(`/exam-results/${id}`);
    return response.data;
  }
};

export default ExamResultService;
