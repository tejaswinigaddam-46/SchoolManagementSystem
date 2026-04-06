import { api } from './apiClient.js';

export const eventService = {
  async getEvents(campusId, academicYearId) {
    try {
      const response = await api.get('/events', { params: { academic_year_id: academicYearId } });
      return { success: true, data: response.data.data };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createEvent(campusId, eventData) {
    try {
      // Backend expects a single event object
      const response = await api.post('/events', eventData);
      return { success: true, data: response.data.data };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Kept for backward compatibility if needed, but redirects to createEvent
  async createEvents(campusId, eventsPayload) {
    if (Array.isArray(eventsPayload) && eventsPayload.length > 0) {
        return this.createEvent(campusId, eventsPayload[0]);
    }
    return this.createEvent(campusId, eventsPayload);
  },

  async updateEvent(campusId, eventId, eventData, mode, instanceDate) {
    try {
      const params = {};
      if (mode) params.mode = mode;
      if (instanceDate) params.instanceDate = instanceDate;

      const response = await api.put(`/events/${eventId}`, eventData, { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async deleteEvent(campusId, eventId, mode, instanceDate) {
    try {
      const params = {};
      if (mode) params.mode = mode;
      if (instanceDate) params.instanceDate = instanceDate;

      const response = await api.delete(`/events/${eventId}`, { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default eventService;
