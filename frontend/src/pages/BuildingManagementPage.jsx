import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Save,
  X,
  Loader2,
  Search,
  Filter,
  Layers,
  MapPin
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import { buildingService } from '../services/buildingService'
import { toast } from 'react-hot-toast'

// Building Form Component
const BuildingForm = ({ building, onClose, onSuccess }) => {
  const { getCampusId } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    building_name: building?.building_name || '',
    number_of_floors: building?.number_of_floors || 1
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.building_name.trim()) {
      newErrors.building_name = 'Building name is required'
    } else if (formData.building_name.trim().length > 100) {
      newErrors.building_name = 'Building name must be 100 characters or less'
    }
    
    if (!formData.number_of_floors || formData.number_of_floors < 1 || formData.number_of_floors > 200) {
      newErrors.number_of_floors = 'Number of floors must be between 1 and 200'
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
        building_name: formData.building_name.trim(),
        number_of_floors: parseInt(formData.number_of_floors)
      }
      
      if (building) {
        // Update existing building
        const response = await buildingService.updateBuilding(building.building_id, submitData)
        toast.success('Building updated successfully')
        
        // Update the building in React Query cache
        if (response?.data?.building) {
          queryClient.setQueryData(['buildings', getCampusId()], (oldData) => {
            if (oldData?.data) {
              const updatedBuildings = oldData.data.map(b => 
                b.building_id === building.building_id ? response.data.building : b
              )
              return {
                ...oldData,
                data: updatedBuildings
              }
            }
            return oldData
          })
        }
      } else {
        // Create new building
        const response = await buildingService.createBuilding(submitData)
        toast.success('Building created successfully')
        
        // Add the created building to React Query cache
        if (response?.data?.building) {
          queryClient.setQueryData(['buildings', getCampusId()], (oldData) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: [response.data.building, ...oldData.data]
              }
            }
            return {
              success: true,
              data: [response.data.building]
            }
          })
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to save building')
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
          {building ? 'Edit Building' : 'Add New Building'}
        </h2>
        <p className="text-sm text-secondary-600">
          {building ? 'Update building information' : 'Create a new building in your campus'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Building Name */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Building Name *
          </label>
          <input
            type="text"
            value={formData.building_name}
            onChange={(e) => handleChange('building_name', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.building_name ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter building name (e.g., Main Building, Science Block)"
            maxLength={100}
          />
          {errors.building_name && (
            <p className="text-xs text-error-600 mt-1">{errors.building_name}</p>
          )}
          <p className="text-xs text-secondary-500 mt-1">
            {formData.building_name.length}/100 characters
          </p>
        </div>

        {/* Number of Floors */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Number of Floors *
          </label>
          <input
            type="number"
            value={formData.number_of_floors}
            onChange={(e) => handleChange('number_of_floors', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.number_of_floors ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter number of floors"
            min="1"
            max="200"
          />
          {errors.number_of_floors && (
            <p className="text-xs text-error-600 mt-1">{errors.number_of_floors}</p>
          )}
          <p className="text-xs text-secondary-500 mt-1">
            Must be between 1 and 200 floors
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
                {building ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {building ? 'Update Building' : 'Create Building'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Building Card Component
const BuildingCard = ({ building, onEdit, onDelete, isAdmin }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    
    try {
      await onDelete(building.building_id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">
                {building.building_name}
              </h3>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(building)}
                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit building"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-2 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                title="Delete building"
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
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1">
              <Layers className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-600">
                {building.number_of_floors} floor{building.number_of_floors !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Building"
        message={`Are you sure you want to delete "${building.building_name}"? This action cannot be undone and will permanently remove all building data.`}
        confirmText="Delete Building"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

export default function BuildingManagementPage() {
  console.log('%c[Building Page Mount]', 'color: yellow;');
  
  // Get auth context - use the actual properties available
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
  
  const canCreateBuilding =
    hasPermission && hasPermission(PERMISSIONS.BUILDING_CREATE)
  const canEditBuilding =
    hasPermission && hasPermission(PERMISSIONS.BUILDING_EDIT)
  const canDeleteBuilding =
    hasPermission && hasPermission(PERMISSIONS.BUILDING_DELETE)
  const canManageBuildings = canCreateBuilding || canEditBuilding || canDeleteBuilding
  
  // Add debug logging with correct properties
  console.log('🏢 BuildingManagementPage - Auth State:', {
    userId,
    username,
    isAuthenticated,
    authLoading,
    getCampusId: getCampusId(),
    getCampusName: getCampusName(),
    canManageBuildings
  })
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState(null)
  const [floorFilter, setFloorFilter] = useState('')
  
  const queryClient = useQueryClient()

  // Fetch buildings
  const { 
    data: buildingsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['buildings', getCampusId()],
    queryFn: buildingService.getAllBuildings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getCampusId() && isAuthenticated // Only fetch when we have a campus ID and are authenticated
  })

  const buildings = buildingsResponse?.data || []

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: buildingService.deleteBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings'])
      toast.success('Building deleted successfully')
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete building')
    }
  })

  // Filter buildings
  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = building.building_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFloorFilter = !floorFilter || building.number_of_floors.toString() === floorFilter
    return matchesSearch && matchesFloorFilter
  })

  // Get unique floor counts for filter
  const uniqueFloors = [...new Set(buildings.map(b => b.number_of_floors))].sort((a, b) => a - b)

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    setEditingBuilding(null)
  }

  // Add useEffect to track if component stays mounted
  useEffect(() => {
    console.log('🏢 BuildingManagementPage mounted with username:', username || 'No username')
    console.log('🏢 Auth loading:', authLoading, 'Is authenticated:', isAuthenticated)
    return () => {
      console.log('🏢 BuildingManagementPage unmounted')
    }
  }, [username, authLoading, isAuthenticated])
  
  // Show loading if auth is still loading
  if (authLoading) {
    console.log('🏢 Showing loading spinner - auth is loading')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Loading user information...</p>
        </div>
      </div>
    )
  }
  
  // Show error if user is not authenticated - Fixed condition
  if (!authLoading && (!isAuthenticated || !userId)) {
    console.log('🏢 Showing auth required - not authenticated or no userId')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Authentication Required</h2>
          <p className="text-secondary-600">Please log in to access building management.</p>
          <div className="mt-4 text-xs text-secondary-500">
            Debug: authLoading={authLoading.toString()}, isAuthenticated={isAuthenticated.toString()}, userId={userId || 'null'}
          </div>
        </div>
      </div>
    )
  }

  // Show error if no campus context
  if (!authLoading && isAuthenticated && userId && !getCampusId()) {
    console.log('🏢 Showing campus required - no campus ID')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Campus Required</h2>
          <p className="text-secondary-600">Please select a campus to manage buildings.</p>
        </div>
      </div>
    )
  }
  
  console.log('🏢 Rendering main building management content')
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">{getCampusName()}</span>
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Building Management</h1>
        <p className="text-secondary-600">
          Welcome, {getFullName()}! Manage buildings in your campus.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search buildings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 min-w-0 sm:w-80"
            />
          </div>
          
          {/* Floor Filter */}
          {uniqueFloors.length > 0 && (
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-secondary-200 text-secondary-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Floors</option>
              {uniqueFloors.map(floors => (
                <option key={floors} value={floors}>
                  {floors} floor{floors !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Add Building Button - requires building create permission */}
        {canCreateBuilding && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Building
          </button>
        )}
      </div>

      {/* Building Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Buildings</p>
              <p className="text-2xl font-bold text-secondary-900">{buildings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Layers className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Floors</p>
              <p className="text-2xl font-bold text-secondary-900">
                {buildings.reduce((total, building) => total + (building.number_of_floors || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Average Floors</p>
              <p className="text-2xl font-bold text-secondary-900">
                {buildings.length > 0 
                  ? (buildings.reduce((total, building) => total + building.number_of_floors, 0) / buildings.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Building List */}
      <div className="bg-white rounded-lg border border-secondary-200">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">
            Campus Buildings ({filteredBuildings.length})
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
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Failed to load buildings</h3>
              <p className="text-secondary-600 mb-4">
                {error.response?.data?.message || 'An error occurred while fetching buildings.'}
              </p>
              <button onClick={() => refetch()} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {searchTerm || floorFilter ? 'No buildings found' : 'No buildings yet'}
              </h3>
              <p className="text-secondary-600 mb-4">
                {searchTerm || floorFilter 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first building.'
                }
              </p>
              {canManageBuildings && !searchTerm && !floorFilter && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Building
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.building_id}
                  building={building}
                  onEdit={setEditingBuilding}
                  onDelete={deleteMutation.mutate}
                  isAdmin={canManageBuildings}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Building Modal - Only for users with building create permission */}
      {canCreateBuilding && (
        <Modal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          size="md"
          showCloseButton={false}
          closeOnBackdrop={false}
        >
          <BuildingForm
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        </Modal>
      )}

      {/* Edit Building Modal - Only for users with building edit/delete permission */}
      {canEditBuilding || canDeleteBuilding ? (
        <Modal 
          isOpen={!!editingBuilding} 
          onClose={() => setEditingBuilding(null)} 
          size="md"
          showCloseButton={false}
          closeOnBackdrop={false}
        >
          {editingBuilding && (
            <BuildingForm
              building={editingBuilding}
              onClose={() => setEditingBuilding(null)}
              onSuccess={handleEditSuccess}
            />
          )}
        </Modal>
      ) : null}
    </div>
  )
}
