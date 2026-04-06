import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { studentService } from '../services/studentService'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PERMISSIONS } from '../config/permissions'

const MyAttendancePage = () => {
  const {
    isStudent,
    isParent,
    getUserName,
    getPrimaryRole,
    hasPermission
  } = useAuth()

  const [fromDate, setFromDate] = useState(() => {
    const today = new Date()
    const past = new Date()
    past.setDate(today.getDate() - 6)
    return past.toISOString().split('T')[0]
  })

  const [toDate, setToDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState([])
  const [selectedChildUsername, setSelectedChildUsername] = useState('')

  const canViewAttendance = hasPermission(PERMISSIONS.MY_ATTENDANCE_READ)

  const loadChildren = async () => {
    try {
      setLoading(true)
      const parentUsername = getUserName()
      if (!parentUsername) {
        toast.error('Parent username not available')
        setLoading(false)
        return
      }

      const res = await studentService.getParentStudents(parentUsername)
      const students = res.data?.students || res.data?.data || res.students || res
      const list = Array.isArray(students) ? students : []
      setChildren(list)

      if (list.length > 0) {
        const first = list[0]
        setSelectedChildUsername(first.username)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load children list')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async (overrideUsername = null, overrideRole = null) => {
    try {
      setLoading(true)
      const username = overrideUsername || getUserName()
      if (!username) {
        toast.error('Username not available')
        setLoading(false)
        return
      }

      let roleForQuery = overrideRole
      if (!roleForQuery) {
        if (isStudent()) {
          roleForQuery = 'Student'
        } else {
          const primaryRole = getPrimaryRole()
          if (!primaryRole) {
            toast.error('User role not available')
            setLoading(false)
            return
          }
          roleForQuery = primaryRole
        }
      }

      const response = await userService.getDailyAttendance({
        roles: [roleForQuery],
        academicYear: null,
        fromDate,
        toDate,
        classId: null,
        sectionId: null
      })

      const list = response.data || response || []
      const all = Array.isArray(list) ? list : list.data || []
      const filtered = Array.isArray(all)
        ? all.filter(r => r.username === username)
        : []

      setRecords(filtered)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load attendance')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canViewAttendance) {
      setLoading(false)
      return
    }

    if (isParent()) {
      loadChildren()
      return
    }

    fetchAttendance()
  }, [canViewAttendance])

  const handleApplyFilter = () => {
    if (!canViewAttendance) return
    if (isParent() && selectedChildUsername) {
      fetchAttendance(selectedChildUsername, 'Student')
    } else {
      fetchAttendance()
    }
  }

  useEffect(() => {
    if (!isParent()) return
    if (!selectedChildUsername) return
    if (!canViewAttendance) return
    fetchAttendance(selectedChildUsername, 'Student')
  }, [selectedChildUsername])

  const summary = useMemo(() => {
    const base = {
      present: 0,
      absent: 0,
      noAttendance: 0,
      holidays: 0
    }
    if (!Array.isArray(records)) return base
    return records.reduce((acc, r) => {
      if (r.is_holiday) {
        acc.holidays += 1
        return acc
      }
      if (r.status === 'Present') acc.present += 1
      else if (r.status === 'Absent') acc.absent += 1
      else acc.noAttendance += 1
      return acc
    }, base)
  }, [records])

  if (loading) return <LoadingSpinner />

  if (!canViewAttendance) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
          You do not have access to view this attendance summary.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>

      {isParent() && (
        <div className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="font-medium text-gray-700">Select Child:</span>
          <select
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedChildUsername}
            onChange={e => setSelectedChildUsername(e.target.value)}
          >
            {children.map(child => (
              <option key={child.username} value={child.username}>
                {child.fullName || `${child.firstName} ${child.lastName}` || child.username}
              </option>
            ))}
            {children.length === 0 && (
              <option value="">No linked students found</option>
            )}
          </select>
        </div>
      )}

      <Card className="p-4 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-gray-700">Date Range</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex flex-col flex-1">
            <label className="text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn btn-primary self-start md:self-auto"
          onClick={handleApplyFilter}
        >
          View Attendance
        </button>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <div className="text-sm text-gray-500">Present Days</div>
            <div className="text-xl font-bold text-gray-900">{summary.present}</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-500" />
          <div>
            <div className="text-sm text-gray-500">Absent Days</div>
            <div className="text-xl font-bold text-gray-900">{summary.absent}</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div>
            <div className="text-sm text-gray-500">No Attendance</div>
            <div className="text-xl font-bold text-gray-900">
              {summary.noAttendance}
            </div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-500" />
          <div>
            <div className="text-sm text-gray-500">Holidays</div>
            <div className="text-xl font-bold text-gray-900">{summary.holidays}</div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Daily Attendance</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Showing {records.length} days</span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No attendance records found for the selected range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Hours
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holiday
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map(record => {
                  const dateObj = new Date(record.attendance_date)
                  const dateLabel = dateObj.toLocaleDateString()
                  const dayLabel = dateObj.toLocaleDateString('en-US', {
                    weekday: 'long'
                  })

                  const statusLabel = record.is_holiday
                    ? 'Holiday'
                    : record.status || 'No Attendance'

                  const statusColor =
                    record.is_holiday || statusLabel === 'Holiday'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : statusLabel === 'Present'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : statusLabel === 'Absent'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'

                  return (
                    <tr key={`${record.username}_${record.attendance_date}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {dateLabel}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {dayLabel}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.duration || '00:00'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.expected_hours || '08:00'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.is_holiday ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default MyAttendancePage
