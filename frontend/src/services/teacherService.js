import { api } from './apiClient.js'

const teacherService = {
  getAllTeachers: async () => {
    try {
      // Using employees endpoint with role filter since /teachers doesn't exist
      // Note: Backend might expect 'job_title' or similar if 'role' isn't directly filterable on employees endpoint
      // But usually employees endpoint supports standard filters.
      // If the backend filters by user role, this is correct.
      const response = await api.get('/employees', {
        params: {
          limit: 1000
        }
      });

      const payload = response.data;
      const employees =
        payload?.data?.employees ||
        payload?.employees ||
        [];

      const list = Array.isArray(employees) ? employees : [];
      return list.filter(
        e =>
          e.job_title === 'Teacher' ||
          e.role === 'Teacher' ||
          (e.user && e.user.role === 'Teacher')
      );
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },
};

export default teacherService;
