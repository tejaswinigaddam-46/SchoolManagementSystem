import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import classService from '../services/classService';
import { sectionService } from '../services/sectionService';
import { studentService } from '../services/studentService';
import ExamService from '../services/examService';
import ExamResultService from '../services/examResultService';
import { attendanceService } from '../services/attendanceService';
import { PERMISSIONS } from '../config/permissions';
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ExamsPage() {
  const { 
    user, 
    campusId: authCampusId, 
    defaultAcademicYearId, 
    hasPermission,
    hasAnyPermission,
    isStudent,
    isParent,
    getUserName
  } = useAuth();
  const campusId = authCampusId || user?.campus?.campus_id || user?.campusId;
  const [loading, setLoading] = useState(false);
  
  // Filters following OneAcademicYearPage pattern
  const [filters, setFilters] = useState({
    academic_year_id: defaultAcademicYearId || '',
    class_id: '',
    section_id: '',
    startDate: format(new Date(), 'yyyy-MM-01'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [filterOptions, setFilterOptions] = useState({
    academic_years: [],
    classes: []
  });

  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [examResults, setExamResults] = useState({}); // studentId -> result
  const [attendanceMap, setAttendanceMap] = useState({}); // studentId -> status
  const [scoreErrors, setScoreErrors] = useState({}); // studentId -> error message

  const isStudentRole = isStudent();
  const isParentRole = isParent();

  // Fetch filter options (following StudentManagementPage pattern)
  const fetchFilterOptions = async () => {
    try {
      const response = await studentService.getFilterOptions();
      if (response.success) {
        setFilterOptions(prev => ({
          ...prev,
          academic_years: response.data.academic_years || []
        }));
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchClasses = async () => {
    if (!campusId) return;
    try {
      const res = await classService.getClassesByCampus(campusId);
      let classList = [];
      if (Array.isArray(res)) classList = res;
      else if (Array.isArray(res.data)) classList = res.data;
      else if (res.data?.classes && Array.isArray(res.data.classes)) classList = res.data.classes;
      
      setFilterOptions(prev => ({
        ...prev,
        classes: classList
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchClasses();
  }, [campusId]);

  // Fetch Sections when Class changes
  useEffect(() => {
    if (filters.class_id) {
      loadSections();
    } else {
      setSections([]);
      setFilters(prev => ({ ...prev, section_id: '' }));
    }
  }, [filters.class_id]);

  // Load Students and Results when Exam is selected
  useEffect(() => {
    if (selectedExamId) {
      loadExamDetails();
    } else {
      setStudents([]);
      setExamResults({});
      setAttendanceMap({});
    }
  }, [selectedExamId, filters.class_id, filters.section_id]);

  const loadSections = async () => {
    try {
      const response = await sectionService.getAllSections({ class_id: filters.class_id });
      let sectionList = [];
      if (response.success && Array.isArray(response.data)) {
          sectionList = response.data;
      } else if (response?.data?.sections && Array.isArray(response.data.sections)) {
          sectionList = response.data.sections;
      } else if (Array.isArray(response)) {
          sectionList = response;
      } else if (response?.data && Array.isArray(response.data)) {
          sectionList = response.data;
      } else if (response?.sections && Array.isArray(response.sections)) {
          sectionList = response.sections;
      }
       
      setSections(sectionList || []);
    } catch (error) {
      console.error('Failed to load sections', error);
      setSections([]);
    }
  };

  const handleFiltersChange = (newFilters) => {
    const oldFilters = filters;
    setFilters(newFilters);

    const criticalFilterChanged =
      newFilters.academic_year_id !== oldFilters.academic_year_id ||
      newFilters.class_id !== oldFilters.class_id ||
      newFilters.section_id !== oldFilters.section_id;

    if (criticalFilterChanged) {
      setSelectedExamId('');
      setExams([]);
      setStudents([]);
      setExamResults({});
      setAttendanceMap({});
    }
  };

  const loadExams = async () => {
    if (!filters.academic_year_id) {
      toast.error('Please select an academic year');
      return;
    }
    try {
      setLoading(true);
      const response = await ExamService.getExams({
        academic_year_id: filters.academic_year_id,
        start_date: filters.startDate,
        end_date: filters.endDate
      });
      
      if (response.success || Array.isArray(response) || Array.isArray(response.data)) {
        let fetchedExams = [];
        if (Array.isArray(response)) fetchedExams = response;
        else if (Array.isArray(response.data)) fetchedExams = response.data;
        else if (response.success && Array.isArray(response.data)) fetchedExams = response.data;
        
        if (filters.class_id) {
          fetchedExams = fetchedExams.filter(exam => {
            const target = exam.audience_target;
            const audience = typeof target === 'string' ? JSON.parse(target) : target;
            if (!audience) return true;
            if (audience.classes && Array.isArray(audience.classes)) {
                if (audience.classes.includes('all')) return true;
                if (audience.classes.includes(Number(filters.class_id))) return true;
                if (audience.classes.includes(String(filters.class_id))) return true;
                return false;
            }
            return true;
          });
        }
        
        setExams(fetchedExams);
        if (fetchedExams.length === 0) {
            toast('No exams found for the selected filters', { icon: 'ℹ️' });
        }
      } else {
        toast.error('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Failed to load exams', error);
      toast.error('Error loading exams');
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      let audienceStudents = [];
      const viewMode = getExamViewMode();

      if (viewMode === 'student' || viewMode === 'own') {
        const username = getUserName();
        if (username) {
          const studentRes = await studentService.getStudentByUsername(username);
          const data = studentRes?.data?.data || studentRes?.data || studentRes;
          if (data) audienceStudents = [data];
        }
      } else if (viewMode === 'parent') {
        const username = getUserName();
        if (username) {
          const parentStudentsRes = await studentService.getParentStudents(username);
          const children = parentStudentsRes?.data?.data || parentStudentsRes?.data || parentStudentsRes;
          if (Array.isArray(children)) audienceStudents = children;
        }
      } else if (viewMode === 'multi') {
        const sectionStudentsRes = await studentService.getStudentsBySection(
          filters.class_id, 
          filters.section_id, 
          filters.academic_year_id
        );
        if (sectionStudentsRes.success && Array.isArray(sectionStudentsRes.data.students)) {
          audienceStudents = sectionStudentsRes.data.students;
        } else if (sectionStudentsRes.students && Array.isArray(sectionStudentsRes.students)) {
          audienceStudents = sectionStudentsRes.students;
        } else if (Array.isArray(sectionStudentsRes)) {
          audienceStudents = sectionStudentsRes;
        }
      }

      let studentsForView = [...audienceStudents];
      let finalResultsMap = {};

      const resultsResponse = await ExamResultService.getResultsByExamId(selectedExamId);
      if (resultsResponse.success && Array.isArray(resultsResponse.data)) {
        const hasAnyResults = resultsResponse.data.length > 0;
        const usernameToIdMap = {};

        audienceStudents.forEach(s => {
            const sId = s.student_id || s.userId || s.id || s.user_id;
            const uname = s.username || s.student_username;
            if (uname && sId) {
                usernameToIdMap[String(uname).trim()] = sId;
                usernameToIdMap[String(uname).trim().toLowerCase()] = sId;
            }
        });

        for (const result of resultsResponse.data) {
          let sId = result.student_id;
          if (!sId && result.student_username) {
              const uname = String(result.student_username).trim();
              sId = usernameToIdMap[uname] || usernameToIdMap[uname.toLowerCase()];
          }
          
          if (sId) {
            finalResultsMap[sId] = {
              ...result,
              marks_obtained: result.obtained_score !== null ? parseFloat(result.obtained_score) : null
            };
          }
        }

        if (!hasAnyResults) {
          audienceStudents.forEach(student => {
            const sId = student.student_id || student.userId || student.id || student.user_id;
            finalResultsMap[sId] = {
              marks_obtained: 0,
              is_passed: false,
              student_id: sId,
              exam_id: selectedExamId
            };
          });
        }
      }

      const currentExam = exams.find(e => e.exam_id === selectedExamId);
      if (currentExam) {
        let attendanceData = [];
        if (currentExam.event_id) {
          const eventRes = await attendanceService.getAttendance({ eventId: currentExam.event_id });
          attendanceData = eventRes.success ? (eventRes.data || []) : (Array.isArray(eventRes) ? eventRes : []);
        }
        
        if (attendanceData.length === 0 && currentExam.exam_date && filters.class_id && filters.section_id && filters.academic_year_id) {
           const dailyRes = await attendanceService.getAttendance({
               classId: filters.class_id,
               sectionId: filters.section_id,
               date: format(new Date(currentExam.exam_date), 'yyyy-MM-dd'),
               academicYearId: filters.academic_year_id
           });
           attendanceData = dailyRes.success ? (dailyRes.data || []) : (Array.isArray(dailyRes) ? dailyRes : []);
        }

        const attMap = {};
        attendanceData.forEach(record => {
          const sId = record.student_id || record.studentId || record.user_id || record.userId;
          if (sId) attMap[sId] = record.status;
        });
        setAttendanceMap(attMap);

        audienceStudents.forEach(student => {
            const sId = student.student_id || student.userId || student.id || student.user_id;
            if (attMap[sId] === 'Absent' && !finalResultsMap[sId]) {
                finalResultsMap[sId] = {
                    marks_obtained: 0,
                    is_passed: false,
                    student_id: sId,
                    exam_id: selectedExamId
                };
            }
        });
      }
      
      setStudents(studentsForView);
      setExamResults(finalResultsMap);
    } catch (error) {
      console.error('Failed to load exam details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = async (studentId, newScore) => {
    const score = parseFloat(newScore);
    if (isNaN(score) && newScore !== '') return;
    
    const selectedExam = exams.find(e => e.exam_id === selectedExamId);
    const total = selectedExam?.total_score ?? null;
    
    if (total !== null && score > total) {
        setScoreErrors(prev => ({ ...prev, [studentId]: 'Score should not exceed total score' }));
        toast.error('Score should not exceed total score');
        return;
    } else {
        setScoreErrors(prev => {
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
    }
    
    setExamResults(prev => ({
        ...prev,
        [studentId]: {
            ...prev[studentId],
            marks_obtained: newScore === '' ? null : score,
            student_id: studentId,
            exam_id: selectedExamId
        }
    }));
  };

  const handleBulkSave = async () => {
    try {
        setLoading(true);
        const selectedExam = exams.find(e => e.exam_id === selectedExamId);
        const total = selectedExam?.total_score ?? null;
        let invalidCount = 0;
        
        const resultsToSave = students.map(student => {
            const studentId = student.student_id || student.userId || student.id || student.user_id;
            const result = examResults[studentId] || {};
            const studentUsername = student.username;
            
            if (!studentUsername) return null;

            const attendanceStatus = attendanceMap[studentId] || 'Present';
            const marksToSave = attendanceStatus.toLowerCase() === 'absent' ? 0 : result.marks_obtained;
            
            if (total !== null && marksToSave !== null && marksToSave > total) {
                invalidCount += 1;
                return null;
            }

            return {
                exam_id: selectedExamId,
                student_username: studentUsername,
                obtained_score: marksToSave,
                attendance_status: attendanceStatus
            };
        }).filter(Boolean);

        if (invalidCount > 0) {
            toast.error(`Fix ${invalidCount} score(s) exceeding total before saving`);
            setLoading(false);
            return;
        }

        if (resultsToSave.length === 0) {
            toast('No students to save');
            setLoading(false);
            return;
        }

        const response = await ExamResultService.createBulkResults(resultsToSave);
        if (response.success || (Array.isArray(response) && response.length > 0) || (response.data && Array.isArray(response.data))) {
            toast.success('All scores saved successfully');
            loadExamDetails(); 
        } else {
            toast.error('Failed to save scores');
        }
    } catch (error) {
        console.error('Bulk save error', error);
        toast.error('Error saving scores');
    } finally {
        setLoading(false);
    }
  };

  const canEditScores = hasAnyPermission([
    PERMISSIONS.EXAM_RESULT_EDIT,
    PERMISSIONS.EXAM_RESULT_CREATE,
    PERMISSIONS.EXAM_RESULT_BULK_CREATE
  ]) && !isStudentRole && !isParentRole;

  const getExamViewMode = () => {
    const canViewByStudent = hasPermission(PERMISSIONS.EXAM_RESULT_BY_STUDENT_READ);
    const canViewByExam = hasPermission(PERMISSIONS.EXAM_RESULT_BY_EXAM_READ);
    const canViewParentStudents = hasPermission(PERMISSIONS.STUDENT_BY_PARENT_READ);
    const canViewSelfStudent = hasPermission(PERMISSIONS.STUDENT_BY_USERNAME_READ);

    if (isParentRole) {
      if (canViewByStudent && canViewParentStudents) return 'parent';
      if (canViewByStudent) return 'own';
      return 'none';
    }

    if (isStudentRole) {
      if (canViewByStudent && canViewSelfStudent) return 'student';
      if (canViewByStudent) return 'own';
      return 'none';
    }

    if (canViewByExam) return 'multi';
    if (canViewByStudent) return 'own';

    return 'none';
  };

  const selectedExam = exams.find(e => e.exam_id === selectedExamId);

  const customFilters = (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.section_id}
          onChange={(e) => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
          disabled={!filters.class_id}
        >
          <option value="">Select Section</option>
          {sections.map(sec => (
            <option key={sec.section_id} value={sec.section_id}>{sec.section_name}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input 
          type="date" 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.startDate}
          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
        />
      </div>
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input 
          type="date" 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.endDate}
          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </div>
      <div className="flex items-end">
        <button 
          onClick={loadExams}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 h-[42px]"
        >
          {loading ? 'Loading...' : 'View Exams'}
        </button>
      </div>
      {exams.length > 0 && (
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select an Exam</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            <option value="">Select an Exam</option>
            {exams.map(exam => (
                <option key={exam.exam_id} value={exam.exam_id}>
                    {exam.subject_name || exam.event_name} - {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                </option>
            ))}
          </select>
        </div>
      )}
    </>
  );

  return (
    <OneAcademicYearPage
      title="Exam Results"
      filterOptions={filterOptions}
      filters={filters}
      setFilters={setFilters}
      onFiltersChange={handleFiltersChange}
      showClassFilter={true}
      showSearchFilter={false}
      customFilters={customFilters}
    >
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner className="w-8 h-8" />
          <p className="ml-3 text-gray-600">Loading exam results...</p>
        </div>
      ) : selectedExam ? (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selectedExam.subject_name || selectedExam.event_name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                <span>Date: <span className="font-medium">{format(new Date(selectedExam.exam_date), 'MMM dd, yyyy')}</span></span>
                <span>Total: <span className="font-medium">{selectedExam.total_score}</span></span>
                <span>Passing: <span className="font-medium">{(selectedExam.total_score * 0.35).toFixed(2)}</span></span>
              </div>
              <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 px-2 py-1 rounded inline-block">
                Note: Mark attendance first to enable score editing for NA / Absent students.
              </p>
            </div>
            {canEditScores && (
              <button
                onClick={handleBulkSave}
                disabled={loading}
                className="btn-primary bg-green-600 hover:bg-green-700 w-full md:w-auto flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner className="w-4 h-4" /> : null}
                Save All Scores
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Passing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obtained Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To be improved Concepts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length > 0 ? (
                  students.map(student => {
                    const studentId = student.student_id || student.userId || student.id || student.user_id;
                    const result = examResults[studentId];
                    const passingScore = selectedExam.total_score * 0.35;
                    const obtainedScore = result ? result.marks_obtained : null;
                    
                    const attendanceStatus = attendanceMap[studentId] || 'NA';
                    const statusLower = attendanceStatus.toLowerCase();
                    const isAbsent = statusLower === 'absent';
                    const isNoAttendance = statusLower === 'no attendance' || statusLower === 'no_attendance';
                    const isNA = statusLower === 'na';
                    
                    let effectiveScore = obtainedScore;
                    if (isAbsent) effectiveScore = 0;
                    
                    const isPass = !isAbsent && effectiveScore !== null && effectiveScore >= passingScore;
                    const isInputDisabled = !canEditScores || isAbsent || isNoAttendance || isNA;

                    return (
                      <tr key={studentId} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName || student.first_name} {student.lastName || student.last_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.rollNumber || student.roll_no || student.roll_number || student.admissionNumber || student.admission_number || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            statusLower === 'present' ? 'bg-green-100 text-green-800' :
                            statusLower === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attendanceStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{selectedExam.total_score}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{passingScore.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={selectedExam.total_score}
                              step="0.01"
                              className={`w-24 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all ${
                                scoreErrors[studentId] 
                                  ? 'border-red-500 focus:ring-red-200' 
                                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                              } disabled:bg-gray-100 disabled:text-gray-500 font-semibold`}
                              value={effectiveScore !== null ? effectiveScore : ''}
                              onChange={(e) => handleScoreChange(studentId, e.target.value)}
                              disabled={isInputDisabled}
                            />
                            {scoreErrors[studentId] && (
                              <span className="text-red-600 text-[10px] font-bold uppercase">{scoreErrors[studentId]}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <textarea className="w-66 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all"></textarea>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <textarea className="w-66 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all"></textarea>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {isNA ? (
                            <span className="text-gray-400 text-sm font-medium">PENDING</span>
                          ) : (
                            effectiveScore !== null ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {isPass ? 'PASS' : 'FAIL'}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs font-medium italic">NOT GRADED</span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-500 italic">
                      No students found for the selected class/section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Exam Selected</h3>
          <p className="mt-1 text-sm text-gray-500">Select an academic year and filters to view available exams.</p>
        </div>
      )}
    </OneAcademicYearPage>
  );
}

