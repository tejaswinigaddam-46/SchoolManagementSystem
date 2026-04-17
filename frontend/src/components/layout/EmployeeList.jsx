import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, Edit, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import employeeService from '../../services/employeeService';
import PhoneNumberDisplay from '../ui/PhoneNumberDisplay';
import { PERMISSIONS } from '../../config/permissions';
import { EditButton, DeleteButton, ActionButtonGroup } from '../ui/ActionButtons';

// Table component for better organization
const EmployeeTable = ({ 
  employees, 
  onEdit, 
  onDelete, 
  canSelectEmployees,
  canPerformRowActions,
  loading, 
  onSelectEmployee,
  selectedEmployees 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner className="w-8 h-8" />
        <span className="ml-2 text-gray-500">Loading employees...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 bg-white">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-secondary-100 rounded-full">
            <svg className="h-10 w-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-bold text-secondary-900">No employees found</h3>
        <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
          No employees are currently registered for this campus.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50/50">
          <tr>
            {canSelectEmployees && (
              <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === employees.length && employees.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectEmployee(employees.map(emp => emp.username));
                    } else {
                      onSelectEmployee([]);
                    }
                  }}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Designation
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
              Joining Date
            </th>
            {canPerformRowActions && (
              <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-200">
          {employees.map((employee) => (
            <tr key={employee.username} className="hover:bg-secondary-50 transition-colors">
              {canSelectEmployees && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.username)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectEmployee([...selectedEmployees, employee.username]);
                      } else {
                        onSelectEmployee(selectedEmployees.filter(id => id !== employee.username));
                      }
                    }}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary-900">
                {employee.employee_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center border border-secondary-200">
                      <span className="text-sm font-bold text-secondary-700">
                        {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-bold text-secondary-900">
                      {`${employee.first_name} ${employee.middle_name || ''} ${employee.last_name}`.trim()}
                    </div>
                    <div className="text-sm text-secondary-500 font-medium">
                      @{employee.username}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                {employee.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                {employee.designation}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  employee.employment_status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : employee.employment_status === 'On Leave'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.employment_status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-secondary-900 font-medium">{employee.email}</div>
                <PhoneNumberDisplay value={employee.phone_number} className="text-sm text-secondary-500 font-medium" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 font-medium">
                {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}
              </td>
              {canPerformRowActions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <ActionButtonGroup>
                    <EditButton
                      onClick={() => onEdit(employee)}
                      title="Edit employee"
                    />
                    <DeleteButton
                      onClick={() => onDelete(employee)}
                      title="Delete employee"
                      confirmMessage={`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`}
                    />
                  </ActionButtonGroup>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Filter component
const EmployeeFilters = ({ filters, onFilterChange, enumOptions, onClearFilters }) => {
  const hasActiveFilters = filters.search || filters.department || filters.designation || filters.status || filters.employment_type;

  return (
    <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-soft mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Employee
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Name, ID, or Email"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            value={filters.department || ''}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {enumOptions.departments?.map(dept => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Designation
          </label>
          <select
            value={filters.designation || ''}
            onChange={(e) => onFilterChange('designation', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Designations</option>
            {enumOptions.designations?.map(desig => (
              <option key={desig.value} value={desig.value}>{desig.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {enumOptions.employment_status?.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Type
          </label>
          <select
            value={filters.employment_type || ''}
            onChange={(e) => onFilterChange('employment_type', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {enumOptions.employment_types?.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
                <button onClick={() => onFilterChange('search', '')} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200">×</button>
              </span>
            )}
            {filters.department && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Dept: {enumOptions.departments?.find(d => d.value === filters.department)?.label}
                <button onClick={() => onFilterChange('department', '')} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200">×</button>
              </span>
            )}
            {filters.designation && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Desig: {enumOptions.designations?.find(d => d.value === filters.designation)?.label}
                <button onClick={() => onFilterChange('designation', '')} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-600 hover:bg-purple-200">×</button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Status: {enumOptions.employment_status?.find(s => s.value === filters.status)?.label}
                <button onClick={() => onFilterChange('status', '')} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-600 hover:bg-yellow-200">×</button>
              </span>
            )}
            {filters.employment_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Type: {enumOptions.employment_types?.find(t => t.value === filters.employment_type)?.label}
                <button onClick={() => onFilterChange('employment_type', '')} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-orange-600 hover:bg-orange-200">×</button>
              </span>
            )}
          </div>
          <button
            onClick={onClearFilters}
            className="text-sm font-medium px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full md:w-auto transition-colors shadow-sm"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

// Statistics component
const EmployeeStats = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    {
      label: 'Total Departments',
      value: stats.total_departments,
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Total Employees',
      value: stats.total_employees,
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Active Employees',
      value: stats.active_employees,
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-100'
    },
    {
      label: 'On Leave Employees',
      value: stats.on_leave_employees,
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-100'
    }
  ].filter(item => item.value > 0);

  if (statItems.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(statItems.length, 4)} gap-6 mb-6`}>
      {statItems.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${item.bgColor} rounded-md flex items-center justify-center`}>
                {item.icon}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-500">{item.label}</p>
              <p className="text-2xl font-bold text-secondary-900">{item.value || 0}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const EmployeeList = ({ 
  onEditEmployee,
  onBulkImport,
  onBulkUpdate,
  refreshTrigger,
  showFilters = true,
  showStats = true 
}) => {
  const { getCampusId, hasPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    employee: null,
    isMultiple: false
  });

  // Filter state
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    status: '',
    employment_type: '',
    search: ''
  });

  // Enum options for filters
  const [enumOptions, setEnumOptions] = useState({
    departments: [],
    designations: [],
    employment_status: [],
    employment_types: []
  });

  // Statistics
  const [stats, setStats] = useState(null);

  // Permission-based capabilities
  const canUpdateEmployee = hasPermission(PERMISSIONS.EMPLOYEE_EDIT);
  const canDeleteEmployee = hasPermission(PERMISSIONS.EMPLOYEE_DELETE_ROUTE_DELETE);
  const canExportEmployees = hasPermission(PERMISSIONS.EMPLOYEE_EXPORT_CREATE);

  const canSelectEmployees = canDeleteEmployee || canExportEmployees;
  const canPerformRowActions = canUpdateEmployee || canDeleteEmployee;

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const params = {
        campus_id: getCampusId(),
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await employeeService.getAllEmployees(params);
      
      if (response.success) {
        setEmployees(response.data.employees || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        }));
      }
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Load enum options
  const fetchEnumOptions = async () => {
    try {
      const response = await employeeService.getEnumValues();
      if (response.success) {
        setEnumOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading enum options:', error);
    }
  };

  // Load statistics
  const fetchStats = async () => {
    try {
      const response = await employeeService.getEmployeeStatistics(getCampusId());
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchEnumOptions();
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  // Fetch employees when filters or pagination change
  useEffect(() => {
    fetchEmployees();
  }, [filters, pagination.page, refreshTrigger]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Clear all filters
  const handleClearFilters = () => {
    console.log('🧹 Clearing all filters');
    const clearedFilters = {
      department: '',
      designation: '',
      status: '',
      employment_type: '',
      search: ''
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle employee selection
  const handleSelectEmployee = (usernames) => {
    setSelectedEmployees(Array.isArray(usernames) ? usernames : [usernames]);
  };

  // Handle delete confirmation
  const handleDeleteClick = (employee) => {
    setDeleteConfirm({
      show: true,
      employee: employee,
      isMultiple: false
    });
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees to delete');
      return;
    }
    
    setDeleteConfirm({
      show: true,
      employee: null,
      isMultiple: true
    });
  };

  // Handle export
  const handleExport = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees to export');
      return;
    }

    try {
      const toastId = toast.loading('Exporting employees...');
      await employeeService.exportEmployees(selectedEmployees);
      toast.dismiss(toastId);
      toast.success('Employees exported successfully');
      setSelectedEmployees([]); // Optional: clear selection after export
    } catch (error) {
      console.error('Error exporting employees:', error);
      toast.error('Failed to export employees');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      
      if (deleteConfirm.isMultiple) {
        // Bulk delete
        const deletePromises = selectedEmployees.map(username => 
          employeeService.deleteEmployeeByUsername(username)
        );
        
        await Promise.all(deletePromises);
        toast.success(`Successfully deleted ${selectedEmployees.length} employees`);
        setSelectedEmployees([]);
      } else {
        // Single delete
        await employeeService.deleteEmployeeByUsername(deleteConfirm.employee.username);
        toast.success('Employee deleted successfully');
      }
      
      // Refresh the list
      fetchEmployees();
      if (showStats) {
        fetchStats();
      }
      
    } catch (error) {
      console.error('Error deleting employee(s):', error);
      toast.error(error.message || 'Failed to delete employee(s)');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ show: false, employee: null, isMultiple: false });
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {showStats && <EmployeeStats stats={stats} />}
      
      {/* Filters */}
      {showFilters && (
        <EmployeeFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          enumOptions={enumOptions}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-secondary-900">Employees List</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {selectedEmployees.length > 0 && (canExportEmployees || canDeleteEmployee) && (
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Export ({selectedEmployees.length})</span>
                </button>
              </div>
            )}
            
            {onBulkImport && (
              <button
                onClick={onBulkImport}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium flex-1 sm:flex-none"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>
            )}
            
            {onBulkUpdate && (
              <button
                onClick={onBulkUpdate}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium flex-1 sm:flex-none"
              >
                <Edit className="w-4 h-4" />
                <span>Bulk Update</span>
              </button>
            )}
          </div>
        </div>
        
        <EmployeeTable
          employees={employees}
          onEdit={onEditEmployee}
          onDelete={handleDeleteClick}
          canSelectEmployees={canSelectEmployees}
          canPerformRowActions={canPerformRowActions}
          loading={loading}
          onSelectEmployee={handleSelectEmployee}
          selectedEmployees={selectedEmployees}
        />
        
        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50/30">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-500 font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn-secondary py-1 px-3 text-xs"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1 text-sm font-bold text-secondary-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn-secondary py-1 px-3 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, employee: null, isMultiple: false })}
        onConfirm={confirmDelete}
        title={deleteConfirm.isMultiple ? 'Delete Employees' : 'Delete Employee'}
        message={
          deleteConfirm.isMultiple ? (
            <div>
              <p className="mb-2">
                Are you sure you want to delete <strong>{selectedEmployees.length}</strong> selected employees?
              </p>
              <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>Warning:</strong> This action cannot be undone. All employee data including user accounts, contact details, employment records, and personal information will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : deleteConfirm.employee ? (
            <div>
              <p className="mb-2">
                Are you sure you want to delete <strong>{deleteConfirm.employee.first_name} {deleteConfirm.employee.last_name}</strong>?
              </p>
              <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>Warning:</strong> This action cannot be undone. All employee data including user account, contact details, employment records, and personal information will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : "Are you sure you want to delete this employee?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default EmployeeList;
