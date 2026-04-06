import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmployeeForm from '../components/forms/EmployeeForm';
import EmployeeList from '../components/layout/EmployeeList';
import employeeService from '../services/employeeService';
import EmployeeBulkImport from '../components/employees/EmployeeBulkImport';
import EmployeeBulkUpdate from '../components/employees/EmployeeBulkUpdate';
import { PERMISSIONS } from '../config/permissions';

const EmployeeManagementPage = () => {
  const { 
    getCampusId, 
    getCampusName, 
    hasPermission 
  } = useAuth();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'bulk', 'bulkUpdate'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const formRef = useRef(null);

  const canCreateEmployee = hasPermission(PERMISSIONS.EMPLOYEE_CREATE_ROUTE_CREATE);
  const canUpdateEmployee = hasPermission(PERMISSIONS.EMPLOYEE_EDIT);
  const canDeleteEmployee = hasPermission(PERMISSIONS.EMPLOYEE_DELETE_ROUTE_DELETE);
  const canBulkImportEmployees = hasPermission(PERMISSIONS.EMPLOYEE_IMPORT_CREATE);
  const canBulkExportEmployees = hasPermission(PERMISSIONS.EMPLOYEE_EXPORT_CREATE);
  const canBulkUpdateEmployees = hasPermission(PERMISSIONS.EMPLOYEE_BULK_UPDATE_CREATE);

  const canManageEmployees = canCreateEmployee || canUpdateEmployee || canDeleteEmployee || canBulkImportEmployees || canBulkExportEmployees || canBulkUpdateEmployees;

  // Handle view changes
  const handleShowList = () => {
    setCurrentView('list');
    setSelectedEmployee(null);
  };

  const handleAddEmployee = () => {
    if (!canCreateEmployee) {
      toast.error('You do not have permission to add employees');
      return;
    }
    setCurrentView('create');
    setSelectedEmployee(null);
    // Scroll to form after state update
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEditEmployee = (employee) => {
    if (!canUpdateEmployee) {
      toast.error('You do not have permission to edit employees');
      return;
    }
    setSelectedEmployee(employee);
    setCurrentView('edit');
    // Scroll to form after state update
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);

      if (currentView === 'create') {
        const response = await employeeService.createEmployee(formData);
        
        if (response.success) {
          toast.success('Employee created successfully');
          setCurrentView('list');
          setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        } else {
          throw new Error(response.message || 'Failed to create employee');
        }
      } else if (currentView === 'edit' && selectedEmployee) {
        const response = await employeeService.updateEmployeeByUsername(selectedEmployee.username, formData);
        
        if (response.success) {
          toast.success('Employee updated successfully');
          setCurrentView('list');
          setSelectedEmployee(null);
          setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        } else {
          throw new Error(response.message || 'Failed to update employee');
        }
      }

    } catch (error) {
      console.error('Error submitting employee form:', error);
      
      // Handle specific error cases
      if (error.message?.includes('duplicate')) {
        toast.error('Employee with this username or employee ID already exists');
      } else if (error.message?.includes('validation')) {
        toast.error('Please check your input data for errors');
      } else {
        toast.error(error.message || 'Failed to save employee data');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form cancellation
  const handleFormCancel = () => {
    setCurrentView('list');
    setSelectedEmployee(null);
  };

  // Permission-based access control message
  const renderAccessDenied = () => (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            You do not have permission to manage employees. Only users with employee management permissions can create, edit, or delete employee records.
          </p>
          <p className="text-sm text-gray-500">
            You can view employee information if you have the appropriate permissions.
          </p>
        </div>
      </Card>
    </div>
  );

  // Instructions component
  const renderInstructions = () => (
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
              <h3 className="text-sm font-medium text-blue-800">Employee Management Instructions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>View Employees:</strong> All authenticated users can view the employee list</li>
                  {canManageEmployees && (
                    <>
                      <li><strong>Add Employee:</strong> Click "Add Employee" to create a new employee record with complete details</li>
                      <li><strong>Edit Employee:</strong> Click "Edit" in the employee list to modify existing employee information</li>
                      <li><strong>Delete Employee:</strong> Click "Delete" to remove an employee (this action cannot be undone)</li>
                      <li><strong>Bulk Operations:</strong> Select multiple employees using checkboxes for bulk actions</li>
                    </>
                  )}
                  <li><strong>Filter & Search:</strong> Use the filter options to find specific employees by department, designation, or status</li>
                  <li><strong>Campus Scope:</strong> You can only manage employees within your assigned campus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage employee records, contact information, and employment details
              </p>
            </div>
            
            {currentView === 'list' && canManageEmployees && (
              <div className="flex items-center gap-2">
                {canBulkImportEmployees && (
                  <button
                    onClick={() => setCurrentView('bulk')}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Bulk Import
                  </button>
                )}
                {canBulkUpdateEmployees && (
                  <button
                    onClick={() => setCurrentView('bulkUpdate')}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Bulk Update
                  </button>
                )}
                {canCreateEmployee && (
                  <button
                    onClick={handleAddEmployee}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Employee
                  </button>
                )}
              </div>
            )}
            {/* Breadcrumb for form views */}
            {currentView !== 'list' && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <button
                  onClick={handleShowList}
                  className="hover:text-blue-600 transition-colors"
                >
                  Employee List
                </button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900">
                  {currentView === 'create' ? 'Add Employee' : 'Edit Employee'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {renderInstructions()}

        {/* Campus Info */}
        <div className="mb-6">
          <Card>
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Campus:</strong> {getCampusName()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Managing employees for this campus only
                  </p>
                </div>
                
                {currentView !== 'list' && (
                  <button
                    onClick={handleShowList}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        {currentView === 'list' ? (
          /* Employee List View */
          <EmployeeList
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            refreshTrigger={refreshTrigger}
            showFilters={true}
            showStats={true}
          />
        ) : currentView === 'bulk' ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Bulk Import Employees</h2>
              <button
                onClick={handleShowList}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
              </button>
            </div>
            <EmployeeBulkImport
              campusId={getCampusId()}
              onImportSuccess={() => {
                setCurrentView('list');
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </div>
        ) : currentView === 'bulkUpdate' ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Bulk Update Employees</h2>
              <button
                onClick={handleShowList}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
              </button>
            </div>
            <EmployeeBulkUpdate
              campusId={getCampusId()}
              onUpdateSuccess={() => {
                setCurrentView('list');
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </div>
        ) : canManageEmployees ? (
          /* Employee Form View */
          <div ref={formRef}>
            <Card>
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    {currentView === 'create' ? (
                      <>
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Employee
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Employee
                      </>
                    )}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {currentView === 'create' 
                      ? 'Fill in all the required information to create a new employee record'
                      : `Update the information for ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`
                    }
                  </p>
                </div>

                {formLoading && (
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400">
                    <div className="flex items-center">
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      <p className="text-sm text-blue-700">
                        {currentView === 'create' ? 'Creating employee...' : 'Updating employee...'}
                      </p>
                    </div>
                  </div>
                )}

                <EmployeeForm
                  employee={selectedEmployee}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  isLoading={formLoading}
                  mode={currentView}
                />
              </div>
            </Card>
          </div>
        ) : (
          /* Access Denied View */
          renderAccessDenied()
        )}
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
