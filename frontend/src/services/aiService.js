import aiApiClient, { aiApi } from './aiApiClient';

const getAiQueryPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1') ? '/ai/query' : '/api/v1/ai/query'
}

const getFeedbackOverviewPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1') ? '/ai/feedback-overview' : '/api/v1/ai/feedback-overview'
}

export const aiService = {
  query: async (query, bookName, conversationId) => {
    const payload = {
      question: query,
      book_name: bookName,
    }

    if (conversationId) {
      payload.conversation_id = conversationId
    }

    const response = await aiApi.post(
      getAiQueryPath(),
      payload,
      { timeout: 60000, suppressErrorToast: true }
    );
    return response.data;
  },

  feedbackOverview: async (topic, bookName, noOfChunks = 5, conversationId) => {
    const payload = {
      topic,
      book_name: bookName,
      no_of_chunks: noOfChunks
    }

    if (conversationId) {
      payload.conversation_id = conversationId
    }

    const response = await aiApi.post(
      getFeedbackOverviewPath(),
      payload,
      { timeout: 60000, suppressErrorToast: true }
    )
    return response.data
  },
};

export default aiService;
