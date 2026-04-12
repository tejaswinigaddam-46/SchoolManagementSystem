import React, { useState, useEffect } from 'react';
import RequiredAsterisk from './RequiredAsterisk';

/**
 * Validates a phone number
 * @param {string} value - The phone number to validate
 * @param {boolean} required - Whether the field is required
 * @returns {string|null} Error message or null if valid
 */
export const validatePhone = (value, required = false) => {
  if (required && (!value || !value.trim())) {
    return 'Phone number is required';
  }
  
  if (value && !/^[\+]?[0-9\s\-\(\)]{10,20}$/.test(value)) {
    return 'Invalid phone number format';
  }
  
  return null;
};

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)', flag: '🇮🇳' },
  { code: '+1', country: 'US', label: 'USA / Canada (+1)', flag: '🇺🇸' },
  { code: '+44', country: 'UK', label: 'UK (+44)', flag: '🇬🇧' },
  { code: '+61', country: 'AU', label: 'Australia (+61)', flag: '🇦🇺' },
  { code: '+86', country: 'CN', label: 'China (+86)', flag: '🇨🇳' },
];

const PhoneInput = ({
  value = '',
  onChange,
  label,
  name,
  error,
  required = false,
  disabled = false,
  placeholder = 'Enter phone number',
  helperText,
  className = ''
}) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (value) {
      // Find if the value starts with any of our known codes
      const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setPhoneNumber(value.slice(matchedCode.code.length));
      } else {
        // If no code matches, keep default code and set value as number
        setPhoneNumber(value.replace(/^\+/, '')); // strip leading + if any unknown code
      }
    } else {
      setPhoneNumber('');
      setCountryCode('+91'); // Default
    }
  }, [value]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    triggerChange(newCode, phoneNumber);
  };

  const handleNumberChange = (e) => {
    const newNumber = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPhoneNumber(newNumber);
    triggerChange(countryCode, newNumber);
  };

  const triggerChange = (code, number) => {
    if (onChange) {
      if (!number) {
        onChange({ target: { name, value: '' } });
      } else {
        onChange({ target: { name, value: `${code}${number}` } });
      }
    }
  };

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <RequiredAsterisk />}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={handleCodeChange}
          disabled={disabled}
          className={`
            block rounded-md border border-gray-300 bg-gray-50 py-2 pl-2 pr-1 text-gray-900 text-sm 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-100'}
            ${error ? 'border-red-500 ring-red-500' : ''}
          `}
          style={{ width: 'auto', minWidth: '64px' }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <div className="w-40">
          <input
            type="tel"
            name={name}
            value={phoneNumber}
            onChange={handleNumberChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 text-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
              ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}
              ${error ? 'border-red-500 text-red-900 placeholder-red-300 ring-1 ring-red-500' : ''}
            `}
          />
        </div>
      </div>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PhoneInput;
