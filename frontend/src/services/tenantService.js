import { api } from './apiClient.js'

/**
 * Tenant Service
 * Handles tenant-related API calls
 */
export const tenantService = {
  /**
   * Get tenant information
   */
  async getTenantInfo(tenantId) {
    try {
      const response = await api.get(`/tenants/${tenantId}`)
      return response.data.data
    } catch (error) {
      console.error('Get tenant info error:', error)
      throw error
    }
  },

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain) {
    try {
      const response = await api.get(`/tenants/subdomain/${subdomain}`)
      return response.data
    } catch (error) {
      console.error('Get tenant by subdomain error:', error)
      throw error
    }
  },

  /**
   * Get tenant settings
   */
  async getTenantSettings(tenantId) {
    try {
      const response = await api.get(`/tenants/${tenantId}/settings`)
      return response.data
    } catch (error) {
      console.error('Get tenant settings error:', error)
      throw error
    }
  },

  /**
   * Update tenant settings
   */
  async updateTenantSettings(tenantId, settings) {
    try {
      const response = await api.put(`/tenants/${tenantId}/settings`, settings)
      return response.data
    } catch (error) {
      console.error('Update tenant settings error:', error)
      throw error
    }
  },

  /**
   * Get tenant features
   */
  async getTenantFeatures(tenantId) {
    try {
      const response = await api.get(`/tenants/${tenantId}/features`)
      return response.data
    } catch (error) {
      console.error('Get tenant features error:', error)
      throw error
    }
  },

  /**
   * Get tenant users
   */
  async getTenantUsers(tenantId, params = {}) {
    try {
      const response = await api.get(`/tenants/${tenantId}/users`, { params })
      return response.data
    } catch (error) {
      console.error('Get tenant users error:', error)
      throw error
    }
  },

  /**
   * Register a new tenant
   */
  async registerTenant(tenantData) {
    try {
      const response = await api.post('/register-tenant', tenantData)
      return response.data
    } catch (error) {
      console.error('Register tenant error:', error)
      throw error
    }
  },

  /**
   * Check subdomain availability
   */
  async checkSubdomainAvailability(subdomain) {
    try {
      const response = await api.get(`/tenants/check-subdomain/${subdomain}`)
      return response.data
    } catch (error) {
      console.error('Check subdomain availability error:', error)
      throw error
    }
  },

  /**
   * Check email availability
   */
  async checkEmailAvailability(email) {
    try {
      const response = await api.get(`/tenants/check-email/${encodeURIComponent(email)}`)
      return response.data
    } catch (error) {
      console.error('Check email availability error:', error)
      throw error
    }
  }
}
