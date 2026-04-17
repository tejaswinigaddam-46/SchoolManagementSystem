import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Download, Upload, Edit } from 'lucide-react';
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
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-secondary-900 mb-2">Access Restricted</h3>
          <p className="text-secondary-600 mb-4">
            You do not have permission to manage employees. Only users with employee management permissions can create, edit, or delete employee records.
          </p>
          <p className="text-sm text-secondary-500">
            You can view employee information if you have the appropriate permissions.
          </p>
        </div>
      </div>
    </div>
  );

  if (currentView !== 'list') {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {currentView === 'bulk' ? (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary-900">Bulk Import Employees</h2>
                <button
                  onClick={handleShowList}
                  className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to List
                </button>
              </div>
              <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden p-4 sm:p-6">
                <EmployeeBulkImport
                  campusId={getCampusId()}
                  onImportSuccess={() => {
                    setCurrentView('list');
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  onCancel={handleShowList}
                />
              </div>
            </div>
          ) : currentView === 'bulkUpdate' ? (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-secondary-900">Bulk Update Employees</h2>
                <button
                  onClick={handleShowList}
                  className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to List
                </button>
              </div>
               <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden p-4 sm:p-6">
                <EmployeeBulkUpdate
                    campusId={getCampusId()}
                    onUpdateSuccess={() => {
                      setCurrentView('list');
                      setRefreshTrigger(prev => prev + 1);
                    }}
                    onCancel={handleShowList}
                  />
               </div>
            </div>
          ) : canManageEmployees ? (
            <div ref={formRef}>
              <Card>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-secondary-900">
                      {currentView === 'create' ? 'Add New Employee' : 'Edit Employee'}
                    </h2>
                    <button
                      onClick={handleShowList}
                      className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to List
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-secondary-600 text-sm sm:text-base">
                      {currentView === 'create' 
                        ? 'Fill in all the required information to create a new employee record'
                        : `Update the information for ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`
                      }
                    </p>
                  </div>

                  {formLoading && (
                    <div className="mb-6 p-3 bg-primary-50 border-l-4 border-primary-400">
                      <div className="flex items-center">
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        <p className="text-sm text-primary-700">
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
            renderAccessDenied()
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Employee Management</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Campus: {getCampusName()}</p>
            </div>
            
            {canCreateEmployee && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleAddEmployee}
                  className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Employee
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Employee List View */}
        <EmployeeList
          onEditEmployee={handleEditEmployee}
          onBulkImport={() => setCurrentView('bulk')}
          onBulkUpdate={() => setCurrentView('bulkUpdate')}
          refreshTrigger={refreshTrigger}
          showFilters={true}
          showStats={true}
        />
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
