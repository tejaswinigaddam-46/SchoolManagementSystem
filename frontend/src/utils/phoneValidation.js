/**
 * Phone number validation utilities
 * Provides comprehensive phone number validation for Indian numbers
 */

/**
 * Validates Indian phone numbers with flexible formatting
 * @param {string} phone - The phone number to validate
 * @param {string} type - Type of validation ('mobile', 'landline', 'general')
 * @returns {Object} Validation result with isValid boolean and message
 */
export const validatePhoneNumber = (phone, type = 'mobile') => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required' }
  }

  // Clean the phone number - remove spaces, hyphens, parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  
  // Regular expressions for different types of Indian numbers
  const patterns = {
    // Indian mobile numbers: starts with 6,7,8,9 and has 10 digits
    mobile: /^(\+91|91)?[6789]\d{9}$/,
    
    // Indian landline numbers: area code + 7-8 digits
    landline: /^(\+91|91)?(0)?[1-9]\d{2,4}\d{6,8}$/,
    
    // General phone validation (mobile + landline + some flexibility)
    general: /^(\+91|91)?[0-9]{10,11}$/,
    
    // Strict mobile with country code
    mobileStrict: /^\+91[6789]\d{9}$/,
    
    // Landline with area codes (Delhi, Mumbai, etc.)
    landlineWithArea: /^(\+91|91)?(011|022|033|040|044|080|020)\d{7,8}$/
  }

  const validators = {
    mobile: () => {
      if (!patterns.mobile.test(cleanPhone)) {
        return {
          isValid: false,
          message: 'Enter a valid Indian mobile number (e.g., +91 9876543210 or 9876543210)'
        }
      }
      return { isValid: true, message: 'Valid mobile number' }
    },

    landline: () => {
      if (!patterns.landline.test(cleanPhone) && !patterns.landlineWithArea.test(cleanPhone)) {
        return {
          isValid: false,
          message: 'Enter a valid Indian landline number (e.g., 011-12345678 or +91-11-12345678)'
        }
      }
      return { isValid: true, message: 'Valid landline number' }
    },

    general: () => {
      // Check if it's a valid mobile number
      if (patterns.mobile.test(cleanPhone)) {
        return { isValid: true, message: 'Valid mobile number' }
      }
      
      // Check if it's a valid landline number
      if (patterns.landline.test(cleanPhone) || patterns.landlineWithArea.test(cleanPhone)) {
        return { isValid: true, message: 'Valid landline number' }
      }
      
      // Fallback to general pattern
      if (patterns.general.test(cleanPhone)) {
        return { isValid: true, message: 'Valid phone number' }
      }
      
      return {
        isValid: false,
        message: 'Enter a valid Indian phone number (mobile: +91 9876543210, landline: 011-12345678)'
      }
    }
  }

  // Execute validation based on type
  const validator = validators[type] || validators.general
  return validator()
}

/**
 * Formats a phone number for display
 * @param {string} phone - The phone number to format
 * @param {string} format - Format type ('display', 'international', 'national')
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, format = 'display') => {
  if (!phone || !phone.trim()) return ''

  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  
  // Add country code if missing
  let normalizedPhone = cleanPhone
  if (!cleanPhone.startsWith('+91') && !cleanPhone.startsWith('91')) {
    if (cleanPhone.length === 10) {
      normalizedPhone = '+91' + cleanPhone
    }
  } else if (cleanPhone.startsWith('91') && !cleanPhone.startsWith('+91')) {
    normalizedPhone = '+' + cleanPhone
  }

  switch (format) {
    case 'international':
      // +91 98765 43210
      if (normalizedPhone.startsWith('+91')) {
        const number = normalizedPhone.substring(3)
        return `+91 ${number.substring(0, 5)} ${number.substring(5)}`
      }
      return normalizedPhone

    case 'national':
      // 98765 43210
      if (normalizedPhone.startsWith('+91')) {
        const number = normalizedPhone.substring(3)
        return `${number.substring(0, 5)} ${number.substring(5)}`
      }
      return normalizedPhone.replace(/^(\+91|91)/, '')

    case 'display':
    default:
      // +91 98765-43210
      if (normalizedPhone.startsWith('+91')) {
        const number = normalizedPhone.substring(3)
        if (number.length === 10) {
          return `+91 ${number.substring(0, 5)}-${number.substring(5)}`
        }
      }
      return normalizedPhone
  }
}

/**
 * Normalizes a phone number to a consistent format for storage
 * @param {string} phone - The phone number to normalize
 * @returns {string} Normalized phone number with country code
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone || !phone.trim()) return ''

  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  
  // Add +91 if missing
  if (cleanPhone.length === 10 && /^[6789]\d{9}$/.test(cleanPhone)) {
    return `+91${cleanPhone}`
  }
  
  if (cleanPhone.startsWith('91') && !cleanPhone.startsWith('+91')) {
    return `+${cleanPhone}`
  }
  
  if (cleanPhone.startsWith('+91')) {
    return cleanPhone
  }
  
  return cleanPhone
}

/**
 * Checks if a phone number is a mobile number
 * @param {string} phone - The phone number to check
 * @returns {boolean} True if it's a mobile number
 */
export const isMobileNumber = (phone) => {
  if (!phone) return false
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  return /^(\+91|91)?[6789]\d{9}$/.test(cleanPhone)
}

/**
 * Checks if a phone number is a landline number
 * @param {string} phone - The phone number to check
 * @returns {boolean} True if it's a landline number
 */
export const isLandlineNumber = (phone) => {
  if (!phone) return false
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  return /^(\+91|91)?(0)?[1-9]\d{2,4}\d{6,8}$/.test(cleanPhone) || 
         /^(\+91|91)?(011|022|033|040|044|080|020)\d{7,8}$/.test(cleanPhone)
}

/**
 * Gets the type of phone number
 * @param {string} phone - The phone number to analyze
 * @returns {string} Phone number type ('mobile', 'landline', 'unknown')
 */
export const getPhoneNumberType = (phone) => {
  if (isMobileNumber(phone)) return 'mobile'
  if (isLandlineNumber(phone)) return 'landline'
  return 'unknown'
}