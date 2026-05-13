import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BookOpen, BookPlus, ListOrdered, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EditButton, DeleteButton, ActionButtonGroup } from '../components/ui/ActionButtons.jsx';
import { academicService } from '../services/academicService';
import studentService from '../services/studentService';
import subjectService from '../services/subjectService';
import classService from '../services/classService';
import { sectionService } from '../services/sectionService';
import syllabusBookService, { syllabusChapterService, syllabusTopicService, syllabusSubtopicService, syllabusPlanService } from '../services/syllabusBookService';
import { PERMISSIONS } from '../config/permissions';
import SyllabusProgressDetailsPage from './SyllabusProgressDetailsPage.jsx';
import SyllabusProgressUpdaterPage from './SyllabusProgressUpdaterPage.jsx';

const SyllabusDivision = ({ campusId, academicYears, subjects, formData, setFormData, canViewCourse, canCreateCourse, canEditCourse, canDeleteCourse, canViewChapters, canCreateChapters, canEditChapters, canDeleteChapters, canViewTopics, canCreateTopics, canEditTopics, canDeleteTopics, canViewSubtopics, canCreateSubtopics, canEditSubtopics, canDeleteSubtopics, canCreatePlan }) => {
  const [divisionTab, setDivisionTab] = useState(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [bookView, setBookView] = useState('list'); // 'list' | 'create' | 'edit'
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookActionLoading, setBookActionLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [editingCurriculumBookId, setEditingCurriculumBookId] = useState(null);
  const [chapterAcademicYearId, setChapterAcademicYearId] = useState('');
  const [chapterSubjectId, setChapterSubjectId] = useState('');
  const [chapterCurriculumBookId, setChapterCurriculumBookId] = useState('');
  const [chapterBooksLoading, setChapterBooksLoading] = useState(false);
  const [chapterBooks, setChapterBooks] = useState([]);
  const [chapterSelectedCurriculumId, setChapterSelectedCurriculumId] = useState(null);
  const [chapterView, setChapterView] = useState('list'); // 'list' | 'create' | 'edit'
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterActionLoading, setChapterActionLoading] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterForm, setChapterForm] = useState({
    chapter_title: '',
    chapter_description: '',
    sequence_order: '',
    default_hours: ''
  });
  const [expandedChapterId, setExpandedChapterId] = useState(null);
  const [topicsByChapterId, setTopicsByChapterId] = useState({});
  const [topicsLoadingByChapterId, setTopicsLoadingByChapterId] = useState({});
  const [topicActionLoading, setTopicActionLoading] = useState(false);
  const [topicView, setTopicView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({
    topic_title: '',
    topic_description: '',
    sequence_order: '',
    default_hours: ''
  });
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [subtopicsByTopicId, setSubtopicsByTopicId] = useState({});
  const [subtopicsLoadingByTopicId, setSubtopicsLoadingByTopicId] = useState({});
  const [subtopicActionLoading, setSubtopicActionLoading] = useState(false);
  const [subtopicView, setSubtopicView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingSubtopicId, setEditingSubtopicId] = useState(null);
  const [subtopicForm, setSubtopicForm] = useState({
    subtopic_title: '',
    subtopic_description: '',
    sequence_order: '',
    default_hours: ''
  });
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSelectedSectionIds, setAssignSelectedSectionIds] = useState([]);
  const [assignClassesLoading, setAssignClassesLoading] = useState(false);
  const [assignClasses, setAssignClasses] = useState([]);
  const [assignSectionsLoading, setAssignSectionsLoading] = useState(false);
  const [assignSections, setAssignSections] = useState([]);
  const [assignPlanLoading, setAssignPlanLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (divisionTab !== 'book') {
      setBookView('list');
      setEditingCurriculumBookId(null);
    }
    if (divisionTab !== 'chapters' && divisionTab !== 'assign') {
      setChapterView('list');
      setEditingChapterId(null);
      setChapters([]);
      setExpandedChapterId(null);
      setExpandedTopicId(null);
      setTopicsByChapterId({});
      setTopicsLoadingByChapterId({});
      setTopicView('list');
      setEditingTopicId(null);
      setSubtopicsByTopicId({});
      setSubtopicsLoadingByTopicId({});
      setSubtopicView('list');
      setEditingSubtopicId(null);
      setChapterForm({
        chapter_title: '',
        chapter_description: '',
        sequence_order: '',
        default_hours: ''
      });
      setTopicForm({
        topic_title: '',
        topic_description: '',
        sequence_order: '',
        default_hours: ''
      });
      setSubtopicForm({
        subtopic_title: '',
        subtopic_description: '',
        sequence_order: '',
        default_hours: ''
      });
    }
    if (divisionTab !== 'assign') {
      setAssignClassId('');
      setAssignSelectedSectionIds([]);
      setAssignSections([]);
    }
    if (divisionTab === 'assign') {
      setChapterView('list');
      setTopicView('list');
      setSubtopicView('list');
      setEditingChapterId(null);
      setEditingTopicId(null);
      setEditingSubtopicId(null);
    }
  }, [divisionTab]);

  useEffect(() => {
    const academicYearId = String(formData.academic_year_id || '').trim();
    if (!academicYearId) {
      setSelectedCurriculumId(null);
      return;
    }

    const selectedYear =
      academicYears.find((y) => String(y.academic_year_id) === academicYearId) || null;

    const inlineCurriculumId = selectedYear?.curriculum_id ?? selectedYear?.curriculumId ?? null;
    if (inlineCurriculumId) {
      setSelectedCurriculumId(String(inlineCurriculumId));
      return;
    }

    const fetchAcademicYearDetails = async () => {
      if (!campusId) {
        setSelectedCurriculumId(null);
        return;
      }
      try {
        const res = await academicService.getAcademicYearById(campusId, academicYearId);
        const ay = res?.data || res;
        const cid = ay?.curriculum_id ?? ay?.curriculumId ?? null;
        setSelectedCurriculumId(cid ? String(cid) : null);
      } catch (error) {
        console.error('Error fetching academic year details:', error);
        setSelectedCurriculumId(null);
      }
    };

    fetchAcademicYearDetails();
  }, [academicYears, campusId, formData.academic_year_id]);

  useEffect(() => {
    const academicYearId = String(chapterAcademicYearId || '').trim();
    if (!academicYearId) {
      setChapterSelectedCurriculumId(null);
      return;
    }

    const selectedYear =
      academicYears.find((y) => String(y.academic_year_id) === academicYearId) || null;

    const inlineCurriculumId = selectedYear?.curriculum_id ?? selectedYear?.curriculumId ?? null;
    if (inlineCurriculumId) {
      setChapterSelectedCurriculumId(String(inlineCurriculumId));
      return;
    }

    const fetchAcademicYearDetails = async () => {
      if (!campusId) {
        setChapterSelectedCurriculumId(null);
        return;
      }
      try {
        const res = await academicService.getAcademicYearById(campusId, academicYearId);
        const ay = res?.data || res;
        const cid = ay?.curriculum_id ?? ay?.curriculumId ?? null;
        setChapterSelectedCurriculumId(cid ? String(cid) : null);
      } catch (error) {
        console.error('Error fetching academic year details:', error);
        setChapterSelectedCurriculumId(null);
      }
    };

    fetchAcademicYearDetails();
  }, [academicYears, campusId, chapterAcademicYearId]);

  const filteredSubjects = useMemo(() => {
    if (!selectedCurriculumId) return subjects;
    return (subjects || []).filter((s) => {
      const cid = s?.curriculum_id ?? s?.curriculumId ?? null;
      return cid !== null && String(cid) === String(selectedCurriculumId);
    });
  }, [subjects, selectedCurriculumId]);

  const filteredChapterSubjects = useMemo(() => {
    if (!chapterSelectedCurriculumId) return subjects;
    return (subjects || []).filter((s) => {
      const cid = s?.curriculum_id ?? s?.curriculumId ?? null;
      return cid !== null && String(cid) === String(chapterSelectedCurriculumId);
    });
  }, [subjects, chapterSelectedCurriculumId]);

  useEffect(() => {
    const subjectId = String(formData.subject_id || '').trim();
    if (!subjectId) return;
    const exists = filteredSubjects.some((s) => String(s.subject_id) === subjectId);
    if (!exists) {
      setFormData((prev) => ({ ...prev, subject_id: '' }));
    }
  }, [filteredSubjects, formData.subject_id, setFormData]);

  useEffect(() => {
    const subjectId = String(chapterSubjectId || '').trim();
    if (!subjectId) return;
    const exists = filteredChapterSubjects.some((s) => String(s.subject_id) === subjectId);
    if (!exists) {
      setChapterSubjectId('');
      setChapterCurriculumBookId('');
    }
  }, [filteredChapterSubjects, chapterSubjectId]);

  const selectedSubjectName = useMemo(() => {
    const subjectId = String(formData.subject_id || '').trim();
    if (!subjectId) return '';
    const s = (subjects || []).find((x) => String(x.subject_id) === subjectId);
    return String(s?.subject_name || '').trim();
  }, [subjects, formData.subject_id]);

  const selectedChapterSubjectName = useMemo(() => {
    const subjectId = String(chapterSubjectId || '').trim();
    if (!subjectId) return '';
    const s = (subjects || []).find((x) => String(x.subject_id) === subjectId);
    return String(s?.subject_name || '').trim();
  }, [subjects, chapterSubjectId]);

  const fetchBooks = async () => {
    const academicYearIdStr = String(formData.academic_year_id || '').trim();
    if (!academicYearIdStr) {
      setBooks([]);
      return;
    }
    const academicYearId = Number.parseInt(academicYearIdStr, 10);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
      setBooks([]);
      return;
    }

    try {
      setBooksLoading(true);
      const response = await syllabusBookService.getBooks({ academic_year_id: academicYearId });
      const rows = response?.data?.books || response?.data || response?.books || [];
      setBooks(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error(error?.message || 'Failed to load books');
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    if (divisionTab !== 'book') return;
    if (bookView !== 'list') return;
    if (!canViewCourse) return;
    fetchBooks();
  }, [divisionTab, bookView, formData.academic_year_id, canViewCourse]);

  const fetchChapterBooks = async () => {
    const academicYearIdStr = String(chapterAcademicYearId || '').trim();
    if (!academicYearIdStr) {
      setChapterBooks([]);
      return;
    }
    const academicYearId = Number.parseInt(academicYearIdStr, 10);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
      setChapterBooks([]);
      return;
    }

    try {
      setChapterBooksLoading(true);
      const response = await syllabusBookService.getBooks({ academic_year_id: academicYearId });
      const rows = response?.data?.books || response?.data || response?.books || [];
      setChapterBooks(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error(error?.message || 'Failed to load books');
      setChapterBooks([]);
    } finally {
      setChapterBooksLoading(false);
    }
  };

  useEffect(() => {
    if (divisionTab !== 'chapters' && divisionTab !== 'assign') return;
    if (!canViewCourse) return;
    fetchChapterBooks();
  }, [divisionTab, chapterAcademicYearId, canViewCourse]);

  useEffect(() => {
    if (divisionTab !== 'assign') return;
    if (assignClasses.length > 0) return;

    const loadClasses = async () => {
      try {
        setAssignClassesLoading(true);
        const res = await sectionService.getFilterOptions();
        const classes = res?.success ? (res.data?.classes || []) : [];
        setAssignClasses(Array.isArray(classes) ? classes : []);
      } catch (error) {
        console.error('Failed to load classes:', error);
        setAssignClasses([]);
      } finally {
        setAssignClassesLoading(false);
      }
    };

    loadClasses();
  }, [divisionTab, assignClasses.length]);

  useEffect(() => {
    if (divisionTab !== 'assign') return;
    setAssignClassId('');
    setAssignSelectedSectionIds([]);
    setAssignSections([]);
  }, [divisionTab, chapterAcademicYearId]);

  useEffect(() => {
    if (divisionTab !== 'assign') return;
    if (!assignClassId) {
      setAssignSections([]);
      setAssignSelectedSectionIds([]);
      return;
    }

    const loadSections = async () => {
      try {
        setAssignSectionsLoading(true);
        const response = await sectionService.getAllSections({ class_id: assignClassId });
        let sectionList = [];
        if (response?.success && Array.isArray(response.data)) {
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
        setAssignSections(sectionList || []);
      } catch (error) {
        console.error('Failed to load sections:', error);
        setAssignSections([]);
      } finally {
        setAssignSectionsLoading(false);
      }
    };

    loadSections();
  }, [divisionTab, assignClassId]);

  const buildPlanTreeForSelectedBook = async () => {
    const bookIdStr = String(chapterCurriculumBookId || '').trim();
    if (!bookIdStr) return [];

    const response = await syllabusChapterService.getChapters({ curriculum_book_id: bookIdStr });
    const chapterRows = response?.data?.chapters || response?.data || response?.chapters || [];
    const normalizedChapters = Array.isArray(chapterRows) ? chapterRows : [];

    const topicsByChapter = {};
    const subtopicsByTopic = {};

    await Promise.all(
      normalizedChapters.map(async (ch) => {
        const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
        const chapterIdStr = String(chapterId || '').trim();
        if (!chapterIdStr) {
          topicsByChapter[chapterIdStr] = [];
          return;
        }

        if (Array.isArray(topicsByChapterId[chapterIdStr])) {
          topicsByChapter[chapterIdStr] = topicsByChapterId[chapterIdStr];
        } else {
          const topicRes = await syllabusTopicService.getTopics(chapterIdStr);
          const topicRows = topicRes?.data?.topics || topicRes?.data || topicRes?.topics || [];
          const normalizedTopics = Array.isArray(topicRows) ? topicRows : [];
          topicsByChapter[chapterIdStr] = normalizedTopics;
          setTopicsByChapterId((prev) => ({ ...prev, [chapterIdStr]: normalizedTopics }));
        }

        await Promise.all(
          (topicsByChapter[chapterIdStr] || []).map(async (tp) => {
            const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
            const topicIdStr = String(topicId || '').trim();
            if (!topicIdStr) {
              subtopicsByTopic[topicIdStr] = [];
              return;
            }

            if (Array.isArray(subtopicsByTopicId[topicIdStr])) {
              subtopicsByTopic[topicIdStr] = subtopicsByTopicId[topicIdStr];
            } else {
              const subRes = await syllabusSubtopicService.getSubtopics(topicIdStr);
              const subRows = subRes?.data?.subtopics || subRes?.data || subRes?.subtopics || [];
              const normalizedSubs = Array.isArray(subRows) ? subRows : [];
              subtopicsByTopic[topicIdStr] = normalizedSubs;
              setSubtopicsByTopicId((prev) => ({ ...prev, [topicIdStr]: normalizedSubs }));
            }
          })
        );
      })
    );

    const planTree = normalizedChapters
      .map((ch) => {
        const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
        const chapterIdStr = String(chapterId || '').trim();
        if (!chapterIdStr) return null;
        const topicRows = topicsByChapter[chapterIdStr] || [];
        return {
          chapter_id: Number(chapterIdStr),
          topics: (topicRows || [])
            .map((tp) => {
              const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
              const topicIdStr = String(topicId || '').trim();
              if (!topicIdStr) return null;
              const subRows = subtopicsByTopic[topicIdStr] || [];
              return {
                topic_id: Number(topicIdStr),
                subtopics: (subRows || [])
                  .map((st) => {
                    const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
                    const subIdStr = String(subId || '').trim();
                    if (!subIdStr) return null;
                    return { subtopic_id: Number(subIdStr) };
                  })
                  .filter(Boolean)
              };
            })
            .filter(Boolean)
        };
      })
      .filter(Boolean);

    return planTree;
  };

  const handleCreatePlan = async () => {
    if (!canCreatePlan) {
      toast.error('You do not have permission to create plans');
      return;
    }
    const ayStr = String(chapterAcademicYearId || '').trim();
    const academicYearId = Number.parseInt(ayStr, 10);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
      toast.error('Please select a valid Academic Year');
      return;
    }
    const subjectName = String(selectedChapterSubjectName || '').trim();
    if (!subjectName) {
      toast.error('Please select a Subject');
      return;
    }
    const sectionIds = (assignSelectedSectionIds || []).map((x) => String(x || '').trim()).filter(Boolean);
    if (sectionIds.length === 0) {
      toast.error('Please select at least one Section');
      return;
    }

    try {
      setAssignPlanLoading(true);
      const planTree = await buildPlanTreeForSelectedBook();
      if (!Array.isArray(planTree) || planTree.length === 0) {
        toast.error('No chapters found for this book');
        return;
      }

      const results = await Promise.allSettled(
        sectionIds.map((sectionId) =>
          syllabusPlanService.createPlan({
            academic_year_id: academicYearId,
            section_id: Number(sectionId),
            subject_name: subjectName,
            chapters: planTree
          })
        )
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value?.success).length;
      const failed = results.length - succeeded;

      if (failed === 0) {
        toast.success(`Plan created for ${succeeded} section${succeeded === 1 ? '' : 's'}`);
      } else {
        const firstError = results.find((r) => r.status === 'rejected')?.reason;
        toast.error(firstError?.message || `Plan created for ${succeeded} section(s), failed for ${failed}`);
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error(error?.message || 'Failed to create plan');
    } finally {
      setAssignPlanLoading(false);
    }
  };

  useEffect(() => {
    setChapterSubjectId('');
    setChapterCurriculumBookId('');
    setChapterBooks([]);
    setChapterView('list');
    setEditingChapterId(null);
    setChapters([]);
    setExpandedChapterId(null);
    setExpandedTopicId(null);
    setTopicsByChapterId({});
    setTopicsLoadingByChapterId({});
    setTopicView('list');
    setEditingTopicId(null);
    setSubtopicsByTopicId({});
    setSubtopicsLoadingByTopicId({});
    setSubtopicView('list');
    setEditingSubtopicId(null);
    setChapterForm({
      chapter_title: '',
      chapter_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setTopicForm({
      topic_title: '',
      topic_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setSubtopicForm({
      subtopic_title: '',
      subtopic_description: '',
      sequence_order: '',
      default_hours: ''
    });
  }, [chapterAcademicYearId]);

  useEffect(() => {
    setChapterCurriculumBookId('');
    setChapterView('list');
    setEditingChapterId(null);
    setChapters([]);
    setExpandedChapterId(null);
    setExpandedTopicId(null);
    setTopicsByChapterId({});
    setTopicsLoadingByChapterId({});
    setTopicView('list');
    setEditingTopicId(null);
    setSubtopicsByTopicId({});
    setSubtopicsLoadingByTopicId({});
    setSubtopicView('list');
    setEditingSubtopicId(null);
    setChapterForm({
      chapter_title: '',
      chapter_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setTopicForm({
      topic_title: '',
      topic_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setSubtopicForm({
      subtopic_title: '',
      subtopic_description: '',
      sequence_order: '',
      default_hours: ''
    });
  }, [chapterSubjectId]);

  useEffect(() => {
    setChapterView('list');
    setEditingChapterId(null);
    setChapters([]);
    setExpandedChapterId(null);
    setExpandedTopicId(null);
    setTopicsByChapterId({});
    setTopicsLoadingByChapterId({});
    setTopicView('list');
    setEditingTopicId(null);
    setSubtopicsByTopicId({});
    setSubtopicsLoadingByTopicId({});
    setSubtopicView('list');
    setEditingSubtopicId(null);
    setChapterForm({
      chapter_title: '',
      chapter_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setTopicForm({
      topic_title: '',
      topic_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setSubtopicForm({
      subtopic_title: '',
      subtopic_description: '',
      sequence_order: '',
      default_hours: ''
    });
  }, [chapterCurriculumBookId]);

  const availableChapterBooks = useMemo(() => {
    const subjectIdStr = String(chapterSubjectId || '').trim();
    if (!subjectIdStr) return [];
    return (chapterBooks || []).filter((b) => {
      const bSubjectId = b?.subject_id ?? b?.subjectId ?? null;
      if (bSubjectId != null && String(bSubjectId) === subjectIdStr) return true;
      const bSubjectName = String(b?.subject_name ?? b?.subjectName ?? '').trim();
      return !!selectedChapterSubjectName && bSubjectName === selectedChapterSubjectName;
    });
  }, [chapterBooks, chapterSubjectId, selectedChapterSubjectName]);

  const fetchChapters = async () => {
    const bookIdStr = String(chapterCurriculumBookId || '').trim();
    if (!bookIdStr) {
      setChapters([]);
      return;
    }
    if (!canViewChapters) {
      setChapters([]);
      return;
    }

    try {
      setChaptersLoading(true);
      const response = await syllabusChapterService.getChapters({ curriculum_book_id: bookIdStr });
      const rows = response?.data?.chapters || response?.data || response?.chapters || [];
      setChapters(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast.error(error?.message || 'Failed to load chapters');
      setChapters([]);
    } finally {
      setChaptersLoading(false);
    }
  };

  useEffect(() => {
    if (divisionTab !== 'chapters' && divisionTab !== 'assign') return;
    if (divisionTab === 'chapters' && chapterView !== 'list') return;
    if (!String(chapterCurriculumBookId || '').trim()) return;
    fetchChapters();
  }, [divisionTab, chapterView, chapterCurriculumBookId, canViewChapters]);

  const startCreateChapter = () => {
    setEditingChapterId(null);
    setChapterForm({
      chapter_title: '',
      chapter_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setChapterView('create');
  };

  const startEditChapter = (chapter) => {
    const chapterId = chapter?.chapter_id ?? chapter?.chapterId ?? chapter?.id ?? null;
    if (!chapterId) {
      toast.error('Invalid chapter id');
      return;
    }
    setEditingChapterId(String(chapterId));
    setChapterForm({
      chapter_title: String(chapter?.chapter_title ?? chapter?.chapterTitle ?? '').trim(),
      chapter_description: String(chapter?.chapter_description ?? chapter?.chapterDescription ?? '').trim(),
      sequence_order: String(chapter?.sequence_order ?? chapter?.sequenceOrder ?? 0),
      default_hours: chapter?.default_hours ?? chapter?.defaultHours ?? ''
    });
    setChapterView('edit');
  };

  const validateChapterForm = () => {
    const bookIdStr = String(chapterCurriculumBookId || '').trim();
    if (!bookIdStr) {
      toast.error('Please select a Book');
      return null;
    }
    const chapterTitle = String(chapterForm.chapter_title || '').trim();
    if (!chapterTitle) {
      toast.error('Please enter Chapter Title');
      return null;
    }
    const seqStr = String(chapterForm.sequence_order ?? '').trim();
    const sequenceOrder = seqStr === '' ? 0 : Number.parseInt(seqStr, 10);
    if (!Number.isInteger(sequenceOrder) || sequenceOrder < 0) {
      toast.error('Sequence Order must be an integer >= 0');
      return null;
    }
    const hoursStr = String(chapterForm.default_hours ?? '').trim();
    const defaultHours = hoursStr === '' ? undefined : Number.parseFloat(hoursStr);
    if (hoursStr !== '' && (Number.isNaN(defaultHours) || defaultHours < 0)) {
      toast.error('Default Hours must be a number >= 0');
      return null;
    }
    return {
      curriculum_book_id: Number.parseInt(bookIdStr, 10),
      chapter_title: chapterTitle,
      chapter_description: String(chapterForm.chapter_description ?? '').trim() || null,
      sequence_order: sequenceOrder,
      default_hours: defaultHours
    };
  };

  const handleCreateChapter = async () => {
    if (!canCreateChapters) {
      toast.error('You do not have permission to add chapters');
      return;
    }
    const payload = validateChapterForm();
    if (!payload) return;

    try {
      setChapterActionLoading(true);
      const response = await syllabusChapterService.createChapter(payload);
      if (response?.success) {
        toast.success(response?.message || 'Chapter created successfully');
        setChapterView('list');
        fetchChapters();
      } else {
        toast.error(response?.message || 'Failed to create chapter');
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error(error?.message || 'Failed to create chapter');
    } finally {
      setChapterActionLoading(false);
    }
  };

  const handleUpdateChapter = async () => {
    if (!canEditChapters) {
      toast.error('You do not have permission to edit chapters');
      return;
    }
    if (!editingChapterId) {
      toast.error('No chapter selected for edit');
      return;
    }
    const payload = validateChapterForm();
    if (!payload) return;

    try {
      setChapterActionLoading(true);
      const updatePayload = {
        chapter_title: payload.chapter_title,
        chapter_description: payload.chapter_description,
        sequence_order: payload.sequence_order,
        default_hours: payload.default_hours
      };
      const response = await syllabusChapterService.updateChapter(editingChapterId, updatePayload);
      if (response?.success) {
        toast.success(response?.message || 'Chapter updated successfully');
        setChapterView('list');
        setEditingChapterId(null);
        fetchChapters();
      } else {
        toast.error(response?.message || 'Failed to update chapter');
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast.error(error?.message || 'Failed to update chapter');
    } finally {
      setChapterActionLoading(false);
    }
  };

  const handleDeleteChapter = async (chapter) => {
    if (!canDeleteChapters) {
      toast.error('You do not have permission to delete chapters');
      return;
    }
    const chapterId = chapter?.chapter_id ?? chapter?.chapterId ?? chapter?.id ?? null;
    if (!chapterId) {
      toast.error('Invalid chapter id');
      return;
    }

    try {
      setChapterActionLoading(true);
      const response = await syllabusChapterService.deleteChapter(String(chapterId));
      if (response?.success) {
        toast.success(response?.message || 'Chapter deleted successfully');
        fetchChapters();
      } else {
        toast.error(response?.message || 'Failed to delete chapter');
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error(error?.message || 'Failed to delete chapter');
    } finally {
      setChapterActionLoading(false);
    }
  };

  const fetchTopicsForChapter = async (chapterId) => {
    const chapterIdStr = String(chapterId || '').trim();
    if (!chapterIdStr) return;
    if (!canViewTopics) return;

    try {
      setTopicsLoadingByChapterId((prev) => ({ ...prev, [chapterIdStr]: true }));
      const response = await syllabusTopicService.getTopics(chapterIdStr);
      const rows = response?.data?.topics || response?.data || response?.topics || [];
      setTopicsByChapterId((prev) => ({ ...prev, [chapterIdStr]: Array.isArray(rows) ? rows : [] }));
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error(error?.message || 'Failed to load topics');
      setTopicsByChapterId((prev) => ({ ...prev, [chapterIdStr]: [] }));
    } finally {
      setTopicsLoadingByChapterId((prev) => ({ ...prev, [chapterIdStr]: false }));
    }
  };

  const toggleChapterExpanded = async (chapter) => {
    const chapterId = chapter?.chapter_id ?? chapter?.chapterId ?? chapter?.id ?? null;
    if (!chapterId) return;
    const chapterIdStr = String(chapterId);
    const nextExpanded = expandedChapterId === chapterIdStr ? null : chapterIdStr;
    setExpandedChapterId(nextExpanded);
    setExpandedTopicId(null);
    setTopicView('list');
    setEditingTopicId(null);
    setTopicForm({
      topic_title: '',
      topic_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setSubtopicView('list');
    setEditingSubtopicId(null);
    setSubtopicForm({
      subtopic_title: '',
      subtopic_description: '',
      sequence_order: '',
      default_hours: ''
    });

    if (nextExpanded && topicsByChapterId[chapterIdStr] === undefined) {
      await fetchTopicsForChapter(chapterIdStr);
    }
  };

  const startCreateTopic = () => {
    setEditingTopicId(null);
    setTopicForm({
      topic_title: '',
      topic_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setTopicView('create');
  };

  const startEditTopic = (topic) => {
    const topicId = topic?.topic_id ?? topic?.topicId ?? topic?.id ?? null;
    if (!topicId) {
      toast.error('Invalid topic id');
      return;
    }
    setEditingTopicId(String(topicId));
    setTopicForm({
      topic_title: String(topic?.topic_title ?? topic?.topicTitle ?? '').trim(),
      topic_description: String(topic?.topic_description ?? topic?.topicDescription ?? '').trim(),
      sequence_order: String(topic?.sequence_order ?? topic?.sequenceOrder ?? 0),
      default_hours: topic?.default_hours ?? topic?.defaultHours ?? ''
    });
    setTopicView('edit');
  };

  const validateTopicForm = () => {
    const chapterIdStr = String(expandedChapterId || '').trim();
    if (!chapterIdStr) {
      toast.error('Please select a Chapter');
      return null;
    }
    const topicTitle = String(topicForm.topic_title || '').trim();
    if (!topicTitle) {
      toast.error('Please enter Topic Title');
      return null;
    }
    const seqStr = String(topicForm.sequence_order ?? '').trim();
    const sequenceOrder = seqStr === '' ? 0 : Number.parseInt(seqStr, 10);
    if (!Number.isInteger(sequenceOrder) || sequenceOrder < 0) {
      toast.error('Sequence Order must be an integer >= 0');
      return null;
    }
    const hoursStr = String(topicForm.default_hours ?? '').trim();
    const defaultHours = hoursStr === '' ? undefined : Number.parseFloat(hoursStr);
    if (hoursStr !== '' && (Number.isNaN(defaultHours) || defaultHours < 0)) {
      toast.error('Default Hours must be a number >= 0');
      return null;
    }
    return {
      chapter_id: Number.parseInt(chapterIdStr, 10),
      topic_title: topicTitle,
      topic_description: String(topicForm.topic_description ?? '').trim() || null,
      sequence_order: sequenceOrder,
      default_hours: defaultHours
    };
  };

  const handleCreateTopic = async () => {
    if (!canCreateTopics) {
      toast.error('You do not have permission to add topics');
      return;
    }
    const payload = validateTopicForm();
    if (!payload) return;

    try {
      setTopicActionLoading(true);
      const response = await syllabusTopicService.createTopic(payload);
      if (response?.success) {
        toast.success(response?.message || 'Topic created successfully');
        setTopicView('list');
        await fetchTopicsForChapter(payload.chapter_id);
      } else {
        toast.error(response?.message || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error(error?.message || 'Failed to create topic');
    } finally {
      setTopicActionLoading(false);
    }
  };

  const handleUpdateTopic = async () => {
    if (!canEditTopics) {
      toast.error('You do not have permission to edit topics');
      return;
    }
    if (!editingTopicId) {
      toast.error('No topic selected for edit');
      return;
    }
    const payload = validateTopicForm();
    if (!payload) return;

    try {
      setTopicActionLoading(true);
      const updatePayload = {
        topic_title: payload.topic_title,
        topic_description: payload.topic_description,
        sequence_order: payload.sequence_order,
        default_hours: payload.default_hours
      };
      const response = await syllabusTopicService.updateTopic(editingTopicId, updatePayload);
      if (response?.success) {
        toast.success(response?.message || 'Topic updated successfully');
        setTopicView('list');
        setEditingTopicId(null);
        await fetchTopicsForChapter(payload.chapter_id);
      } else {
        toast.error(response?.message || 'Failed to update topic');
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error(error?.message || 'Failed to update topic');
    } finally {
      setTopicActionLoading(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!canDeleteTopics) {
      toast.error('You do not have permission to delete topics');
      return;
    }
    const chapterIdStr = String(expandedChapterId || '').trim();
    const topicId = topic?.topic_id ?? topic?.topicId ?? topic?.id ?? null;
    if (!topicId) {
      toast.error('Invalid topic id');
      return;
    }

    try {
      setTopicActionLoading(true);
      const response = await syllabusTopicService.deleteTopic(String(topicId));
      if (response?.success) {
        toast.success(response?.message || 'Topic deleted successfully');
        if (chapterIdStr) {
          await fetchTopicsForChapter(chapterIdStr);
        }
      } else {
        toast.error(response?.message || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error(error?.message || 'Failed to delete topic');
    } finally {
      setTopicActionLoading(false);
    }
  };

  const fetchSubtopicsForTopic = async (topicId) => {
    const topicIdStr = String(topicId || '').trim();
    if (!topicIdStr) return;
    if (!canViewSubtopics) return;

    try {
      setSubtopicsLoadingByTopicId((prev) => ({ ...prev, [topicIdStr]: true }));
      const response = await syllabusSubtopicService.getSubtopics(topicIdStr);
      const rows = response?.data?.subtopics || response?.data || response?.subtopics || [];
      setSubtopicsByTopicId((prev) => ({ ...prev, [topicIdStr]: Array.isArray(rows) ? rows : [] }));
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      toast.error(error?.message || 'Failed to load subtopics');
      setSubtopicsByTopicId((prev) => ({ ...prev, [topicIdStr]: [] }));
    } finally {
      setSubtopicsLoadingByTopicId((prev) => ({ ...prev, [topicIdStr]: false }));
    }
  };

  const toggleTopicExpanded = async (topic) => {
    const topicId = topic?.topic_id ?? topic?.topicId ?? topic?.id ?? null;
    if (!topicId) return;
    const topicIdStr = String(topicId);
    const nextExpanded = expandedTopicId === topicIdStr ? null : topicIdStr;
    setExpandedTopicId(nextExpanded);
    setSubtopicView('list');
    setEditingSubtopicId(null);
    setSubtopicForm({
      subtopic_title: '',
      subtopic_description: '',
      sequence_order: '',
      default_hours: ''
    });

    if (nextExpanded && subtopicsByTopicId[topicIdStr] === undefined) {
      await fetchSubtopicsForTopic(topicIdStr);
    }
  };

  const startCreateSubtopic = () => {
    setEditingSubtopicId(null);
    setSubtopicForm({
      subtopic_title: '',
      subtopic_description: '',
      sequence_order: '',
      default_hours: ''
    });
    setSubtopicView('create');
  };

  const startEditSubtopic = (subtopic) => {
    const subtopicId = subtopic?.subtopic_id ?? subtopic?.subtopicId ?? subtopic?.id ?? null;
    if (!subtopicId) {
      toast.error('Invalid subtopic id');
      return;
    }
    setEditingSubtopicId(String(subtopicId));
    setSubtopicForm({
      subtopic_title: String(subtopic?.subtopic_title ?? subtopic?.subtopicTitle ?? '').trim(),
      subtopic_description: String(subtopic?.subtopic_description ?? subtopic?.subtopicDescription ?? '').trim(),
      sequence_order: String(subtopic?.sequence_order ?? subtopic?.sequenceOrder ?? 0),
      default_hours: subtopic?.default_hours ?? subtopic?.defaultHours ?? ''
    });
    setSubtopicView('edit');
  };

  const validateSubtopicForm = () => {
    const topicIdStr = String(expandedTopicId || '').trim();
    if (!topicIdStr) {
      toast.error('Please select a Topic');
      return null;
    }
    const subtopicTitle = String(subtopicForm.subtopic_title || '').trim();
    if (!subtopicTitle) {
      toast.error('Please enter Subtopic Title');
      return null;
    }
    const seqStr = String(subtopicForm.sequence_order ?? '').trim();
    const sequenceOrder = seqStr === '' ? 0 : Number.parseInt(seqStr, 10);
    if (!Number.isInteger(sequenceOrder) || sequenceOrder < 0) {
      toast.error('Sequence Order must be an integer >= 0');
      return null;
    }
    const hoursStr = String(subtopicForm.default_hours ?? '').trim();
    const defaultHours = hoursStr === '' ? undefined : Number.parseFloat(hoursStr);
    if (hoursStr !== '' && (Number.isNaN(defaultHours) || defaultHours < 0)) {
      toast.error('Default Hours must be a number >= 0');
      return null;
    }
    return {
      topic_id: Number.parseInt(topicIdStr, 10),
      subtopic_title: subtopicTitle,
      subtopic_description: String(subtopicForm.subtopic_description ?? '').trim() || null,
      sequence_order: sequenceOrder,
      default_hours: defaultHours
    };
  };

  const handleCreateSubtopic = async () => {
    if (!canCreateSubtopics) {
      toast.error('You do not have permission to add subtopics');
      return;
    }
    const payload = validateSubtopicForm();
    if (!payload) return;

    try {
      setSubtopicActionLoading(true);
      const response = await syllabusSubtopicService.createSubtopic(payload);
      if (response?.success) {
        toast.success(response?.message || 'Subtopic created successfully');
        setSubtopicView('list');
        await fetchSubtopicsForTopic(payload.topic_id);
      } else {
        toast.error(response?.message || 'Failed to create subtopic');
      }
    } catch (error) {
      console.error('Error creating subtopic:', error);
      toast.error(error?.message || 'Failed to create subtopic');
    } finally {
      setSubtopicActionLoading(false);
    }
  };

  const handleUpdateSubtopic = async () => {
    if (!canEditSubtopics) {
      toast.error('You do not have permission to edit subtopics');
      return;
    }
    if (!editingSubtopicId) {
      toast.error('No subtopic selected for edit');
      return;
    }
    const payload = validateSubtopicForm();
    if (!payload) return;

    try {
      setSubtopicActionLoading(true);
      const updatePayload = {
        subtopic_title: payload.subtopic_title,
        subtopic_description: payload.subtopic_description,
        sequence_order: payload.sequence_order,
        default_hours: payload.default_hours
      };
      const response = await syllabusSubtopicService.updateSubtopic(editingSubtopicId, updatePayload);
      if (response?.success) {
        toast.success(response?.message || 'Subtopic updated successfully');
        setSubtopicView('list');
        setEditingSubtopicId(null);
        await fetchSubtopicsForTopic(payload.topic_id);
      } else {
        toast.error(response?.message || 'Failed to update subtopic');
      }
    } catch (error) {
      console.error('Error updating subtopic:', error);
      toast.error(error?.message || 'Failed to update subtopic');
    } finally {
      setSubtopicActionLoading(false);
    }
  };

  const handleDeleteSubtopic = async (subtopic) => {
    if (!canDeleteSubtopics) {
      toast.error('You do not have permission to delete subtopics');
      return;
    }
    const topicIdStr = String(expandedTopicId || '').trim();
    const subtopicId = subtopic?.subtopic_id ?? subtopic?.subtopicId ?? subtopic?.id ?? null;
    if (!subtopicId) {
      toast.error('Invalid subtopic id');
      return;
    }

    try {
      setSubtopicActionLoading(true);
      const response = await syllabusSubtopicService.deleteSubtopic(String(subtopicId));
      if (response?.success) {
        toast.success(response?.message || 'Subtopic deleted successfully');
        if (topicIdStr) {
          await fetchSubtopicsForTopic(topicIdStr);
        }
      } else {
        toast.error(response?.message || 'Failed to delete subtopic');
      }
    } catch (error) {
      console.error('Error deleting subtopic:', error);
      toast.error(error?.message || 'Failed to delete subtopic');
    } finally {
      setSubtopicActionLoading(false);
    }
  };

  const startCreateBook = () => {
    setEditingCurriculumBookId(null);
    setFormData((prev) => ({
      ...prev,
      subject_id: '',
      book_name: '',
      version: ''
    }));
    setBookView('create');
  };

  const startEditBook = (book) => {
    const curriculumBookId =
      book?.curriculum_book_id ?? book?.curriculumBookId ?? book?.curriculum_bookId ?? book?.id ?? null;
    if (!curriculumBookId) {
      toast.error('Invalid book id');
      return;
    }

    const academicYearId = book?.academic_year_id ?? book?.academicYearId ?? null;
    const subjectIdFromBook = book?.subject_id ?? book?.subjectId ?? null;
    const subjectNameFromBook = String(book?.subject_name ?? book?.subjectName ?? '').trim();
    const versionNo = book?.version_no ?? book?.versionNo ?? book?.version ?? null;

    const matchedSubjectByName =
      subjectNameFromBook
        ? (subjects || []).find((s) => String(s?.subject_name || '').trim() === subjectNameFromBook) || null
        : null;

    setEditingCurriculumBookId(String(curriculumBookId));

    setFormData((prev) => ({
      ...prev,
      academic_year_id: academicYearId !== null && academicYearId !== undefined ? String(academicYearId) : '',
      subject_id: subjectIdFromBook
        ? String(subjectIdFromBook)
        : matchedSubjectByName
          ? String(matchedSubjectByName.subject_id)
          : '',
      book_name: String(book?.book_name ?? book?.bookName ?? '').trim(),
      version: versionNo !== null && versionNo !== undefined ? String(versionNo) : ''
    }));

    setBookView('edit');
  };

  const validateCreateBook = () => {
    const academicYearIdStr = String(formData.academic_year_id || '').trim();
    const academicYearId = Number.parseInt(academicYearIdStr, 10);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
      toast.error('Please select Academic Year');
      return null;
    }
    const subjectIdStr = String(formData.subject_id || '').trim();
    const subjectId = Number.parseInt(subjectIdStr, 10);
    if (!Number.isInteger(subjectId) || subjectId < 1 || !selectedSubjectName) {
      toast.error('Please select Subject Name');
      return null;
    }
    const bookName = String(formData.book_name || '').trim();
    if (!bookName) {
      toast.error('Please enter Book Name');
      return null;
    }
    const versionStr = String(formData.version ?? '').trim();
    const versionNo = versionStr ? Number.parseInt(versionStr, 10) : undefined;
    if (versionStr && (!Number.isInteger(versionNo) || versionNo < 1)) {
      toast.error('Version must be an integer >= 1');
      return null;
    }
    return { academicYearId, subjectId, subjectName: selectedSubjectName, bookName, versionNo };
  };

  const handleCreateBook = async () => {
    if (!canCreateCourse) {
      toast.error('You do not have permission to add books');
      return;
    }
    const v = validateCreateBook();
    if (!v) return;

    try {
      setBookActionLoading(true);
      const payload = {
        academic_year_id: v.academicYearId,
        subject_id: v.subjectId,
        subject_name: v.subjectName,
        book_name: v.bookName,
        version_no: v.versionNo
      };
      const response = await syllabusBookService.createBook(payload);
      if (response?.success) {
        toast.success(response?.message || 'Book created successfully');
        setBookView('list');
        fetchBooks();
      } else {
        toast.error(response?.message || 'Failed to create book');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error(error?.message || 'Failed to create book');
    } finally {
      setBookActionLoading(false);
    }
  };

  const handleUpdateBook = async () => {
    if (!canEditCourse) {
      toast.error('You do not have permission to edit books');
      return;
    }
    if (!editingCurriculumBookId) {
      toast.error('No book selected for edit');
      return;
    }
    const bookName = String(formData.book_name || '').trim();
    if (!bookName) {
      toast.error('Please enter Book Name');
      return;
    }
    const versionStr = String(formData.version ?? '').trim();
    const versionNo = versionStr ? Number.parseInt(versionStr, 10) : undefined;
    if (versionStr && (!Number.isInteger(versionNo) || versionNo < 1)) {
      toast.error('Version must be an integer >= 1');
      return;
    }

    try {
      setBookActionLoading(true);
      const payload = {
        book_name: bookName,
        ...(versionNo !== undefined ? { version_no: versionNo } : {})
      };
      const response = await syllabusBookService.updateBook(editingCurriculumBookId, payload);
      if (response?.success) {
        toast.success(response?.message || 'Book updated successfully');
        setBookView('list');
        setEditingCurriculumBookId(null);
        fetchBooks();
      } else {
        toast.error(response?.message || 'Failed to update book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error(error?.message || 'Failed to update book');
    } finally {
      setBookActionLoading(false);
    }
  };

  const handleDeleteBook = async (book) => {
    if (!canDeleteCourse) {
      toast.error('You do not have permission to delete books');
      return;
    }

    const curriculumBookId =
      book?.curriculum_book_id ?? book?.curriculumBookId ?? book?.curriculum_bookId ?? book?.id ?? null;
    if (!curriculumBookId) {
      toast.error('Invalid book id');
      return;
    }

    try {
      setBookActionLoading(true);
      const response = await syllabusBookService.deleteBook(String(curriculumBookId));
      if (response?.success) {
        toast.success(response?.message || 'Book deleted successfully');
        fetchBooks();
      } else {
        toast.error(response?.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error(error?.message || 'Failed to delete book');
    } finally {
      setBookActionLoading(false);
    }
  };

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <div className="p-4 md:p-6">
        {divisionTab === null ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Syllabus Division</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
              <Card hover onClick={() => setDivisionTab('book')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <BookPlus className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Add Book</h2>
                  <p className="text-secondary-600">Add syllabus book details</p>
                </div>
              </Card>

              <Card hover onClick={() => setDivisionTab('chapters')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <ListOrdered className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Add Chapters</h2>
                  <p className="text-secondary-600">Add chapters for the selected book</p>
                </div>
              </Card>

              <Card hover onClick={() => setDivisionTab('assign')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Assign Syllabus</h2>
                  <p className="text-secondary-600">View syllabus and select class & sections</p>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {divisionTab === 'book' ? 'Add Book' : divisionTab === 'chapters' ? 'Add Chapters' : 'Assign Syllabus to Sections'}
              </h2>
              <button type="button" onClick={() => setDivisionTab(null)} className="btn-secondary">
                Back
              </button>
            </div>

            {divisionTab === 'book' ? (
              <>
                {bookView === 'list' ? (
                  <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
                    <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-secondary-900">Books</h2>
                        <p className="text-secondary-600 text-sm font-medium">
                          Select an academic year to view syllabus books
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {canCreateCourse && (
                          <button
                            type="button"
                            onClick={startCreateBook}
                            className="btn-primary w-full sm:w-auto justify-center"
                            disabled={bookActionLoading}
                          >
                            Add Book
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                          <select
                            name="academic_year_id"
                            value={formData.academic_year_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Academic Year</option>
                            {academicYears.map((year) => (
                              <option key={year.academic_year_id} value={String(year.academic_year_id)}>
                                {year.year_name} - {year.curriculum_code} - {year.medium}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6">
                        {!canViewCourse ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">Access Restricted</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              You do not have permission to view books.
                            </p>
                          </div>
                        ) : booksLoading ? (
                          <div className="flex justify-center items-center py-12">
                            <LoadingSpinner className="w-8 h-8" />
                            <span className="ml-2 text-gray-500">Loading books...</span>
                          </div>
                        ) : !String(formData.academic_year_id || '').trim() ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">Select an academic year</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              Choose an academic year to list syllabus books.
                            </p>
                          </div>
                        ) : books.length === 0 ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">No books found</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              No syllabus books exist for this academic year.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-secondary-200">
                              <thead className="bg-secondary-50/50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Subject
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Book
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Version
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  {(canEditCourse || canDeleteCourse) && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-secondary-200">
                                {books.map((b, idx) => {
                                  const subjectId = b?.subject_id ?? b?.subjectId ?? null;
                                  const subjectNameById = subjectId
                                    ? String((subjects || []).find((s) => String(s?.subject_id) === String(subjectId))?.subject_name || '').trim()
                                    : '';
                                  const subjectName = String(b?.subject_name ?? b?.subjectName ?? '').trim() || subjectNameById;
                                  const bookName = String(b?.book_name ?? b?.bookName ?? '').trim();
                                  const versionNo = b?.version_no ?? b?.versionNo ?? b?.version ?? '';
                                  const isActive = b?.is_active ?? b?.isActive;
                                  const rowId =
                                    b?.curriculum_book_id ?? b?.curriculumBookId ?? b?.curriculum_bookId ?? b?.id ?? null;

                                  return (
                                    <tr
                                      key={rowId ? String(rowId) : `${subjectName}-${versionNo}-${idx}`}
                                      className="hover:bg-secondary-50 transition-colors"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                        {subjectName || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                        {bookName || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                        {versionNo || '—'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                            isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                          }`}
                                        >
                                          {isActive === false ? 'Inactive' : 'Active'}
                                        </span>
                                      </td>
                                      {(canEditCourse || canDeleteCourse) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <ActionButtonGroup>
                                            {canEditCourse && (
                                              <EditButton onClick={() => startEditBook(b)} title="Edit book" />
                                            )}
                                            {canDeleteCourse && (
                                              <DeleteButton
                                                onClick={() => handleDeleteBook(b)}
                                                title="Delete book"
                                                confirmMessage={`Are you sure you want to delete ${subjectName || 'this book'} (v${versionNo || ''})?`}
                                                disabled={bookActionLoading}
                                              />
                                            )}
                                          </ActionButtonGroup>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl">
                    <Card>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <h2 className="text-xl font-bold text-secondary-900">
                            {bookView === 'create' ? 'Add New Book' : 'Edit Book'}
                          </h2>
                          <button
                            type="button"
                            onClick={() => {
                              setBookView('list');
                              setEditingCurriculumBookId(null);
                            }}
                            className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to List
                          </button>
                        </div>

                        {bookActionLoading && (
                          <div className="mb-6 p-3 bg-primary-50 border-l-4 border-primary-400">
                            <div className="flex items-center">
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                              <p className="text-sm text-primary-700">
                                {bookView === 'create' ? 'Creating book...' : 'Updating book...'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <select
                              name="academic_year_id"
                              value={formData.academic_year_id}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={bookView === 'edit'}
                            >
                              <option value="">Select Academic Year</option>
                              {academicYears.map((year) => (
                                <option key={year.academic_year_id} value={String(year.academic_year_id)}>
                                  {year.year_name} - {year.curriculum_code} - {year.medium}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                            <select
                              name="subject_id"
                              value={formData.subject_id}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={bookView === 'edit'}
                            >
                              <option value="">Select Subject</option>
                              {filteredSubjects.map((sub) => (
                                <option key={sub.subject_id} value={String(sub.subject_id)}>
                                  {sub.subject_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Book Name</label>
                            <input
                              type="text"
                              name="book_name"
                              value={formData.book_name}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter book name"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Version No {bookView === 'edit' ? '' : '(Optional)'}
                            </label>
                            <input
                              type="number"
                              name="version"
                              value={formData.version}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min={1}
                              step={1}
                              placeholder="1"
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          {bookView === 'create' ? (
                            <button type="button" className="btn-primary" onClick={handleCreateBook} disabled={bookActionLoading}>
                              Add Book
                            </button>
                          ) : (
                            <button type="button" className="btn-primary" onClick={handleUpdateBook} disabled={bookActionLoading}>
                              Update Book
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
                <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900">
                      {divisionTab === 'chapters' ? 'Chapters' : 'Assign Syllabus'}
                    </h2>
                    <p className="text-secondary-600 text-sm font-medium">
                      {divisionTab === 'chapters'
                        ? 'Select academic year, subject and book to manage chapters'
                        : 'Select academic year, subject and book to view syllabus and select class & sections'}
                    </p>
                  </div>
                  {divisionTab === 'chapters' && chapterView === 'list' && canCreateChapters && String(chapterCurriculumBookId || '').trim() && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={startCreateChapter}
                        className="btn-primary w-full sm:w-auto justify-center"
                        disabled={chapterActionLoading}
                      >
                        Add Chapter
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <select
                        value={chapterAcademicYearId}
                        onChange={(e) => setChapterAcademicYearId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year) => (
                          <option key={year.academic_year_id} value={String(year.academic_year_id)}>
                            {year.year_name} - {year.curriculum_code} - {year.medium}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                      <select
                        value={chapterSubjectId}
                        onChange={(e) => setChapterSubjectId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!String(chapterAcademicYearId || '').trim()}
                      >
                        <option value="">Select Subject</option>
                        {filteredChapterSubjects.map((sub) => (
                          <option key={sub.subject_id} value={String(sub.subject_id)}>
                            {sub.subject_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                      <select
                        value={chapterCurriculumBookId}
                        onChange={(e) => setChapterCurriculumBookId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!String(chapterAcademicYearId || '').trim() || !String(chapterSubjectId || '').trim()}
                      >
                        <option value="">Select Book</option>
                        {availableChapterBooks.map((b) => {
                          const bookId =
                            b?.curriculum_book_id ?? b?.curriculumBookId ?? b?.curriculum_bookId ?? b?.id ?? '';
                          const bookName = String(b?.book_name ?? b?.bookName ?? '').trim();
                          const versionNo = b?.version_no ?? b?.versionNo ?? b?.version ?? '';
                          const label = `${bookName || '—'}${versionNo !== '' ? ` (v${versionNo})` : ''}`;
                          return (
                            <option key={String(bookId)} value={String(bookId)}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {!canViewCourse ? (
                    <div className="text-center py-16 bg-white">
                      <h3 className="text-lg font-bold text-secondary-900">Access Restricted</h3>
                      <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                        You do not have permission to view books.
                      </p>
                    </div>
                  ) : chapterBooksLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <LoadingSpinner className="w-8 h-8" />
                      <span className="ml-2 text-gray-500">Loading books...</span>
                    </div>
                  ) : !String(chapterAcademicYearId || '').trim() ? (
                    <div className="text-center py-16 bg-white">
                      <h3 className="text-lg font-bold text-secondary-900">Select an academic year</h3>
                      <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                        Choose an academic year to list books for chapters.
                      </p>
                    </div>
                  ) : !String(chapterSubjectId || '').trim() ? (
                    <div className="text-center py-16 bg-white">
                      <h3 className="text-lg font-bold text-secondary-900">Select a subject</h3>
                      <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                        Choose a subject to filter books.
                      </p>
                    </div>
                  ) : availableChapterBooks.length === 0 ? (
                    <div className="text-center py-16 bg-white">
                      <h3 className="text-lg font-bold text-secondary-900">No books found</h3>
                      <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                        No syllabus books exist for this academic year and subject.
                      </p>
                    </div>
                  ) : !String(chapterCurriculumBookId || '').trim() ? (
                    <div className="text-center py-16 bg-white">
                      <h3 className="text-lg font-bold text-secondary-900">Select a book</h3>
                      <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                        Choose a book to add chapters.
                      </p>
                    </div>
                  ) : !canViewChapters ? (
                    <div className="text-center py-16 bg-white">
                      <h3 className="text-lg font-bold text-secondary-900">Access Restricted</h3>
                      <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                        You do not have permission to view chapters.
                      </p>
                    </div>
                  ) : (
                    <>
                      {chapterView === 'list' || divisionTab === 'assign' ? (
                        chaptersLoading ? (
                          <div className="flex justify-center items-center py-12">
                            <LoadingSpinner className="w-8 h-8" />
                            <span className="ml-2 text-gray-500">Loading chapters...</span>
                          </div>
                        ) : chapters.length === 0 ? (
                          <div className="text-center py-16 bg-white">
                            <h3 className="text-lg font-bold text-secondary-900">No chapters found</h3>
                            <p className="mt-1 text-secondary-500 max-w-xs mx-auto font-medium">
                              No chapters exist for this book.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-secondary-200">
                              <thead className="bg-secondary-50/50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Topics
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Order
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Title
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                    Hours
                                  </th>
                                  {divisionTab === 'chapters' && (canEditChapters || canDeleteChapters) && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-secondary-200">
                                {chapters.map((c, idx) => {
                                  const chapterId = c?.chapter_id ?? c?.chapterId ?? c?.id ?? null;
                                  const chapterIdStr = chapterId ? String(chapterId) : '';
                                  const title = String(c?.chapter_title ?? c?.chapterTitle ?? '').trim();
                                  const order = c?.sequence_order ?? c?.sequenceOrder ?? 0;
                                  const hours = c?.default_hours ?? c?.defaultHours ?? '';
                                  const isExpanded = chapterIdStr && expandedChapterId === chapterIdStr;
                                  const topics = chapterIdStr ? topicsByChapterId[chapterIdStr] : undefined;
                                  const topicsLoading = chapterIdStr ? topicsLoadingByChapterId[chapterIdStr] : false;

                                  return (
                                    <React.Fragment key={chapterIdStr ? chapterIdStr : `${idx}`}>
                                      <tr className="hover:bg-secondary-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                          <button
                                            type="button"
                                            onClick={() => toggleChapterExpanded(c)}
                                            className="inline-flex items-center gap-2"
                                            disabled={!chapterIdStr}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="w-4 h-4 text-secondary-600" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-secondary-600" />
                                            )}
                                            <span className="text-secondary-700 font-medium">Topics</span>
                                          </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                          {String(order)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                          {title || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                          {hours === null || hours === undefined || String(hours) === '' ? '—' : String(hours)}
                                        </td>
                                        {divisionTab === 'chapters' && (canEditChapters || canDeleteChapters) && (
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <ActionButtonGroup>
                                              {canEditChapters && (
                                                <EditButton onClick={() => startEditChapter(c)} title="Edit chapter" />
                                              )}
                                              {canDeleteChapters && (
                                                <DeleteButton
                                                  onClick={() => handleDeleteChapter(c)}
                                                  title="Delete chapter"
                                                  confirmMessage={`Are you sure you want to delete ${title || 'this chapter'}?`}
                                                  disabled={chapterActionLoading}
                                                />
                                              )}
                                            </ActionButtonGroup>
                                          </td>
                                        )}
                                      </tr>
                                      {isExpanded && (
                                        <tr>
                                          <td
                                            colSpan={divisionTab === 'chapters' && (canEditChapters || canDeleteChapters) ? 5 : 4}
                                            className="px-6 py-4 bg-secondary-50/30"
                                          >
                                            {!canViewTopics ? (
                                              <div className="text-sm text-secondary-700">
                                                You do not have permission to view topics.
                                              </div>
                                            ) : (
                                              <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                  <div className="font-semibold text-secondary-900">Topics</div>
                                                  {divisionTab === 'chapters' && topicView === 'list' && canCreateTopics && (
                                                    <button
                                                      type="button"
                                                      className="btn-primary"
                                                      onClick={startCreateTopic}
                                                      disabled={topicActionLoading}
                                                    >
                                                      Add Topic
                                                    </button>
                                                  )}
                                                </div>

                                                {topicView === 'list' || divisionTab === 'assign' ? (
                                                  topicsLoading ? (
                                                    <div className="flex items-center">
                                                      <LoadingSpinner className="w-4 h-4" />
                                                      <span className="ml-2 text-gray-500">Loading topics...</span>
                                                    </div>
                                                  ) : !Array.isArray(topics) || topics.length === 0 ? (
                                                    <div className="text-sm text-secondary-700">No topics found.</div>
                                                  ) : (
                                                    <div className="overflow-x-auto bg-white rounded-lg border border-secondary-200">
                                                      <table className="min-w-full divide-y divide-secondary-200">
                                                        <thead className="bg-secondary-50/50">
                                                          <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                              Order
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                              Title
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                              Hours
                                                            </th>
                                                            {divisionTab === 'chapters' && (canEditTopics || canDeleteTopics) && (
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                                Actions
                                                              </th>
                                                            )}
                                                          </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-secondary-200">
                                                          {topics.map((t, tIdx) => {
                                                            const topicId = t?.topic_id ?? t?.topicId ?? t?.id ?? null;
                                                            const topicIdStr = topicId ? String(topicId) : '';
                                                            const tTitle = String(t?.topic_title ?? t?.topicTitle ?? '').trim();
                                                            const tOrder = t?.sequence_order ?? t?.sequenceOrder ?? 0;
                                                            const tHours = t?.default_hours ?? t?.defaultHours ?? '';
                                                            const isTopicExpanded = topicIdStr && expandedTopicId === topicIdStr;
                                                            const subtopics = topicIdStr ? subtopicsByTopicId[topicIdStr] : undefined;
                                                            const subtopicsLoading = topicIdStr ? subtopicsLoadingByTopicId[topicIdStr] : false;

                                                            return (
                                                              <React.Fragment key={topicIdStr ? topicIdStr : `${tIdx}`}>
                                                                <tr className="hover:bg-secondary-50 transition-colors">
                                                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                                                    {String(tOrder)}
                                                                  </td>
                                                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                                                    <button
                                                                      type="button"
                                                                      onClick={() => toggleTopicExpanded(t)}
                                                                      className="inline-flex items-center gap-2"
                                                                      disabled={!topicIdStr}
                                                                    >
                                                                      {isTopicExpanded ? (
                                                                        <ChevronDown className="w-4 h-4 text-secondary-600" />
                                                                      ) : (
                                                                        <ChevronRight className="w-4 h-4 text-secondary-600" />
                                                                      )}
                                                                      <span>{tTitle || '—'}</span>
                                                                    </button>
                                                                  </td>
                                                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                                                    {tHours === null || tHours === undefined || String(tHours) === '' ? '—' : String(tHours)}
                                                                  </td>
                                                                  {divisionTab === 'chapters' && (canEditTopics || canDeleteTopics) && (
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                                                      <ActionButtonGroup>
                                                                        {canEditTopics && (
                                                                          <EditButton onClick={() => startEditTopic(t)} title="Edit topic" />
                                                                        )}
                                                                        {canDeleteTopics && (
                                                                          <DeleteButton
                                                                            onClick={() => handleDeleteTopic(t)}
                                                                            title="Delete topic"
                                                                            confirmMessage={`Are you sure you want to delete ${tTitle || 'this topic'}?`}
                                                                            disabled={topicActionLoading}
                                                                          />
                                                                        )}
                                                                      </ActionButtonGroup>
                                                                    </td>
                                                                  )}
                                                                </tr>
                                                                {isTopicExpanded && (
                                                                  <tr>
                                                                    <td
                                                                      colSpan={divisionTab === 'chapters' && (canEditTopics || canDeleteTopics) ? 4 : 3}
                                                                      className="px-4 py-3 bg-secondary-50/30"
                                                                    >
                                                                      {!canViewSubtopics ? (
                                                                        <div className="text-sm text-secondary-700">
                                                                          You do not have permission to view subtopics.
                                                                        </div>
                                                                      ) : (
                                                                        <div className="space-y-4">
                                                                          <div className="flex items-center justify-between">
                                                                            <div className="font-semibold text-secondary-900">Subtopics</div>
                                                                            {divisionTab === 'chapters' && subtopicView === 'list' && canCreateSubtopics && (
                                                                              <button
                                                                                type="button"
                                                                                className="btn-primary"
                                                                                onClick={startCreateSubtopic}
                                                                                disabled={subtopicActionLoading}
                                                                              >
                                                                                Add Subtopic
                                                                              </button>
                                                                            )}
                                                                          </div>

                                                                          {subtopicView === 'list' || divisionTab === 'assign' ? (
                                                                            subtopicsLoading ? (
                                                                              <div className="flex items-center">
                                                                                <LoadingSpinner className="w-4 h-4" />
                                                                                <span className="ml-2 text-gray-500">Loading subtopics...</span>
                                                                              </div>
                                                                            ) : !Array.isArray(subtopics) || subtopics.length === 0 ? (
                                                                              <div className="text-sm text-secondary-700">No subtopics found.</div>
                                                                            ) : (
                                                                              <div className="overflow-x-auto bg-white rounded-lg border border-secondary-200">
                                                                                <table className="min-w-full divide-y divide-secondary-200">
                                                                                  <thead className="bg-secondary-50/50">
                                                                                    <tr>
                                                                                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                                                        Order
                                                                                      </th>
                                                                                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                                                        Title
                                                                                      </th>
                                                                                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                                                        Hours
                                                                                      </th>
                                                                                      {divisionTab === 'chapters' && (canEditSubtopics || canDeleteSubtopics) && (
                                                                                        <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">
                                                                                          Actions
                                                                                        </th>
                                                                                      )}
                                                                                    </tr>
                                                                                  </thead>
                                                                                  <tbody className="bg-white divide-y divide-secondary-200">
                                                                                    {subtopics.map((s, sIdx) => {
                                                                                      const subtopicId = s?.subtopic_id ?? s?.subtopicId ?? s?.id ?? null;
                                                                                      const sTitle = String(s?.subtopic_title ?? s?.subtopicTitle ?? '').trim();
                                                                                      const sOrder = s?.sequence_order ?? s?.sequenceOrder ?? 0;
                                                                                      const sHours = s?.default_hours ?? s?.defaultHours ?? '';

                                                                                      return (
                                                                                        <tr key={subtopicId ? String(subtopicId) : `${sIdx}`} className="hover:bg-secondary-50 transition-colors">
                                                                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                                                                            {String(sOrder)}
                                                                                          </td>
                                                                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                                                                            {sTitle || '—'}
                                                                                          </td>
                                                                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-700 font-medium">
                                                                                            {sHours === null || sHours === undefined || String(sHours) === '' ? '—' : String(sHours)}
                                                                                          </td>
                                                                                          {divisionTab === 'chapters' && (canEditSubtopics || canDeleteSubtopics) && (
                                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                                                                              <ActionButtonGroup>
                                                                                                {canEditSubtopics && (
                                                                                                  <EditButton onClick={() => startEditSubtopic(s)} title="Edit subtopic" />
                                                                                                )}
                                                                                                {canDeleteSubtopics && (
                                                                                                  <DeleteButton
                                                                                                    onClick={() => handleDeleteSubtopic(s)}
                                                                                                    title="Delete subtopic"
                                                                                                    confirmMessage={`Are you sure you want to delete ${sTitle || 'this subtopic'}?`}
                                                                                                    disabled={subtopicActionLoading}
                                                                                                  />
                                                                                                )}
                                                                                              </ActionButtonGroup>
                                                                                            </td>
                                                                                          )}
                                                                                        </tr>
                                                                                      );
                                                                                    })}
                                                                                  </tbody>
                                                                                </table>
                                                                              </div>
                                                                            )
                                                                          ) : (
                                                                            <div className="bg-white rounded-lg border border-secondary-200">
                                                                              <div className="p-4 sm:p-6">
                                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                                                                  <h3 className="text-lg font-bold text-secondary-900">
                                                                                    {subtopicView === 'create' ? 'Add New Subtopic' : 'Edit Subtopic'}
                                                                                  </h3>
                                                                                  <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                      setSubtopicView('list');
                                                                                      setEditingSubtopicId(null);
                                                                                    }}
                                                                                    className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                                                                                  >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                                                    </svg>
                                                                                    Back to Subtopics
                                                                                  </button>
                                                                                </div>

                                                                                {subtopicActionLoading && (
                                                                                  <div className="mb-6 p-3 bg-primary-50 border-l-4 border-primary-400">
                                                                                    <div className="flex items-center">
                                                                                      <LoadingSpinner className="w-4 h-4 mr-2" />
                                                                                      <p className="text-sm text-primary-700">
                                                                                        {subtopicView === 'create' ? 'Creating subtopic...' : 'Updating subtopic...'}
                                                                                      </p>
                                                                                    </div>
                                                                                  </div>
                                                                                )}

                                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                                  <div className="md:col-span-3">
                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic Title</label>
                                                                                    <input
                                                                                      type="text"
                                                                                      value={subtopicForm.subtopic_title}
                                                                                      onChange={(e) => setSubtopicForm((prev) => ({ ...prev, subtopic_title: e.target.value }))}
                                                                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                      placeholder="Enter subtopic title"
                                                                                    />
                                                                                  </div>

                                                                                  <div className="md:col-span-1">
                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                                                                                    <input
                                                                                      type="number"
                                                                                      value={subtopicForm.sequence_order}
                                                                                      onChange={(e) => setSubtopicForm((prev) => ({ ...prev, sequence_order: e.target.value }))}
                                                                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                      min={0}
                                                                                      step={1}
                                                                                      placeholder="0"
                                                                                    />
                                                                                  </div>

                                                                                  <div className="md:col-span-3">
                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic Description</label>
                                                                                    <textarea
                                                                                      value={subtopicForm.subtopic_description}
                                                                                      onChange={(e) => setSubtopicForm((prev) => ({ ...prev, subtopic_description: e.target.value }))}
                                                                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                      rows={3}
                                                                                      placeholder="Enter subtopic description (optional)"
                                                                                    />
                                                                                  </div>

                                                                                  <div className="md:col-span-1">
                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Hours</label>
                                                                                    <input
                                                                                      type="number"
                                                                                      value={subtopicForm.default_hours}
                                                                                      onChange={(e) => setSubtopicForm((prev) => ({ ...prev, default_hours: e.target.value }))}
                                                                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                      min={0}
                                                                                      step={0.25}
                                                                                      placeholder="0"
                                                                                    />
                                                                                  </div>
                                                                                </div>

                                                                                <div className="mt-6 flex flex-wrap gap-2">
                                                                                  {subtopicView === 'create' ? (
                                                                                    <button
                                                                                      type="button"
                                                                                      className="btn-primary"
                                                                                      onClick={handleCreateSubtopic}
                                                                                      disabled={subtopicActionLoading}
                                                                                    >
                                                                                      Add Subtopic
                                                                                    </button>
                                                                                  ) : (
                                                                                    <button
                                                                                      type="button"
                                                                                      className="btn-primary"
                                                                                      onClick={handleUpdateSubtopic}
                                                                                      disabled={subtopicActionLoading}
                                                                                    >
                                                                                      Update Subtopic
                                                                                    </button>
                                                                                  )}
                                                                                </div>
                                                                              </div>
                                                                            </div>
                                                                          )}
                                                                        </div>
                                                                      )}
                                                                    </td>
                                                                  </tr>
                                                                )}
                                                              </React.Fragment>
                                                            );
                                                          })}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )
                                                ) : (
                                                  <div className="bg-white rounded-lg border border-secondary-200">
                                                    <div className="p-4 sm:p-6">
                                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                                        <h3 className="text-lg font-bold text-secondary-900">
                                                          {topicView === 'create' ? 'Add New Topic' : 'Edit Topic'}
                                                        </h3>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setTopicView('list');
                                                            setEditingTopicId(null);
                                                          }}
                                                          className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                                                        >
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                          </svg>
                                                          Back to Topics
                                                        </button>
                                                      </div>

                                                      {topicActionLoading && (
                                                        <div className="mb-6 p-3 bg-primary-50 border-l-4 border-primary-400">
                                                          <div className="flex items-center">
                                                            <LoadingSpinner className="w-4 h-4 mr-2" />
                                                            <p className="text-sm text-primary-700">
                                                              {topicView === 'create' ? 'Creating topic...' : 'Updating topic...'}
                                                            </p>
                                                          </div>
                                                        </div>
                                                      )}

                                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="md:col-span-3">
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">Topic Title</label>
                                                          <input
                                                            type="text"
                                                            value={topicForm.topic_title}
                                                            onChange={(e) => setTopicForm((prev) => ({ ...prev, topic_title: e.target.value }))}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Enter topic title"
                                                          />
                                                        </div>

                                                        <div className="md:col-span-1">
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                                                          <input
                                                            type="number"
                                                            value={topicForm.sequence_order}
                                                            onChange={(e) => setTopicForm((prev) => ({ ...prev, sequence_order: e.target.value }))}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            min={0}
                                                            step={1}
                                                            placeholder="0"
                                                          />
                                                        </div>

                                                        <div className="md:col-span-3">
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">Topic Description</label>
                                                          <textarea
                                                            value={topicForm.topic_description}
                                                            onChange={(e) => setTopicForm((prev) => ({ ...prev, topic_description: e.target.value }))}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows={3}
                                                            placeholder="Enter topic description (optional)"
                                                          />
                                                        </div>

                                                        <div className="md:col-span-1">
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">Default Hours</label>
                                                          <input
                                                            type="number"
                                                            value={topicForm.default_hours}
                                                            onChange={(e) => setTopicForm((prev) => ({ ...prev, default_hours: e.target.value }))}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            min={0}
                                                            step={0.25}
                                                            placeholder="0"
                                                          />
                                                        </div>
                                                      </div>

                                                      <div className="mt-6 flex flex-wrap gap-2">
                                                        {topicView === 'create' ? (
                                                          <button
                                                            type="button"
                                                            className="btn-primary"
                                                            onClick={handleCreateTopic}
                                                            disabled={topicActionLoading}
                                                          >
                                                            Add Topic
                                                          </button>
                                                        ) : (
                                                          <button
                                                            type="button"
                                                            className="btn-primary"
                                                            onClick={handleUpdateTopic}
                                                            disabled={topicActionLoading}
                                                          >
                                                            Update Topic
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : (
                        <div className="max-w-4xl">
                          <Card>
                            <div className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-secondary-900">
                                  {chapterView === 'create' ? 'Add New Chapter' : 'Edit Chapter'}
                                </h2>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChapterView('list');
                                    setEditingChapterId(null);
                                  }}
                                  className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                  </svg>
                                  Back to List
                                </button>
                              </div>

                              {chapterActionLoading && (
                                <div className="mb-6 p-3 bg-primary-50 border-l-4 border-primary-400">
                                  <div className="flex items-center">
                                    <LoadingSpinner className="w-4 h-4 mr-2" />
                                    <p className="text-sm text-primary-700">
                                      {chapterView === 'create' ? 'Creating chapter...' : 'Updating chapter...'}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Title</label>
                                  <input
                                    type="text"
                                    value={chapterForm.chapter_title}
                                    onChange={(e) => setChapterForm((prev) => ({ ...prev, chapter_title: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter chapter title"
                                  />
                                </div>

                                <div className="md:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                                  <input
                                    type="number"
                                    value={chapterForm.sequence_order}
                                    onChange={(e) => setChapterForm((prev) => ({ ...prev, sequence_order: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={0}
                                    step={1}
                                    placeholder="0"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Description</label>
                                  <textarea
                                    value={chapterForm.chapter_description}
                                    onChange={(e) => setChapterForm((prev) => ({ ...prev, chapter_description: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter chapter description (optional)"
                                  />
                                </div>

                                <div className="md:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Hours</label>
                                  <input
                                    type="number"
                                    value={chapterForm.default_hours}
                                    onChange={(e) => setChapterForm((prev) => ({ ...prev, default_hours: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={0}
                                    step={0.25}
                                    placeholder="0"
                                  />
                                </div>
                              </div>

                              <div className="mt-6 flex flex-wrap gap-2">
                                {chapterView === 'create' ? (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleCreateChapter}
                                    disabled={chapterActionLoading}
                                  >
                                    Add Chapter
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleUpdateChapter}
                                    disabled={chapterActionLoading}
                                  >
                                    Update Chapter
                                  </button>
                                )}
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}

                      {divisionTab === 'assign' && (
                        <div className="border-t border-secondary-200 pt-6">
                          <div className="max-w-4xl">
                            <Card>
                              <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                  <h2 className="text-xl font-bold text-secondary-900">Class & Sections</h2>
                                  {canCreatePlan && (
                                    <button
                                      type="button"
                                      className="btn-primary"
                                      onClick={handleCreatePlan}
                                      disabled={
                                        assignPlanLoading ||
                                        !String(chapterAcademicYearId || '').trim() ||
                                        !String(chapterSubjectId || '').trim() ||
                                        !String(chapterCurriculumBookId || '').trim() ||
                                        assignSelectedSectionIds.length === 0
                                      }
                                    >
                                      {assignPlanLoading ? 'Creating Plan...' : 'Create Plan'}
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                    <select
                                      value={assignClassId}
                                      onChange={(e) => setAssignClassId(e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      disabled={assignClassesLoading || !String(chapterAcademicYearId || '').trim()}
                                    >
                                      <option value="">Select Class</option>
                                      {assignClasses.map((cls) => (
                                        <option key={String(cls.class_id ?? cls.classId ?? cls.id)} value={String(cls.class_id ?? cls.classId ?? cls.id)}>
                                          {String(cls.class_name ?? cls.className ?? cls.name ?? cls.class_level ?? '').trim() || '—'}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="mt-6">
                                  {!String(chapterAcademicYearId || '').trim() ? (
                                    <div className="text-sm text-secondary-700">Select Academic Year above to load classes and sections.</div>
                                  ) : assignClassesLoading ? (
                                    <div className="flex items-center">
                                      <LoadingSpinner className="w-4 h-4" />
                                      <span className="ml-2 text-gray-500">Loading classes...</span>
                                    </div>
                                  ) : !String(assignClassId || '').trim() ? (
                                    <div className="text-sm text-secondary-700">Select a class to view sections.</div>
                                  ) : assignSectionsLoading ? (
                                    <div className="flex items-center">
                                      <LoadingSpinner className="w-4 h-4" />
                                      <span className="ml-2 text-gray-500">Loading sections...</span>
                                    </div>
                                  ) : assignSections.length === 0 ? (
                                    <div className="text-sm text-secondary-700">No sections found for the selected class.</div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {assignSections.map((sec) => {
                                        const sectionId = String(sec.section_id ?? sec.sectionId ?? sec.id);
                                        const checked = assignSelectedSectionIds.includes(sectionId);
                                        const label = String(sec.section_name ?? sec.sectionName ?? sec.name ?? '').trim() || '—';
                                        return (
                                          <label
                                            key={sectionId}
                                            className="flex items-center gap-2 p-3 bg-white rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() => {
                                                setAssignSelectedSectionIds((prev) => {
                                                  if (prev.includes(sectionId)) return prev.filter((x) => x !== sectionId);
                                                  return [...prev, sectionId];
                                                });
                                              }}
                                            />
                                            <span className="text-sm font-medium text-secondary-900">{label}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const SyllabusProgress = ({ academicYears, subjects, formData }) => {
  const selectedAcademicYear = useMemo(() => {
    if (!formData.academic_year_id) return null;
    return academicYears.find((y) => String(y.academic_year_id) === String(formData.academic_year_id)) || null;
  }, [academicYears, formData.academic_year_id]);

  const selectedSubject = useMemo(() => {
    if (!formData.subject_id) return null;
    return subjects.find((s) => String(s.subject_id) === String(formData.subject_id)) || null;
  }, [subjects, formData.subject_id]);

  return (
    <Card>
      <div className="p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Syllabus Progress</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-1">Selected</div>
            <div className="text-sm text-gray-800">
              {(selectedAcademicYear && `${selectedAcademicYear.year_name} (${selectedAcademicYear.curriculum_code} - ${selectedAcademicYear.medium})`) || 'Academic Year: —'}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              {(selectedSubject && `Subject: ${selectedSubject.subject_name}`) || 'Subject: —'}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              {formData.book_name ? `Book: ${formData.book_name}` : 'Book: —'}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              {String(formData.version ?? '').trim() !== '' ? `Version: ${formData.version}` : 'Version: —'}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Progress</div>
            <div className="text-sm text-gray-600">Select academic year and subject to view syllabus progress.</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function SyllabusPage() {
  const { getCampusId, getCampusName, getDefaultAcademicYearId, hasPermission } = useAuth();
  const campusId = getCampusId();
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [progressTab, setProgressTab] = useState(null);

  const [formData, setFormData] = useState({
    academic_year_id: '',
    subject_id: '',
    book_name: '',
    version: ''
  });

  const canCreateCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_CREATE);
  const canEditCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_EDIT);
  const canDeleteCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_DELETE);
  const canViewCourse = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_BOOK_LIST_READ);
  const canCreateChapters = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_CHAPTER_CREATE);
  const canEditChapters = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_CHAPTER_EDIT);
  const canDeleteChapters = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_CHAPTER_DELETE);
  const canViewChapters = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_CHAPTER_LIST_READ);
  const canCreateTopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_TOPIC_CREATE);
  const canEditTopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_TOPIC_EDIT);
  const canDeleteTopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_TOPIC_DELETE);
  const canViewTopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_TOPIC_LIST_READ);
  const canCreateSubtopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_SUBTOPIC_CREATE);
  const canEditSubtopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_SUBTOPIC_EDIT);
  const canDeleteSubtopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_SUBTOPIC_DELETE);
  const canViewSubtopics = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_SUBTOPIC_LIST_READ);
  const canCreatePlan = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_PLAN_CREATE);

  useEffect(() => {
    if (activeTab !== 'progress') setProgressTab(null);
  }, [activeTab]);

  const renderAccessDenied = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-secondary-900 mb-2">Access Restricted</h3>
          <p className="text-secondary-600 mb-4">
            You do not have permission to access syllabus content. Only users with syllabus permissions can view or manage syllabus content.
          </p>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const defAy = getDefaultAcademicYearId();
    if (defAy && String(formData.academic_year_id || '') === '') {
      setFormData((prev) => ({ ...prev, academic_year_id: String(defAy) }));
    }
  }, [getDefaultAcademicYearId, formData.academic_year_id]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        if (!canViewCourse && !canCreateCourse && !canEditCourse && !canDeleteCourse && !canViewChapters && !canCreateChapters && !canEditChapters && !canDeleteChapters && !canViewTopics && !canCreateTopics && !canEditTopics && !canDeleteTopics && !canViewSubtopics && !canCreateSubtopics && !canEditSubtopics && !canDeleteSubtopics) {
          setAcademicYears([]);
          setSubjects([]);
          return;
        }

        const campusId = getCampusId();
        if (!campusId) {
          setAcademicYears([]);
          setSubjects([]);
          return;
        }

        setLoading(true);

        const [ayRes, subjectRes] = await Promise.all([
          studentService.getFilterOptions(),
          subjectService.getAllSubjects(campusId)
        ]);

        if (ayRes?.success) {
          setAcademicYears(ayRes.data?.academic_years || []);
        } else {
          setAcademicYears([]);
        }

        if (subjectRes?.success) {
          setSubjects(subjectRes.data?.subjects || []);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error loading syllabus dropdowns:', error);
        toast.error(error?.message || 'Failed to load dropdown values');
      } finally {
        setLoading(false);
      }
    };

    fetchDropdowns();
  }, [getCampusId, canViewCourse, canCreateCourse, canEditCourse, canDeleteCourse, canViewChapters, canCreateChapters, canEditChapters, canDeleteChapters, canViewTopics, canCreateTopics, canEditTopics, canDeleteTopics, canViewSubtopics, canCreateSubtopics, canEditSubtopics, canDeleteSubtopics]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Syllabus</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Campus: {getCampusName()}</p>
        </div>
      </div>

      {!canViewCourse && !canCreateCourse && !canEditCourse && !canDeleteCourse && !canViewChapters && !canCreateChapters && !canEditChapters && !canDeleteChapters && !canViewTopics && !canCreateTopics && !canEditTopics && !canDeleteTopics && !canViewSubtopics && !canCreateSubtopics && !canEditSubtopics && !canDeleteSubtopics ? (
        renderAccessDenied()
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {activeTab === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <Card hover onClick={() => setActiveTab('division')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Syllabus Division</h2>
                  <p className="text-secondary-600">Academic year, subject, book name, and version</p>
                </div>
              </Card>

              <Card hover onClick={() => setActiveTab('progress')} className="transition-shadow">
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">Syllabus Progress</h2>
                  <p className="text-secondary-600">Track progress for the selected syllabus</p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-w-4xl">
                <button type="button" onClick={() => setActiveTab(null)} className="btn-secondary">
                  Back
                </button>
              </div>
              {activeTab === 'division' ? (
                <SyllabusDivision
                  campusId={campusId}
                  academicYears={academicYears}
                  subjects={subjects}
                  formData={formData}
                  setFormData={setFormData}
                  canViewCourse={canViewCourse}
                  canCreateCourse={canCreateCourse}
                  canEditCourse={canEditCourse}
                  canDeleteCourse={canDeleteCourse}
                  canViewChapters={canViewChapters}
                  canCreateChapters={canCreateChapters}
                  canEditChapters={canEditChapters}
                  canDeleteChapters={canDeleteChapters}
                  canViewTopics={canViewTopics}
                  canCreateTopics={canCreateTopics}
                  canEditTopics={canEditTopics}
                  canDeleteTopics={canDeleteTopics}
                  canViewSubtopics={canViewSubtopics}
                  canCreateSubtopics={canCreateSubtopics}
                  canEditSubtopics={canEditSubtopics}
                  canDeleteSubtopics={canDeleteSubtopics}
                  canCreatePlan={canCreatePlan}
                />
              ) : (
                <div className="space-y-4">
                  {progressTab === null ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                      <Card hover onClick={() => setProgressTab('plan')} className="transition-shadow">
                        <div className="p-8 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <TrendingUp className="w-8 h-8 text-primary-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Syllabus Progress</h2>
                          <p className="text-secondary-600">View and edit planned syllabus schedule</p>
                        </div>
                      </Card>

                      <Card hover onClick={() => setProgressTab('updater')} className="transition-shadow">
                        <div className="p-8 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <ListOrdered className="w-8 h-8 text-primary-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Syllabus Progress Updater</h2>
                          <p className="text-secondary-600">Update actual hours and dates</p>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-w-5xl flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {progressTab === 'plan' ? 'Syllabus Progress' : 'Syllabus Progress Updater'}
                        </h2>
                        <button type="button" onClick={() => setProgressTab(null)} className="btn-secondary">
                          Back
                        </button>
                      </div>
                      {progressTab === 'plan' ? (
                        <SyllabusProgressDetailsPage academicYears={academicYears} subjects={subjects} />
                      ) : (
                        <SyllabusProgressUpdaterPage academicYears={academicYears} subjects={subjects} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
