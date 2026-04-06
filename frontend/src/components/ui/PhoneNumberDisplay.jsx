import React from 'react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)', flag: '🇮🇳' },
  { code: '+1', country: 'US', label: 'USA / Canada (+1)', flag: '🇺🇸' },
  { code: '+44', country: 'UK', label: 'UK (+44)', flag: '🇬🇧' },
  { code: '+61', country: 'AU', label: 'Australia (+61)', flag: '🇦🇺' },
  { code: '+86', country: 'CN', label: 'China (+86)', flag: '🇨🇳' },
];

/**
 * Component to display phone numbers with country code separated from the number.
 * 
 * @param {Object} props
 * @param {string} props.value - The full phone number string (e.g., "+919876543210")
 * @param {string} props.className - Additional classes for the container
 * @param {boolean} props.showFlag - Whether to show the country flag (default: true)
 */
const PhoneNumberDisplay = ({ value, className = '', showFlag = true }) => {
  if (!value) return <span className="text-gray-400">-</span>;

  // Find the country code that matches the start of the value
  const matchedCountry = COUNTRY_CODES.find(c => value.startsWith(c.code));
  
  let code = '';
  let number = value;
  let flag = '📞'; // Default icon

  if (matchedCountry) {
    code = matchedCountry.code;
    number = value.slice(code.length);
    if (showFlag) {
      flag = matchedCountry.flag;
    }
  } else if (value.startsWith('+')) {
    // If it starts with + but not in our list, try to guess or just split blindly?
    // Let's just keep it as is if we can't parse it, or treat the first few chars as code if needed.
    // For now, if no match, just show the whole thing, or assume it's just a number without code if no +?
    // If it has +, we display it as is.
    return <span className={`text-gray-700 ${className}`}>{value}</span>;
  }

  return (
    <div className={`flex items-center ${className}`}>
      {code && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2 border border-gray-200">
          {showFlag && <span className="mr-1">{flag}</span>}
          {code}
        </span>
      )}
      <span className="font-mono text-gray-700">{number}</span>
    </div>
  );
};

export default PhoneNumberDisplay;
