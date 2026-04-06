import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/academicService.js';

const MediumDropdown = ({ 
  campusId, 
  value, 
  onChange, 
  name = "medium",
  label = "Medium",
  required = false,
  disabled = false,
  className = "",
  placeholder = "-- Select Medium --",
  error = null
}) => {
  const [mediumOptions, setMediumOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchMediumOptions = async () => {
      if (!campusId) {
        setMediumOptions([]);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const response = await academicService.getDistinctMedia(campusId);
        if (response.success) {
          setMediumOptions(response.data || []);
        } else {
          setFetchError(response.message || 'Failed to fetch medium options');
        }
      } catch (error) {
        console.error('Error fetching medium options:', error);
        setFetchError('Failed to load medium options');
        setMediumOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMediumOptions();
  }, [campusId]);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    
    onChange({
      target: {
        name,
        value: selectedValue
      }
    });
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
        
        {!loading && mediumOptions.map(option => (
          <option 
            key={option.medium} 
            value={option.medium}
          >
            {option.medium}
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
          Loading medium options...
        </p>
      )}

      {/* No options available */}
      {!loading && !fetchError && mediumOptions.length === 0 && campusId && (
        <p className="mt-1 text-sm text-gray-500">
          No medium options available for this campus.
        </p>
      )}
    </div>
  );
};

export default MediumDropdown;