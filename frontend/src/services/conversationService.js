import axios from 'axios';
import config from '../config/env.config';
import aiApiClient, { aiApi } from './aiApiClient';

/**
 * Helper to get common headers including tenant info
 */
const getHeaders = () => {
  const token = sessionStorage.getItem('accessToken');

  let tenantId = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check for nested tenant object as seen in AuthContext.jsx
      tenantId =
        payload.tenant?.tenant_id ||
        payload.tenantId ||
        payload.tenant_id ||
        null;
    }
  } catch (error) {
    console.error(
      'Error extracting tenant ID for conversation service:',
      error,
    );
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  // Add subdomain headers for backward compatibility
  const hostname = window.location.hostname;
  const hostParts = hostname.split('.');
  const hasExplicitSubdomainHeader =
    headers['X-Tenant-Subdomain'] || headers['X-Subdomain'];
  let subdomain = null;
  if (!hasExplicitSubdomainHeader) {
    // Respect explicit tenant headers (e.g., mobile login) to avoid overrides.
    if (hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
      const urlParams = new URLSearchParams(window.location.search);
      subdomain = urlParams.get('tenantId');
    } else if (
      hostParts.length >= 3 &&
      !['www', 'api', 'admin'].includes(hostParts[0])
    ) {
      subdomain = hostParts[0];
    }
  }
  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain;
    headers['X-Subdomain'] = subdomain;
  }

  return headers;
};

const getConversationsAskPath = () => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '');
  return baseURL.includes('/api/v1')
    ? '/conversations/ask'
    : '/api/v1/conversations/ask';
};

const getConversationPath = (conversationId) => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '');
  const id = encodeURIComponent(String(conversationId ?? '').trim());
  return baseURL.includes('/api/v1')
    ? `/conversations/${id}`
    : `/api/v1/conversations/${id}`;
};

const getConversationByQuestionPath = (questionId) => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '');
  const id = encodeURIComponent(String(questionId ?? '').trim());
  return baseURL.includes('/api/v1')
    ? `/conversations/by-question/${id}`
    : `/api/v1/conversations/by-question/${id}`;
};

const getConversationByQuestionSubtopicPath = (questionSubtopicsId) => {
  const baseURL = String(aiApiClient?.defaults?.baseURL || '');
  const id = encodeURIComponent(String(questionSubtopicsId ?? '').trim());
  return baseURL.includes('/api/v1')
    ? `/conversations/by-question-subtopic/${id}`
    : `/api/v1/conversations/by-question-subtopic/${id}`;
};

/**
 * Service for handling AI conversations and messages
 */
const conversationService = {
  ask: async ({
    question,
    curriculum_book_name,
    conversation_id = null,
    title = null,
    question_id = null,
    question_subtopics_id = null,
    question_subtopic_id = null,
  }) => {
    const payload = {
      question,
      curriculum_book_name,
      conversation_id,
      title,
    };

    if (question_id != null && String(question_id).trim() !== '') {
      payload.question_id = question_id;
    }

    const subtopicsId =
      question_subtopics_id != null &&
      String(question_subtopics_id).trim() !== ''
        ? question_subtopics_id
        : question_subtopic_id != null &&
            String(question_subtopic_id).trim() !== ''
          ? question_subtopic_id
          : null;

    if (subtopicsId != null) {
      payload.question_subtopics_id = subtopicsId;
    }

    const response = await aiApi.post(getConversationsAskPath(), payload, {
      timeout: 60000,
      suppressErrorToast: true,
    });
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await aiApi.get(getConversationPath(conversationId), {
      params: { _t: Date.now() },
    });
    return response.data;
  },

  getConversationByQuestion: async (questionId) => {
    const response = await aiApi.get(
      getConversationByQuestionPath(questionId),
      {
        params: { _t: Date.now() },
      },
    );
    return response.data;
  },

  getConversationByQuestionSubtopic: async (questionSubtopicsId) => {
    const response = await aiApi.get(
      getConversationByQuestionSubtopicPath(questionSubtopicsId),
      {
        params: { _t: Date.now() },
      },
    );
    return response.data;
  },

  /**
   * Create a new message in a conversation
   */
  createMessage: async (messageData) => {
    const response = await axios.post(
      `${config.aiApiUrl}/conversations/messages`,
      messageData,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * List all conversations for the current user
   */
  listConversations: async () => {
    const response = await axios.get(`${config.aiApiUrl}/conversations`, {
      headers: getHeaders(),
      params: {
        _t: Date.now(),
      },
    });
    return response.data;
  },

  /**
   * Get all messages for a specific conversation
   */
  getMessages: async (conversationId) => {
    const response = await axios.get(
      `${config.aiApiUrl}/conversations/${conversationId}/messages`,
      {
        headers: getHeaders(),
        params: {
          _t: Date.now(),
        },
      },
    );
    return response.data;
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId) => {
    const response = await axios.delete(
      `${config.aiApiUrl}/conversations/${conversationId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Delete a specific message
   */
  deleteMessage: async (messageId) => {
    const response = await axios.delete(
      `${config.aiApiUrl}/conversations/messages/${messageId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },
};

export default conversationService;
