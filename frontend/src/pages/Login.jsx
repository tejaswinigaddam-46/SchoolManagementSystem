import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  Smartphone
} from 'lucide-react'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * Login Page Component
 * Tenant-aware login form that adapts to school branding
 */
export default function Login() {

  console.log('%c[login Page Mount]', 'color: yellow;');
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant, loading: tenantLoading, error: tenantError, isMainDomain } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  
  // Check for registration success message
  const searchParams = new URLSearchParams(location.search)
  const registered = searchParams.get('registered')
  const mobileToken = searchParams.get('mobile_token')
  const from = location.state?.from?.pathname || '/home'

  const { login } = useAuth()

  // Handle mobile login token handover
  useEffect(() => {
    const handleMobileToken = async () => {
      if (mobileToken) {
        try {
          // Temporarily store token so getProfile can use it
          sessionStorage.setItem('accessToken', mobileToken)
          
          const response = await authService.getProfile()
          if (response.success) {
            login(response.data)
            navigate(from, { replace: true })
          } else {
            // Invalid token
            sessionStorage.removeItem('accessToken')
            navigate('/login', { replace: true })
          }
        } catch (error) {
          console.error('Mobile token verification failed:', error)
          sessionStorage.removeItem('accessToken')
          navigate('/login', { replace: true })
        }
      }
    }

    handleMobileToken()
  }, [mobileToken, login, navigate, from])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data.data) // setting useAuth context with user data
      navigate(from, { replace: true }) // redirect to home.
    },
    onError: (error) => {
      console.error('Login failed:', error)
    }
  })

  // Redirect to main site if on main domain 
  // TODO remove login in main domain instead use register page
  useEffect(() => {
    if (!tenantLoading && isMainDomain) {
      navigate('/register', { replace: true })
    }
  }, [tenantLoading, isMainDomain, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      return
    }

    loginMutation.mutate(formData)
  }

  // Show loading while tenant is being loaded
  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Loading school information...</p>
        </div>
      </div>
    )
  }

  // Show error if tenant not found
  if (tenantError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-error-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <AlertCircle className="mx-auto h-12 w-12 text-error-500 mb-4" />
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">School Not Found</h2>
            <p className="text-secondary-600 mb-6">{tenantError}</p>
            <div className="space-y-3">
              <Link
                to="/register"
                className="btn-primary w-full"
              >
                Register New School
              </Link>
              <p className="text-sm text-secondary-500">
                Need help? Contact support at{' '}
                <a href="mailto:support@smartschool.com" className="text-primary-600">
                  support@smartschool.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Registration Success Message */}
      {registered && (
        <div className="mb-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-success-50 border border-success-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-success-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-success-800">
                  School Registration Successful!
                </h3>
                <p className="mt-1 text-sm text-success-700">
                  Welcome to {tenant?.tenant_name}. Please log in with your administrator credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={`${tenant.tenant_name} Logo`}
              className="mx-auto h-12 w-auto"
            />
          ) : (
            <Building2 className="mx-auto h-12 w-12 text-primary-600" />
          )}
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Welcome to {tenant?.tenant_name || 'School Portal'}
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Sign in to access your school management system
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700">
                Username
              </label>
              <div className="mt-1 relative">
                <input 
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  placeholder="st-1234567"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? <Eye className="h-4 w-4" />:<EyeOff className="h-4 w-4" /> }
                </button>
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {loginMutation.error && (
              <div className="bg-error-50 border border-error-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-error-500 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-error-800">
                      {loginMutation.error.response?.data?.message || 'Login failed. Please check your credentials.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending || !formData.username || !formData.password}
                className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* TODO: check if loader2 can be replace by loading spinner  */}
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Mobile Login Link */}
          <div className="mt-4 text-center">
            <Link 
              to="/mobile-login" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              Login with Mobile Number
            </Link>
          </div>
          

          {/* TODO: Add links  */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-secondary-500">Need help?</span>
              </div>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-secondary-600">
                Contact your school administrator for account access
              </p>
              <p className="text-xs text-secondary-500">
                {tenant?.tenant_name} • School Management System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
