import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar as CalendarIcon, Users, BookOpen, Check, Filter, Download } from 'lucide-react'
import Card from '../components/ui/Card'
import { academicService } from '../services/academicService'
import { userService } from '../services/userService'
import { classService } from '../services/classService'
import { sectionService } from '../services/sectionService'
import { holidayService } from '../services/holidayService'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'


export default function ConsolidatedAttendancePage() {
  const navigate = useNavigate()
  const { getCampusId } = useAuth()
  
  // State
  const [academicYears, setAcademicYears] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const [loading, setLoading] = useState(true)
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false)
  
  // Consolidated Data
  const [consolidatedData, setConsolidatedData] = useState([]) // Array of user stats
  const [showResults, setShowResults] = useState(false)
  const [holidaysCount, setHolidaysCount] = useState(0)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const campusId = getCampusId()
        
        // Fetch Academic Years
        const academicYearsRes = await academicService.getDistinctYearNames(campusId)
        const yearsData = academicYearsRes.data || academicYearsRes || []
        setAcademicYears(yearsData.map(y => ({ label: y.year_name || y, value: y.year_name || y })))

        // Fetch User Roles
        const rolesRes = await userService.getDistinctRoles(campusId)
        setAvailableRoles(rolesRes.data || rolesRes || [])
        
        // Fetch Classes
        const classesRes = await classService.getClassesByCampus(campusId)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
        setLoading(true)
        if (roles.length === 0) {
            toast.error("Please select at least one user role")
            return
        }
        
        // Fetch Attendance Records
        // The backend now handles complex holiday logic and returns 'is_holiday' per record
        const response = await userService.getDailyAttendance({
            roles,
            academicYear: selectedAcademicYear,
            fromDate,
            toDate,
            classId: selectedClass,
            sectionId: selectedSection
        })
        const fetchedRecords = response.data || []
        
        // Process Data
        // Group by User
        const userMap = {}
        
        fetchedRecords.forEach(record => {
            const userId = record.user_id
            if (!userMap[userId]) {
                userMap[userId] = {
                    user_id: userId,
                    username: record.username,
                    first_name: record.first_name,
                    last_name: record.last_name,
                    role: record.role,
                    present: 0,
                    absent: 0,
                    no_attendance: 0,
                    holidays: 0,
                    leaves_pending: record.leaves_pending || 0,
                    leaves_approved: record.leaves_approved || 0
                }
            }
            
            // Check status using backend flags
            if (record.is_holiday) {
                userMap[userId].holidays += 1
            } else {
                const status = record.status
                if (status === 'Present') {
                    userMap[userId].present += 1
                } else if (status === 'Absent') {
                    userMap[userId].absent += 1
                } else {
                    // Status is 'No Attendance' or null or undefined
                    userMap[userId].no_attendance += 1
                }
            }
        })

        setConsolidatedData(Object.values(userMap))
        setCurrentPage(1)
        setShowResults(true)

    } catch (error) {
        console.error("Failed to fetch consolidated data", error)
        toast.error("Failed to fetch data")
    } finally {
        setLoading(false)
    }
  }

  const isStudentSelected = roles.some(r => r.toLowerCase().includes('student'))

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = consolidatedData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(consolidatedData.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const handleExport = () => {
    // CSV Export
    const headers = ['User', 'Role', 'Total Present', 'Total Absent', 'No Attendance', 'Holidays']
    const rows = consolidatedData.map(user => [
        `"${user.first_name} ${user.last_name}"`,
        user.role,
        user.present,
        user.absent,
        user.no_attendance,
        user.holidays
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Consolidated_Attendance_${fromDate}_to_${toDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <h1 className="text-3xl font-bold text-secondary-900">Consolidated Attendance</h1>
            <p className="text-secondary-600 mt-1">View summary of attendance records</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <Card className="shadow-lg border border-secondary-200">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
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
              {isStudentSelected && (
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
                  {loading ? 'Loading...' : 'Get Consolidated Report'}
                </button>
              </div>

            </form>
          </div>
        </Card>
      </div>

      {showResults && (
        <Card className="shadow-lg border border-secondary-200 animate-fade-in">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-secondary-900">
                      Attendance Summary ({consolidatedData.length})
                    </h2>
                    <button 
                        onClick={handleExport}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Total Present
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Total Absent
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Total No Attendance
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Total Holidays
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Total pending Leaves 
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Total approved Leaves
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {consolidatedData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-secondary-500">
                            No data found for the selected criteria
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((user) => (
                          <tr key={user.user_id} className="hover:bg-secondary-50 transition-colors">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                {user.present}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                {user.absent}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.no_attendance}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                {user.holidays}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                {user.leaves_pending}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {user.leaves_approved}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 gap-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`px-3 py-1 rounded border ${currentPage === i + 1 ? 'bg-primary-600 text-white' : 'border-secondary-300'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
            </div>
        </Card>
      )}
    </div>
  )
}
