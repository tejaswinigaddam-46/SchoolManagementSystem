import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  CheckSquare, 
  CreditCard, 
  IndianRupee, 
  Calendar, 
  BarChart3,
  Settings,
  Home as HomeIcon,
  FileText
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../config/permissions'

/**
 * Home Page Component
 * Displays all navigation icons in a horizontal grid layout
 */
export default function Home() {
  console.log('%c[Home Page Mount]', 'color: yellow;');
  const navigate = useNavigate();
  const { hasPermission, getTenantName } = useAuth();

  // Navigation items configuration
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics',
      permission: null,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Campus',
      href: '/campus',
      icon: Building2,
      description: 'Campus management',
      permission: PERMISSIONS.CAMPUS_LIST_READ,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Students',
      href: '/students',
      icon: Users,
      description: 'Student management',
      permission: PERMISSIONS.STUDENT_LIST_READ,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Staff',
      href: '/employees',
      icon: UserCheck,
      description: 'Staff and teachers',
      permission: PERMISSIONS.EMPLOYEE_LIST_READ,
      color: 'from-orange-500 to-orange-600'
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: CheckSquare,
      description: 'Event Attendance',
      permission: PERMISSIONS.ATTENDANCE_LIST_READ,
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'Exams',
      href: '/exams',
      icon: FileText,
      description: 'Exam results & management',
      permission: PERMISSIONS.EXAM_LIST_READ,
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      name: 'Fees',
      href: '/fees',
      icon: IndianRupee,
      description: 'Fee management',
      permission: PERMISSIONS.FEE_STUDENT_DUES_READ,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      name: 'Timetable',
      href: '/timetable',
      icon: Calendar,
      description: 'Class schedules',
      permission: null,
      color: 'from-pink-500 to-pink-600'
    },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: CreditCard,
      description: 'Payroll management',
      permission: PERMISSIONS.PAYROLL_REPORT_READ,
      color: 'from-teal-500 to-teal-600'
    }
  ]

  // Admin-only items
  const adminItems = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'System configuration',
      permission: null,
      color: 'from-gray-500 to-gray-600'
    }
  ]

  // Filter items based on user role
  const filterNavItems = (items) => {
    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission)
    })
  }

  const filteredNavItems = filterNavItems(navigationItems)
  const filteredAdminItems = filterNavItems(adminItems)
  const allItems = [...filteredNavItems, ...filteredAdminItems]

  const canQuickAddStudent = !navigationItems.find(i => i.name === 'Students')?.permission || hasPermission(PERMISSIONS.STUDENT_EDIT)
  const canQuickTakeAttendance = hasPermission(PERMISSIONS.ATTENDANCE_SAVE_CREATE)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* check usage of these divs remove if not needed */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full -ml-12 -mb-12"></div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">
              Welcome to {getTenantName()}
            </h1>
          </div>
          <p className="text-primary-100 text-lg">
            Choose a module below to get started with your school management system.
          </p>
        </div>
      </div>

      {/* Navigation Icons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {allItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className="group bg-white rounded-2xl p-6 shadow-soft border border-secondary-100 hover:shadow-medium transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Title */}
                <div>
                  <h3 className="text-lg font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    {item.description}
                  </p>
                </div>

                {/* Badge for notifications */}
                {item.name === 'Attendance' && (
                  <div className="absolute top-4 right-4">
                    <span className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></span>
                  </div>
                )}
              </div>
            </NavLink>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-secondary-100">
        <h2 className="text-xl font-bold text-secondary-800 mb-4 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canQuickAddStudent && (
            <button
              className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl hover:from-primary-100 hover:to-primary-200 transition-all text-left group"
              onClick={() => navigate('/students')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-primary-700 group-hover:text-primary-800">Add New Student</span>
              </div>
            </button>
          )}
          
          {canQuickTakeAttendance && (
            <button
              className="p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl hover:from-success-100 hover:to-success-200 transition-all text-left group"
              onClick={() => navigate('/attendance')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success-500 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-success-700 group-hover:text-success-800">Take Attendance</span>
              </div>
            </button>
          )}
          
          <button className="p-4 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl hover:from-warning-100 hover:to-warning-200 transition-all text-left group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-warning-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-warning-700 group-hover:text-warning-800">View Schedule</span>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl hover:from-accent-100 hover:to-accent-200 transition-all text-left group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-accent-700 group-hover:text-accent-800">Generate Report</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
