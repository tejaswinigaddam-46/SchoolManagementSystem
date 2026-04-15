import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Calendar,
  Plus, 
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
import { useAuth } from '../../contexts/AuthContext'
import { academicService } from '../../services/academicService'
import classService from '../../services/classService'
import { toast } from 'react-hot-toast'
import { PERMISSIONS } from '../../config/permissions'
import { EditButton, DeleteButton, ActionButtonGroup } from '../ui/ActionButtons'
import RequiredAsterisk from '../ui/RequiredAsterisk'

// Academic Year Form Component
const AcademicYearForm = ({ academicYear, campusId, onClose, onSuccess }) => {
  const queryClient = useQueryClient()

  // Parse year_name to extract start and end years
  const parseYearName = (yearName) => {
    if (!yearName) return { startYear: '', endYear: '' }
    const parts = yearName.split('-')
    return {
      startYear: parts[0] || '',
      endYear: parts[1] || ''
    }
  }

  const initialYears = parseYearName(academicYear?.year_name)

  const [formData, setFormData] = useState({
    startYear: initialYears.startYear,
    endYear: initialYears.endYear,
    year_type: academicYear?.year_type || 'Current year',
    medium: academicYear?.medium || '',
    start_date: academicYear?.start_date ? academicYear.start_date.split('T')[0] : '',
    end_date: academicYear?.end_date ? academicYear.end_date.split('T')[0] : '',
    fromclass: academicYear?.fromclass || '',
    toclass: academicYear?.toclass || '',
    startHour: academicYear?.start_time_of_day ? academicYear.start_time_of_day.split(':')[0] : '09',
    startMinute: academicYear?.start_time_of_day ? academicYear.start_time_of_day.split(':')[1]?.split(' ')[0] : '00',
    startAmPm: academicYear?.start_time_of_day ? academicYear.start_time_of_day.split(' ')[1] || 'AM' : 'AM',
    endHour: academicYear?.end_time_of_day ? academicYear.end_time_of_day.split(':')[0] : '15',
    endMinute: academicYear?.end_time_of_day ? academicYear.end_time_of_day.split(':')[1]?.split(' ')[0] : '00',
    endAmPm: academicYear?.end_time_of_day ? academicYear.end_time_of_day.split(' ')[1] || 'PM' : 'PM',
    shift_type: academicYear?.shift_type || '',
    curriculum_id: academicYear?.curriculum_id || ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Medium suggestions
  const mediumSuggestions = ['English', 'Telugu', 'Hindi', 'Urdu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi']
  const [showMediumSuggestions, setShowMediumSuggestions] = useState(false)
  const filteredMediumSuggestions = mediumSuggestions.filter(m =>
    m.toLowerCase().includes(formData.medium.toLowerCase())
  )

  // Shift type options
  const shiftTypes = ['Morning', 'Afternoon', 'Evening', 'Night']

  // Hours and minutes for time selectors
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

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

  // Format time from components to display format
  const formatTimeDisplay = (hour, minute, ampm) => {
    return `${hour}:${minute} ${ampm}`
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    const yearName = `${formData.startYear}-${formData.endYear}`.trim()
    if (!formData.startYear.trim() || !formData.endYear.trim()) {
      newErrors.startYear = 'Start and end year are required'
    } else if (!/^\d{4}$/.test(formData.startYear) || !/^\d{4}$/.test(formData.endYear)) {
      newErrors.startYear = 'Year must be 4 digits (e.g., 2025)'
    } else if (parseInt(formData.endYear) <= parseInt(formData.startYear)) {
      newErrors.endYear = 'End year must be greater than start year'
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

    // Combine year name
    const yearName = `${formData.startYear}-${formData.endYear}`.trim()

    // Format time
    const startTime = formatTimeDisplay(formData.startHour, formData.startMinute, formData.startAmPm)
    const endTime = formatTimeDisplay(formData.endHour, formData.endMinute, formData.endAmPm)

    try {
      // Prepare form data - only include non-empty optional fields
      const submitData = {
        year_name: yearName,
        year_type: formData.year_type,
        medium: formData.medium,
        fromclass: formData.fromclass,
        toclass: formData.toclass,
        curriculum_id: parseInt(formData.curriculum_id)
      }

      // Add optional fields only if they have values
      if (formData.start_date) submitData.start_date = formData.start_date
      if (formData.end_date) submitData.end_date = formData.end_date
      if (formData.startHour && formData.startMinute) submitData.start_time_of_day = startTime
      if (formData.endHour && formData.endMinute) submitData.end_time_of_day = endTime
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
        {/* Start Year - End Year */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Start Year <RequiredAsterisk />
            </label>
            <input
              type="text"
              value={formData.startYear}
              onChange={(e) => handleChange('startYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.startYear ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="2025"
              maxLength={4}
            />
            {errors.startYear && (
              <p className="text-xs text-error-600 mt-1">{errors.startYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              End Year <RequiredAsterisk />
            </label>
            <input
              type="text"
              value={formData.endYear}
              onChange={(e) => handleChange('endYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.endYear ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="2026"
              maxLength={4}
            />
            {errors.endYear && (
              <p className="text-xs text-error-600 mt-1">{errors.endYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Year Type <RequiredAsterisk />
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

        {/* Medium with autocomplete */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Medium <RequiredAsterisk />
            </label>
            <input
              type="text"
              value={formData.medium}
              onChange={(e) => {
                handleChange('medium', e.target.value)
                setShowMediumSuggestions(true)
              }}
              onFocus={() => setShowMediumSuggestions(true)}
              onBlur={() => setTimeout(() => setShowMediumSuggestions(false), 200)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                errors.medium ? 'border-error-300' : 'border-secondary-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              placeholder="Select or type medium"
            />
            {showMediumSuggestions && filteredMediumSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredMediumSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    onClick={() => {
                      handleChange('medium', suggestion)
                      setShowMediumSuggestions(false)
                    }}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 text-secondary-700"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            {errors.medium && (
              <p className="text-xs text-error-600 mt-1">{errors.medium}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              From Class <RequiredAsterisk />
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
              To Class <RequiredAsterisk />
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
            Curriculum <RequiredAsterisk />
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

        {/* Start Time with Hour:Min AM/PM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Start Time
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={formData.startHour}
                onChange={(e) => handleChange('startHour', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {hours.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-secondary-500">:</span>
              <select
                value={formData.startMinute}
                onChange={(e) => handleChange('startMinute', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {minutes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={formData.startAmPm}
                onChange={(e) => handleChange('startAmPm', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              End Time
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={formData.endHour}
                onChange={(e) => handleChange('endHour', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {hours.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-secondary-500">:</span>
              <select
                value={formData.endMinute}
                onChange={(e) => handleChange('endMinute', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {minutes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={formData.endAmPm}
                onChange={(e) => handleChange('endAmPm', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shift Type */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Shift Type
          </label>
          <select
            value={formData.shift_type}
            onChange={(e) => handleChange('shift_type', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              errors.shift_type ? 'border-error-300' : 'border-secondary-300'
            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select shift type...</option>
            {shiftTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(academicYear.academic_year_id)
    } finally {
      setIsDeleting(false)
    }
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
          <ActionButtonGroup>
            <EditButton
              onClick={() => onEdit(academicYear)}
              title="Edit academic year"
            />
            <DeleteButton
              onClick={handleDeleteConfirm}
              isDeleting={isDeleting}
              title="Delete academic year"
              confirmTitle="Delete Academic Year"
              confirmMessage={`Are you sure you want to delete "${academicYear.year_name}"? This action cannot be undone and may affect associated data.`}
            />
          </ActionButtonGroup>
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
  )
}

// Main Academic Years Section Component
export default function AcademicYearsSection({ campusId }) {
  const { hasPermission } = useAuth()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState(null)
  
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
                        <ActionButtonGroup className="justify-end">
                          {canEditAcademicYear && (
                            <EditButton
                              onClick={() => setEditingAcademicYear(academicYear)}
                              title="Edit academic year"
                              className="p-1.5"
                            />
                          )}
                          {canDeleteAcademicYear && (
                            <DeleteButton
                              onClick={() => deleteMutation.mutate(academicYear.academic_year_id)}
                              isDeleting={deleteMutation.isPending && deleteMutation.variables === academicYear.academic_year_id}
                              title="Delete academic year"
                              className="p-1.5"
                              confirmTitle="Delete Academic Year"
                              confirmMessage={`Are you sure you want to delete "${academicYear.year_name}"? This action cannot be undone and may affect associated data.`}
                            />
                          )}
                        </ActionButtonGroup>
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
    </div>
  )
}
