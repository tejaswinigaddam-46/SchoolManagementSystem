import { aiApi } from './aiApiClient';

const questionService = {
  createQuestionAssignment: async (data) => {
    const response = await aiApi.post('/questions/assignments', data);
    return response.data;
  },

  getQuestionAssignments: async (params = {}) => {
    const response = await aiApi.get('/questions/assignments', { params });
    return response.data;
  },

  getQuestionAssignmentsByExam: async (examId, params) => {
    const response = await aiApi.get(`/questions/assignments/exam/${examId}`, { params });
    return response.data;
  }
};

export default questionService;
