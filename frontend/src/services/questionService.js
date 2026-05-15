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

const getAssignmentsProgressNumericPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1')
    ? '/questions/assignments/progress/numeric'
    : '/api/v1/questions/assignments/progress/numeric'
}

const getSubtopicProgressPath = (questionSubtopicsId) => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  const id = encodeURIComponent(String(questionSubtopicsId ?? '').trim())
  return baseURL.includes('/api/v1')
    ? `/questions/subtopics/${id}/progress`
    : `/api/v1/questions/subtopics/${id}/progress`
}

const getSubtopicRequestPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1')
    ? '/questions/subtopics/request'
    : '/api/v1/questions/subtopics/request'
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

  getAssignmentsProgressNumeric: async (data) => {
    const response = await aiApi.post(getAssignmentsProgressNumericPath(), data);
    return response.data;
  },

  updateQuestionSubtopicProgress: async (questionSubtopicsId, status) => {
    const response = await aiApi.put(
      getSubtopicProgressPath(questionSubtopicsId),
      { status }
    )
    return response.data
  },

  requestSubtopicAi: async (questionSubtopicsId, question = null) => {
    const idNumber = Number(questionSubtopicsId)
    if (!Number.isFinite(idNumber)) {
      throw new Error('Invalid question_subtopics_id')
    }
    const payload = {
      question_subtopics_id: idNumber,
      question: question == null ? null : String(question),
    }

    const response = await aiApi.post(
      getSubtopicRequestPath(),
      payload,
      { timeout: 60000, suppressErrorToast: true }
    )
    return response.data
  },
};

export default questionService;
