import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AcademicYearSelector from '../components/forms/AcademicYearSelector.jsx';
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx';
import studentService from '../services/studentService';
import classService from '../services/classService';
import StudentBulkImport from '../components/students/StudentBulkImport';
import StudentBulkUpdate from '../components/students/StudentBulkUpdate';
import PhoneInput from '../components/ui/PhoneInput';
import PhoneNumberDisplay from '../components/ui/PhoneNumberDisplay';
import { PERMISSIONS } from '../config/permissions';

// InputField component moved outside to prevent re-creation on every render
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, isModified = false, originalValue = '', showEditMode = false }) => (
  <div className={`${className}`}>
    <label className={`block text-xs font-medium mb-1 ${type === 'date' ? 'text-blue-700' : 'text-gray-700'}`}>
      {label} {required && <span className="text-red-500">*</span>}
      {isModified && <span className="text-blue-500 text-xs ml-1 font-semibold">(Modified)</span>}
      {type === 'date' && !isModified && <span className="text-blue-500 text-xs ml-1">📅</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
          isModified 
            ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200' 
            : type === 'date' 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 bg-white'
        } ${type === 'date' ? 'h-10' : 'h-9'}`}
        required={required}
        disabled={false}
        title={isModified ? `Original: ${originalValue || 'Empty'} → Current: ${formData[name] || 'Empty'}` : ''}
      >
        <option value="">Select</option>
        {options && Array.isArray(options) && options.map((option, index) => {
          // Handle different data structures for options
          let optionValue, optionLabel;
          
          if (typeof option === 'string') {
            optionValue = optionLabel = option;
          } else if (typeof option === 'object' && option !== null) {
            // Handle various object structures for classes and other select options
            optionValue = option.value || option.id || option.class_name || option.name || option;
            optionLabel = option.label || option.display_name || option.class_name || option.name || option.value || option.id || option;
          } else {
            optionValue = optionLabel = String(option);
          }
          
          return (
            <option key={`${name}-${index}-${optionValue}`} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20 transition-all duration-200 ${
          isModified 
            ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200' 
            : 'border-gray-300 bg-white'
        }`}
        required={required}
        title={isModified ? `Original: ${originalValue || 'Empty'} → Current: ${formData[name] || 'Empty'}` : ''}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${
          isModified 
            ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200 focus:ring-blue-300' 
            : type === 'date' 
              ? 'border-blue-400 bg-blue-50 focus:ring-blue-300 focus:border-blue-500 shadow-sm' 
              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
        } ${type === 'date' ? 'h-10 font-mono' : 'h-9'}`}
        required={required}
        title={isModified ? `Original: ${originalValue || 'Empty'} → Current: ${formData[name] || 'Empty'}` : ''}
      />
    )}
    {/* Show original value below modified fields in cyan */}
    {isModified && showEditMode && originalValue !== undefined && originalValue !== '' && (
      <div className="mt-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
        <span className="font-medium">Original:</span> {type === 'date' && originalValue ? new Date(originalValue).toLocaleDateString() : originalValue}
      </div>
    )}
    {/* Show empty state for modified fields that were originally empty */}
    {isModified && showEditMode && (originalValue === undefined || originalValue === '') && (
      <div className="mt-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
        <span className="font-medium">Original:</span> <em>(empty)</em>
      </div>
    )}
    {/* Show helper text for date fields */}
    
  </div>
);

const StudentManagement = () => {
  const { getCampusId, getCampusName, hasPermission } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [originalStudentData, setOriginalStudentData] = useState(null);
  const [modifiedFields, setModifiedFields] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, student: null });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  const canCreateStudent =
    hasPermission && hasPermission(PERMISSIONS.STUDENT_CREATE_ROUTE_CREATE);
  const canEditStudent = hasPermission && hasPermission(PERMISSIONS.STUDENT_EDIT);
  const canDeleteStudent =
    hasPermission && hasPermission(PERMISSIONS.STUDENT_DELETE_ROUTE_DELETE);
  const canManageStudents = canCreateStudent || canEditStudent || canDeleteStudent;
  const canExportStudents =
    hasPermission && hasPermission(PERMISSIONS.STUDENT_EXPORT_CREATE);
  const canBulkImportStudents =
    hasPermission && hasPermission(PERMISSIONS.STUDENT_IMPORT_CREATE);
  const canBulkUpdateStudents =
    hasPermission && hasPermission(PERMISSIONS.STUDENT_BULK_UPDATE_CREATE);
  
  // Simplified filters - only search, academic year and class
  const [filters, setFilters] = useState({ 
    search: '',
    academic_year_id: '',
    class_id: ''
  });
  
  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    academic_years: [],
    classes: []
  });

  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: '',
    religion: '',
    caste: '',
    category: '',
    admissionDate: '',
    academicYearData: {
      year_name: '',
      year_type: '',
      curriculum_id: '',
      medium: '',
      academic_year_id: null
    },
    class: '',
    registrationNumber: '',
    previousSchool: '',
    transferCertificateNumber: '',
    admissionType: '',
    email: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    medicalConditions: '',
    allergies: '',
    height: '',
    weight: '',
    transportMode: '',
    hostelRequired: '',
    scholarshipApplied: '',
    parents: [],
  });

  const [academicYearValidation, setAcademicYearValidation] = useState({
    isValid: null,
    academicYearId: null,
    message: ''
  });

  const [showParentForm, setShowParentForm] = useState(false);
  const [editingParentIndex, setEditingParentIndex] = useState(null); // Add state for tracking which parent is being edited
  const [originalParentData, setOriginalParentData] = useState(null); // Track original parent data for comparison
  const [modifiedParentFields, setModifiedParentFields] = useState(new Set()); // Track which parent fields have been modified
  const [parentForm, setParentForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    occupation: '',
    income: '',
    relation: '',
    isEmergency: false
  });

  const handleParentInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setParentForm(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Track parent field modifications compared to original data (only when editing existing parent)
    if (showEditForm && editingParentIndex !== null && originalParentData) {
      if (originalParentData[name] !== newValue) {
        setModifiedParentFields(prev => new Set(prev).add(name));
      } else {
        setModifiedParentFields(prev => {
          const updated = new Set(prev);
          updated.delete(name);
          return updated;
        });
      }
    }
  };

  const handleAddParent = () => {
    setEditingParentIndex(null); // Clear editing state when adding new parent
    setShowParentForm(true);
    setParentForm({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      occupation: '',
      income: '',
      relation: '',
      isEmergency: false
    });
  };

  // Handle student selection
  const handleSelectStudent = (username, isChecked) => {
    const newSelected = new Set(selectedStudents);
    if (isChecked) {
      newSelected.add(username);
    } else {
      newSelected.delete(username);
    }
    setSelectedStudents(newSelected);
  };

  // Handle select all students
  const handleSelectAllStudents = (isChecked) => {
    if (isChecked) {
      const allUsernames = new Set(students.map(s => s.username));
      setSelectedStudents(allUsernames);
    } else {
      setSelectedStudents(new Set());
    }
  };

  // Handle export
  const handleExport = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to export');
      return;
    }

    try {
      const toastId = toast.loading('Exporting students...');
      await studentService.exportStudents(Array.from(selectedStudents));
      toast.dismiss(toastId);
      toast.success('Students exported successfully');
      setSelectedStudents(new Set()); // Clear selection
    } catch (error) {
      console.error('Error exporting students:', error);
      toast.error('Failed to export students');
    }
  };

  const handleEditParent = (index) => {
    const parentToEdit = formData.parents[index];
    setEditingParentIndex(index);
    setShowParentForm(true);
    
    // Set up original parent data for field modification tracking
    setOriginalParentData({ ...parentToEdit });
    setModifiedParentFields(new Set()); // Clear any previous modifications
    
    setParentForm({
      firstName: parentToEdit.firstName || '',
      lastName: parentToEdit.lastName || '',
      dateOfBirth: parentToEdit.dateOfBirth || '',
      email: parentToEdit.email || '',
      phone: parentToEdit.phone || '',
      occupation: parentToEdit.occupation || '',
      income: parentToEdit.income || '',
      relation: parentToEdit.relation || '',
      isEmergency: parentToEdit.isEmergency || false
    });
  };

  const handleSaveParent = () => {
    // Validate mandatory fields
    if (!parentForm.firstName.trim() || !parentForm.lastName.trim() || !parentForm.email.trim() || !parentForm.phone.trim()) {
      toast.error('Parent first name, last name, email, and phone are required');
      return;
    }

    if (editingParentIndex !== null) {
      // Update existing parent
      setFormData(prev => {
        const newParents = prev.parents.map((parent, index) => 
          index === editingParentIndex ? { ...parentForm } : parent
        );
        
        // Track parents modification if in edit mode
        if (showEditForm && originalStudentData) {
          setModifiedFields(prevFields => new Set(prevFields).add('parents'));
        }
        
        return {
          ...prev,
          parents: newParents
        };
      });
      toast.success('Parent updated successfully');
    } else {
      // Add new parent
      setFormData(prev => {
        // Track parents modification if in edit mode
        if (showEditForm && originalStudentData) {
          setModifiedFields(prevFields => new Set(prevFields).add('parents'));
        }
        
        return {
          ...prev,
          parents: [...prev.parents, { ...parentForm }]
        };
      });
      toast.success('Parent added successfully');
    }
    
    setShowParentForm(false);
    setEditingParentIndex(null);
  };

  const handleCancelParentForm = () => {
    setShowParentForm(false);
    setEditingParentIndex(null);
    setParentForm({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      occupation: '',
      income: '',
      relation: '',
      isEmergency: false
    });
  };

  const handleRemoveParent = (idx) => {
    setFormData(prev => {
      // Track parents modification if in edit mode
      if (showEditForm && originalStudentData) {
        setModifiedFields(prevFields => new Set(prevFields).add('parents'));
      }
      
      return {
        ...prev,
        parents: prev.parents.filter((_, i) => i !== idx)
      };
    });
  };

  // Generate dummy data for testing
  const generateDummyData = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 15); // 15 years old
    const dobString = dob.toISOString().split('T')[0];
    
    // Randomly decide whether to include student phone or leave it empty (to test fallback logic)
    const includeStudentPhone = Math.random() > 0.3; // 70% chance to include student phone
    
    return {
      // Basic Information - Mandatory fields with dummy data
      admissionNumber: `STU${Date.now().toString().slice(-6)}`,
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'William',
      dateOfBirth: dobString,
      gender: 'Male',
      bloodGroup: 'O+',
      nationality: 'Indian',
      religion: 'Hindu',
      caste: 'General',
      category: 'General',
      admissionDate: currentDate,
      academicYearData: {
        year_name: '',
        year_type: '',
        curriculum_id: '',
        medium: '',
        academic_year_id: null
      },
      
      // Academic Information
      class: '10',
      registrationNumber: `REG${Date.now().toString().slice(-8)}`,
      previousSchool: 'ABC High School',
      transferCertificateNumber: `TC${Date.now().toString().slice(-6)}`,
      admissionType: 'New',
      
      // Contact Information
      email: 'john.doe@example.com',
      phoneNumber: includeStudentPhone ? '9876543210' : '', // Sometimes empty to test fallback
      alternatePhoneNumber: '8765432109',
      currentAddress: '123 Main Street, Block A, Sector 1',
      permanentAddress: '123 Main Street, Block A, Sector 1',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      
      // Parent Information
      parents: [
        {
          firstName: 'Robert',
          lastName: 'Doe',
          email: 'robert.doe@example.com',
          phone: '9876543212',
          occupation: 'Engineer',
          income: '50000',
          relation: 'Father',
          isEmergency: true
        },
        {
          firstName: 'Mary',
          lastName: 'Doe',
          email: 'mary.doe@example.com',
          phone: '9876543213',
          occupation: 'Teacher',
          income: '35000',
          relation: 'Mother',
          isEmergency: false
        }
      ],
      
      // Optional fields with dummy data
      medicalConditions: 'None',
      allergies: 'None',
      height: '165',
      weight: '55',
      transportMode: 'School Bus',
      hostelRequired: 'No',
      scholarshipApplied: 'No'
    };
  };

  // Reset form data helper
  const resetFormData = () => {
    setFormData({
      admissionNumber: '',
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      nationality: '',
      religion: '',
      caste: '',
      category: '',
      admissionDate: '',
      academicYearData: {
        year_name: '',
        year_type: '',
        curriculum_id: '',
        medium: '',
        academic_year_id: null
      },
      class: '',
      registrationNumber: '',
      previousSchool: '',
      transferCertificateNumber: '',
      admissionType: '',
      email: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      medicalConditions: '',
      allergies: '',
      height: '',
      weight: '',
      transportMode: '',
      hostelRequired: '',
      scholarshipApplied: '',
      parents: []
    });

    setAcademicYearValidation({
      isValid: null,
      academicYearId: null,
      message: ''
    });
    setModifiedFields(new Set());
  };

  // Fetch filter options (following SectionManagementPage pattern)
  const fetchFilterOptions = async () => {
    try {
      const response = await studentService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
        console.log('✅ Student filter options loaded:', response.data);
      }
    } catch (error) {
      console.error('Error fetching student filter options:', error);
      toast.error('Failed to load filter options');
    }
  };

  // Fetch dropdown data for classes
  const fetchDropdownData = async () => {
    try {
      const campusId = getCampusId();
      if (!campusId) {
        toast.error('Campus ID not available');
        return;
      }
      
      const response = await classService.getClassesByCampus(campusId);
      if (response.success) {
        const classes = response.data.classes || [];
        setFilterOptions(prev => ({
          ...prev,
          classes
        }));
        console.log('✅ Classes loaded:', classes.length);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  // Load filter options and dropdown data on component mount
  useEffect(() => {
    fetchFilterOptions();
    fetchDropdownData();
  }, []);



  // Fetch students with specific filters
  const fetchStudentsWithFilters = async (filtersToUse = filters) => {
    try {
      setLoading(true);
      const params = {
        page: 1, // Always start from page 1 when filters change
        limit: 20,
        ...filtersToUse
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      console.log('🔍 Fetching students with filters:', params);
      
      const response = await studentService.getAllStudents(params);
      if (response.success) {
        setStudents(response.data.students || []);
        setPagination(response.data.pagination || { current_page: 1, total_pages: 1, total_count: 0 });
        setHasSearched(true);
        console.log('✅ Students fetched successfully:', response.data.students?.length || 0);
      } else {
        console.error('❌ Failed to fetch students:', response);
        toast.error(response.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      toast.error(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Update the original fetchStudents to use the new function
  const fetchStudents = () => fetchStudentsWithFilters();

  const handleBulkImportSuccess = () => {
    setShowBulkImport(false);
    fetchStudents();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Track field modifications compared to original data (only when editing existing student)
    if (showEditForm && originalStudentData) {
      if (originalStudentData[name] !== value) {
        setModifiedFields(prev => new Set(prev).add(name));
      } else {
        setModifiedFields(prev => {
          const updated = new Set(prev);
          updated.delete(name);
          return updated;
        });
      }
    }
  };

  const handleAcademicYearChange = (event, additionalData) => {
    const academicYearData = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      academicYearData: academicYearData
    }));
  };

  const handleAcademicYearValidationChange = (validation) => {
    setAcademicYearValidation(validation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!academicYearValidation.isValid || !academicYearValidation.academicYearId) {
      toast.error('Please select a valid academic year combination');
      return;
    }

    try {
      setLoading(true);
      
      const processedFormData = { ...formData };
      if (!processedFormData.phoneNumber?.trim() && processedFormData.parents.length > 0) {
        const emergencyParent = processedFormData.parents.find(parent => parent.isEmergency);
        if (emergencyParent) {
          processedFormData.phoneNumber = emergencyParent.phone.trim();
        }
      }
      
      const submissionData = {
        ...processedFormData,
        category: processedFormData.category === '' ? null : processedFormData.category,
        bloodGroup: processedFormData.bloodGroup === '' ? null : processedFormData.bloodGroup,
        height: processedFormData.height === '' ? null : processedFormData.height,
        weight: processedFormData.weight === '' ? null : processedFormData.weight,
        religion: processedFormData.religion === '' ? null : processedFormData.religion,
        caste: processedFormData.caste === '' ? null : processedFormData.caste,
        medicalConditions: processedFormData.medicalConditions === '' ? null : processedFormData.medicalConditions,
        allergies: processedFormData.allergies === '' ? null : processedFormData.allergies,
        academic_year_id: academicYearValidation.academicYearId,
        academicYearData: undefined
      };
      
      let response;
      if (showEditForm && editingStudent) {
        console.log('🔍 DEBUG: Updating student with username:', editingStudent.username);
        console.log('🔍 DEBUG: Submission data:', submissionData);
        response = await studentService.updateStudentByUsername(editingStudent.username, submissionData);
        
        if (response.success) {
          console.log('✅ FRONTEND: Student updated successfully:', response.data);
          toast.success('Student updated successfully!');
          setShowEditForm(false);
          resetFormData();
          // Refresh the students list if we have searched before
          if (hasSearched) {
            fetchStudents();
          }
        } else {
          console.error('❌ FRONTEND: Failed to update student:', response);
          toast.error(response.message || 'Failed to update student');
        }
      } else {
        console.log('🔍 DEBUG: Creating new student');
        console.log('🔍 DEBUG: Submission data:', submissionData);
        response = await studentService.registerStudent(submissionData);
        
        if (response.success) {
          console.log('✅ FRONTEND: Student created successfully:', response.data);
          toast.success('Student added successfully!');
          setShowAddForm(false);
          resetFormData();
          // Refresh the students list if we have searched before
          if (hasSearched) {
            fetchStudents();
          }
        } else {
          console.error('❌ FRONTEND: Failed to create student:', response);
          toast.error(response.message || 'Failed to add student');
        }
      }
    } catch (error) {
      console.error('❌ FRONTEND: Error during form submission:', error);
      toast.error(error.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (student) => {

    console.log('🔍 DEBUG: handleEditStudent called with:', { 
      studentId: student.studentId, 
      username: student.username,
      studentData: student 
    });

    setEditingStudent(student);
    
    try {
      // Fetch complete student data from the backend
      console.log('🔍 DEBUG: Fetching complete student data for username:', student.username);
      const response = await studentService.getCompleteStudentForEdit(student.username);
      
      if (response.success && response.data) {
        const completeStudent = response.data;
        console.log('🔍 DEBUG: Received complete student data:', completeStudent);
        
        // Helper function to format date properly (fix timezone issue)
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          // Create a new Date object and format it to YYYY-MM-DD without timezone issues
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        // Map the complete data to form structure
        const studentFormData = {
          // General Details - ensure all fields are strings
          admissionNumber: completeStudent.admissionNumber || '',
          firstName: completeStudent.firstName || '',
          lastName: completeStudent.lastName || '',
          middleName: completeStudent.middleName || '',
          dateOfBirth: formatDateForInput(completeStudent.dateOfBirth), // Fix date formatting
          gender: completeStudent.gender || '',
          bloodGroup: completeStudent.bloodGroup || '',
          nationality: completeStudent.nationality || '',
          religion: completeStudent.religion || '',
          caste: completeStudent.caste || '',
          category: completeStudent.category || '',
          admissionDate: formatDateForInput(completeStudent.admissionDate), // Fix date formatting
          
          // Academic Information from enrollment
          academicYearData: {
            year_name: completeStudent.enrollment?.year_name || '',
            year_type: completeStudent.enrollment?.year_type || '',
            curriculum_id: completeStudent.enrollment?.curriculum_id || '',
            medium: completeStudent.enrollment?.medium || '',
            academic_year_id: completeStudent.enrollment?.academic_year_id || null
          },
          class: completeStudent.class || completeStudent.enrollment?.class || '',
          registrationNumber: completeStudent.registrationNumber || '',
          previousSchool: completeStudent.previousSchool || '',
          transferCertificateNumber: completeStudent.transferCertificateNumber || '',
          admissionType: completeStudent.admissionType || '',
          
          // Contact Information
          email: completeStudent.email || '',
          phoneNumber: completeStudent.phoneNumber || '',
          alternatePhoneNumber: completeStudent.alternatePhoneNumber || '',
          currentAddress: completeStudent.currentAddress || '',
          permanentAddress: completeStudent.permanentAddress || '',
          city: completeStudent.city || '',
          state: completeStudent.state || '',
          pincode: completeStudent.pincode || '',
          country: completeStudent.country || '',
          
          // Medical and Other Details
          medicalConditions: completeStudent.medicalConditions || '',
          allergies: completeStudent.allergies || '',
          height: completeStudent.height ? String(completeStudent.height) : '',
          weight: completeStudent.weight ? String(completeStudent.weight) : '',
          transportMode: completeStudent.transportMode || '',
          hostelRequired: completeStudent.hostelRequired || '',
          scholarshipApplied: completeStudent.scholarshipApplied || '',
          
          // Parents - ensure it's always an array with proper mapping and date formatting
          parents: Array.isArray(completeStudent.parents) ? completeStudent.parents.map(parent => ({
            firstName: parent.firstName || '',
            lastName: parent.lastName || '',
            dateOfBirth: formatDateForInput(parent.dateOfBirth), // Fix parent date formatting too
            email: parent.email || '',
            phone: parent.phone || '',
            occupation: parent.occupation || '',
            income: parent.income ? String(parent.income) : '',
            relation: parent.relation || parent.relationshipType || '',
            isEmergency: Boolean(parent.isEmergency)
          })) : []
        };

        console.log('🔍 DEBUG: Mapped form data:', studentFormData);
        console.log('🔍 DEBUG: Parents count:', studentFormData.parents.length);
        console.log('🔍 DEBUG: Parents data:', studentFormData.parents);
        
        setFormData(studentFormData);
        setOriginalStudentData({ ...studentFormData });
        setModifiedFields(new Set());

        // Set academic year validation if available
        if (completeStudent.enrollment?.academic_year_id) {
          setAcademicYearValidation({
            isValid: true,
            academicYearId: completeStudent.enrollment.academic_year_id,
            message: 'Valid combination found'
          });
          console.log('🔍 DEBUG: Academic year validation set:', completeStudent.enrollment.academic_year_id);
        } else {
          setAcademicYearValidation({
            isValid: null,
            academicYearId: null,
            message: ''
          });
          console.log('🔍 DEBUG: No academic year data found');
        }
      } else {
        console.error('🔍 DEBUG: Failed to fetch complete student data:', response);
        toast.error('Failed to fetch complete student data');
        return;
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching complete student data:', error);
      toast.error('Failed to fetch student data for editing');
      return;
    }
    
    setShowEditForm(true);
    console.log('🔍 DEBUG: Edit form should now be visible');
  };

  const handleDeleteStudent = (student) => {
    setDeleteConfirm({ show: true, student });
  };

  const confirmDeleteStudent = async () => {
    try {
      setDeleting(true);
      console.log('🗑️ FRONTEND: Deleting student with username:', deleteConfirm.student.username);
      
      // Use username-based delete method for hard delete
      const response = await studentService.deleteStudentByUsername(deleteConfirm.student.username);
      
      if (response.success) {
        console.log('✅ FRONTEND: Student hard deleted successfully:', response.data);
        toast.success('Student and related data permanently deleted successfully!');
        fetchStudents();
        setDeleteConfirm({ show: false, student: null });
      }
    } catch (error) {
      console.error('❌ FRONTEND: Error deleting student:', error);
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddStudent = () => {
    setFormData(generateDummyData());
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetFormData();
  };

  const handleRowClick = (student) => {
    console.log('Student clicked:', student);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGetStudents = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchStudents();
  };

  // Custom instructions for students
  const studentInstructions = (
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
                  <li><strong>Adding Students:</strong> Academic Year (Year, Curriculum, Medium) and Class are required fields</li>
                  <li><strong>Academic Year Selection:</strong> Choose the academic year, curriculum, and medium. The system will validate this combination.</li>
                  <li><strong>Student Information:</strong> Complete all required fields including personal details, contact information, and parent details</li>
                  <li><strong>Parent Information:</strong> At least one parent is recommended with emergency contact details</li>
                  <li><strong>Permissions:</strong> Users with student_update permission can create, edit, or delete students. All users can view students</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Handle filter changes from OneAcademicYearPage
  const handleFiltersChange = (newFilters) => {
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, current_page: 1 }));
    // Fetch students with new filters immediately
    fetchStudentsWithFilters(newFilters);
  };

  if (showAddForm || showEditForm || showBulkImport || showBulkUpdate) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {showBulkImport ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Bulk Import Students</h2>
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    fetchStudents();
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <span className="text-sm">Back to List</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StudentBulkImport 
                onImportSuccess={handleBulkImportSuccess}
                campusId={getCampusId()}
              />
            </div>
          ) : showBulkUpdate ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Bulk Update Students</h2>
                <button
                  onClick={() => {
                    setShowBulkUpdate(false);
                    fetchStudents();
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <span className="text-sm">Back to List</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StudentBulkUpdate 
                onUpdateSuccess={() => {
                   setShowBulkUpdate(false);
                   fetchStudents();
                }}
                campusId={getCampusId()}
              />
            </div>
          ) : (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{showEditForm ? 'Edit Student' : 'Add Student'}</h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setShowEditForm(false);
                      resetFormData();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-6 gap-4">
                  {/* Section 1: General Details */}
                  <div className="col-span-6 border-b pb-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">General Details</h3>
                    <div className="grid grid-cols-6 gap-3">
                      <InputField label="Admission Number" name="admissionNumber" required className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('admissionNumber')} originalValue={originalStudentData?.admissionNumber} showEditMode={showEditForm} />
                      <InputField label="First Name" name="firstName" required className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('firstName')} originalValue={originalStudentData?.firstName} showEditMode={showEditForm} />
                      <InputField label="Last Name" required name="lastName" className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('lastName')} originalValue={originalStudentData?.lastName} showEditMode={showEditForm} />
                      <InputField label="Middle Name" name="middleName" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('middleName')} originalValue={originalStudentData?.middleName} showEditMode={showEditForm} />
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-3">
                      <InputField label="Date of Birth" name="dateOfBirth" type="date" required className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('dateOfBirth')} originalValue={originalStudentData?.dateOfBirth} showEditMode={showEditForm} />
                      <InputField 
                        label="Gender" 
                        name="gender" 
                        type="select" 
                        options={['Male', 'Female', 'Other']} 
                        required 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('gender')}
                        originalValue={originalStudentData?.gender}
                        showEditMode={showEditForm}
                      />
                    </div>
                  </div>

                  {/* Section 2: Academic Information */}
                  <div className="col-span-6 border-b pb-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Academic Information</h3>
                    
                    {/* Academic Year Selector */}
                    <div className="col-span-6 mb-4">
                      <AcademicYearSelector
                        campusId={getCampusId()}
                        value={formData.academicYearData}
                        onChange={handleAcademicYearChange}
                        onValidationChange={handleAcademicYearValidationChange}
                        name="academicYearData"
                        label="Academic Year Selection"
                        required={true}
                        className="border rounded-lg p-4 bg-gray-50"
                      />
                    </div>
                    
                    <div className="grid grid-cols-6 gap-3">
                      <InputField 
                        label="Class" 
                        name="class" 
                        type="select"
                        options={filterOptions.classes ? filterOptions.classes.map(cls => cls.class_name || cls.name || cls) : []}
                        required 
                        className="col-span-1" 
                        formData={formData} 
                        handleInputChange={handleInputChange} 
                        isModified={modifiedFields.has('class')} 
                        originalValue={originalStudentData?.class} 
                        showEditMode={showEditForm}
                      />
                      <InputField label="Registration No." name="registrationNumber" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('registrationNumber')} originalValue={originalStudentData?.registrationNumber} showEditMode={showEditForm} />
                      <InputField label="Admission Date" name="admissionDate" type="date" required className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('admissionDate')} originalValue={originalStudentData?.admissionDate} showEditMode={showEditForm} />
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-3">
                      <InputField 
                        label="Admission Type" 
                        name="admissionType" 
                        type="select" 
                        options={['New', 'Transfer', 'Re-admission']} 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('admissionType')}
                        originalValue={originalStudentData?.admissionType}
                        showEditMode={showEditForm}
                      />
                      <InputField label="Previous School" name="previousSchool" className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('previousSchool')} originalValue={originalStudentData?.previousSchool} showEditMode={showEditForm} />
                      <InputField label="TC Number" name="transferCertificateNumber" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('transferCertificateNumber')} originalValue={originalStudentData?.transferCertificateNumber} showEditMode={showEditForm} />
                      <InputField 
                        label="Transport Mode" 
                        name="transportMode" 
                        type="select" 
                        options={['School Bus', 'Private Vehicle', 'Walking', 'Public Transport']} 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('transportMode')}
                        originalValue={originalStudentData?.transportMode}
                        showEditMode={showEditForm}
                      />
                      <InputField 
                        label="Hostel Required" 
                        name="hostelRequired" 
                        type="select" 
                        options={['Yes', 'No']} 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('hostelRequired')}
                        originalValue={originalStudentData?.hostelRequired}
                        showEditMode={showEditForm}
                      />
                    </div>
                  </div>

                  {/* Section 3: Personal Details */}
                  <div className="col-span-6 border-b pb-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Personal Details</h3>
                    <div className="grid grid-cols-6 gap-3">
                      <InputField label="Nationality" name="nationality" required className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('nationality')} originalValue={originalStudentData?.nationality} showEditMode={showEditForm} />
                      <InputField 
                        label="Blood Group" 
                        name="bloodGroup" 
                        type="select" 
                        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('bloodGroup')}
                        originalValue={originalStudentData?.bloodGroup}
                        showEditMode={showEditForm}
                      />
                      <InputField label="Height (cm)" name="height" type="number" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('height')} originalValue={originalStudentData?.height} showEditMode={showEditForm} />
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-3">
                      <InputField label="Weight (kg)" name="weight" type="number" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('weight')} originalValue={originalStudentData?.weight} showEditMode={showEditForm} />
                      <InputField label="Religion" name="religion" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('religion')} originalValue={originalStudentData?.religion} showEditMode={showEditForm} />
                      <InputField label="Caste" name="caste" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('caste')} originalValue={originalStudentData?.caste} showEditMode={showEditForm} />
                      <InputField 
                        label="Category" 
                        name="category" 
                        type="select" 
                        options={['General', 'OBC', 'SC', 'ST', 'EWS']} 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('category')}
                        originalValue={originalStudentData?.category}
                        showEditMode={showEditForm}
                      />
                      <InputField label="Medical Conditions" name="medicalConditions" className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('medicalConditions')} originalValue={originalStudentData?.medicalConditions} showEditMode={showEditForm} />
                      <InputField label="Allergies" name="allergies" className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('allergies')} originalValue={originalStudentData?.allergies} showEditMode={showEditForm} />
                      <InputField 
                        label="Scholarship Applied" 
                        name="scholarshipApplied" 
                        type="select" 
                        options={['Yes', 'No']} 
                        className="col-span-1"
                        formData={formData} 
                        handleInputChange={handleInputChange}
                        isModified={modifiedFields.has('scholarshipApplied')}
                        originalValue={originalStudentData?.scholarshipApplied}
                        showEditMode={showEditForm}
                      />
                    </div>
                  </div>

                  {/* Section 4: Contact Information */}
                  <div className="col-span-6 border-b pb-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-6 gap-3">
                      <InputField label="Email" name="email" type="email" className="col-span-2" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('email')} originalValue={originalStudentData?.email} showEditMode={showEditForm} />
                      <div className="col-span-2">
                        <PhoneInput 
                          label={
                            <span>
                              Phone Number 
                              {modifiedFields.has('phoneNumber') && <span className="text-blue-500 text-xs ml-1 font-semibold">(Modified)</span>}
                            </span>
                          }
                          name="phoneNumber" 
                          value={formData.phoneNumber} 
                          onChange={handleInputChange} 
                        />
                        {modifiedFields.has('phoneNumber') && showEditForm && (originalStudentData?.phoneNumber !== undefined) && (
                          <div className="mt-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                            <span className="font-medium">Original:</span> {originalStudentData.phoneNumber || <em>(empty)</em>}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {!formData.phoneNumber?.trim() && formData.parents && formData.parents.find(parent => parent.isEmergency)?.phone?.trim() 
                            ? `Will use emergency contact phone: ${formData.parents.find(parent => parent.isEmergency).phone}` 
                            : 'Optional - If empty, emergency contact phone will be used'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <PhoneInput 
                          label={
                            <span>
                              Alternate Phone 
                              {modifiedFields.has('alternatePhoneNumber') && <span className="text-blue-500 text-xs ml-1 font-semibold">(Modified)</span>}
                            </span>
                          }
                          name="alternatePhoneNumber" 
                          value={formData.alternatePhoneNumber} 
                          onChange={handleInputChange} 
                        />
                        {modifiedFields.has('alternatePhoneNumber') && showEditForm && (originalStudentData?.alternatePhoneNumber !== undefined) && (
                          <div className="mt-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                            <span className="font-medium">Original:</span> {originalStudentData.alternatePhoneNumber || <em>(empty)</em>}
                          </div>
                        )}
                      </div>
                      <InputField label="City" name="city" required className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('city')} originalValue={originalStudentData?.city} showEditMode={showEditForm} />
                      <InputField label="State" name="state" required className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('state')} originalValue={originalStudentData?.state} showEditMode={showEditForm} />
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-3">
                      <InputField label="Current Address" name="currentAddress" type="textarea" className="col-span-3" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('currentAddress')} originalValue={originalStudentData?.currentAddress} showEditMode={showEditForm} />
                      <InputField label="Permanent Address" name="permanentAddress" type="textarea" className="col-span-3" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('permanentAddress')} originalValue={originalStudentData?.permanentAddress} showEditMode={showEditForm} />
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-3">
                      <InputField label="Pincode" name="pincode" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('pincode')} originalValue={originalStudentData?.pincode} showEditMode={showEditForm} />
                      <InputField label="Country" name="country" className="col-span-1" formData={formData} handleInputChange={handleInputChange} isModified={modifiedFields.has('country')} originalValue={originalStudentData?.country} showEditMode={showEditForm} />
                    </div>
                  </div>

                  {/* Section 5: Parent Information */}
                  <div className="col-span-6 border-b pb-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                      Parent(s) Information
                      {modifiedFields.has('parents') && showEditForm && (
                        <span className="text-blue-500 text-xs ml-2 font-semibold">(Modified)</span>
                      )}
                    </h3>
                    {/* Show original parents data when modified in edit mode */}
                    {modifiedFields.has('parents') && showEditForm && originalStudentData?.parents && (
                      <div className="mb-3 p-3 bg-cyan-50 border border-cyan-200 rounded">
                        <div className="text-xs font-medium text-cyan-600 mb-2">Original Parents:</div>
                        {originalStudentData.parents.length > 0 ? (
                          <ul className="list-disc pl-5 text-xs text-cyan-700">
                            {originalStudentData.parents.map((parent, idx) => (
                              <li key={idx} className="mb-1">
                                {parent.firstName} {parent.lastName} ({parent.relation}) - {parent.email}, {parent.phone} {parent.isEmergency ? '[Emergency]' : ''}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-cyan-700 italic">No parents originally recorded</div>
                        )}
                      </div>
                    )}
                    <div className="mb-2">
                      <button
                        type="button"
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={handleAddParent}
                      >
                        Add Parent
                      </button>
                    </div>
                    {formData.parents.length > 0 && (
                      <div className="mb-2">
                        <ul className="list-disc pl-5">
                          {formData.parents.map((parent, idx) => (
                            <li key={idx} className="mb-1 flex items-center justify-between">
                              <span>{parent.firstName} {parent.lastName} ({parent.relation}) - {parent.email}, {parent.phone} {parent.isEmergency ? '[Emergency]' : ''}</span>
                              <div>
                                <button 
                                  type="button" 
                                  className="text-blue-500 ml-2" 
                                  onClick={() => handleEditParent(idx)}
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button" 
                                  className="text-red-500 ml-2" 
                                  onClick={() => handleRemoveParent(idx)}
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {showParentForm && (
                      <div className={`p-3 rounded mb-2 ${modifiedFields.has('parents') && showEditForm ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100'}`}>
                        <div className="grid grid-cols-6 gap-2 mb-2">
                          <InputField 
                            label="First Name" 
                            name="firstName" 
                            required 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('firstName')}
                            originalValue={originalParentData?.firstName}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                          <InputField 
                            label="Last Name" 
                            name="lastName" 
                            required 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('lastName')}
                            originalValue={originalParentData?.lastName}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                          <InputField 
                            label="Date of Birth" 
                            name="dateOfBirth" 
                            type="date" 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('dateOfBirth')}
                            originalValue={originalParentData?.dateOfBirth}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                          <InputField 
                            label="Email" 
                            name="email" 
                            type="email" 
                            required 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('email')}
                            originalValue={originalParentData?.email}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                          <div className="col-span-2">
                            <PhoneInput 
                              label={
                                <span>
                                  Phone <span className="text-red-500">*</span>
                                  {modifiedParentFields.has('phone') && <span className="text-blue-500 text-xs ml-1 font-semibold">(Modified)</span>}
                                </span>
                              }
                              name="phone" 
                              required 
                              value={parentForm.phone} 
                              onChange={handleParentInputChange}
                            />
                            {modifiedParentFields.has('phone') && showEditForm && editingParentIndex !== null && (originalParentData?.phone !== undefined) && (
                              <div className="mt-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                                <span className="font-medium">Original:</span> {originalParentData.phone || <em>(empty)</em>}
                              </div>
                            )}
                          </div>
                          <InputField 
                            label="Occupation" 
                            name="occupation" 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('occupation')}
                            originalValue={originalParentData?.occupation}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                          <InputField 
                            label="Income" 
                            name="income" 
                            type="number" 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('income')}
                            originalValue={originalParentData?.income}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                        </div>
                        <div className="grid grid-cols-6 gap-2 mb-2">
                          <InputField 
                            label="Relation" 
                            name="relation" 
                            type="select" 
                            options={["Father","Mother","Guardian","Other"]} 
                            required 
                            formData={parentForm} 
                            handleInputChange={handleParentInputChange}
                            isModified={modifiedParentFields.has('relation')}
                            originalValue={originalParentData?.relation}
                            showEditMode={showEditForm && editingParentIndex !== null}
                          />
                          <div className="col-span-2 flex items-center">
                            <input 
                              type="checkbox" 
                              name="isEmergency" 
                              checked={parentForm.isEmergency} 
                              onChange={handleParentInputChange} 
                              className={`mr-2 ${modifiedParentFields.has('isEmergency') ? 'ring-2 ring-blue-200' : ''}`}
                            />
                            <label className={`text-xs font-medium ${modifiedParentFields.has('isEmergency') ? 'text-blue-700' : 'text-gray-700'}`}>
                              Is Emergency Contact
                              {modifiedParentFields.has('isEmergency') && (
                                <span className="text-blue-500 text-xs ml-1 font-semibold">(Modified)</span>
                              )}
                            </label>
                            {/* Show original emergency contact state when modified */}
                            {modifiedParentFields.has('isEmergency') && showEditForm && editingParentIndex !== null && (
                              <div className="mt-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-200 ml-2">
                                <span className="font-medium">Original:</span> {originalParentData?.isEmergency ? 'Yes' : 'No'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button type="button" className="bg-green-500 text-white px-3 py-1 rounded" onClick={handleSaveParent}>
                            {editingParentIndex !== null ? 'Update Parent' : 'Save Parent'}
                          </button>
                          <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={handleCancelParentForm}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
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
                    className={`px-6 py-2 text-white rounded transition-colors flex items-center gap-2 ${
                      academicYearValidation.isValid 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={loading || !academicYearValidation.isValid}
                  >
                    {loading && <LoadingSpinner className="w-4 h-4" />}
                    {showEditForm ? 'Update Student' : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <OneAcademicYearPage
      title="Student Management"
      filterOptions={filterOptions}
      filters={filters}
      setFilters={setFilters}
      onFiltersChange={handleFiltersChange}
      showClassFilter={true}
      showSearchFilter={true}
      instructions={studentInstructions}
      addButtonText="Add Student"
      onAddClick={handleAddStudent}
      canAdd={canCreateStudent}
      extraHeaderContent={
        canManageStudents && (
          <div className="flex gap-2">
            {selectedStudents.size > 0 && canExportStudents && (
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Selected ({selectedStudents.size})
              </button>
            )}
            {canBulkImportStudents && (
              <button
                onClick={() => setShowBulkImport(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Bulk Import
              </button>
            )}
            {canBulkUpdateStudents && (
              <button
                onClick={() => setShowBulkUpdate(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bulk Update
              </button>
            )}
          </div>
        )
      }
    >
      {/* Students List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Students List</h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="w-6 h-6" />
              <p className="ml-2 text-gray-500">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? 'No students match your search criteria.' : 'Get started by creating your first student.'}
              </p>
              {!filters.search && canCreateStudent && (
                <div className="mt-6">
                  <button
                    onClick={handleAddStudent}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Student
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {canManageStudents && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        <input
                          type="checkbox"
                          checked={selectedStudents.size === students.length && students.length > 0}
                          onChange={(e) => handleSelectAllStudents(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr 
                      key={student.studentId} 
                      className="hover:bg-gray-50 transition-colors duration-150" 
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        handleRowClick(student);
                      }}
                    >
                      {canManageStudents && (
                        <td className="px-4 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.username)}
                            onChange={(e) => handleSelectStudent(student.username, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{student.admissionNumber}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.fullName || `${student.firstName} ${student.lastName}`}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.enrollment?.className || student.enrollment?.class_name || student.class || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <PhoneNumberDisplay 
                          value={student.phoneNumber ? student.phoneNumber : (student.parents && student.parents.find(parent => parent.isEmergency)?.phone ? student.parents.find(parent => parent.isEmergency).phone : null)} 
                          fallback={<span className="text-gray-500 text-sm">Contact Admin</span>}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.enrollment?.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.enrollment?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {(canEditStudent || canDeleteStudent) ? (
                            <>
                              {canEditStudent && (
                                <button 
                                  onClick={() => handleEditStudent(student)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-blue-200 transition ease-in-out duration-150"
                                  title="Edit student"
                                >
                                  <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  Edit
                                </button>
                              )}
                              {canDeleteStudent && (
                                <button 
                                  onClick={() => handleDeleteStudent(student)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:border-red-300 focus:shadow-outline-red active:bg-red-200 transition ease-in-out duration-150"
                                  title="Delete student"
                                >
                                  <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Delete
                                </button>
                              )}
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
              {/* ...existing pagination buttons... */}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, student: null })}
        onConfirm={confirmDeleteStudent}
        title="Delete Student"
        message={
          <div>
            <p className="mb-2">Are you sure you want to delete student <strong>"{deleteConfirm.student?.fullName || deleteConfirm.student?.firstName + ' ' + deleteConfirm.student?.lastName}"</strong>?</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> This action cannot be undone. All student data including enrollments and parent information will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText="Delete Student"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </OneAcademicYearPage>
  );
};

export default StudentManagement;
