import { useQuery } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  Building2,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { studentService } from '../services/studentService'
import employeeService from '../services/employeeService'
import { campusService } from '../services/campusService'
import userService from '../services/userService'
import LoadingSpinner, { CardLoading } from '../components/ui/LoadingSpinner'

/**
 * Dashboard Page Component
 * Main overview page for the application
 */
export default function Dashboard() {
  console.log('%c[Dashboard Page Mount]', 'color: yellow;')
  const { getFullName, getTenantName } = useAuth()

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      try {
        const [
          studentStatsResponse,
          employeeStatsResponse,
          campusesResponse,
          attendanceResponse
        ] = await Promise.all([
          studentService.getStudentStatistics(),
          employeeService.getEmployeeStatistics(),
          campusService.getAllCampuses(),
          userService.getDailyAttendance({
            roles: ['Student', 'Teacher', 'Employee'],
            academicYear: null,
            fromDate: today,
            toDate: today,
            classId: null,
            sectionId: null
          })
        ])

        const studentStats = studentStatsResponse?.data || {}
        const employeeStats = employeeStatsResponse?.data || {}
        const campuses = campusesResponse?.data || []
        const attendanceRecords = attendanceResponse?.data || []

        let presentCount = 0
        let absentCount = 0
        let lateCount = 0
        let consideredCount = 0

        attendanceRecords.forEach((record) => {
          if (record.is_holiday) {
            return
          }
          const status = record.status
          if (status === 'Present') {
            presentCount += 1
            consideredCount += 1
          } else if (status === 'Absent') {
            absentCount += 1
            consideredCount += 1
          } else if (status === 'Late') {
            lateCount += 1
            consideredCount += 1
          }
        })

        const attendedCount = presentCount + lateCount
        const attendancePercentage =
          consideredCount > 0 ? Math.round((attendedCount / consideredCount) * 100) : 0

        return {
          stats: {
            totalStudents: studentStats.total_students || 0,
            totalStaff: employeeStats.total_employees || 0,
            totalCampuses: Array.isArray(campuses) ? campuses.length : 0,
            attendanceToday: attendancePercentage,
            studentsTrend: 0,
            staffTrend: 0,
            campusTrend: 0,
            attendanceTrend: 0
          },
          recentActivities: [
            {
              id: 1,
              type: 'system',
              message: 'System initialized successfully',
              time: 'Just now',
              icon: CheckSquare,
              color: 'success'
            }
          ],
          quickStats: {
            todayAttendance: {
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              percentage: attendancePercentage
            },
            upcomingEvents: []
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error)
        return {
          stats: {
            totalStudents: 0,
            totalStaff: 0,
            totalCampuses: 0,
            attendanceToday: 0,
            studentsTrend: 0,
            staffTrend: 0,
            campusTrend: 0,
            attendanceTrend: 0
          },
          recentActivities: [
            {
              id: 1,
              type: 'system',
              message: 'System initialized successfully',
              time: 'Just now',
              icon: CheckSquare,
              color: 'success'
            }
          ],
          quickStats: {
            todayAttendance: {
              present: 0,
              absent: 0,
              late: 0,
              percentage: 0
            },
            upcomingEvents: []
          }
        }
      }
    }
  })

  const StatCard = ({ title, value, trend, icon: Icon, trendColor, subtitle }) => (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-secondary-100 hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-secondary-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-secondary-600 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center mt-3 text-sm font-medium ${
              trend >= 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${trendColor} shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardLoading key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardLoading />
          <CardLoading />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full -ml-12 -mb-12"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-3">
            Welcome back, {getFullName()}! 👋
          </h1>
          <p className="text-primary-100 text-lg">
            Here's what's happening at {getTenantName()} today.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              <span className="text-primary-100 text-sm">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-200" />
              <span className="text-primary-100 text-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={dashboardData?.stats.totalStudents.toLocaleString()}
          subtitle="Enrolled across all campuses"
          trend={dashboardData?.stats.studentsTrend}
          icon={Users}
          trendColor="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          title="Total Staff"
          value={dashboardData?.stats.totalStaff}
          subtitle="Teaching and administrative"
          trend={dashboardData?.stats.staffTrend}
          icon={UserCheck}
          trendColor="bg-gradient-to-br from-success-500 to-success-600"
        />
        <StatCard
          title="Campus Locations"
          value={dashboardData?.stats.totalCampuses}
          subtitle="Active campus branches"
          trend={dashboardData?.stats.campusTrend}
          icon={Building2}
          trendColor="bg-gradient-to-br from-accent-500 to-accent-600"
        />
        <StatCard
          title="Attendance Today"
          value={`${dashboardData?.stats.attendanceToday}%`}
          subtitle="Overall attendance rate"
          trend={dashboardData?.stats.attendanceTrend}
          icon={CheckSquare}
          trendColor="bg-gradient-to-br from-warning-500 to-warning-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100">
          <div className="p-6 border-b border-secondary-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-secondary-800">
                Recent Activities
              </h3>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-semibold">
                Live
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData?.recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors">
                    <div className={`p-3 rounded-xl shadow-md ${
                      activity.color === 'success' ? 'bg-gradient-to-br from-success-500 to-success-600' :
                      activity.color === 'primary' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                      'bg-gradient-to-br from-secondary-500 to-secondary-600'
                    }`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all activities →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Today's Attendance */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100">
            <div className="p-6 border-b border-secondary-100">
              <h3 className="text-xl font-bold text-secondary-800 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary-600" />
                Today's Attendance
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-success-600">
                    {dashboardData?.quickStats.todayAttendance.present}
                  </p>
                  <p className="text-sm font-medium text-secondary-600">Present</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-error-500 to-error-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-error-600">
                    {dashboardData?.quickStats.todayAttendance.absent}
                  </p>
                  <p className="text-sm font-medium text-secondary-600">Absent</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-warning-600">
                    {dashboardData?.quickStats.todayAttendance.late}
                  </p>
                  <p className="text-sm font-medium text-secondary-600">Late</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-secondary-200">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl">
                  <span className="text-sm font-semibold text-secondary-700">Overall Rate</span>
                  <span className="text-2xl font-bold text-success-600">
                    {dashboardData?.quickStats.todayAttendance.percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-soft border border-secondary-100">
            <div className="p-6 border-b border-secondary-100">
              <h3 className="text-xl font-bold text-secondary-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-600" />
                Upcoming Events
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.quickStats.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl hover:from-accent-100 hover:to-accent-200 transition-all cursor-pointer">
                    <div className="p-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl shadow-md">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-secondary-900">
                        {event.title}
                      </p>
                      <p className="text-xs text-secondary-600 mt-1">
                        {event.date} at {event.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-accent-200 text-accent-700 px-2 py-1 rounded-full font-medium">
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-secondary-200">
                <button className="text-sm text-accent-600 hover:text-accent-700 font-medium">
                  View calendar →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
