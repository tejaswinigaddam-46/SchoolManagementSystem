import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import AcademicYearSelector from '../components/forms/AcademicYearSelector.jsx';
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx';
import sectionService from '../services/sectionService';
import classService from '../services/classService';
import studentService from '../services/studentService';
import { PERMISSIONS } from '../config/permissions';

// InputField component for form fields
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, placeholder = '' }) => (
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
        <option value="">Select {label}</option>
        {options?.map(option => (
          <option key={option.id || option.value} value={option.id || option.value}>
            {option.name || option.label}
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
        placeholder={placeholder}
      />
    )}
  </div>
);

const StudentsToSection = () => {
  const { getCampusId, getCampusName, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [editSectionLoading, setEditSectionLoading] = useState(false);
  const [deassignLoading, setDeassignLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const assignmentFormRef = useRef(null); // Add ref for auto-scroll
  const [filterOptions, setFilterOptions] = useState({
    academic_years: [],
    classes: []
  });
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    academic_year_id: '',
    class_id: '',
    assignment_status: 'unassigned' // 'assigned', 'unassigned', or ''
  });

  // Form data for academic year selection
  const [formData, setFormData] = useState({
    academicYearData: {
      year_name: '',
      curriculum_id: '',
      medium: '',
      academic_year_id: null
    },
    class_id: '',
    assignment_status: 'unassigned'
  });

  // Section assignment data
  const [assignmentData, setAssignmentData] = useState({
    section_id: ''
  });

  // Available sections for assignment
  const [availableSections, setAvailableSections] = useState([]);
  const [editSectionsForClass, setEditSectionsForClass] = useState([]);

  // Edit section form data
  const [editSectionData, setEditSectionData] = useState({
    academic_year_id: '',
    class_id: '',
    section_id: ''
  });

  // Deassign confirmation dialog state
  const [deassignConfirm, setDeassignConfirm] = useState({
    show: false,
    student: null
  });

  const [academicYearValidation, setAcademicYearValidation] = useState({
    isValid: null,
    academicYearId: null,
    message: ''
  });

  // Dropdown data
  const [classes, setClasses] = useState([]);

  const canAssignStudents = !!hasPermission && hasPermission(PERMISSIONS.STUDENT_ASSIGN_SECTION_CREATE);
  const canEditStudentSection = !!hasPermission && hasPermission(PERMISSIONS.STUDENT_SECTION_EDIT);
  const canDeassignStudentSection = !!hasPermission && hasPermission(PERMISSIONS.STUDENT_SECTION_DELETE);
  const canManageAssignments = canAssignStudents || canEditStudentSection || canDeassignStudentSection;

  const canViewStudentsToSection =
    !!hasPermission &&
    (hasPermission(PERMISSIONS.STUDENT_BY_FILTERS_READ) || hasPermission(PERMISSIONS.STUDENT_LIST_READ));

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const campusId = getCampusId();
      if (!campusId) return;

      // Fetch classes
      const classesRes = await classService.getAllClasses();
      if (classesRes.success) {
        setClasses(classesRes.data.classes?.map(cls => ({
          id: cls.classId,
          name: cls.className
        })) || []);
      }

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load form options');
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await sectionService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to load filter options');
    }
  };

  // Fetch students based on filters
  const fetchStudents = async () => {
    try {
      if (!academicYearValidation.isValid || !formData.class_id || !formData.assignment_status) {
        setStudents([]);
        return;
      }

      setLoading(true);
      
      // Prepare API parameters
      const params = {
        academic_year_id: academicYearValidation.academicYearId,
        class_id: formData.class_id,
        assignment_status: formData.assignment_status,
        campus_id: getCampusId()
      };

      console.log('🔍 Fetching students with params:', params);
      
      // Call API to get students (we'll create this endpoint)
      const response = await studentService.getStudentsByFilters(params);
      
      if (response.success) {
        setStudents(response.data.students || []);
        console.log('✅ Students fetched:', response.data.students?.length || 0);
      }
      
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(error.message || 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available sections for assignment
  const fetchAvailableSections = async () => {
    try {
      if (!academicYearValidation.isValid || !formData.class_id) {
        setAvailableSections([]);
        return;
      }

      const params = {
        academic_year_id: academicYearValidation.academicYearId,
        class_id: formData.class_id
      };

      const response = await sectionService.getAllSections(params);
      
      if (response.success) {
        setAvailableSections(response.data.sections?.map(section => ({
          id: section.section_id,
          name: section.section_name
        })) || []);
      }
      
    } catch (error) {
      console.error('Error fetching available sections:', error);
      toast.error('Failed to load available sections');
      setAvailableSections([]);
    }
  };

  // Handle academic year change
  const handleAcademicYearChange = (event, additionalData) => {
    const academicYearData = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      academicYearData: academicYearData
    }));

    // Clear students when academic year changes
    setStudents([]);
    setSelectedStudents(new Set());
  };

  // Handle academic year validation change
  const handleAcademicYearValidationChange = (validation) => {
    setAcademicYearValidation(validation);
    
    // Clear students when validation changes
    setStudents([]);
    setSelectedStudents(new Set());
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear students when filters change
    setStudents([]);
    setSelectedStudents(new Set());
  };

  // Handle assignment input changes
  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search/filter students
  const handleSearchStudents = () => {
    setHasSearched(true);
    fetchStudents();
  };

  // Handle student selection
  const handleStudentSelection = (studentId, isChecked) => {
    const newSelected = new Set(selectedStudents);
    
    if (isChecked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    
    setSelectedStudents(newSelected);
  };

  // Handle select all students
  const handleSelectAllStudents = (isChecked) => {
    if (isChecked) {
      const allStudentIds = new Set(students.map(student => student.user_id || student.admission_number));
      setSelectedStudents(allStudentIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  // Handle assign button click
  const handleAssignButtonClick = async () => {
    if (!canAssignStudents) {
      toast.error('You do not have permission to assign students to sections');
      return;
    }
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }
    
    // Show loading toast to indicate action is being processed
    toast.loading('Loading assignment form...', { id: 'assignment-loading' });
    
    try {
      await fetchAvailableSections();
      setShowAssignForm(true);
      
      // Dismiss loading toast after form is shown
      setTimeout(() => {
        toast.dismiss('assignment-loading');
        toast.success('Assignment form loaded. Please select a section.');
      }, 200);
      
    } catch (error) {
      toast.dismiss('assignment-loading');
      toast.error('Failed to load assignment form');
    }
  };

  // Handle section assignment
  const handleSectionAssignment = async () => {
    try {
      if (!canAssignStudents) {
        toast.error('You do not have permission to assign students to sections');
        return;
      }
      if (!assignmentData.section_id) {
        toast.error('Please select a section');
        return;
      }

      if (selectedStudents.size === 0) {
        toast.error('No students selected');
        return;
      }

      setAssignmentLoading(true);

      // Prepare assignment data
      const assignmentPayload = {
        student_ids: Array.from(selectedStudents),
        section_id: parseInt(assignmentData.section_id),
        academic_year_id: academicYearValidation.academicYearId,
        class_id: parseInt(formData.class_id)
      };

      console.log('🎯 Assigning students to section:', assignmentPayload);

      // Call API to assign students (we'll create this endpoint)
      const response = await studentService.assignStudentsToSection(assignmentPayload);

      if (response.success) {
        toast.success(`Successfully assigned ${selectedStudents.size} students to section`);
        
        // Reset states
        setSelectedStudents(new Set());
        setShowAssignForm(false);
        setAssignmentData({ section_id: '' });
        
        // Refresh students list
        fetchStudents();
      }

    } catch (error) {
      console.error('Error assigning students to section:', error);
      toast.error(error.message || 'Failed to assign students to section');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Cancel assignment
  const handleCancelAssignment = () => {
    setShowAssignForm(false);
    setAssignmentData({ section_id: '' });
    // Optionally scroll back to the students table
    toast.info('Assignment cancelled');
  };

  // Handle edit section click
  const handleEditSectionClick = async (student) => {
    try {
      if (!canEditStudentSection) {
        toast.error('You do not have permission to edit student sections');
        return;
      }
      setEditingStudent(student);
      
      // Set default values for edit form
      setEditSectionData({
        academic_year_id: academicYearValidation.academicYearId,
        class_id: student.class_id || formData.class_id,
        section_id: student.section_id || ''
      });

      // Fetch available sections for this student's class
      await fetchEditSectionsForClass(student.class_id || formData.class_id);
      
      setShowEditSectionModal(true);
      toast.success('Edit form loaded. Please select new section.');
      
    } catch (error) {
      console.error('Error opening edit section modal:', error);
      toast.error('Failed to load edit form');
    }
  };

  // Handle deassign student
  const handleDeassignStudent = async (student) => {
    setDeassignConfirm({
      show: true,
      student: student
    });
  };

  // Confirm deassign student
  const confirmDeassignStudent = async () => {
    try {
      if (!canDeassignStudentSection) {
        toast.error('You do not have permission to deassign students from sections');
        return;
      }
      const student = deassignConfirm.student;
      if (!student) return;

      setDeassignLoading(true);

      const studentId = student.user_id || student.admission_number;
      const response = await studentService.deassignStudentSection(studentId, academicYearValidation.academicYearId);

      if (response.success) {
        toast.success('Student successfully deassigned from section');
        // Refresh students list
        fetchStudents();
      }

    } catch (error) {
      console.error('Error deassigning student:', error);
      toast.error(error.message || 'Failed to deassign student from section');
    } finally {
      setDeassignLoading(false);
      setDeassignConfirm({ show: false, student: null });
    }
  };

  // Handle edit section input change
  const handleEditSectionInputChange = (e) => {
    const { name, value } = e.target;
    setEditSectionData(prev => ({
      ...prev,
      [name]: value
    }));

    // If class changes, fetch new sections
    if (name === 'class_id' && value) {
      fetchEditSectionsForClass(value);
    }
  };

  // Fetch sections for edit form based on class
  const fetchEditSectionsForClass = async (classId) => {
    try {
      const params = {
        academic_year_id: academicYearValidation.academicYearId,
        class_id: classId
      };

      const response = await sectionService.getAllSections(params);
      
      if (response.success) {
        setEditSectionsForClass(response.data.sections?.map(section => ({
          id: section.section_id,
          name: section.section_name
        })) || []);
      }
      
    } catch (error) {
      console.error('Error fetching sections for edit:', error);
      toast.error('Failed to load sections for selected class');
      setEditSectionsForClass([]);
    }
  };

  // Handle edit section submission
  const handleEditSectionSubmit = async () => {
    try {
      if (!canEditStudentSection) {
        toast.error('You do not have permission to edit student sections');
        return;
      }
      if (!editSectionData.section_id) {
        toast.error('Please select a section');
        return;
      }

      if (!editingStudent) {
        toast.error('No student selected for editing');
        return;
      }

      setEditSectionLoading(true);

      const studentId = editingStudent.user_id || editingStudent.admission_number;
      const updateData = {
        academic_year_id: parseInt(editSectionData.academic_year_id),
        class_id: parseInt(editSectionData.class_id),
        section_id: parseInt(editSectionData.section_id)
      };

      console.log('🔄 Updating student section:', { studentId, updateData });

      const response = await studentService.updateStudentSection(studentId, updateData);

      if (response.success) {
        toast.success('Student section updated successfully');
        
        // Reset states
        setShowEditSectionModal(false);
        setEditingStudent(null);
        setEditSectionData({ academic_year_id: '', class_id: '', section_id: '' });
        setEditSectionsForClass([]);
        
        // Refresh students list
        fetchStudents();
      }

    } catch (error) {
      console.error('Error updating student section:', error);
      toast.error(error.message || 'Failed to update student section');
    } finally {
      setEditSectionLoading(false);
    }
  };

  // Cancel edit section
  const handleCancelEditSection = () => {
    setShowEditSectionModal(false);
    setEditingStudent(null);
    setEditSectionData({ academic_year_id: '', class_id: '', section_id: '' });
    setEditSectionsForClass([]);
    toast.info('Edit cancelled');
  };

  // Get class name helper
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === parseInt(classId));
    return cls ? cls.name : 'Unknown';
  };

  // Load initial data
  useEffect(() => {
    fetchDropdownData();
    fetchFilterOptions();
  }, []);

  // Handle auto-scroll when assignment form is shown
  useEffect(() => {
    if (showAssignForm) {
      console.log('🔍 Assignment form shown, attempting scroll...');
      console.log('📍 Ref current:', assignmentFormRef.current);
      
      const scrollToForm = () => {
        const element = assignmentFormRef.current || document.getElementById('assignment-form');
        console.log('🎯 Scroll attempt - Element:', element);
        
        if (element) {
          console.log('✅ Element found, scrolling...');
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          return true;
        } else {
          console.log('❌ Element not found');
          return false;
        }
      };
    }
  }, [showAssignForm]);

  // Instructions for the page
  const instructions = (
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
                  <li><strong>Step 1:</strong> Select Academic Year, Curriculum, Medium, and Class</li>
                  <li><strong>Step 2:</strong> Choose whether to view Assigned or Unassigned students</li>
                  <li><strong>Step 3:</strong> Click "Search Students" to load the student list</li>
                  <li><strong>For Unassigned Students:</strong></li>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Select individual students or all students</li>
                    <li>Click "Assign Selected Students" and choose a section</li>
                  </ul>
                  <li><strong>For Assigned Students:</strong></li>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Click "Edit Section" to change a student's section assignment</li>
                    <li>Click "Deassign" to remove a student from their current section</li>
                  </ul>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  if (!canViewStudentsToSection) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-sm text-gray-600">
                You do not have permission to view student section assignments.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Students to Section Assignment</h1>
          <p className="mt-1 text-sm text-gray-600">
            Assign students to sections based on academic year and class
          </p>
        </div>

        {/* Instructions */}
        {instructions}

        {/* Campus Info */}
        <div className="mb-6">
          <Card>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-700">
                <strong>Campus:</strong> {getCampusName()}
              </p>
            </div>
          </Card>
        </div>

        {/* Filter Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Filter Students</h2>
            
            <div className="space-y-6">
              {/* Academic Year Selection */}
              <div className="border-b pb-4">
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

              {/* Class and Assignment Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Class" 
                  name="class_id" 
                  type="select"
                  options={classes}
                  required 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                />
                <InputField 
                  label="Assignment Status" 
                  name="assignment_status" 
                  type="select"
                  options={[
                    { id: 'assigned', name: 'Assigned Students' },
                    { id: 'unassigned', name: 'Unassigned Students' }
                  ]}
                  required 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                />
              </div>

              {/* Search Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSearchStudents}
                  disabled={!academicYearValidation.isValid || !formData.class_id || !formData.assignment_status}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    academicYearValidation.isValid && formData.class_id && formData.assignment_status
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Search Students
                </button>
              </div>

              {!academicYearValidation.isValid && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Please select a valid academic year combination first.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Students List */}
        {(hasSearched || loading) && (
          <Card className="mt-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {formData.assignment_status === 'assigned' ? 'Assigned' : 'Unassigned'} Students
                  {students.length > 0 && ` (${students.length})`}
                </h2>
                
                {/* Selection Controls for Unassigned Students */}
                {formData.assignment_status === 'unassigned' && students.length > 0 && canAssignStudents && (
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === students.length && students.length > 0}
                        onChange={(e) => handleSelectAllStudents(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Select All</span>
                    </label>
                    
                    {selectedStudents.size > 0 && (
                      <div className="text-sm text-blue-600">
                        {selectedStudents.size} selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner className="w-6 h-6" />
                  <p className="ml-2 text-gray-500">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No {formData.assignment_status} students found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.assignment_status === 'assigned' 
                      ? 'No students are currently assigned to sections in this class and academic year.'
                      : 'No unassigned students found in this class and academic year. All students may already be assigned to sections.'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        {formData.assignment_status === 'unassigned' && canAssignStudents && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                        )}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Admission Number
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        {formData.assignment_status === 'assigned' && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Section
                          </th>
                        )}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll Number
                        </th>
                        {formData.assignment_status === 'assigned' && canManageAssignments && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => {
                        const studentId = student.user_id || student.admission_number;
                        const isSelected = selectedStudents.has(studentId);
                        
                        return (
                          <tr 
                            key={studentId}
                            className={`hover:bg-gray-50 transition-colors duration-150 ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            {formData.assignment_status === 'unassigned' && canAssignStudents && (
                              <td className="px-4 py-2 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleStudentSelection(studentId, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.admission_number}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {`${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {student.class_name || getClassName(student.class_id)}
                            </td>
                            {formData.assignment_status === 'assigned' && canManageAssignments && (
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {student.section_name || 'N/A'}
                              </td>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {student.roll_number || 'Not Assigned'}
                            </td>
                            {formData.assignment_status === 'assigned' && (
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex space-x-2">
                                  {canEditStudentSection && (
                                    <button
                                      onClick={() => handleEditSectionClick(student)}
                                      disabled={editSectionLoading || deassignLoading}
                                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Edit Section
                                    </button>
                                  )}
                                  {canDeassignStudentSection && (
                                    <button
                                      onClick={() => handleDeassignStudent(student)}
                                      disabled={editSectionLoading || deassignLoading}
                                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Deassign
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Assign Button for Unassigned Students */}
              {formData.assignment_status === 'unassigned' && students.length > 0 && canAssignStudents && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAssignButtonClick}
                    disabled={selectedStudents.size === 0}
                    className={`px-6 py-2 rounded-md font-medium transition-colors ${
                      selectedStudents.size > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Assign Selected Students ({selectedStudents.size})
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Section Assignment Form */}
        {showAssignForm && (
          <Card 
            ref={assignmentFormRef} 
            id="assignment-form"
            className="mt-6 border-2 border-blue-300 bg-blue-50 shadow-lg transition-all duration-500 ease-in-out transform"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="ml-3 text-lg font-semibold text-blue-900">
                  Assign {selectedStudents.size} Students to Section
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <InputField 
                  label="Select Section" 
                  name="section_id" 
                  type="select"
                  options={availableSections}
                  required 
                  formData={assignmentData} 
                  handleInputChange={handleAssignmentInputChange} 
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelAssignment}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={assignmentLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSectionAssignment}
                  disabled={!assignmentData.section_id || assignmentLoading}
                  className={`px-6 py-2 text-white rounded transition-colors flex items-center gap-2 ${
                    assignmentData.section_id && !assignmentLoading
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {assignmentLoading && <LoadingSpinner className="w-4 h-4" />}
                  Assign to Section
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Edit Section Modal */}
        {showEditSectionModal && editingStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-900">
                    Edit Section Assignment
                  </h2>
                  <button
                    onClick={handleCancelEditSection}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                    disabled={editSectionLoading}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Student:</strong> {editingStudent.first_name} {editingStudent.middle_name || ''} {editingStudent.last_name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Admission Number:</strong> {editingStudent.admission_number}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Current Section:</strong> {editingStudent.section_name || 'N/A'}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <InputField 
                    label="Academic Year" 
                    name="academic_year_id" 
                    type="select"
                    options={[{
                      id: academicYearValidation.academicYearId,
                      name: `${formData.academicYearData.year_name} - ${formData.academicYearData.curriculum_name || formData.academicYearData.curriculum_id} - ${formData.academicYearData.medium}`
                    }]}
                    required 
                    formData={editSectionData} 
                    handleInputChange={handleEditSectionInputChange}
                    className="opacity-75 cursor-not-allowed"
                  />
                  
                  <InputField 
                    label="Class" 
                    name="class_id" 
                    type="select"
                    options={classes}
                    required 
                    formData={editSectionData} 
                    handleInputChange={handleEditSectionInputChange} 
                  />
                  
                  <InputField 
                    label="New Section" 
                    name="section_id" 
                    type="select"
                    options={editSectionsForClass}
                    required 
                    formData={editSectionData} 
                    handleInputChange={handleEditSectionInputChange} 
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancelEditSection}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    disabled={editSectionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSectionSubmit}
                    disabled={!editSectionData.section_id || editSectionLoading}
                    className={`px-4 py-2 text-white rounded transition-colors flex items-center gap-2 ${
                      editSectionData.section_id && !editSectionLoading
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {editSectionLoading && <LoadingSpinner className="w-4 h-4" />}
                    Update Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deassign Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deassignConfirm.show}
          onClose={() => setDeassignConfirm({ show: false, student: null })}
          onConfirm={confirmDeassignStudent}
          title="Deassign Student"
          message={
            deassignConfirm.student ? (
              <div>
                <p className="mb-2">
                  Are you sure you want to deassign <strong>{deassignConfirm.student.first_name} {deassignConfirm.student.last_name}</strong> from their current section?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Warning:</strong> This action will remove the student from their section assignment. They will need to be reassigned to a section later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : "Are you sure you want to deassign this student?"
          }
          confirmText="Deassign"
          cancelText="Cancel"
          variant="warning"
          isLoading={deassignLoading}
        />
      </div>
    </div>
  );
};

export default StudentsToSection;
