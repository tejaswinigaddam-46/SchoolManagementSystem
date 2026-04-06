import { api } from './apiClient.js';

// User API Service
export const userService = {
  // Get all users with pagination and filters
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search users by name and role
  searchUsers: async (searchTerm, role = null) => {
    try {
      const params = { search: searchTerm };
      if (role) params.role = role;
      const response = await api.get('/users/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get teachers for autocomplete with academic filters
  searchTeachers: async (searchTerm, filters = {}) => {
    try {
      const params = { search: searchTerm };
      
      // Add academic filters
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;
      if (filters.campusId) params.campusId = filters.campusId;
      if (filters.classId) params.classId = filters.classId;
      if (filters.curriculumId) params.curriculumId = filters.curriculumId;
      
      const response = await api.get('/users/teachers/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students by class and academic filters for autocomplete
  searchStudentsByClass: async (searchTerm, filters = {}) => {
    try {
      const params = { search: searchTerm };
      
      // Add academic filters
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;
      if (filters.campusId) params.campusId = filters.campusId;
      if (filters.classId) params.classId = filters.classId;
      if (filters.curriculumId) params.curriculumId = filters.curriculumId;
      
      const response = await api.get('/users/students/search-by-class', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get distinct user roles
  getDistinctRoles: async (campusId = null) => {
    try {
      // Pass campusId as query param if needed, but currently backend takes it from user context.
      // However, if we want to be explicit or if backend changes to use query param:
      // const params = campusId ? { campusId } : {};
      // const response = await api.get('/users/roles', { params });
      
      // Since we modified backend to use req.user.campus_id, simple get is fine.
      // But if we want to support passing it:
      const response = await api.get('/users/roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get users for attendance
  getUsersForAttendance: async (roles, academicYear) => {
    try {
      const response = await api.post('/users/attendance-search', { roles, academicYear });
      return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
  },

  // Get active users filtered by roles; backend will use auth context for campus/tenant
  getActiveUsersOfRoles: async (roles, attendanceDate = null, academicYear = null, classId = null, sectionId = null) => {
    try {
      const response = await api.post('/users/active-by-roles', { roles, attendanceDate, academicYear, classId, sectionId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  saveUserAttendance: async (attendanceDate, academicYear, attendanceData) => {
    try {
      const response = await api.post('/users/attendance/save', { attendanceDate, academicYear, attendanceData });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDailyAttendance: async ({ roles = [], academicYear = null, fromDate, toDate, classId = null, sectionId = null }) => {
    try {
      const response = await api.post('/consolidated-attendance/daily', { roles, academicYear, fromDate, toDate, classId, sectionId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default userService;
