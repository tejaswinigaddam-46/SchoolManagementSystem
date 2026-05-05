import aiApiClient, { aiApi } from './aiApiClient';

const getAiQueryPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '')
  return baseURL.includes('/api/v1') ? '/ai/query' : '/api/v1/ai/query'
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
  }
};

export default aiService;
