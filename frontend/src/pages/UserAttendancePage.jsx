import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar as CalendarIcon, Users, BookOpen, Check, Filter } from 'lucide-react'
import Card from '../components/ui/Card'
import { academicService } from '../services/academicService'
import { userService } from '../services/userService'
import { classService } from '../services/classService'
import { sectionService } from '../services/sectionService' // Assuming default export
import { useAuth } from '../contexts/AuthContext'
import AttendanceToggle from '../components/ui/AttendanceToggle'
import { toast } from 'react-hot-toast'

export default function UserAttendancePage() {
  const navigate = useNavigate()
  const { getCampusId } = useAuth()
  
  // State
  const [academicYears, setAcademicYears] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const [loading, setLoading] = useState(true)
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [mode, setMode] = useState('view') // 'view' | 'take'
  const [attendanceDetails, setAttendanceDetails] = useState({}) // { user_id: { login_time, logout_time, total_duration, duration, status } }
  const [editExisting, setEditExisting] = useState(false) // enable editing existing attendances
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const campusId = getCampusId()
        
        // Fetch Academic Years (Distinct Year Names)
        const academicYearsRes = await academicService.getDistinctYearNames(campusId)
        const yearsData = academicYearsRes.data || academicYearsRes || []
        setAcademicYears(yearsData.map(y => ({ label: y.year_name || y, value: y.year_name || y })))

        // Fetch User Roles for dropdown
        const rolesRes = await userService.getDistinctRoles(campusId)
        setAvailableRoles(rolesRes.data || rolesRes || [])
        
        // Fetch Classes
        const classesRes = await classService.getClassesByCampus(campusId)
        // Handle different response structures:
        // 1. Direct array: [...]
        // 2. Wrapped in data: { data: [...] }
        // 3. Wrapped in data.classes: { data: { classes: [...] } }
        let classesData = [];
        if (Array.isArray(classesRes)) {
            classesData = classesRes;
        } else if (classesRes?.data?.classes && Array.isArray(classesRes.data.classes)) {
            classesData = classesRes.data.classes;
        } else if (Array.isArray(classesRes?.data)) {
            classesData = classesRes.data;
        }
        setClasses(classesData)

      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getCampusId])

  // Fetch Sections when Class changes
  useEffect(() => {
    const fetchSections = async () => {
      if (selectedClass) {
        try {
          const res = await sectionService.getAllSections({ class_id: selectedClass })
          // Handle response structure where data might be nested in { sections: [...] }
          let sectionsData = [];
          if (res?.data?.sections && Array.isArray(res.data.sections)) {
             sectionsData = res.data.sections;
          } else if (Array.isArray(res?.data)) {
             sectionsData = res.data;
          } else if (Array.isArray(res)) {
             sectionsData = res;
          }
          setSections(sectionsData)
        } catch (error) {
          console.error("Failed to fetch sections", error)
          setSections([])
        }
      } else {
        setSections([])
      }
    }
    fetchSections()
  }, [selectedClass])

  const toggleRole = (role) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role))
    } else {
      setRoles([...roles, role])
    }
  }

  const calculateTimeDiff = (start, end) => {
    if (!start || !end) return { str: '00:00', minutes: 0 }
    const [h1, m1] = start.split(':').map(Number)
    const [h2, m2] = end.split(':').map(Number)
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (diff < 0) diff = 0 // Negative duration? 
    
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return { 
        str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        minutes: diff
    }
  }

  const calculateStatus = (presentMins, totalStr) => {
    if (!totalStr) return 'Absent'
    const [h, m] = totalStr.split(':').map(Number)
    const totalMins = h * 60 + m
    if (totalMins === 0) return 'Absent'
    return (presentMins / totalMins) >= 0.5 ? 'Present' : 'Absent'
  }

  const handleAttendanceChange = (recordKey, field, value) => {
    setAttendanceDetails(prev => {
        const current = prev[recordKey] || { total_duration: '08:00', login_time: '', logout_time: '', duration: '00:00', status: 'Absent' }
        const updated = { ...current, [field]: value }
        
        // Recalculate
        if (field === 'login_time' || field === 'logout_time' || field === 'total_duration') {
            const login = field === 'login_time' ? value : updated.login_time
            const logout = field === 'logout_time' ? value : updated.logout_time
            const total = field === 'total_duration' ? value : updated.total_duration
            
            const { str, minutes } = calculateTimeDiff(login, logout)
            updated.duration = str
            
            // Only update status if we have both login and logout times
            if (login && logout) {
                updated.status = calculateStatus(minutes, total)
            } else {
                updated.status = 'No Attendance'
            }
        }
        
        return { ...prev, [recordKey]: updated }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
        setLoading(true)
          if (roles.length === 0) {
            toast.error("Please select at least one user role")
            return
          }
          
          let fetchedUsers = [];
          
          if (mode === 'take') {
              // 1. Check if only Students
              const onlyStudents = roles.length === 1 && roles[0].toLowerCase() === 'student'
              if (onlyStudents) {
                  setUsers([])
                  setShowResults(true)
                  return // Don't fetch
              }
              
              // 2. Check if mixed (Students + Others)
              // Filter out 'Student' role
              const rolesToFetch = roles.filter(r => r.toLowerCase() !== 'student')
              
              if (rolesToFetch.length > 0) {
                  // Use getDailyAttendance to get records for the range
                  const response = await userService.getDailyAttendance({
                      roles: rolesToFetch,
                      academicYear: selectedAcademicYear,
                      fromDate,
                      toDate,
                      classId: selectedClass,
                      sectionId: selectedSection
                  })
                  fetchedUsers = response.data || []
              }
              
              const initial = {}
              fetchedUsers.forEach(u => {
                const formatTime = (t) => t ? String(t).substring(0, 5) : ''
                
                // u.total_duration and u.duration come formatted from backend as HH:MM
                let totalDur = formatTime(u.total_duration)
                // Default to 08:00 if missing or 00:00
                if (!totalDur || totalDur === '00:00') {
                    totalDur = '08:00'
                }

                const actualDur = formatTime(u.duration) || '00:00'
                
                const dateKey = new Date(u.attendance_date).toLocaleDateString('en-CA')
                const key = `${u.user_id}_${dateKey}`
                
                const isExisting = u.status && u.status !== 'No Attendance'
                const status = (!u.status || u.status === 'No Attendance') ? 'No Attendance' : u.status

                initial[key] = {
                    login_time: formatTime(u.login_time),
                    logout_time: formatTime(u.logout_time),
                    total_duration: totalDur,
                    duration: actualDur,
                    status: status,
                    isExisting: isExisting
                }
              })
              setAttendanceDetails(initial)
          } else {
              // View Mode
              const response = await userService.getDailyAttendance({
                  roles,
                  academicYear: selectedAcademicYear,
                  fromDate,
                  toDate,
                  classId: selectedClass,
                  sectionId: selectedSection
              })
              fetchedUsers = response.data || []
          }

          setUsers(fetchedUsers)
          setCurrentPage(1)
          setShowResults(true)

    } catch (error) {
        console.error("Failed to fetch users", error)
        toast.error("Failed to fetch users")
    } finally {
        setLoading(false)
    }
  }

  const formatMinutes = (mins) => {
    if (mins == null) return '-'
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h <= 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const isStudentSelected = roles.some(r => r.toLowerCase().includes('student'))

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(users.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const formatDurationDisplay = (val) => {
      if (!val) return '-'
      if (typeof val === 'string') return val
      if (typeof val === 'object') {
          if (val.hours !== undefined || val.minutes !== undefined) {
              const h = val.hours || 0
              const m = val.minutes || 0
              return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          }
          return JSON.stringify(val)
      }
      return String(val)
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-secondary-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">User Attendance</h1>
            <p className="text-secondary-600 mt-1">Select criteria to view or record user attendance</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <Card className="shadow-lg border border-secondary-200">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode selector */}
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-secondary-700">Action</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={`py-2 px-3 rounded-lg border ${mode === 'view' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-secondary-800 border-secondary-300'}`}
                        onClick={() => setMode('view')}
                      >
                        View Attendance
                      </button>
                      <button
                        type="button"
                        className={`py-2 px-3 rounded-lg border ${mode === 'take' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-secondary-800 border-secondary-300'}`}
                        onClick={() => setMode('take')}
                      >
                        Take Attendance
                      </button>
                    </div>
                  </div>

              </div>

              {/* Academic Year Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-secondary-700">
                  Academic Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-secondary-400" />
                  </div>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* User Roles Multi-Select */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-semibold text-secondary-700">
                  User Roles
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-white border border-secondary-300 rounded-lg py-2 pl-3 pr-10 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    onClick={() => setIsRolesDropdownOpen(!isRolesDropdownOpen)}
                  >
                    <span className="flex items-center">
                      <Users className="h-5 w-5 text-secondary-400 mr-2" />
                      <span className="block truncate">
                        {roles.length > 0 
                          ? `${roles.length} selected` 
                          : "Select User Roles"}
                      </span>
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>

                  {isRolesDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {availableRoles.map((role) => (
                        <div
                          key={role}
                          className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 ${roles.includes(role) ? 'text-primary-900 bg-primary-50' : 'text-secondary-900'}`}
                          onClick={() => toggleRole(role)}
                        >
                          <div className="flex items-center">
                            <span className={`block truncate ${roles.includes(role) ? 'font-semibold' : 'font-normal'}`}>
                              {role}
                            </span>
                          </div>
                          {roles.includes(role) && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Selected tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {roles.map(role => (
                    <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {role}
                      <button
                        type="button"
                        onClick={() => toggleRole(role)}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
                      >
                        <span className="sr-only">Remove {role}</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Class and Section Filters (Only for Students) */}
              {isStudentSelected && mode === 'view' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="block text-sm font-semibold text-secondary-700">Class (Optional)</label>
                          <select
                              value={selectedClass}
                              onChange={(e) => {
                                  setSelectedClass(e.target.value)
                                  setSelectedSection('') // Reset section when class changes
                              }}
                              className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          >
                              <option value="">All Classes</option>
                              {classes.map(c => (
                                  <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="block text-sm font-semibold text-secondary-700">Section (Optional)</label>
                          <select
                              value={selectedSection}
                              onChange={(e) => setSelectedSection(e.target.value)}
                              className="block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                              disabled={!selectedClass}
                          >
                              <option value="">All Sections</option>
                              {sections.map(s => (
                                  <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                              ))}
                          </select>
                      </div>
                  </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-secondary-700">
                      From Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-secondary-700">
                      To Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Proceed'}
                </button>
              </div>

            </form>
          </div>
        </Card>
      </div>

      {showResults && (
        <Card className="shadow-lg border border-secondary-200 animate-fade-in">
            <div className="p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">
                  {mode === 'view' ? `Users List (${users.length})` : `Take Attendance (${users.length})`}
                </h2>

                {mode === 'take' && (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-secondary-700">Edit existing attendances</span>
                      <AttendanceToggle
                        checked={editExisting}
                        onChange={() => setEditExisting(!editExisting)}
                        labelLeft="Off"
                        labelRight="On"
                      />
                    </div>
                  </div>
                )}

                {/* Warning Messages */}
                {mode === 'take' && roles.some(r => r.toLowerCase() === 'student') && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    {roles.length === 1 && roles[0].toLowerCase() === 'student' 
                                        ? "Student attendance should be taken through events only." 
                                        : "Student attendance should be taken through events only. Displaying other roles attendance."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {(mode !== 'take' || !(roles.length === 1 && roles[0].toLowerCase() === 'student')) && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                              Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Role
                        </th>
                        {mode === 'view' && (
                            <>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Total Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Login Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Logout Time
                                </th>
                            </>
                        )}
                        
                        {mode === 'take' ? (
                            <>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Total Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Login Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Logout Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </>
                        ) : (
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Status
                             </th>
                        )}


                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 text-center text-sm text-secondary-500">
                            No users found for the selected criteria
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((user, idx) => {
                          const dateKey = new Date(user.attendance_date).toLocaleDateString('en-CA')
                          const key = `${user.user_id}_${dateKey}`
                          const isExisting = attendanceDetails[key]?.isExisting
                          const currentStatus = attendanceDetails[key]?.status || 'No Attendance'

                          return (
                          <tr key={key} className="hover:bg-secondary-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                <div>{new Date(user.attendance_date).toLocaleDateString()}</div>
                                <div className="text-xs text-secondary-500">
                                    {new Date(user.attendance_date).toLocaleDateString('en-US', { weekday: 'long' })}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                                  {user.first_name?.[0] || user.username?.[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-secondary-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-xs text-secondary-500">
                                    {user.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                                {user.role}
                              </span>
                            </td>
                            
                            {mode === 'view' && (
                                <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                        {formatDurationDisplay(user.duration)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                        {formatDurationDisplay(user.total_duration)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                        {user.login_time || '00:00:00'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                        {user.logout_time || '00:00:00'}
                                    </td>
                                </>
                            )}

                            {mode === 'take' ? (
                                <>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="time" 
                                            value={attendanceDetails[key]?.total_duration || '08:00'}
                                            onChange={(e) => handleAttendanceChange(key, 'total_duration', e.target.value)}
                                            className={`block w-24 px-2 py-1 border border-secondary-300 rounded-md text-sm ${isExisting && !editExisting ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                            disabled={isExisting && !editExisting}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="time" 
                                            value={attendanceDetails[key]?.login_time || ''}
                                            onChange={(e) => handleAttendanceChange(key, 'login_time', e.target.value)}
                                            className={`block w-32 px-2 py-1 border border-secondary-300 rounded-md text-sm ${isExisting && !editExisting ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                            disabled={isExisting && !editExisting}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="time" 
                                            value={attendanceDetails[key]?.logout_time || ''}
                                            onChange={(e) => handleAttendanceChange(key, 'logout_time', e.target.value)}
                                            className={`block w-32 px-2 py-1 border border-secondary-300 rounded-md text-sm ${isExisting && !editExisting ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                            disabled={isExisting && !editExisting}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                        {attendanceDetails[key]?.duration || '00:00'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            currentStatus === 'Present' 
                                                ? 'bg-green-100 text-green-800' 
                                                : currentStatus === 'Absent'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {currentStatus}
                                        </span>
                                    </td>
                                </>
                            ) : (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.status === 'Present' 
                                        ? 'bg-green-100 text-green-800' 
                                        : user.status === 'Absent' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {user.status || 'No Attendance'}
                                    </span>
                                </td>
                            )}


                          </tr>
                        )})
                      )}
                    </tbody>
                  </table>
                </div>
                )}

                {/* Pagination */}
                {users.length > itemsPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, users.length)}</span> of <span className="font-medium">{users.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    {/* Page Numbers */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
                                         if (totalPages > 10 && Math.abs(currentPage - number) > 2 && number !== 1 && number !== totalPages) {
                                            if (Math.abs(currentPage - number) === 3) return <span key={number} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>;
                                            return null;
                                         }

                                         return (
                                            <button
                                                key={number}
                                                onClick={() => paginate(number)}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === number ? 'bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                                            >
                                                {number}
                                            </button>
                                         );
                                    })}

                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'take' && users.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      onClick={async () => {
                        try {
                          const attendanceDataByDate = {};
                          let hasRecords = false;

                          users.forEach(u => {
                              if (u.role === 'Student') return; // Skip students

                              // Skip existing if edit not enabled
                              // u.status comes from DB (getDailyAttendance)
                              if (!editExisting && (u.status === 'Present' || u.status === 'Absent')) {
                                return
                              }
                              
                              const dateKey = new Date(u.attendance_date).toLocaleDateString('en-CA')
                              const key = `${u.user_id}_${dateKey}`
                              const details = attendanceDetails[key]
                              
                              if (!details) return;
                              
                              if (!attendanceDataByDate[dateKey]) {
                                  attendanceDataByDate[dateKey] = [];
                              }
                              
                              attendanceDataByDate[dateKey].push({
                                username: u.username,
                                role: u.role,
                                status: details.status || 'Absent',
                                duration: details.duration,
                                total_duration: details.total_duration,
                                login_time: details.login_time,
                                logout_time: details.logout_time
                              });
                              hasRecords = true;
                          });

                          if (!hasRecords) {
                              toast.info("No records to save or edit not enabled for existing records")
                              return
                          }

                          // Save for each date sequentially to avoid race conditions or DB locks
                          for (const date of Object.keys(attendanceDataByDate)) {
                              await userService.saveUserAttendance(
                                date,
                                selectedAcademicYear,
                                attendanceDataByDate[date]
                              );
                          }

                          toast.success('Attendance saved successfully');
                          // Refresh data
                          handleSubmit(new Event('submit'));
                        } catch (error) {
                          console.error('Error saving attendance:', error);
                          toast.error('Failed to save attendance');
                        }
                      }}
                    >
                      Save Attendance
                    </button>
                  </div>
                )}
            </div>
        </Card>
      )}
    </div>
  )
}