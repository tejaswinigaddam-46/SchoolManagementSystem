import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import PhoneInput from '../ui/PhoneInput';
import employeeService from '../../services/employeeService';

// Input field component
const InputField = ({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  options = null, 
  className = '', 
  formData, 
  handleInputChange, 
  placeholder = '',
  disabled = false,
  helperText = '',
  error = null,
  multiple = false,
  rows = 3
}) => (
  <div className={`${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    
    {type === 'select' ? (
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        required={required}
        disabled={disabled}
        multiple={multiple}
      >
        <option value="">Select {label}</option>
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
    )}
    
    {helperText && !error && (
      <p className="mt-1 text-xs text-gray-500">{helperText}</p>
    )}
    
    {error && (
      <p className="mt-1 text-xs text-red-600">{error}</p>
    )}
  </div>
);

const EmployeeForm = ({ 
  employee = null, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create' // 'create' or 'edit'
}) => {
  const { getCampusId } = useAuth();
  const [formData, setFormData] = useState({
    // User details - maps to users table
    first_name: 'John',
    middle_name: 'Michael',
    last_name: 'Smith',
    date_of_birth: '1985-06-15',
    phone_number: '+1234567890',
    role: 'Employee',
    
    // Contact details - maps to user_contact_details table
    email: 'john.smith@school.edu',
    phone: '+1234567890',
    alt_phone: '+9087654321',
    emergency_contact_name: 'Jane Smith',
    emergency_contact_phone: '+1234567891',
    emergency_contact_relation: 'Spouse',
    current_address: '123 Main Street, Downtown Area, Near City Center',
    city: 'New York',
    state: 'New York',
    pincode: '10001',
    country: 'USA',
    permanent_address: '123 Main Street, Downtown Area, Near City Center',
    
    // Employment details - maps to employment_details table
    employee_id: 'EMP001',
    designation: 'Senior Teacher',
    department: 'Mathematics',
    joining_date: '2023-08-15',
    salary: '55000',
    employment_type: 'Full-time',
    status: 'Active',
    transport_details: 'Staff Bus Route 5',
    hostel_details: 'Staff Quarters, Room 10B',
    
    // Personal details - maps to user_personal_details table
    gender: 'Male',
    marital_status: 'Single',
    nationality: 'American',
    religion: 'Christian',
    caste: 'General',
    category: 'General',
    blood_group: 'O+',
    height_cm: '175',
    weight_kg: '70.5',
    medical_conditions: 'None',
    allergies: 'None',
    occupation: 'Teacher',
    income: '55000'
  });

  const [formErrors, setFormErrors] = useState({});
  const [enumOptions, setEnumOptions] = useState({
    designations: [],
    departments: [],
    employment_types: [],
    employment_status: [],
    genders: [],
    categories: [],
    blood_groups: []
  });
  const [checkingEmployeeId, setCheckingEmployeeId] = useState(false);

  // Load enum values and employee data
  useEffect(() => {
    loadEnumValues();
    if (employee && mode === 'edit') {
      loadEmployeeData();
    }
  }, [employee, mode]);

  const loadEnumValues = async () => {
    try {
      const response = await employeeService.getEnumValues();
      if (response.success) {
        const data = response.data?.data || response.data || {};
        setEnumOptions(data);
      }
    } catch (error) {
      console.error('Error loading enum values:', error);
      toast.error('Failed to load form options');
    }
  };

  const loadEmployeeData = async () => {
    try {
      if (!employee?.username) return;
      
      const response = await employeeService.getCompleteEmployeeForEdit(employee.username);
      if (response.success) {
        const data = response.data;
        
        // Map the response data to form structure
        setFormData({
          // User details
          first_name: data.user?.first_name || '',
          middle_name: data.user?.middle_name || '',
          last_name: data.user?.last_name || '',
          date_of_birth: data.user?.date_of_birth || '',
          phone_number: data.user?.phone_number || '',
          role: data.user?.role || 'Employee',
          
          // Contact details
          email: data.contact?.email || '',
          phone: data.contact?.phone || '',
          alt_phone: data.contact?.alt_phone || '',
          emergency_contact_name: data.contact?.emergency_contact_name || '',
          emergency_contact_phone: data.contact?.emergency_contact_phone || '',
          emergency_contact_relation: data.contact?.emergency_contact_relation || '',
          current_address: data.contact?.current_address || '',
          city: data.contact?.city || '',
          state: data.contact?.state || '',
          pincode: data.contact?.pincode || '',
          country: data.contact?.country || '',
          permanent_address: data.contact?.permanent_address || '',
          
          // Employment details
          employee_id: data.employment?.employee_id || '',
          designation: data.employment?.designation || '',
          department: data.employment?.department || '',
          joining_date: data.employment?.joining_date || '',
          salary: data.employment?.salary || '',
          employment_type: data.employment?.employment_type || 'Full-time',
          status: data.employment?.status || 'Active',
          transport_details: data.employment?.transport_details || '',
          hostel_details: data.employment?.hostel_details || '',
          
          // Personal details
          gender: data.personal?.gender || '',
          marital_status: data.personal?.marital_status || '',
          nationality: data.personal?.nationality || '',
          religion: data.personal?.religion || '',
          caste: data.personal?.caste || '',
          category: data.personal?.category || '',
          blood_group: data.personal?.blood_group || '',
          height_cm: data.personal?.height_cm || '',
          weight_kg: data.personal?.weight_kg || '',
          medical_conditions: data.personal?.medical_conditions || '',
          allergies: data.personal?.allergies || '',
          occupation: data.personal?.occupation || '',
          income: data.personal?.income || ''
        });
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('Failed to load employee data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Check employee ID availability (debounced)
  const checkEmployeeIdAvailability = async (employeeId) => {
    if (!employeeId || employeeId.length < 2) return;
    if (mode === 'edit' && employeeId === employee?.employee_id) return;

    try {
      setCheckingEmployeeId(true);
      const response = await employeeService.checkEmployeeIdAvailability(employeeId, getCampusId());
      
      if (!response.success || !response.data.available) {
        setFormErrors(prev => ({
          ...prev,
          employee_id: 'Employee ID is already taken in this campus'
        }));
      } else {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.employee_id;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking employee ID:', error);
    } finally {
      setCheckingEmployeeId(false);
    }
  };

  // Debounce employee ID check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.employee_id) {
        checkEmployeeIdAvailability(formData.employee_id);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.employee_id]);

  const validateForm = () => {
    const errors = {};

    // Required field validations with proper type handling
    const requiredFields = {
      first_name: { label: 'First Name', type: 'string' },
      last_name: { label: 'Last Name', type: 'string' },
      date_of_birth: { label: 'Date of Birth', type: 'string' },
      phone_number: { label: 'Phone Number', type: 'string' },
      role: { label: 'Role', type: 'select' },
      email: { label: 'Email', type: 'string' },
      phone: { label: 'Phone', type: 'string' },
      current_address: { label: 'Current Address', type: 'string' },
      city: { label: 'City', type: 'string' },
      state: { label: 'State', type: 'string' },
      pincode: { label: 'Pin Code', type: 'string' },
      country: { label: 'Country', type: 'string' },
      employee_id: { label: 'Employee ID', type: 'string' },
      designation: { label: 'Designation', type: 'select' },
      department: { label: 'Department', type: 'select' },
      joining_date: { label: 'Joining Date', type: 'string' },
      salary: { label: 'Salary', type: 'number' },
      employment_type: { label: 'Employment Type', type: 'select' },
      status: { label: 'Status', type: 'select' },
      gender: { label: 'Gender', type: 'select' },
      nationality: { label: 'Nationality', type: 'string' },
      emergency_contact_relation: { label: 'Emergency Contact Relation', type: 'select' }
    };

    Object.entries(requiredFields).forEach(([field, config]) => {
      const value = formData[field];
      let isEmpty = false;

      if (config.type === 'string') {
        isEmpty = !value || !value.trim();
      } else if (config.type === 'select') {
        isEmpty = !value || value === '';
      } else if (config.type === 'number') {
        isEmpty = !value || value === '' || value === '0';
      }

      if (isEmpty) {
        errors[field] = `${config.label} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    if (formData.phone_number && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone_number)) {
      errors.phone_number = 'Please enter a valid phone number';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Salary validation
    if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) < 0)) {
      errors.salary = 'Please enter a valid salary amount';
    }

    // Numeric validations for optional fields
    if (formData.height_cm && (isNaN(formData.height_cm) || parseInt(formData.height_cm) <= 0)) {
      errors.height_cm = 'Please enter a valid height in centimeters';
    }

    if (formData.weight_kg && (isNaN(formData.weight_kg) || parseFloat(formData.weight_kg) <= 0)) {
      errors.weight_kg = 'Please enter a valid weight in kilograms';
    }

    if (formData.income && (isNaN(formData.income) || parseFloat(formData.income) < 0)) {
      errors.income = 'Please enter a valid income amount';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 ? errors : errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors);
      toast.error(messages[0] || 'Please fix the errors in the form');
      return;
    }

    // Check for any existing employee ID errors
    if (formErrors.employee_id) {
      toast.error('Please fix the employee ID conflicts');
      return;
    }

    try {
      // Prepare the data for submission - backend expects specific structure
      const submitData = {
        // User information section
        user: {
          first_name: formData.first_name,
          middle_name: formData.middle_name || null,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          phone_number: formData.phone_number,
          role: formData.role
          // username and password are auto-generated by backend
        },
        
        // Contact details section - backend expects 'contact' NOT 'contact_details'
        contact: {
          email: formData.email,
          phone: formData.phone,
          alt_phone: formData.alt_phone || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          emergency_contact_relation: formData.emergency_contact_relation || null,
          current_address: formData.current_address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
          permanent_address: formData.permanent_address
        },
        
        // Employment details section - backend expects 'employment' NOT 'employment_details'
        employment: {
          employee_id: formData.employee_id,
          designation: formData.designation,
          department: formData.department,
          joining_date: formData.joining_date,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          employment_type: formData.employment_type,
          status: formData.status,
          transport_details: formData.transport_details || null,
          hostel_details: formData.hostel_details || null
        },
        
        // Personal details section - backend expects 'personal' (optional)
        personal: {
          gender: formData.gender,
          marital_status: formData.marital_status || null,
          nationality: formData.nationality,
          religion: formData.religion || null,
          caste: formData.caste || null,
          category: formData.category || null,
          blood_group: formData.blood_group || null,
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          medical_conditions: formData.medical_conditions || null,
          allergies: formData.allergies || null,
          occupation: formData.occupation || null,
          income: formData.income ? parseFloat(formData.income) : null
        }
      };

      await onSubmit(submitData);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* User Details Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          User Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="First Name"
            name="first_name"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.first_name}
          />
          
          <InputField
            label="Middle Name"
            name="middle_name"
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <InputField
            label="Last Name"
            name="last_name"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.last_name}
          />
          
          <InputField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.date_of_birth}
          />
          
          <PhoneInput
            label="Phone Number"
            name="phone_number"
            required
            value={formData.phone_number}
            onChange={handleInputChange}
            error={formErrors.phone_number}
          />
          
          <InputField
            label="Gender"
            name="gender"
            type="select"
            required
            options={enumOptions.genders}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.gender}
          />
          
          <InputField
            label="Role"
            name="role"
            type="select"
            required
            options={[
              { value: 'Employee', label: 'Employee' },
              { value: 'Admin', label: 'Admin' }
            ]}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.role}
          />
        </div>
      </div>

      {/* Contact Details Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Email Address"
            name="email"
            type="email"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.email}
          />
          
          <PhoneInput
            label="Phone Number"
            name="phone"
            required
            value={formData.phone}
            onChange={handleInputChange}
            error={formErrors.phone}
          />
          
          <PhoneInput
            label="Alternative Phone"
            name="alt_phone"
            value={formData.alt_phone}
            onChange={handleInputChange}
          />
          
          <InputField
            label="Emergency Contact Name"
            name="emergency_contact_name"
            formData={formData}
            handleInputChange={handleInputChange}
            helperText="Optional - Emergency contact person name"
          />
          
          <PhoneInput
            label="Emergency Contact Phone"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleInputChange}
            helperText="Optional - Emergency contact phone number"
          />
          
          <InputField
            label="Emergency Contact Relation"
            name="emergency_contact_relation"
            type="select"
            required
            options={[
              { value: 'Mother', label: 'Mother' },
              { value: 'Father', label: 'Father' },
              { value: 'Guardian', label: 'Guardian' },
              { value: 'Other', label: 'Other' }
            ]}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.emergency_contact_relation}
          />
          
          <InputField
            label="Current Address"
            name="current_address"
            type="textarea"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.current_address}
            className="md:col-span-2"
          />
          
          <InputField
            label="City"
            name="city"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.city}
          />
          
          <InputField
            label="State"
            name="state"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.state}
          />
          
          <InputField
            label="Pin Code"
            name="pincode"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.pincode}
          />
          
          <InputField
            label="Country"
            name="country"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.country}
          />
          
          <InputField
            label="Permanent Address"
            name="permanent_address"
            type="textarea"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
        </div>
      </div>

      {/* Employment Details Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
          Employment Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="Employee ID"
            name="employee_id"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.employee_id}
            helperText={checkingEmployeeId ? 'Checking availability...' : 'Must be unique within campus'}
          />
          
          <InputField
            label="Designation"
            name="designation"
            type="select"
            required
            options={enumOptions.designations}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.designation}
          />
          
          <InputField
            label="Department"
            name="department"
            type="select"
            required
            options={enumOptions.departments}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.department}
          />
          
          <InputField
            label="Joining Date"
            name="joining_date"
            type="date"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.joining_date}
          />
          
          <InputField
            label="Salary"
            name="salary"
            type="number"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.salary}
            placeholder="0.00"
          />
          
          <InputField
            label="Employment Type"
            name="employment_type"
            type="select"
            required
            options={enumOptions.employment_types}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.employment_type}
          />
          
          <InputField
            label="Status"
            name="status"
            type="select"
            required
            options={enumOptions.employment_status}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.status}
          />
          
          <InputField
            label="Transport Details"
            name="transport_details"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., Staff Bus Route 5"
          />
          
          <InputField
            label="Hostel Details"
            name="hostel_details"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., Staff Quarters, Room 10B"
          />
        </div>
      </div>

      {/* Personal Details Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Personal Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="Gender"
            name="gender"
            type="select"
            required
            options={enumOptions.genders}
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.gender}
          />
          
          <InputField
            label="Marital Status"
            name="marital_status"
            type="select"
            options={[
              { value: 'Single', label: 'Single' },
              { value: 'Married', label: 'Married' },
              { value: 'Divorced', label: 'Divorced' },
              { value: 'Widowed', label: 'Widowed' }
            ]}
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <InputField
            label="Nationality"
            name="nationality"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.nationality}
          />
          
          <InputField
            label="Religion"
            name="religion"
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <InputField
            label="Caste"
            name="caste"
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <InputField
            label="Category"
            name="category"
            type="select"
            options={enumOptions.categories}
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <InputField
            label="Blood Group"
            name="blood_group"
            type="select"
            options={enumOptions.blood_groups}
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <InputField
            label="Height (cm)"
            name="height_cm"
            type="number"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., 175"
          />
          
          <InputField
            label="Weight (kg)"
            name="weight_kg"
            type="number"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., 70.5"
          />
          
          <InputField
            label="Medical Conditions"
            name="medical_conditions"
            type="textarea"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Allergies"
            name="allergies"
            type="textarea"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Occupation"
            name="occupation"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., Teacher"
          />
          
          <InputField
            label="Income"
            name="income"
            type="number"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., 55000"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className={`px-6 py-2 text-white rounded-md transition-colors flex items-center gap-2 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner className="w-4 h-4" />}
          {mode === 'create' ? 'Create Employee' : 'Update Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
