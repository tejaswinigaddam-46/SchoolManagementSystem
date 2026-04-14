import { useState } from 'react'
import { AlertCircle, BookOpen, Building2, Calendar } from 'lucide-react'
import AcademicYearsSection from '../components/forms/AcademicYearsSection'
import CurriculaSection from '../components/forms/CurriculaSection'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../config/permissions'

export default function AcademicManagementPage() {
  
  // Get auth context - use the correct properties and functions
  const { campusId, campusName, getFullName, hasPermission, isAuthenticated, isMainCampus,
    loading: authLoading, role} = useAuth()
  
  // State management for active tab
  const [activeTab, setActiveTab] = useState('curricula')

  // Tab configuration
  const tabs = [
    {
      id: 'curricula',
      name: 'Curricula',
      icon: BookOpen,
      description: 'Manage curriculum types and standards',
      count: 'curricula'
    },
    {
      id: 'academic-years',
      name: 'Academic Years',
      icon: Calendar,
      description: 'Configure academic year schedules and settings',
      count: 'academicYears'
    }
  ]

  // Show loading if auth is still loading OR if essential data is missing
  if (authLoading || (isAuthenticated && !campusId)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">
            {authLoading ? 'Loading authentication...' : 'Loading user details...'}
          </p>
          <div className="mt-2 text-xs text-secondary-500">
            Auth Loading: {String(authLoading)} | Authenticated: {String(isAuthenticated)} | Role: {role || 'undefined'} | Campus: {campusId || 'undefined'}
          </div>
        </div>
      </div>
    )
  }
  
  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Authentication Required</h2>
          <p className="text-secondary-600">Please log in to access academic management.</p>
        </div>
      </div>
    )
  }

  // Check if user has at least read permissions for academic configuration
  const canViewAcademicManagement =
    !!hasPermission &&
    (hasPermission(PERMISSIONS.ACADEMIC_CURRICULA_LIST_READ) ||
      hasPermission(PERMISSIONS.ACADEMIC_YEAR_OPTIONS_READ) ||
      hasPermission(PERMISSIONS.ACADEMIC_YEARS_LIST_READ));

  if (!canViewAcademicManagement) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Access Denied</h2>
          <p className="text-secondary-600">You do not have permission to access this page.</p>
          <div className="mt-2 text-xs text-secondary-500">
            Current role: {role || 'undefined'}
          </div>
        </div>
      </div>
    )
  }

  // Check if user has campus assigned
  if (!campusId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">No Campus Assigned</h2>
          <p className="text-secondary-600">
            You need to be assigned to a campus to manage academic settings.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Academic Management</h1>
        <p className="text-secondary-600">
          Welcome, {getFullName()}! Manage curricula and academic year configurations for your campus.
        </p>
      </div>

      {/* Campus Info Card */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
            <h3 className="text-lg font-semibold text-primary-900">
              {campusName || 'Campus Name'}
              {isMainCampus && (
                <span className="ml-3 text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full">
                  Main Campus
                </span>
              )}
            </h3>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="p-4 bg-secondary-50/30">
          <div className="flex w-full gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex flex-col items-center justify-center py-4 px-6 rounded-xl transition-all duration-300 border
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-transparent shadow-md'
                        : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
                    <span className={`font-bold text-medium tracking-wide ${isActive ? 'text-primary-900' : ''}`}>
                      {tab.name}
                    </span>
                  </div>
                  <span className={`text-sm mt-1 font-medium ${isActive ? 'text-primary-600' : 'text-secondary-400'}`}>
                    {tab.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="h-px bg-secondary-200 mx-4" />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'curricula' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Curriculum Management
                  </h2>
                </div>
                <p className="text-secondary-600">
                  Create curriculum frameworks that will be used in academic year configurations.
                </p>
              </div>
              <CurriculaSection campusId={campusId} />
            </div>
          )}

          {activeTab === 'academic-years' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Academic Year Configuration
                  </h2>
                </div>
                <p className="text-secondary-600">
                  Configure year types, medium of instruction, class ranges, and associate them with curricula.
                </p>
              </div>
              <AcademicYearsSection campusId={campusId} />
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-secondary-50 rounded-lg border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-3">Quick Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-secondary-800 mb-2 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
              Curricula Management
            </h4>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• Create curriculum types (CBSE, ICSE, State Board, etc.)</li>
              <li>• Each curriculum needs a unique code and descriptive name</li>
              <li>• Curricula are required before creating academic years</li>
              <li>• You can edit or delete curricula if not in use</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-secondary-800 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              Academic Years
            </h4>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• Configure academic year schedules and settings</li>
              <li>• Set year types: Current, Previous, or Next year</li>
              <li>• Define class ranges and medium of instruction</li>
              <li>• Associate with curricula for complete setup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
