import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, Users, GraduationCap, Clock } from 'lucide-react'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { classService } from '../services/classService'
import sectionService from '../services/sectionService'
import { academicService } from '../services/academicService'
import studentService from '../services/studentService'
import teacherService from '../services/teacherService'
import { attendanceService } from '../services/attendanceService'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export default function AttendanceEntryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { event } = location.state || {}
  const { getCampusId } = useAuth()

  const [loading, setLoading] = useState(false)
  const [academicYearInfo, setAcademicYearInfo] = useState(null)
  
  // Targets: Array of { id, label, type, classId, sectionId, ... }
  const [targets, setTargets] = useState([])
  const [selectedTargetId, setSelectedTargetId] = useState('')
  
  // Data State
  const [people, setPeople] = useState([]) // Students or Teachers
  const [primaryTeacher, setPrimaryTeacher] = useState(null) // For Student view
  const [showAttendanceList, setShowAttendanceList] = useState(false)
  
  // Attendance State
  // Format: { [uniqueId]: 'Present' | 'Absent' }
  const [attendanceData, setAttendanceData] = useState({})
  
  // Duration State
  // Format: { [uniqueId]: number } (hours)
  const [attendanceDuration, setAttendanceDuration] = useState({})
  
  // Parent Selection State: { [studentId]: [parentUserId1, parentUserId2] } - Multi-select
  const [selectedParents, setSelectedParents] = useState({})
  
  const [saving, setSaving] = useState(false)
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })

  // Calculate default event duration in hours
  const calculateEventDuration = () => {
    if (!event) return 0;
    
    const parseDate = (dateStr) => {
         if (!dateStr) return null;
         // Try direct parsing
         let d = new Date(dateStr);
         if (!isNaN(d.getTime())) return d;
         
         // Try replacing space with T (Postgres format compatibility)
         if (typeof dateStr === 'string') {
             d = new Date(dateStr.replace(' ', 'T'));
             if (!isNaN(d.getTime())) return d;
         }
         return null;
     };
 
     // Priority: 1. Pre-parsed Date objects (from Timetable) 2. timestamp fields 3. time fields 4. date fields
     let start = (event.start instanceof Date && !isNaN(event.start)) ? event.start : 
                 parseDate(event.start_timestamp || event.start_time || event.start_date);
     
     let end = (event.end instanceof Date && !isNaN(event.end)) ? event.end : 
               parseDate(event.end_timestamp || event.end_time || event.end_date);
     
     if (!start || !end) {
         console.warn("Invalid event timestamps for duration calculation", event);
         return 0;
     }
 
     const diff = end - start;
     const hours = diff / (1000 * 60 * 60);
     return Math.max(0, parseFloat(hours.toFixed(2)));
   }

  const defaultDuration = calculateEventDuration();

  // Determine default status based on event type
  const getEventDefaultStatus = () => {
    if (!event || !event.event_type) return 'Absent'
    
    // Map defined by requirements
    // Keys: Event Types
    // Values: The status we want to STORE (The Exception)
    // 
    // If Map Value is 'Absent':
    //   - We track Absences.
    //   - Implicit Default is 'Present'.
    //   - So we return 'Present' as the initial state.
    //
    // If Map Value is 'Present':
    //   - We track Presence.
    //   - Implicit Default is 'Absent'.
    //   - So we return 'Absent' as the initial state.

    const storedStatusMap = {
        'Class Lecture': 'Absent',
        'Exam': 'Absent',
        'Lab Session': 'Absent',
        'Field Trip': 'Present',
        'Study Hall': 'Present',
        'Holiday': 'Present',
        'School Event': 'Present',
        'Meeting': 'Present',
        'Parent-Teacher Meet': 'Present'
    }

    const storedStatus = storedStatusMap[event.event_type] || 'Present' // Default to tracking Present

    if (storedStatus === 'Absent') {
        return 'Present'
    } else {
        return 'Absent'
    }
  }

  const defaultStatus = getEventDefaultStatus();

  useEffect(() => {
    if (!event) {
      navigate('/attendance')
      return
    }
    fetchAcademicYear()
    initializeTargets()
  }, [event, navigate])

  const fetchAcademicYear = async () => {
    if (!event.academic_year_id) return
    try {
      const response = await academicService.getAcademicYearById(getCampusId(), event.academic_year_id)
      setAcademicYearInfo(response.data || response)
    } catch (error) {
      console.error("Failed to fetch academic year details", error)
    }
  }

  const initializeTargets = async () => {
    setLoading(true)
    try {
      const campusId = getCampusId()
      const audience = event.audience_target
      const newTargets = []

      // Helper to process targets
      const targetsList = Array.isArray(audience) ? audience : [audience]
      
      // 1. Check for Class/Section Targets
      const classTargets = targetsList.filter(t => t.target_type === 'Class')
      const sectionTargets = targetsList.filter(t => t.target_type === 'Section')
      
      const isParentTargeted = targetsList.some(t => 
        t.target_type === 'Parent' || 
        (t.target_type === 'Role' && t.target_ids?.includes('Parent')) ||
        (Array.isArray(t.roles_to_notify) && t.roles_to_notify.includes('Parent'))
      )

      const isTeacherTargeted = targetsList.some(t => 
        t.target_type === 'Teacher' || 
        (t.target_type === 'Role' && t.target_ids?.includes('Teacher')) ||
        (Array.isArray(t.roles_to_notify) && t.roles_to_notify.includes('Teacher'))
      )
      
      if (classTargets.length > 0 || sectionTargets.length > 0) {
        const classesRes = await classService.getClassesByCampus(campusId)
        const allClasses = classesRes.data?.classes || []
        
        // Optimization: Fetch all sections once instead of per class to avoid N+1 requests
        let allSections = []
        try {
           const allSectionsRes = await sectionService.getAllSections({
             academic_year_id: event.academic_year_id,
             limit: 2000
           })
           allSections = allSectionsRes.data?.sections || []
        } catch (err) {
           console.error("Failed to fetch all sections", err)
        }
        
        for (const cls of allClasses) {
          const isClassTargeted = classTargets.some(t => {
            const ids = (Array.isArray(t.target_ids) ? t.target_ids : []).map(String)
            return ids.includes(String(cls.class_id))
          })

          const sections = allSections.filter(s => String(s.class_id) === String(cls.class_id))
            
          sections.forEach(sec => {
               let isIncluded = false
               if (isClassTargeted) isIncluded = true
               
               if (!isIncluded) {
                 const isSectionTargeted = sectionTargets.some(t => {
                    const ids = (Array.isArray(t.target_ids) ? t.target_ids : []).map(String)
                    return ids.includes(String(sec.section_id))
                 })
                 if (isSectionTargeted) isIncluded = true
               }
               
               if (isIncluded) {
                 if (!isParentTargeted) {
                    newTargets.push({
                      id: `stu_${cls.class_id}_${sec.section_id}`,
                      label: `${cls.class_name} - ${sec.section_name} (Students)`,
                      type: 'student',
                      classId: cls.class_id,
                      sectionId: sec.section_id,
                      className: cls.class_name,
                      sectionName: sec.section_name
                    })
                 }
                 
                 if (isParentTargeted) {
                   newTargets.push({
                     id: `par_${cls.class_id}_${sec.section_id}`,
                     label: `${cls.class_name} - ${sec.section_name} (Parents & Students)`,
                     type: 'parent',
                     classId: cls.class_id,
                     sectionId: sec.section_id,
                     className: cls.class_name,
                     sectionName: sec.section_name
                   })
                 }
                 
                 if (isTeacherTargeted) {
                   newTargets.push({
                     id: `tch_${cls.class_id}_${sec.section_id}`,
                     label: `${cls.class_name} - ${sec.section_name} (Teachers)`,
                     type: 'teacher',
                     classId: cls.class_id,
                     sectionId: sec.section_id,
                     className: cls.class_name,
                     sectionName: sec.section_name
                   })
                 }
               }
          })
        }
      }
      
      if (isTeacherTargeted && classTargets.length === 0 && sectionTargets.length === 0) {
         newTargets.push({
           id: 'teachers_all',
           label: 'All Teachers',
           type: 'teacher_global'
         })
      }
      
      setTargets(newTargets)

    } catch (error) {
      console.error("Failed to initialize targets", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTargetChange = (e) => {
    const targetId = e.target.value
    setSelectedTargetId(targetId)
    setShowAttendanceList(false)
    setPeople([])
    setAttendanceData({})
    setAttendanceDuration({})
    setSelectedParents({})
    
    if (targetId) {
      fetchPeople(targetId)
    }
  }

  const fetchPeople = async (targetId) => {
    const target = targets.find(t => t.id === targetId)
    if (!target) return

    setLoading(true)
    try {
      if (target.type === 'student' || target.type === 'parent') {
        const studentsRes = await studentService.getStudentsByFilters({
          academic_year_id: event.academic_year_id,
          class_id: target.classId,
          assignment_status: 'assigned',
          campus_id: getCampusId(),
          include_parents: target.type === 'parent'
        })
        
        const responseData = studentsRes.data || studentsRes || {}
        const allAssignedStudents = Array.isArray(responseData) ? responseData : (responseData.students || [])
        
        const studentsList = allAssignedStudents.filter(s => 
          String(s.section_id) === String(target.sectionId)
        )
        
        setPeople(studentsList)
        
        const initialAttendance = {}
        const initialDuration = {}
        const initialSelectedParents = {}
        
        studentsList.forEach(s => {
          initialAttendance[s.user_id] = defaultStatus
          initialDuration[s.user_id] = defaultStatus === 'Present' ? defaultDuration : 0
          
          if (target.type === 'parent') {
             initialAttendance[`parent_${s.user_id}`] = defaultStatus
             initialDuration[`parent_${s.user_id}`] = defaultStatus === 'Present' ? defaultDuration : 0
             
             if (s.parents && s.parents.length > 0) {
               initialSelectedParents[s.user_id] = s.parents.map(p => p.user_id)
               s.parents.forEach(p => {
                 initialAttendance[`parent_${s.user_id}_${p.user_id}`] = defaultStatus
                 initialDuration[`parent_${s.user_id}_${p.user_id}`] = defaultStatus === 'Present' ? defaultDuration : 0
               })
             }
          }
        })
        
        if (event.event_id) {
          try {
            const existingRes = await attendanceService.getAttendance({ eventId: event.event_id })
            const existingData = existingRes.data || existingRes || []
            if (Array.isArray(existingData)) {
              existingData.forEach(record => {
                const pid = record.studentId
                if (target.type !== 'parent') {
                  initialAttendance[pid] = record.status
                  initialDuration[pid] = record.actualPresentHours
                } else {
                  if (record.remarks === 'Student Attendance') {
                    initialAttendance[pid] = record.status
                    initialDuration[pid] = record.actualPresentHours
                  } else {
                    const student = studentsList.find(s => s.parents?.some(p => p.user_id === pid))
                    if (student) {
                      const key = `parent_${student.user_id}_${pid}`
                      initialAttendance[key] = record.status
                      initialDuration[key] = record.actualPresentHours
                      if (!initialSelectedParents[student.user_id]) initialSelectedParents[student.user_id] = []
                      if (!initialSelectedParents[student.user_id].includes(pid)) {
                        initialSelectedParents[student.user_id].push(pid)
                      }
                    }
                  }
                }
              })
            }
          } catch (e) { console.warn("No existing attendance found", e) }
        }

        setAttendanceData(initialAttendance)
        setAttendanceDuration(initialDuration)
        setSelectedParents(initialSelectedParents)
        
        try {
          const sectionRes = await sectionService.getSectionById(target.sectionId)
          const sectionData = sectionRes.data || sectionRes
          if (sectionData.primary_teacher) {
            setPrimaryTeacher(sectionData.primary_teacher)
          } else if (sectionData.primary_teacher_user_id) {
            setPrimaryTeacher({ 
              first_name: sectionData.primary_teacher_name || 'Unknown', 
              last_name: '' 
            })
          } else {
            setPrimaryTeacher(null)
          }
        } catch (e) { console.error("Error fetching section teacher", e) }

      } else if (target.type === 'teacher') {
        try {
            const sectionRes = await sectionService.getSectionById(target.sectionId)
            const sectionData = sectionRes.data || sectionRes
            const teachers = []
            
             if (sectionData.primary_teacher_user_id) {
                 teachers.push({
                     user_id: sectionData.primary_teacher_user_id,
                     first_name: sectionData.primary_teacher_first_name || 'Primary',
                     last_name: sectionData.primary_teacher_last_name || 'Teacher',
                     role_display: 'Primary Teacher'
                 })
             }
             
             try {
                 const subjectsRes = await sectionService.getSectionSubjects(target.sectionId)
                 if (subjectsRes.data) {
                     subjectsRes.data.forEach(sub => {
                         if (sub.teacher_user_id && sub.teacher_name) {
                             if (!teachers.find(t => t.user_id === sub.teacher_user_id)) {
                                 const [first, ...last] = sub.teacher_name.split(' ')
                                 teachers.push({
                                     user_id: sub.teacher_user_id,
                                     first_name: first,
                                     last_name: last.join(' '),
                                     role_display: sub.subject_name
                                 })
                             }
                         }
                     })
                 }
             } catch (err) {
                 console.warn("Could not fetch subject teachers", err)
             }
             
             setPeople(teachers)
            
            const initialAttendance = {}
            const initialDuration = {}
            teachers.forEach(t => {
               const id = t.user?.user_id || t.user_id || t.id
               if (id) {
                 initialAttendance[id] = 'Present'
                 initialDuration[id] = defaultDuration
               }
            })

            if (event.event_id) {
                try {
                    const existingRes = await attendanceService.getAttendance({ eventId: event.event_id })
                    const existingData = existingRes.data || existingRes || []
                     if (Array.isArray(existingData)) {
                        existingData.forEach(record => {
                             initialAttendance[record.studentId] = record.status;
                             initialDuration[record.studentId] = record.actualPresentHours;
                        })
                     }
                } catch (e) { console.warn("No existing attendance found", e) }
            }

            setAttendanceData(initialAttendance)
            setAttendanceDuration(initialDuration)
            setPrimaryTeacher(null)
        } catch (e) {
            console.error("Error fetching section teacher", e)
        }

      } else if (target.type === 'teacher_global') {
        const teachers = await teacherService.getAllTeachers()
        setPeople(teachers)
        
        const initialAttendance = {}
        const initialDuration = {}
        teachers.forEach(t => {
           const id = t.user?.user_id || t.user_id || t.id
           if (id) {
             initialAttendance[id] = 'Present'
             initialDuration[id] = defaultDuration
           }
        })

        if (event.event_id) {
            try {
                const existingRes = await attendanceService.getAttendance({ eventId: event.event_id })
                const existingData = existingRes.data || existingRes || []
                 if (Array.isArray(existingData)) {
                    existingData.forEach(record => {
                         initialAttendance[record.studentId] = record.status;
                         initialDuration[record.studentId] = record.actualPresentHours;
                    })
                 }
            } catch (e) { console.warn("No existing attendance found", e) }
        }

        setAttendanceData(initialAttendance)
        setAttendanceDuration(initialDuration)
        setPrimaryTeacher(null)
      }
      
      setShowAttendanceList(true)
    } catch (error) {
      console.error("Failed to fetch people", error)
      toast.error("Error loading list. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = (id) => {
    // Robustly determine next status based on current state (defaulting to defaultStatus if not yet tracked)
    const currentStatus = attendanceData[id] || defaultStatus
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present'

    // Update Status
    setAttendanceData(prev => ({
      ...prev,
      [id]: nextStatus
    }))

    // Update Duration based on the NEXT status
    // If switching to Present -> Set to defaultDuration
    // If switching to Absent -> Set to 0
    // User can still manually edit this value afterwards
    setAttendanceDuration(prev => ({
      ...prev,
      [id]: nextStatus === 'Present' ? defaultDuration : 0
    }))
  }

  const handleDurationChange = (id, value) => {
    setAttendanceDuration(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleParentSelect = (studentId, parentUserIds) => {
    setSelectedParents(prev => ({
      ...prev,
      [studentId]: parentUserIds
    }))
  }

  const handleSaveAttendance = async () => {
    if (people.length === 0) return
    
    const target = targets.find(t => t.id === selectedTargetId)
    if (!target) return

    setSaving(true)
    try {
      let records = []
      
      const createRecord = (id, statusKey) => ({
        studentId: id,
        status: attendanceData[statusKey],
        actual_present_hours: attendanceDuration[statusKey],
        total_scheduled_hours: defaultDuration
      })

      if (target.type === 'student') {
        records = people.map(p => createRecord(p.user_id, p.user_id))
      } else if (target.type === 'teacher') {
        records = people.map(p => {
          const id = p.user?.user_id || p.user_id || p.id
          if (!id) return null
          return createRecord(id, id)
        }).filter(Boolean)
      } else if (target.type === 'parent') {
        people.forEach(p => {
          records.push({
            ...createRecord(p.user_id, p.user_id),
            remarks: 'Student Attendance'
          })
          
          const parentIds = selectedParents[p.user_id]
          if (parentIds && Array.isArray(parentIds)) {
              parentIds.forEach(parentId => {
                 records.push({
                   ...createRecord(parentId, `parent_${p.user_id}_${parentId}`),
                   remarks: `Parent of ${p.first_name}`
                 })
              })
          }
        })
      }

      const payload = {
        eventId: event.event_id,
        academicYearId: event.academic_year_id,
        classId: target.classId || null,
        sectionId: target.sectionId || null,
        // Use the event's start date if available, otherwise default to today
        // For recurring events, the 'event' object passed via state typically has the specific occurrence date as 'start' or 'start_date'
        // We should check what the calendar passed us.
        date: (event.start instanceof Date) 
                ? event.start.toISOString().split('T')[0] 
                : (event.start_date || new Date().toISOString().split('T')[0]),
        attendanceData: records
      }

      await attendanceService.saveAttendance(payload)
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Attendance Saved Successfully!'
      })
    } catch (error) {
      console.error("Failed to save attendance", error)
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.message || "Failed to save attendance"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleModalClose = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
    if (modalState.type === 'success') {
      navigate('/attendance')
    }
  }

  const formatAcademicYear = (ay) => {
    if (!ay) return event.academic_year_id
    const parts = []
    if (ay.year_name) parts.push(ay.year_name)
    if (ay.year_type) parts.push(`(${ay.year_type})`)
    if (ay.curriculum_code || ay.curriculum_name) parts.push(ay.curriculum_code || ay.curriculum_name)
    if (ay.medium) parts.push(ay.medium)
    return parts.join(' - ')
  }

  const AttendanceToggle = ({ checked, onChange, labelLeft="Absent", labelRight="Present" }) => (
    <label className="inline-flex items-center cursor-pointer relative select-none" onClick={(e) => e.stopPropagation()}>
      <input 
        type="checkbox" 
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-24 h-8 bg-red-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-11 after:transition-all peer-checked:bg-green-100 shadow-sm"></div>
      <span className="absolute left-3 text-xs font-bold text-red-600 peer-checked:hidden">{labelLeft}</span>
      <span className="absolute right-3 text-xs font-bold text-green-600 hidden peer-checked:block">{labelRight}</span>
    </label>
  )

  if (!event) return null

  const selectedTarget = targets.find(t => t.id === selectedTargetId)

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
            <h1 className="text-3xl font-bold text-secondary-900">Take Attendance</h1>
            <p className="text-secondary-600 mt-1">Record attendance for <span className="font-semibold text-primary-700">{event.event_name}</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Top Panel: Event Details & Configuration */}
        <Card className="shadow-lg border border-secondary-200">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-secondary-500 uppercase tracking-wider">Event Details</label>
                 <div className="flex flex-col">
                    <span className="text-xl font-bold text-secondary-900">{event.event_name}</span>
                    <span className="text-sm text-secondary-600 mt-1 flex items-center gap-1">
                       <Clock className="w-4 h-4" />
                       Duration: {defaultDuration} Hours
                    </span>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary-500 uppercase tracking-wider">Academic Year</label>
                <div className="text-lg font-medium text-secondary-900 break-words">
                  {loading && !academicYearInfo ? <LoadingSpinner size="sm" /> : formatAcademicYear(academicYearInfo)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary-500 uppercase tracking-wider">Target Group</label>
                <select
                  className="input w-full text-lg py-2"
                  value={selectedTargetId}
                  onChange={handleTargetChange}
                  disabled={loading}
                >
                  <option value="">Select Target...</option>
                  {targets.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </Card>

        {/* Bottom Panel: Attendance List */}
        {showAttendanceList && selectedTarget && (
          <Card className="shadow-lg border border-secondary-200 overflow-hidden">
            <div className="p-6 border-b border-secondary-200 bg-secondary-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                  {selectedTarget.type === 'teacher' ? <Users className="w-6 h-6 text-primary-600" /> : <GraduationCap className="w-6 h-6 text-primary-600" />}
                  {selectedTarget.type === 'teacher' ? 'Teachers List' : 'Student List'}
                </h2>
                {primaryTeacher && (
                  <p className="text-sm text-secondary-600 flex items-center gap-2 mt-2 bg-white px-3 py-1 rounded-full border border-secondary-200 w-fit">
                    <User className="w-4 h-4 text-primary-500" />
                    Subject Teacher: <span className="font-semibold text-secondary-900">
                      {primaryTeacher.first_name} {primaryTeacher.last_name}
                    </span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="text-sm text-secondary-500 bg-white px-3 py-1.5 rounded-md border border-secondary-200 shadow-sm">
                    Total: <span className="font-bold text-secondary-900">{people.length}</span>
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {people.length === 0 ? (
                <div className="p-12 text-center text-secondary-500 flex flex-col items-center gap-3">
                    <Users className="w-12 h-12 text-secondary-300" />
                    <span className="text-lg">No records found for this group.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-secondary-50 border-b border-secondary-200">
                    <tr>
                      <th className="p-5 font-semibold text-secondary-600 w-16">#</th>
                      <th className="p-5 font-semibold text-secondary-600">Name</th>
                      
                      {selectedTarget.type !== 'teacher' && (
                         <th className="p-5 font-semibold text-secondary-600 w-32">Roll No</th>
                      )}
                      
                      {selectedTarget.type === 'parent' && (
                         <th className="p-5 font-semibold text-secondary-600">Parent</th>
                      )}

                      <th className="p-5 font-semibold text-secondary-600 w-64 text-center">
                         {selectedTarget.type === 'parent' ? 'Student Attendance' : 'Attendance'}
                      </th>
                      
                      <th className="p-5 font-semibold text-secondary-600 w-48 text-center">
                         <div className="flex flex-col items-center">
                            <span>Duration <p> (Present Hrs) </p> </span>
                            <span className="text-[10px] font-normal text-black mt-1">(Default: Total Event Hours)</span>
                         </div>
                      </th>

                      {selectedTarget.type === 'parent' && (
                         <th className="p-5 font-semibold text-secondary-600 text-center">Parent Attendance</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100 bg-white">
                    {people.map((person, index) => {
                      const personId = person.user?.user_id || person.user_id || person.id;
                      const isPresent = attendanceData[personId] === 'Present';
                      
                      return (
                        <tr key={personId} className={`hover:bg-secondary-50 transition-colors ${!isPresent ? 'bg-red-50/30' : ''}`}>
                          <td className="p-5 text-secondary-500 font-medium">{index + 1}</td>
                          <td className="p-5">
                            <div className="font-bold text-secondary-900 text-lg">{person.first_name} {person.last_name}</div>
                            {(selectedTarget.type === 'teacher' || selectedTarget.type === 'teacher_global') && (
                                <div className="text-xs text-secondary-500 mt-0.5">{person.role_display || person.job_title || 'Teacher'}</div>
                            )}
                          </td>
                          
                          {selectedTarget.type !== 'teacher' && selectedTarget.type !== 'teacher_global' && (
                            <td className="p-5 text-secondary-600 font-mono">{person.roll_number || '-'}</td>
                          )}

                          {selectedTarget.type === 'parent' && (
                            <td className="p-5">
                              {person.parents && person.parents.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                      {person.parents.map(p => (
                                          <label key={p.user_id} className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer hover:text-primary-700">
                                              <input 
                                                  type="checkbox"
                                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                                  checked={(selectedParents[personId] || []).includes(p.user_id)}
                                                  onChange={(e) => {
                                                      const current = selectedParents[personId] || []
                                                      let newSelection
                                                      if (e.target.checked) {
                                                          newSelection = [...current, p.user_id]
                                                          setAttendanceData(prev => ({ ...prev, [`parent_${personId}_${p.user_id}`]: 'Present' }))
                                                          setAttendanceDuration(prev => ({ ...prev, [`parent_${personId}_${p.user_id}`]: defaultDuration }))
                                                      } else {
                                                          newSelection = current.filter(id => id !== p.user_id)
                                                      }
                                                      handleParentSelect(personId, newSelection)
                                                  }}
                                              />
                                              {p.first_name} {p.last_name} ({p.relationship})
                                          </label>
                                      ))}
                                  </div>
                              ) : (
                                <span className="text-sm text-secondary-400 italic">No Parent</span>
                              )}
                            </td>
                          )}

                          <td className="p-5">
                            <div className="flex justify-center">
                                <AttendanceToggle 
                                  checked={isPresent}
                                  onChange={() => toggleStatus(personId)}
                                />
                            </div>
                          </td>
                          
                          <td className="p-5">
                             <div className="flex justify-center">
                                 <input 
                                    type="number" 
                                    min="0"
                                    max={defaultDuration}
                                    step="0.1"
                                    className={`input w-24 text-center`}
                                    value={attendanceDuration[personId] ?? defaultDuration}
                                    onChange={(e) => handleDurationChange(personId, e.target.value)}
                                    placeholder={defaultDuration}
                                 />
                             </div>
                          </td>

                          {selectedTarget.type === 'parent' && (
                            <td className="p-5">
                              <div className="flex flex-col gap-3">
                                 {(selectedParents[personId] || []).map(parentId => {
                                     const parent = person.parents?.find(p => p.user_id === parentId)
                                     if (!parent) return null
                                     const isParentPresent = attendanceData[`parent_${personId}_${parentId}`] === 'Present'
                                     
                                     return (
                                         <div key={parentId} className="flex items-center justify-end gap-3 p-2 rounded-md bg-white border border-secondary-100">
                                             <span className="text-sm font-medium text-secondary-700">{parent.first_name}:</span>
                                             <AttendanceToggle 
                                               checked={isParentPresent}
                                               onChange={() => toggleStatus(`parent_${personId}_${parentId}`)}
                                               labelLeft="A"
                                               labelRight="P"
                                             />
                                             <input 
                                                type="number" 
                                                min="0"
                                                max={defaultDuration}
                                                step="0.1"
                                                className={`input w-16 text-center text-xs p-1 ${!isParentPresent ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
                                                value={attendanceDuration[`parent_${personId}_${parentId}`] ?? defaultDuration}
                                                onChange={(e) => handleDurationChange(`parent_${personId}_${parentId}`, e.target.value)}
                                             />
                                         </div>
                                     )
                                 })}
                                 {(selectedParents[personId] || []).length === 0 && <span className="text-xs text-secondary-400 text-right block italic">No parent selected</span>}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-secondary-200 bg-secondary-50 flex justify-end">
              <button 
                className="btn btn-primary btn-lg flex items-center gap-2 px-8 shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5"
                onClick={handleSaveAttendance}
                disabled={people.length === 0 || saving}
              >
                {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </Card>
        )}
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.title}
      >
        <div className="p-6">
          <p className={`text-lg ${modalState.type === 'error' ? 'text-red-600' : 'text-secondary-600'}`}>
            {modalState.message}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              className={`btn ${modalState.type === 'error' ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleModalClose}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
