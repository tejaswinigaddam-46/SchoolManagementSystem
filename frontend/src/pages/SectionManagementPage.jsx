import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AcademicYearSelector from '../components/forms/AcademicYearSelector.jsx';
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx';
import sectionService from '../services/sectionService';
import { PERMISSIONS } from '../config/permissions';
import classService from '../services/classService';
import { roomService } from '../services/roomService';
import userService from '../services/userService';
import { academicService } from '../services/academicService';
import subjectService from '../services/subjectService';
import sectionSubjectService from '../services/sectionSubjectService';

// AutocompleteInput component for teacher and student search
const AutocompleteInput = ({ 
  label, 
  name, 
  required = false, 
  placeholder = '', 
  value, 
  displayValue,
  onChange, 
  searchFunction,
  className = '',
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(displayValue || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(displayValue || '');
  }, [displayValue]);

  const handleInputChange = async (e) => {
    const searchTerm = e.target.value;
    setInputValue(searchTerm);

    if (searchTerm.length >= 2) {
      setLoading(true);
      try {
        const results = await searchFunction(searchTerm);
        setSuggestions(results.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      if (searchTerm === '') {
        onChange(name, '', '');
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Construct full name including middle name if present
    let displayName = suggestion.full_name;
    if (!displayName) {
      const nameParts = [
        suggestion.first_name,
        suggestion.middle_name,
        suggestion.last_name
      ].filter(Boolean); // Filter out null/undefined/empty values
      displayName = nameParts.join(' ') || suggestion.name;
    }
    
    setInputValue(displayName);
    onChange(name, suggestion.user_id || suggestion.id, displayName);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-2 text-center">
              <LoadingSpinner className="w-4 h-4 mx-auto" />
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => {
              // Construct full name including middle name if present
              let displayName = suggestion.full_name;
              if (!displayName) {
                const nameParts = [
                  suggestion.first_name,
                  suggestion.middle_name,
                  suggestion.last_name
                ].filter(Boolean); // Filter out null/undefined/empty values
                displayName = nameParts.join(' ') || suggestion.name;
              }
              const subText = suggestion.username || suggestion.admission_number || suggestion.employee_id || '';
              
              return (
                <div
                  key={suggestion.user_id || suggestion.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="text-sm font-medium text-gray-900">{displayName}</div>
                  {subText && <div className="text-xs text-gray-500">{subText}</div>}
                </div>
              );
            })
          ) : (
            <div className="p-2 text-sm text-gray-500 text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// InputField component for form fields
const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, placeholder = '', disabled = false }) => (
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
        disabled={disabled}
      />
    )}
  </div>
);

// RoomSelectField component with capacity display
const RoomSelectField = ({ label, name, required = false, options = null, className = '', formData, handleInputChange, selectedRoom }) => (
  <div className={`${className}`}>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={formData[name]}
      onChange={handleInputChange}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
      required={required}
    >
      <option value="">Select {label}</option>
      {options?.map(option => (
        <option key={option.id} value={option.id}>
          {option.name} {option.capacity ? `(Capacity: ${option.capacity})` : ''}
        </option>
      ))}
    </select>
    {selectedRoom && selectedRoom.capacity && (
      <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-center text-xs text-blue-700">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <strong>Room Capacity: {selectedRoom.capacity}</strong>
          {selectedRoom.building_name && <span className="ml-2">• {selectedRoom.building_name}</span>}
          {selectedRoom.room_type && <span className="ml-2">• {selectedRoom.room_type}</span>}
        </div>
      </div>
    )}
  </div>
);

const SectionManagement = () => {
  const { getCampusId, getCampusName, hasPermission } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [sections, setSections] = useState([]);

  const canCreateSection = hasPermission && hasPermission(PERMISSIONS.SECTION_CREATE);
  const canEditOrDeleteSection =
    hasPermission &&
    (hasPermission(PERMISSIONS.SECTION_EDIT) || hasPermission(PERMISSIONS.SECTION_DELETE));
  const [editingSection, setEditingSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, section: null });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [filters, setFilters] = useState({ 
    search: '',
    academic_year_id: '',
    class_id: ''
  });
  
  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    academic_years: [],
    classes: []
  });

  const [formData, setFormData] = useState({
    academicYearData: {
      year_name: '',
      curriculum_id: '',
      medium: '',
      academic_year_id: null
    },
    class_id: '',
    section_name: '',
    room_id: '',
    primary_teacher_user_id: '',
    primary_teacher_name: '',
    student_monitor_user_id: '',
    student_monitor_name: '',
    capacity: ''
  });

  const [academicYearValidation, setAcademicYearValidation] = useState({
    isValid: null,
    academicYearId: null,
    message: ''
  });

  const [formSubjects, setFormSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [curriculumCode, setCurriculumCode] = useState('');
  const allSubjectsSelected = formSubjects.length > 0 && selectedSubjects.length === formSubjects.length;

  // Reset form data helper
  const resetFormData = () => {
    setFormData({
      academicYearData: {
        year_name: '',
        curriculum_id: '',
        medium: '',
        academic_year_id: null
      },
      class_id: '',
      section_name: '',
      room_id: '',
      primary_teacher_user_id: '',
      primary_teacher_name: '',
      student_monitor_user_id: '',
      student_monitor_name: '',
      capacity: ''
    });

    setAcademicYearValidation({
      isValid: null,
      academicYearId: null,
      message: ''
    });

    setSelectedRoom(null);
  };

  // Validation helper functions
  const getCapacityValidation = () => {
    const sectionCapacity = parseInt(formData.capacity);
    let roomCapacity = selectedRoom?.capacity;
    if (roomCapacity == null) {
      const rid = formData.room_id ? parseInt(formData.room_id) : (editingSection?.room_id || null);
      if (rid) {
        const r = allRooms.find(room => room.id === rid);
        roomCapacity = r?.capacity;
      }
    }

    if (!sectionCapacity || !roomCapacity) {
      return { isValid: true, message: '' };
    }

    if (sectionCapacity > roomCapacity) {
      return {
        isValid: false,
        message: `Section capacity (${sectionCapacity}) cannot exceed room capacity (${roomCapacity})`
      };
    }

    return { isValid: true, message: '' };
  };

  const capacityValidation = getCapacityValidation();

  // Search function for teachers
  const searchTeachers = async (searchTerm) => {
    try {
      return await userService.searchTeachers(searchTerm);
    } catch (error) {
      console.error('Error searching teachers:', error);
      return { data: [] };
    }
  };

  // Search function for students (filtered by selected class)
  const searchStudents = async (searchTerm) => {
    try {
      if (!formData.class_id) {
        toast.info('Please select a class first to search for students');
        return { data: [] };
      }
      
      // Prepare filters object with all academic context
      const filters = {
        classId: formData.class_id,
        academicYearId: formData.academicYearData.academic_year_id,
        curriculumId: formData.academicYearData.curriculum_id,
        campusId: getCampusId()
      };
      
      console.log('🔍 Searching students with:', { searchTerm, filters });
      const result = await userService.searchStudentsByClass(searchTerm, filters);
      console.log('📋 Student search result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error searching students:', error);
      return { data: [] };
    }
  };

  // Handle autocomplete field changes
  const handleAutocompleteChange = (fieldName, userId, displayName) => {
    setFormData(prev => ({
      ...prev,
      [`${fieldName}_user_id`]: userId,
      [`${fieldName}_name`]: displayName
    }));
  };

  // Handle academic year change
  const handleAcademicYearChange = (event, additionalData) => {
    const academicYearData = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      academicYearData: academicYearData
    }));
  };

  // Handle academic year validation change
  const handleAcademicYearValidationChange = (validation) => {
    setAcademicYearValidation(validation);
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const campusId = getCampusId();
      if (!campusId) return;

      // Fetch classes and rooms in parallel
      const [classesRes, roomsRes] = await Promise.all([
        classService.getAllClasses(),
        roomService.getAllRooms()
      ]);

      if (classesRes.success) {
        setClasses(classesRes.data.classes?.map(cls => ({
          id: cls.classId,
          name: cls.className
        })) || []);
      }

      if (roomsRes.success) {
        const baseRooms = roomsRes.data.map(room => ({
          id: room.room_id,
          name: room.room_number,
          capacity: room.capacity,
          building_name: room.building_name,
          room_type: room.room_type,
          status: room.status,
          available_capacity: room.available_capacity
        }));
        setAllRooms(baseRooms);
        setRooms(baseRooms);
      }

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load form options');
    }
  };

  // Refresh available rooms based on room booking status (campus-wide)
  const refreshAvailableRooms = async () => {
    try {
      let available = allRooms.filter(r => r.status !== 'booked');
      if (showEditForm && editingSection?.room_id) {
        const currentRoom = allRooms.find(r => r.id === editingSection.room_id);
        if (currentRoom && !available.some(r => r.id === currentRoom.id)) {
          available = [currentRoom, ...available];
        }
      }
      setRooms(available);
    } catch (err) {
      console.error('Failed to refresh available rooms:', err);
      setRooms(allRooms);
    }
  };

  useEffect(() => {
    refreshAvailableRooms();
  }, [academicYearValidation, showEditForm, editingSection, allRooms.length]);

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

  const fetchFormSubjects = async () => {
    try {
      const campusId = getCampusId();
      if (!campusId) return;
      if (!academicYearValidation.isValid || !formData.class_id) {
        setFormSubjects([]);
        setCurriculumCode('');
        return;
      }
      const subjectsRes = await subjectService.getAllSubjects(campusId);
      if (subjectsRes.success) {
        const all = subjectsRes.data?.subjects || subjectsRes.data || [];
        let code = '';
        if (formData.academicYearData.curriculum_id) {
          const curriculumRes = await academicService.getCurriculumById(campusId, formData.academicYearData.curriculum_id);
          code = curriculumRes.success ? (curriculumRes.data?.curriculum_code || curriculumRes.data?.curriculum?.curriculum_code) : '';
        }
        setCurriculumCode(code || '');
        const filtered = code ? all.filter(s => s.curriculum_code === code) : all.filter(s => s.curriculum_id === formData.academicYearData.curriculum_id);
        setFormSubjects(filtered);
        setSelectedSubjects(prev => {
          if (prev && prev.length > 0) {
            const set = new Set(filtered.map(fs => fs.subject_id));
            return prev.filter(id => set.has(id));
          }
          return [];
        });
      }
    } catch (error) {
      console.error('Error fetching form subjects:', error);
      setFormSubjects([]);
    }
  };

  // Ensure assigned subjects are reflected after form subjects load in edit mode
  useEffect(() => {
    (async () => {
      try {
        if (showEditForm && editingSection?.section_id && formSubjects.length > 0) {
          const res = await sectionSubjectService.getAssignmentsBySections([editingSection.section_id]);
          const assigns = res?.data?.assignments || res?.assignments || [];
          const assignedIds = assigns.map(a => a.subject_id).filter(Boolean);
          const allowed = new Set(formSubjects.map(fs => fs.subject_id));
          setSelectedSubjects(assignedIds.filter(id => allowed.has(id)));
        }
      } catch (err) {
        console.error('Failed to sync edit selections:', err);
      }
    })();
  }, [showEditForm, editingSection, formSubjects]);

  useEffect(() => {
    fetchFormSubjects();
  }, [academicYearValidation, formData.class_id, formData.academicYearData.curriculum_id]);

  const toggleSubject = (subjectId, checked) => {
    setSelectedSubjects(prev => {
      const set = new Set(prev);
      if (checked) set.add(subjectId); else set.delete(subjectId);
      return Array.from(set);
    });
  };

  const toggleAllSubjects = (checked) => {
    if (checked) {
      setSelectedSubjects(formSubjects.map(s => s.subject_id));
    } else {
      setSelectedSubjects([]);
    }
  };

  const clearSubjectsSelection = () => setSelectedSubjects([]);

  // Fetch sections with specific filters
  const fetchSectionsWithFilters = async (filtersToUse = filters) => {
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
      
      console.log('🔍 Fetching sections with filters:', params);
      
      const response = await sectionService.getAllSections(params);
      if (response.success) {
        setSections(response.data.sections || []);
        setPagination(response.data.pagination || { current_page: 1, total_pages: 1, total_count: 0 });
        console.log('✅ Sections fetched successfully:', response.data.sections?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error(error.message || 'Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  // Update the original fetchSections to use the new function
  const fetchSections = () => fetchSectionsWithFilters();

  // Handle filter changes from OneAcademicYearPage
  const handleFiltersChange = (newFilters) => {
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, current_page: 1 }));
    // Fetch sections with new filters immediately
    fetchSectionsWithFilters(newFilters);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle room selection - update selected room data
    if (name === 'room_id') {
      const selectedRoomData = rooms.find(room => room.id.toString() === value);
      setSelectedRoom(selectedRoomData || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!academicYearValidation.isValid || !academicYearValidation.academicYearId) {
      toast.error('Please select a valid academic year combination');
      return;
    }

    // Check capacity validation
    const capacityCheck = getCapacityValidation();
    if (!capacityCheck.isValid) {
      toast.error(capacityCheck.message);
      return;
    }

    try {
      setLoading(true);
      
      // Get campus ID from auth context
      const campusId = getCampusId();
      if (!campusId) {
        toast.error('Campus information not available. Please try logging in again.');
        return;
      }

      // Prepare section data with unique academic year ID
      const sectionData = {
        academic_year_id: academicYearValidation.academicYearId,
        class_id: parseInt(formData.class_id),
        section_name: formData.section_name,
        campus_id: campusId,
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        primary_teacher_user_id: formData.primary_teacher_user_id ? parseInt(formData.primary_teacher_user_id) : null,
        student_monitor_user_id: formData.student_monitor_user_id ? parseInt(formData.student_monitor_user_id) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      };
      
      if (showEditForm && editingSection) {
        // Update existing section
        // Prevent duplicate section name for same academic year and class
        try {
          const dupRes = await sectionService.getAllSections({ academic_year_id: academicYearValidation.academicYearId, class_id: parseInt(formData.class_id), limit: 1000 });
          const list = dupRes?.data?.sections || [];
          const targetName = (formData.section_name || '').trim().toLowerCase();
          const hasDup = list.some(s => s.section_id !== editingSection.section_id && (s.section_name || '').trim().toLowerCase() === targetName);
          if (hasDup) {
            toast.error('Section with this name already exist');
            return;
          }
        } catch (dupErr) {
          console.error('Duplicate check failed, proceeding with update:', dupErr);
        }
        const response = await sectionService.updateSection(editingSection.section_id, sectionData);
        if (response.success) {
          try {
            const sectionId = editingSection.section_id;
            const existingRes = await sectionSubjectService.getAssignmentsBySections([sectionId]);
            const existingIds = new Set((existingRes?.data?.assignments || existingRes?.assignments || []).map(a => a.subject_id));
            const selectedIds = new Set((selectedSubjects || []).map(id => parseInt(id)));

            const toAdd = Array.from(selectedIds).filter(id => !existingIds.has(id)).map(id => ({ section_id: parseInt(sectionId), subject_id: parseInt(id) }));
            const removed = Array.from(existingIds).filter(id => !selectedIds.has(id));

            if (toAdd.length > 0) {
              const assignRes = await sectionSubjectService.assignSubjectsToSection(toAdd);
              const inserted = assignRes?.data?.result?.inserted ?? toAdd.length;
              toast.success(`Section updated. Subjects added: ${inserted}`);
            } else {
              toast.success(`Section updated.`);
            }

            if (removed.length > 0) {
              const unassignRes = await sectionSubjectService.unassignSubjectsFromSection(sectionId, removed);
              const deleted = unassignRes?.data?.result?.deleted ?? removed.length;
              toast.success(`Subjects removed: ${deleted}`);
            }
          } catch (assignErr) {
            console.error('Error reconciling subject assignments after update:', assignErr);
            toast.error('Section updated, but subject changes failed');
          }

          fetchSections();
          await refreshAvailableRooms();
          setShowEditForm(false);
          setEditingSection(null);
          resetFormData();
        }
      } else {
        // Create new section
        const response = await sectionService.createSection(sectionData);
        if (response.success) {
          const created = response.data?.section || response.data || {};
          const newSectionId = created.section_id || created.id || created.sectionId;

          if (newSectionId && Array.isArray(selectedSubjects) && selectedSubjects.length > 0) {
            try {
              const payload = selectedSubjects.map(sub => ({ section_id: parseInt(newSectionId), subject_id: parseInt(sub) }));
              const assignRes = await sectionSubjectService.assignSubjectsToSection(payload);
              const inserted = assignRes?.data?.result?.inserted ?? 0;
              const existingRes = await sectionSubjectService.getAssignmentsBySections([newSectionId]);
              const existingPairs = new Set((existingRes?.data?.assignments || []).map(r => `${r.section_id}-${r.subject_id}`));
              const requestedPairs = new Set(payload.map(p => `${p.section_id}-${p.subject_id}`));
              let already = 0;
              requestedPairs.forEach(pair => { if (existingPairs.has(pair)) already++; });
              toast.success(`Section created and subjects assigned. Inserted: ${inserted}${already ? `, Already assigned: ${already}` : ''}`);
            } catch (err) {
              console.error('Error assigning subjects after section creation:', err);
              toast.error('Section created, but assigning subjects failed');
            }
          } else {
            toast.success('Section created successfully!');
          }

          fetchSections();
          await refreshAvailableRooms();
          setShowAddForm(false);
          resetFormData();
        }
      }
    } catch (error) {
      console.error('Error saving section:', error);
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => toast.error(err.message));
      } else {
        toast.error(error.message || 'Failed to save section');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit section
  const handleEditSection = (section) => {
    setEditingSection(section);
    setFormData({
      academicYearData: {
        year_name: section.year_name || '',
        year_type: section.year_type || '',
        curriculum_id: section.curriculum_id?.toString() || '',
        medium: section.medium || '',
        academic_year_id: section.academic_year_id || null
      },
      class_id: section.class_id?.toString() || '',
      section_name: section.section_name || '',
      room_id: section.room_id?.toString() || '',
      primary_teacher_user_id: section.primary_teacher_user_id?.toString() || '',
      primary_teacher_name: section.primary_teacher_name || '',
      student_monitor_user_id: section.student_monitor_user_id?.toString() || '',
      student_monitor_name: section.student_monitor_name || '',
      capacity: section.capacity?.toString() || ''
    });

    // Set selected room data
    if (section.room_id) {
      const selectedRoomData = rooms.find(room => room.id === section.room_id);
      setSelectedRoom(selectedRoomData || null);
    }

    // Set academic year validation if available
    if (section.academic_year_id) {
      setAcademicYearValidation({
        isValid: true,
        academicYearId: section.academic_year_id,
        message: 'Valid combination found'
      });
    }

    setShowEditForm(true);

    // Enrich academic year with year_type and preselect assigned subjects
    (async () => {
      try {
        const campusId = getCampusId();
        if (campusId && section.academic_year_id) {
          const res = await academicService.getAcademicYearById(campusId, section.academic_year_id);
          const ay = res?.data?.academic_year || res?.data || {};
          setFormData(prev => ({
            ...prev,
            academicYearData: {
              ...prev.academicYearData,
              year_name: ay.year_name ?? prev.academicYearData.year_name,
              year_type: ay.year_type ?? prev.academicYearData.year_type,
              curriculum_id: (ay.curriculum_id != null ? ay.curriculum_id.toString() : prev.academicYearData.curriculum_id),
              medium: ay.medium ?? prev.academicYearData.medium,
              academic_year_id: section.academic_year_id
            }
          }));
        }

        // Preselect subjects assigned to this section
        const assignRes = await sectionSubjectService.getAssignmentsBySections([section.section_id]);
        const assigns = assignRes?.data?.assignments || assignRes?.assignments || [];
        const ids = assigns.map(a => a.subject_id).filter(Boolean);
        setSelectedSubjects(ids);
      } catch (err) {
        console.error('Failed to prepare edit form context:', err);
      }
    })();
  };

  // Handle delete section
  const handleDeleteSection = (section) => {
    setDeleteConfirm({ show: true, section: section });
  };

  // Confirm delete section
  const confirmDeleteSection = async () => {
    try {
      setDeleting(true);
      const response = await sectionService.deleteSection(deleteConfirm.section.section_id);
      if (response.success) {
        toast.success('Section deleted successfully!');
        fetchSections();
        await refreshAvailableRooms();
        setDeleteConfirm({ show: false, section: null });
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error.message || 'Failed to delete section');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSection = () => {
    resetFormData();
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingSection(null);
    resetFormData();
  };

  const handleRowClick = (section) => {
    console.log('Section clicked:', section);
  };

  // Helper functions to get display names
  const getAcademicYearDisplay = (section) => {
    if (section.year_name) {
      return `${section.year_name} - ${section.curriculum_code || 'Unknown'} - ${section.medium || 'Unknown'}`;
    }
    return 'Unknown Academic Year';
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown';
  };

  const getRoomNumber = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'No Room';
  };

  // Load sections on component mount
  useEffect(() => {
    fetchSections();
    fetchDropdownData();
    fetchFilterOptions();
  }, []);

  // Custom instructions for sections
  const sectionInstructions = (
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
                  <li><strong>Creating Sections:</strong> Academic Year (Year, Curriculum, Medium) and Class are required fields</li>
                  <li><strong>Academic Year Selection:</strong> Choose the academic year, curriculum, and medium. The system will validate this combination.</li>
                  <li><strong>Section Names:</strong> Use descriptive names like A, B, Alpha, Beta, etc.</li>
                  <li><strong>Room Assignment:</strong> Optional - assign a specific room to the section</li>
                  <li><strong>Capacity:</strong> Optional - set maximum number of students for the section</li>
                  <li><strong>Student Monitor:</strong> Can only be selected after choosing a valid academic year combination and class</li>
                  <li><strong>Permissions:</strong> Users with section permissions can create, edit, or delete sections. All users can view sections</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  if (showAddForm || showEditForm) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {showEditForm ? 'Edit Section' : 'Add Section'}
              </h2>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Campus:</strong> {getCampusName()}
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
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
                    disabled={showEditForm}
                  />
                  </div>

                  {/* Section Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="Class" 
                      name="class_id" 
                      type="select"
                      options={classes}
                      required 
                      className="" 
                      formData={formData} 
                      handleInputChange={handleInputChange}
                      disabled={showEditForm}
                    />
                    <InputField 
                      label="Section Name" 
                      name="section_name" 
                      required 
                      className="" 
                      formData={formData} 
                      handleInputChange={handleInputChange}
                      placeholder="e.g., A, B, Alpha, Beta"
                    />
                    <RoomSelectField 
                      label="Room" 
                      name="room_id" 
                      options={rooms}
                      className="" 
                      formData={formData} 
                      handleInputChange={handleInputChange}
                      selectedRoom={selectedRoom}
                    />
                    <InputField 
                      label="Capacity" 
                      name="capacity" 
                      type="number"
                      className="" 
                      formData={formData} 
                      handleInputChange={handleInputChange}
                      placeholder="Maximum number of students"
                    />
                    {!capacityValidation.isValid && (
                      <div className="mt-1 text-xs text-red-600">
                        Error: {capacityValidation.message}
                      </div>
                    )}
                    <AutocompleteInput
                      label="Primary Teacher"
                      name="primary_teacher"
                      placeholder="Type teacher name to search..."
                      value={formData.primary_teacher_user_id}
                      displayValue={formData.primary_teacher_name}
                      onChange={handleAutocompleteChange}
                      searchFunction={searchTeachers}
                      className=""
                    />
                  <AutocompleteInput
                    label="Student Monitor"
                    name="student_monitor"
                    placeholder="Type student name to search..."
                    value={formData.student_monitor_user_id}
                    displayValue={formData.student_monitor_name}
                    onChange={handleAutocompleteChange}
                    searchFunction={searchStudents}
                    className=""
                    disabled={!formData.class_id || !academicYearValidation.isValid}
                  />
                  </div>

                  {academicYearValidation.isValid && formData.class_id && (
                    <div className="mt-6 border rounded-lg bg-gray-50">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-800">Subjects {curriculumCode ? `(Curriculum: ${curriculumCode})` : ''}</h3>
                            {formSubjects.length > 0 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{selectedSubjects.length} selected</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {formSubjects.length > 0 && (
                        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleAllSubjects(true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 w-28 justify-center"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearSubjectsSelection}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 w-28 justify-center"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                      {formSubjects.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No subjects found for selected curriculum.</div>
                      ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {formSubjects.map(subject => (
                            <label key={subject.subject_id} className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition">
                              <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject.subject_id)}
                                onChange={(e) => toggleSubject(subject.subject_id, e.target.checked)}
                                className="h-4 w-4"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{subject.subject_name}</div>
                                {subject.subject_code && (
                                  <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{subject.subject_code}</span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}


                  {(!formData.class_id || !academicYearValidation.isValid) && (
                    <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-700">
                        <strong>Note:</strong> Please select a valid academic year combination and class first to enable student monitor search.
                      </p>
                    </div>
                  )}
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
                      academicYearValidation.isValid && capacityValidation.isValid
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={loading || !academicYearValidation.isValid || !capacityValidation.isValid}
                  >
                    {loading && <LoadingSpinner className="w-4 h-4" />}
                    {showEditForm ? 'Update Section' : 'Add Section'}
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
    <OneAcademicYearPage
      title="Section Management"
      filterOptions={filterOptions}
      filters={filters}
      setFilters={setFilters}
      onFiltersChange={handleFiltersChange}
      showClassFilter={true}
      showSearchFilter={true}
      instructions={sectionInstructions}
      addButtonText="Add Section"
      onAddClick={handleAddSection}
      canAdd={canCreateSection}
    >
      {/* Sections List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sections List</h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="w-6 h-6" />
              <p className="ml-2 text-gray-500">Loading sections...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sections found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? 'No sections match your search criteria.' : 'Get started by creating your first section.'}
              </p>
              {!filters.search && canCreateSection && (
                <div className="mt-6">
                  <button
                    onClick={handleAddSection}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Section
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sections.map((section) => (
                    <tr 
                      key={section.section_id} 
                      className="hover:bg-gray-50 transition-colors duration-150" 
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        handleRowClick(section);
                      }}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {section.section_name}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{getAcademicYearDisplay(section)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{getClassName(section.class_id)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{getRoomNumber(section.room_id)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{section.capacity || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {canEditOrDeleteSection ? (
                            <>
                              <button 
                                onClick={() => handleEditSection(section)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-blue-200 transition ease-in-out duration-150"
                                title="Edit section"
                              >
                                <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteSection(section)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:border-red-300 focus:shadow-outline-red active:bg-red-200 transition ease-in-out duration-150"
                                title="Delete section"
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
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_count} total sections)
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.total_pages, prev.current_page + 1) }))}
                disabled={pagination.current_page === pagination.total_pages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4-4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, section: null })}
        onConfirm={confirmDeleteSection}
        title="Delete Section"
        message={
          <div>
            <p className="mb-2">Are you sure you want to delete section <strong>"{deleteConfirm.section?.section_name}"</strong>?</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> This action cannot be undone. If students are enrolled in this section, deletion may be prevented.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText="Delete Section"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </OneAcademicYearPage>
  );
};

export default SectionManagement;
