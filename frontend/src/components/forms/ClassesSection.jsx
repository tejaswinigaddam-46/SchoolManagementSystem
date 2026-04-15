import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Building2,
  Plus, 
  AlertCircle,
  Search,
  Loader2,
  Save,
  X,
  Layers
} from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Modal from '../ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import classService from '../../services/classService'
import { toast } from 'react-hot-toast'
import { PERMISSIONS } from '../../config/permissions'
import { EditButton, DeleteButton, ActionButtonGroup } from '../ui/ActionButtons'
import RequiredAsterisk from '../ui/RequiredAsterisk'

// Class Form Component
const ClassForm = ({ classItem, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  const { getCampusId } = useAuth()
  
  const [formData, setFormData] = useState({
    className: classItem?.className || '',
    classLevel: classItem?.classLevel || ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Class level options (1-12)
  const classLevelOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.className.trim()) {
      newErrors.className = 'Class name is required'
    }
    
    if (!formData.classLevel) {
      newErrors.classLevel = 'Class level is required'
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
    const campusId = getCampusId()
    
    try {
      if (classItem) {
        // Update existing class
        await classService.updateClass(classItem.classId, {
          ...formData,
          campusId
        })
        toast.success('Class updated successfully')
      } else {
        // Create new class
        await classService.createClass({
          ...formData,
          campusId
        })
        toast.success('Class created successfully')
      }
      
      queryClient.invalidateQueries(['classes', campusId])
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error.message || 'Failed to save class')
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
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-secondary-900 mb-1">
          {classItem ? 'Edit Class' : 'Add New Class'}
        </h2>
        <p className="text-sm text-secondary-600">
          {classItem ? 'Update class information' : 'Create a new class for your campus'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Class Name */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Class Name <RequiredAsterisk />
          </label>
          <input
            type="text"
            value={formData.className}
            onChange={(e) => handleChange('className', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              errors.className ? 'border-error-300' : 'border-secondary-300'
            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="e.g., First Standard, Grade 1"
          />
          {errors.className && (
            <p className="text-xs text-error-600 mt-1">{errors.className}</p>
          )}
        </div>

        {/* Class Level */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Class Level <RequiredAsterisk />
          </label>
          <select
            value={formData.classLevel}
            onChange={(e) => handleChange('classLevel', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              errors.classLevel ? 'border-error-300' : 'border-secondary-300'
            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select Level</option>
            {classLevelOptions.map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
          {errors.classLevel && (
            <p className="text-xs text-error-600 mt-1">{errors.classLevel}</p>
          )}
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
                {classItem ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {classItem ? 'Update Class' : 'Create Class'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Main Classes Section Component
export default function ClassesSection({ campusId }) {
  const { hasPermission } = useAuth()
  const canManageClasses = hasPermission && (hasPermission(PERMISSIONS.CLASS_EDIT) || hasPermission(PERMISSIONS.CLASS_CREATE))
  const canCreateClass = hasPermission && hasPermission(PERMISSIONS.CLASS_CREATE)
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  
  const queryClient = useQueryClient()

  // Fetch classes
  const { 
    data: classesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['classes', campusId],
    queryFn: () => classService.getAllClasses({ limit: 100 }), // Get more classes for client-side search
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!campusId
  })

  const classes = classesResponse?.data?.classes || []

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (classId) => classService.deleteClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes', campusId])
      toast.success('Class deleted successfully')
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete class')
    }
  })

  // Filter classes
  const filteredClasses = classes.filter(classItem => 
    classItem.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.classLevel.toString().includes(searchTerm)
  )

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    setEditingClass(null)
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
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 min-w-0 sm:w-80"
            />
          </div>
        </div>

        {/* Add Class Button */}
        {canCreateClass && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </button>
        )}
      </div>

      {/* Classes Stats - Following CurriculaSection Pattern */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Layers className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Total Classes</p>
            <p className="text-lg font-bold text-blue-900">{classes.length}</p>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Failed to load classes</h3>
            <p className="text-secondary-600 mb-4">
              {error.message || 'An error occurred while fetching classes.'}
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
            <Building2 className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {searchTerm ? 'No classes found' : 'No classes yet'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Get started by adding your first class.'
              }
            </p>
            {canCreateClass && !searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Class
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Level
                  </th>
                  {canManageClasses && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.classId} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {classItem.className}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Level {classItem.classLevel}
                      </span>
                    </td>
                    {canManageClasses && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ActionButtonGroup className="justify-end">
                          {hasPermission(PERMISSIONS.CLASS_EDIT) && (
                            <EditButton
                              onClick={() => setEditingClass(classItem)}
                              title="Edit class"
                              className="p-1.5"
                            />
                          )}
                          {hasPermission(PERMISSIONS.CLASS_DELETE) && (
                            <DeleteButton
                              onClick={() => deleteMutation.mutate(classItem.classId)}
                              isDeleting={deleteMutation.isPending && deleteMutation.variables === classItem.classId}
                              title="Delete class"
                              className="p-1.5"
                              confirmTitle="Delete Class"
                              confirmMessage={`Are you sure you want to delete "${classItem.className}"? This action cannot be undone.`}
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
        )}
      </div>

      {/* Create Class Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        size="md"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <ClassForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </Modal>

      {/* Edit Class Modal */}
      <Modal 
        isOpen={!!editingClass} 
        onClose={() => setEditingClass(null)} 
        size="md"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        {editingClass && (
          <ClassForm
            classItem={editingClass}
            onClose={() => setEditingClass(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  )
}
