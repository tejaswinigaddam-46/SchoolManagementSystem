import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  AlertCircle, 
  User, 
  BookOpen, 
  Calendar, 
  Save, 
  Loader2
} from 'lucide-react';
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
import RequiredAsterisk from '../components/ui/RequiredAsterisk.jsx';
import Modal from '../components/ui/Modal';

// InputField component for form fields
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, placeholder = '' }) => (
  <div className={`${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <RequiredAsterisk />}
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
  const assignmentFormRef = useRef(null);
  const studentsListRef = useRef(null); // Add ref for students list auto-scroll
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
      curriculum_code: '',
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
    setHasSearched(false);
    setShowAssignForm(false);
  };

  // Handle academic year validation change
  const handleAcademicYearValidationChange = (validation) => {
    setAcademicYearValidation(validation);
    
    // Clear students when validation changes
    setStudents([]);
    setSelectedStudents(new Set());
    setHasSearched(false);
    setShowAssignForm(false);
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
    setHasSearched(false);
    setShowAssignForm(false);
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

      // Fetch available sections for the student's current class
      const classId = student.class_id || formData.class_id;
      await fetchEditSectionsForClass(classId);
      
      setShowEditSectionModal(true);
      
    } catch (error) {
      console.error('Error opening edit section modal:', error);
      toast.error('Failed to load sections for the form');
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

  // Handle auto-scroll when students are searched (Smart UX)
  useEffect(() => {
    if (hasSearched && !loading && studentsListRef.current) {
      const rect = studentsListRef.current.getBoundingClientRect();
      // Scroll if the results are not fully visible or below half of the viewport
      if (rect.top > window.innerHeight / 2 || rect.top < 0) {
        studentsListRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }
    }
  }, [hasSearched, loading]);

  // Handle auto-scroll when assignment form is shown (Smart UX)
  useEffect(() => {
    if (showAssignForm) {
      // Small timeout to ensure the element is rendered and ref is updated
      const timeoutId = setTimeout(() => {
        if (assignmentFormRef.current) {
          const rect = assignmentFormRef.current.getBoundingClientRect();
          // Scroll if the form is not fully visible or below half of the viewport
          if (rect.top > window.innerHeight / 2 || rect.top < 0) {
            assignmentFormRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center'
            });
          }
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [showAssignForm]);

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
          <h1 className="font-bold text-3xl text-secondary-900 mb-2">Building Management</h1>
          <p className="text-secondary-600">
            Campus: {getCampusName()}
          </p>
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
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
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
          <Card ref={studentsListRef} className="mt-6">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  {formData.assignment_status === 'assigned' ? 'Assigned' : 'Unassigned'} Students
                  {students.length > 0 && ` (${students.length})`}
                </h2>
                
                {/* Selection Count Badge - Moved below header */}
                {formData.assignment_status === 'unassigned' && students.length > 0 && canAssignStudents && selectedStudents.size > 0 && (
                  <div className="mt-2 flex items-center">
                    <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2 shadow-sm">
                      <span className="flex bg-blue-600 animate-pulse"></span>
                      {selectedStudents.size} student/s selected for assignment
                    </div>
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
                          <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedStudents.size === students.length && students.length > 0}
                                onChange={(e) => handleSelectAllStudents(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                              />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select All</span>
                            </div>
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
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
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
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
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
                  label="Section" 
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
                      ? 'bg-primary-600 hover:bg-primary-700' 
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
        <Modal
          isOpen={showEditSectionModal && !!editingStudent}
          onClose={handleCancelEditSection}
          size="md"
          showCloseButton={false}
          closeOnBackdrop={false}
        >
          {editingStudent && (
            <div className="p-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-1">
                  Edit Section Assignment
                </h2>
                <p className="text-sm text-secondary-600">
                  Update section for {editingStudent.first_name} {editingStudent.last_name}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleEditSectionSubmit(); }} className="space-y-4">
                {/* Display Only Fields */}
                <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 text-secondary-400 mr-3 flex-shrink-0" />
                    <span className="text-secondary-500 w-32">Student:</span>
                    <span className="font-medium text-secondary-900">
                      {editingStudent.first_name} {editingStudent.middle_name || ''} {editingStudent.last_name}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 text-secondary-400 mr-3 flex-shrink-0" />
                    <span className="text-secondary-500 w-32">Admission No:</span>
                    <span className="font-medium text-secondary-900">{editingStudent.admission_number}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-secondary-400 mr-3 flex-shrink-0" />
                    <span className="text-secondary-500 w-32">Academic Year:</span>
                    <span className="font-medium text-secondary-900">
                      {formData.academicYearData.year_name} - {formData.academicYearData.curriculum_code} - {formData.academicYearData.medium}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 text-secondary-400 mr-3 flex-shrink-0" />
                    <span className="text-secondary-500 w-32">Class:</span>
                    <span className="font-medium text-secondary-900">
                      {editingStudent.class_name || getClassName(editingStudent.class_id)}
                    </span>
                  </div>
                </div>

                {/* Editable Field: Section */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    New Section <RequiredAsterisk />
                  </label>
                  <select
                    value={editSectionData.section_id}
                    onChange={(e) => setEditSectionData(prev => ({ ...prev, section_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a section</option>
                    {editSectionsForClass.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Note about changing class/academic year */}
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-xs text-amber-800">
                        <strong>Note:</strong> To change the class or academic year, please 
                        <span className="font-bold"> deassign </span> the student first, then assign them to the desired class/year.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
                  <button
                    type="button"
                    onClick={handleCancelEditSection}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                    disabled={editSectionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!editSectionData.section_id || editSectionLoading}
                  >
                    {editSectionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Section
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>

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
