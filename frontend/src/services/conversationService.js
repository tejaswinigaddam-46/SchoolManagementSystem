import axios from 'axios';
import config from '../config/env.config';

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
      tenantId = payload.tenant?.tenant_id || payload.tenantId || payload.tenant_id || null;
    }
  } catch (error) {
    console.error('Error extracting tenant ID for conversation service:', error);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  // Add subdomain headers for backward compatibility
  const hostname = window.location.hostname;
  const hostParts = hostname.split('.');
  let subdomain = null;
  if (hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
    const urlParams = new URLSearchParams(window.location.search);
    subdomain = urlParams.get('tenantId');
  } else if (hostParts.length >= 3 && !['www', 'api', 'admin'].includes(hostParts[0])) {
    subdomain = hostParts[0];
  }
  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain;
    headers['X-Subdomain'] = subdomain;
  }

  return headers;
};

/**
 * Service for handling AI conversations and messages
 */
const conversationService = {
  /**
   * Create a new message in a conversation
   */
  createMessage: async (messageData) => {
    const response = await axios.post(`${config.aiApiUrl}/conversations/messages`, messageData, { 
      headers: getHeaders() 
    });
    return response.data;
  },

  /**
   * List all conversations for the current user
   */
  listConversations: async () => {
    const response = await axios.get(`${config.aiApiUrl}/conversations`, {
      headers: getHeaders(),
      params: {
        _t: Date.now()
      }
    });
    return response.data;
  },

  /**
   * Get all messages for a specific conversation
   */
  getMessages: async (conversationId) => {
    const response = await axios.get(`${config.aiApiUrl}/conversations/${conversationId}/messages`, {
      headers: getHeaders(),
      params: {
        _t: Date.now()
      }
    });
    return response.data;
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId) => {
    const response = await axios.delete(`${config.aiApiUrl}/conversations/${conversationId}`, {
      headers: getHeaders()
    });
    return response.data;
  },

  /**
   * Delete a specific message
   */
  deleteMessage: async (messageId) => {
    const response = await axios.delete(`${config.aiApiUrl}/conversations/messages/${messageId}`, {
      headers: getHeaders()
    });
    return response.data;
  }
};

export default conversationService;
