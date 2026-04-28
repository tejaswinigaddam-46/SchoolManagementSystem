import axios from 'axios'
import config from '../config/env.config'

/**
 * AI Service to handle AI-related queries
 */
export const aiService = {
  /**
   * Send a query to the AI backend
   * @param {string} query - The user's question
   * @param {string} subject - The selected curriculum book subject (mandatory)
   * @returns {Promise<any>} - The response from the AI
   */
  query: async (query, subject) => {
    const token = sessionStorage.getItem('accessToken')
    
    // Extract tenant ID from token if possible, similar to apiClient.js
    let tenantId = null
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        tenantId = payload.tenantId || payload.tenant_id || null
      }
    } catch (error) {
      console.error('Error extracting tenant ID for AI service:', error)
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    // Add subdomain headers for backward compatibility
    const hostname = window.location.hostname
    const hostParts = hostname.split('.')
    let subdomain = null
    if (hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
      const urlParams = new URLSearchParams(window.location.search)
      subdomain = urlParams.get('tenantId')
    } else if (hostParts.length >= 3 && !['www', 'api', 'admin'].includes(hostParts[0])) {
      subdomain = hostParts[0]
    }
    if (subdomain) {
      headers['X-Tenant-Subdomain'] = subdomain
      headers['X-Subdomain'] = subdomain
    }

    const response = await axios.post(`${config.aiApiUrl}/ai/query`, {
      question: query,
      subject: subject
    }, {
      headers
    })

    return response.data
  }
}

export default aiService
