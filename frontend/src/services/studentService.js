import { api } from './apiClient.js';

// Student API Service
export const studentService = {
  // Get all students with pagination and filters
  getAllStudents: async (params = {}) => {
    try {
      const response = await api.get('/students', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get filter options for student dropdowns
  getFilterOptions: async () => {
    try {
      const response = await api.get('/students/filter-options');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students by filters for section assignment or display
  getStudentsByFilters: async (filters) => {
    try {
      const response = await api.get('/students/by-filters', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students by section ID
  getStudentsBySection: async (classId, sectionId, academicYearId) => {
    try {
      const response = await api.get(`/students/section/${classId}/${sectionId}`, {
        params: { academicYearId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students linked to a parent (children list)
  getParentStudents: async (parentUsername) => {
    try {
      const response = await api.get(`/students/parents/${parentUsername}/students`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Register a new student
  registerStudent: async (studentData) => {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student by admission number
  getStudentByAdmissionNumber: async (admissionNumber) => {
    try {
      const response = await api.get(`/students/admission/${admissionNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student by roll number
  getStudentByRoll: async (rollNumber, academicYear) => {
    try {
      const response = await api.get(`/students/roll/${rollNumber}`, {
        params: { academicYear }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get complete student data for editing (includes all related data)
  getCompleteStudentForEdit: async (username) => {
    try {
      const response = await api.get(`/students/username/${username}/edit`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student by username
  getStudentByUsername: async (username) => {
    try {
      const response = await api.get(`/students/username/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export selected students to Excel
  exportStudents: async (usernames) => {
    try {
      const response = await api.post('/students/export', { usernames }, {
        responseType: 'blob'
      });
      
      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download bulk import template
  downloadTemplate: async () => {
    try {
      const response = await api.get('/students/import/template', {
        responseType: 'blob'
      });
      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bulk import students
  bulkImport: async (formData) => {
    try {
      const response = await api.post('/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      // Create a link to download the result file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Import_Result.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      return {
        success: parseInt(response.headers['x-import-success'] || 0),
        failed: parseInt(response.headers['x-import-failed'] || 0)
      };
    } catch (error) {
      if (error.response?.data instanceof Blob) {
         const text = await error.response.data.text();
         try {
             const json = JSON.parse(text);
             throw json || error;
         } catch (e) {
             throw error;
         }
      }
      throw error.response?.data || error;
    }
  },

  // Bulk update students
  bulkUpdate: async (formData) => {
    try {
      const response = await api.post('/students/bulk-update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      // If response is JSON (success), parse it
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        return JSON.parse(text);
      }

      // If response is Excel (failures), download it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Update_Result.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true, message: 'Update completed with some errors. Please check the downloaded file.' };
    } catch (error) {
      if (error.response?.data instanceof Blob) {
         const text = await error.response.data.text();
         try {
             const json = JSON.parse(text);
             throw json || error;
         } catch (e) {
             throw error;
         }
      }
      throw error.response?.data || error;
    }
  },

  // Update student by username
  updateStudentByUsername: async (username, updateData) => {
    try {
      const response = await api.put(`/students/username/${username}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update student basic information
  updateStudent: async (studentId, updateData) => {
    try {
      const response = await api.put(`/students/${studentId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update student enrollment
  updateStudentEnrollment: async (studentId, enrollmentData) => {
    try {
      const response = await api.put(`/students/${studentId}/enrollment`, enrollmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete student (soft delete)
  deleteStudent: async (studentId) => {
    try {
      const response = await api.delete(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete student by username
  deleteStudentByUsername: async (username) => {
    try {
      const response = await api.delete(`/students/username/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students by class and section
  getStudentsByClassSection: async (studentClass, section, academicYear) => {
    try {
      const response = await api.get(`/students/class/${studentClass}/section/${section}`, {
        params: { academicYear }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student statistics
  getStudentStatistics: async (academicYear = null) => {
    try {
      const params = academicYear ? { academicYear } : {};
      const response = await api.get('/students/statistics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students by filters (for section assignment)
  getStudentsByFilters: async (params = {}) => {
    try {
      const response = await api.get('/students/by-filters', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting students by filters:', error);
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get students'
      };
    }
  },

  // Assign students to section
  assignStudentsToSection: async (assignmentData) => {
    try {
      const response = await api.post('/students/assign-to-section', assignmentData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error assigning students to section:', error);
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to assign students to section'
      };
    }
  },

  // Update student section assignment
  updateStudentSection: async (studentId, updateData) => {
    try {
      const response = await api.put(`/students/${studentId}/section`, updateData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error updating student section:', error);
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update student section'
      };
    }
  },

  // Deassign student from section
  deassignStudentSection: async (studentId, academicYearId) => {
    try {
      const response = await api.delete(`/students/${studentId}/section`, {
        data: { academic_year_id: academicYearId }
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error deassigning student from section:', error);
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to deassign student from section'
      };
    }
  }
};

export default studentService;
