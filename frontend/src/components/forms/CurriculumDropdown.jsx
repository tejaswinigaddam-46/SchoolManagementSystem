import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/academicService.js';

const CurriculumDropdown = ({ 
  campusId, 
  value, 
  onChange, 
  name = "curriculum_id",
  label = "Curriculum",
  required = false,
  disabled = false,
  className = "",
  placeholder = "-- Select Curriculum --",
  error = null
}) => {
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchCurriculumOptions = async () => {
      if (!campusId) {
        setCurriculumOptions([]);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const response = await academicService.getAllCurricula(campusId);
        if (response.success) {
          setCurriculumOptions(response.data || []);
        } else {
          setFetchError(response.message || 'Failed to fetch curriculum options');
        }
      } catch (error) {
        console.error('Error fetching curriculum options:', error);
        setFetchError('Failed to load curriculum options');
        setCurriculumOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculumOptions();
  }, [campusId]);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    
    // Find the selected option to pass additional data if needed
    const selectedOption = curriculumOptions.find(
      option => option.curriculum_id.toString() === selectedValue
    );

    onChange({
      target: {
        name,
        value: selectedValue
      }
    }, selectedOption);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || loading}
        required={required}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
      >
        <option value="">{loading ? 'Loading...' : placeholder}</option>
        
        {!loading && curriculumOptions.map(option => (
          <option 
            key={option.curriculum_id} 
            value={option.curriculum_id}
          >
            {option.curriculum_code} - {option.curriculum_name}
          </option>
        ))}
      </select>

      {/* Error display */}
      {(error || fetchError) && (
        <p className="mt-1 text-sm text-red-600">
          {error || fetchError}
        </p>
      )}

      {/* Loading indicator */}
      {loading && (
        <p className="mt-1 text-sm text-gray-500">
          Loading curriculum options...
        </p>
      )}

      {/* No options available */}
      {!loading && !fetchError && curriculumOptions.length === 0 && campusId && (
        <p className="mt-1 text-sm text-gray-500">
          No curriculum options available for this campus.
        </p>
      )}
    </div>
  );
};

export default CurriculumDropdown;