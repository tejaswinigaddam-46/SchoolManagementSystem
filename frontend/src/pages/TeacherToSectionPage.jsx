import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx'
import sectionService from '../services/sectionService'
import sectionSubjectService from '../services/sectionSubjectService'
import subjectService from '../services/subjectService'
import employeeService from '../services/employeeService'
import { PERMISSIONS } from '../config/permissions'

export default function TeacherToSectionPage() {
  const { getCampusId, getCampusName, hasPermission } = useAuth()
  const [filters, setFilters] = useState({ academic_year_id: '', class_id: '' })
  const [filterOptions, setFilterOptions] = useState({ academic_years: [], classes: [] })
  const [sections, setSections] = useState([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [assignedSubjectIds, setAssignedSubjectIds] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [teacherOptionsBySubject, setTeacherOptionsBySubject] = useState({})
  const [selectedTeachersBySubject, setSelectedTeachersBySubject] = useState({})
  const [missingDepartments, setMissingDepartments] = useState([])
  const [primaryTeacherId, setPrimaryTeacherId] = useState('')
  const [originalPrimaryTeacherId, setOriginalPrimaryTeacherId] = useState('')
  const [allTeacherOptions, setAllTeacherOptions] = useState([])
  const [showAssignment, setShowAssignment] = useState(false)
  const [sectionTeacherCounts, setSectionTeacherCounts] = useState({})
  const [sectionSubjectCounts, setSectionSubjectCounts] = useState({})
  const [originalTeachersBySubject, setOriginalTeachersBySubject] = useState({})
  const campusId = getCampusId()

  const canAssignSectionSubjects = !!hasPermission && hasPermission(PERMISSIONS.SECTION_SUBJECT_ASSIGN_CREATE)
  const canEditPrimaryTeacher = !!hasPermission && hasPermission(PERMISSIONS.SECTION_EDIT)

  const mapSubjectToDepartment = useMemo(() => {
    return (subject) => {
      const n = (subject?.subject_name || '').toLowerCase()
      if (n.includes('math')) return 'Mathematics'
      if (n.includes('physics') || n.includes('chemistry') || n.includes('biology') || n.includes('science') || (n.includes('evs'))) return 'Science'
      if (n.includes('english')) return 'English'
      if (n.includes('hindi')) return 'Hindi'
      if (n.includes('telugu')) return 'Telugu'
      if (n.includes('computer')) return 'Computer Science'
      if (n.includes('social') || n.includes('history') || n.includes('civics') || n.includes('geography')) return 'Social Studies'
      const category = subject?.category
      if (category && String(category).trim() !== '') return category

      return 'Academic'
    }
  }, [subjects])

  const fetchFilterOptions = async () => {
    try {
      const res = await sectionService.getFilterOptions()
      if (res.success) setFilterOptions(res.data)
    } catch (e) {
      toast.error('Failed to load filter options')
    }
  }

  const fetchSections = async () => {
    try {
      setSectionsLoading(true)
      if (!filters.class_id || !filters.academic_year_id) {
        setSections([])
        setSectionTeacherCounts({})
        return
      }
      const params = { limit: 100, academic_year_id: filters.academic_year_id, class_id: filters.class_id }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const res = await sectionService.getAllSections(params)
      if (res.success) {
        const list = res.data.sections || []
        const classId = parseInt(filters.class_id)
        const filtered = classId ? list.filter(s => parseInt(s.class_id) === classId) : list
        setSections(filtered)
        await fetchTeacherCounts(filtered)
      }
    } catch (e) {
      toast.error('Failed to load sections')
    } finally {
      setSectionsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      if (!campusId) return
      setSubjectsLoading(true)
      const res = await subjectService.getAllSubjects(campusId)
      if (res.success) setSubjects(res.data.subjects || res.data || [])
    } catch (e) {
      toast.error('Failed to load subjects')
      setSubjects([])
    } finally {
      setSubjectsLoading(false)
    }
  }

  const fetchAssignedSubjects = async (sectionId) => {
    try {
      if (!sectionId) {
        setAssignedSubjectIds([])
        setSelectedTeachersBySubject({})
        return
      }
      const res = await sectionSubjectService.getAssignmentsBySections([parseInt(sectionId)])
      const assigns = res?.data?.assignments || res?.assignments || []
      const subjectIds = assigns.map(a => a.subject_id).filter(Boolean)
      setAssignedSubjectIds(subjectIds)
      const preset = {}
      assigns.forEach(a => {
        if (a.subject_id && a.teacher_user_id) {
          preset[a.subject_id] = String(a.teacher_user_id)
        }
      })
      setSelectedTeachersBySubject(preset)
      setOriginalTeachersBySubject(preset)
    } catch (e) {
      toast.error('Failed to load assigned subjects')
      setAssignedSubjectIds([])
      setSelectedTeachersBySubject({})
    }
  }

  const fetchTeacherCounts = async (sectionList) => {
    try {
      const ids = (sectionList || []).map(s => parseInt(s.section_id)).filter(Boolean)
      if (ids.length === 0) { setSectionTeacherCounts({}); setSectionSubjectCounts({}); return }
      const res = await sectionSubjectService.getAssignmentsBySections(ids)
      const assigns = res?.data?.assignments || res?.assignments || []
      const counts = {}
      const subjectCounts = {}
      assigns.forEach(a => {
        const sid = a.section_id
        if (!counts[sid]) counts[sid] = 0
        if (!subjectCounts[sid]) subjectCounts[sid] = 0
        if (a.teacher_user_id) counts[sid] += 1
        subjectCounts[sid] += 1
      })
      setSectionTeacherCounts(counts)
      setSectionSubjectCounts(subjectCounts)
    } catch (e) {
      setSectionTeacherCounts({})
      setSectionSubjectCounts({})
    }
  }

  const fetchSectionDetails = async (sectionId) => {
    try {
      if (!sectionId) {
        setPrimaryTeacherId('')
        return
      }
      const res = await sectionService.getSectionById(parseInt(sectionId))
      const data = res?.data || res
      const currentPrimary = data?.primary_teacher_user_id ? String(data.primary_teacher_user_id) : ''
      setPrimaryTeacherId(currentPrimary)
      setOriginalPrimaryTeacherId(currentPrimary)
    } catch (e) {
      toast.error('Failed to load section details')
      setPrimaryTeacherId('')
    }
  }

  const fetchAllTeachers = async () => {
    try {
      const res = await employeeService.getAllEmployees({ limit: 100 })
      const employees =
        res?.data?.employees ||
        res?.employees ||
        []
      const list = Array.isArray(employees) ? employees : []
      setAllTeacherOptions(
        list.map(emp => ({
          value: String(emp.user_id),
          label: `${emp.first_name} ${emp.last_name}`
        }))
      )
    } catch (e) {
      toast.error('Failed to load teachers')
      setAllTeacherOptions([])
    }
  }

  const fetchTeachersForSubject = async (subject) => {
    try {
      const dept = mapSubjectToDepartment(subject)
      const res = await employeeService.getEmployeesByDepartment(encodeURIComponent(dept), campusId)
      const list = res?.data?.employees || res?.employees || []
      setTeacherOptionsBySubject(prev => ({ ...prev, [subject.subject_id]: list.map(emp => ({ value: emp.user_id, label: `${emp.first_name} ${emp.last_name}` })) }))
    } catch (e) {
      setTeacherOptionsBySubject(prev => ({ ...prev, [subject.subject_id]: [] }))
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchSections()
    setSelectedSectionId('')
    setAssignedSubjectIds([])
    setTeacherOptionsBySubject({})
    setSelectedTeachersBySubject({})
    setOriginalTeachersBySubject({})
    setMissingDepartments([])
    setShowAssignment(false)
    setPrimaryTeacherId('')
    setOriginalPrimaryTeacherId('')
  }, [filters])

  useEffect(() => {
    fetchSubjects()
  }, [campusId])

  useEffect(() => {
    if (selectedSectionId) {
      fetchAssignedSubjects(selectedSectionId)
      fetchSectionDetails(selectedSectionId)
      fetchAllTeachers()
    } else {
      setPrimaryTeacherId('')
      setAllTeacherOptions([])
    }
  }, [selectedSectionId])

  useEffect(() => {
    const assigned = subjects.filter(s => assignedSubjectIds.includes(s.subject_id))
    const loadTeachers = async () => {
      const results = await Promise.all(assigned.map(async (s) => {
        const dept = mapSubjectToDepartment(s)
        try {
          const res = await employeeService.getEmployeesByDepartment(encodeURIComponent(dept), campusId)
          const list = res?.data?.employees || res?.employees || []
          return { subjectId: s.subject_id, dept, list }
        } catch (_) {
          return { subjectId: s.subject_id, dept, list: [] }
        }
      }))
      const next = {}
      const missing = new Set()
      results.forEach(r => {
        next[r.subjectId] = r.list.map(emp => ({ value: emp.user_id, label: `${emp.first_name} ${emp.last_name}` }))
        if (r.list.length === 0) missing.add(r.dept)
      })
      setTeacherOptionsBySubject(next)
      setMissingDepartments(Array.from(missing))
    }
    loadTeachers()
  }, [assignedSubjectIds, subjects, campusId, mapSubjectToDepartment])

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleTeacherSelect = (subjectId, teacherUserId) => {
    setSelectedTeachersBySubject(prev => ({ ...prev, [subjectId]: teacherUserId }))
  }

  const handleAssignTeachers = async () => {
    try {
      if (!selectedSectionId) {
        toast.error('Please select a section')
        return
      }
      const toAssign = []
      const toDeassign = []
      assignedSubjectIds.forEach((sid) => {
        const prev = originalTeachersBySubject[sid] || ''
        const next = selectedTeachersBySubject[sid] || ''
        if (prev !== next) {
          if (next) {
            toAssign.push({ section_id: parseInt(selectedSectionId), subject_id: sid, teacher_user_id: parseInt(next) })
          } else {
            toDeassign.push(sid)
          }
        }
      })
      const primaryChanged = primaryTeacherId !== originalPrimaryTeacherId
      const hasAssignmentChanges = toAssign.length > 0 || toDeassign.length > 0

      if (!primaryChanged && !hasAssignmentChanges) {
        toast.error('No changes to save')
        return
      }
      if (primaryChanged && !canEditPrimaryTeacher) {
        toast.error('You do not have permission to update primary teacher')
        return
      }
      if (hasAssignmentChanges && !canAssignSectionSubjects) {
        toast.error('You do not have permission to assign or unassign teachers')
        return
      }

      if (primaryChanged && canEditPrimaryTeacher) {
        try {
          const resUpdate = await sectionService.updateSection(parseInt(selectedSectionId), { primary_teacher_user_id: parseInt(primaryTeacherId) })
          if (resUpdate?.success) {
            toast.success('Primary teacher updated')
          }
        } catch (err) {
          toast.error(`Failed to update primary teacher: ${primaryTeacherId}`)
        }
      }

      if (hasAssignmentChanges && canAssignSectionSubjects) {
        if (toDeassign.length > 0) {
          await sectionSubjectService.unassignSubjectsFromSection(parseInt(selectedSectionId), toDeassign)
        }
        if (toAssign.length > 0) {
          await sectionSubjectService.assignSubjectsToSection(toAssign)
        }
        const changesCount = toAssign.length + toDeassign.length
        toast.success(`Updated ${changesCount} teachers`)
      }
      await fetchAssignedSubjects(selectedSectionId)
      await fetchSectionDetails(selectedSectionId)
      setShowAssignment(false)
      await fetchSections()
    } catch (e) {
      toast.error('Failed to assign teachers')
    }
  }

  const assignedSubjects = subjects.filter(s => assignedSubjectIds.includes(s.subject_id))
  const missingSubjectDepartmentPairs = useMemo(() => {
    try {
      if (!missingDepartments || missingDepartments.length === 0) return []
      return assignedSubjects
        .filter(sub => missingDepartments.includes(mapSubjectToDepartment(sub)))
        .map(sub => `${sub.subject_name} (${mapSubjectToDepartment(sub)})`)
    } catch (_) {
      return []
    }
  }, [assignedSubjects, missingDepartments, mapSubjectToDepartment])

  return (
    <OneAcademicYearPage
      title="Teacher To Section"
      filterOptions={filterOptions}
      filters={filters}
      setFilters={setFilters}
      onFiltersChange={handleFiltersChange}
      showClassFilter={true}
      showSearchFilter={false}
      instructions={null}
      addButtonText={null}
      onAddClick={null}
      canAdd={false}
    >
      <Card>
        <div className="p-6 border border-gray-200 rounded-lg bg-white">
          {!showAssignment ? (
            <div>
              {sectionsLoading ? (
                <div className="flex items-center gap-2"><LoadingSpinner className="w-5 h-5" /><span className="text-sm text-gray-500">Loading sections...</span></div>
              ) : sections.length === 0 ? (
                <div className="text-sm text-gray-600">No sections found for selected filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Teachers</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sections.map((s) => (
                        <tr key={s.section_id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{s.section_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{s.class_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{s.year_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{sectionSubjectCounts[s.section_id] || 0}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{sectionTeacherCounts[s.section_id] || 0}</td>
                          <td className="px-4 py-2 text-sm">
                            <button
                              onClick={() => { setSelectedSectionId(String(s.section_id)); setShowAssignment(true); }}
                              className={`px-3 py-1.5 text-xs rounded-md ${canAssignSectionSubjects ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-200 text-gray-700 cursor-pointer'}`}
                            >
                              {canAssignSectionSubjects ? 'Assign Teachers' : 'View Teachers'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 px-4 py-3 bg-gray-50 border border-200 rounded-lg">
                <div className="text-medium font-medium text-gray-800">
                  Section : <span className="font-medium text-primary-700">{sections.find(s => String(s.section_id) === String(selectedSectionId))?.section_name || ''}</span>
                </div>
              </div>
              {sectionsLoading && (
                <div className="flex items-center gap-2"><LoadingSpinner className="w-5 h-5" /><span className="text-sm text-gray-500">Loading sections...</span></div>
              )}
              {selectedSectionId && (
                <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white">
                  <h2 className="text-lg font-semibold mb-4">Assigned Subjects</h2>
                  {missingDepartments.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-700">
                        Departments {missingDepartments.join(', ')} do not have any teachers assigned.
                      </p>
                      {missingSubjectDepartmentPairs.length > 0 && (
                        <div className="mt-1 text-xs text-yellow-700">
                          Subjects requiring these departments: {missingSubjectDepartmentPairs.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  {subjectsLoading ? (
                    <div className="flex items-center gap-2"><LoadingSpinner className="w-5 h-5" /><span className="text-sm text-gray-500">Loading subjects...</span></div>
                  ) : assignedSubjects.length === 0 ? (
                    <div className="text-sm text-gray-600">No subjects assigned to this section.</div>
                  ) : (
                    <div className="space-y-3">
                      {assignedSubjects.map(sub => (
                        <div key={sub.subject_id} className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-center border border-gray-200 rounded-lg p-3 ${selectedTeachersBySubject[sub.subject_id] ? 'bg-green-50' : 'bg-blue-50'}`}>
                          <div className="text-sm font-medium text-gray-800">{sub.subject_name}</div>
                          <div>
                            <select
                              value={selectedTeachersBySubject[sub.subject_id] || ''}
                              onChange={(e) => handleTeacherSelect(sub.subject_id, e.target.value)}
                              disabled={!canAssignSectionSubjects}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                            >
                              <option value="">Select Teacher</option>
                              {(teacherOptionsBySubject[sub.subject_id] || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                      }
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-md font-semibold mb-2">Primary Teacher</h3>
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-center border border-gray-200 rounded-lg p-3 ${primaryTeacherId ? 'bg-green-50' : 'bg-blue-50'}`}>
                          <div className="text-sm font-medium">Select the primary teacher for this section</div>
                          <div>
                            <select
                              value={primaryTeacherId}
                              onChange={(e) => setPrimaryTeacherId(e.target.value)}
                              disabled={!canEditPrimaryTeacher}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                            >
                              <option value="">Select Primary Teacher</option>
                              {allTeacherOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      {canAssignSectionSubjects ? (
                        <div className="flex justify-end mt-4 gap-3">
                          <button
                            onClick={() => { setShowAssignment(false); setSelectedSectionId(''); }}
                            className="px-6 py-2 text-gray-700 rounded border border-gray-300 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAssignTeachers}
                            className="px-6 py-2 text-white rounded bg-primary-600 hover:bg-primary-700"
                          >
                            Assign Teachers
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 text-sm text-gray-500 text-right flex justify-end items-center gap-3">
                          <button
                            onClick={() => { setShowAssignment(false); setSelectedSectionId(''); }}
                            className="px-6 py-2 text-gray-700 rounded border border-gray-300 bg-white hover:bg-gray-50"
                          >
                            Back to Sections
                          </button>
                          <span>You have view-only access to teacher assignments.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </OneAcademicYearPage>
  )
}
