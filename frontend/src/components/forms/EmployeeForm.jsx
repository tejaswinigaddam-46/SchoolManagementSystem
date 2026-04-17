import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import PhoneInput from '../ui/PhoneInput';
import RequiredAsterisk from '../ui/RequiredAsterisk';
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
      {label} {required && <RequiredAsterisk />}
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
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    role: 'Employee',
    
    // Contact details - maps to user_contact_details table
    email: '',
    phone: '',
    alt_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    current_address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    permanent_address: '',
    
    // Employment details - maps to employment_details table
    employee_id: '',
    designation: '',
    department: '',
    joining_date: '',
    salary: '',
    employment_type: 'Full-time',
    status: 'Active',
    transport_details: '',
    hostel_details: '',
    
    // Personal details - maps to user_personal_details table
    gender: '',
    marital_status: 'Single',
    nationality: '',
    religion: '',
    caste: '',
    category: '',
    blood_group: '',
    height_cm: '',
    weight_kg: '',
    medical_conditions: '',
    allergies: '',
    occupation: '',
    income: ''
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
    return errors;
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
      {/* Section 1: User Information */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
          User Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-8 gap-x-4 gap-y-6">
          <InputField
            label="First Name"
            name="first_name"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.first_name}
            className="md:col-span-2"
          />
          
          <InputField
            label="Middle Name"
            name="middle_name"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Last Name"
            name="last_name"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.last_name}
            className="md:col-span-2"
          />
          
          <InputField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.date_of_birth}
            className="md:col-span-2"
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
            className="md:col-span-2"
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
            className="md:col-span-2"
          />

                    <PhoneInput
            label="Phone Number"
            name="phone_number"
            required
            value={formData.phone_number}
            onChange={handleInputChange}
            error={formErrors.phone_number}
            className="md:col-span-3"
          />
        </div>
      </div>

      {/* Section 2: Contact Information */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-8 gap-x-4 gap-y-6">
          {/* Row 1: Email, Phone, Alt Phone (1:1.5:1.5 ratio) */}
          <InputField
            label="Email Address"
            name="email"
            type="email"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.email}
            className="md:col-span-2"
          />
          
          <PhoneInput
            label="Phone Number"
            name="phone"
            required
            value={formData.phone}
            onChange={handleInputChange}
            error={formErrors.phone}
            className="md:col-span-3"
          />
          
          <PhoneInput
            label="Alternative Phone"
            name="alt_phone"
            value={formData.alt_phone}
            onChange={handleInputChange}
            className="md:col-span-3"
          />
          
          {/* Row 2: Emergency Details (1:2:1 ratio) */}
          <InputField
            label="Emergency Contact Name"
            name="emergency_contact_name"
            formData={formData}
            handleInputChange={handleInputChange}
            helperText="Optional - Contact person name"
            className="md:col-span-2"
          />
          
          <PhoneInput
            label="Emergency Contact Phone"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleInputChange}
            helperText="Optional - Contact phone number"
            className="md:col-span-3"
          />
          
          <InputField
            label="Emergency Contacat Relation"
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
            className="md:col-span-3"
          />
          
          {/* Row 3: Location Details */}
          <InputField
            label="City"
            name="city"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.city}
            className="md:col-span-2"
          />
          
          <InputField
            label="State"
            name="state"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.state}
            className="md:col-span-2"
          />
          
          <InputField
            label="Pin Code"
            name="pincode"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.pincode}
            className="md:col-span-2"
          />
          
          <InputField
            label="Country"
            name="country"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.country}
            className="md:col-span-2"
          />
          
          {/* Row 4: Addresses */}
          <InputField
            label="Current Address"
            name="current_address"
            type="textarea"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.current_address}
            className="md:col-span-4"
          />
          
          <InputField
            label="Permanent Address"
            name="permanent_address"
            type="textarea"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-4"
          />
        </div>
      </div>

      {/* Section 3: Employment Details */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
          Employment Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-8 gap-x-4 gap-y-6">
          <InputField
            label="Employee ID"
            name="employee_id"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.employee_id}
            helperText={checkingEmployeeId ? 'Checking availability...' : 'Must be unique'}
            className="md:col-span-2"
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
            className="md:col-span-2"
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
            className="md:col-span-2"
          />
          
          <InputField
            label="Joining Date"
            name="joining_date"
            type="date"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.joining_date}
            className="md:col-span-2"
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
            className="md:col-span-2"
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
            className="md:col-span-2"
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
            className="md:col-span-2"
          />
          
          <InputField
            label="Transport Details"
            name="transport_details"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., Staff Bus Route 5"
            className="md:col-span-2"
          />
          
          <InputField
            label="Hostel Details"
            name="hostel_details"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., Staff Quarters, Room 10B"
            className="md:col-span-3"
          />
        </div>
      </div>

      {/* Section 4: Personal Details */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
          Personal Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-8 gap-x-4 gap-y-6">
           <InputField
            label="Nationality"
            name="nationality"
            required
            formData={formData}
            handleInputChange={handleInputChange}
            error={formErrors.nationality}
            className="md:col-span-2"
          />
          
          <InputField
            label="Religion"
            name="religion"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Caste"
            name="caste"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Category"
            name="category"
            type="select"
            options={enumOptions.categories}
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Blood Group"
            name="blood_group"
            type="select"
            options={enumOptions.blood_groups}
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-2"
          />
          
          <InputField
            label="Height (cm)"
            name="height_cm"
            type="number"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., 175"
            className="md:col-span-2"
          />
          
          <InputField
            label="Weight (kg)"
            name="weight_kg"
            type="number"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., 70.5"
            className="md:col-span-2"
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
            className="md:col-span-2"
          />

          <InputField
            label="Occupation"
            name="occupation"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., Teacher"
            className="md:col-span-4"
          />
          
          <InputField
            label="Income"
            name="income"
            type="number"
            formData={formData}
            handleInputChange={handleInputChange}
            placeholder="e.g., 55000"
            className="md:col-span-4"
          />
          
          <InputField
            label="Medical Conditions"
            name="medical_conditions"
            type="textarea"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-4"
          />
          
          <InputField
            label="Allergies"
            name="allergies"
            type="textarea"
            formData={formData}
            handleInputChange={handleInputChange}
            className="md:col-span-4"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-secondary-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            mode === 'create' ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />
          )}
          {mode === 'create' ? 'Add Employee' : 'Update Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
