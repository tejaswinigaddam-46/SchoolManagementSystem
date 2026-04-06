import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, Bell, User, Settings, LogOut, Search, LayoutGrid, LayoutList } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLayout } from '../../contexts/LayoutContext'
import Navigation from './Navigation'
import IconNavigation from './IconNavigation'
import AcademicYearSelector from '../forms/AcademicYearSelector.jsx'
import { classService } from '../../services/classService'

/**
 * Main Layout Component
 * Provides the overall layout structure for authenticated pages
 */
export default function Layout({ children }) {

  console.log('%c[layout.jsx Mount]', 'color: yellow;');
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout, getFullName, getPrimaryRole } = useAuth()
  const { getTenantName, isAuthenticated, getCampusId, getDefaultAcademicYearId, getDefaultClassId, setDefaultAcademicYearId, setDefaultClassId } = useAuth()
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    isIconNavigation, 
    setIsIconNavigation,
    getSidebarWidth,
    getSidebarWidthClass
  } = useLayout()
  const navigate = useNavigate()
  const schoolLogo = getTenantName().charAt(0).toUpperCase()
  const [showDefaultAyPrompt, setShowDefaultAyPrompt] = useState(false)
  const [ayValidation, setAyValidation] = useState({ isValid: null, academicYearId: null, message: '' })
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')

  useEffect(() => {
    const shouldPrompt = () => {
      const skipped = sessionStorage.getItem('skipDefaultAcademicYearPrompt') === 'true'
      const needsAy = !getDefaultAcademicYearId()
      const needsClass = getPrimaryRole() === 'Student' && !getDefaultClassId()
      return isAuthenticated && (needsAy || needsClass) && !skipped
    }
    setShowDefaultAyPrompt(shouldPrompt())
  }, [isAuthenticated, getDefaultAcademicYearId, getDefaultClassId, getPrimaryRole])

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const campusId = getCampusId()
        if (!campusId) return
        const res = await classService.getClassesByCampus(campusId)
        const list = res?.data?.classes || []
        setClasses(list.map(c => ({ id: c.class_id, name: c.class_name || c.class_level })))
      } catch (_) {
        setClasses([])
      }
    }
    if (showDefaultAyPrompt && getPrimaryRole() === 'Student') {
      loadClasses()
    }
  }, [showDefaultAyPrompt, getPrimaryRole, getCampusId])

  // Helper function to get display name with fallbacks
  const getDisplayName = () => {
    const fullName = getFullName()
    if (fullName && fullName.trim()) {
      return fullName
    }
    return user?.username || user?.email || 'User'
  }

  const handleLogout = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔐 Logout button clicked!')
    
    // Close the dropdown immediately to prevent interference
    setUserMenuOpen(false)
    
    try {
      console.log('🔐 Starting logout process...')
      await logout()
      console.log('🔐 Logout successful, navigating to login...')
      // Navigate to login page after successful logout
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('🔐 Logout failed:', error)
      // Still navigate even if logout fails
      navigate('/login', { replace: true })
    }
  }

  // Close sidebar when clicking outside or on navigation items
  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  // Close user menu when clicking outside
  const closeUserMenu = () => {
    setUserMenuOpen(false)
  }

  // Toggle between icon and normal navigation
  const toggleNavigation = () => {
    setIsIconNavigation(!isIconNavigation)
  }

  return (
    <div className="min-h-screen bg-primary-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Dynamic width based on navigation type */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out border-r border-secondary-100
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0
        `}
        style={{ width: getSidebarWidth() }}
      >
        <div className="flex flex-col h-full">
          {/* Logo and tenant info - Conditional layout */}
          <div className={`flex-shrink-0 bg-gradient-to-r from-primary-600 to-primary-700 ${
            isIconNavigation ? 'p-4' : 'px-6 py-6'
          }`}>
            {isIconNavigation ? (
              // Compact logo for icon navigation
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-primary-600 font-bold text-lg">{schoolLogo}</span>
                </div>
              </div>
            ) : (
              // Full logo for normal navigation
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-primary-600 font-bold text-lg">{schoolLogo}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-white">
                    {getTenantName()}
                  </h1>
                  <p className="text-sm text-primary-100 opacity-90">
                    School Management
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation - Conditional component */}
          <div className="flex-1 overflow-y-auto">
            {isIconNavigation ? (
              <IconNavigation onItemClick={closeSidebar} />
            ) : (
              <Navigation onItemClick={closeSidebar} />
            )}
          </div>

          {/* User info at bottom - Conditional layout */}
          <div className={`flex-shrink-0 border-t border-secondary-200 bg-secondary-50 ${
            isIconNavigation ? 'p-4' : 'p-4'
          }`}>
            {isIconNavigation ? (
              // Compact user info for icon navigation
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              // Full user info for normal navigation
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-secondary-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-primary-600 font-medium truncate">
                    {getPrimaryRole() || 'User'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area - Dynamic padding based on navigation type */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${getSidebarWidthClass()}`}>
        {/* Top header - Fixed positioning and higher z-index */}
        <header className="bg-white shadow-soft border-b border-secondary-100 backdrop-blur-sm relative z-[100]">
          <div className="flex items-center justify-between px-6 py-4 sm:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title area - can be customized per page */}
            <div className="flex-1 lg:ml-0">
              <h2 className="text-2xl font-bold text-secondary-800">
                
              </h2>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4 relative z-[101]">
              {/* Search bar */}
              <div className="hidden md:block relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-secondary-50"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              </div>

              {/* Navigation Toggle Button */}
              <button
                onClick={toggleNavigation}
                className="p-3 rounded-xl text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors group"
                title={isIconNavigation ? 'Switch to Full Navigation' : 'Switch to Icon Navigation'}
              >
                {isIconNavigation ? (
                  <LayoutList className="w-5 h-5 group-hover:scale-110 transition-transform" />
                ) : (
                  <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-3 rounded-xl text-secondary-600 hover:text-primary-600 hover:bg-primary-50 relative transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full animate-pulse"></span>
              </button>

              {/* User menu */}
              <div className="relative z-[102]">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold hidden sm:block text-secondary-800">
                    {getDisplayName()}
                  </span>
                </button>

                {/* User dropdown menu - Highest z-index to appear above everything */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-secondary-100 py-2 z-[9999] animate-fade-in">
                    <div className="px-4 py-3 border-b border-secondary-100">
                      <p className="text-sm font-semibold text-secondary-900">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {user?.email}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        closeUserMenu();
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    
                    <button 
                      onClick={closeUserMenu}
                      className="w-full text-left px-4 py-3 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-3 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    
                    <div className="border-t border-secondary-100 mt-2 pt-2">
                      <button
                        onClick={(e) => {
                          console.log('🔴 LOGOUT BUTTON CLICKED - Event triggered!');
                          handleLogout(e);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-error-700 hover:bg-error-50 active:bg-error-100 focus:bg-error-50 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 active:scale-95 transition-all duration-150 flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content - Lower z-index to stay below header */}
        <main className="flex-1 py-8 relative z-0">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            {children || <Outlet />}
          </div>
        </main>

        {/* Beautified Default Academic Year Form Modal */}
        {showDefaultAyPrompt && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-secondary-200 w-full max-w-2xl mx-4 transform transition-all duration-300 animate-fade-in">
              {/* Header with gradient background */}
              <div className="px-8 py-6 border-b-2 border-secondary-100 bg-gradient-to-r from-primary-50 to-primary-100 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-1">Select Default Academic Year</h3>
                    <p className="text-sm text-secondary-600">Set your preferred academic year for easier navigation</p>
                  </div>
                  <button
                    onClick={() => { sessionStorage.setItem('skipDefaultAcademicYearPrompt', 'true'); setShowDefaultAyPrompt(false); }}
                    className="text-secondary-400 hover:text-secondary-600 p-2 rounded-full hover:bg-white transition-colors duration-200"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content section */}
              <div className="px-8 py-6">
                <div className="mb-6">
                  <p className="text-secondary-700 text-base mb-4 leading-relaxed">
                    Choose your default academic year to streamline your experience. You can change this setting anytime from any page.
                  </p>
                </div>

                {/* Academic Year Selector with enhanced styling */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-3">
                    Academic Year <span className="text-error-500">*</span>
                  </label>
                  <div className="relative border-2 border-secondary-200 rounded-xl p-4 bg-secondary-50 hover:border-primary-300 transition-colors duration-200">
                    <AcademicYearSelector
                      campusId={getCampusId()}
                      value={ayValidation.academicYearId}
                      onChange={(e) => {
                        const id = parseInt(e.target.value, 10)
                        const valid = Number.isInteger(id) && id > 0
                        setAyValidation({ isValid: valid, academicYearId: valid ? id : null, message: valid ? 'Academic year selected' : 'Invalid academic year' })
                      }}
                      onValidationChange={setAyValidation}
                      name="academic_year_id"
                    />
                    {ayValidation.message && (
                      <p className={`text-sm mt-2 ${ayValidation.isValid ? 'text-success-600' : 'text-error-600'}`}>
                        {ayValidation.message}
                      </p>
                    )}
                  </div>
                </div>

                {getPrimaryRole() === 'Student' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary-700 mb-3">Class <span className="text-error-500">*</span></label>
                    <select
                      className="input w-full"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      <option value="">Select class</option>
                      {classes.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action buttons with neutral styling */}
                <div className="flex gap-4 justify-end pt-4 border-t border-secondary-100">
                  <button
                    onClick={() => { sessionStorage.setItem('skipDefaultAcademicYearPrompt', 'true'); setShowDefaultAyPrompt(false); }}
                    className="px-6 py-3 text-secondary-600 bg-white border-2 border-secondary-300 rounded-xl hover:bg-secondary-50 hover:border-secondary-400 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                  >
                    Skip for Now
                  </button>
                  <button
                    disabled={!ayValidation.isValid || (getPrimaryRole() === 'Student' && !selectedClassId)}
                    onClick={() => {
                      if (!ayValidation.isValid) return
                      setDefaultAcademicYearId(ayValidation.academicYearId)
                      if (getPrimaryRole() === 'Student' && selectedClassId) {
                        setDefaultClassId(parseInt(selectedClassId, 10))
                      }
                      sessionStorage.setItem('skipDefaultAcademicYearPrompt', 'true')
                      setShowDefaultAyPrompt(false)
                    }}
                    className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
                  >
                    Set as Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
