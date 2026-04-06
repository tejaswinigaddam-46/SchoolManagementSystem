import React, { useState, useEffect } from 'react';

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
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex rounded-md shadow-sm">
        <select
          value={countryCode}
          onChange={handleCodeChange}
          disabled={disabled}
          className={`
            inline-flex items-center px-2 rounded-l-md border border-r-0 border-gray-300 
            bg-gray-50 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'cursor-not-allowed opacity-75' : ''}
            ${error ? 'border-red-300' : ''}
          `}
          style={{ width: 'auto', minWidth: '90px' }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          name={name}
          value={phoneNumber}
          onChange={handleNumberChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            ${error ? 'border-red-500 text-red-900 placeholder-red-300' : ''}
          `}
        />
      </div>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PhoneInput;
