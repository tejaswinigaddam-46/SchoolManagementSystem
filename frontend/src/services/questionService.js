import { aiApi } from './aiApiClient';

const questionService = {
  createQuestionAssignment: async (data) => {
    const response = await aiApi.post('/questions/assignments', data);
    return response.data;
  },

  getQuestionAssignments: async (studentUsername) => {
    const params = studentUsername ? { student_username: studentUsername } : {};
    const response = await aiApi.get('/questions/assignments', { params });
    return response.data;
  }
};

export default questionService;
