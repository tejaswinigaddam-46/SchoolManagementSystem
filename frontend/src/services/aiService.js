import { aiApi } from './aiApiClient';

export const aiService = {
  query: async (query, subject) => {
    const response = await aiApi.post('/ai/query', {
      question: query,
      subject: subject
    });
    return response.data;
  }
};

export default aiService;
