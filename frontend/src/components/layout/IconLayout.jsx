import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, Bell, User, Settings, LogOut, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import IconNavigation from './IconNavigation'

/**
 * Icon Layout Component
 * Provides a compact layout structure with icon-only navigation
 */
export default function IconLayout({ children }) {
  console.log('%c[IconLayout.jsx Mount]', 'color: yellow;');
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout, getFullName, getPrimaryRole } = useAuth()
  const { getTenantName } = useAuth()
  const navigate = useNavigate()
  const schoolLogo = getTenantName().charAt(0).toUpperCase()

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
    console.log('🔐 Logout button clicked in IconLayout!')
    
    // Close the dropdown immediately to prevent interference
    setUserMenuOpen(false)
    
    try {
      console.log('🔐 Starting logout process...')
      await logout()
      console.log('🔐 Logout successful, navigating to login...')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('🔐 Logout failed:', error)
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

  return (
    <div className="min-h-screen bg-primary-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Compact Icon Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-20 bg-white shadow-xl transform transition-transform duration-300 ease-in-out border-r border-secondary-100
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0
      `}>
        <div className="flex flex-col h-full">
          {/* Compact Logo */}
          <div className="flex-shrink-0 p-4 bg-gradient-to-b from-primary-600 to-primary-700">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-600 font-bold text-lg">{schoolLogo}</span>
              </div>
            </div>
          </div>

          {/* Icon Navigation */}
          <div className="flex-1 overflow-y-auto">
            <IconNavigation onItemClick={closeSidebar} />
          </div>

          {/* Compact User info at bottom */}
          <div className="flex-shrink-0 border-t border-secondary-200 p-4 bg-secondary-50">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with reduced left padding for icon sidebar */}
      <div className="lg:pl-20 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white shadow-soft border-b border-secondary-100 backdrop-blur-sm relative z-[100]">
          <div className="flex items-center justify-between px-6 py-4 sm:px-8">
            {/* Mobile menu button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* School name for larger screens */}
            <div className="hidden lg:flex items-center gap-3">
              <h1 className="text-xl font-bold text-secondary-800">
                {getTenantName()}
              </h1>
              <span className="text-sm text-secondary-500 px-2 py-1 bg-secondary-100 rounded-full">
                SMS
              </span>
            </div>

            {/* Page title area - can be customized per page */}
            <div className="flex-1 lg:ml-6">
              <h2 className="text-2xl font-bold text-secondary-800">
                {/* Page title will be set by individual pages */}
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

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-secondary-100 py-2 z-[9999] animate-fade-in">
                    <div className="px-4 py-3 border-b border-secondary-100">
                      <p className="text-sm font-semibold text-secondary-900">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {user?.email}
                      </p>
                      <p className="text-xs text-primary-600 font-medium mt-1">
                        {getPrimaryRole() || 'User'}
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
                          console.log('🔴 LOGOUT BUTTON CLICKED - Event triggered in IconLayout!');
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

        {/* Main content */}
        <main className="flex-1 py-8 relative z-0">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}