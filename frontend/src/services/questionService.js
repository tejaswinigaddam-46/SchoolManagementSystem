import aiApiClient, { aiApi } from './aiApiClient';

const getAssignmentsPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1')
    ? '/questions/assignments'
    : '/api/v1/questions/assignments'
}

const getAssignmentsProgressPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1')
    ? '/questions/assignments/progress'
    : '/api/v1/questions/assignments/progress'
}

const getSubtopicProgressPath = (questionSubtopicsId) => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  const id = encodeURIComponent(String(questionSubtopicsId ?? '').trim())
  return baseURL.includes('/api/v1')
    ? `/questions/subtopics/${id}/progress`
    : `/api/v1/questions/subtopics/${id}/progress`
}

const questionService = {
  createQuestionAssignment: async (data) => {
    const response = await aiApi.post(getAssignmentsPath(), data);
    return response.data;
  },

  getQuestionAssignments: async (params = {}) => {
    const response = await aiApi.get(getAssignmentsPath(), { params });
    return response.data;
  },

  getQuestionAssignmentsByExam: async (examId, params) => {
    const response = await aiApi.get(`${getAssignmentsPath()}/exam/${examId}`, { params });
    return response.data;
  },

  getQuestionsProgress: async (params = {}) => {
    const response = await aiApi.get(getAssignmentsProgressPath(), { params });
    return response.data;
  },

  updateQuestionSubtopicProgress: async (questionSubtopicsId, status) => {
    const response = await aiApi.put(
      getSubtopicProgressPath(questionSubtopicsId),
      { status }
    )
    return response.data
  }
};

export default questionService;
