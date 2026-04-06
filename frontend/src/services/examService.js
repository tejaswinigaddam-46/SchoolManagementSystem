import apiClient from './apiClient';

const ExamService = {
  getExams: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.academic_year_id) params.append('academic_year_id', filters.academic_year_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await apiClient.get(`/exams?${params.toString()}`);
    return response.data;
  },

  getExamById: async (id) => {
    const response = await apiClient.get(`/exams/${id}`);
    return response.data;
  },

  createExam: async (data) => {
    const response = await apiClient.post('/exams', data);
    return response.data;
  },

  updateExam: async (id, data) => {
    const response = await apiClient.put(`/exams/${id}`, data);
    return response.data;
  },

  deleteExam: async (id) => {
    const response = await apiClient.delete(`/exams/${id}`);
    return response.data;
  }
};

export default ExamService;
