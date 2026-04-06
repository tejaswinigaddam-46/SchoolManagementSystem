import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Globe, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Image,
  ExternalLink,
  Phone
} from 'lucide-react'
import PhoneInput from '../components/ui/PhoneInput'
import { tenantService } from '../services/tenantService'
import { validatePhoneNumber } from '../utils/phoneValidation'
import { toast } from 'react-hot-toast'

/**
 * Tenant Registration Page Component
 * Allows new schools to register and create their tenant account
 */
export default function TenantRegistration() {
  
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    tenantPhone: '',
    yearFounded: '',
    logoUrl: '',
    websiteUrl: '',
    adminFirstName:  '',
    adminMiddleName : '',
    adminLastName: '',
    adminPhone: '',
    adminDOB: '',
    campusName: '',
    campusAddress: '',
    campusPhone: '',
    campusEmail: '',
    campusYearEstablished: '',
    campusNoOfFloors: '1'
  })
  const [subdomainCheck, setSubdomainCheck] = useState({
    status: null, // null, 'checking', 'available', 'taken', 'invalid'
    message: ''
  })
    const [campusEmailValidation, setCampusEmailValidation] = useState({
    isValid: true,
    message: ''
  })
  const [phoneValidation, setPhoneValidation] = useState({
    adminPhone: { isValid: true, message: '' },
    tenantPhone: { isValid: true, message: '' },
    campusPhone: { isValid: true, message: '' }
  })
  const [urlValidation, setUrlValidation] = useState({
    logoUrl: { isValid: true, message: '' },
    websiteUrl: { isValid: true, message: '' }
  })

  // Mutation for tenant registration
  const registerMutation = useMutation({
    mutationFn: (data) => {
      console.log('🚀 RegisterMutation called with data:', data)
      return tenantService.registerTenant(data)
    },
    onSuccess: (data) => {
      console.log('✅ Registration successful:', data)
      // Redirect to the new tenant's subdomain for login
      const newSubdomain = data.data.subdomain
      
      // Determine if we're in development or production
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      let redirectUrl
      if (isDev) {
        // Development: redirect to subdomain.localhost.com with same port
        const port = window.location.port ? `:${window.location.port}` : ''
        redirectUrl = `http://${newSubdomain}.localhost.com${port}/login?registered=true`
      } else {
        // Production: redirect to subdomain.smartschool.com
        redirectUrl = `https://${newSubdomain}.smartschool.com/login?registered=true`
      }
      
      console.log('🌐 Redirecting to:', redirectUrl)
      window.location.href = redirectUrl
    },
    onError: (error) => {
      console.error('❌ Registration failed:', error)
    }
  })

  // Mutation for checking subdomain availability
  const checkSubdomainMutation = useMutation({
    mutationFn: tenantService.checkSubdomainAvailability,
    onSuccess: (data) => {
      setSubdomainCheck({
        status: data.data.available ? 'available' : 'taken',
        message: data.data.message
      })
    },
    onError: () => {
      setSubdomainCheck({
        status: 'invalid',
        message: 'Unable to check subdomain availability'
      })
    }
  })

  const handleInputChange = (e) => {
    let { name, value } = e.target

    // Enforce year constraints before setting state
    if (name === 'yearFounded' || name === 'campusYearEstablished') {
      const currentYear = new Date().getFullYear()
      const yearNum = parseInt(value)
      
      // Allow empty string for clearing input
      if (value === '') {
        // Allow empty
      } else if (isNaN(yearNum)) {
         return // Don't update state if not a number
      } else if (value.length > 4) {
         return // Don't update if more than 4 digits
      } else if (yearNum > currentYear && value.length === 4) {
         value = currentYear.toString()
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validate phone numbers on change using the utility
    if (name === 'adminPhone') {
      const validation = validatePhoneNumber(value, 'mobile')
      setPhoneValidation(prev => ({
        ...prev,
        adminPhone: validation
      }))
    }

    if (name === 'tenantPhone') {
      const validation = validatePhoneNumber(value, 'general')
      setPhoneValidation(prev => ({
        ...prev,
        tenantPhone: validation
      }))
    }

    if (name === 'campusPhone') {
      const validation = validatePhoneNumber(value, 'general')
      setPhoneValidation(prev => ({
        ...prev,
        campusPhone: validation
      }))
    }

    // Validate URLs on change
    if (name === 'logoUrl') {
      const logoUrlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i
      const validation = {
        isValid: value.trim() === '' || logoUrlRegex.test(value.trim()),
        message: value.trim() === '' ? 'Logo URL is required' : 
                logoUrlRegex.test(value.trim()) ? 'Valid image URL' : 
                'Must be a valid image URL (jpg, jpeg, png, gif, svg, webp)'
      }
      setUrlValidation(prev => ({
        ...prev,
        logoUrl: validation
      }))
    }

    if (name === 'websiteUrl') {
      const websiteUrlRegex = /^https?:\/\/.+\..+/
      const validation = {
        isValid: value.trim() === '' || websiteUrlRegex.test(value.trim()),
        message: value.trim() === '' ? 'Website URL is required' : 
                websiteUrlRegex.test(value.trim()) ? 'Valid website URL' : 
                'Must be a valid URL starting with http:// or https://'
      }
      setUrlValidation(prev => ({
        ...prev,
        websiteUrl: validation
      }))
    }

    // Validate campus email
    if (name === 'campusEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const validation = {
        isValid: value.trim() === '' || emailRegex.test(value.trim()),
        message: value.trim() === '' ? '' : 
                emailRegex.test(value.trim()) ? 'Valid email format' : 
                'Please enter a valid email address'
      }
      setCampusEmailValidation(validation)
    }

    // Validate year founded
    if (name === 'yearFounded') {
      const currentYear = new Date().getFullYear()
      const yearNum = parseInt(value)
      if (value.trim() && (!isNaN(yearNum) && yearNum >= 1800 && yearNum <= currentYear)) {
        // Valid year
      }
    }

    // Validate campus year established
    if (name === 'campusYearEstablished') {
      const currentYear = new Date().getFullYear()
      const yearNum = parseInt(value)
      if (value.trim() && (!isNaN(yearNum) && yearNum >= 1800 && yearNum <= currentYear)) {
        // Valid year
      }
    }

    // Auto-check subdomain availability with proper debouncing
    if (name === 'subdomain' && value.length >= 2) {
      setSubdomainCheck({ status: 'checking', message: 'Checking availability...' })
      
      // Clear any existing timeout
      clearTimeout(window.subdomainTimeout)
      
      // Set new timeout with current value
      window.subdomainTimeout = setTimeout(() => {
        checkSubdomainMutation.mutate(value)
      }, 500)
    }

    // Auto-generate subdomain from tenant name
    if (name === 'tenantName' && !formData.subdomain) {
      const generatedSubdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 20)
      
      setFormData(prev => ({
        ...prev,
        subdomain: generatedSubdomain
      }))
    }
  }

  const preventNonNumericInput = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('=== FORM SUBMISSION DEBUG ===')
    console.log('Form data:', formData)
    
    // Check each required field individually
    const requiredFields = {
      tenantName: formData.tenantName,
      subdomain: formData.subdomain,
      tenantPhone: formData.tenantPhone,
      adminFirstName: formData.adminFirstName,
      adminLastName: formData.adminLastName,
      adminPhone: formData.adminPhone,
      adminDOB: formData.adminDOB,
      yearFounded: formData.yearFounded,
      logoUrl: formData.logoUrl,
      websiteUrl: formData.websiteUrl,
      campusName: formData.campusName,
      campusAddress: formData.campusAddress,
      campusNoOfFloors: formData.campusNoOfFloors
    }
    
    console.log('Required fields check:', requiredFields)
    
    const missingFields = Object.entries(requiredFields).filter(([key, value]) => !value || value.trim() === '')
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields.map(([key]) => key))
      toast.error(`Missing required fields: ${missingFields.map(([key]) => key).join(', ')}`)
      return
    }

    console.log('✅ All required fields present')
    console.log('Subdomain check:', subdomainCheck)
        
    // Validate availability checks
    if (subdomainCheck.status !== 'available') {
      console.log('❌ Subdomain not available:', subdomainCheck.status)
      toast.error(`Subdomain issue: ${subdomainCheck.status} - ${subdomainCheck.message}`)
      return
    }
    
    console.log('✅ Subdomain available')
    console.log('Phone validation:', phoneValidation)

    // Validate phone numbers
    if (!phoneValidation.adminPhone.isValid) {
      console.log('❌ Admin phone invalid:', phoneValidation.adminPhone)
      toast.error(`Admin phone invalid: ${phoneValidation.adminPhone.message}`)
      return
    }
    
    if (!phoneValidation.tenantPhone.isValid) {
      console.log('❌ Tenant phone invalid:', phoneValidation.tenantPhone)
      toast.error(`Tenant phone invalid: ${phoneValidation.tenantPhone.message}`)
      return
    }
    
    if (formData.campusPhone && !phoneValidation.campusPhone.isValid) {
      console.log('❌ Campus phone invalid:', phoneValidation.campusPhone)
      toast.error(`Campus phone invalid: ${phoneValidation.campusPhone.message}`)
      return
    }

    console.log('✅ Phone numbers valid')

    // Validate campus email if provided
    if (formData.campusEmail && !campusEmailValidation.isValid) {
      console.log('❌ Campus email invalid:', campusEmailValidation)
      toast.error(`Campus email invalid: ${campusEmailValidation.message}`)
      return
    }

    console.log('✅ Campus email valid')
    console.log('URL validation:', urlValidation)

    // Validate URLs
    if (!urlValidation.logoUrl.isValid) {
      console.log('❌ Logo URL invalid:', urlValidation.logoUrl)
      toast.error(`Logo URL invalid: ${urlValidation.logoUrl.message}`)
      return
    }
    
    if (!urlValidation.websiteUrl.isValid) {
      console.log('❌ Website URL invalid:', urlValidation.websiteUrl)
      toast.error(`Website URL invalid: ${urlValidation.websiteUrl.message}`)
      return
    }

    console.log('✅ URLs valid')

    // Validate year founded
    const currentYear = new Date().getFullYear()
    const yearNum = parseInt(formData.yearFounded)
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear) {
      console.log('❌ Year founded invalid:', yearNum)
      toast.error(`Year founded must be between 1800 and ${currentYear}`)
      return
    }

    console.log('✅ Year founded valid')

    // Validate campus year established if provided
    if (formData.campusYearEstablished) {
      const campusYearNum = parseInt(formData.campusYearEstablished)
      if (isNaN(campusYearNum) || campusYearNum < 1800 || campusYearNum > currentYear) {
        console.log('❌ Campus year established invalid:', campusYearNum)
        toast.error(`Campus year established must be between 1800 and ${currentYear}`)
        return
      }
    }

    console.log('✅ Campus year valid')

    // Validate number of floors
    const floorsNum = parseInt(formData.campusNoOfFloors)
    if (isNaN(floorsNum) || floorsNum < 1) {
      console.log('❌ Number of floors invalid:', floorsNum)
      toast.error('Number of floors must be at least 1')
      return
    }

    console.log('✅ Number of floors valid')
    console.log('🚀 All validations passed! Calling registerMutation.mutate')
    console.log('Final form data to submit:', formData)
    
    try {
      registerMutation.mutate(formData)
    } catch (error) {
      console.error('❌ Error calling registerMutation.mutate:', error)
      toast.error('Error submitting form: ' + error.message)
    }
  }

  const getSubdomainIcon = () => {
    switch (subdomainCheck.status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-secondary-500" />
      case 'available':
        return <CheckCircle className="h-4 w-4 text-success-500" />
      case 'taken':
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-error-500" />
      default:
        return <Globe className="h-4 w-4 text-secondary-400" />
    }
  }

  const getPhoneIcon = (isValid) => {
    if (isValid) {
      return <CheckCircle className="h-4 w-4 text-success-500" />
    }
    return <Phone className="h-4 w-4 text-secondary-400" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Register Your School
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Join thousands of schools using our management system
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-6xl">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* School Information Section */}
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4 border-b border-secondary-200 pb-2">
                School Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Name */}
                <div>
                  <label htmlFor="tenantName" className="block text-sm font-medium text-secondary-700">
                    School Name *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="tenantName"
                      name="tenantName"
                      type="text"
                      required
                      value={formData.tenantName}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="Greenwood High School"
                    />
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                  </div>
                </div>

                {/* School Phone */}
                <div>
                  <PhoneInput
                    label="School Phone Number"
                    name="tenantPhone"
                    required
                    value={formData.tenantPhone}
                    onChange={handleInputChange}
                    error={formData.tenantPhone && !phoneValidation.tenantPhone.isValid ? phoneValidation.tenantPhone.message : ''}
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <label htmlFor="subdomain" className="block text-sm font-medium text-secondary-700">
                    Subdomain *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="subdomain"
                      name="subdomain"
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={handleInputChange}
                      className={`input-field pl-10 pr-10 ${
                        subdomainCheck.status === 'available' ? 'border-success-300' :
                        subdomainCheck.status === 'taken' || subdomainCheck.status === 'invalid' ? 'border-error-300' :
                        ''
                      }`}
                      placeholder="greenwood"
                      pattern="[a-z0-9-]+"
                      title="Only lowercase letters, numbers, and hyphens allowed"
                    />
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                    <div className="absolute right-3 top-3">
                      {getSubdomainIcon()}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">
                    Your school will be accessible at: <span className="font-mono">{formData.subdomain || 'yourschool'}.smartschool.com</span>
                  </p>
                  {subdomainCheck.message && (
                    <p className={`mt-1 text-xs ${
                      subdomainCheck.status === 'available' ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {subdomainCheck.message}
                    </p>
                  )}
                </div>

                {/* Year Founded */}
                <div>
                  <label htmlFor="yearFounded" className="block text-sm font-medium text-secondary-700">
                    Year Founded *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="yearFounded"
                      name="yearFounded"
                      type="number"
                      required
                      min="1800"
                      max={new Date().getFullYear()}
                      onKeyDown={preventNonNumericInput}
                      value={formData.yearFounded}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="1990"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">
                    Year when the school was founded (1800-{new Date().getFullYear()})
                  </p>
                </div>

                {/* Logo URL */}
                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-secondary-700">
                    Logo URL *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="logoUrl"
                      name="logoUrl"
                      type="url"
                      required
                      value={formData.logoUrl}
                      onChange={handleInputChange}
                      className={`input-field pl-10 pr-10 ${
                        !urlValidation.logoUrl.isValid && formData.logoUrl ? 'border-error-300' :
                        urlValidation.logoUrl.isValid && formData.logoUrl ? 'border-success-300' : ''
                      }`}
                      placeholder="https://example.com/logo.png"
                    />
                    <Image className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                    {formData.logoUrl && (
                      <div className="absolute right-3 top-3">
                        {urlValidation.logoUrl.isValid ? 
                          <CheckCircle className="h-4 w-4 text-success-500" /> :
                          <AlertCircle className="h-4 w-4 text-error-500" />
                        }
                      </div>
                    )}
                  </div>
                  {formData.logoUrl && !urlValidation.logoUrl.isValid && (
                    <p className="mt-1 text-xs text-error-600">
                      {urlValidation.logoUrl.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-secondary-500">
                    Direct URL to your school's logo image (jpg, png, svg, etc.)
                  </p>
                </div>

                {/* Website URL */}
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-secondary-700">
                    Website URL *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="websiteUrl"
                      name="websiteUrl"
                      type="url"
                      required
                      value={formData.websiteUrl}
                      onChange={handleInputChange}
                      className={`input-field pl-10 pr-10 ${
                        !urlValidation.websiteUrl.isValid && formData.websiteUrl ? 'border-error-300' :
                        urlValidation.websiteUrl.isValid && formData.websiteUrl ? 'border-success-300' : ''
                      }`}
                      placeholder="https://example.com"
                    />
                    <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                    {formData.websiteUrl && (
                      <div className="absolute right-3 top-3">
                        {urlValidation.websiteUrl.isValid ? 
                          <CheckCircle className="h-4 w-4 text-success-500" /> :
                          <AlertCircle className="h-4 w-4 text-error-500" />
                        }
                      </div>
                    )}
                  </div>
                  {formData.websiteUrl && !urlValidation.websiteUrl.isValid && (
                    <p className="mt-1 text-xs text-error-600">
                      {urlValidation.websiteUrl.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-secondary-500">
                    Your school's official website URL
                  </p>
                </div>
              </div>
            </div>

            {/* Campus Information Section */}
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4 border-b border-secondary-200 pb-2">
                Campus Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campus Name */}
                <div>
                  <label htmlFor="campusName" className="block text-sm font-medium text-secondary-700">
                    Campus Name *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="campusName"
                      name="campusName"
                      type="text"
                      required
                      value={formData.campusName}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="Main Campus"
                    />
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                  </div>
                </div>

                {/* Campus Phone */}
                <div>
                  <PhoneInput
                    label="Campus Phone Number"
                    name="campusPhone"
                    value={formData.campusPhone}
                    onChange={handleInputChange}
                    error={formData.campusPhone && !phoneValidation.campusPhone.isValid ? phoneValidation.campusPhone.message : ''}
                    helperText="Optional - Campus specific phone number"
                  />
                </div>

                {/* Campus Address */}
                <div className="md:col-span-2">
                  <label htmlFor="campusAddress" className="block text-sm font-medium text-secondary-700">
                    Campus Address *
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="campusAddress"
                      name="campusAddress"
                      rows={3}
                      required
                      value={formData.campusAddress}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter complete campus address with city, state, and postal code"
                    />
                  </div>
                </div>

                {/* Campus Email */}
                <div>
                  <label htmlFor="campusEmail" className="block text-sm font-medium text-secondary-700">
                    Campus Email
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="campusEmail"
                      name="campusEmail"
                      type="email"
                      value={formData.campusEmail}
                      onChange={handleInputChange}
                      className={`input-field pl-10 pr-10 ${
                        formData.campusEmail && !campusEmailValidation.isValid ? 'border-error-300' :
                        formData.campusEmail && campusEmailValidation.isValid ? 'border-success-300' : ''
                      }`}
                      placeholder="campus@greenwood.edu"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                    {formData.campusEmail && (
                      <div className="absolute right-3 top-3">
                        {campusEmailValidation.isValid ? 
                          <CheckCircle className="h-4 w-4 text-success-500" /> :
                          <AlertCircle className="h-4 w-4 text-error-500" />
                        }
                      </div>
                    )}
                  </div>
                  {formData.campusEmail && !campusEmailValidation.isValid && (
                    <p className="mt-1 text-xs text-error-600">
                      {campusEmailValidation.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-secondary-500">Optional - Campus specific email address</p>
                </div>

                {/* Campus Year Established */}
                <div>
                  <label htmlFor="campusYearEstablished" className="block text-sm font-medium text-secondary-700">
                    Campus Year Established
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="campusYearEstablished"
                      name="campusYearEstablished"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      onKeyDown={preventNonNumericInput}
                      value={formData.campusYearEstablished}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="1995"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">
                    Optional - Year when this campus was established (1800-{new Date().getFullYear()})
                  </p>
                </div>

                {/* Number of Floors */}
                <div>
                  <label htmlFor="campusNoOfFloors" className="block text-sm font-medium text-secondary-700">
                    Number of Floors *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="campusNoOfFloors"
                      name="campusNoOfFloors"
                      type="number"
                      required
                      min="1"
                      max="50"
                      value={formData.campusNoOfFloors}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="1"
                    />
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">
                    Number of floors in the campus building (minimum 1)
                  </p>
                </div>
              </div>
            </div>

            {/* Administrator Information Section */}
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4 border-b border-secondary-200 pb-2">
                Administrator Information
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1">
                  <label htmlFor="adminFirstName" className="block text-sm font-medium text-secondary-700">Administrator First Name *</label>
                  <input id="adminFirstName" name="adminFirstName" type="text" required value={formData.adminFirstName} onChange={handleInputChange} className="input-field" placeholder="John" />
                </div>
                <div className="flex-1">
                  <label htmlFor="adminMiddleName" className="block text-sm font-medium text-secondary-700">Administrator Middle Name</label>
                  <input id="adminMiddleName" name="adminMiddleName" type="text" value={formData.adminMiddleName} onChange={handleInputChange} className="input-field" placeholder="A." />
                </div>
                <div className="flex-1">
                  <label htmlFor="adminLastName" className="block text-sm font-medium text-secondary-700">Administrator Last Name *</label>
                  <input id="adminLastName" name="adminLastName" type="text" required value={formData.adminLastName} onChange={handleInputChange} className="input-field" placeholder="Smith" />
                </div>
                <div className="flex-1">
                  <PhoneInput
                    label="Administrator Phone"
                    name="adminPhone"
                    required
                    value={formData.adminPhone}
                    onChange={handleInputChange}
                    error={formData.adminPhone && !phoneValidation.adminPhone.isValid ? phoneValidation.adminPhone.message : ''}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="adminDOB" className="block text-sm font-medium text-secondary-700">Administrator Date of Birth *</label>
                  <input id="adminDOB" name="adminDOB" type="date" required value={formData.adminDOB} onChange={handleInputChange} className="input-field" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {registerMutation.error && (
              <div className="bg-error-50 border border-error-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-error-500 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-error-800">
                      {registerMutation.error.response?.data?.message || 'Registration failed. Please try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  registerMutation.isPending ||
                  subdomainCheck.status !== 'available' ||
                  !phoneValidation.adminPhone.isValid ||
                  !phoneValidation.tenantPhone.isValid ||
                  (formData.campusPhone && !phoneValidation.campusPhone.isValid) ||
                  (formData.campusEmail && !campusEmailValidation.isValid) ||
                  !urlValidation.logoUrl.isValid ||
                  !urlValidation.websiteUrl.isValid ||
                  !formData.tenantName || !formData.subdomain || !formData.tenantPhone ||
                  !formData.adminFirstName || !formData.adminLastName || !formData.adminPhone || !formData.adminDOB ||
                  !formData.yearFounded || !formData.logoUrl || !formData.websiteUrl ||
                  !formData.campusName || !formData.campusAddress || !formData.campusNoOfFloors
                }
                className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Your School...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    Register School
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-secondary-500">Already have a school account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-600">
                Access your school portal at:{' '}
                <span className="font-mono text-primary-600">yourschool.smartschool.com</span>
              </p>
              <Link
                to="/"
                className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-500"
              >
                Back to main site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}