import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Home, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Save,
  X,
  Loader2,
  Search,
  Filter,
  Building,
  MapPin,
  Users,
  Layers3,
  Grid3X3
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import { roomService } from '../services/roomService'
import { buildingService } from '../services/buildingService'
import { toast } from 'react-hot-toast'

// Room Form Component
const RoomForm = ({ room, onClose, onSuccess }) => {
  const { getCampusId } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    building_id: room?.building_id || '',
    room_number: room?.room_number || '',
    floor_number: room?.floor_number || 1,
    room_type: room?.room_type || '',
    capacity: room?.capacity || ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch buildings for dropdown
  const { data: buildingsResponse } = useQuery({
    queryKey: ['buildings', getCampusId()],
    queryFn: buildingService.getAllBuildings,
    enabled: !!getCampusId()
  })

  // Fetch room types for dropdown
  const { data: roomTypesResponse } = useQuery({
    queryKey: ['roomTypes'],
    queryFn: roomService.getRoomTypes
  })

  const buildings = buildingsResponse?.data || []
  const roomTypes = roomTypesResponse?.data || []

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.building_id) {
      newErrors.building_id = 'Building is required'
    }
    
    if (!formData.room_number.trim()) {
      newErrors.room_number = 'Room number is required'
    } else if (formData.room_number.trim().length > 20) {
      newErrors.room_number = 'Room number must be 20 characters or less'
    }
    
    if (!formData.floor_number || formData.floor_number < 0 || formData.floor_number > 200) {
      newErrors.floor_number = 'Floor number must be between 0 and 200'
    }
    
    if (!formData.room_type) {
      newErrors.room_type = 'Room type is required'
    }
    
    if (formData.capacity && (formData.capacity < 1 || formData.capacity > 1000)) {
      newErrors.capacity = 'Capacity must be between 1 and 1000'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const submitData = {
        building_id: parseInt(formData.building_id),
        room_number: formData.room_number.trim(),
        floor_number: parseInt(formData.floor_number),
        room_type: formData.room_type,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      }
      
      if (room) {
        // Update existing room
        const response = await roomService.updateRoom(room.room_id, submitData)
        toast.success('Room updated successfully')
        
        // Update the room in React Query cache
        if (response?.data?.room) {
          queryClient.setQueryData(['rooms', getCampusId()], (oldData) => {
            if (oldData?.data) {
              const updatedRooms = oldData.data.map(r => 
                r.room_id === room.room_id ? response.data.room : r
              )
              return {
                ...oldData,
                data: updatedRooms
              }
            }
            return oldData
          })
        }
      } else {
        // Create new room
        const response = await roomService.createRoom(submitData)
        toast.success('Room created successfully')
        
        // Add the created room to React Query cache
        if (response?.data?.room) {
          queryClient.setQueryData(['rooms', getCampusId()], (oldData) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: [response.data.room, ...oldData.data]
              }
            }
            return {
              success: true,
              data: [response.data.room]
            }
          })
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to save room')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-secondary-900 mb-1">
          {room ? 'Edit Room' : 'Add New Room'}
        </h2>
        <p className="text-sm text-secondary-600">
          {room ? 'Update room information' : 'Create a new room in your campus'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Building Selection */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Building *
          </label>
          <select
            value={formData.building_id}
            onChange={(e) => handleChange('building_id', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.building_id ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select a building</option>
            {buildings.map(building => (
              <option key={building.building_id} value={building.building_id}>
                {building.building_name}
              </option>
            ))}
          </select>
          {errors.building_id && (
            <p className="text-xs text-error-600 mt-1">{errors.building_id}</p>
          )}
        </div>

        {/* Room Number */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Room Number *
          </label>
          <input
            type="text"
            value={formData.room_number}
            onChange={(e) => handleChange('room_number', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.room_number ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter room number (e.g., 101, A-205)"
            maxLength={20}
          />
          {errors.room_number && (
            <p className="text-xs text-error-600 mt-1">{errors.room_number}</p>
          )}
          <p className="text-xs text-secondary-500 mt-1">
            {formData.room_number.length}/20 characters
          </p>
        </div>

        {/* Floor Number */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Floor Number *
          </label>
          <input
            type="number"
            value={formData.floor_number}
            onChange={(e) => handleChange('floor_number', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.floor_number ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter floor number"
            min="0"
            max="200"
          />
          {errors.floor_number && (
            <p className="text-xs text-error-600 mt-1">{errors.floor_number}</p>
          )}
          <p className="text-xs text-secondary-500 mt-1">
            Ground floor is 0, first floor is 1, etc.
          </p>
        </div>

        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Room Type *
          </label>
          <select
            value={formData.room_type}
            onChange={(e) => handleChange('room_type', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.room_type ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select room type</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          {errors.room_type && (
            <p className="text-xs text-error-600 mt-1">{errors.room_type}</p>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Capacity
          </label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.capacity ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter room capacity (optional)"
            min="1"
            max="1000"
          />
          {errors.capacity && (
            <p className="text-xs text-error-600 mt-1">{errors.capacity}</p>
          )}
          <p className="text-xs text-secondary-500 mt-1">
            Maximum number of people the room can accommodate
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm px-4 py-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-sm px-4 py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {room ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {room ? 'Update Room' : 'Create Room'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Room Card Component
const RoomCard = ({ room, onEdit, onDelete, isAdmin, buildings }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const building = buildings.find(b => b.building_id === room.building_id)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    
    try {
      await onDelete(room.room_id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const formatRoomType = (roomType) => {
    return roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Home className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">
                Room {room.room_number}
              </h3>
              <p className="text-sm text-secondary-600">
                {building?.building_name || 'Unknown Building'}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(room)}
                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit room"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-2 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                title="Delete room"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Layers3 className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-600">
                Floor {room.floor_number}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-600">
                {formatRoomType(room.room_type)}
              </span>
            </div>
          </div>
          
          {room.capacity && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-600">
                Capacity: {room.capacity}
              </span>
            </div>
          )}
          {room.available_capacity !== undefined && room.available_capacity !== null && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-600">
                Available Capacity: {room.available_capacity}
              </span>
            </div>
          )}
          {room.status && (
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === 'booked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {room.status === 'booked' ? 'Booked' : 'Available'}
              </span>
              {room.status === 'booked' && (room.booking_curriculum_code || room.booking_class_name || room.booking_section_name) && (
                <span className="text-xs text-secondary-700">
                  {[
                    room.booking_curriculum_code,
                    room.booking_class_name,
                    room.booking_section_name
                  ].filter(Boolean).join('-')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${room.room_number}? This action cannot be undone and will permanently remove all room data.`}
        confirmText="Delete Room"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

export default function CampusRoomsManagementPage() {
  console.log('%c[Campus Rooms Page Mount]', 'color: purple;');
  
  // Get auth context
  const { 
    userId,
    username, 
    isAuthenticated, 
    loading: authLoading, 
    getFullName, 
    getCampusId, 
    getCampusName,
    hasPermission 
  } = useAuth()

  const canCreateRoom =
    hasPermission && hasPermission(PERMISSIONS.ROOM_CREATE)
  const canEditRoom =
    hasPermission && hasPermission(PERMISSIONS.ROOM_EDIT)
  const canDeleteRoom =
    hasPermission && hasPermission(PERMISSIONS.ROOM_DELETE)
  const canManageRooms = canCreateRoom || canEditRoom || canDeleteRoom
  
  // Add debug logging
  console.log('🏠 CampusRoomsManagementPage - Auth State:', {
    userId,
    username,
    isAuthenticated,
    authLoading,
    getCampusId: getCampusId(),
    getCampusName: getCampusName()
  })
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [buildingFilter, setBuildingFilter] = useState('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [floorFilter, setFloorFilter] = useState('')
  
  const queryClient = useQueryClient()

  // Fetch rooms
  const { 
    data: roomsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['rooms', getCampusId()],
    queryFn: roomService.getAllRooms,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getCampusId() && isAuthenticated
  })

  // Fetch buildings for filters and room cards
  const { data: buildingsResponse } = useQuery({
    queryKey: ['buildings', getCampusId()],
    queryFn: buildingService.getAllBuildings,
    enabled: !!getCampusId() && isAuthenticated
  })

  const rooms = roomsResponse?.data || []
  const buildings = buildingsResponse?.data || []

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: roomService.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms'])
      toast.success('Room deleted successfully')
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete room')
    }
  })

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const building = buildings.find(b => b.building_id === room.building_id)
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building?.building_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBuildingFilter = !buildingFilter || room.building_id.toString() === buildingFilter
    const matchesRoomTypeFilter = !roomTypeFilter || room.room_type === roomTypeFilter
    const matchesFloorFilter = !floorFilter || room.floor_number.toString() === floorFilter
    
    return matchesSearch && matchesBuildingFilter && matchesRoomTypeFilter && matchesFloorFilter
  })

  // Get unique values for filters
  const uniqueRoomTypes = [...new Set(rooms.map(r => r.room_type))].sort()
  const uniqueFloors = [...new Set(rooms.map(r => r.floor_number))].sort((a, b) => a - b)

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    setEditingRoom(null)
  }

  // Add useEffect to track component lifecycle
  useEffect(() => {
    console.log('🏠 CampusRoomsManagementPage mounted with username:', username || 'No username')
    console.log('🏠 Auth loading:', authLoading, 'Is authenticated:', isAuthenticated)
    return () => {
      console.log('🏠 CampusRoomsManagementPage unmounted')
    }
  }, [username, authLoading, isAuthenticated])
  
  // Show loading if auth is still loading
  if (authLoading) {
    console.log('🏠 Showing loading spinner - auth is loading')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Loading user information...</p>
        </div>
      </div>
    )
  }
  
  // Show error if user is not authenticated
  if (!authLoading && (!isAuthenticated || !userId)) {
    console.log('🏠 Showing auth required - not authenticated or no userId')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Authentication Required</h2>
          <p className="text-secondary-600">Please log in to access campus rooms management.</p>
          <div className="mt-4 text-xs text-secondary-500">
            Debug: authLoading={authLoading.toString()}, isAuthenticated={isAuthenticated.toString()}, userId={userId || 'null'}
          </div>
        </div>
      </div>
    )
  }

  // Show error if no campus context
  if (!authLoading && isAuthenticated && userId && !getCampusId()) {
    console.log('🏠 Showing campus required - no campus ID')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Campus Required</h2>
          <p className="text-secondary-600">Please select a campus to manage rooms.</p>
        </div>
      </div>
    )
  }
  
  console.log('🏠 Rendering main campus rooms management content')
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">{getCampusName()}</span>
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Campus Rooms Management</h1>
        <p className="text-secondary-600">
          Welcome, {getFullName()}! Manage rooms across your campus buildings.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search rooms or buildings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 min-w-0 sm:w-80"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Building Filter */}
            {buildings.length > 0 && (
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-secondary-200 text-secondary-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Buildings</option>
                {buildings.map(building => (
                  <option key={building.building_id} value={building.building_id}>
                    {building.building_name}
                  </option>
                ))}
              </select>
            )}
            
            {/* Room Type Filter */}
            {uniqueRoomTypes.length > 0 && (
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-secondary-200 text-secondary-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                {uniqueRoomTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
            
            {/* Floor Filter */}
            {uniqueFloors.length > 0 && (
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-secondary-200 text-secondary-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Floors</option>
                {uniqueFloors.map(floor => (
                  <option key={floor} value={floor}>
                    Floor {floor}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Add Room Button - requires room create permission */}
        {canCreateRoom && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </button>
        )}
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Home className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Rooms</p>
              <p className="text-2xl font-bold text-secondary-900">{rooms.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Buildings</p>
              <p className="text-2xl font-bold text-secondary-900">{buildings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Capacity</p>
              <p className="text-2xl font-bold text-secondary-900">
                {rooms.reduce((total, room) => total + (room.capacity || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Grid3X3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Room Types</p>
              <p className="text-2xl font-bold text-secondary-900">{uniqueRoomTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="bg-white rounded-lg border border-secondary-200">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">
            Campus Rooms ({filteredRooms.length})
          </h2>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Failed to load rooms</h3>
              <p className="text-secondary-600 mb-4">
                {error.response?.data?.message || 'An error occurred while fetching rooms.'}
              </p>
              <button onClick={() => refetch()} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {searchTerm || buildingFilter || roomTypeFilter || floorFilter ? 'No rooms found' : 'No rooms yet'}
              </h3>
              <p className="text-secondary-600 mb-4">
                {searchTerm || buildingFilter || roomTypeFilter || floorFilter 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first room.'
                }
              </p>
              {canCreateRoom && !searchTerm && !buildingFilter && !roomTypeFilter && !floorFilter && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Room
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.room_id}
                  room={room}
                  onEdit={setEditingRoom}
                  onDelete={deleteMutation.mutate}
                  isAdmin={canEditRoom || canDeleteRoom}
                  buildings={buildings}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal - requires room create permission */}
      {canCreateRoom && (
        <Modal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          size="md"
          showCloseButton={false}
          closeOnBackdrop={false}
        >
          <RoomForm
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        </Modal>
      )}

      {/* Edit Room Modal - requires room edit/delete permission */}
      {canEditRoom || canDeleteRoom ? (
        <Modal 
          isOpen={!!editingRoom} 
          onClose={() => setEditingRoom(null)} 
          size="md"
          showCloseButton={false}
          closeOnBackdrop={false}
        >
          {editingRoom && (
            <RoomForm
              room={editingRoom}
              onClose={() => setEditingRoom(null)}
              onSuccess={handleEditSuccess}
            />
          )}
        </Modal>
      ) : null}
    </div>
  )
}
