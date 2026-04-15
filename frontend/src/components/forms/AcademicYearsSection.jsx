import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Calendar,
  Plus, 
  Edit, 
  Trash2,
  AlertCircle,
  Search,
  Loader2,
  Save,
  Clock,
  GraduationCap,
  BookOpen,
} from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Modal from '../ui/Modal'
import ConfirmationDialog from '../ui/ConfirmationDialog'
import { useAuth } from '../../contexts/AuthContext'
import { academicService } from '../../services/academicService'
import classService from '../../services/classService'
import { toast } from 'react-hot-toast'
import { PERMISSIONS } from '../../config/permissions'

// Academic Year Form Component
const AcademicYearForm = ({ academicYear, campusId, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    year_name: academicYear?.year_name || '',
    year_type: academicYear?.year_type || 'Current year',
    medium: academicYear?.medium || '',
    start_date: academicYear?.start_date ? academicYear.start_date.split('T')[0] : '',
    end_date: academicYear?.end_date ? academicYear.end_date.split('T')[0] : '',
    fromclass: academicYear?.fromclass || '',
    toclass: academicYear?.toclass || '',
    start_time_of_day: academicYear?.start_time_of_day || '',
    end_time_of_day: academicYear?.end_time_of_day || '',
    shift_type: academicYear?.shift_type || '',
    curriculum_id: academicYear?.curriculum_id || ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch curricula for dropdown
  const { data: curriculaResponse } = useQuery({
    queryKey: ['curricula', campusId],
    queryFn: () => academicService.getAllCurricula(campusId),
    enabled: !!campusId
  })
  const curricula = curriculaResponse?.data || []

  const { data: classesResponse, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', campusId],
    queryFn: async () => {
      try {
        const response = await classService.getAllClasses({ limit: 100 })
        return response
      } catch (error) {
        console.error('Failed to fetch classes:', error)
        toast.error(error.message || 'Failed to load classes')
        throw error
      }
    },
    enabled: !!campusId
  })

  const classesData =
    classesResponse?.data?.classes ||
    classesResponse?.data?.data?.classes ||
    []

  const classOptions =
    classesData.map((cls) => cls.className || cls.class_name).filter(Boolean) || []

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.year_name.trim()) {
      newErrors.year_name = 'Year name is required'
    } else if (!/^\d{4}-\d{4}$/.test(formData.year_name)) {
      newErrors.year_name = 'Year name must be in format YYYY-YYYY (e.g., 2025-2026)'
    }
    
    if (!formData.year_type) {
      newErrors.year_type = 'Year type is required'
    }
    
    if (!formData.medium.trim()) {
      newErrors.medium = 'Medium is required'
    }
    
    if (!formData.fromclass.trim()) {
      newErrors.fromclass = 'From class is required'
    }
    
    if (!formData.toclass.trim()) {
      newErrors.toclass = 'To class is required'
    }
    
    if (!formData.curriculum_id) {
      newErrors.curriculum_id = 'Curriculum is required'
    }

    // Validate date range
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date'
      }
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
      // Prepare form data - only include non-empty optional fields
      const submitData = {
        year_name: formData.year_name,
        year_type: formData.year_type,
        medium: formData.medium,
        fromclass: formData.fromclass,
        toclass: formData.toclass,
        curriculum_id: parseInt(formData.curriculum_id)
      }

      // Add optional fields only if they have values
      if (formData.start_date) submitData.start_date = formData.start_date
      if (formData.end_date) submitData.end_date = formData.end_date
      if (formData.start_time_of_day) submitData.start_time_of_day = formData.start_time_of_day
      if (formData.end_time_of_day) submitData.end_time_of_day = formData.end_time_of_day
      if (formData.shift_type) submitData.shift_type = formData.shift_type
      
      if (academicYear) {
        // Update existing academic year
        const response = await academicService.updateAcademicYear(
          campusId, 
          academicYear.academic_year_id, 
          submitData
        )
        toast.success('Academic year updated successfully')
        
        // Update the academic year in React Query cache
        if (response?.data?.academicYear) {
          queryClient.setQueryData(['academicYears', campusId], (oldData) => {
            if (oldData?.data) {
              const updatedAcademicYears = oldData.data.map(ay => 
                ay.academic_year_id === academicYear.academic_year_id ? response.data.academicYear : ay
              )
              return {
                ...oldData,
                data: updatedAcademicYears
              }
            }
            return oldData
          })
        }
      } else {
        // Create new academic year
        const response = await academicService.createAcademicYear(campusId, submitData)
        toast.success('Academic year created successfully')
        
        // Add the created academic year to React Query cache
        if (response?.data?.academicYear) {
          queryClient.setQueryData(['academicYears', campusId], (oldData) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: [response.data.academicYear, ...oldData.data]
              }
            }
            return {
              success: true,
              data: [response.data.academicYear]
            }
          })
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to save academic year')
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

  const yearTypes = ['Current year', 'Previous year', 'Next year']

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-secondary-900 mb-1">
          {academicYear ? 'Edit Academic Year' : 'Add New Academic Year'}
        </h2>
        <p className="text-sm text-secondary-600">
          {academicYear ? 'Update academic year configuration' : 'Create a new academic year setup'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Year Name and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Year Name *
            </label>
            <input
              type="text"
              value={formData.year_name}
              onChange={(e) => handleChange('year_name', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.year_name ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="2025-2026"
            />
            {errors.year_name && (
              <p className="text-xs text-error-600 mt-1">{errors.year_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Year Type *
            </label>
            <select
              value={formData.year_type}
              onChange={(e) => handleChange('year_type', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.year_type ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            >
              {yearTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.year_type && (
              <p className="text-xs text-error-600 mt-1">{errors.year_type}</p>
            )}
          </div>
        </div>

        {/* Medium and Classes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Medium *
            </label>
            <input
              type="text"
              value={formData.medium}
              onChange={(e) => handleChange('medium', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.medium ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="English, Hindi, etc."
            />
            {errors.medium && (
              <p className="text-xs text-error-600 mt-1">{errors.medium}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              From Class *
            </label>
            <select
              value={formData.fromclass}
              onChange={(e) => handleChange('fromclass', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.fromclass ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            >
              <option value="">{classesLoading ? 'Loading classes...' : 'Select from class'}</option>
              {classOptions.map(className => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
            {errors.fromclass && (
              <p className="text-xs text-error-600 mt-1">{errors.fromclass}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              To Class *
            </label>
            <select
              value={formData.toclass}
              onChange={(e) => handleChange('toclass', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.toclass ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            >
              <option value="">{classesLoading ? 'Loading classes...' : 'Select to class'}</option>
              {classOptions.map(className => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
            {errors.toclass && (
              <p className="text-xs text-error-600 mt-1">{errors.toclass}</p>
            )}
          </div>
        </div>

        {/* Curriculum */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Curriculum *
          </label>
          <select
            value={formData.curriculum_id}
            onChange={(e) => handleChange('curriculum_id', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              errors.curriculum_id ? 'border-error-300' : 'border-secondary-300'
            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select a curriculum...</option>
            {curricula.map(curriculum => (
              <option key={curriculum.curriculum_id} value={curriculum.curriculum_id}>
                {curriculum.curriculum_name} ({curriculum.curriculum_code})
              </option>
            ))}
          </select>
          {errors.curriculum_id && (
            <p className="text-xs text-error-600 mt-1">{errors.curriculum_id}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.start_date ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            />
            {errors.start_date && (
              <p className="text-xs text-error-600 mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.end_date ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            />
            {errors.end_date && (
              <p className="text-xs text-error-600 mt-1">{errors.end_date}</p>
            )}
          </div>
        </div>

        {/* Time and Shift */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Start Time
            </label>
            <input
              type="text"
              value={formData.start_time_of_day}
              onChange={(e) => handleChange('start_time_of_day', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.start_time_of_day ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="9:00 AM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              End Time
            </label>
            <input
              type="text"
              value={formData.end_time_of_day}
              onChange={(e) => handleChange('end_time_of_day', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.end_time_of_day ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="3:00 PM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Shift Type
            </label>
            <input
              type="text"
              value={formData.shift_type}
              onChange={(e) => handleChange('shift_type', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.shift_type ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="Morning, Afternoon"
            />
          </div>
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
                {academicYear ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {academicYear ? 'Update Academic Year' : 'Create Academic Year'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Academic Year Card Component
const AcademicYearCard = ({ academicYear, onEdit, onDelete, isAdmin }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    
    try {
      await onDelete(academicYear.academic_year_id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getYearTypeColor = (type) => {
    switch (type) {
      case 'Current year':
        return 'bg-green-100 text-green-800'
      case 'Previous year':
        return 'bg-gray-100 text-gray-800'
      case 'Next year':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                {academicYear.year_name}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getYearTypeColor(academicYear.year_type)}`}>
                  {academicYear.year_type}
                </span>
                <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full">
                  {academicYear.medium}
                </span>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(academicYear)}
                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit academic year"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-2 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                title="Delete academic year"
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
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4 text-secondary-400" />
            <span className="text-sm text-secondary-700">
              Classes: {academicYear.fromclass} to {academicYear.toclass}
            </span>
          </div>

          {academicYear.curriculum_name && (
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-700">
                {academicYear.curriculum_name} ({academicYear.curriculum_code})
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-secondary-400" />
            <span className="text-sm text-secondary-700">
              {formatDate(academicYear.start_date)} - {formatDate(academicYear.end_date)}
            </span>
          </div>

          {(academicYear.start_time_of_day || academicYear.end_time_of_day) && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-700">
                {academicYear.start_time_of_day || 'Start'} - {academicYear.end_time_of_day || 'End'}
                {academicYear.shift_type && ` (${academicYear.shift_type})`}
              </span>
            </div>
          )}

          <div className="text-xs text-secondary-500 pt-2 border-t border-secondary-100">
            ID: {academicYear.academic_year_id}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Academic Year"
        message={`Are you sure you want to delete "${academicYear.year_name}"? This action cannot be undone and may affect associated data.`}
        confirmText="Delete Academic Year"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

// Main Academic Years Section Component
export default function AcademicYearsSection({ campusId }) {
  const { hasPermission } = useAuth()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [academicYearToDelete, setAcademicYearToDelete] = useState(null)
  
  const queryClient = useQueryClient()

  // Fetch academic years
  const { 
    data: academicYearsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['academicYears', campusId],
    queryFn: () => academicService.getAllAcademicYears(campusId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!campusId
  })

  const academicYears = academicYearsResponse?.data || []

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (academicYearId) => academicService.deleteAcademicYear(campusId, academicYearId),
    onSuccess: () => {
      queryClient.invalidateQueries(['academicYears', campusId])
      toast.success('Academic year deleted successfully')
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete academic year')
      setShowDeleteConfirm(false)
      setAcademicYearToDelete(null)
    }
  })

  const isDeleting = deleteMutation.isPending || deleteMutation.isLoading

  // Filter academic years
  const filteredAcademicYears = academicYears.filter(academicYear => 
    academicYear.year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academicYear.medium.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academicYear.year_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const currentYears = academicYears.filter(ay => ay.year_type === 'Current year').length
  const totalYears = academicYears.length

  const canCreateAcademicYear =
    hasPermission && hasPermission(PERMISSIONS.ACADEMIC_YEAR_CREATE)
  const canEditAcademicYear =
    hasPermission && hasPermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_EDIT)
  const canDeleteAcademicYear =
    hasPermission && hasPermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_DELETE)
  const canManageAcademicYears = canEditAcademicYear || canDeleteAcademicYear

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    setEditingAcademicYear(null)
  }

  const handleDeleteClick = (academicYear) => {
    setAcademicYearToDelete(academicYear)
    setShowDeleteConfirm(true)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setAcademicYearToDelete(null)
  }

  const handleDeleteConfirm = () => {
    if (!academicYearToDelete) return
    deleteMutation.mutate(academicYearToDelete.academic_year_id)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search academic years..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 min-w-0 sm:w-80"
            />
          </div>
        </div>

        {/* Add Academic Year Button */}
        {canCreateAcademicYear && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Academic Year
          </button>
        )}
      </div>

      {/* Academic Years Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Academic Years</p>
              <p className="text-lg font-bold text-blue-900">{totalYears}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Current Years</p>
              <p className="text-lg font-bold text-green-900">{currentYears}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Years List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Failed to load academic years</h3>
            <p className="text-secondary-600 mb-4">
              {error.response?.data?.message || 'An error occurred while fetching academic years.'}
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : filteredAcademicYears.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
            <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {searchTerm ? 'No academic years found' : 'No academic years yet'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Get started by adding your first academic year configuration.'
              }
            </p>
            {hasPermission && hasPermission(PERMISSIONS.ACADEMIC_YEAR_CREATE) && !searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Academic Year
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-secondary-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Type & Medium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Classes & Curriculum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  {canManageAcademicYears && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredAcademicYears.map((academicYear) => (
                  <tr key={academicYear.academic_year_id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {academicYear.year_name}
                          </div>
                          <div className="text-xs text-secondary-500">
                            ID: {academicYear.academic_year_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          academicYear.year_type === 'Current year' ? 'bg-green-100 text-green-800' :
                          academicYear.year_type === 'Previous year' ? 'bg-gray-100 text-gray-800' :
                          academicYear.year_type === 'Next year' ? 'bg-blue-100 text-blue-800' :
                          'bg-secondary-100 text-secondary-800'
                        }`}>
                          {academicYear.year_type}
                        </span>
                        <div className="text-sm text-secondary-600">
                          {academicYear.medium}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-secondary-900">
                          <GraduationCap className="h-4 w-4 text-secondary-400 mr-1" />
                          {academicYear.fromclass} to {academicYear.toclass}
                        </div>
                        <div className="flex items-center text-sm text-secondary-600">
                          <BookOpen className="h-4 w-4 text-secondary-400 mr-1" />
                          {academicYear.curriculum_name ? (
                            <>
                              {academicYear.curriculum_name}
                              <span className="ml-1 text-xs">({academicYear.curriculum_code})</span>
                            </>
                          ) : (
                            'No curriculum'
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {academicYear.start_date && academicYear.end_date ? (
                          <>
                            {new Date(academicYear.start_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                            <br />
                            <span className="text-secondary-500">to</span>
                            <br />
                            {new Date(academicYear.end_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </>
                        ) : (
                          <span className="text-secondary-500">Not set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {(academicYear.start_time_of_day || academicYear.end_time_of_day) ? (
                          <div className="flex items-center text-sm text-secondary-900">
                            <Clock className="h-4 w-4 text-secondary-400 mr-1" />
                            {academicYear.start_time_of_day || 'Start'} - {academicYear.end_time_of_day || 'End'}
                          </div>
                        ) : (
                          <div className="text-sm text-secondary-500">No schedule</div>
                        )}
                        {academicYear.shift_type && (
                          <div className="text-xs text-secondary-600">
                            {academicYear.shift_type}
                          </div>
                        )}
                      </div>
                    </td>
                    {canManageAcademicYears && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {canEditAcademicYear && (
                            <button
                              onClick={() => setEditingAcademicYear(academicYear)}
                              className="text-primary-600 hover:text-primary-900 p-1.5 rounded-lg hover:bg-primary-50"
                              title="Edit academic year"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDeleteAcademicYear && (
                            <button
                              onClick={() => handleDeleteClick(academicYear)}
                              className="text-error-600 hover:text-error-900 p-1.5 rounded-lg hover:bg-error-50"
                              title="Delete academic year"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Academic Year Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        size="xl"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <AcademicYearForm
          campusId={campusId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </Modal>

      {/* Edit Academic Year Modal */}
      <Modal 
        isOpen={!!editingAcademicYear} 
        onClose={() => setEditingAcademicYear(null)} 
        size="xl"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        {editingAcademicYear && (
          <AcademicYearForm
            academicYear={editingAcademicYear}
            campusId={campusId}
            onClose={() => setEditingAcademicYear(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Academic Year"
        message={
          academicYearToDelete
            ? `Are you sure you want to delete "${academicYearToDelete.year_name}"? This action cannot be undone and may affect associated data.`
            : 'Are you sure you want to delete this academic year? This action cannot be undone and may affect associated data.'
        }
        confirmText="Delete Academic Year"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
