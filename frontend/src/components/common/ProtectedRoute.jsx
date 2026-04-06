import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and optional permission-based access
 */
export function ProtectedRoute({ children, requiredPermissions = [] }) {
  const { isAuthenticated, loading, hasAnyPermission } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const lacksRequiredPermissions = requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)

  if (lacksRequiredPermissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-error-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mx-auto h-12 w-12 bg-error-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">Access Denied</h2>
            <p className="text-secondary-600 mb-6">
              You don't have the required permissions to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render children if all checks pass
  return children
}

export default ProtectedRoute
