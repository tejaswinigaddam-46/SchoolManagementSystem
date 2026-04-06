import React, { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import { academicService } from '../services/academicService'
import { payrollService } from '../services/payrollService'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Calendar as CalendarIcon, BookOpen, Download } from 'lucide-react'

export default function MyPayrollPage() {
  const { getCampusId } = useAuth()

  const [academicYears, setAcademicYears] = useState([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [payrollData, setPayrollData] = useState([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const campusId = getCampusId()
        const academicYearsRes = await academicService.getDistinctYearNames(campusId)
        const yearsData = academicYearsRes.data || academicYearsRes || []
        setAcademicYears(yearsData.map(y => ({ label: y.year_name || y, value: y.year_name || y })))
      } catch (error) {
        console.error('Failed to fetch academic years', error)
        toast.error('Failed to load academic years')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getCampusId])

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      setLoading(true)
      const response = await payrollService.getMyPayrollReport({
        academicYear: selectedAcademicYear,
        fromDate,
        toDate
      })

      const data = response.data || response || []
      const list = Array.isArray(data) ? data : []
      setPayrollData(list)
      setShowResults(true)
    } catch (error) {
      console.error('Failed to fetch my payroll data', error)
      toast.error('Failed to fetch payroll data')
      setPayrollData([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!Array.isArray(payrollData) || payrollData.length === 0) return

    const headers = ['User', 'Payroll Days', 'Absent Days', 'Leaves', 'Daily Pay', 'Total Pay']
    const rows = payrollData.map(user => [
      `"${user.first_name} ${user.last_name}"`,
      user.payroll_days,
      user.absent_days,
      user.leave_days,
      user.daily_pay,
      user.total_pay
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `My_Payroll_${fromDate}_to_${toDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">My Payroll</h1>
        <p className="text-secondary-600 mt-1">View your payroll summary for a selected period</p>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <Card className="shadow-lg border border-secondary-200">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-secondary-700">Academic Year</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-secondary-400" />
                  </div>
                  <select
                    value={selectedAcademicYear}
                    onChange={e => setSelectedAcademicYear(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">From Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">To Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Get My Payroll'}
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {showResults && (
        <Card className="shadow-lg border border-secondary-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-secondary-900">Payroll Summary</h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Payroll Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Absent Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Leaves
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Daily Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {payrollData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-secondary-500"
                      >
                        No payroll data found for the selected criteria
                      </td>
                    </tr>
                  ) : (
                    payrollData.map(user => (
                      <tr
                        key={user.user_id || user.username}
                        className="hover:bg-secondary-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                              {user.first_name?.[0] || user.username?.[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-secondary-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-xs text-secondary-500">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {user.payroll_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          {user.absent_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {user.leave_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.daily_pay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                          ₹{user.total_pay}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

