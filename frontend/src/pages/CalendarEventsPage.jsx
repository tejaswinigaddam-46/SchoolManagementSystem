import { useState, useEffect } from 'react'
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { toast } from 'react-hot-toast'
import Card from '../components/ui/Card'
import { Plus } from 'lucide-react'
import Modal from '../components/ui/Modal'
import RequiredAsterisk from '../components/ui/RequiredAsterisk'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import AcademicYearSelector from '../components/forms/AcademicYearSelector'
import { useAuth } from '../contexts/AuthContext'
import { academicService } from '../services/academicService'
import { classService } from '../services/classService'
import { eventService } from '../services/eventService'
import sectionService from '../services/sectionService'
import {roomService} from '../services/roomService'
import { subjectService } from '../services/subjectService'
import { PERMISSIONS } from '../config/permissions'

const CURRICULUM_BOOKS = [
  { value: 'GOV_SSC_ENGLISH', label: 'SSC English' },
  { value: 'GOV_SSC_PHYSICS', label: 'SSC Physics' },
  { value: 'GOV_SSC_CHEMISTRY', label: 'SSC Chemistry' }
];

const EVENT_TYPES = [
  'Test',
  'Class Lecture',
  'Lab Session',
  'Field Trip',
  'Study Hall',
  'Holiday',
  'School Event',
  'Meeting',
  'Parent-Teacher Meet',
  'Professional Development',
  'Maintenance',
  'Personal Appointment'
];

const EVENT_STATUSES = [
  'Yet to be start',
  'Ongoing',
  'Completed',
  'Canceled',
  'Postponed'
];

export default function CalendarEventsPage() {
  const { getCampusId, getDefaultAcademicYearId, getTenantId, getUserId, hasPermission } = useAuth()
  const [academicYearValidation, setAcademicYearValidation] = useState({ isValid: null, academicYearId: null, message: '' });
  const [classes, setClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [events, setEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showAvailableRoomsOnly, setShowAvailableRoomsOnly] = useState(false);
  const [showAvailableRoomsOnlyEdit, setShowAvailableRoomsOnlyEdit] = useState(false);
  const [timeGranularity, setTimeGranularity] = useState('month');
  const [filterDate, setFilterDate] = useState(new Date());

  // Recurrence handling state
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [recurrenceAction, setRecurrenceAction] = useState(null); // 'edit' or 'delete'
  const [targetEvent, setTargetEvent] = useState(null);
  const [recurrenceMode, setRecurrenceMode] = useState('single'); // 'single', 'all', 'following'

  const toStdName = (val) => {
    const num = parseInt(String(val), 10);
    if (!isNaN(num)) {
      const names = {1:'First',2:'Second',3:'Third',4:'Fourth',5:'Fifth',6:'Sixth',7:'Seventh',8:'Eighth',9:'Ninth',10:'Tenth',11:'Eleventh',12:'Twelfth'};
      return `${names[num] || val} Standard`;
    }
    return String(val);
  };

  const normalizeClassSelection = (selected) => {
    if (!selected || !selected.length) return [];
    const raw = String(selected[0]);
    const byId = classes.find(c => String(c.id) === raw);
    if (byId) return [String(byId.id)];
    const byName = classes.find(c => c.name === raw);
    if (byName) return [String(byName.id)];
    const mappedName = toStdName(raw);
    const byMappedName = classes.find(c => c.name === mappedName);
    if (byMappedName) return [String(byMappedName.id)];
    return [raw];
  };

  const parseRRuleToFrequency = (rrule) => {
    try {
      if (!rrule || rrule === 'No repeat') return { repeat: 'no', frequency: [] };
      const parts = String(rrule).split(';');
      const bydayPart = parts.find(p => p.startsWith('BYDAY='));
      if (!bydayPart) return { repeat: 'no', frequency: [] };
      const codeDays = bydayPart.replace('BYDAY=', '').split(',').filter(Boolean);
      const map = { SU: 'Sunday', MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday' };
      const days = codeDays.map(c => map[c]).filter(Boolean);
      if (days.length === 7) return { repeat: 'yes', frequency: ['Everyday'] };
      return { repeat: days.length ? 'yes' : 'no', frequency: days };
    } catch (_) {
      return { repeat: 'no', frequency: [] };
    }
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    academic_year_id: null,
    repeat: 'no',
    frequency: [],
    eventType: EVENT_TYPES[0],
    selectedAudiences: ['all'],
    selectedClasses: [],
    selectedSections: [],
    notifyParents: false,
    notifyTeachers: false,
    event_status: EVENT_STATUSES[0],
    subject_name: '',
    curriculum_book_name: '',
    total_score: 100,
    passing_score: 35
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    academic_year_id: null,
    eventType: EVENT_TYPES[0],
    selectedAudiences: ['all'],
    selectedClasses: [],
    selectedSections: [],
    room_id: null,
    notifyParents: false,
    notifyTeachers: false,
    event_status: EVENT_STATUSES[0],
    repeat: 'no',
    frequency: [],
    subject_name: '',
    curriculum_book_name: '',
    total_score: 100,
    passing_score: 35
  });

  const getRange = (g, d) => {
    const base = d instanceof Date ? d : new Date(d);
    if (g === 'day') return { start: startOfDay(base), end: endOfDay(base) };
    if (g === 'week') return { start: startOfWeek(base, { weekStartsOn: 1 }), end: endOfWeek(base, { weekStartsOn: 1 }) };
    if (g === 'month') return { start: startOfMonth(base), end: endOfMonth(base) };
    if (g === 'year') return { start: startOfYear(base), end: endOfYear(base) };
    return { start: startOfMonth(base), end: endOfMonth(base) };
  };

  const expandEvents = (events, rangeStart, rangeEnd) => {
    const result = [];
    const rangeStartDt = startOfDay(new Date(rangeStart));
    const rangeEndDt = endOfDay(new Date(rangeEnd));

    events.forEach(ev => {
      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      const duration = evEnd.getTime() - evStart.getTime();

      // Parse RRULE
      const rrule = ev.recurrence_rule;
      let isRecurring = false;
      let byDays = [];
      const instances = ev.instances || [];

      // Helper to check for instance override
      const findInstance = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return instances.find(i => i.original_start_date === dateStr)
      }

      if (rrule && rrule !== 'No repeat') {
        if (rrule.includes('FREQ=WEEKLY')) {
            isRecurring = true;
            const match = rrule.match(/BYDAY=([^;]+)/);
            if (match) {
                byDays = match[1].split(',');
            }
        }
      }

      if (!isRecurring) {
        if (evStart >= rangeStartDt && evStart <= rangeEndDt) {
            // Check instance override for non-recurring (rare but possible via instance table)
            const instance = findInstance(evStart)
            
            let finalStart = evStart
            let finalEnd = evEnd
            let isCancelled = !!ev.is_cancelled
            let roomId = ev.room_id
            let status = ev.event_status

            if (instance) {
                if (instance.is_cancelled !== undefined) isCancelled = instance.is_cancelled
                if (instance.actual_start_date && instance.actual_start_time) {
                    finalStart = new Date(`${instance.actual_start_date.split('T')[0]}T${instance.actual_start_time}`)
                }
                if (instance.actual_end_date && instance.actual_end_time) {
                    finalEnd = new Date(`${instance.actual_end_date.split('T')[0]}T${instance.actual_end_time}`)
                }
                if (instance.room_id) roomId = instance.room_id
            }

            result.push({
                ...ev,
                start: finalStart,
                end: finalEnd,
                room_id: roomId,
                event_status: status,
                is_cancelled: isCancelled
            });
        }
      } else {
        // Iterate day by day from rangeStart to rangeEnd
        let iter = new Date(rangeStartDt);
        const seriesEndDt = ev.end_date ? endOfDay(new Date(ev.end_date)) : null;
        const loopEnd = seriesEndDt && seriesEndDt < rangeEndDt ? seriesEndDt : rangeEndDt;
        
        const mapDay = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
        const targetDays = byDays.map(d => mapDay[d]);

        while (iter <= loopEnd) {
            // Check if this day is >= event start date
            if (iter >= startOfDay(evStart)) {
                if (targetDays.includes(iter.getDay())) {
                     // Create instance
                     const instanceStart = new Date(iter);
                     instanceStart.setHours(evStart.getHours(), evStart.getMinutes(), evStart.getSeconds());
                     
                     const instanceEnd = new Date(instanceStart.getTime() + duration);

                     // Check instance override
                     const instance = findInstance(instanceStart)
                     
                     let finalStart = instanceStart
                     let finalEnd = instanceEnd
                     let isCancelled = !!ev.is_cancelled
                     let roomId = ev.room_id
                     let status = ev.event_status

                     if (instance) {
                        if (instance.is_cancelled !== undefined) isCancelled = instance.is_cancelled
                        if (instance.actual_start_date && instance.actual_start_time) {
                            finalStart = new Date(`${instance.actual_start_date.split('T')[0]}T${instance.actual_start_time}`)
                        }
                        if (instance.actual_end_date && instance.actual_end_time) {
                            finalEnd = new Date(`${instance.actual_end_date.split('T')[0]}T${instance.actual_end_time}`)
                        }
                        if (instance.room_id) roomId = instance.room_id
                     }
                     
                     result.push({
                         ...ev,
                         start: finalStart,
                         end: finalEnd,
                         room_id: roomId,
                         event_status: status,
                         _isInstance: true,
                         is_cancelled: isCancelled,
                         instance_id: instance ? instance.instance_id : null
                     });
                }
            }
            iter = addDays(iter, 1);
        }
      }
    });
    // Sort by date
    return result.sort((a, b) => a.start - b.start);
  };

  const normalizeStatus = (status, evObj) => {
    const now = new Date();
    const s = evObj?.start instanceof Date ? evObj.start : new Date(evObj?.start);
    const e = evObj?.end instanceof Date ? evObj.end : new Date(evObj?.end);
    const raw = String(status || '').toLowerCase();
    if (raw === 'ongoing') return 'Ongoing';
    if (raw === 'completed') return 'Completed';
    if (raw === 'postponed') return 'Postponed';
    if (raw === 'yet to be start' || raw === 'yet to start') return 'Yet to start';
    if (s && e) {
      if (s <= now && now <= e) return 'Ongoing';
      if (e < now) return 'Completed';
      if (s > now) return 'Yet to start';
    }
    return 'Ongoing';
  };

  const canManageEvents =
    hasPermission &&
    (hasPermission(PERMISSIONS.EVENT_CREATE) ||
      hasPermission(PERMISSIONS.EVENT_EDIT) ||
      hasPermission(PERMISSIONS.EVENT_DELETE))

  const openEditForEvent = (ev) => {
    if (!canManageEvents) return
    const idx = events.findIndex(e => String(e.event_id) === String(ev.event_id))
    if (idx < 0) return

    // Check if it's a recurring event
    const isRecurring = (ev.recurrence_rule && ev.recurrence_rule !== 'No repeat') || (ev.repeat === 'yes');
    
    if (isRecurring && !ev._isInstance) {
        // If it's the main event but we clicked it, we might want to edit series or instance if it was expanded.
        // But usually _isInstance is true for expanded events.
        // If we are in "month" view, we might click an instance.
    }
    
    // If we clicked an instance of a recurring event, or the recurring event itself
    if (isRecurring) {
        setTargetEvent(ev);
        setRecurrenceAction('edit');
        setRecurrenceMode('single'); // Default
        setRecurrenceModalOpen(true);
        return;
    }

    proceedToEdit(ev);
  }

  const proceedToEdit = (ev) => {
    setRecurrenceMode('all')
    const idx = events.findIndex(e => String(e.event_id) === String(ev.event_id));
    if (idx < 0 && !ev._isInstance) return; // If instance, might not be in main list directly if filtered

    const parsed = parseRRuleToFrequency(ev.recurrence_rule)
    setSelectedIndex(idx) // This might be -1 for instances, we need to handle that. 
    // Actually, for editing, we need the original event ID.
    
    const startDt = ev.start instanceof Date ? ev.start : new Date(ev.start)
    const endDt = ev.end instanceof Date ? ev.end : new Date(ev.end)
    const initial = {
      title: ev.title || '',
      description: ev.description || '',
      start: startDt,
      end: endDt,
      allDay: !!ev.allDay,
      academic_year_id: academicYearValidation.academicYearId,
      eventType: ev.eventType || EVENT_TYPES[0],
      selectedAudiences: Array.isArray(ev.selectedAudiences) ? ev.selectedAudiences : ['all'],
      selectedClasses: Array.isArray(ev.selectedClasses) ? ev.selectedClasses.map(String) : [],
      selectedSections: Array.isArray(ev.selectedSections) ? ev.selectedSections.map(String) : [],
      room_id: ev.room_id || null,
      notifyParents: !!ev.notifyParents,
      notifyTeachers: !!ev.notifyTeachers,
      event_status: ev.event_status || EVENT_STATUSES[0],
      repeat: parsed.repeat,
      frequency: parsed.frequency,
      subject_name: ev.subject_name || '',
      curriculum_book_name: ev.curriculum_book_name || '',
      total_score: ev.total_score || 100,
      passing_score: ev.passing_score || 35
    }
    setEditForm(initial)
    ;(async () => {
      try {
        const ayId = academicYearValidation.academicYearId
        if (!ayId) return
        let selAud = Array.isArray(initial.selectedAudiences) ? initial.selectedAudiences.slice() : []
        const hasClass = Array.isArray(initial.selectedClasses) && initial.selectedClasses.length > 0
        const hasSections = Array.isArray(initial.selectedSections) && initial.selectedSections.length > 0
        if (hasSections && !hasClass) {
          const res = await sectionService.getAllSections({ academic_year_id: ayId, campus_id: getCampusId(), limit: 1000 })
          const list = res?.data?.sections || []
          const secIds = new Set(initial.selectedSections.map(String))
          const matched = list.filter(s => secIds.has(String(s.section_id)))
          const classId = matched.length ? String(matched[0].class_id) : null
          if (classId) {
            setEditForm(prev => ({ ...prev, selectedClasses: [classId] }))
            const res2 = await sectionService.getAllSections({ academic_year_id: ayId, class_id: parseInt(classId, 10), limit: 1000 })
            const secs2 = res2?.data?.sections || []
            setAvailableSections(secs2.map(s => ({ id: s.section_id, name: s.section_name })))
          }
        } else if (hasClass) {
          const cid = String(initial.selectedClasses[0])
          const res2 = await sectionService.getAllSections({ academic_year_id: ayId, class_id: parseInt(cid, 10), limit: 1000 })
          const secs2 = res2?.data?.sections || []
          setAvailableSections(secs2.map(s => ({ id: s.section_id, name: s.section_name })))
        }
        if (!selAud.includes('Class') && (hasClass || hasSections)) {
          selAud = selAud.filter(x => x !== 'all')
          selAud.push('Class')
          setEditForm(prev => ({ ...prev, selectedAudiences: selAud }))
        }
      } catch (_) {}
    })()
    setIsEditOpen(true)
  }

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await classService.getClassesByCampus(getCampusId());
        const base = (response.data?.classes || []).map(cls => ({ id: cls.class_id, name: toStdName(cls.class_name || cls.class_level) }));
        setClasses(base);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      }
    };
    const fetchRooms = async () => {
      try {
        const list = await roomService.getAllRooms();
        const data = (list && list.data) ? list.data : [];
        setRooms(data.map(r => ({ id: r.room_id, label: `${r.room_number} (Floor ${r.floor_number})`, available_capacity: r.available_capacity, capacity: r.capacity, room_number: r.room_number, floor_number: r.floor_number, status: r.status })));
      } catch (err) {
        setRooms([]);
      }
    };
    const fetchSubjects = async () => {
      try {
        const response = await subjectService.getAllSubjects(getCampusId());
        const data = (response?.data?.subjects || []).map(sub => ({ id: sub.subject_id, name: sub.subject_name }));
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        setSubjects([]);
      }
    };

    fetchClasses();
    fetchRooms();
    fetchSubjects();
  }, [getCampusId]);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await academicService.getAllAcademicYears(getCampusId());
        const years = Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []);
        setAcademicYears(years);
        const def = getDefaultAcademicYearId();
        if (def) {
          setForm(prev => ({ ...prev, academic_year_id: def }));
          setAcademicYearValidation({ isValid: true, academicYearId: def, message: '' });
        } else if (years.length > 0) {
          const currentYear = years.find(ay => ay.is_current || ay.isCurrent);
          if (currentYear) {
            const ayId = currentYear.academic_year_id || currentYear.id;
            setForm(prev => ({ ...prev, academic_year_id: ayId }));
            setAcademicYearValidation({ isValid: true, academicYearId: ayId, message: '' });
          }
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error);
      }
    };
    fetchAcademicYears();
  }, [getCampusId, getDefaultAcademicYearId]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (academicYearValidation.academicYearId) {
        try {
          const response = await eventService.getEvents(getCampusId(), academicYearValidation.academicYearId);
          const eventsData = Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []);
          const deriveSelectedAudiences = (audienceTarget) => {
            if (!audienceTarget) return ['all'];
            const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
            const arr = [];
            for (const t of targets) {
              if (t.target_type === 'Campus') { if (!arr.includes('all')) arr.push('all'); }
              if (t.target_type === 'Class' || t.target_type === 'Section') { if (!arr.includes('Class')) arr.push('Class'); }
              if (t.target_type === 'Role' && Array.isArray(t.target_ids)) {
                for (const rid of t.target_ids) {
                  if (rid === 'Teacher' && !arr.includes('Teachers')) arr.push('Teachers');
                  if (rid === 'Employee' && !arr.includes('Employees')) arr.push('Employees');
                  if (rid === 'Parent' && !arr.includes('Parents')) arr.push('Parents');
                  if (rid === 'Student' && !arr.includes('Students')) arr.push('Students');
                }
              }
            }
            return arr.length ? arr : ['all'];
          };
          const deriveAudience = (audienceTarget) => {
            const arr = deriveSelectedAudiences(audienceTarget);
            return arr.includes('all') ? 'all' : arr[0];
          };
          const deriveClassTargets = (audienceTarget) => {
            const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
            const classes = targets.filter(t => t.target_type === 'Class').flatMap(t => t.target_ids || []);
            const sections = targets.filter(t => t.target_type === 'Section').flatMap(t => t.target_ids || []);
            return { classes: classes.map(String), sections: sections.map(String) };
          };
          const formattedEvents = eventsData.map(event => {
            const at = event.audience_target;
            const sel = deriveSelectedAudiences(at);
            const aud = deriveAudience(at);
            const cs = deriveClassTargets(at);
            const rolesToNotify = Array.isArray(at)
              ? at.flatMap(t => Array.isArray(t.roles_to_notify) ? t.roles_to_notify : [])
              : [];
            const notifyParents = rolesToNotify.includes('Parent');
            const notifyTeachers = rolesToNotify.includes('Teacher');
            
            // Handle date/time parsing safely
            let startDt, endDt;
            try {
                if (event.start_date && event.start_time) {
                    const datePart = new Date(event.start_date);
                    if (isNaN(datePart.getTime())) throw new Error('Invalid start_date');
                    const d = format(datePart, 'yyyy-MM-dd');
                    startDt = new Date(`${d}T${event.start_time}`);
                } else {
                    startDt = new Date(event.start_time || event.start_date || new Date());
                }
                if (isNaN(startDt.getTime())) {
                    console.warn('Invalid start date computed, falling back to now', event);
                    startDt = new Date();
                }
            } catch (e) {
                console.warn('Error parsing start date', e);
                startDt = new Date();
            }
            
            try {
                if (event.end_date && event.end_time) {
                    const datePart = new Date(event.end_date);
                    if (isNaN(datePart.getTime())) throw new Error('Invalid end_date');
                    const d = format(datePart, 'yyyy-MM-dd');
                    endDt = new Date(`${d}T${event.end_time}`);
                } else {
                    endDt = new Date(event.end_time || event.end_date || new Date());
                }
                if (isNaN(endDt.getTime())) {
                    console.warn('Invalid end date computed, falling back to now', event);
                    endDt = new Date();
                }
            } catch (e) {
                console.warn('Error parsing end date', e);
                endDt = new Date();
            }

            return {
              ...event,
              start: startDt,
              end: endDt,
              title: event.event_name,
              description: event.event_description || '',
              eventType: event.event_type,
              recurrence_rule: event.recurrence_rule,
              audience_target: at,
              audience: aud,
              selectedAudiences: sel,
              selectedClasses: cs.classes,
              selectedSections: cs.sections,
              room_id: event.room_id,
              event_status: event.event_status,
              notifyParents,
              notifyTeachers,
              allDay: event.is_all_day,
              subject_name: event.subject_name,
              curriculum_book_name: event.curriculum_book,
            };
          });
          setEvents(formattedEvents);
        } catch (error) {
          console.error('Failed to fetch events:', error);
        }
      } else {
        setEvents([]);
      }
    };
    fetchEvents();
  }, [getCampusId, academicYearValidation.academicYearId]);

  useEffect(() => {
    const loadSectionsForEdit = async () => {
      if (
        isEditOpen &&
        editForm.selectedAudiences.includes('Class') &&
        editForm.selectedClasses && editForm.selectedClasses.length > 0 &&
        academicYearValidation.academicYearId
      ) {
        try {
          const accum = []
          for (const classId of editForm.selectedClasses) {
            const res = await sectionService.getAllSections({
              academic_year_id: academicYearValidation.academicYearId,
              class_id: classId
            })
            const secs = (res.data?.sections || []).map(s => ({ id: s.section_id, name: s.section_name }))
            accum.push(...secs)
          }
          const unique = []
          const seen = new Set()
          for (const s of accum) {
            const key = String(s.id)
            if (!seen.has(key)) { seen.add(key); unique.push(s) }
          }
          setAvailableSections(unique)
        } catch (err) {
          setAvailableSections([])
        }
      }
    }
    loadSectionsForEdit()
  }, [isEditOpen, editForm.selectedAudiences, editForm.selectedClasses, academicYearValidation.academicYearId])

  const addEvent = async () => {
    const baseStart = new Date(form.start)
    let baseEnd
    if (form.allDay) {
      baseEnd = new Date(baseStart)
      baseEnd.setHours(23, 59, 59, 999)
    } else {
      baseEnd = new Date(form.end)
    }

    if (!(form.title && baseStart && baseEnd && baseEnd >= baseStart)) return
    if (form.eventType === 'Test' && !String(form.subject_name || '').trim()) {
      toast.error('Subject Name is required for Test events')
      return
    }
    if (form.eventType === 'Test' && !String(form.curriculum_book_name || '').trim()) {
      toast.error('Curriculum Book Name is required for Test events')
      return
    }

    const deriveAudience = (audiences) => {
      if (audiences.includes('all')) return 'all'
      if (audiences.includes('Class')) return 'Class'
      if (audiences.includes('Teachers')) return 'Teachers'
      if (audiences.includes('Employees')) return 'Employees'
      if (audiences.includes('Parents')) return 'Parents'
      if (audiences.includes('Students')) return 'Students'
      return 'all'
    }

    const buildAudienceTarget = () => {
      const targets = [];
      const rolesToNotify = [];
      if (form.notifyTeachers) rolesToNotify.push('Teacher');
      if (form.notifyParents) rolesToNotify.push('Parent');

      const pushWithRoles = (obj) => {
        if (rolesToNotify.length > 0) obj.roles_to_notify = rolesToNotify;
        targets.push(obj);
      };

      const selAud = Array.isArray(form.selectedAudiences) ? form.selectedAudiences : [];
      
      if (selAud.includes('all')) {
        pushWithRoles({ target_type: 'Campus', target_ids: ['ALL'] });
      }
      
      if (selAud.includes('Class')) {
        const sectionIds = Array.isArray(form.selectedSections) ? form.selectedSections.map(String) : [];
        const classIds = Array.isArray(form.selectedClasses) ? form.selectedClasses.map(String) : [];
        
        if (sectionIds.length > 0) {
          pushWithRoles({ target_type: 'Section', target_ids: sectionIds });
        } else if (classIds.length > 0) {
          pushWithRoles({ target_type: 'Class', target_ids: classIds });
        }
      }
      
      if (selAud.includes('Teachers')) pushWithRoles({ target_type: 'Role', target_ids: ['Teacher'] });
      if (selAud.includes('Employees')) pushWithRoles({ target_type: 'Role', target_ids: ['Employee'] });
      if (selAud.includes('Parents')) pushWithRoles({ target_type: 'Role', target_ids: ['Parent'] });
      if (selAud.includes('Students')) pushWithRoles({ target_type: 'Role', target_ids: ['Student'] });
      
      return targets.length > 0 ? targets : [{ target_type: 'Campus', target_ids: ['ALL'] }];
    };

  const buildWeeklyRRule = (repeat, frequency) => {
    if (!repeat || repeat === 'no') return 'No repeat';
    const freq = Array.isArray(frequency) ? frequency.slice() : [];
    let days = freq.includes('Everyday') ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : freq;
    const map = { Sunday:'SU', Monday:'MO', Tuesday:'TU', Wednesday:'WE', Thursday:'TH', Friday:'FR', Saturday:'SA' };
    const byDays = days.filter(d => map[d]).map(d => map[d]);
    if (byDays.length === 0) return 'No repeat';
    return `FREQ=WEEKLY;BYDAY=${byDays.join(',')}`;
  };

  const newEvent = {
    event_name: form.title,
    start_date: format(baseStart, 'yyyy-MM-dd'),
    end_date: format(baseEnd, 'yyyy-MM-dd'),
    start_time: format(baseStart, 'HH:mm:ss'),
    end_time: format(baseEnd, 'HH:mm:ss'),
    event_type: form.eventType,
    tenant_id: getTenantId(),
    campus_id: getCampusId(),
    scheduled_by: getUserId(),
    academic_year_id: academicYearValidation.academicYearId,
    description: form.description,
    audience: deriveAudience(form.selectedAudiences),
    selected_audiences: form.selectedAudiences,
    selected_classes: (form.selectedClasses || []).map(String),
    selected_sections: (form.selectedSections || []).map(String),
    room_id: form.room_id || null,
    notify_parents: form.notifyParents,
    notify_teachers: form.notifyTeachers,
    event_status: form.event_status,
    is_all_day: form.allDay,
    repeat: form.repeat,
    frequency: form.frequency,
    recurrence_rule: buildWeeklyRRule(form.repeat, form.frequency),
    audience_target: buildAudienceTarget(),
    subject_name: form.eventType === 'Test' ? form.subject_name : undefined,
    curriculum_book: form.eventType === 'Test' ? form.curriculum_book_name : undefined,
    total_score: form.eventType === 'Test' ? form.total_score : undefined
  }

  console.log('Create Event Frontend Payload:', newEvent);

    try {
      await eventService.createEvent(getCampusId(), newEvent);
      // Refetch events to show the new ones
      const response = await eventService.getEvents(getCampusId(), academicYearValidation.academicYearId);
      const deriveSelectedAudiences = (audienceTarget) => {
        if (!audienceTarget) return ['all'];
        const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
        const arr = [];
        for (const t of targets) {
          if (t.target_type === 'Campus') { if (!arr.includes('all')) arr.push('all'); }
          if (t.target_type === 'Class' || t.target_type === 'Section') { if (!arr.includes('Class')) arr.push('Class'); }
          if (t.target_type === 'Role' && Array.isArray(t.target_ids)) {
            for (const rid of t.target_ids) {
              if (rid === 'Teacher' && !arr.includes('Teachers')) arr.push('Teachers');
              if (rid === 'Employee' && !arr.includes('Employees')) arr.push('Employees');
              if (rid === 'Parent' && !arr.includes('Parents')) arr.push('Parents');
              if (rid === 'Student' && !arr.includes('Students')) arr.push('Students');
            }
          }
        }
        return arr.length ? arr : ['all'];
      };
      const deriveAudience = (audienceTarget) => {
        const arr = deriveSelectedAudiences(audienceTarget);
        return arr.includes('all') ? 'all' : arr[0];
      };
      const deriveClassTargets = (audienceTarget) => {
        const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
        const classes = targets.filter(t => t.target_type === 'Class').flatMap(t => t.target_ids || []);
        const sections = targets.filter(t => t.target_type === 'Section').flatMap(t => t.target_ids || []);
        return { classes: classes.map(String), sections: sections.map(String) };
      };
      const formattedEvents = response.data.map(event => {
        const at = event.audience_target;
        const sel = deriveSelectedAudiences(at);
        const aud = deriveAudience(at);
        const cs = deriveClassTargets(at);
        const rolesToNotify = Array.isArray(at)
          ? at.flatMap(t => Array.isArray(t.roles_to_notify) ? t.roles_to_notify : [])
          : [];
        const notifyParents = rolesToNotify.includes('Parent');
        const notifyTeachers = rolesToNotify.includes('Teacher');
        
        // Handle date/time parsing safely
        let startDt, endDt;
        if (event.start_date && event.start_time) {
            const d = format(new Date(event.start_date), 'yyyy-MM-dd');
            startDt = new Date(`${d}T${event.start_time}`);
        } else {
            startDt = new Date(event.start_time || event.start_date || new Date());
        }
        
        if (event.end_date && event.end_time) {
            const d = format(new Date(event.end_date), 'yyyy-MM-dd');
            endDt = new Date(`${d}T${event.end_time}`);
        } else {
            endDt = new Date(event.end_time || event.end_date || new Date());
        }

        return {
          ...event,
          start: startDt,
          end: endDt,
          title: event.event_name,
          description: event.event_description || '',
          eventType: event.event_type,
          recurrence_rule: event.recurrence_rule,
          audience_target: at,
          audience: aud,
          selectedAudiences: sel,
          selectedClasses: cs.classes,
          selectedSections: cs.sections,
          room_id: event.room_id,
          event_status: event.event_status,
          notifyParents,
          notifyTeachers,
          allDay: event.is_all_day,
          subject_name: event.subject_name,
          curriculum_book_name: event.curriculum_book,
        };
      });
      setEvents(formattedEvents);
      setIsAddOpen(false)
      setForm({ title: '', description: '', start: new Date(), end: new Date(), allDay: false, academic_year_id: academicYearValidation.academicYearId, repeat: 'no', frequency: [], eventType: EVENT_TYPES[0], selectedAudiences: ['all'], selectedClasses: [], selectedSections: [], notifyParents: false, notifyTeachers: false, event_status: EVENT_STATUSES[0], subject_name: '', curriculum_book_name: '', total_score: 100, passing_score: 35 })
    } catch (error) {
      console.error('Failed to create events:', error);
    }
  }

  const editEvent = async () => {
    if (selectedIndex === null && !targetEvent) return;
    if (editForm.eventType === 'Test' && !String(editForm.subject_name || '').trim()) {
      toast.error('Subject Name is required for Test events')
      return
    }
    if (editForm.eventType === 'Test' && !String(editForm.curriculum_book_name || '').trim()) {
      toast.error('Curriculum Book Name is required for Test events')
      return
    }

    const deriveAudience = (audiences) => {
      if (audiences.includes('all')) return 'all'
      if (audiences.includes('Class')) return 'Class'
      if (audiences.includes('Teachers')) return 'Teachers'
      if (audiences.includes('Employees')) return 'Employees'
      if (audiences.includes('Parents')) return 'Parents'
      if (audiences.includes('Students')) return 'Students'
      return 'all'
    }
  const buildAudienceTarget = () => {
    const targets = [];
    const rolesToNotify = [];
    if (editForm.notifyTeachers) rolesToNotify.push('Teacher');
    if (editForm.notifyParents) rolesToNotify.push('Parent');

    const pushWithRoles = (obj) => {
      if (rolesToNotify.length > 0) obj.roles_to_notify = rolesToNotify;
      targets.push(obj);
    };

    const selAud = Array.isArray(editForm.selectedAudiences) ? editForm.selectedAudiences : [];
    if (selAud.includes('all')) {
      pushWithRoles({ target_type: 'Campus', target_ids: ['ALL'] });
    }
    if (selAud.includes('Class')) {
      const sectionIds = Array.isArray(editForm.selectedSections) ? editForm.selectedSections.map(String) : [];
      const classIds = Array.isArray(editForm.selectedClasses) ? editForm.selectedClasses.map(String) : [];
      if (sectionIds.length > 0) {
        pushWithRoles({ target_type: 'Section', target_ids: sectionIds });
      } else if (classIds.length > 0) {
        pushWithRoles({ target_type: 'Class', target_ids: classIds });
      }
    }
    if (selAud.includes('Teachers')) pushWithRoles({ target_type: 'Role', target_ids: ['Teacher'] });
    if (selAud.includes('Employees')) pushWithRoles({ target_type: 'Role', target_ids: ['Employee'] });
    if (selAud.includes('Parents')) pushWithRoles({ target_type: 'Role', target_ids: ['Parent'] });
    if (selAud.includes('Student')) pushWithRoles({ target_type: 'Role', target_ids: ['Student'] });
    return targets.length > 0 ? targets : [{ target_type: 'Campus', target_ids: ['ALL'] }];
  };

  const buildWeeklyRRule = () => {
    if (!editForm.repeat || editForm.repeat === 'no') return 'No repeat';
    const freq = Array.isArray(editForm.frequency) ? editForm.frequency.slice() : [];
    let days = freq.includes('Everyday') ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : freq;
    const map = { Sunday:'SU', Monday:'MO', Tuesday:'TU', Wednesday:'WE', Thursday:'TH', Friday:'FR', Saturday:'SA' };
    const byDays = days.filter(d => map[d]).map(d => map[d]);
    if (byDays.length === 0) return 'No repeat';
    return `FREQ=WEEKLY;BYDAY=${byDays.join(',')}`;
  };

  const baseEvent = targetEvent || events[selectedIndex];
  const { eventType: _eventType, ...baseEventWithoutEventType } = baseEvent || {};
  const instanceDate = baseEvent?.start ? format(new Date(baseEvent.start), 'yyyy-MM-dd') : null;

  const updatedEvent = {
    ...baseEventWithoutEventType,
    event_name: editForm.title,
    description: editForm.description === '' ? null : editForm.description,
    start_time: new Date(editForm.start).toISOString(),
    end_time: new Date(editForm.end).toISOString(),
    start_date: format(new Date(editForm.start), 'yyyy-MM-dd'),
    end_date: format(new Date(editForm.end), 'yyyy-MM-dd'),
    is_all_day: editForm.allDay,
    event_type: editForm.eventType,
    tenant_id: getTenantId(),
    campus_id: getCampusId(),
    scheduled_by: getUserId(),
    audience: deriveAudience(editForm.selectedAudiences),
    selected_audiences: editForm.selectedAudiences,
    selected_classes: (editForm.selectedClasses || []).map(String),
    selected_sections: (editForm.selectedSections || []).map(String),
    room_id: editForm.room_id || null,
    notify_parents: editForm.notifyParents,
    notify_teachers: editForm.notifyTeachers,
    event_status: editForm.event_status,
    repeat: editForm.repeat,
    frequency: editForm.frequency,
    audience_target: buildAudienceTarget(),
    recurrence_rule: buildWeeklyRRule(),
    academic_year_id: academicYearValidation.academicYearId,
    subject_name: editForm.eventType === 'Test' ? editForm.subject_name : undefined,
    curriculum_book: editForm.eventType === 'Test' ? editForm.curriculum_book_name : undefined,
    total_score: editForm.eventType === 'Test' ? editForm.total_score : undefined
  };

  console.log('Update Event Frontend Payload:', updatedEvent);
  console.log('Update Event Frontend Params:', { recurrenceMode, instanceDate });

    try {
      await eventService.updateEvent(
          getCampusId(), 
          updatedEvent.event_id, 
          updatedEvent, 
          recurrenceMode, 
          recurrenceMode === 'single' || recurrenceMode === 'following' ? instanceDate : null
      );
      const response = await eventService.getEvents(getCampusId(), academicYearValidation.academicYearId);
      const deriveSelectedAudiences = (audienceTarget) => {
        if (!audienceTarget) return ['all'];
        const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
        const arr = [];
        for (const t of targets) {
          if (t.target_type === 'Campus') { if (!arr.includes('all')) arr.push('all'); }
          if (t.target_type === 'Class' || t.target_type === 'Section') { if (!arr.includes('Class')) arr.push('Class'); }
          if (t.target_type === 'Role' && Array.isArray(t.target_ids)) {
            for (const rid of t.target_ids) {
              if (rid === 'Teacher' && !arr.includes('Teachers')) arr.push('Teachers');
              if (rid === 'Employee' && !arr.includes('Employees')) arr.push('Employees');
              if (rid === 'Parent' && !arr.includes('Parents')) arr.push('Parents');
              if (rid === 'Student' && !arr.includes('Students')) arr.push('Students');
            }
          }
        }
        return arr.length ? arr : ['all'];
      };
      const deriveAudienceFromTarget = (audienceTarget) => {
        const arr = deriveSelectedAudiences(audienceTarget);
        return arr.includes('all') ? 'all' : arr[0];
      };
      const deriveClassTargets = (audienceTarget) => {
        const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
        const classes = targets.filter(t => t.target_type === 'Class').flatMap(t => t.target_ids || []);
        const sections = targets.filter(t => t.target_type === 'Section').flatMap(t => t.target_ids || []);
        return { classes: classes.map(String), sections: sections.map(String) };
      };
      const formattedEvents = response.data.map(event => {
        const at = event.audience_target;
        const sel = deriveSelectedAudiences(at);
        const aud = deriveAudienceFromTarget(at);
        const cs = deriveClassTargets(at);
        const rolesToNotify = Array.isArray(at)
          ? at.flatMap(t => Array.isArray(t.roles_to_notify) ? t.roles_to_notify : [])
          : [];
        const notifyParents = rolesToNotify.includes('Parent');
        const notifyTeachers = rolesToNotify.includes('Teacher');
        return {
          ...event,
          start: (() => {
             if (event.start_date && event.start_time) {
                 const d = format(new Date(event.start_date), 'yyyy-MM-dd');
                 // Ensure start_time doesn't have T prefix if we are concatenating, or just use it if it is time only
                 const t = event.start_time.includes('T') ? event.start_time.split('T')[1] : event.start_time;
                 return new Date(`${d}T${t}`);
             }
             return new Date(event.start_time || event.start_date || new Date());
          })(),
          end: (() => {
             if (event.end_date && event.end_time) {
                 const d = format(new Date(event.end_date), 'yyyy-MM-dd');
                 const t = event.end_time.includes('T') ? event.end_time.split('T')[1] : event.end_time;
                 return new Date(`${d}T${t}`);
             }
             return new Date(event.end_time || event.end_date || new Date());
          })(),
          title: event.event_name,
          description: event.event_description || '',
          eventType: event.event_type,
          recurrence_rule: event.recurrence_rule,
          audience_target: at,
          audience: aud,
          selectedAudiences: sel,
          selectedClasses: cs.classes,
          selectedSections: cs.sections,
          room_id: event.room_id,
          event_status: event.event_status,
          notifyParents,
          notifyTeachers,
          allDay: event.is_all_day,
        };
      });
      setEvents(formattedEvents);
      setIsEditOpen(false);
      setSelectedIndex(null);
      setTargetEvent(null);
      setRecurrenceMode('single');
    } catch (error) { 
      console.error('Failed to update event:', error);
    }
  };

  return (
    <div className="container-fluid py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900">Calendar Events</h1>
        <p className="text-secondary-600">Create repeating events by weekday</p>
      </div>
      <Card>
        <div className="p-6 space-y-6">
          {/* Academic Year Selection Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Academic Year Selection</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <AcademicYearSelector
                campusId={getCampusId()}
                value={academicYearValidation.academicYearId}
                onChange={(e) => {
                  const raw = e.target.value;
                  const yearId = Number(raw);
                  const valid = Number.isInteger(yearId) && yearId > 0;
                  setAcademicYearValidation({ isValid: valid, academicYearId: valid ? yearId : null, message: valid ? '' : 'Invalid academic year' });
                  setForm(prev => ({ ...prev, academic_year_id: valid ? yearId : null }));
                }}
                onValidationChange={setAcademicYearValidation}
                name="academic_year_id"
                label="Academic Year"
                required={true}
              />
              {!academicYearValidation.isValid && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Please select a valid academic year to enable event management.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add Event Button Section */}
          <div className="flex justify-center">
            <button 
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                academicYearValidation.isValid 
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                  : 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
              }`} 
              onClick={() => academicYearValidation.isValid && setIsAddOpen(true)} 
              disabled={!academicYearValidation.isValid}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </span>
            </button>
          </div>

          {/* Board View + Filters */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
            {events.length === 0 ? (
              <div className="text-center py-12 text-secondary-600">
                <svg className="w-16 h-16 mx-auto mb-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium mb-2">No events to display</p>
                <p className="text-sm">
                  {academicYearValidation.isValid ? 'Create your first event to get started' : 'Select an academic year to view events'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="inline-flex rounded-lg border border-secondary-200 overflow-hidden">
                    {['day','week','month','year'].map((g) => (
                      <button
                        key={g}
                        className={`px-3 py-1 text-sm ${timeGranularity === g ? 'bg-primary-600 text-white' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                        onClick={() => setTimeGranularity(g)}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={format(filterDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                        setFilterDate(d);
                      }
                    }}
                    className="px-3 py-1 text-sm border border-secondary-300 rounded"
                  />
                </div>
                {(() => {
                  const { start, end } = getRange(timeGranularity, filterDate);
                  const filt = expandEvents(events, start, end);
                  const groups = {
                    'Yet to start': [],
                    'Ongoing': [],
                    'Completed': [],
                    'Postponed': []
                  };
                  filt.forEach(ev => {
                    const key = normalizeStatus(ev.event_status, ev);
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(ev);
                  });
                  const order = ['Yet to start','Ongoing','Completed','Postponed'];
                  const styleMap = {
                    'Yet to start': { header: 'bg-yellow-50 border-b border-yellow-200 text-yellow-800', card: 'bg-yellow-50' },
                    'Ongoing': { header: 'bg-green-50 border-b border-green-200 text-green-800', card: 'bg-green-50' },
                    'Completed': { header: 'bg-gray-50 border-b border-gray-200 text-secondary-800', card: 'bg-gray-50' },
                    'Postponed': { header: 'bg-red-50 border-b border-red-200 text-red-800', card: 'bg-red-50' }
                  };
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {order.map((col) => (
                        <div key={col} className="border border-secondary-200 rounded-lg overflow-hidden">
                          <div className={`px-3 py-2 font-medium ${styleMap[col]?.header || 'bg-secondary-50 border-b border-secondary-200 text-secondary-800'}`}>{col}</div>
                          <div className="p-3 space-y-2">
                            {(groups[col] || []).length === 0 ? (
                              <div className="text-sm text-secondary-500">No events</div>
                            ) : (
                              groups[col].map((ev, idx) => {
                                const cardStyle = ev.is_cancelled ? 'bg-red-50 border-red-200' : (styleMap[col]?.card || '');
                                return (
                                <div
                                  key={idx}
                                  className={`border border-secondary-200 rounded p-2 ${cardStyle} ${canManageEvents ? 'cursor-pointer hover:bg-secondary-50' : ''}`}
                                  onClick={() => openEditForEvent(ev)}
                                >
                                  <div className="font-medium text-secondary-900">
                                    {ev.title}
                                    {ev.room_id && <span className="ml-2 text-xs font-normal text-secondary-500">(Room: {ev.room_id})</span>}
                                    {ev.is_cancelled && <span className="ml-2 text-xs font-bold text-red-600">(Cancelled)</span>}
                                  </div>
                                  <div className="text-xs text-secondary-700">
                                    {ev._isInstance ? (
                                      <div className="flex flex-col gap-0.5">
                                        <span>
                                          {(() => {
                                            try {
                                              return format(new Date(ev.start), 'PPpp');
                                            } catch (e) {
                                              return 'Invalid Date';
                                            }
                                          })()}
                                        </span>
                                        <span className="text-secondary-500 text-[10px]">
                                          Series: {(() => {
                                            try {
                                              // Use start_date for the series date range, fallback to current start
                                              const dateVal = ev.start_date || ev.start;
                                              const d = new Date(dateVal);
                                              if (isNaN(d.getTime())) return format(new Date(ev.start), 'P');
                                              return format(d, 'P');
                                            } catch (e) {
                                              return 'Invalid Date';
                                            }
                                          })()} - {(() => {
                                            try {
                                              // Use end_date for the series date range
                                              const dateVal = ev.end_date || ev.end;
                                              const d = new Date(dateVal);
                                              if (isNaN(d.getTime())) return format(new Date(ev.end), 'P');
                                              return format(d, 'P');
                                            } catch (e) {
                                              return 'Invalid Date';
                                            }
                                          })()}
                                        </span>
                                      </div>
                                    ) : (
                                      <span>
                                        {(() => {
                                          try {
                                            return format(new Date(ev.start), 'PPpp');
                                          } catch (e) {
                                            return 'Invalid Date';
                                          }
                                        })()} → {(() => {
                                          try {
                                            return format(new Date(ev.end), 'PPpp');
                                          } catch (e) {
                                            return 'Invalid Date';
                                          }
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-secondary-600">{ev.eventType}</div>
                                </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </Card>
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Event" size="lg" showCloseButton={false}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event name <RequiredAsterisk />
              </label>
              <input
                className="input"
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event Type <RequiredAsterisk />
              </label>
              <select
                className="input"
                value={form.eventType}
                onChange={(e) => setForm(prev => ({ ...prev, eventType: e.target.value }))}
              >
                {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Event description</label>
              <input
                className="input h-[42px] min-h-[42px] py-2"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event Status <RequiredAsterisk />
              </label>
              <select
                className="input"
                value={form.event_status}
                onChange={(e) => setForm(prev => ({ ...prev, event_status: e.target.value }))}
              >
                {EVENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            {form.eventType === 'Test' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Subject Name <RequiredAsterisk />
                  </label>
                  <select
                    className="input"
                    value={form.subject_name}
                    onChange={(e) => setForm(prev => ({ ...prev, subject_name: e.target.value }))}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Curriculum Book Name <RequiredAsterisk />
                  </label>
                  <select
                    className="input"
                    value={form.curriculum_book_name}
                    onChange={(e) => setForm(prev => ({ ...prev, curriculum_book_name: e.target.value }))}
                    required
                  >
                    <option value="">Select a curriculum book</option>
                    {CURRICULUM_BOOKS.map(book => <option key={book.value} value={book.value}>{book.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Total Score</label>
                  <input
                    className="input"
                    type="number"
                    value={form.total_score}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      setForm(prev => ({ 
                        ...prev, 
                        total_score: total,
                        passing_score: (total * 0.35).toFixed(2)
                      }));
                    }}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Passing Score (35%)</label>
                  <input
                    className="input bg-gray-100"
                    type="number"
                    value={form.passing_score}
                    readOnly
                    disabled
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {["all","Class","Teachers","Employees","Parents","Students"].map(a => (
                  <label key={a} className="flex items-center p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                      checked={form.selectedAudiences.includes(a)}
                      disabled={form.selectedAudiences.includes('all') && a !== 'all'}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setForm(prev => {
                          let arr = [...prev.selectedAudiences]
                          if (checked) {
                            if (a === 'all') {
                              arr = ['all']
                            } else {
                              arr = arr.filter(x => x !== 'all')
                              if (!arr.includes(a)) arr.push(a)
                            }
                          } else {
                            arr = arr.filter(x => x !== a)
                          }
                          return { ...prev, selectedAudiences: arr }
                        })
                      }}
                    />
                    <span className={`text-xs font-medium ${
                      form.selectedAudiences.includes('all') && a !== 'all' 
                        ? 'text-secondary-400' 
                        : 'text-secondary-700'
                    }`}>
                      {a === 'all' ? 'All Campus' : a}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Room</label>
              <select
                className="input mb-3"
                value={form.room_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, room_id: e.target.value }))}
              >
                <option value="">Select a room</option>
                {(showAvailableRoomsOnly ? rooms.filter(r => String(r.status).toLowerCase() !== 'booked') : rooms)
                  .map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <label className="flex items-center p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                  checked={showAvailableRoomsOnly}
                  onChange={(e) => setShowAvailableRoomsOnly(e.target.checked)}
                />
                <span className="text-sm font-medium text-secondary-700">Show only available rooms</span>
              </label>
              {form.room_id && (() => {
                const room = rooms.find(r => String(r.id) === String(form.room_id));
                return room ? (
                  <div className="text-sm text-secondary-600 mt-2">Available capacity: {room.available_capacity ?? 0}</div>
                ) : null;
              })()}
            </div>

            {form.selectedAudiences.includes('Class') && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Class</label>
                  <select
                    className="input"
                    value={form.selectedClasses[0] || ''}
                    onChange={(e) => {
                      const classId = String(e.target.value)
                      setForm(prev => {
                        const audiences = prev.selectedAudiences || []
                        const withClass = audiences.includes('Class') ? audiences : [...audiences, 'Class']
                        return { ...prev, selectedClasses: [classId], selectedSections: [], selectedAudiences: withClass }
                      })
                      ;(async () => {
                        try {
                          const res = await sectionService.getAllSections({ academic_year_id: academicYearValidation.academicYearId, class_id: classId })
                          const secs = (res.data?.sections || []).map(s => ({ id: s.section_id, name: s.section_name }))
                          setAvailableSections(secs)
                        } catch (err) {
                          setAvailableSections([])
                        }
                      })()
                    }} >
                    <option value="">Select a class</option>
                    {classes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                </div>
                {(form.selectedClasses || []).length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Sections</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {availableSections.map(s => (
                        <label key={s.id} className="flex items-center p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                            checked={form.selectedSections.includes(String(s.id))}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setForm(prev => {
                                let secs = [...prev.selectedSections]
                                if (checked) {
                                  if (!secs.includes(String(s.id))) secs.push(String(s.id))
                                } else {
                                  secs = secs.filter(id => id !== String(s.id))
                                }
                                const audiences = prev.selectedAudiences || []
                                const withClass = audiences.includes('Class') ? audiences : [...audiences, 'Class']
                                return { ...prev, selectedSections: secs, selectedAudiences: withClass }
                              })
                            }}
                          />
                          <span className="text-sm font-medium text-secondary-700">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="md:col-span-4">
                  {(() => {
                    const clsName = classes.find(c => String(c.id) === String(form.selectedClasses[0]))?.name
                    const secNames = availableSections.filter(s => form.selectedSections.includes(String(s.id))).map(s => s.name)
                    if (!clsName && secNames.length === 0) return null;
                    return (
                      <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="text-sm text-primary-700">
                          <span className="font-medium">Selected:</span>
                          {clsName && <span className="ml-2">Class: {clsName}</span>}
                          {secNames.length > 0 && <span className="ml-2">| Sections: {secNames.join(', ')}</span>}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}

            {form.selectedAudiences.includes('Class') && (form.selectedSections || []).length > 0 && (
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">Notifications</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                      checked={form.notifyParents}
                      onChange={(e) => setForm(prev => ({ ...prev, notifyParents: e.target.checked }))}
                    />
                    <span className="text-sm font-medium text-secondary-700">Notify parents</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                      checked={form.notifyTeachers}
                      onChange={(e) => setForm(prev => ({ ...prev, notifyTeachers: e.target.checked }))}
                    />
                    <span className="text-sm font-medium text-secondary-700">Notify teachers</span>
                  </label>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Date <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={format(form.start, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const dateStr = e.target.value
                      const timeStr = format(form.start, "HH:mm")
                      const newStart = new Date(`${dateStr}T${timeStr}`)
                      setForm(prev => ({ ...prev, start: newStart }))
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Time <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="time"
                    value={format(form.start, "HH:mm")}
                    onChange={(e) => {
                      const timeStr = e.target.value
                      const dateStr = format(form.start, "yyyy-MM-dd")
                      const newStart = new Date(`${dateStr}T${timeStr}`)
                      setForm(prev => ({ ...prev, start: newStart }))
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Date <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={format(form.end, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const dateStr = e.target.value
                      const timeStr = format(form.end, "HH:mm")
                      const newEnd = new Date(`${dateStr}T${timeStr}`)
                      setForm(prev => ({ ...prev, end: newEnd }))
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Time <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="time"
                    value={format(form.end, "HH:mm")}
                    onChange={(e) => {
                      const timeStr = e.target.value
                      const dateStr = format(form.end, "yyyy-MM-dd")
                      const newEnd = new Date(`${dateStr}T${timeStr}`)
                      setForm(prev => ({ ...prev, end: newEnd }))
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form.allDay}
                  onChange={e => {
                    const allDay = e.target.checked
                    if (allDay) {
                      const newEnd = new Date(form.start)
                      newEnd.setHours(23, 59, 59, 999)
                      setForm(prev => ({ ...prev, allDay, end: newEnd }))
                    } else {
                      setForm(prev => ({ ...prev, allDay }))
                    }
                  }}
                />
                <span className="text-sm font-medium text-secondary-700">All day event</span>
              </label>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Repeat</label>
              <select
                className="input"
                value={form.repeat}
                onChange={(e) => setForm(prev => ({ ...prev, repeat: e.target.value }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Frequency</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Everyday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day) => (
                  <label key={day} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                    form.repeat !== 'yes' 
                      ? 'border-secondary-200 bg-secondary-50 text-secondary-400 cursor-not-allowed' 
                      : 'border-secondary-200 hover:bg-secondary-50'
                  }`}>
                    <input
                      type="checkbox"
                      className="w-3 h-3 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-1 mr-2"
                      checked={form.frequency.includes(day)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setForm(prev => {
                          let freq = [...prev.frequency]
                          if (checked) {
                            if (day === 'Everyday') {
                              freq = ['Everyday']
                            } else {
                              freq = freq.filter(f => f !== 'Everyday')
                              if (!freq.includes(day)) freq.push(day)
                            }
                          } else {
                            freq = freq.filter(f => f !== day)
                          }
                          return { ...prev, frequency: freq }
                        })
                      }}
                      disabled={form.repeat !== 'yes'}
                    />
                    <span className={`text-[10px] font-medium ${
                      form.repeat !== 'yes' ? 'text-secondary-400' : 'text-secondary-700'
                    }`}>
                      {day === 'Everyday' ? 'Every Day' : day.substring(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-secondary-200">
            <button 
              className="px-6 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              onClick={addEvent}
            >
              Add Event
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Event" size="lg" showCloseButton={false}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event name <RequiredAsterisk />
              </label>
              <input className="input" type="text" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event Type <RequiredAsterisk />
              </label>
              <select
                className="input"
                value={editForm.eventType}
                onChange={(e) => setEditForm(prev => ({ ...prev, eventType: e.target.value }))}
              >
                {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Event description</label>
              <textarea
                className="input h-[42px] min-h-[42px] py-2"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event Status <RequiredAsterisk />
              </label>
              <select
                className="input"
                value={editForm.event_status}
                onChange={(e) => setEditForm(prev => ({ ...prev, event_status: e.target.value }))}
              >
                {EVENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            {editForm.eventType === 'Test' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Subject Name <RequiredAsterisk />
                  </label>
                  <select
                    className="input"
                    value={editForm.subject_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject_name: e.target.value }))}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Curriculum Book Name <RequiredAsterisk />
                  </label>
                  <select
                    className="input"
                    value={editForm.curriculum_book_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, curriculum_book_name: e.target.value }))}
                    required
                  >
                    <option value="">Select a curriculum book</option>
                    {CURRICULUM_BOOKS.map(book => <option key={book.value} value={book.value}>{book.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Total Score</label>
                  <input
                    className="input"
                    type="number"
                    value={editForm.total_score}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      setEditForm(prev => ({ 
                        ...prev, 
                        total_score: total,
                        passing_score: (total * 0.35).toFixed(2)
                      }));
                    }}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Passing Score (35%)</label>
                  <input
                    className="input bg-gray-100"
                    type="number"
                    value={editForm.passing_score}
                    readOnly
                    disabled
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {["all","Class","Teachers","Employees","Parents","Students"].map(a => (
                  <label key={a} className="flex items-center p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                      checked={editForm.selectedAudiences.includes(a)}
                      disabled={editForm.selectedAudiences.includes('all') && a !== 'all'}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setEditForm(prev => {
                          let arr = [...prev.selectedAudiences]
                          if (checked) {
                            if (a === 'all') {
                              arr = ['all']
                            } else {
                              arr = arr.filter(x => x !== 'all')
                              if (!arr.includes(a)) arr.push(a)
                            }
                          } else {
                            arr = arr.filter(x => x !== a)
                          }
                          return { ...prev, selectedAudiences: arr }
                        })
                      }}
                    />
                    <span className={`text-xs font-medium ${
                      editForm.selectedAudiences.includes('all') && a !== 'all' 
                        ? 'text-secondary-400' 
                        : 'text-secondary-700'
                    }`}>
                      {a === 'all' ? 'All Campus' : a}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Room</label>
              <select
                className="input mb-3"
                value={editForm.room_id || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, room_id: e.target.value }))}
              >
                <option value="">Select a room</option>
                {(showAvailableRoomsOnlyEdit ? rooms.filter(r => String(r.status).toLowerCase() !== 'booked') : rooms)
                  .map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <label className="flex items-center p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                  checked={showAvailableRoomsOnlyEdit}
                  onChange={(e) => setShowAvailableRoomsOnlyEdit(e.target.checked)}
                />
                <span className="text-sm font-medium text-secondary-700">Show only available rooms</span>
              </label>
              {editForm.room_id && (() => {
                const room = rooms.find(r => String(r.id) === String(editForm.room_id));
                return room ? (
                  <div className="text-sm text-secondary-600 mt-2">Available capacity: {room.available_capacity ?? 0}</div>
                ) : null;
              })()}
            </div>

            {editForm.selectedAudiences.includes('Class') && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Class</label>
                  <select
                    className="input"
                    value={editForm.selectedClasses[0] || ''}
                    onChange={(e) => {
                      const classId = String(e.target.value)
                      setEditForm(prev => {
                        const audiences = prev.selectedAudiences || []
                        const withClass = audiences.includes('Class') ? audiences : [...audiences, 'Class']
                        return { ...prev, selectedClasses: [classId], selectedSections: [], selectedAudiences: withClass }
                      })
                      ;(async () => {
                        try {
                          const res = await sectionService.getAllSections({ academic_year_id: academicYearValidation.academicYearId, class_id: classId })
                          const secs = (res.data?.sections || []).map(s => ({ id: s.section_id, name: s.section_name }))
                          setAvailableSections(secs)
                        } catch (err) {
                          setAvailableSections([])
                        }
                      })()
                    }} >
                    <option value="">Select a class</option>
                    {classes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                </div>
                {(editForm.selectedClasses || []).length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Sections</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {availableSections.map(s => (
                        <label key={s.id} className="flex items-center p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-2"
                            checked={editForm.selectedSections.includes(String(s.id))}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setEditForm(prev => {
                                let secs = [...prev.selectedSections]
                                if (checked) {
                                  if (!secs.includes(String(s.id))) secs.push(String(s.id))
                                } else {
                                  secs = secs.filter(id => id !== String(s.id))
                                }
                                const audiences = prev.selectedAudiences || []
                                const withClass = audiences.includes('Class') ? audiences : [...audiences, 'Class']
                                return { ...prev, selectedSections: secs, selectedAudiences: withClass }
                              })
                            }}
                          />
                          <span className="text-sm font-medium text-secondary-700">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="md:col-span-4">
                  {(() => {
                    const clsName = classes.find(c => String(c.id) === String(editForm.selectedClasses[0]))?.name
                    const secNames = availableSections.filter(s => editForm.selectedSections.includes(String(s.id))).map(s => s.name)
                    if (!clsName && secNames.length === 0) return null;
                    return (
                      <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="text-sm text-primary-700">
                          <span className="font-medium">Selected:</span>
                          {clsName && <span className="ml-2">Class: {clsName}</span>}
                          {secNames.length > 0 && <span className="ml-2">| Sections: {secNames.join(', ')}</span>}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}

            {editForm.selectedAudiences.includes('Class') && (editForm.selectedSections || []).length > 0 && (
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">Notifications</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                      checked={editForm.notifyParents}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notifyParents: e.target.checked }))}
                    />
                    <span className="text-sm font-medium text-secondary-700">Notify parents</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2 mr-3"
                      checked={editForm.notifyTeachers}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notifyTeachers: e.target.checked }))}
                    />
                    <span className="text-sm font-medium text-secondary-700">Notify teachers</span>
                  </label>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Date <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={format(editForm.start, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const dateStr = e.target.value
                      const timeStr = format(editForm.start, "HH:mm")
                      const newStart = new Date(`${dateStr}T${timeStr}`)
                      setEditForm(prev => ({ ...prev, start: newStart }))
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Time <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="time"
                    value={format(editForm.start, "HH:mm")}
                    onChange={(e) => {
                      const timeStr = e.target.value
                      const dateStr = format(editForm.start, "yyyy-MM-dd")
                      const newStart = new Date(`${dateStr}T${timeStr}`)
                      setEditForm(prev => ({ ...prev, start: newStart }))
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Date <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={format(editForm.end, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const dateStr = e.target.value
                      const timeStr = format(editForm.end, "HH:mm")
                      const newEnd = new Date(`${dateStr}T${timeStr}`)
                      setEditForm(prev => ({ ...prev, end: newEnd }))
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Time <RequiredAsterisk />
                  </label>
                  <input
                    className="input"
                    type="time"
                    value={format(editForm.end, "HH:mm")}
                    onChange={(e) => {
                      const timeStr = e.target.value
                      const dateStr = format(editForm.end, "yyyy-MM-dd")
                      const newEnd = new Date(`${dateStr}T${timeStr}`)
                      setEditForm(prev => ({ ...prev, end: newEnd }))
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
                  checked={editForm.allDay}
                  onChange={e => {
                    const allDay = e.target.checked
                    if (allDay) {
                      const newEnd = new Date(editForm.start)
                      newEnd.setHours(23, 59, 59, 999)
                      setEditForm(prev => ({ ...prev, allDay, end: newEnd }))
                    } else {
                      setEditForm(prev => ({ ...prev, allDay }))
                    }
                  }}
                />
                <span className="text-sm font-medium text-secondary-700">All day event</span>
              </label>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Repeat</label>
              <select
                className="input"
                value={editForm.repeat}
                onChange={(e) => setEditForm(prev => ({ ...prev, repeat: e.target.value }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Frequency</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Everyday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day) => (
                  <label key={day} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                    editForm.repeat !== 'yes' 
                      ? 'border-secondary-200 bg-secondary-50 text-secondary-400 cursor-not-allowed' 
                      : 'border-secondary-200 hover:bg-secondary-50'
                  }`}>
                    <input
                      type="checkbox"
                      className="w-3 h-3 text-primary-600 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-1 mr-2"
                      checked={editForm.frequency.includes(day)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setEditForm(prev => {
                          let freq = [...prev.frequency]
                          if (checked) {
                            if (day === 'Everyday') {
                              freq = ['Everyday']
                            } else {
                              freq = freq.filter(f => f !== 'Everyday')
                              if (!freq.includes(day)) freq.push(day)
                            }
                          } else {
                            freq = freq.filter(f => f !== day)
                          }
                          return { ...prev, frequency: freq }
                        })
                      }}
                      disabled={editForm.repeat !== 'yes'}
                    />
                    <span className={`text-[10px] font-medium ${
                      editForm.repeat !== 'yes' ? 'text-secondary-400' : 'text-secondary-700'
                    }`}>
                      {day === 'Everyday' ? 'Every Day' : day.substring(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-6 border-t border-secondary-200">
            <button 
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              onClick={() => { setIsEditOpen(false); setShowDelete(true) }}
            >
              Delete
            </button>
            <div className="flex gap-3">
              <button 
                className="px-6 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                onClick={editEvent}
              >
                Update Event
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal isOpen={recurrenceModalOpen} onClose={() => { setRecurrenceModalOpen(false); setTargetEvent(null); }} title="Recurrence Options" size="sm">
        <div className="p-6">
          <p className="mb-4 text-secondary-700">This is a recurring event. Select which events you want to edit:</p>
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg hover:bg-secondary-50 cursor-pointer">
              <input 
                type="radio" 
                name="recurrenceMode" 
                value="single" 
                checked={recurrenceMode === 'single'} 
                onChange={() => setRecurrenceMode('single')} 
                className="mr-3 text-primary-600 focus:ring-primary-500" 
              />
              <div>
                <div className="font-medium text-secondary-900">This event only</div>
                <div className="text-xs text-secondary-500">Only this instance will be affected</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg hover:bg-secondary-50 cursor-pointer">
              <input 
                type="radio" 
                name="recurrenceMode" 
                value="all" 
                checked={recurrenceMode === 'all'} 
                onChange={() => setRecurrenceMode('all')} 
                className="mr-3 text-primary-600 focus:ring-primary-500" 
              />
              <div>
                <div className="font-medium text-secondary-900">All events</div>
                <div className="text-xs text-secondary-500">All instances in the series will be affected</div>
              </div>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              className="px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors" 
              onClick={() => { setRecurrenceModalOpen(false); setTargetEvent(null); }}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" 
              onClick={() => {
                setRecurrenceModalOpen(false);
                proceedToEdit(targetEvent);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmationDialog
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelectedIndex(null); setTargetEvent(null); }}
        onConfirm={async () => {
          try {
            const ev = targetEvent || (selectedIndex !== null ? events[selectedIndex] : null);
            if (ev && ev.event_id) {
              const instanceDate = ev.start ? format(new Date(ev.start), 'yyyy-MM-dd') : null;
              await eventService.deleteEvent(
                getCampusId(), 
                ev.event_id, 
                recurrenceMode, 
                (recurrenceMode === 'single') ? instanceDate : null
              );
              // Refetch events
              const response = await eventService.getEvents(getCampusId(), academicYearValidation.academicYearId);
              const deriveSelectedAudiences = (audienceTarget) => {
                if (!audienceTarget) return ['all'];
                const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
                const arr = [];
                for (const t of targets) {
                  if (t.target_type === 'Campus') { if (!arr.includes('all')) arr.push('all'); }
                  if (t.target_type === 'Class' || t.target_type === 'Section') { if (!arr.includes('Class')) arr.push('Class'); }
                  if (t.target_type === 'Role' && Array.isArray(t.target_ids)) {
                    for (const rid of t.target_ids) {
                      if (rid === 'Teacher' && !arr.includes('Teachers')) arr.push('Teachers');
                      if (rid === 'Employee' && !arr.includes('Employees')) arr.push('Employees');
                      if (rid === 'Parent' && !arr.includes('Parents')) arr.push('Parents');
                      if (rid === 'Student' && !arr.includes('Students')) arr.push('Students');
                    }
                  }
                }
                return arr.length ? arr : ['all'];
              };
              const deriveAudience = (audienceTarget) => {
                const arr = deriveSelectedAudiences(audienceTarget);
                return arr.includes('all') ? 'all' : arr[0];
              };
              const deriveClassTargets = (audienceTarget) => {
                const targets = Array.isArray(audienceTarget) ? audienceTarget : [audienceTarget];
                const classes = targets.filter(t => t.target_type === 'Class').flatMap(t => t.target_ids || []);
                const sections = targets.filter(t => t.target_type === 'Section').flatMap(t => t.target_ids || []);
                return { classes: classes.map(String), sections: sections.map(String) };
              };
              const formattedEvents = response.data.map(event => {
                const at = event.audience_target;
                const sel = deriveSelectedAudiences(at);
                const aud = deriveAudience(at);
                const cs = deriveClassTargets(at);
                const rolesToNotify = Array.isArray(at)
                  ? at.flatMap(t => Array.isArray(t.roles_to_notify) ? t.roles_to_notify : [])
                  : [];
                const notifyParents = rolesToNotify.includes('Parent');
                const notifyTeachers = rolesToNotify.includes('Teacher');
                return {
                  ...event,
                  start: new Date(event.start_time),
                  end: new Date(event.end_time),
                  title: event.event_name,
                  description: event.event_description || '',
                  eventType: event.event_type,
                  recurrence_rule: event.recurrence_rule,
                  audience_target: at,
                  audience: aud,
                  selectedAudiences: sel,
                  selectedClasses: cs.classes,
                  selectedSections: cs.sections,
                  room_id: event.room_id,
                  event_status: event.event_status,
                  notifyParents,
                  notifyTeachers,
                  allDay: event.is_all_day,
                };
              });
              setEvents(formattedEvents);
            }
          } catch (error) {
            console.error('Failed to delete event:', error);
          } finally {
            setShowDelete(false);
            setSelectedIndex(null);
            setTargetEvent(null);
            setRecurrenceMode('single');
          }
        }}
        title="Remove Event"
        message={selectedIndex !== null ? `Delete "${events[selectedIndex]?.title}"?` : 'Delete selected event?'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
