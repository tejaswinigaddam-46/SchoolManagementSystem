import axios from 'axios'
import { toast } from 'react-hot-toast'
import config from '../config/env.config'

const aiApiClient = axios.create({
  baseURL: config.aiApiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

const getTenantIdFromAuth = () => {
  try {
    const token = sessionStorage.getItem('accessToken')
    if (!token) return null
    
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (config.isDev) {
      console.log('JWT Payload:', payload)
    }
    return payload.tenantId || payload.tenant_id || null
  } catch (error) {
    console.error('Error extracting tenant ID from token:', error)
    return null
  }
}

aiApiClient.interceptors.request.use(
  (reqConfig) => {
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`
    }

    const tenantId = getTenantIdFromAuth()
    if (tenantId) {
      reqConfig.headers['X-Tenant-ID'] = tenantId
      if (config.isDev) {
        console.log('Adding tenant ID from auth context:', tenantId)
      }
    }

    const hostname = window.location.hostname
    const hostParts = hostname.split('.')
    
    let subdomain = null
    if ( hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
      const urlParams = new URLSearchParams(window.location.search)
      subdomain = urlParams.get('tenantId')
    } else if (hostParts.length >= 3 && !['www', 'api', 'admin'].includes(hostParts[0])) {
      subdomain = hostParts[0]
    }
    
    if (subdomain) {
      reqConfig.headers['X-Tenant-Subdomain'] = subdomain
      reqConfig.headers['X-Subdomain'] = subdomain
    }

    if (config.isDev) {
      console.log('🚀 AI API Request:', {
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

aiApiClient.interceptors.response.use(
  (response) => {
    if (config.isDev) {
      console.log('✅ AI API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      })
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (import.meta.env.DEV) {
      console.error('❌ AI API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      })
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        if (response.data.success) {
          const newToken = response.data.data.access_token
          sessionStorage.setItem('accessToken', newToken)
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return aiApiClient(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }

      sessionStorage.removeItem('accessToken')
      toast.error('Session expired. Please login again.')
      
      const hostname = window.location.hostname
      const isMainDomain = hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.split('.').length < 3
      
      if (!isMainDomain && window.location.pathname !== '/login') {
        window.location.href = '/login'
      } else if (isMainDomain) {
        window.location.href = '/register'
      }
    }

    const suppress = !!originalRequest?.suppressErrorToast

    if (error.response?.status === 403 && !suppress) {
      toast.error('Access denied. You don\'t have permission for this action.')
    }

    if (error.response?.status === 422 && !suppress) {
      const errors = error.response.data?.errors
      if (errors && Array.isArray(errors)) {
        errors.forEach(err => toast.error(err))
      } else {
        toast.error(error.response.data?.message || 'Validation error')
      }
    }

    if (error.response?.status === 429 && !suppress) {
      toast.error('Too many requests. Please try again later.')
    }

    if (error.response?.status >= 500 && !suppress) {
      toast.error('Server error. Please try again later.')
    }

    if (!error.response && !suppress) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

export const aiApi = {
  get: (url, config = {}) => aiApiClient.get(url, config),
  post: (url, data = {}, config = {}) => aiApiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => aiApiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => aiApiClient.patch(url, data, config),
  delete: (url, config = {}) => aiApiClient.delete(url, config),
}

export default aiApiClient
