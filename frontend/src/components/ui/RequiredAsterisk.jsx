import React from 'react';

/**
 * Common UI component for marking required fields
 * Displays a red asterisk (*) with proper styling and accessibility
 */
const RequiredAsterisk = ({ className = "" }) => {
  return (
    <span 
      className={`text-error-600 ml-0.5 font-bold ${className}`} 
      aria-hidden="true"
      title="Required field"
    >
      *
    </span>
  );
};

export default RequiredAsterisk;
