import { api } from './apiClient.js'

// Campus service for API operations
export const campusService = {
  // Get all campuses for current tenant
  getAllCampuses: async () => {
    try {
      const response = await api.get('/campuses')
      return response.data
    } catch (error) {
      console.error('Failed to fetch campuses:', error)
      throw error
    }
  },

  // Get campus by ID
  getCampusById: async (campusId) => {
    try {
      const response = await api.get(`/campuses/${campusId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch campus by ID:', error)
      throw error
    }
  },

  // Create new campus
  createCampus: async (campusData) => {
    try {
      // The backend now uses req.user.tenantId, so we don't need to send tenant_id
      const response = await api.post('/campuses', campusData)
      return response.data
    } catch (error) {
      console.error('Failed to create campus:', error)
      throw error
    }
  },

  // Update existing campus
  updateCampus: async (campusId, campusData) => {
    try {
      const response = await api.put(`/campuses/${campusId}`, campusData)
      return response.data
    } catch (error) {
      console.error('Failed to update campus:', error)
      throw error
    }
  },

  // Delete campus
  deleteCampus: async (campusId) => {
    try {
      const response = await api.delete(`/campuses/${campusId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete campus:', error)
      throw error
    }
  }
}