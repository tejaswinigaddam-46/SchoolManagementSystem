import { api } from './apiClient.js'

// Building service for API operations
export const buildingService = {
  // Get all buildings for current campus
  getAllBuildings: async () => {
    try {
      const response = await api.get('/buildings')
      return response.data
    } catch (error) {
      console.error('Failed to fetch buildings:', error)
      throw error
    }
  },

  // Get building by ID
  getBuildingById: async (buildingId) => {
    try {
      const response = await api.get(`/buildings/${buildingId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch building by ID:', error)
      throw error
    }
  },

  // Create new building
  createBuilding: async (buildingData) => {
    try {
      // The backend will use campus_id from context/token
      const response = await api.post('/buildings', buildingData)
      return response.data
    } catch (error) {
      console.error('Failed to create building:', error)
      throw error
    }
  },

  // Update existing building
  updateBuilding: async (buildingId, buildingData) => {
    try {
      const response = await api.put(`/buildings/${buildingId}`, buildingData)
      return response.data
    } catch (error) {
      console.error('Failed to update building:', error)
      throw error
    }
  },

  // Delete building
  deleteBuilding: async (buildingId) => {
    try {
      const response = await api.delete(`/buildings/${buildingId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete building:', error)
      throw error
    }
  }
}