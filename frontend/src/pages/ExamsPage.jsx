import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import AcademicYearSelector from '../components/forms/AcademicYearSelector';
import { useAuth } from '../contexts/AuthContext';
import classService from '../services/classService';
import { sectionService } from '../services/sectionService';
import { studentService } from '../services/studentService';
import ExamService from '../services/examService';
import ExamResultService from '../services/examResultService';
import { attendanceService } from '../services/attendanceService';
import { PERMISSIONS } from '../config/permissions';

export default function ExamsPage() {
  const { 
    user, 
    campusId: authCampusId, 
    defaultAcademicYearId, 
    getDefaultClassId,
    hasPermission,
    hasAnyPermission,
    isStudent,
    isParent,
    getUserName
  } = useAuth();
  const campusId = authCampusId || user?.campus?.campus_id || user?.campusId;
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [academicYearData, setAcademicYearData] = useState({
    academic_year_id: defaultAcademicYearId || ''
  });
  const academicYearId = academicYearData?.academic_year_id;
  
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  useEffect(() => {
    if (defaultAcademicYearId && !academicYearId) {
      setAcademicYearData({ academic_year_id: defaultAcademicYearId });
    }
  }, [defaultAcademicYearId]);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Data
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [examResults, setExamResults] = useState({}); // studentId -> result
  const [attendanceMap, setAttendanceMap] = useState({}); // studentId -> status
  const [scoreErrors, setScoreErrors] = useState({}); // studentId -> error message

  const isStudentRole = isStudent();
  const isParentRole = isParent();

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

  // Fetch Classes when Campus changes (similar to FeeCollectionPage)
  useEffect(() => {
    fetchClasses();
  }, [campusId]);

  const fetchClasses = async () => {
    if (!campusId) return;
    try {
      const res = await classService.getClassesByCampus(campusId);
      let classList = [];
      if (Array.isArray(res)) classList = res;
      else if (Array.isArray(res.data)) classList = res.data;
      else if (res.data?.classes && Array.isArray(res.data.classes)) classList = res.data.classes;
      setClasses(classList);
    } catch (err) {
      console.error(err);
      setClasses([]);
    }
  };

  // Fetch Sections when Class changes
  useEffect(() => {
    if (selectedClassId) {
      loadSections();
    } else {
      setSections([]);
      setSelectedSectionId('');
    }
  }, [selectedClassId]);

  // Fetch Exams when Date Range or Academic Year changes
  // useEffect(() => {
  //   if (academicYearId && dateRange.start && dateRange.end) {
  //     loadExams();
  //   }
  // }, [academicYearId, dateRange.start, dateRange.end]);

  // Load Students and Results when Exam is selected
  useEffect(() => {
    if (selectedExamId) {
      loadExamDetails();
    } else {
      setStudents([]);
      setExamResults({});
      setAttendanceMap({});
    }
  }, [selectedExamId, selectedClassId, selectedSectionId]);

  const loadSections = async () => {
    try {
      const response = await sectionService.getAllSections({ class_id: selectedClassId });
      // Robust handling
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

  const loadExams = async () => {
    try {
      setLoading(true);
      console.log('Fetching exams with filters:', {
        academic_year_id: academicYearId,
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      const response = await ExamService.getExams({
        academic_year_id: academicYearId,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      console.log('Exams response:', response);

      if (response.success || Array.isArray(response) || Array.isArray(response.data)) {
        // Robust handling for various response structures
        let fetchedExams = [];
        if (Array.isArray(response)) fetchedExams = response;
        else if (Array.isArray(response.data)) fetchedExams = response.data;
        else if (response.success && Array.isArray(response.data)) fetchedExams = response.data;
        
        // If Class/Section selected, filter exams that target them
        if (selectedClassId) {
          fetchedExams = fetchedExams.filter(exam => {
            const target = exam.audience_target;
            // Handle if target is string (JSON) or object
            const audience = typeof target === 'string' ? JSON.parse(target) : target;
            
            if (!audience) return true; // Assume visible if no audience defined
            
            // Check if class is in target
            // Assuming audience structure: { classes: [], sections: [] }
            if (audience.classes && Array.isArray(audience.classes)) {
                if (audience.classes.includes('all')) return true;
                if (audience.classes.includes(Number(selectedClassId))) return true;
                if (audience.classes.includes(String(selectedClassId))) return true; // Handle string ID match
                return false;
            }
            return true; // Default fallback
          });
        }
        
        setExams(fetchedExams);
        if (fetchedExams.length === 0) {
            toast('No exams found for the selected filters', { icon: 'ℹ️' });
        }
      } else {
        console.error('Failed to fetch exams:', response);
        toast.error('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Failed to load exams', error);
      toast.error('Error loading exams');
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

  const saveScore = async (studentId) => {
      const result = examResults[studentId];
      if (!result) return;
      
      const student = students.find(s => 
          (s.student_id || s.userId || s.id || s.user_id) === studentId
      );
      
      if (!student?.username) {
          toast.error("Student username not found");
          return;
      }

      const attendanceStatus = attendanceMap[studentId] || 'Present';
      const isAbsent = attendanceStatus.toLowerCase() === 'absent';
      const marksToSave = isAbsent ? 0 : result.marks_obtained;

      try {
          // Check if we need to create or update
          if (result.result_id) {
             await ExamResultService.updateResult(result.result_id, {
                 obtained_score: marksToSave,
                 remarks: result.remarks,
                 attendance_status: attendanceStatus
             });
          } else {
             const newResult = await ExamResultService.createResult({
                 exam_id: selectedExamId,
                 student_username: student.username,
                 obtained_score: marksToSave,
                 remarks: result.remarks,
                 attendance_status: attendanceStatus
             });
             // Update state with new ID
             setExamResults(prev => ({
                 ...prev,
                 [studentId]: { ...newResult.data, marks_obtained: marksToSave }
             }));
          }
          toast.success('Score saved');
      } catch (error) {
          console.error('Failed to save score', error);
          toast.error('Failed to save score');
      }
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
            
            if (!studentUsername) {
                console.warn(`No username found for student ${studentId}`);
                return null;
            }

            const attendanceStatus = attendanceMap[studentId] || 'Present';
            const isAbsent = attendanceStatus.toLowerCase() === 'absent';
            const marksToSave = isAbsent ? 0 : result.marks_obtained;
            
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

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      
      let audienceStudents = [];

      try {
        const viewMode = getExamViewMode();

        if (viewMode === 'student' || viewMode === 'own') {
          const username = getUserName();
          if (!username) {
            toast.error('Unable to determine username');
          } else if (hasPermission(PERMISSIONS.STUDENT_BY_USERNAME_READ)) {
            const studentRes = await studentService.getStudentByUsername(username);
            const data = studentRes?.data?.data || studentRes?.data || studentRes;
            if (data) {
              audienceStudents = [data];
            } else {
              toast.error('Student record not found');
            }
          } else {
            toast.error('You do not have access to student details');
          }
        } else if (viewMode === 'parent') {
          const username = getUserName();
          if (!username) {
            toast.error('Unable to determine username');
          } else if (hasPermission(PERMISSIONS.STUDENT_BY_PARENT_READ)) {
            const parentStudentsRes = await studentService.getParentStudents(username);
            const children = parentStudentsRes?.data?.data || parentStudentsRes?.data || parentStudentsRes;
            if (Array.isArray(children)) {
              audienceStudents = children;
            } else {
              toast.error('No student records found for this parent');
            }
          } else {
            toast.error('You do not have access to student details');
          }
        } else if (viewMode === 'multi') {
          const sectionStudentsRes = await studentService.getStudentsBySection(
            selectedClassId, 
            selectedSectionId, 
            academicYearId
          );
          
          if (sectionStudentsRes.success && Array.isArray(sectionStudentsRes.data.students)) {
            audienceStudents = sectionStudentsRes.data.students;
          } else if (sectionStudentsRes.students && Array.isArray(sectionStudentsRes.students)) {
            audienceStudents = sectionStudentsRes.students;
          } else if (Array.isArray(sectionStudentsRes)) {
            audienceStudents = sectionStudentsRes;
          }
        } else {
          toast.error('You do not have permissions to view exam results');
        }
      } catch (e) {
        console.error('Student fetch failed', e);
        toast.error('Failed to load students');
      }
      
      console.log('Fetched students count:', audienceStudents.length);

      let studentsForView = [...audienceStudents];

      // 2. Fetch Exam Results
      // Initialize resultsMap as empty
      let finalResultsMap = {};

      const resultsResponse = await ExamResultService.getResultsByExamId(selectedExamId);
      if (resultsResponse.success && Array.isArray(resultsResponse.data)) {
        const hasAnyResults = resultsResponse.data.length > 0;
        
        const usernameToIdMap = {};
        const usernameToStudentMap = {};

        audienceStudents.forEach(s => {
            const sId = s.student_id || s.userId || s.id || s.user_id;
            const uname = s.username || s.student_username;
            if (uname && sId) {
                const normalizedUsername = String(uname).trim();
                const lowerUsername = normalizedUsername.toLowerCase();

                usernameToIdMap[normalizedUsername] = sId;
                usernameToIdMap[lowerUsername] = sId;

                usernameToStudentMap[normalizedUsername] = { id: sId, student: s };
                usernameToStudentMap[lowerUsername] = { id: sId, student: s };
            }
        });

        console.log(`Fetched ${resultsResponse.data.length} results for exam ${selectedExamId}`);

        for (const result of resultsResponse.data) {
          let sId = result.student_id;
          
          if (!sId && result.student_username) {
              const normalizedResultUsername = String(result.student_username).trim();
              const lowerResultUsername = normalizedResultUsername.toLowerCase();

              if (usernameToIdMap[normalizedResultUsername] || usernameToIdMap[lowerResultUsername]) {
                  sId = usernameToIdMap[normalizedResultUsername] || usernameToIdMap[lowerResultUsername];
              } else if (getExamViewMode() === 'multi') {
                  try {
                      const studentRes = await studentService.getStudentByUsername(normalizedResultUsername);
                      const fetched = studentRes?.data?.data || studentRes?.data || studentRes;

                      if (fetched) {
                          const fetchedId = fetched.student_id || fetched.userId || fetched.id || fetched.user_id;
                          if (fetchedId) {
                              sId = fetchedId;

                              const fetchedUsername = String(fetched.username || normalizedResultUsername).trim();
                              const lowerFetchedUsername = fetchedUsername.toLowerCase();

                              usernameToIdMap[fetchedUsername] = fetchedId;
                              usernameToIdMap[lowerFetchedUsername] = fetchedId;

                              usernameToStudentMap[fetchedUsername] = { id: fetchedId, student: fetched };
                              usernameToStudentMap[lowerFetchedUsername] = { id: fetchedId, student: fetched };

                              studentsForView.push(fetched);
                          }
                      }
                  } catch (e) {
                      console.warn('Failed to fetch student for exam result', normalizedResultUsername, e);
                  }
              }
          }
          
          if (sId) {
            const normalizedObtained =
              result.obtained_score !== undefined && result.obtained_score !== null
                ? parseFloat(result.obtained_score)
                : null;

            finalResultsMap[sId] = {
              ...result,
              marks_obtained: normalizedObtained
            };
          } else {
             console.warn('Could not map result to student:', result);
          }
        }
        
        console.log(`Mapped ${Object.keys(finalResultsMap).length} results to students`);
        // We do NOT set state yet, we will do it after applying attendance logic to finalResultsMap

        // If no rows exist for this exam_id, initialize defaults for all audience students
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

      // 3. Fetch Attendance
      const currentExam = exams.find(e => e.exam_id === selectedExamId);
      if (currentExam) {
        try {
          let attendanceData = [];
          
          // Strategy 1: Fetch by Event ID (if available)
          if (currentExam.event_id) {
              try {
                  const eventRes = await attendanceService.getAttendance({
                    eventId: currentExam.event_id
                  });
                  
                  if (eventRes.success && Array.isArray(eventRes.data)) attendanceData = eventRes.data;
                  else if (Array.isArray(eventRes)) attendanceData = eventRes;
                  else if (eventRes.data && Array.isArray(eventRes.data)) attendanceData = eventRes.data;
              } catch (e) {
                  console.warn("Event attendance fetch failed, trying fallback", e);
              }
          }
          
          // Strategy 2: Fallback to Daily Attendance (if Event fetch yielded no results)
          if (attendanceData.length === 0 && currentExam.exam_date && selectedClassId && selectedSectionId && academicYearId) {
               console.log("Fetching daily attendance fallback...");
               try {
                   const dailyRes = await attendanceService.getAttendance({
                       classId: selectedClassId,
                       sectionId: selectedSectionId,
                       date: format(new Date(currentExam.exam_date), 'yyyy-MM-dd'),
                       academicYearId: academicYearId
                   });
                   
                   if (dailyRes.success && Array.isArray(dailyRes.data)) attendanceData = dailyRes.data;
                   else if (Array.isArray(dailyRes)) attendanceData = dailyRes;
                   else if (dailyRes.data && Array.isArray(dailyRes.data)) attendanceData = dailyRes.data;
               } catch (e) {
                   console.error("Daily attendance fallback failed", e);
               }
          }

          const attMap = {};
          attendanceData.forEach(record => {
            // Support both student_id and studentId
            const sId = record.student_id || record.studentId || record.user_id || record.userId;
            if (sId) {
                attMap[sId] = record.status;
            }
          });
          setAttendanceMap(attMap);

          // Auto-set score to 0 and status to Failed for absent students
          // Use finalResultsMap instead of state
          audienceStudents.forEach(student => {
              const sId = student.student_id || student.userId || student.id || student.user_id;
              
              // Only auto-set if result doesn't exist yet
              // And if attendance is explicitly Absent
              if (attMap[sId] === 'Absent' && !finalResultsMap[sId]) {
                  finalResultsMap[sId] = {
                      marks_obtained: 0,
                      is_passed: false,
                      student_id: sId,
                      exam_id: selectedExamId
                  };
              }
          });
          
        } catch (err) {
          console.error("Failed to fetch attendance", err);
          // Fallback to "NA" for all students if attendance fetch fails
          const fallbackAttMap = {};
          audienceStudents.forEach(student => {
              const sId = student.student_id || student.userId || student.id || student.user_id;
              fallbackAttMap[sId] = 'NA';
          });
          setAttendanceMap(fallbackAttMap);
        }
      }
      
      // Finally set the results state once
      setStudents(studentsForView);
      setExamResults(finalResultsMap);

    } catch (error) {
      console.error('Failed to load exam details', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (score, passingScore) => {
    if (score === undefined || score === null) return 'text-gray-500';
    return score >= passingScore ? 'text-green-600' : 'text-red-600';
  };

  const selectedExam = exams.find(e => e.exam_id === selectedExamId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4 overflow-x-hidden">
        <div className="mb-6">
          <AcademicYearSelector 
            campusId={campusId}
            value={academicYearData}
            onChange={(e, meta) => setAcademicYearData({ academic_year_id: meta.academicYearId })}
            className="w-full"
            gridClassName="grid-cols-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              className="input w-full"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Select Class</option>
              {(Array.isArray(classes) ? classes : []).map(cls => (
                <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              className="input w-full"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedClassId}
            >
              <option value="">Select Section</option>
              {(Array.isArray(sections) ? sections : []).map(sec => (
                <option key={sec.section_id} value={sec.section_id}>{sec.section_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="date" 
              className="input w-full"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <input 
              type="date" 
              className="input w-full"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={loadExams}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'View Exams'}
          </button>
        </div>

        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
            <select
                className="input w-full md:w-1/2"
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
      </Card>

      {/* Results Table */}
      {selectedExam && (
        <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">{selectedExam.subject_name || selectedExam.event_name}</h2>
                    <p className="text-sm text-gray-600">
                        Date: {format(new Date(selectedExam.exam_date), 'MMM dd, yyyy')} | 
                        Total Score: {selectedExam.total_score} | 
                        Passing Score: {(selectedExam.total_score * 0.35).toFixed(2)} (35%)
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Note: If attendance status is NA / Absent / No Attendance, mark attendance first to edit score.
                    </p>
                </div>
                {canEditScores && (
                  <div>
                    <button
                        onClick={handleBulkSave}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save All Scores'}
                    </button>
                  </div>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-4 font-semibold text-gray-700">Student Name</th>
                            <th className="p-4 font-semibold text-gray-700">Roll No</th>
                            <th className="p-4 font-semibold text-gray-700">Status (Attendance)</th>
                            <th className="p-4 font-semibold text-gray-700">Total Score</th>
                            <th className="p-4 font-semibold text-gray-700">Passing Score</th>
                            <th className="p-4 font-semibold text-gray-700">Obtained Score</th>
                            <th className="p-4 font-semibold text-gray-700">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length > 0 ? (
                            students.map(student => {
                                const studentId = student.student_id || student.userId || student.id || student.user_id;
                                const result = examResults[studentId];
                                const passingScore = selectedExam.total_score * 0.35;
                                const obtainedScore = result ? result.marks_obtained : null;
                                
                                const attendanceStatus = attendanceMap[studentId] || 'NA';
                                const statusLower = attendanceStatus ? attendanceStatus.toLowerCase() : 'na';
                                const isAbsent = statusLower === 'absent';
                                const isNoAttendance = statusLower === 'no attendance' || statusLower === 'no_attendance';
                                const isNA = statusLower === 'na';
                                
                                let effectiveScore = obtainedScore;
                                if (isAbsent) effectiveScore = 0;
                                
                                const isPass = !isAbsent && effectiveScore !== null && effectiveScore >= passingScore;
                                const isInputDisabled = !canEditScores || isAbsent || isNoAttendance || isNA;

                                return (
                                    <tr key={studentId} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">
                                            {student.firstName || student.first_name} {student.lastName || student.last_name}
                                        </td>
                                        <td className="p-4 text-gray-600">{student.rollNumber || student.roll_no || student.roll_number || student.admissionNumber || student.admission_number || '-'}</td>
                                        <td className="p-4">
                                            {attendanceStatus && attendanceStatus !== 'NA' ? (
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    statusLower === 'present' ? 'bg-green-100 text-green-800' :
                                                    statusLower === 'absent' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {attendanceStatus}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                                    NA
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">{selectedExam.total_score}</td>
                                        <td className="p-4">{passingScore.toFixed(2)}</td>
                                        <td className="p-4 font-semibold">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedExam.total_score}
                                                    step="0.01"
                                                    className={`w-20 px-2 py-1 border rounded focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-500 ${scoreErrors[studentId] ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                                    value={effectiveScore !== null ? effectiveScore : ''}
                                                    onChange={(e) => handleScoreChange(studentId, e.target.value)}
                                                    disabled={isInputDisabled}
                                                    title={
                                                      isInputDisabled
                                                        ? !canEditScores
                                                          ? "You do not have permission to edit scores"
                                                          : isAbsent
                                                            ? "Student is Absent"
                                                            : isNoAttendance
                                                              ? "No attendance recorded"
                                                              : isNA
                                                                ? "Attendance not marked"
                                                                : ""
                                                        : ""
                                                    }
                                                />
                                                {scoreErrors[studentId] && (
                                                    <span className="text-red-600 text-xs">{scoreErrors[studentId]}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {isNA ? (
                                                <span className="text-gray-400 text-sm">-</span>
                                            ) : (
                                                effectiveScore !== null ? (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {isPass ? 'PASS' : 'FAIL'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Not Graded</span>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-gray-500">
                                    No students found for the selected class/section.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      )}
    </div>
  );
}
