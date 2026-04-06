import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/academicService.js';

const YearNameDropdown = ({ 
  campusId, 
  value, 
  onChange, 
  name = "year_name",
  label = "Academic Year",
  required = false,
  disabled = false,
  className = "",
  placeholder = "-- Select Year --",
  error = null
}) => {
  const [yearOptions, setYearOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchYearOptions = async () => {
      if (!campusId) {
        setYearOptions([]);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const response = await academicService.getDistinctYearNames(campusId);
        if (response.success) {
          setYearOptions(response.data || []);
        } else {
          setFetchError(response.message || 'Failed to fetch year options');
        }
      } catch (error) {
        console.error('Error fetching year options:', error);
        setFetchError('Failed to load year options');
        setYearOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchYearOptions();
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
        
        {!loading && yearOptions.map(option => (
          <option 
            key={option.year_name} 
            value={option.year_name}
          >
            {option.year_name}
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
          Loading year options...
        </p>
      )}

      {/* No options available */}
      {!loading && !fetchError && yearOptions.length === 0 && campusId && (
        <p className="mt-1 text-sm text-gray-500">
          No year options available for this campus.
        </p>
      )}
    </div>
  );
};

export default YearNameDropdown;