import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Layers, 
  X,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { PERMISSIONS } from '../config/permissions';
import subjectService from '../services/subjectService';
import { academicService } from '../services/academicService';
import { EditButton, DeleteButton, ActionButtonGroup } from '../components/ui/ActionButtons';
import RequiredAsterisk from '../components/ui/RequiredAsterisk';

// InputField component for consistent form styling
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, disabled = false, placeholder = '' }) => (
  <div className={`${className}`}>
    <label className="form-label">
      {label} {required && <RequiredAsterisk />}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="input"
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
        className="input"
        required={required}
        disabled={disabled}
        placeholder={placeholder || `Enter ${label}`}
      />
    )}
  </div>
);

const SubjectManagementPage = () => {
  const { getCampusId, getCampusName, hasPermission } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    subject_name: '',
    subject_code: '',
    category: '',
    curriculum_id: ''
  });

  const canCreateSubject =
    hasPermission && hasPermission(PERMISSIONS.SUBJECT_CREATE);
  const canEditSubject =
    hasPermission && hasPermission(PERMISSIONS.SUBJECT_EDIT);
  const canDeleteSubject =
    hasPermission && hasPermission(PERMISSIONS.SUBJECT_DELETE);

  const campusId = getCampusId();
  const campusName = getCampusName();

  // Subject categories from the database enum
  const subjectCategories = [
    { value: 'Academic', label: 'Academic' },
    { value: 'Co-curricular', label: 'Co-curricular' },
    { value: 'Sport', label: 'Sport' }
  ];

  // Reset form data helper
  const resetFormData = useCallback(() => {
    setFormData({
      subject_name: '',
      subject_code: '',
      category: '',
      curriculum_id: ''
    });
  }, []);

  // Get curriculum name by ID
  const getCurriculumName = (curriculumId) => {
    const curriculum = curricula.find(c => c.curriculum_id === curriculumId);
    return curriculum ? curriculum.curriculum_code : 'Unknown';
  };

  // Filter subjects based on search query
  const filterSubjects = useCallback((subjectsToFilter, query) => {
    if (!query.trim()) {
      return subjectsToFilter;
    }

    const lowercaseQuery = query.toLowerCase();
    return subjectsToFilter.filter(subject => {
      const subjectName = subject.subject_name?.toLowerCase() || '';
      const subjectCode = subject.subject_code?.toLowerCase() || '';
      const curriculumName = getCurriculumName(subject.curriculum_id)?.toLowerCase() || '';
      
      return subjectName.includes(lowercaseQuery) || 
             subjectCode.includes(lowercaseQuery) || 
             curriculumName.includes(lowercaseQuery);
    });
  }, [curricula]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilteredSubjects(filterSubjects(subjects, query));
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredSubjects(subjects);
  };

  // Fetch subjects from API
  const fetchSubjects = async () => {
    if (!campusId) {
      toast.error('Campus information not available');
      return;
    }

    try {
      setLoading(true);
      const response = await subjectService.getAllSubjects(campusId);
      if (response.success) {
        setSubjects(response.data.subjects || []);
        setFilteredSubjects(response.data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error(error.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch curricula for dropdown
  const fetchCurricula = async () => {
    if (!campusId) return;

    try {
      const response = await academicService.getAllCurricula(campusId);
      
      if (response.success) {
        const curriculaData = response.data || [];
        setCurricula(curriculaData);
      } else {
        toast.error('Failed to fetch curricula');
      }
    } catch (error) {
      console.error('Error fetching curricula:', error);
      toast.error('Failed to fetch curricula');
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (campusId) {
      fetchSubjects();
      fetchCurricula();
    }
  }, [campusId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!campusId) {
      toast.error('Campus information not available');
      return;
    }

    try {
      setLoading(true);
      
      const subjectData = {
        ...formData,
        campus_id: campusId
      };

      if (showEditForm && editingSubject) {
        // Update existing subject
        const response = await subjectService.updateSubject(campusId, editingSubject.subject_id, subjectData);
        if (response.success) {
          toast.success('Subject updated successfully!');
          fetchSubjects();
          setShowEditForm(false);
          setEditingSubject(null);
          resetFormData();
        }
      } else {
        // Create new subject
        const response = await subjectService.createSubject(campusId, subjectData);
        if (response.success) {
          toast.success('Subject created successfully!');
          fetchSubjects();
          setShowAddForm(false);
          resetFormData();
        }
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to save subject';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => toast.error(err.message || err));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit subject
  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name || '',
      subject_code: subject.subject_code || '',
      category: subject.category || '',
      curriculum_id: subject.curriculum_id || ''
    });
    // Refresh curricula when opening edit form
    fetchCurricula();
    setShowEditForm(true);
  };

  const handleAddSubject = () => {
    resetFormData();
    // Refresh curricula when opening the form
    fetchCurricula();
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingSubject(null);
    resetFormData();
  };

  // Show loading state if no campus info
  if (!campusId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-8 h-8" />
          <p className="ml-2 text-gray-600">Loading campus information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Add/Edit Subject Modal */}
      <Modal
         isOpen={showAddForm || showEditForm}
         onClose={handleCancel}
         title={showEditForm ? 'Edit Subject' : 'Add New Subject'}
         showCloseButton={false}
       >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-sm text-secondary-500">
              Campus: <span className="font-medium text-secondary-900">{campusName}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Subject Name" 
              name="subject_name" 
              required 
              formData={formData} 
              handleInputChange={handleInputChange}
              placeholder="e.g. English, Mathematics"
            />
            
            <InputField 
               label="Subject Code" 
               name="subject_code" 
               required 
               formData={formData} 
               handleInputChange={handleInputChange}
               placeholder="e.g. ENG101, MAT202"
             />

            <InputField 
              label="Category" 
              name="category" 
              type="select" 
              options={subjectCategories}
              required 
              formData={formData} 
              handleInputChange={handleInputChange}
            />

            <InputField 
              label="Curriculum" 
              name="curriculum_id" 
              type="select" 
              options={curricula.map(c => ({ 
                value: c.curriculum_id, 
                label: c.curriculum_code
              }))}
              required 
              formData={formData} 
              handleInputChange={handleInputChange}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-secondary-100">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : (
                showEditForm ? <BookOpen className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
              )}
              {showEditForm ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-3xl text-secondary-900 mb-2">Subject Management</h1>
          <p className="text-secondary-600">
            Campus: {campusName}
          </p>
        </div>
        {canCreateSubject && (
          <button
            onClick={handleAddSubject}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </button>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, code, or curriculum..."
            className="input pl-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {/* Stats Card */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Layers className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-600">Total Subjects</p>
            <p className="text-2xl font-bold text-blue-900">{subjects.length}</p>
          </div>
        </div>
      </div>

      

      {/* Subjects List */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-soft">
        <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary-900">Subjects List</h2>
          <span className="px-3 py-1 bg-secondary-200 text-secondary-700 text-xs font-bold rounded-full uppercase tracking-wider">
            {filteredSubjects.length} {filteredSubjects.length === 1 ? 'Subject' : 'Subjects'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <LoadingSpinner className="w-10 h-10 text-primary-600 mb-4" />
              <p className="text-secondary-500 font-medium">Loading subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-secondary-100 rounded-full mb-4">
                <BookOpen className="h-10 w-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">No subjects found</h3>
              <p className="text-secondary-500 max-w-xs mx-auto">
                {searchQuery ? `No results for "${searchQuery}". Try a different search term.` : 'Get started by adding your first subject.'}
              </p>
              {!searchQuery && canCreateSubject && (
                <button onClick={handleAddSubject} className="btn-primary mt-6">
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Subject
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Category</th>
                  <th>Curriculum</th>
                  {(canEditSubject || canDeleteSubject) && (
                    <th className="w-24">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredSubjects.map((subject) => (
                  <tr key={subject.subject_id} className="hover:bg-secondary-50 transition-colors">
                    <td className="font-semibold text-secondary-900">{subject.subject_name}</td>
                    <td>
                      <code className="px-2 py-1 bg-secondary-100 rounded text-xs text-secondary-700 font-mono">
                        {subject.subject_code || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${
                        subject.category === 'Academic' 
                          ? 'bg-blue-100 text-blue-800' 
                          : subject.category === 'Co-curricular'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {subject.category}
                      </span>
                    </td>
                    <td>
                      <span className="badge-secondary">{getCurriculumName(subject.curriculum_id)}</span>
                    </td>
                    {(canEditSubject || canDeleteSubject) && (
                      <td>
                        <ActionButtonGroup>
                          {canEditSubject && (
                            <EditButton 
                              onClick={() => handleEditSubject(subject)}
                              title="Edit subject"
                            />
                          )}
                          {canDeleteSubject && (
                            <DeleteButton 
                              onClick={() => {
                                setDeleting(true);
                                subjectService.deleteSubject(campusId, subject.subject_id)
                                  .then(() => {
                                    toast.success('Subject deleted successfully!');
                                    fetchSubjects();
                                  })
                                  .catch(err => {
                                    toast.error(err.message || 'Failed to delete subject');
                                  })
                                  .finally(() => setDeleting(false));
                              }}
                              isDeleting={deleting}
                              confirmMessage={`Are you sure you want to delete "${subject.subject_name}"? This action cannot be undone.`}
                              title="Delete subject"
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
    </div>
  );
};

export default SubjectManagementPage;
