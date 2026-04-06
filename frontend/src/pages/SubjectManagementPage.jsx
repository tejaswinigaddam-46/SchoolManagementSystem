import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { PERMISSIONS } from '../config/permissions';
import subjectService from '../services/subjectService';
import { academicService } from '../services/academicService';

// InputField component for consistent form styling
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, disabled = false }) => (
  <div className={`${className}`}>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
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
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
        required={required}
        disabled={disabled}
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
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, subject: null });
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

  // Handle delete subject
  const handleDeleteSubject = (subject) => {
    setDeleteConfirm({ show: true, subject });
  };

  // Confirm delete subject
  const confirmDeleteSubject = async () => {
    if (!campusId) {
      toast.error('Campus information not available');
      return;
    }

    try {
      setDeleting(true);
      const response = await subjectService.deleteSubject(campusId, deleteConfirm.subject.subject_id);
      if (response.success) {
        toast.success('Subject deleted successfully!');
        fetchSubjects();
        setDeleteConfirm({ show: false, subject: null });
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error(error.message || 'Failed to delete subject');
    } finally {
      setDeleting(false);
    }
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

  if (showAddForm || showEditForm) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {showEditForm ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <div className="mb-4 text-sm text-gray-600">
                Campus: <span className="font-medium">{campusName}</span>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Subject Name" 
                    name="subject_name" 
                    required 
                    formData={formData} 
                    handleInputChange={handleInputChange}
                  />
                  
                  <InputField 
                    label="Subject Code" 
                    name="subject_code" 
                    formData={formData} 
                    handleInputChange={handleInputChange}
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
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading && <LoadingSpinner className="w-4 h-4" />}
                    {showEditForm ? 'Update Subject' : 'Add Subject'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Subject Management</h1>
          <p className="text-gray-600 mt-1">Campus: {campusName}</p>
        </div>
        {canCreateSubject && (
          <button
            onClick={handleAddSubject}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Subject
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, code, or curriculum"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={clearSearch}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Subjects List</h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="w-6 h-6" />
              <p className="ml-2 text-gray-500">Loading subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No subjects found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Subject Name</th>
                    <th className="px-4 py-2 text-left">Subject Code</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Curriculum</th>
                    {(canEditSubject || canDeleteSubject) && (
                      <th className="px-4 py-2 text-left">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.subject_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{subject.subject_name}</td>
                      <td className="px-4 py-2">{subject.subject_code || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          subject.category === 'Academic' 
                            ? 'bg-blue-100 text-blue-800' 
                            : subject.category === 'Co-curricular'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {subject.category}
                        </span>
                      </td>
                      <td className="px-4 py-2">{getCurriculumName(subject.curriculum_id)}</td>
                      {(canEditSubject || canDeleteSubject) && (
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            {canEditSubject && (
                              <button 
                                onClick={() => handleEditSubject(subject)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-blue-200 transition ease-in-out duration-150"
                                title="Edit subject"
                              >
                                <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                              </button>
                            )}
                            {canDeleteSubject && (
                              <button 
                                onClick={() => handleDeleteSubject(subject)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:border-red-300 focus:shadow-outline-red active:bg-red-200 transition ease-in-out duration-150"
                                title="Delete subject"
                              >
                                <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Delete
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
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, subject: null })}
        onConfirm={confirmDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteConfirm.subject?.subject_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default SubjectManagementPage;
