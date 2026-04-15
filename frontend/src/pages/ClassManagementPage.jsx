import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import classService from '../services/classService';
import { PERMISSIONS } from '../config/permissions';
// InputField component for form fields
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange }) => (
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
      >
        <option value="">Select</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
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
      />
    )}
  </div>
);

const ClassManagement = () => {
  const { getCampusId, getCampusName, hasPermission } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [editingClass, setEditingClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, class: null });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [filters, setFilters] = useState({ search: '' });
  const [formData, setFormData] = useState({
    className: '',
    classLevel: ''
  });

  const canCreateClass = hasPermission && hasPermission(PERMISSIONS.CLASS_CREATE);
  const canEditOrDeleteClass =
    hasPermission &&
    (hasPermission(PERMISSIONS.CLASS_EDIT) || hasPermission(PERMISSIONS.CLASS_DELETE));

  // Reset form data helper
  const resetFormData = () => {
    setFormData({
      className: '',
      classLevel: ''
    });
  };

  // Load classes on component mount
  useEffect(() => {
    fetchClasses();
  }, [filters, pagination.current_page]);

  // Fetch classes from API
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current_page,
        limit: 20,
        ...filters
      };
      
      const response = await classService.getAllClasses(params);
      if (response.success) {
        setClasses(response.data.classes || []);
        setPagination(response.data.pagination || { current_page: 1, total_pages: 1, total_count: 0 });
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error(error.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Get campus ID from auth context
      const campusId = getCampusId();
      if (!campusId) {
        toast.error('Campus information not available. Please try logging in again.');
        return;
      }

      // Prepare class data with campus ID
      const classData = {
        ...formData,
        campusId: campusId
      };
      
      if (showEditForm && editingClass) {
        // Update existing class
        const response = await classService.updateClass(editingClass.classId, classData);
        if (response.success) {
          toast.success('Class updated successfully!');
          fetchClasses();
          setShowEditForm(false);
          setEditingClass(null);
          resetFormData();
        }
      } else {
        // Create new class
        const response = await classService.createClass(classData);
        if (response.success) {
          toast.success('Class created successfully!');
          fetchClasses();
          setShowAddForm(false);
          resetFormData();
        }
      }
    } catch (error) {
      console.error('Error saving class:', error);
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => toast.error(err.message));
      } else {
        toast.error(error.message || 'Failed to save class');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit class
  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      className: classItem.className || '',
      classLevel: classItem.classLevel || ''
    });
    setShowEditForm(true);
  };

  // Handle delete class
  const handleDeleteClass = (classItem) => {
    setDeleteConfirm({ show: true, class: classItem });
  };

  // Confirm delete class
  const confirmDeleteClass = async () => {
    try {
      setDeleting(true);
      const response = await classService.deleteClass(deleteConfirm.class.classId);
      if (response.success) {
        toast.success('Class deleted successfully!');
        fetchClasses();
        setDeleteConfirm({ show: false, class: null });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddClass = () => {
    resetFormData();
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingClass(null);
    resetFormData();
  };

  const handleRowClick = (classItem) => {
    console.log('Class clicked:', classItem);
  };

  // Class level options (1-12 typically for K-12 schools)
  const classLevelOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  if (showAddForm || showEditForm) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {showEditForm ? 'Edit Class' : 'Add Class'}
              </h2>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Campus:</strong> {getCampusName()}
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  <InputField 
                    label="Class Name" 
                    name="className" 
                    required 
                    className="" 
                    placeholder="First Standard"
                    formData={formData} 
                    handleInputChange={handleInputChange} 
                  />
                  <InputField 
                    label="Class Level" 
                    name="classLevel" 
                    type="select"
                    options={classLevelOptions}
                    required 
                    className="" 
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
                    className="px-6 py-2 btn-primary rounded hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading && <LoadingSpinner className="w-4 h-4" />}
                    {showEditForm ? 'Update Class' : 'Add Class'}
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
          <h1 className="text-3xl font-bold text-gray-800">Class Management</h1>
          <p className="text-gray-600 mt-1">Campus: {getCampusName()}</p>
        </div>
        {canCreateClass && (
          <button
            onClick={handleAddClass}
            className="bg-blue-600 btn-primary px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Class
          </button>
        )}
      </div>

      {/* Instructions Card */}
      <div className="mb-6">
        <Card>
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Instructions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Creating Classes:</strong> Click "Add Class" to create a new class with a unique name and level (1-12)</li>
                    <li><strong>Viewing Classes:</strong> All users can view the class list showing Class ID, Name, and Level</li>
                    <li><strong>Editing Classes:</strong> Users with class_update permission can edit class names and levels using the "Edit" button</li>
                    <li><strong>Deleting Classes:</strong> Users with class_update permission can delete classes. Classes with enrolled students cannot be deleted</li>
                    <li><strong>Search:</strong> Use the search bar to find classes by name</li>
                    <li><strong>Note:</strong> Each class name must be unique within your campus</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters - Always show */}
      <div className="mb-6">
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Classes List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Classes List</h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="w-6 h-6" />
              <p className="ml-2 text-gray-500">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? 'No classes match your search criteria.' : 'Get started by creating your first class.'}
              </p>
              {!filters.search && canCreateClass && (
                <div className="mt-6">
                  <button
                    onClick={handleAddClass}
                    className="btn-primary inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md hover:bg-primary-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Class
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Level</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <tr 
                      key={classItem.classId} 
                      className="hover:bg-gray-50 transition-colors duration-150" 
                      onClick={(e) => {
                        // Prevent row click if action button is clicked
                        if (e.target.closest('button')) return;
                        handleRowClick(classItem);
                      }}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{classItem.className}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Level {classItem.classLevel}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {canEditOrDeleteClass ? (
                            <>
                              <button 
                                onClick={() => handleEditClass(classItem)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-blue-200 transition ease-in-out duration-150"
                                title="Edit class"
                              >
                                <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteClass(classItem)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:border-red-300 focus:shadow-outline-red active:bg-red-200 transition ease-in-out duration-150"
                                title="Delete class"
                              >
                                <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                              <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                disabled={pagination.current_page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_count} total classes)
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.total_pages, prev.current_page + 1) }))}
                disabled={pagination.current_page === pagination.total_pages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, class: null })}
        onConfirm={confirmDeleteClass}
        title="Delete Class"
        message={
          <div>
            <p className="mb-2">Are you sure you want to delete <strong>"{deleteConfirm.class?.className}"</strong>?</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> This action cannot be undone. If students are enrolled in this class, deletion will be prevented.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText="Delete Class"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default ClassManagement;
