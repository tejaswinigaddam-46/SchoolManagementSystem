import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { authService } from '../services/authService'
import { studentService } from '../services/studentService'
import { PERMISSIONS } from '../config/permissions'

// Initial state
const initialState = {
  userId: null,
  username: null,
  firstName: null,
  middleName: null,
  lastName: null,
  phoneNumber: null,
  tenantId: null,
  tenantName: null,
  role: null,
  campusId: null,
  campusName: null,
  isAuthenticated: false,
  subdomain: null,
  isMainCampus: false,
  loading: true,
  error: null,
  defaultAcademicYearId: null,
  defaultClassId: null,
  permissions: []
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_DEFAULT_AY: 'SET_DEFAULT_AY',
  SET_DEFAULT_CLASS: 'SET_DEFAULT_CLASS'
}

// Reducer
// TODO: review action payload
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      console.log('%c[LOGIN_SUCCESS Payload]', 'color: green;', action.payload); // Log payload in green
      return {
        ...state,
        userId: action.payload.user?.user_id || null, // Map user_id to userId
        username: action.payload.user?.username || null, // Map username
        firstName: action.payload.user?.first_name || null, // Map first_name
        middleName: action.payload.user?.middle_name || null, // Map middle_name
        lastName: action.payload.user?.last_name || null, // Map last_name
        phoneNumber: action.payload.user?.phone_number || null, // Map phone_number
        tenantId: action.payload.tenant?.tenant_id || null, // Map tenant_id
        tenantName: action.payload.tenant?.tenant_name || null, // Map tenant_name
        subdomain: action.payload.tenant?.subdomain || null, // Map subdomain
        role: action.payload.role?.role || action.payload.role || null, // Extract role.role or fallback to role
        campusId: action.payload.campus?.campus_id || null, // Map campus_id
        campusName: action.payload.campus?.campus_name || null, // Map campus_name
        isMainCampus: action.payload.campus?.is_main_campus || false, // Map is_main_campus
        permissions: Array.isArray(action.payload.permissions) ? action.payload.permissions : [],
        isAuthenticated: true,
        loading: false,
        error: null
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      }
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        ...action.payload // Update flat state properties directly
      }
    case AUTH_ACTIONS.SET_DEFAULT_AY:
      return {
        ...state,
        defaultAcademicYearId: action.payload || null
      }
    case AUTH_ACTIONS.SET_DEFAULT_CLASS:
      return {
        ...state,
        defaultClassId: action.payload || null
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

    // Login function - memoized
  const login = useCallback((authData) => {
    console.log('🔐 Login function called with auth data')
    
    let payloadForState = authData

    if (authData.access_token) {
      sessionStorage.setItem('accessToken', authData.access_token)
      console.log('🔐 Access token stored in sessionStorage')

      try {
        const tokenPayload = JSON.parse(atob(authData.access_token.split('.')[1] || ''))
        if (tokenPayload && typeof tokenPayload === 'object') {
          payloadForState = {
            ...authData,
            user: tokenPayload.user || authData.user,
            tenant: tokenPayload.tenant || authData.tenant,
            role: tokenPayload.role || authData.role,
            campus: tokenPayload.campus || authData.campus,
            permissions: Array.isArray(tokenPayload.permissions)
              ? tokenPayload.permissions
              : authData.permissions
          }
        }
      } catch (error) {
        console.error('🔐 Failed to decode access token payload:', error)
      }
    }

    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: payloadForState
    })

    console.log('🔐 Auth state updated successfully')
  }, [])

  // Logout function - memoized
  const logout = useCallback(async () => {
    try {
      console.log('🔐 Logout initiated from AuthContext')
      const response = await authService.logout()
      console.log('🟢 Backend logout response received:', response)
    } catch (error) {
      console.error('🔴 Backend logout error:', error)
      // Continue with local cleanup even if backend fails
    } finally {
      // Clear local storage
      sessionStorage.removeItem('accessToken')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      console.log('🟢 Logout completed, session cleared')
    }
  }, [])


  const getDefaultAcademicYearId = useCallback(() => state.defaultAcademicYearId || null, [state.defaultAcademicYearId])
  const getDefaultClassId = useCallback(() => state.defaultClassId || null, [state.defaultClassId])

  const setDefaultAcademicYearId = useCallback((id) => {
    try {
      if (id) {
        localStorage.setItem('defaultAcademicYearId', String(id))
        dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_AY, payload: id })
      }
    } catch (_) {}
  }, [])

  const setDefaultClassId = useCallback((id) => {
    try {
      if (id) {
        localStorage.setItem('defaultClassId', String(id))
        dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_CLASS, payload: id })
      }
    } catch (_) {}
  }, [])

  const clearDefaultAcademicYearId = useCallback(() => {
    try {
      localStorage.removeItem('defaultAcademicYearId')
    } catch (_) {}
    dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_AY, payload: null })
  }, [])

  const clearDefaultClassId = useCallback(() => {
    try {
      localStorage.removeItem('defaultClassId')
    } catch (_) {}
    dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_CLASS, payload: null })
  }, [])

  const permissionsArray = useMemo(() => {
    const raw = state.permissions;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [];
  }, [state.permissions]);

  const rolesArray = useMemo(() => {
    const role = state.role; // Use state.role (singular)
    if (!role) return [];
    return Array.isArray(role) ? role : [role]; // Wrap single role in array
}, [state.role]);


  const hasRole = useCallback((role) => {
    return rolesArray.includes(role); 
  }, [rolesArray]);

  const hasAnyRole = useCallback((roles) => {
    return roles.some(role => rolesArray.includes(role)); 
  }, [rolesArray]);

  const hasPermission = useCallback((permission) => {
    return permissionsArray.includes(permission);
  }, [permissionsArray]);

  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(permission => permissionsArray.includes(permission));
  }, [permissionsArray]);

  const isSuperAdmin = useCallback(() => hasRole('Superadmin'), [hasRole])
  const isAdmin = useCallback(() => hasRole('Admin'), [hasRole])
  const isTeacher = useCallback(() => hasRole('Teacher'), [hasRole])
  const isStudent = useCallback(() => hasRole('Student'), [hasRole])
  const isParent = useCallback(() => hasRole('Parent'), [hasRole])

  // User info helpers - memoized
  const getUserId = useCallback(() => state.userId, [state.userId])
  const getUserName = useCallback(() => state.username, [state.username])
  const getFullName = useCallback(() => {
    const parts = []
    if (state.firstName) parts.push(state.firstName)
    if (state.middleName) parts.push(state.middleName) 
    if (state.lastName) parts.push(state.lastName)
    
    // If we have name parts, join them; otherwise fallback to username
    return parts.length > 0 ? parts.join(' ') : (state.username || '')
  }, [state.firstName, state.middleName, state.lastName, state.username])

  // Get primary role for display purposes
  const getPrimaryRole = useCallback(() => {
    return state.role || null
  }, [state.role])


  // Helper functions
  const getTenantName = useCallback(() => state.tenantName || 'Unknown School', [state.tenantName]);
  const getTenantId = useCallback(() => state.tenantId || null, [state.tenantId]);
  const getCampusName = useCallback(() => state.campusName || 'Unknown campus', [state.campusName]);
  const getCampusId = useCallback(() => state.campusId || null, [state.campusId]);
  const getPrimaryColor = useCallback(() => state.tenant?.theme_colors?.primary || '#3b82f6', [state.tenant?.theme_colors?.primary]);
  
  // Initialize auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth check...')
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
        
        const token = sessionStorage.getItem('accessToken')
        console.log('🔐 Token from sessionStorage:', token ? 'Found' : 'Not found')
        
        if (!token) {
          console.log('🔐 No token found, setting not authenticated')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
          return
        }

        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1] || ''))
          if (tokenPayload && typeof tokenPayload === 'object') {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: tokenPayload
            })
          }
        } catch (error) {
          console.error('🔐 Failed to decode access token during initAuth:', error)
        }

        console.log('🔐 Verifying token with backend...')
        const response = await authService.getProfile()
        console.log('%c[get profile response 2]', 'color: yellow;', response);
        console.log('🔐 Profile response:', response)
        
        if (response.success) {
          console.log('🔐 Token valid, updating user data from profile:', response.data)
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: response.data
          })
        } else {
          console.log('🔐 Token invalid, clearing session')
          sessionStorage.removeItem('accessToken')
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('🔐 Auth check failed:', error)
        sessionStorage.removeItem('accessToken')
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        
        // If it's a network error, don't show error toast on initial load
        if (error.code !== 'NETWORK_ERROR' && error.response?.status !== 404) {
          dispatch({ 
            type: AUTH_ACTIONS.SET_ERROR, 
            payload: 'Failed to verify authentication. Please try logging in again.' 
          })
        }
      }
    }
    
    initAuth()
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    try {
      const stored = localStorage.getItem('defaultAcademicYearId')
      if (stored) {
        dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_AY, payload: parseInt(stored, 10) || null })
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      const storedClass = localStorage.getItem('defaultClassId')
      if (storedClass) {
        dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_CLASS, payload: parseInt(storedClass, 10) || null })
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    const initStudentDefaults = async () => {
      try {
        if (!state.isAuthenticated || state.role !== 'Student') return
        if (!hasPermission(PERMISSIONS.STUDENT_BY_USERNAME_READ)) return
        const hasAy = !!state.defaultAcademicYearId
        const hasClass = !!state.defaultClassId
        if (hasAy && hasClass) return
        const username = state.username
        if (!username) return
        const res = await studentService.getStudentByUsername(username)
        const data = res?.data?.data || res?.data || {}
        const enrollments = Array.isArray(data?.enrollments) ? data.enrollments : (data?.enrollment ? [data.enrollment] : [])
        if (enrollments.length === 1) {
          const e = enrollments[0] || {}
          const ayId = e.academic_year_id || e.academicYearId || null
          const classId = e.class_id || e.classId || null
          if (ayId) dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_AY, payload: ayId })
          if (classId) dispatch({ type: AUTH_ACTIONS.SET_DEFAULT_CLASS, payload: classId })
          try {
            if (ayId) localStorage.setItem('defaultAcademicYearId', String(ayId))
            if (classId) localStorage.setItem('defaultClassId', String(classId))
          } catch (_) {}
        }
      } catch (_) {}
    }
    initStudentDefaults()
  }, [state.isAuthenticated, state.role, state.username, state.defaultAcademicYearId, state.defaultClassId, hasPermission])

  // Auto refresh token when it's about to expire
  useEffect(() => {
    if (!state.isAuthenticated) return

    const token = sessionStorage.getItem('accessToken')
    if (!token) return

    // Decode JWT to get expiration (basic implementation)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      const timeUntilExpiry = exp - now
      
      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000)
      
      if (refreshTime > 0) {
        const timeoutId = setTimeout(async () => {
          try {
            const response = await authService.refreshToken()
            if (response.success && response.data.access_token) {
              sessionStorage.setItem('accessToken', response.data.access_token)
            }
          } catch (error) {
            console.error('Token refresh failed:', error)
            logout()
          }
        }, refreshTime)

        return () => clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error('Token decode error:', error)
    }
  }, [state.isAuthenticated, logout])


  // Context value - properly memoized without function call
  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    getUserId,
    getUserName,
    getFullName,
    getPrimaryRole,
    getTenantName,
    getTenantId,
    getCampusName,
    getCampusId,
    getPrimaryColor,
    getDefaultAcademicYearId,
    getDefaultClassId,
    setDefaultAcademicYearId,
    setDefaultClassId,
    clearDefaultAcademicYearId,
    clearDefaultClassId
  }), [
    state,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isSuperAdmin,
    isTeacher,
    isStudent,
    isParent,
    getUserId,
    getUserName,
    getFullName,
    getPrimaryRole,
    getTenantName,
    getTenantId,
    getCampusName,
    getCampusId,
    getPrimaryColor,
    getDefaultAcademicYearId,
    getDefaultClassId,
    setDefaultAcademicYearId,
    setDefaultClassId,
    clearDefaultAcademicYearId,
    clearDefaultClassId
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
