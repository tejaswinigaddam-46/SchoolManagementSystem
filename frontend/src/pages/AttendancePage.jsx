import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Users, BarChart } from 'lucide-react'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import { useEffect, useState } from 'react'
import userService from '../services/userService'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../config/permissions'

export default function AttendancePage() {
  const navigate = useNavigate()
  const [showInstructionModal, setShowInstructionModal] = useState(false)
  const { hasPermission } = useAuth()

  const canTakeEventAttendance =
    hasPermission && hasPermission(PERMISSIONS.ATTENDANCE_SAVE_CREATE)
  const canViewUserAttendance =
    hasPermission && hasPermission(PERMISSIONS.USER_ATTENDANCE_DAILY_READ)
  const canViewConsolidatedAttendance =
    hasPermission && hasPermission(PERMISSIONS.CONSOLIDATED_ATTENDANCE_DAILY_READ)
  const canViewMyAttendance =
    hasPermission && hasPermission(PERMISSIONS.MY_ATTENDANCE_READ)

  const handleTakeAttendance = () => {
    if (!canTakeEventAttendance) return
    setShowInstructionModal(true)
  }

  const proceedToTimetable = () => {
    setShowInstructionModal(false)
    navigate('/timetable?mode=attendance')
  }



  return (
    <div className="container-fluid py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900">Attendance Management</h1>
        <p className="text-secondary-600">Track and view attendance for classes and events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {canTakeEventAttendance && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleTakeAttendance}>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">Event Attendance</h2>
              <p className="text-secondary-600">
                Select an event from the timetable to record student attendance
              </p>
            </div>
          </Card>
        )}

        {canViewUserAttendance && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/attendance/user')}>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">User Attendance</h2>
              <p className="text-secondary-600">
                View or record attendance for specific users by role and date
              </p>
            </div>
          </Card>
        )}

        {canViewConsolidatedAttendance && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/attendance/consolidated')}>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <BarChart className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">Consolidated Attendance</h2>
              <p className="text-secondary-600">
                View summary of total present, absent, and holiday days
              </p>
            </div>
          </Card>
        )}

        {canViewMyAttendance && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/attendance/my-attendance')}>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">My Attendance</h2>
              <p className="text-secondary-600">
                View your own daily attendance summary by date range
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Instruction Modal */}
      <Modal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
        title="Take Attendance"
      >
        <div className="space-y-6 p-4">
          <p className="text-secondary-600 text-lg leading-relaxed">
            Please select an event from the Timetable to track attendance.
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <button
              className="btn btn-secondary"
              onClick={() => setShowInstructionModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={proceedToTimetable}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
