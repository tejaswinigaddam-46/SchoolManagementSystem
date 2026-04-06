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
  FileText
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PERMISSIONS } from '../../config/permissions'

/**
 * Icon Navigation Component
 * Renders a compact icon-only navigation menu
 */
export default function IconNavigation({ onItemClick }) {
  console.log('%c[IconNavigation.jsx Mount]', 'color: yellow;');
  const { hasPermission } = useAuth()

  // Navigation items configuration (same as main Navigation)
  const navigationItems = [
    {
      name: 'Home',
      href: '/home',
      icon: Home,
      description: 'All navigation icons',
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
      name: 'Attendance',
      href: '/attendance',
      icon: CheckSquare,
      description: 'Event Attendance',
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
      name: 'Calendar Events',
      href: '/calendar-events',
      icon: Calendar,
      description: 'Create calendar events',
      permission: PERMISSIONS.EVENT_LIST_READ,
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
    <nav className="p-4">
      {/* Main navigation icons */}
      <div className="space-y-3">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                `group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-110'
                    : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600 hover:scale-105'
                }`
              }
              title={item.name} // Tooltip on hover
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-secondary-500 group-hover:text-primary-600'
                    }`} 
                  />
                  {/* Badge for notifications */}
                  {item.name === 'Attendance' && (
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center ${
                      isActive 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-warning-500'
                    }`}>
                      <span className="w-2 h-2 bg-current rounded-full"></span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Separator for admin section */}
      {filteredAdminItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-secondary-200">
          <div className="space-y-3">
            {filteredAdminItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-110'
                        : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600 hover:scale-105'
                    }`
                  }
                  title={item.name} // Tooltip on hover
                >
                  {({ isActive }) => (
                    <Icon 
                      className={`h-5 w-5 ${
                        isActive ? 'text-white' : 'text-secondary-500 group-hover:text-primary-600'
                      }`} 
                    />
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}

      {/* Compact status indicator */}
      <div className="mt-6 pt-4 border-t border-secondary-200">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </nav>
  )
}
