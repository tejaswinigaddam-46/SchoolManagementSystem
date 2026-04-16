import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/academicService.js';
import YearNameDropdown from './YearNameDropdown.jsx';
import CurriculumDropdown from './CurriculumDropdown.jsx';
import MediumDropdown from './MediumDropdown.jsx';
import { useAuth } from '../../contexts/AuthContext';
import RequiredAsterisk from '../ui/RequiredAsterisk';

const AcademicYearSelector = ({ 
  campusId, 
  value = {}, 
  onChange, 
  name = "academic_year_selector",
  label = "Academic Year Selection",
  required = false,
  disabled = false,
  className = "",
  gridClassName = "grid-cols-1 md:grid-cols-4",
  showValidationMessage = true,
  onValidationChange = null,
  error = null
}) => {
  const { getDefaultAcademicYearId, setDefaultAcademicYearId, defaultAcademicYearId } = useAuth();
  const [formData, setFormData] = useState({
    year_name: value?.year_name || '',
    year_type: value?.year_type || '',
    curriculum_id: value?.curriculum_id || '',
    curriculum_name: value?.curriculum_name || '',
    curriculum_code: value?.curriculum_code || '',
    medium: value?.medium || '',
    academic_year_id: value?.academic_year_id || null
  });

  const [validationState, setValidationState] = useState({
    isChecking: false,
    isValid: null,
    message: '',
    academicYearId: null
  });

  const [errors, setErrors] = useState({});

  // Year type options
  const yearTypeOptions = [
    { value: 'Current year', label: 'Current year' },
    { value: 'Previous year', label: 'Previous year' },
    { value: 'Next year', label: 'Next year' }
  ];

  // Update formData when value prop changes (for edit mode)
  useEffect(() => {
    if (value && typeof value === 'object') {
      // Check if this is just an ID update or a full data update
      // If the ID matches what we already have, and the incoming value is missing details (e.g. just ID passed),
      // we should NOT overwrite our fully populated data with empty strings.
      if (value.academic_year_id === formData.academic_year_id) {
         const incomingHasData = value.year_name || value.year_type || value.curriculum_id || value.medium;
         const currentHasData = formData.year_name || formData.year_type || formData.curriculum_id || formData.medium;
         
         // If we have data, but incoming doesn't (and IDs match), ignore the update
         if (currentHasData && !incomingHasData) {
             return;
         }
      }

      const newFormData = {
        year_name: value.year_name || '',
        year_type: value.year_type || '',
        curriculum_id: value.curriculum_id || '',
        medium: value.medium || '',
        academic_year_id: value.academic_year_id || null
      };
      
      // Only update if the data is actually different
      const hasChanged = 
        newFormData.year_name !== formData.year_name ||
        newFormData.year_type !== formData.year_type ||
        newFormData.curriculum_id !== formData.curriculum_id ||
        newFormData.medium !== formData.medium ||
        newFormData.academic_year_id !== formData.academic_year_id;
      
      if (hasChanged) {
        console.log('🔄 AcademicYearSelector: Updating formData from value prop:', newFormData);
        setFormData(newFormData);
        
        // If we have a valid academic_year_id, set validation as valid
        if (newFormData.academic_year_id) {
          setValidationState({
            isChecking: false,
            isValid: true,
            message: 'Valid combination found',
            academicYearId: newFormData.academic_year_id
          });
        }
      }
    }
  }, [value]); // Only depend on value, not formData to avoid infinite loops

  // Auto-populate details if ID is present but details are missing (e.g. when passed as prop)
  useEffect(() => {
    const populateDetails = async () => {
      if (formData.academic_year_id && !formData.year_name && campusId) {
        try {
          const res = await academicService.getAcademicYearById(campusId, formData.academic_year_id);
          const ay = res?.data || res;
          if (ay) {
             const updatedData = {
               year_name: ay.year_name || '',
               year_type: ay.year_type || '',
               curriculum_id: ay.curriculum_id || '',
               curriculum_name: ay.curriculum_name || '',
               curriculum_code: ay.curriculum_code || '',
               medium: ay.medium || '',
               academic_year_id: ay.academic_year_id
             };
             console.log('🔄 AcademicYearSelector: Populated details for ID:', ay.academic_year_id);
             setFormData(updatedData);
             
             // Validate this combination
             setValidationState({
               isChecking: false,
               isValid: true,
               message: 'Valid combination found',
               academicYearId: ay.academic_year_id
             });
          }
        } catch (err) {
          console.error('Error populating academic year details:', err);
        }
      }
    };
    populateDetails();
  }, [formData.academic_year_id, formData.year_name, campusId]);

  // Auto-populate from default academic year ID if available and no selection yet
  useEffect(() => {
    const initFromDefault = async () => {
      try {
        const defId = defaultAcademicYearId || getDefaultAcademicYearId();
        if (!campusId || !defId) return;
        
        // If we already have this ID selected (and populated), skip
        if (formData.academic_year_id === defId && formData.year_name) return;
        
        // If we have a DIFFERENT ID selected, don't overwrite with default
        if (formData.academic_year_id && formData.academic_year_id !== defId) return;

        const res = await academicService.getAcademicYearById(campusId, defId);
        const ay = res?.data || res;
        if (!ay) return;
        const updatedData = {
          year_name: ay.year_name || '',
          year_type: ay.year_type || '',
          curriculum_id: ay.curriculum_id || '',
          curriculum_name: ay.curriculum_name || '',
          curriculum_code: ay.curriculum_code || '',
          medium: ay.medium || '',
          academic_year_id: ay.academic_year_id || defId
        };
        setFormData(updatedData);
        setValidationState({ isChecking: false, isValid: true, message: 'Valid combination found', academicYearId: updatedData.academic_year_id });
        if (onChange) {
          onChange({ target: { name, value: updatedData } }, { isValid: true, academicYearId: updatedData.academic_year_id });
        }
        if (onValidationChange) {
          onValidationChange({ isValid: true, academicYearId: updatedData.academic_year_id, message: 'Valid combination found' });
        }
      } catch (_) {}
    };
    initFromDefault();
  }, [campusId, defaultAcademicYearId]);

  // Check combination validity when all fields are filled
  useEffect(() => {
    const checkCombination = async () => {
      const { year_name, year_type, curriculum_id, medium } = formData;
      
      // Reset validation state if any field is empty
      if (!year_name || !year_type || !curriculum_id || !medium || !campusId) {
        setValidationState({
          isChecking: false,
          isValid: null,
          message: '',
          academicYearId: null
        });
        return;
      }

      setValidationState(prev => ({ ...prev, isChecking: true }));

      try {
        const response = await academicService.getAcademicYearIdByCombo(
          campusId, 
          year_name, 
          year_type,
          curriculum_id, 
          medium
        );

        if (response.success) {
          const academicYearId = response.data.academic_year_id;
          
          setValidationState({
            isChecking: false,
            isValid: true,
            message: 'Valid combination found',
            academicYearId
          });

          // Update form data with academic year ID and details from response
          const updatedData = {
            ...formData,
            academic_year_id: academicYearId,
            curriculum_name: response.data.curriculum_name || formData.curriculum_name,
            curriculum_code: response.data.curriculum_code || formData.curriculum_code
          };
          
          setFormData(updatedData);
          
          // Notify parent component
          if (onChange) {
            onChange({
              target: {
                name,
                value: updatedData
              }
            }, { isValid: true, academicYearId });
          }

          if (onValidationChange) {
            onValidationChange({ isValid: true, academicYearId, message: 'Valid combination found' });
          }

        } else {
          setValidationState({
            isChecking: false,
            isValid: false,
            message: response.message || 'No academic year found for this combination. Please add the curriculum and academic year first to use them.',
            academicYearId: null
          });

          // Update form data without academic year ID
          const updatedData = {
            ...formData,
            academic_year_id: null
          };
          
          setFormData(updatedData);

          if (onChange) {
            onChange({
              target: {
                name,
                value: updatedData
              }
            }, { isValid: false, academicYearId: null });
          }

          if (onValidationChange) {
            onValidationChange({ 
              isValid: false, 
              academicYearId: null, 
              message: response.message || 'No academic year found for this combination. Please add the curriculum and academic year first to use them.' 
            });
          }
        }
      } catch (error) {
        console.error('Error checking combination:', error);
        
        // Check if this is a 404 error (combination not found)
        let errorMessage = 'Error validating combination. Please try again.';
        
        if (error.response && error.response.status === 404) {
          errorMessage = error.response.data?.message || 'No academic year found for this combination. Please add the curriculum and academic year first to use them.';
        } else if (error.message && error.message.includes('combination')) {
          errorMessage = 'No academic year found for this combination. Please add the curriculum and academic year first to use them.';
        }
        
        setValidationState({
          isChecking: false,
          isValid: false,
          message: errorMessage,
          academicYearId: null
        });

        const updatedData = {
          ...formData,
          academic_year_id: null
        };
        
        setFormData(updatedData);

        if (onChange) {
          onChange({
            target: {
              name,
              value: updatedData
            }
          }, { isValid: false, academicYearId: null });
        }

        if (onValidationChange) {
          onValidationChange({ 
            isValid: false, 
            academicYearId: null, 
            message: errorMessage
          });
        }
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(checkCombination, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.year_name, formData.year_type, formData.curriculum_id, formData.medium, campusId]);

  const handleFieldChange = (fieldName) => (event, additionalData = null) => {
    const newValue = event.target.value;
    
    let updatedData = {
      ...formData,
      [fieldName]: newValue,
      // Reset academic year ID when any field changes
      academic_year_id: null
    };

    // If we changed curriculum, capture the name and code too
    if (fieldName === 'curriculum_id' && additionalData) {
      updatedData = {
        ...updatedData,
        curriculum_name: additionalData.curriculum_name || '',
        curriculum_code: additionalData.curriculum_code || ''
      };
    }

    setFormData(updatedData);

    // Clear validation state when fields change
    setValidationState({
      isChecking: false,
      isValid: null,
      message: '',
      academicYearId: null
    });

    // Clear field-specific errors
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }

    // Immediate callback to parent
    if (onChange) {
      onChange({
        target: {
          name,
          value: updatedData
        }
      }, { fieldName, additionalData, isValid: null });
    }
  };

  // Validate required fields
  const validateFields = () => {
    const newErrors = {};
    
    if (required) {
      if (!formData.year_name) {
        newErrors.year_name = ' Selector Academic year is required';
      }
      if (!formData.year_type) {
        newErrors.year_type = 'Year type is required';
      }
      if (!formData.curriculum_id) {
        newErrors.curriculum_id = 'Curriculum is required';
      }
      if (!formData.medium) {
        newErrors.medium = 'Medium is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Public method to validate (can be called by parent)
  const validate = () => {
    const isFieldsValid = validateFields();
    const isCombinationValid = validationState.isValid === true;
    
    return {
      isValid: isFieldsValid && isCombinationValid,
      errors,
      validationState,
      data: formData
    };
  };

  // Expose validate method to parent
  useEffect(() => {
    if (onChange && typeof onChange === 'function') {
      // Add validate method to the component
      onChange.validate = validate;
    }
  }, [errors, validationState, formData]);

  return (
    <div className={`academic-year-selector ${className}`}>
      {label && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {label}
            {required && <RequiredAsterisk />}
          </h3>
        </div>
      )}

      <div className={`grid gap-4 ${gridClassName}`}>
        {/* Year Name Dropdown */}
        <YearNameDropdown
          campusId={campusId}
          value={formData.year_name}
          onChange={handleFieldChange('year_name')}
          name="year_name"
          label="Academic Year"
          required={required}
          disabled={disabled}
          error={errors.year_name}
          className="mb-0"
        />

        {/* Year Type Dropdown */}
        <div className="mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Type
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            name="year_type"
            value={formData.year_type}
            onChange={handleFieldChange('year_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={required}
            disabled={disabled}
          >
            <option value="">Select Year Type</option>
            {yearTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.year_type && (
            <p className="mt-1 text-sm text-red-600">{errors.year_type}</p>
          )}
        </div>

        {/* Curriculum Dropdown */}
        <CurriculumDropdown
          campusId={campusId}
          value={formData.curriculum_id}
          onChange={handleFieldChange('curriculum_id')}
          name="curriculum_id"
          label="Curriculum"
          required={required}
          disabled={disabled}
          error={errors.curriculum_id}
          className="mb-0"
        />

        {/* Medium Dropdown */}
        <MediumDropdown
          campusId={campusId}
          value={formData.medium}
          onChange={handleFieldChange('medium')}
          name="medium"
          label="Medium"
          required={required}
          disabled={disabled}
          error={errors.medium}
          className="mb-0"
        />
      </div>

      {/* Validation Status */}
      {showValidationMessage && (
        <div className="mt-4">
          {validationState.isChecking && (
            <div className="flex items-center text-blue-600">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Validating combination...</span>
            </div>
          )}

          {validationState.isValid === true && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{validationState.message}</span>
                {validationState.academicYearId && (
                  <span className="ml-2 text-xs text-gray-500">
                    (ID: {validationState.academicYearId})
                  </span>
                )}
              </div>
              {validationState.academicYearId && (
                <div className="flex items-center gap-2">
                  {String(getDefaultAcademicYearId() || '') === String(validationState.academicYearId) ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Default selected</span>
                  ) : (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50"
                      onClick={() => setDefaultAcademicYearId(validationState.academicYearId)}
                    >
                      Choose this as default
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {validationState.isValid === false && (
            <div className="flex items-start text-red-600">
              <svg className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{validationState.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Global Error */}
      {error && (
        <div className="mt-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Hidden input for form submission */}
      {formData.academic_year_id && (
        <input
          type="hidden"
          name={`${name}_academic_year_id`}
          value={formData.academic_year_id}
        />
      )}
    </div>
  );
};

export default AcademicYearSelector;
