import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { 
  Phone, 
  Building2, 
  User, 
  Lock, 
  ArrowRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import PhoneInput from '../components/ui/PhoneInput'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

export default function MobileLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const [step, setStep] = useState(1)
  const [mobileNumber, setMobileNumber] = useState('')
  const [tenantsData, setTenantsData] = useState([])
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const from = location.state?.from?.pathname || '/home'

  // Check for saved mobile context on mount
  useEffect(() => {
    const storedContext = localStorage.getItem('mobile_auth_context')
    if (storedContext) {
      try {
        const { mobileNumber: savedMobile, tenant, user } = JSON.parse(storedContext)
        if (savedMobile && tenant && user) {
          setMobileNumber(savedMobile)
          setSelectedTenant(tenant)
          setSelectedUser(user)
          setStep(4)
        }
      } catch (e) {
        console.error('Failed to parse mobile auth context', e)
        localStorage.removeItem('mobile_auth_context')
      }
    }
  }, [])

  // Step 1: Resolve Tenant Mutation
  const resolveTenantMutation = useMutation({
    mutationFn: authService.resolveTenant,
    onSuccess: (data) => {
      if (data.data && data.data.length > 0) {
        // Group users by tenant
        const grouped = data.data.reduce((acc, item) => {
          const tenantId = item.tenant_id
          if (!acc[tenantId]) {
            acc[tenantId] = {
              tenant_id: item.tenant_id,
              tenant_name: item.tenant_name,
              subdomain: item.subdomain,
              users: []
            }
          }
          acc[tenantId].users.push({
            user_id: item.user_id,
            username: item.username,
            first_name: item.first_name,
            last_name: item.last_name,
            role: item.role
          })
          return acc
        }, {})
        
        setTenantsData(Object.values(grouped))
        setStep(2)
        setError('')
      } else {
        setError('No schools found for this mobile number.')
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to resolve mobile number')
    }
  })

  // Step 4: Login Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.mobileLogin(credentials, selectedTenant.subdomain),
    onSuccess: (data) => {
      // Save context to localStorage for persistent mobile session
      localStorage.setItem('mobile_auth_context', JSON.stringify({
        mobileNumber,
        tenant: selectedTenant,
        user: selectedUser
      }))

      // Check if running in Capacitor
      const isCapacitor = window.Capacitor?.isNativePlatform()
      
      if (isCapacitor) {
        // In Capacitor, we don't redirect to subdomains.
        // The API client handles tenancy via headers (X-Tenant-ID).
        login(data.data)
        navigate(from, { replace: true })
        return
      }
      
      // Handle redirection to tenant subdomain
      const subdomain = selectedTenant.subdomain
      const accessToken = data.data.access_token
      
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const port = window.location.port ? `:${window.location.port}` : ''
      
      let targetHostname
      let protocol = window.location.protocol
      
      if (isLocalhost) {
        targetHostname = `${subdomain}.localhost.com`
      } else {
        // Assuming production follows subdomain.domain.com pattern
        // If we are already on a subdomain, we might need to be careful
        // But mobile login usually happens on main domain
        const parts = window.location.hostname.split('.')
        if (parts.length > 2) {
            // We are already on a subdomain, replace it
            parts[0] = subdomain
            targetHostname = parts.join('.')
        } else {
            targetHostname = `${subdomain}.smartschool.com`
        }
      }

      // If we are not on the target subdomain, redirect
      if (window.location.hostname !== targetHostname) {
        const redirectUrl = `${protocol}//${targetHostname}${port}/login?mobile_token=${accessToken}`
        window.location.href = redirectUrl
        return
      }

      // If we are already on the correct subdomain, just login
      login(data.data)
      navigate(from, { replace: true })
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Login failed')
    }
  })

  const handleSwitchAccount = () => {
    if (window.confirm('Are you sure you want to switch accounts? This will clear your saved login details.')) {
      localStorage.removeItem('mobile_auth_context')
      setStep(1)
      setMobileNumber('')
      setSelectedTenant(null)
      setSelectedUser(null)
      setPassword('')
      setError('')
    }
  }

  const handleMobileSubmit = (e) => {
    e.preventDefault()
    if (!mobileNumber) return
    resolveTenantMutation.mutate(mobileNumber)
  }

  const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant)
    setStep(3)
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setStep(4)
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    if (!password) return
    loginMutation.mutate({
      username: selectedUser.username,
      password: password
    })
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    } else {
        navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 px-8 py-6 text-white relative">
          <button 
            onClick={handleBack}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-primary-700 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-center">Mobile Login</h1>
          <p className="text-primary-100 text-center text-sm mt-1">
            {step === 1 && 'Enter your mobile number'}
            {step === 2 && 'Select your school'}
            {step === 3 && 'Select your account'}
            {step === 4 && 'Enter password'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3 text-error-700">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Mobile Number Input */}
          {step === 1 && (
            <form onSubmit={handleMobileSubmit} className="space-y-6">
              <div>
                <PhoneInput
                  label="Mobile Number"
                  name="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resolveTenantMutation.isPending}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all flex items-center justify-center gap-2"
              >
                {resolveTenantMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Find Accounts <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Select Tenant */}
          {step === 2 && (
            <div className="space-y-4">
              {tenantsData.map((tenant) => (
                <button
                  key={tenant.tenant_id}
                  onClick={() => handleTenantSelect(tenant)}
                  className="w-full p-4 border border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center gap-4 group text-left"
                >
                  <div className="bg-primary-100 p-3 rounded-full text-primary-600 group-hover:bg-primary-200 transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{tenant.tenant_name}</h3>
                    <p className="text-sm text-secondary-500">{tenant.users.length} account(s) found</p>
                  </div>
                  <div className="ml-auto text-secondary-300 group-hover:text-primary-500">
                    <ArrowRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Select User */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-secondary-50 rounded-lg flex items-center gap-2 text-sm text-secondary-600">
                <Building2 size={16} />
                <span className="font-medium">{selectedTenant.tenant_name}</span>
              </div>
              
              {selectedTenant.users.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full p-4 border border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center gap-4 group text-left"
                >
                  <div className="bg-primary-100 p-3 rounded-full text-primary-600 group-hover:bg-primary-200 transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{user.first_name} {user.last_name}</h3>
                    <p className="text-sm text-secondary-500">
                      <span className="font-medium text-secondary-700">{user.role}</span> • {user.username}
                    </p>
                  </div>
                  <div className="ml-auto text-secondary-300 group-hover:text-primary-500">
                    <ArrowRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Password */}
          {step === 4 && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="p-4 bg-primary-50 rounded-lg space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-secondary-700">
                  <Building2 size={16} className="text-primary-600" />
                  <span>{selectedTenant.tenant_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-700">
                  <User size={16} className="text-primary-600" />
                  <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                  <span className="text-secondary-400">({selectedUser.username})</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  'Login'
                )}
              </button>

              <button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full bg-white text-secondary-600 py-3 rounded-lg font-semibold border border-secondary-200 hover:bg-secondary-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Switch Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
