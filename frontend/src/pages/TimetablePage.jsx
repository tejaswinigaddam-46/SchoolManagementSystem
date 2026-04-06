import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfDay, endOfDay, startOfWeek as sow, endOfWeek as eow, startOfMonth as som, endOfMonth as eom } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import Card from '../components/ui/Card'
import AcademicYearSelector from '../components/forms/AcademicYearSelector'
import { useAuth } from '../contexts/AuthContext'
import { eventService } from '../services/eventService'
import { classService } from '../services/classService'
import { studentService } from '../services/studentService'
import sectionService from '../services/sectionService'
import sectionSubjectService from '../services/sectionSubjectService'
import { PERMISSIONS } from '../config/permissions'

const locales = {
  'en-US': undefined
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

export default function TimetablePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isAttendanceMode = searchParams.get('mode') === 'attendance'

  const [view, setView] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const { getCampusId, getUserName, getPrimaryRole, isTeacher, isStudent, isParent, getUserId, getDefaultAcademicYearId, hasPermission } = useAuth()
  const [academicYearValidation, setAcademicYearValidation] = useState({ isValid: null, academicYearId: null, message: '' })
  const [classes, setClasses] = useState([])
  const [events, setEvents] = useState([])
  const [studentContext, setStudentContext] = useState({ classId: null, sectionId: null, className: null, sectionName: null })
  const [selectedClassIds, setSelectedClassIds] = useState([])
  const [selectedSectionIds, setSelectedSectionIds] = useState([])
  const [sectionMap, setSectionMap] = useState({})

  const canViewAllEvents =
    hasPermission &&
    (hasPermission(PERMISSIONS.EVENT_CREATE) ||
      hasPermission(PERMISSIONS.EVENT_EDIT) ||
      hasPermission(PERMISSIONS.EVENT_DELETE))


  const months = useMemo(() => (
    Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(2000, i, 1), 'LLLL') }))
  ), [])

  const years = useMemo(() => {
    const base = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => base - 3 + i)
  }, [])

  const toStdName = (val) => {
    const num = parseInt(String(val), 10)
    if (!isNaN(num)) {
      const names = {1:'First',2:'Second',3:'Third',4:'Fourth',5:'Fifth',6:'Sixth',7:'Seventh',8:'Eighth',9:'Ninth',10:'Tenth',11:'Eleventh',12:'Twelfth'}
      return `${names[num] || val} Standard`
    }
    return String(val)
  }

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await classService.getClassesByCampus(getCampusId())
        const base = (response.data?.classes || []).map(cls => ({ id: cls.class_id, name: toStdName(cls.class_name || cls.class_level) }))
        setClasses(base)
      } catch (_) {
        setClasses([])
      }
    }
    fetchClasses()
  }, [getCampusId])

  useEffect(() => {
    const role = getPrimaryRole()
    const defAy = getDefaultAcademicYearId()
    if (role === 'Student' && defAy) {
      setAcademicYearValidation({ isValid: true, academicYearId: defAy, message: '' })
    }
  }, [getPrimaryRole, getDefaultAcademicYearId])

  useEffect(() => {
    const loadStudentContext = async () => {
      if (getPrimaryRole() !== 'Student') {
        setStudentContext({ classId: null, sectionId: null })
        return
      }
      if (!hasPermission(PERMISSIONS.STUDENT_BY_USERNAME_READ)) {
        setStudentContext({ classId: null, sectionId: null })
        return
      }
      try {
        const res = await studentService.getStudentByUsername(getUserName())
        const data = res.data?.data || res.data
        const clsName = data?.enrollment?.className || ''
        const match = classes.find(c => c.name === toStdName(clsName)) || classes.find(c => c.name === clsName)
        const secId = data?.enrollment?.sectionId ? String(data.enrollment.sectionId) : null
        const secName = data?.enrollment?.sectionName || data?.section_name || ''
        setStudentContext({ 
          classId: match ? String(match.id) : null, 
          sectionId: secId,
          className: clsName,
          sectionName: secName
        })
      } catch (_) {
        setStudentContext({ classId: null, sectionId: null, className: null, sectionName: null })
      }
    }
    loadStudentContext()
  }, [getUserName, getPrimaryRole, classes, hasPermission])

  useEffect(() => {
    if (isStudent()) {
      const cid = studentContext.classId ? [String(studentContext.classId)] : []
      setSelectedClassIds(cid)
      const sid = studentContext.sectionId ? [String(studentContext.sectionId)] : []
      setSelectedSectionIds(sid)
      return
    }
    if (isTeacher()) {
      const loadTeacherClasses = async () => {
        try {
          const ayId = academicYearValidation.academicYearId
          if (!ayId) { setSelectedClassIds([]); setSelectedSectionIds([]); return }
          const params = { academic_year_id: ayId, campus_id: getCampusId(), limit: 1000 }
          Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
          const res = await sectionService.getAllSections(params)
          const list = res?.data?.sections || []
          
          setSectionMap(prev => {
            const next = { ...prev }
            list.forEach(s => {
              if (s.section_id && s.section_name) {
                next[String(s.section_id)] = s.section_name
              }
            })
            return next
          })

          const userId = String(getUserId() || '')
          const mapSectionToClass = {}
          list.forEach(s => { if (s.section_id) { mapSectionToClass[String(s.section_id)] = String(s.class_id) } })
          const primarySections = list.filter(s => String(s.primary_teacher_user_id || '') === userId)
          let secIds = primarySections.map(s => String(s.section_id)).filter(Boolean)
          try {
            const sectionIds = list.map(s => parseInt(s.section_id)).filter(Boolean)
            if (sectionIds.length) {
              const assignsRes = await sectionSubjectService.getAssignmentsBySections(sectionIds)
              const assigns = assignsRes?.data?.assignments || assignsRes?.assignments || []
              const taughtSections = assigns.filter(a => String(a.teacher_user_id || '') === userId).map(a => String(a.section_id)).filter(Boolean)
              secIds = Array.from(new Set([...secIds, ...taughtSections]))
            }
          } catch (_) {}
          const clsIds = Array.from(new Set(secIds.map(sid => mapSectionToClass[sid]).filter(Boolean)))
          setSelectedClassIds(clsIds)
          setSelectedSectionIds(secIds)
        } catch (_) {
          setSelectedClassIds([])
          setSelectedSectionIds([])
        }
      }
      loadTeacherClasses()
    }
  }, [isStudent, isTeacher, studentContext.classId, studentContext.sectionId, academicYearValidation.academicYearId, getCampusId, getUserId])

  useEffect(() => {
    if (!isStudent() && !isTeacher()) {
      const fetchSectionsForClasses = async () => {
        try {
          const ayId = academicYearValidation.academicYearId
          if (!ayId || selectedClassIds.length === 0) { setSelectedSectionIds([]); return }
          const accum = []
          const newSectionMap = {}
          for (const cid of selectedClassIds) {
            const res = await sectionService.getAllSections({ academic_year_id: ayId, class_id: parseInt(cid, 10), limit: 1000 })
            const list = res?.data?.sections || []
            list.forEach(s => {
              if (s.section_id && s.section_name) {
                newSectionMap[String(s.section_id)] = s.section_name
              }
            })
            accum.push(...list.map(s => String(s.section_id)).filter(Boolean))
          }
          setSectionMap(prev => ({ ...prev, ...newSectionMap }))
          setSelectedSectionIds(Array.from(new Set(accum)))
        } catch (_) {
          setSelectedSectionIds([])
        }
      }
      fetchSectionsForClasses()
    }
  }, [selectedClassIds, academicYearValidation.academicYearId, isStudent, isTeacher])

  const parseWeeklyByDay = (rrule) => {
    try {
      if (!rrule || String(rrule).toLowerCase() === 'no repeat') return []
      const s = String(rrule)
      const bydayPart = s.split(';').find(p => p.toUpperCase().startsWith('BYDAY='))
      if (!bydayPart) return []
      const codes = bydayPart.split('=')[1].split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
      const map = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 }
      return codes.map(c => map[c]).filter(v => v !== undefined)
    } catch { return [] }
  }

  const getViewRange = (view, anchorDate) => {
    const base = anchorDate instanceof Date ? anchorDate : new Date(anchorDate)
    if (view === 'day') return { start: startOfDay(base), end: endOfDay(base) }
    if (view === 'week') return { start: sow(base, { weekStartsOn: 1 }), end: eow(base, { weekStartsOn: 1 }) }
    if (view === 'month') return { start: som(base), end: eom(base) }
    // agenda: use week for expansion bounds
    return { start: sow(base, { weekStartsOn: 1 }), end: eow(base, { weekStartsOn: 1 }) }
  }

  const buildExpandedEventsForRange = (list, view, anchorDate) => {
    const { start, end } = getViewRange(view, anchorDate)
    const out = []
    for (const ev of list) {
      const baseStart = ev.start instanceof Date ? ev.start : new Date(ev.start)
      const baseEnd = ev.end instanceof Date ? ev.end : new Date(ev.end)
      const durationMs = baseEnd - baseStart
      const byDays = parseWeeklyByDay(ev.recurrence_rule)
      const instances = ev.instances || []

      // Helper to check for instance override
      const findInstance = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return instances.find(i => i.original_start_date === dateStr)
      }

      if (!Array.isArray(byDays) || byDays.length === 0) {
        // Non-recurring
        if (baseEnd >= start && baseStart <= end) {
          // Check for single instance override (though less common for non-recurring unless we treat it as instance of itself?)
          // For non-recurring, usually instance logic is less relevant unless we support "rescheduling" the single event via instance table?
          // But based on user request, let's check instances anyway if they exist.
          const instance = findInstance(baseStart)
          
          let finalStart = baseStart
          let finalEnd = baseEnd
          let isCancelled = !!ev.is_cancelled
          let roomId = ev.room_id
          
          if (instance) {
             if (instance.is_cancelled !== undefined) isCancelled = instance.is_cancelled
             if (instance.actual_start_date && instance.actual_start_time) {
                 finalStart = new Date(`${instance.actual_start_date}T${instance.actual_start_time}`)
             }
             if (instance.actual_end_date && instance.actual_end_time) {
                 finalEnd = new Date(`${instance.actual_end_date}T${instance.actual_end_time}`)
             }
             if (instance.room_id) roomId = instance.room_id
          }

          const isTaken = (ev.attendance_dates || []).includes(format(finalStart, 'yyyy-MM-dd'))
          out.push({ 
              ...ev, 
              title: ev.title + (roomId ? ` (Room: ${roomId})` : ''),
              start: finalStart, 
              end: finalEnd, 
              room_id: roomId,
              attendance_taken: isTaken,
              is_cancelled: isCancelled
          })
        }
        continue
      }
      
      // Expand recurring
      const checkStart = start.getTime() > startOfDay(baseStart).getTime() ? start : startOfDay(baseStart)
      const cursor = new Date(checkStart)
      
      while (cursor <= end) {
        if (ev.seriesEnd && cursor > ev.seriesEnd) break
        
        if (cursor >= start && cursor <= end && cursor >= startOfDay(baseStart)) {
          if (byDays.includes(cursor.getDay())) {
            const occStart = new Date(cursor)
            occStart.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds(), baseStart.getMilliseconds())
            const occEnd = new Date(occStart.getTime() + durationMs)
            
            // Double check occurrence start against series end time
            if (ev.seriesEnd && occStart > ev.seriesEnd) break

            // Check for instance override
            const instance = findInstance(occStart)
            
            let finalStart = occStart
            let finalEnd = occEnd
            let isCancelled = false
            let roomId = ev.room_id
            
            if (instance) {
                if (instance.is_cancelled) isCancelled = true
                if (instance.actual_start_date && instance.actual_start_time) {
                    // Try to parse time properly
                    // The backend sends actual_start_time as HH:MM:SS
                    const dtStr = instance.actual_start_date.split('T')[0]
                    finalStart = new Date(`${dtStr}T${instance.actual_start_time}`)
                }
                if (instance.actual_end_date && instance.actual_end_time) {
                    const dtStr = instance.actual_end_date.split('T')[0]
                    finalEnd = new Date(`${dtStr}T${instance.actual_end_time}`)
                }
                if (instance.room_id) roomId = instance.room_id
            }

            const isTaken = (ev.attendance_dates || []).includes(format(finalStart, 'yyyy-MM-dd'))
            
            out.push({ 
                ...ev, 
                title: ev.title + (roomId ? ` (Room: ${roomId})` : ''),
                start: finalStart, 
                end: finalEnd, 
                room_id: roomId,
                attendance_taken: isTaken,
                is_cancelled: isCancelled,
                instance_id: instance ? instance.instance_id : null
            })
          }
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return out
  }

  useEffect(() => {
    const fetchEvents = async () => {
      console.log('Timetable: Fetching events. AcademicYearId:', academicYearValidation.academicYearId);
      if (!academicYearValidation.academicYearId) {
        setEvents([])
        return
      }
      try {
        const response = await eventService.getEvents(getCampusId(), academicYearValidation.academicYearId)
        console.log('Timetable: Raw events from backend:', response.data);
        const raw = response.data || []
        const filtered = raw.filter(ev => {
          if (canViewAllEvents) return true
          const targets = Array.isArray(ev.audience_target) ? ev.audience_target : (ev.audience_target ? [ev.audience_target] : [])
          if (targets.length === 0) return true
          for (const t of targets) {
            if (t.target_type === 'Campus') return true
            if (t.target_type === 'Role') {
              const ids = Array.isArray(t.target_ids) ? t.target_ids : []
              if ((ids.includes('Teacher') && isTeacher()) ||
                  (ids.includes('Student') && isStudent()) ||
                  (ids.includes('Parent') && isParent())) return true
            }
            if (t.target_type === 'Curriculum') {
              const ids = Array.isArray(t.target_ids) ? t.target_ids : []
              // TODO: Add curriculum context to match against
              // if (userCurriculum && ids.includes(userCurriculum)) return true
            }
            if (t.target_type === 'Class') {
              const ids = (Array.isArray(t.target_ids) ? t.target_ids : []).map(String)
              
              if (isStudent()) {
                 const cId = studentContext.classId ? String(studentContext.classId) : null
                 const cName = studentContext.className
                 if (cId && ids.includes(cId)) return true
                 if (cName && ids.includes(cName)) return true
              } else {
                 // Check IDs
                 if (selectedClassIds.length && ids.some(id => selectedClassIds.includes(String(id)))) return true
                 // Check Names
                 const selectedNames = selectedClassIds.map(id => classes.find(c => String(c.id) === String(id))?.name).filter(Boolean)
                 if (selectedNames.length && ids.some(id => selectedNames.includes(id))) return true
              }
            }
            if (t.target_type === 'Section') {
              const ids = (Array.isArray(t.target_ids) ? t.target_ids : []).map(String)
              
              if (isStudent()) {
                 const sId = studentContext.sectionId ? String(studentContext.sectionId) : null
                 const sName = studentContext.sectionName
                 if (sId && ids.includes(sId)) return true
                 if (sName && ids.includes(sName)) return true
              } else {
                 // Check IDs
                 if (selectedSectionIds.length && ids.some(id => selectedSectionIds.includes(String(id)))) return true
                 // Check Names
                 const selectedNames = selectedSectionIds.map(id => sectionMap[String(id)]).filter(Boolean)
                 if (selectedNames.length && ids.some(id => selectedNames.includes(id))) return true
              }
            }
          }
          return false
        }).map(event => {
          let startDt, endDt
          try {
            if (event.start_date) {
              // Always parse as Date to respect local timezone (e.g. UTC 18:30 might be next day locally)
              const dStr = format(new Date(event.start_date), 'yyyy-MM-dd');
              
              if (event.start_time) {
                  const tStr = event.start_time.includes('T') ? event.start_time.split('T')[1] : event.start_time;
                  startDt = new Date(`${dStr}T${tStr}`);
              } else {
                  startDt = new Date(`${dStr}T00:00:00`);
              }
            } else {
              startDt = new Date(event.start_time || new Date())
            }
          } catch (e) {
            console.error('Error parsing start date/time', e);
            startDt = new Date();
          }

          try {
            if (event.end_date) {
              // Always parse as Date to respect local timezone
              const dStr = format(new Date(event.end_date), 'yyyy-MM-dd');
              
              if (event.end_time) {
                  const tStr = event.end_time.includes('T') ? event.end_time.split('T')[1] : event.end_time;
                  endDt = new Date(`${dStr}T${tStr}`);
              } else {
                  endDt = new Date(`${dStr}T00:00:00`);
              }
            } else {
              // If end_date is missing, default to startDt if available, else now
              endDt = startDt ? new Date(startDt) : new Date()
              // If we have end_time, try to set it on the date
              if (event.end_time) {
                 const tStr = event.end_time.includes('T') ? event.end_time.split('T')[1] : event.end_time;
                 const [hours, minutes] = tStr.split(':');
                 endDt.setHours(hours, minutes, 0, 0);
              }
            }
          } catch (e) {
            console.error('Error parsing end date/time', e);
            endDt = new Date();
          }

          // Handle Recurring Events Duration Logic
          let finalStart = startDt
          let finalEnd = endDt
          
          // Fix: Ensure end date is valid and after start date
          if (finalEnd <= finalStart) {
              // If end is before start (e.g. missing end date defaults to now), set end to start + 1 hour
              finalEnd = new Date(finalStart.getTime() + 60 * 60 * 1000);
          }

          let seriesEnd = finalEnd

          const isRecurring = parseWeeklyByDay(event.recurrence_rule).length > 0
          if (isRecurring) {
            // For recurring events, 'end' should be the end of the first occurrence (e.g. same day)
            // But 'seriesEnd' is the end of the entire recurrence (e.g. Dec 31)
            
            const durationEnd = new Date(startDt)
            durationEnd.setHours(endDt.getHours(), endDt.getMinutes(), endDt.getSeconds(), endDt.getMilliseconds())
            
            // If end time is before start time (e.g. overnight 10pm-2am), add 1 day
            if (durationEnd < startDt) {
               durationEnd.setDate(durationEnd.getDate() + 1)
            }
            finalEnd = durationEnd
          }

          return {
            ...event,
            title: event.event_name,
            start: finalStart,
            end: finalEnd,
            seriesEnd: seriesEnd
          }
        })
        // Expand recurrences for the current view range
        const expanded = buildExpandedEventsForRange(filtered, view, currentDate)
        setEvents(expanded)
      } catch (_) {
        setEvents([])
      }
    }
    fetchEvents()
  }, [academicYearValidation.academicYearId, getCampusId, canViewAllEvents, isTeacher, isStudent, isParent, studentContext.classId, studentContext.sectionId, selectedClassIds, selectedSectionIds, view, currentDate])

  const handleSelectEvent = (event) => {
    if (isAttendanceMode) {
      navigate('/attendance/entry', { state: { event } })
    }
  }

  const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor = '#3174ad'; // default
    if (event.is_cancelled) {
      backgroundColor = '#EF4444'; // Red-500
    } else if (isAttendanceMode) {
      if (event.attendance_taken) {
        backgroundColor = '#10B981'; // Green-500
      } else {
        backgroundColor = '#3B82F6'; // Blue-500
      }
    }
    return {
      style: {
        backgroundColor
      }
    };
  }

  return (
    <div className="container-fluid py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900">Timetable</h1>
        <p className="text-secondary-600">Weekly and daily schedule</p>
      </div>

      {isAttendanceMode && (
        <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <p className="font-medium">Please select an event to take attendance</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="text-sm hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="mb-4">
            {getPrimaryRole() !== 'Student' && (
              <AcademicYearSelector
                campusId={getCampusId()}
                value={academicYearValidation.academicYearId}
                onChange={(e) => {
                  const raw = e.target.value
                  const id = typeof raw === 'object' ? raw.academic_year_id : Number(raw)
                  const valid = Number.isInteger(id) && id > 0
                  setAcademicYearValidation({ isValid: valid, academicYearId: valid ? id : null, message: valid ? '' : '' })
                }}
                onValidationChange={(v) => setAcademicYearValidation(v)}
                name="academic_year_id"
                label="Academic Year"
                required={true}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(() => {
              const showClassMulti = !isStudent() && !isParent() && !isTeacher()
              return showClassMulti ? (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-secondary-700">Classes</label>
                  <select
                    multiple
                    className="input w-56"
                    value={selectedClassIds}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions).map(o => String(o.value))
                      setSelectedClassIds(opts)
                    }}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : null
            })()}
            <button className={`btn ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('month')}>Month</button>
            <button className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('week')}>Week</button>
            <button className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('day')}>Day</button>
            <button className={`btn ${view === 'agenda' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('agenda')}>Agenda</button>
          </div>
          <div className="bg-white rounded-xl border border-secondary-200">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day', 'agenda']}
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              style={{ height: 700 }}
              onSelectEvent={handleSelectEvent}
              selectable={isAttendanceMode}
              eventPropGetter={eventStyleGetter}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
