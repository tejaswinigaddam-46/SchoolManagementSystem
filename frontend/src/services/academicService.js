import { api } from './apiClient.js'

// Academic service for API operations
export const academicService = {
  // ==================== CURRICULA OPERATIONS ====================
  
  // Get all curricula for a campus
  getAllCurricula: async (campusId) => {
    try {
      const response = await api.get(`/academics/${campusId}/curricula`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch curricula:', error)
      throw error
    }
  },

  // Get curriculum by ID
  getCurriculumById: async (campusId, curriculumId) => {
    try {
      const response = await api.get(`/academics/${campusId}/curricula/${curriculumId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch curriculum by ID:', error)
      throw error
    }
  },

  // Create new curriculum
  createCurriculum: async (campusId, curriculumData) => {
    try {
      const response = await api.post(`/academics/${campusId}/curricula`, curriculumData)
      return response.data
    } catch (error) {
      console.error('Failed to create curriculum:', error)
      throw error
    }
  },

  // Update existing curriculum
  updateCurriculum: async (campusId, curriculumId, curriculumData) => {
    try {
      const response = await api.put(`/academics/${campusId}/curricula/${curriculumId}`, curriculumData)
      return response.data
    } catch (error) {
      console.error('Failed to update curriculum:', error)
      throw error
    }
  },

  // Delete curriculum
  deleteCurriculum: async (campusId, curriculumId) => {
    try {
      const response = await api.delete(`/academics/${campusId}/curricula/${curriculumId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete curriculum:', error)
      throw error
    }
  },

  // ==================== ACADEMIC YEARS OPERATIONS ====================
  
  // Get all academic years for a campus
  getAllAcademicYears: async (campusId) => {
    try {
      const response = await api.get(`/academics/${campusId}/academic-years`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
      throw error
    }
  },

  // Get academic year by ID
  getAcademicYearById: async (campusId, academicYearId) => {
    try {
      const response = await api.get(`/academics/${campusId}/academic-years/${academicYearId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch academic year by ID:', error)
      throw error
    }
  },

  // Create new academic year
  createAcademicYear: async (campusId, academicYearData) => {
    try {
      const response = await api.post(`/academics/${campusId}/academic-years`, academicYearData)
      return response.data
    } catch (error) {
      console.error('Failed to create academic year:', error)
      throw error
    }
  },

  // Update existing academic year
  updateAcademicYear: async (campusId, academicYearId, academicYearData) => {
    try {
      const response = await api.put(`/academics/${campusId}/academic-years/${academicYearId}`, academicYearData)
      return response.data
    } catch (error) {
      console.error('Failed to update academic year:', error)
      throw error
    }
  },

  // Delete academic year
  deleteAcademicYear: async (campusId, academicYearId) => {
    try {
      const response = await api.delete(`/academics/${campusId}/academic-years/${academicYearId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete academic year:', error)
      throw error
    }
  },

  // Get academic year options for dropdown
  getAcademicYearOptions: async (campusId) => {
    try {
      const response = await api.get(`/academics/${campusId}/academic-year-options`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch academic year options:', error)
      throw error
    }
  },

  // Get distinct year names for dropdown
  getDistinctYearNames: async (campusId) => {
    try {
      const response = await api.get(`/academics/${campusId}/year-names`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch year names:', error)
      throw error
    }
  },

  // Get distinct media for dropdown
  getDistinctMedia: async (campusId) => {
    try {
      const response = await api.get(`/academics/${campusId}/media`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch media options:', error)
      throw error
    }
  },

  // Get academic year ID by combination
  getAcademicYearIdByCombo: async (campusId, yearName, yearType, curriculumId, medium) => {
    try {
      const response = await api.get(`/academics/${campusId}/academic-year-id`, {
        params: { yearName, yearType, curriculumId, medium }
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch academic year ID by combination:', error)
      throw error
    }
  }
}