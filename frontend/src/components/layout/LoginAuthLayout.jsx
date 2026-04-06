import { useAuth } from '../../contexts/AuthContext'

/**
 * Authentication Layout Component
 * Provides layout for login, register, and other auth pages
 */
export default function LoginAuthLayout({ children }) {
  console.log('%c[LoginAuthLayout.jsx Mount]', 'color: yellow;');
  const { getTenantName, getPrimaryColor } = useAuth()

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 flex-col justify-center items-center p-12 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${getPrimaryColor()}, ${getPrimaryColor()}dd)` 
        }}
      >
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-white">SMS</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              School Management System
            </h1>
            <p className="text-xl opacity-90">
              {getTenantName()}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Complete Student Management</h3>
                <p className="text-sm opacity-80">Manage student records, enrollment, and academic progress</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Staff & Teacher Portal</h3>
                <p className="text-sm opacity-80">Comprehensive staff management and teacher tools</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Attendance & Grades</h3>
                <p className="text-sm opacity-80">Track attendance and manage academic performance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Multi-Campus Support</h3>
                <p className="text-sm opacity-80">Manage multiple campus locations from one platform</p>
              </div>
            </div>
          </div>

          {/* Testimonial or additional info */}
          {/* TODO: Add tenant testimonial */}
          <div className="mt-12 p-6 bg-white bg-opacity-10 rounded-lg">
            <p className="text-sm italic mb-3">
              "This system has transformed how we manage our school operations. 
              Everything is now streamlined and efficient."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold">HG</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Hemanth G</p>
                <p className="text-xs opacity-80">School Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">SMS</span>
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">
              School Management System
            </h1>
            <p className="text-secondary-600 mt-1">
              {getTenantName()}
            </p>
          </div>

          {/* Form content */}
          {children}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-secondary-500">
              Protected by industry-standard security
            </p>
            <div className="flex justify-center items-center gap-4 mt-4 text-xs text-secondary-400">
              {/* TODO: Add links */}
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
