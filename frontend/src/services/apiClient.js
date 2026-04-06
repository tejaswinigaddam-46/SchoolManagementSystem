import axios from 'axios'
import { toast } from 'react-hot-toast'
import config from '../config/env.config'

// Create axios instance
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // whether or not cross-site Access-Control requests
  // should be made using credentials
})

// Function to get tenant ID from auth context
const getTenantIdFromAuth = () => {
  try {
    const token = sessionStorage.getItem('accessToken')
    if (!token) return null
    
    // Decode JWT to get tenant ID from user payload
    const payload = JSON.parse(atob(token.split('.')[1]))
    // TTMD: log payload to check tenant ID structure and refine code.
    if (config.isDev) {
      console.log('JWT Payload:', payload)
    }
    return payload.tenantId || payload.tenant_id || null // TODO
  } catch (error) {
    console.error('Error extracting tenant ID from token:', error)
    return null
  }
}

// Request interceptor
apiClient.interceptors.request.use(
  (reqConfig) => {
    // Add auth token from sessionStorage
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`
    }

    // Add tenant ID from authenticated user context
    const tenantId = getTenantIdFromAuth()
    if (tenantId) {
      reqConfig.headers['X-Tenant-ID'] = tenantId
      if (config.isDev) {
        console.log('Adding tenant ID from auth context:', tenantId)
      }
    }

    // Keep subdomain headers for backward compatibility (optional)
    const hostname = window.location.hostname
    const hostParts = hostname.split('.')
    
    let subdomain = null
    if ( hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
      // Development environment - use default tenant or query param
      const urlParams = new URLSearchParams(window.location.search)
      subdomain = urlParams.get('tenantId')
    } else if (hostParts.length >= 3 && !['www', 'api', 'admin'].includes(hostParts[0])) {
      // Production - extract subdomain from hostname
      subdomain = hostParts[0]
    }
    
    // Add subdomain headers for backward compatibility (but tenant ID takes precedence)
    if (subdomain) {
      reqConfig.headers['X-Tenant-Subdomain'] = subdomain
      reqConfig.headers['X-Subdomain'] = subdomain
    }

    // Log request in development
    if (config.isDev) {
      console.log('🚀 API Request:', {
        method: reqConfig.method?.toUpperCase(),
        url: reqConfig.url,
        data: reqConfig.data,
        headers: {
          'Authorization': reqConfig.headers.Authorization ? 'Bearer [HIDDEN]' : 'None',
          'Content-Type': reqConfig.headers['Content-Type'],
          'X-Tenant-ID': reqConfig.headers['X-Tenant-ID'],
          'X-Tenant-Subdomain': reqConfig.headers['X-Tenant-Subdomain'],
        }
      })
    }

    return reqConfig
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (config.isDev) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      })
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      })
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token using HTTP-only cookie
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        if (response.data.success) {
          const newToken = response.data.data.access_token
          sessionStorage.setItem('accessToken', newToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }

      // If refresh fails, clear session and redirect to login
      sessionStorage.removeItem('accessToken')
      toast.error('Session expired. Please login again.')
      
      // Only redirect if not already on login page or main domain
      const hostname = window.location.hostname
      const isMainDomain = hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.split('.').length < 3
      
      if (!isMainDomain && window.location.pathname !== '/login') {
        window.location.href = '/login'
      } else if (isMainDomain) {
        window.location.href = '/register'
      }

      // TODO: Redirect incase of PROD
    }

    // Respect suppress flag to avoid global toasts for specific requests
    const suppress = !!originalRequest?.suppressErrorToast

    // Handle 403 Forbidden
    if (error.response?.status === 403 && !suppress) {
      toast.error('Access denied. You don\'t have permission for this action.')
    }

    // Handle 409 Conflict
    if (error.response?.status === 409) {
      const message = error.response.data?.message || 'A conflict occurred. The resource already exists.'
      // Don't show toast here, let the component handle it for better UX
      // toast.error(message)
    }

    // Handle 404 Not Found
    if (error.response?.status === 404 && !suppress) {
      const message = error.response.data?.message || 'Resource not found.'
      if (!message.includes('tenant') && !message.includes('School')) {
        toast.error(message)
      }
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422 && !suppress) {
      const errors = error.response.data?.errors
      if (errors && Array.isArray(errors)) {
        errors.forEach(err => toast.error(err))
      } else {
        toast.error(error.response.data?.message || 'Validation error')
      }
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429 && !suppress) {
      toast.error('Too many requests. Please try again later.')
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500 && !suppress) {
      toast.error('Server error. Please try again later.')
    }

    // Handle network errors
    if (!error.response && !suppress) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

// API helper methods
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
}

export default apiClient
