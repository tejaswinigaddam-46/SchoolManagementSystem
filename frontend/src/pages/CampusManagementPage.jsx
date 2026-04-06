import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Layers,
  Building,
  AlertCircle,
  CheckCircle,
  Shield,
  Save,
  X,
  Loader2,
  Info,
  Search,
  Filter,
  Star,
  StarOff
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import PhoneInput from '../components/ui/PhoneInput'
import PhoneNumberDisplay from '../components/ui/PhoneNumberDisplay'
import Modal from '../components/ui/Modal'

// Campus Form Component moved outside to prevent re-creation on every render
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { useAuth } from '../contexts/AuthContext'
import {campusService} from '../services/campusService'
import { PERMISSIONS } from '../config/permissions'
import { toast } from 'react-hot-toast'

// Campus Form Component moved outside to prevent re-creation on every render
const CampusForm = ({ campus, onClose, onSuccess }) => {
  const { getTenantId } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    campus_name: campus?.campus_name || '',
    address: campus?.address || '',
    phone_number: campus?.phone_number || '',
    email: campus?.email || '',
    is_main_campus: campus?.is_main_campus || false,
    year_established: campus?.year_established || '',
    no_of_floors: campus?.no_of_floors || 1
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.campus_name.trim()) {
      newErrors.campus_name = 'Campus name is required'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    if (formData.phone_number && !/^[\+]?[0-9\s\-\(\)]{10,20}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Invalid phone number format'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (formData.year_established && (
      formData.year_established < 1500 || 
      formData.year_established > new Date().getFullYear()
    )) {
      newErrors.year_established = 'Invalid year'
    }
    
    if (formData.no_of_floors < 1 || formData.no_of_floors > 200) {
      newErrors.no_of_floors = 'Number of floors must be between 1 and 200'
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
        ...formData,
        year_established: formData.year_established ? parseInt(formData.year_established) : null,
        no_of_floors: parseInt(formData.no_of_floors)
      }
      
      if (campus) {
        // Update existing campus
        const response = await campusService.updateCampus(campus.campus_id, submitData)
        toast.success('Campus updated successfully')
        
        // Update the campus in React Query cache
        if (response?.data?.campus) {
          queryClient.setQueryData(['campuses', getTenantId()], (oldData) => {
            if (oldData?.data) {
              const updatedCampuses = oldData.data.map(c => 
                c.campus_id === campus.campus_id ? response.data.campus : c
              )
              return {
                ...oldData,
                data: updatedCampuses
              }
            }
            return oldData
          })
        }
      } else {
        // Create new campus
        const response = await campusService.createCampus(submitData)
        toast.success('Campus created successfully')
        
        // Add the created campus (with campus_id) to React Query cache
        if (response?.data?.campus) {
          queryClient.setQueryData(['campuses', getTenantId()], (oldData) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: [response.data.campus, ...oldData.data]
              }
            }
            return {
              success: true,
              data: [response.data.campus]
            }
          })
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to save campus')
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
          {campus ? 'Edit Campus' : 'Add New Campus'}
        </h2>
        <p className="text-sm text-secondary-600">
          {campus ? 'Update campus information' : 'Create a new campus location'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Campus Name */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Campus Name *
          </label>
          <input
            type="text"
            value={formData.campus_name}
            onChange={(e) => handleChange('campus_name', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.campus_name ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter campus name"
          />
          {errors.campus_name && (
            <p className="text-xs text-error-600 mt-1">{errors.campus_name}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Address *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={2}
            className={`w-full px-3 py-2 text-sm border rounded-lg resize-y ${errors.address ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="Enter full address"
          />
          {errors.address && (
            <p className="text-xs text-error-600 mt-1">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Phone Number */}
          <div>
            <PhoneInput
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              error={errors.phone_number}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.email ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="campus@example.com"
            />
            {errors.email && (
              <p className="text-xs text-error-600 mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Year Established */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Year Established
            </label>
            <input
              type="number"
              value={formData.year_established}
              onChange={(e) => handleChange('year_established', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.year_established ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="1990"
              min="1500"
              max={new Date().getFullYear()}
            />
            {errors.year_established && (
              <p className="text-xs text-error-600 mt-1">{errors.year_established}</p>
            )}
          </div>

          {/* Number of Floors */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Number of Floors *
            </label>
            <input
              type="number"
              value={formData.no_of_floors}
              onChange={(e) => handleChange('no_of_floors', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.no_of_floors ? 'border-error-300' : 'border-secondary-300'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="1"
              min="1"
              max="200"
            />
            {errors.no_of_floors && (
              <p className="text-xs text-error-600 mt-1">{errors.no_of_floors}</p>
            )}
          </div>
        </div>

        {/* Main Campus Checkbox */}
        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_main_campus}
              onChange={(e) => handleChange('is_main_campus', e.target.checked)}
              className="mt-0.5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-secondary-700">Main Campus</span>
              <p className="text-xs text-secondary-500">Primary campus location</p>
            </div>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-secondary-200">
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
                {campus ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {campus ? 'Update Campus' : 'Create Campus'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Campus Card Component moved outside to prevent re-creation on every render
const CampusCard = ({ campus, onEdit, onDelete, isAdmin }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    
    try {
      await onDelete(campus.campus_id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-secondary-900">
                  {campus.campus_name}
                </h3>
                {campus.is_main_campus && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                      Main Campus
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-secondary-600 mt-1">
                Created {formatDate(campus.created_at)}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(campus)}
                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit campus"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-2 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                title="Delete campus"
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
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-secondary-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-secondary-700">{campus.address}</p>
          </div>
          
          {campus.phone_number && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-secondary-400" />
              <PhoneNumberDisplay value={campus.phone_number} className="text-sm" />
            </div>
          )}
          
          {campus.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-secondary-400" />
              <p className="text-sm text-secondary-700">{campus.email}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-secondary-100">
            <div className="flex items-center space-x-4">
              {campus.year_established && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-secondary-400" />
                  <span className="text-sm text-secondary-600">Est. {campus.year_established}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Layers className="h-4 w-4 text-secondary-400" />
                <span className="text-sm text-secondary-600">
                  {campus.no_of_floors} floor{campus.no_of_floors !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Campus"
        message={`Are you sure you want to delete "${campus.campus_name}"? This action cannot be undone and will permanently remove all campus data.`}
        confirmText="Delete Campus"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

export default function CampusManagementPage() {
  console.log('%c[Campus Page Mount]', 'color: yellow;');
  
  // Get user context and tenant context
  const { user, isAuthenticated, loading: authLoading, getFullName, getPrimaryRole, hasRole, hasPermission } = useAuth()
  const { tenant, getTenantName, getTenantId } = useAuth()

  const canCreateCampus =
    hasPermission && hasPermission(PERMISSIONS.CAMPUS_CREATE)
  const canEditCampus =
    hasPermission && hasPermission(PERMISSIONS.CAMPUS_UPDATE)
  const canDeleteCampus =
    hasPermission && hasPermission(PERMISSIONS.CAMPUS_DELETE)
  const canManageCampuses = canCreateCampus || canEditCampus || canDeleteCampus
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCampus, setEditingCampus] = useState(null)
  const [filterMainCampus, setFilterMainCampus] = useState(false)
  
  const queryClient = useQueryClient()

  // Fetch campuses
  const { 
    data: campusesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['campuses', getTenantId()],
    queryFn: campusService.getAllCampuses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getTenantId() // Only fetch when we have a tenant ID
  })

  const campuses = campusesResponse?.data || []

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: campusService.deleteCampus,
    onSuccess: () => {
      queryClient.invalidateQueries(['campuses'])
      toast.success('Campus deleted successfully')
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete campus')
    }
  })

  // Filter campuses
  const filteredCampuses = campuses.filter(campus => {
    const matchesSearch = campus.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campus.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterMainCampus || campus.is_main_campus
    return matchesSearch && matchesFilter
  })

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    // No need to invalidate queries since we're updating cache directly in form
  }

  const handleEditSuccess = () => {
    setEditingCampus(null)
    // No need to invalidate queries since we're updating cache directly in form
  }

  // Debug logging to track user context
  // useEffect(() => {
  //   console.log('🏫 CampusManagementPage - User Context Check:', {
  //     user,
  //     isAuthenticated,
  //     authLoading,
  //     fullName: getFullName(),
  //     isAdmin: isAdmin(),
  //     primaryRole: getPrimaryRole(),
  //     tenant: getTenantName()
  //   })
  // }, [user, isAuthenticated, authLoading, getFullName, isAdmin, getPrimaryRole, getTenantName])
  
  // Add useEffect to track if component stays mounted
  useEffect(() => {
    console.log('🏫 CampusManagementPage mounted with user:', user?.email || 'No user')
    return () => {
      console.log('🏫 CampusManagementPage unmounted')
    }
  }, [user])
  
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
  
  // Show error if user context is missing
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Authentication Required</h2>
          <p className="text-secondary-600">Please log in to access campus management.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Campus Management</h1>
        <p className="text-secondary-600">
          Welcome, {getFullName()}! Manage your campus locations and facilities.
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
              placeholder="Search campuses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 min-w-0 sm:w-80"
            />
          </div>
          
          {/* Filter */}
          <button
            onClick={() => setFilterMainCampus(!filterMainCampus)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              filterMainCampus
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">Main Campus Only</span>
          </button>
        </div>

        {/* Add Campus Button */}
        {canManageCampuses && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Campus
          </button>
        )}
      </div>

      {/* Campus Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Campuses</p>
              <p className="text-2xl font-bold text-secondary-900">{campuses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Main Campuses</p>
              <p className="text-2xl font-bold text-secondary-900">
                {campuses.filter(c => c.is_main_campus).length}
              </p>
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
                {campuses.reduce((total, campus) => total + (campus.no_of_floors || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campus List */}
      <div className="bg-white rounded-lg border border-secondary-200">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">
            Campus Locations ({filteredCampuses.length})
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
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Failed to load campuses</h3>
              <p className="text-secondary-600 mb-4">
                {error.response?.data?.message || 'An error occurred while fetching campuses.'}
              </p>
              <button onClick={() => refetch()} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : filteredCampuses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {searchTerm || filterMainCampus ? 'No campuses found' : 'No campuses yet'}
              </h3>
              <p className="text-secondary-600 mb-4">
                {searchTerm || filterMainCampus 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first campus location.'
                }
              </p>
              {canManageCampuses && !searchTerm && !filterMainCampus && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Campus
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCampuses.map((campus) => (
                <CampusCard
                  key={campus.campus_id}
                  campus={campus}
                  onEdit={setEditingCampus}
                  onDelete={deleteMutation.mutate}
                  isAdmin={canManageCampuses}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Campus Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        size="lg"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <CampusForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </Modal>

      {/* Edit Campus Modal */}
      <Modal 
        isOpen={!!editingCampus} 
        onClose={() => setEditingCampus(null)} 
        size="lg"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        {editingCampus && (
          <CampusForm
            campus={editingCampus}
            onClose={() => setEditingCampus(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  )
}
