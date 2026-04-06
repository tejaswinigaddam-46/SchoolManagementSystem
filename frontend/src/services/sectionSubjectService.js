import { api } from './apiClient.js'

const sectionSubjectService = {
  assignSubjectsToSection: async (assignments) => {
    try {
      const response = await api.post('/section-subjects/assign', { assignments });
      return response.data;
    } catch (error) {
      console.error('Error assigning subjects to section:', error);
      throw error;
    }
  },
  getAssignmentsBySections: async (sectionIds) => {
    try {
      const response = await api.get(`/section-subjects`, { params: { section_ids: sectionIds.join(',') } });
      return response.data;
    } catch (error) {
      console.error('Error fetching section-subject assignments:', error);
      throw error;
    }
  },
  unassignSubjectsFromSection: async (sectionId, subjectIds) => {
    try {
      const response = await api.post('/section-subjects/unassign', { section_id: sectionId, subject_ids: subjectIds });
      return response.data;
    } catch (error) {
      console.error('Error unassigning subjects from section:', error);
      throw error;
    }
  }
};

export default sectionSubjectService;
