import { api } from './apiClient.js'

// Room service for API operations
export const roomService = {
  // Get all rooms for current campus
  getAllRooms: async () => {
    try {
      const response = await api.get('/rooms')
      return response.data
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      throw error
    }
  },

  // Get room by ID
  getRoomById: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch room by ID:', error)
      throw error
    }
  },

  // Get rooms by building ID
  getRoomsByBuilding: async (buildingId) => {
    try {
      const response = await api.get(`/rooms/building/${buildingId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch rooms by building:', error)
      throw error
    }
  },

  // Get room types enum values
  getRoomTypes: async () => {
    try {
      const response = await api.get('/rooms/types')
      return response.data
    } catch (error) {
      console.error('Failed to fetch room types:', error)
      throw error
    }
  },

  // Create new room
  createRoom: async (roomData) => {
    try {
      // The backend will use campus_id from context/token
      const response = await api.post('/rooms', roomData)
      return response.data
    } catch (error) {
      console.error('Failed to create room:', error)
      throw error
    }
  },

  // Update existing room
  updateRoom: async (roomId, roomData) => {
    try {
      const response = await api.put(`/rooms/${roomId}`, roomData)
      return response.data
    } catch (error) {
      console.error('Failed to update room:', error)
      throw error
    }
  },

  // Delete room
  deleteRoom: async (roomId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete room:', error)
      throw error
    }
  }
}