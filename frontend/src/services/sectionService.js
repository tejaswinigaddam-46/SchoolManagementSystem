import { api } from './apiClient.js';

/**
 * Section Service: Frontend API client for section management
 */
export const sectionService = {
    /**
     * Get all sections with pagination and filtering
     */
    async getAllSections(params = {}) {
        try {
            const response = await api.get('/sections', { params });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error getting sections:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get sections'
            };
        }
    },

    /**
     * Create a new section
     */
    async createSection(sectionData) {
        try {
            const response = await api.post('/sections', sectionData);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error creating section:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to create section',
                errors: error.response?.data?.errors || []
            };
        }
    },

    /**
     * Get section by ID
     */
    async getSectionById(sectionId) {
        try {
            const response = await api.get(`/sections/${sectionId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error getting section:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get section'
            };
        }
    },

    /**
     * Update section
     */
    async updateSection(sectionId, sectionData) {
        try {
            const response = await api.put(`/sections/${sectionId}`, sectionData);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error updating section:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to update section',
                errors: error.response?.data?.errors || []
            };
        }
    },

    /**
     * Delete section
     */
    async deleteSection(sectionId) {
        try {
            const response = await api.delete(`/sections/${sectionId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error deleting section:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to delete section'
            };
        }
    },

    /**
     * Get section statistics
     */
    async getSectionStatistics() {
        try {
            const response = await api.get('/sections/statistics');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error getting section statistics:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get section statistics'
            };
        }
    },

    /**
     * Get section subjects (including teacher info)
     */
    async getSectionSubjects(sectionId) {
        try {
            // Note: This endpoint must exist on backend. 
            // If not, we might need to use /section-subjects?section_id=...
            // Let's assume a RESTful sub-resource or query filter
            const response = await api.get(`/sections/${sectionId}/subjects`);
            return {
                success: true,
                data: response.data.data || response.data
            };
        } catch (error) {
            // Fallback: try querying section_subjects endpoint if it exists
            try {
                 const response = await api.get('/section-subjects', { params: { section_id: sectionId } });
                 return {
                    success: true,
                    data: response.data.data || response.data
                 };
            } catch (e) {
                console.error('Error getting section subjects:', error);
                throw {
                    success: false,
                    message: 'Failed to get section subjects'
                };
            }
        }
    },

    /**
     * Get filter options (academic years and classes) for sections
     */
    async getFilterOptions() {
        try {
            const response = await api.get('/sections/filter-options');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error getting filter options:', error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to get filter options'
            };
        }
    }
};

export default sectionService;