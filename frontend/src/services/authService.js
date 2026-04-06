import { api } from './apiClient.js'

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /* Login user  */
  async login(credentials) {
    try {
      console.log('🔐 Auth service: Attempting login')
      const response = await api.post('/auth/login', credentials)
      console.log('🔐 Auth service: Login successful')
      return response.data
    } catch (error) {
      console.error('Login service error:', error)
      throw error
    }
  },

  /* Logout user */
  async logout() {
    try {
      console.log('🟣 authService.logout() called - Making API request to /auth/logout')
      const response = await api.post('/auth/logout')
      console.log('🟢 authService.logout() - Backend API response received:', response.data)
      return response.data
    } catch (error) {
      console.error('🔴 authService.logout() - API call failed:', error)
      // Don't throw error for logout, as we want to clear local state anyway
      return { success: true }
    }
  },

  /* Resolve tenant by mobile number */
  async resolveTenant(mobileNumber) {
    try {
      const response = await api.post('/auth/resolve-tenant', { mobileNumber })
      return response.data
    } catch (error) {
      console.error('Resolve tenant error:', error)
      throw error
    }
  },

  /* Login with specific tenant subdomain (for mobile) */
  async mobileLogin(credentials, subdomain) {
    try {
      const response = await api.post('/auth/login', credentials, {
        headers: {
          'X-Tenant-Subdomain': subdomain
        }
      })
      return response.data
    } catch (error) {
      console.error('Mobile login error:', error)
      throw error
    }
  },

  /* Register new user */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Register service error:', error)
      throw error
    }
  },

  /* Verify token and get user info */
  async verifyToken(token) {
    try {
      // Set token temporarily for this request
      const response = await api.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  },

  /* Refresh access token */
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh')
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  },

  /* Get current user profile */
  async getProfile() {
    try {
      console.log('🔐 Auth service: Getting profile')
      const response = await api.get('/auth/profile')
      console.log('🔐 Auth service: Profile retrieved')
      return response.data
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  },

  /* Update user profile */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData)
      return response.data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  /**
   * Change password
   */
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData)
      return response.data
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }
}