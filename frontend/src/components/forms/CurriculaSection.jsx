import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  BookOpen,
  Plus, 
  AlertCircle,
  Search,
  Loader2,
  Save,
  X,
  Code
} from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Modal from '../ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { academicService } from '../../services/academicService'
import { toast } from 'react-hot-toast'
import { PERMISSIONS } from '../../config/permissions'
import { EditButton, DeleteButton, ActionButtonGroup } from '../ui/ActionButtons'
import RequiredAsterisk from '../ui/RequiredAsterisk'

// Curriculum Form Component
const CurriculumForm = ({ curriculum, campusId, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    curriculum_code: curriculum?.curriculum_code || '',
    curriculum_name: curriculum?.curriculum_name || ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.curriculum_code.trim()) {
      newErrors.curriculum_code = 'Curriculum code is required'
    } else if (!/^[A-Za-z0-9_-]{1,20}$/.test(formData.curriculum_code)) {
      newErrors.curriculum_code = 'Code must be alphanumeric with underscores/hyphens (max 20 chars)'
    }
    
    if (!formData.curriculum_name.trim()) {
      newErrors.curriculum_name = 'Curriculum name is required'
    } else if (formData.curriculum_name.length > 100) {
      newErrors.curriculum_name = 'Name must be maximum 100 characters'
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
      if (curriculum) {
        // Update existing curriculum
        const response = await academicService.updateCurriculum(
          campusId, 
          curriculum.curriculum_id, 
          formData
        )
        toast.success('Curriculum updated successfully')
        
        // Update the curriculum in React Query cache
        if (response?.data?.curriculum) {
          queryClient.setQueryData(['curricula', campusId], (oldData) => {
            if (oldData?.data) {
              const updatedCurricula = oldData.data.map(c => 
                c.curriculum_id === curriculum.curriculum_id ? response.data.curriculum : c
              )
              return {
                ...oldData,
                data: updatedCurricula
              }
            }
            return oldData
          })
        }
      } else {
        // Create new curriculum
        const response = await academicService.createCurriculum(campusId, formData)
        toast.success('Curriculum created successfully')
        
        // Add the created curriculum to React Query cache
        if (response?.data?.curriculum) {
          queryClient.setQueryData(['curricula', campusId], (oldData) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: [response.data.curriculum, ...oldData.data]
              }
            }
            return {
              success: true,
              data: [response.data.curriculum]
            }
          })
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to save curriculum')
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
          {curriculum ? 'Edit Curriculum' : 'Add New Curriculum'}
        </h2>
        <p className="text-sm text-secondary-600">
          {curriculum ? 'Update curriculum information' : 'Create a new curriculum type'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Curriculum Code */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Curriculum Code <RequiredAsterisk />
          </label>
          <input
            type="text"
            value={formData.curriculum_code}
            onChange={(e) => handleChange('curriculum_code', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              errors.curriculum_code ? 'border-error-300' : 'border-secondary-300'
            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="e.g., CBSE, ICSE, IB"
          />
          {errors.curriculum_code && (
            <p className="text-xs text-error-600 mt-1">{errors.curriculum_code}</p>
          )}
          <p className="text-xs text-secondary-500 mt-1">
            Use alphanumeric characters, underscores, or hyphens only
          </p>
        </div>

        {/* Curriculum Name */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Curriculum Name <RequiredAsterisk />
          </label>
          <input
            type="text"
            value={formData.curriculum_name}
            onChange={(e) => handleChange('curriculum_name', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              errors.curriculum_name ? 'border-error-300' : 'border-secondary-300'
            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            placeholder="e.g., Central Board of Secondary Education"
          />
          {errors.curriculum_name && (
            <p className="text-xs text-error-600 mt-1">{errors.curriculum_name}</p>
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
                {curriculum ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {curriculum ? 'Update Curriculum' : 'Create Curriculum'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Curriculum Card Component
const CurriculumCard = ({ curriculum, onEdit, onDelete, canManage }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(curriculum.curriculum_id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900 mb-1">
              {curriculum.curriculum_name}
            </h3>
            <div className="flex items-center space-x-1">
              <Code className="h-4 w-4 text-secondary-400" />
              <span className="text-sm text-secondary-600 font-mono">
                {curriculum.curriculum_code}
              </span>
            </div>
          </div>
        </div>
        
        {canManage && (
          <ActionButtonGroup className="space-x-1">
            <EditButton
              onClick={() => onEdit(curriculum)}
              title="Edit curriculum"
              className="p-1.5"
            />
            <DeleteButton
              onClick={handleDeleteConfirm}
              isDeleting={isDeleting}
              title="Delete curriculum"
              className="p-1.5"
              confirmTitle="Delete Curriculum"
              confirmMessage={`Are you sure you want to delete "${curriculum.curriculum_name}"? This action cannot be undone and may affect associated academic years.`}
            />
          </ActionButtonGroup>
        )}
      </div>

      <div className="text-xs text-secondary-500">
        ID: {curriculum.curriculum_id}
      </div>
    </div>
  )
}

// Main Curricula Section Component
export default function CurriculaSection({ campusId }) {
  const { hasPermission } = useAuth()
  const canManageCurricula = hasPermission && hasPermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_EDIT)
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState(null)
  
  const queryClient = useQueryClient()

  // Fetch curricula
  const { 
    data: curriculaResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['curricula', campusId],
    queryFn: () => academicService.getAllCurricula(campusId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!campusId
  })

  const curricula = curriculaResponse?.data || []

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (curriculumId) => academicService.deleteCurriculum(campusId, curriculumId),
    onSuccess: () => {
      queryClient.invalidateQueries(['curricula', campusId])
      toast.success('Curriculum deleted successfully')
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete curriculum')
    }
  })

  // Filter curricula
  const filteredCurricula = curricula.filter(curriculum => 
    curriculum.curriculum_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.curriculum_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    setEditingCurriculum(null)
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
              placeholder="Search curricula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 min-w-0 sm:w-80"
            />
          </div>
        </div>

        {/* Add Curriculum Button */}
        {canManageCurricula && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Curriculum
          </button>
        )}
      </div>

      {/* Curricula Stats */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Total Curricula</p>
            <p className="text-lg font-bold text-blue-900">{curricula.length}</p>
          </div>
        </div>
      </div>

      {/* Curricula List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Failed to load curricula</h3>
            <p className="text-secondary-600 mb-4">
              {error.response?.data?.message || 'An error occurred while fetching curricula.'}
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : filteredCurricula.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
            <BookOpen className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {searchTerm ? 'No curricula found' : 'No curricula yet'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Get started by adding your first curriculum type.'
              }
            </p>
            {canManageCurricula && !searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Curriculum
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-secondary-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Curriculum Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Curriculum Name
                  </th>
                  {canManageCurricula && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredCurricula.map((curriculum) => (
                  <tr key={curriculum.curriculum_id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Code className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-mono font-medium text-secondary-900">
                          {curriculum.curriculum_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {curriculum.curriculum_name}
                      </div>
                    </td>
                    {canManageCurricula && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ActionButtonGroup className="justify-end">
                          <EditButton
                            onClick={() => setEditingCurriculum(curriculum)}
                            title="Edit curriculum"
                            className="p-1.5"
                          />
                          <DeleteButton
                            onClick={() => deleteMutation.mutate(curriculum.curriculum_id)}
                            isDeleting={deleteMutation.isPending && deleteMutation.variables === curriculum.curriculum_id}
                            title="Delete curriculum"
                            className="p-1.5"
                            confirmTitle="Delete Curriculum"
                            confirmMessage={`Are you sure you want to delete "${curriculum.curriculum_name}"? This action cannot be undone and may affect associated academic years.`}
                          />
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

      {/* Create Curriculum Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        size="md"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <CurriculumForm
          campusId={campusId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </Modal>

      {/* Edit Curriculum Modal */}
      <Modal 
        isOpen={!!editingCurriculum} 
        onClose={() => setEditingCurriculum(null)} 
        size="md"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        {editingCurriculum && (
          <CurriculumForm
            curriculum={editingCurriculum}
            campusId={campusId}
            onClose={() => setEditingCurriculum(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  )
}
