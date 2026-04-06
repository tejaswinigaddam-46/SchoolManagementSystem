import { api } from './apiClient.js'

// Subject service for API operations
export const subjectService = {
  // Get all subjects for a campus
  getAllSubjects: async (campusId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = `/subjects/${campusId}${queryParams ? `?${queryParams}` : ''}`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      throw error
    }
  },

  // Get subject by ID
  getSubjectById: async (campusId, subjectId) => {
    try {
      const response = await api.get(`/subjects/${campusId}/${subjectId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch subject by ID:', error)
      throw error
    }
  },

  // Create new subject
  createSubject: async (campusId, subjectData) => {
    try {
      const response = await api.post(`/subjects/${campusId}`, subjectData)
      return response.data
    } catch (error) {
      console.error('Failed to create subject:', error)
      throw error
    }
  },

  // Update existing subject
  updateSubject: async (campusId, subjectId, subjectData) => {
    try {
      const response = await api.put(`/subjects/${campusId}/${subjectId}`, subjectData)
      return response.data
    } catch (error) {
      console.error('Failed to update subject:', error)
      throw error
    }
  },

  // Delete subject
  deleteSubject: async (campusId, subjectId) => {
    try {
      const response = await api.delete(`/subjects/${campusId}/${subjectId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete subject:', error)
      throw error
    }
  }
}

export default subjectService