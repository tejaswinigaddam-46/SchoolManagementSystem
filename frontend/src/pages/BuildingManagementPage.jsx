import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Building, 
  Plus, 
  Search,
  Layers,
  X,
  BookOpen
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import { buildingService } from '../services/buildingService'
import { toast } from 'react-hot-toast'
import { EditButton, DeleteButton, ActionButtonGroup } from '../components/ui/ActionButtons'
import RequiredAsterisk from '../components/ui/RequiredAsterisk'

// InputField component for consistent form styling
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, disabled = false, error = null, placeholder = '' }) => (
  <div className={`${className}`}>
    <label className="form-label">
      {label} {required && <RequiredAsterisk />}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={`input ${error ? 'error' : ''}`}
        required={required}
        disabled={disabled}
      >
        <option value="">Select {label}</option>
        {options && options.map(option => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={`input ${error ? 'error' : ''}`}
        required={required}
        disabled={disabled}
        placeholder={placeholder || `Enter ${label}`}
      />
    )}
    {error && <p className="form-error">{error}</p>}
  </div>
);

// Building Form Component
const BuildingForm = ({ building, onClose, onSuccess }) => {
  const { getCampusId, getCampusName } = useAuth()
  const campusName = getCampusName()
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField 
          label="Building Name" 
          name="building_name" 
          required 
          formData={formData} 
          handleInputChange={handleInputChange}
          error={errors.building_name}
          placeholder="e.g. Science Block, Main Building"
        />
        
        <InputField 
          label="Number of Floors" 
          name="number_of_floors" 
          type="number"
          required 
          formData={formData} 
          handleInputChange={handleInputChange}
          error={errors.number_of_floors}
          placeholder="e.g. 3"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-secondary-100">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner className="h-4 w-4 mr-2" />
          ) : (
            building ? <BookOpen className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
          )}
          {building ? 'Update Building' : 'Create Building'}
        </button>
      </div>
    </form>
  )
}

export default function BuildingManagementPage() {
  // Get auth context
  const {
    userId, 
    isAuthenticated, 
    loading: authLoading, 
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
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState(null)
  const [deleting, setDeleting] = useState(false)
  
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
    enabled: !!getCampusId() && isAuthenticated
  })

  const buildings = buildingsResponse?.data || []

  // Filter buildings
  const filteredBuildings = buildings.filter(building => {
    return building.building_name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    setEditingBuilding(null)
  }

  const handleDeleteBuilding = async (buildingId) => {
    try {
      setDeleting(true)
      await buildingService.deleteBuilding(buildingId)
      queryClient.invalidateQueries(['buildings'])
      toast.success('Building deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete building')
    } finally {
      setDeleting(false)
    }
  }

  // Show loading if auth is still loading
  if (authLoading) {
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
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Authentication Required</h2>
          <p className="text-secondary-600">Please log in to access building management.</p>
        </div>
      </div>
    )
  }

  // Show error if no campus context
  if (!authLoading && isAuthenticated && userId && !getCampusId()) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Campus Required</h2>
          <p className="text-secondary-600">Please select a campus to manage buildings.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-3xl text-secondary-900 mb-2">Building Management</h1>
          <p className="text-secondary-600">
            Campus: {getCampusName()}
          </p>
        </div>
        {canCreateBuilding && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Building
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search building names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Building className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-600">Total Buildings</p>
              <p className="text-2xl font-bold text-secondary-900">{buildings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Layers className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-600">Total Floors</p>
              <p className="text-2xl font-bold text-secondary-900">
                {buildings.reduce((total, building) => total + (building.number_of_floors || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings List */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-soft">
        <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary-900">Buildings List</h2>
          <span className="px-3 py-1 bg-secondary-200 text-secondary-700 text-xs font-bold rounded-full uppercase tracking-wider">
            {filteredBuildings.length} {filteredBuildings.length === 1 ? 'Building' : 'Buildings'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <LoadingSpinner className="w-10 h-10 text-primary-600 mb-4" />
              <p className="text-secondary-500 font-medium">Loading buildings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-4">
              <p className="text-error-600 font-medium mb-4">
                {error.response?.data?.message || 'An error occurred while fetching buildings.'}
              </p>
              <button onClick={() => refetch()} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-secondary-100 rounded-full mb-4">
                <Building className="h-10 w-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">No buildings found</h3>
              <p className="text-secondary-500 max-w-xs mx-auto">
                {searchTerm ? `No results for "${searchTerm}". Try a different search term.` : 'Get started by adding your first building.'}
              </p>
              {!searchTerm && canCreateBuilding && (
                <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-6">
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Building
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Building Name</th>
                  <th>Number of Floors</th>
                  {canManageBuildings && (
                    <th className="w-24">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredBuildings.map((building) => (
                  <tr key={building.building_id} className="hover:bg-secondary-50 transition-colors">
                    <td className="font-semibold text-secondary-900">{building.building_name}</td>
                    <td>
                      <span className="badge-secondary">
                        {building.number_of_floors} floor{building.number_of_floors !== 1 ? 's' : ''}
                      </span>
                    </td>
                    {canManageBuildings && (
                      <td>
                        <ActionButtonGroup>
                          {canEditBuilding && (
                            <EditButton 
                              onClick={() => setEditingBuilding(building)}
                              title="Edit building"
                            />
                          )}
                          {canDeleteBuilding && (
                            <DeleteButton 
                              onClick={() => handleDeleteBuilding(building.building_id)}
                              isDeleting={deleting}
                              confirmMessage={`Are you sure you want to delete "${building.building_name}"? This action cannot be undone.`}
                              title="Delete building"
                            />
                          )}
                        </ActionButtonGroup>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Building Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Add New Building"
        showCloseButton={false}
      >
        <BuildingForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </Modal>

      {/* Edit Building Modal */}
      <Modal 
        isOpen={!!editingBuilding} 
        onClose={() => setEditingBuilding(null)} 
        title="Edit Building"
        showCloseButton={false}
      >
        <BuildingForm
          building={editingBuilding}
          onClose={() => setEditingBuilding(null)}
          onSuccess={handleEditSuccess}
        />
      </Modal>
    </div>
  )
}
