import { api } from './apiClient.js';

// Employee API Service
export const employeeService = {
  // Get all employees with pagination and filters
  getAllEmployees: async (params = {}) => {
    try {
      const response = await api.get('/employees', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get employee by username
  getEmployeeByUsername: async (username) => {
    try {
      const response = await api.get(`/employees/username/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get employee by employment ID
  getEmployeeByEmploymentId: async (employmentId) => {
    try {
      const response = await api.get(`/employees/employment/${employmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get complete employee data for editing (includes all related data)
  getCompleteEmployeeForEdit: async (username) => {
    try {
      const response = await api.get(`/employees/username/${username}/edit`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new employee with all details
  createEmployee: async (employeeData) => {
    try {
      const response = await api.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update employee by username
  updateEmployeeByUsername: async (username, updateData) => {
    try {
      const response = await api.put(`/employees/username/${username}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update employment details
  updateEmploymentDetails: async (employmentId, employmentData) => {
    try {
      const response = await api.put(`/employees/employment/${employmentId}`, employmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete employee (soft delete)
  deleteEmployeeByUsername: async (username) => {
    try {
      const response = await api.delete(`/employees/username/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get filter options for employee dropdowns
  getFilterOptions: async () => {
    try {
      const response = await api.get('/employees/filter-options');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get employees by campus
  getEmployeesByCampus: async (campusId) => {
    try {
      const response = await api.get(`/employees/campus/${campusId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get employees by department
  getEmployeesByDepartment: async (department, campusId = null) => {
    try {
      const params = campusId ? { campus_id: campusId } : {};
      const response = await api.get(`/employees/department/${department}`, { params, suppressErrorToast: true });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get employee statistics
  getEmployeeStatistics: async (campusId = null) => {
    try {
      const params = campusId ? { campus_id: campusId } : {};
      const response = await api.get('/employees/statistics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if employee ID is available
  checkEmployeeIdAvailability: async (employeeId, campusId) => {
    try {
      const response = await api.get('/employees/check-employee-id', {
        params: { employee_id: employeeId, campus_id: campusId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if username is available
  checkUsernameAvailability: async (username) => {
    try {
      const response = await api.get('/employees/check-username', {
        params: { username }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get enum values for dropdowns
  getEnumValues: async () => {
    try {
      const response = await api.get('/employees/enum-values');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download bulk import template for employees
  downloadTemplate: async () => {
    try {
      const response = await api.get('/employees/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bulk import employees
  bulkImport: async (formData) => {
    try {
      const response = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Import_Result.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return {
        success: parseInt(response.headers['x-import-success'] || 0),
        failed: parseInt(response.headers['x-import-failed'] || 0)
      };
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        return await new Promise((resolve, reject) => {
          reader.onload = () => {
            try {
              const parsed = JSON.parse(reader.result);
              reject(parsed);
            } catch {
              reject({ message: 'Import failed' });
            }
          };
          reader.onerror = () => reject({ message: 'Import failed' });
          reader.readAsText(error.response.data);
        });
      }
      throw error.response?.data || error;
    }
  },

  // Bulk update employees
  bulkUpdate: async (formData) => {
    try {
      const response = await api.post('/employees/bulk-update', formData, {
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
      link.setAttribute('download', 'Employee_Update_Result.xlsx');
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

  // Export selected employees to Excel
  exportEmployees: async (usernames) => {
    try {
      const response = await api.post('/employees/export', { usernames }, {
        responseType: 'blob'
      });
      
      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default employeeService;
