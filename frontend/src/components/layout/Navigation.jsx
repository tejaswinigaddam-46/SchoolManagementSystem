import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  CheckSquare,
  IndianRupee,
  Calendar,
  Settings,
  Home,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PERMISSIONS } from '../../config/permissions'

/**
 * Navigation Component
 * Renders the sidebar navigation menu
 */
export default function Navigation({ onItemClick }) {
  console.log('%c[navigation.jsx Mount]', 'color: yellow;');
  const { hasPermission } = useAuth()

  // Navigation items configuration
  const navigationItems = [
    {
      name: 'Home',
      href: '/home',
      icon: Home,
      description: 'All navigation icons',
      feature: null
    },
    {
      name: 'AI Assistant',
      href: '/ai-chat',
      icon: Sparkles,
      description: 'AI powered help',
      feature: null
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics',
      feature: null
    },
    {
      name: 'Campus',
      href: '/campus',
      icon: Building2,
      description: 'Campus management',
      permission: PERMISSIONS.CAMPUS_LIST_READ,
      feature: null
    },
    {
      name: 'Academics',
      href: '/academics',
      icon: BookOpen,
      description: 'Curricula and academic years',
      permission: PERMISSIONS.ACADEMIC_CURRICULA_LIST_READ,
      feature: null
    },
    {
      name: 'Students',
      href: '/students',
      icon: Users,
      description: 'Student management',
      permission: PERMISSIONS.STUDENT_LIST_READ,
      feature: null
    },
    {
      name: 'ID Cards',
      href: '/id-cards',
      icon: CreditCard,
      description: 'Generate ID Cards',
      permission: PERMISSIONS.ID_CARD_MANAGE,
      feature: null
    },
    {
      name: 'Staff',
      href: '/employees',
      icon: UserCheck,
      description: 'Employee management',
      permission: PERMISSIONS.EMPLOYEE_LIST_READ,
      feature: null
    },
    {
      name: 'Leave Management',
      href: '/leave-management',
      icon: ClipboardList,
      description: 'Leave requests & approvals',
      permission: [PERMISSIONS.LEAVE_PENDING_LIST_READ, PERMISSIONS.LEAVE_MY_LIST_READ],
      feature: null
    },
    {
      name: 'Calendar Events',
      href: '/calendar-events',
      icon: Calendar,
      description: 'Create calendar events',
      permission: PERMISSIONS.EVENT_LIST_READ,
      feature: null
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: CheckSquare,
      description: 'Track attendance',
      permission: PERMISSIONS.ATTENDANCE_LIST_READ,
      feature: null
    },
    {
      name: 'Exams',
      href: '/exams',
      icon: FileText,
      description: 'Exam results & management',
      permission: PERMISSIONS.EXAM_LIST_READ,
      feature: null
    },
    {
      name: 'Fees',
      href: '/fees',
      icon: IndianRupee,
      description: 'Fee management',
      permission: PERMISSIONS.FEE_STUDENT_DUES_READ,
      feature: null
    },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: CreditCard,
      description: 'Payroll management',
      permission: [PERMISSIONS.PAYROLL_REPORT_READ, PERMISSIONS.MY_PAYROLL_READ],
      feature: null
    },
    {
      name: 'Timetable',
      href: '/timetable',
      icon: Calendar,
      description: 'Class schedules',
      permission: null,
      feature: null
    },
    {
      name: 'Holidays',
      href: '/holidays',
      icon: Calendar,
      description: 'Manage holidays',
      permission: PERMISSIONS.HOLIDAY_LIST_READ,
      feature: null
    },
    {
      name: 'Special Working Days',
      href: '/special-working-days',
      icon: Calendar,
      description: 'Manage special working days',
      permission: PERMISSIONS.SPECIAL_WORKING_DAY_LIST_READ,
      feature: null
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
      feature: null
    }
  ]

  // Filter items based on user role and permissions
  const filterNavItems = (items) => {
    return items.filter(item => {
      if (!item.permission) return true
      if (Array.isArray(item.permission)) {
        return item.permission.some(p => hasPermission(p))
      }
      return hasPermission(item.permission)
    })
  }

  const filteredNavItems = filterNavItems(navigationItems)
  const filteredAdminItems = filterNavItems(adminItems)

  return (
    <nav className="px-4 py-6">
      {/* Main navigation */}
      <div className="space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                    : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`mr-4 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-secondary-400 group-hover:text-primary-500'
                    }`} 
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      {/* Badge for notifications or counts */}
                      {item.name === 'Attendance' && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isActive 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'bg-warning-100 text-warning-800'
                        }`}>
                          New
                        </span>
                      )}
                    </div>
                    {/* Optional description */}
                    <div className={`text-xs mt-1 ${
                      isActive ? 'text-primary-100' : 'text-secondary-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Separator for admin section */}
      {filteredAdminItems.length > 0 && (
        <div className="mt-8 pt-6 border-t border-secondary-200">
          <h3 className="px-4 text-xs font-bold text-secondary-500 uppercase tracking-wider mb-4">
            Administration
          </h3>
          <div className="space-y-2">
            {filteredAdminItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                        : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-600'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon 
                        className={`mr-4 h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-secondary-400 group-hover:text-primary-500'
                        }`} 
                      />
                      <span className="font-medium">{item.name}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Stats section */}
      <div className="mt-8 pt-6 border-t border-secondary-200">
        <div className="px-4">
          <div className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-4">
            Quick Stats
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 font-medium">System Status</span>
                <span className="font-bold text-success-600">Online</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 font-medium">Database</span>
                <span className="font-bold text-primary-700">Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 font-medium">Version</span>
                <span className="font-bold text-secondary-600">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
