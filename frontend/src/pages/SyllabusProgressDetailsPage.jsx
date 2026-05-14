import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import { academicService } from '../services/academicService';
import { sectionService } from '../services/sectionService';
import syllabusBookService, { syllabusChapterService, syllabusPlanService, syllabusSubtopicService, syllabusTopicService } from '../services/syllabusBookService';

const toNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
};

const normalizeDateInput = (value) => {
  const str = String(value ?? '').trim();
  return str;
};

const toDateOrNull = (value) => {
  const str = String(value ?? '').trim();
  if (!str) return null;
  const d = new Date(`${str}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const diffHoursInclusiveUTC = (startDateStr, endDateStr) => {
  const start = toDateOrNull(startDateStr);
  const end = toDateOrNull(endDateStr);
  if (!start || !end) return null;
  const startMs = start.getTime();
  const endMs = end.getTime();
  const diffDays = Math.floor((endMs - startMs) / 86400000) + 1;
  if (!Number.isFinite(diffDays)) return null;
  return diffDays * 24;
};

const buildPlanMapsFromPlanTree = (planTree) => {
  const chapterMap = {};
  const topicMap = {};
  const subtopicMap = {};

  const chapters = Array.isArray(planTree) ? planTree : [];
  chapters.forEach((ch) => {
    const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
    const chapterIdStr = String(chapterId || '').trim();
    if (!chapterIdStr) return;
    chapterMap[chapterIdStr] = {
      planned_hours: ch?.planned_hours ?? ch?.plannedHours ?? null,
      planned_start_date: ch?.planned_start_date ?? ch?.plannedStartDate ?? null,
      planned_end_date: ch?.planned_end_date ?? ch?.plannedEndDate ?? null
    };

    const topics = Array.isArray(ch?.topics) ? ch.topics : [];
    topics.forEach((tp) => {
      const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
      const topicIdStr = String(topicId || '').trim();
      if (!topicIdStr) return;
      topicMap[topicIdStr] = {
        planned_hours: tp?.planned_hours ?? tp?.plannedHours ?? null,
        planned_start_date: tp?.planned_start_date ?? tp?.plannedStartDate ?? null,
        planned_end_date: tp?.planned_end_date ?? tp?.plannedEndDate ?? null
      };

      const subtopics = Array.isArray(tp?.subtopics) ? tp.subtopics : [];
      subtopics.forEach((st) => {
        const subtopicId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
        const subtopicIdStr = String(subtopicId || '').trim();
        if (!subtopicIdStr) return;
        subtopicMap[subtopicIdStr] = {
          planned_hours: st?.planned_hours ?? st?.plannedHours ?? null,
          planned_start_date: st?.planned_start_date ?? st?.plannedStartDate ?? null,
          planned_end_date: st?.planned_end_date ?? st?.plannedEndDate ?? null
        };
      });
    });
  });

  return { chapterMap, topicMap, subtopicMap };
};

const buildPlanMapsFromPlans = (plans) => {
  const chapterMap = {};
  const topicMap = {};
  const subtopicMap = {};

  (Array.isArray(plans) ? plans : []).forEach((row) => {
    const planId = row?.plan_id ?? row?.planId ?? null;
    const chapterId = row?.chapter_id ?? row?.chapterId ?? null;
    const topicId = row?.topic_id ?? row?.topicId ?? null;
    const subtopicId = row?.subtopic_id ?? row?.subtopicId ?? null;

    const meta = {
      plan_id: planId,
      planned_hours: row?.planned_hours ?? row?.plannedHours ?? null,
      planned_start_date: row?.planned_start_date ?? row?.plannedStartDate ?? null,
      planned_end_date: row?.planned_end_date ?? row?.plannedEndDate ?? null,
      actual_hours: row?.actual_hours ?? row?.actualHours ?? null,
      actual_start_date: row?.actual_start_date ?? row?.actualStartDate ?? null,
      actual_end_date: row?.actual_end_date ?? row?.actualEndDate ?? null
    };

    if (chapterId != null && topicId == null && subtopicId == null) {
      chapterMap[String(chapterId)] = meta;
      return;
    }
    if (topicId != null && subtopicId == null) {
      topicMap[String(topicId)] = meta;
      return;
    }
    if (subtopicId != null) {
      subtopicMap[String(subtopicId)] = meta;
    }
  });

  return { chapterMap, topicMap, subtopicMap };
};

export default function SyllabusProgressDetailsPage({ academicYears, subjects }) {
  const { hasPermission, getCampusId } = useAuth();
  const campusId = getCampusId();
  const canViewPlans = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_PLAN_LIST_READ);
  const canCreatePlans = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_PLAN_CREATE);

  const [academicYearId, setAcademicYearId] = useState('');
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [subjectId, setSubjectId] = useState('');
  const [bookId, setBookId] = useState('');
  const [booksLoading, setBooksLoading] = useState(false);
  const [books, setBooks] = useState([]);

  const [classesLoading, setClassesLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');

  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');

  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [expandedChapterId, setExpandedChapterId] = useState(null);
  const [topicsByChapterId, setTopicsByChapterId] = useState({});
  const [topicsLoadingByChapterId, setTopicsLoadingByChapterId] = useState({});
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [subtopicsByTopicId, setSubtopicsByTopicId] = useState({});
  const [subtopicsLoadingByTopicId, setSubtopicsLoadingByTopicId] = useState({});

  const [planLoading, setPlanLoading] = useState(false);
  const [planRows, setPlanRows] = useState([]);
  const [planMaps, setPlanMaps] = useState({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
  const [chapterEdits, setChapterEdits] = useState({});
  const [topicEdits, setTopicEdits] = useState({});
  const [subtopicEdits, setSubtopicEdits] = useState({});
  const [planSaveLoading, setPlanSaveLoading] = useState(false);
  const [planEditMode, setPlanEditMode] = useState(false);

  const isEmptyEdit = (edit) => {
    const e = edit || {};
    return (
      String(e.planned_hours ?? '').trim() === '' &&
      String(e.planned_start_date ?? '').trim() === '' &&
      String(e.planned_end_date ?? '').trim() === ''
    );
  };

  const selectedSubjectName = useMemo(() => {
    const s = (subjects || []).find((x) => String(x?.subject_id) === String(subjectId));
    return String(s?.subject_name || '').trim();
  }, [subjects, subjectId]);

  useEffect(() => {
    setPlanEditMode(false);
  }, [academicYearId, subjectId, bookId, classId, sectionId]);

  useEffect(() => {
    const ayId = String(academicYearId || '').trim();
    if (!ayId) {
      setSelectedCurriculumId(null);
      return;
    }

    const selectedYear = (academicYears || []).find((y) => String(y?.academic_year_id) === ayId) || null;
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
        const res = await academicService.getAcademicYearById(campusId, ayId);
        const ay = res?.data || res;
        const cid = ay?.curriculum_id ?? ay?.curriculumId ?? null;
        setSelectedCurriculumId(cid ? String(cid) : null);
      } catch (error) {
        console.error('Error fetching academic year details:', error);
        setSelectedCurriculumId(null);
      }
    };

    fetchAcademicYearDetails();
  }, [academicYears, campusId, academicYearId]);

  const filteredSubjects = useMemo(() => {
    if (!selectedCurriculumId) return subjects || [];
    return (subjects || []).filter((s) => {
      const cid = s?.curriculum_id ?? s?.curriculumId ?? null;
      return cid !== null && String(cid) === String(selectedCurriculumId);
    });
  }, [subjects, selectedCurriculumId]);

  useEffect(() => {
    const ayId = String(academicYearId || '').trim();
    if (!ayId) {
      setSubjectId('');
      setBookId('');
      return;
    }
    const sid = String(subjectId || '').trim();
    if (!sid) return;
    const exists = (filteredSubjects || []).some((s) => String(s?.subject_id) === sid);
    if (!exists) {
      setSubjectId('');
      setBookId('');
    }
  }, [academicYearId, filteredSubjects, subjectId]);

  const availableBooks = useMemo(() => {
    const sid = String(subjectId || '').trim();
    if (!sid) return [];
    return (books || []).filter((b) => {
      const bSubjectId = b?.subject_id ?? b?.subjectId ?? null;
      if (bSubjectId != null && String(bSubjectId) === sid) return true;
      const bSubjectName = String(b?.subject_name ?? b?.subjectName ?? '').trim();
      return !!selectedSubjectName && bSubjectName === selectedSubjectName;
    });
  }, [books, subjectId, selectedSubjectName]);

  useEffect(() => {
    const ayIdStr = String(academicYearId || '').trim();
    if (!ayIdStr) {
      setBooks([]);
      return;
    }
    const ayId = Number.parseInt(ayIdStr, 10);
    if (!Number.isInteger(ayId) || ayId < 1) {
      setBooks([]);
      return;
    }

    const loadBooks = async () => {
      try {
        setBooksLoading(true);
        const response = await syllabusBookService.getBooks({ academic_year_id: ayId });
        const rows = response?.data?.books || response?.data || response?.books || [];
        setBooks(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error('Failed to load books:', error);
        toast.error(error?.message || 'Failed to load books');
        setBooks([]);
      } finally {
        setBooksLoading(false);
      }
    };

    loadBooks();
  }, [academicYearId]);

  useEffect(() => {
    if (classes.length > 0) return;
    const loadClasses = async () => {
      try {
        setClassesLoading(true);
        const res = await sectionService.getFilterOptions();
        const rows = res?.success ? (res.data?.classes || []) : [];
        setClasses(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error('Failed to load classes:', error);
        setClasses([]);
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, [classes.length]);

  useEffect(() => {
    setBookId('');
    setChapters([]);
    setExpandedChapterId(null);
    setExpandedTopicId(null);
    setTopicsByChapterId({});
    setTopicsLoadingByChapterId({});
    setSubtopicsByTopicId({});
    setSubtopicsLoadingByTopicId({});
    setPlanRows([]);
    setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
    setChapterEdits({});
    setTopicEdits({});
    setSubtopicEdits({});
  }, [academicYearId, subjectId]);

  useEffect(() => {
    if (!String(bookId || '').trim()) return;
    setExpandedChapterId(null);
    setExpandedTopicId(null);
    setTopicsByChapterId({});
    setTopicsLoadingByChapterId({});
    setSubtopicsByTopicId({});
    setSubtopicsLoadingByTopicId({});
    setChapterEdits({});
    setTopicEdits({});
    setSubtopicEdits({});
  }, [bookId]);

  useEffect(() => {
    if (!String(sectionId || '').trim()) return;
    setPlanRows([]);
    setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
    setChapterEdits({});
    setTopicEdits({});
    setSubtopicEdits({});
  }, [sectionId]);

  useEffect(() => {
    setSectionId('');
    setSections([]);
  }, [classId]);

  useEffect(() => {
    if (!String(classId || '').trim()) {
      setSections([]);
      return;
    }

    const loadSections = async () => {
      try {
        setSectionsLoading(true);
        const response = await sectionService.getAllSections({ class_id: classId });
        const list =
          (response?.success && Array.isArray(response.data) && response.data) ||
          (Array.isArray(response?.data?.sections) && response.data.sections) ||
          (Array.isArray(response) && response) ||
          (Array.isArray(response?.data) && response.data) ||
          (Array.isArray(response?.sections) && response.sections) ||
          [];
        setSections(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Failed to load sections:', error);
        setSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadSections();
  }, [classId]);

  useEffect(() => {
    if (!String(bookId || '').trim()) {
      setChapters([]);
      return;
    }

    const loadChapters = async () => {
      try {
        setChaptersLoading(true);
        const response = await syllabusChapterService.getChapters({ curriculum_book_id: bookId });
        const rows = response?.data?.chapters || response?.data || response?.chapters || [];
        setChapters(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error('Failed to load chapters:', error);
        toast.error(error?.message || 'Failed to load chapters');
        setChapters([]);
      } finally {
        setChaptersLoading(false);
      }
    };

    loadChapters();
  }, [bookId]);

  useEffect(() => {
    if (!String(bookId || '').trim()) return;
    if (!Array.isArray(chapters) || chapters.length === 0) return;
    const loadAllTopics = async () => {
      await Promise.all(
        chapters.map(async (ch) => {
          const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
          const chapterIdStr = String(chapterId || '').trim();
          if (!chapterIdStr) return;
          if (topicsByChapterId[chapterIdStr] !== undefined) return;
          await fetchTopicsForChapter(chapterIdStr);
        })
      );
    };
    loadAllTopics();
  }, [bookId, chapters]);

  useEffect(() => {
    const topicIds = Object.values(topicsByChapterId || {})
      .flatMap((arr) => (Array.isArray(arr) ? arr : []))
      .map((tp) => tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null)
      .map((id) => String(id || '').trim())
      .filter(Boolean);
    if (topicIds.length === 0) return;

    const loadAllSubtopics = async () => {
      await Promise.all(
        topicIds.map(async (topicIdStr) => {
          if (subtopicsByTopicId[topicIdStr] !== undefined) return;
          await fetchSubtopicsForTopic(topicIdStr);
        })
      );
    };
    loadAllSubtopics();
  }, [topicsByChapterId]);

  useEffect(() => {
    if (!canViewPlans) return;
    const ay = toNumberOrNull(academicYearId);
    const sid = toNumberOrNull(sectionId);
    const subjectName = String(selectedSubjectName || '').trim();
    if (!ay || !sid || !subjectName) {
      setPlanRows([]);
      setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
      return;
    }

    const loadPlans = async () => {
      try {
        setPlanLoading(true);
        const response = await syllabusPlanService.getPlans({
          academic_year_id: ay,
          section_id: sid,
          subject_name: subjectName
        });

        const data = response?.data ?? response;
        const plans = data?.plans || [];
        const normalizedPlans = Array.isArray(plans) ? plans : [];
        setPlanRows(normalizedPlans);

        setPlanMaps(buildPlanMapsFromPlans(normalizedPlans));
      } catch (error) {
        console.error('Failed to load plans:', error);
        toast.error(error?.message || 'Failed to load plan');
        setPlanRows([]);
        setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlans();
  }, [canViewPlans, academicYearId, sectionId, selectedSubjectName]);

  useEffect(() => {
    if (!Array.isArray(chapters) || chapters.length === 0) return;
    setChapterEdits((prev) => {
      const next = { ...prev };
      chapters.forEach((ch) => {
        const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
        const chapterIdStr = String(chapterId || '').trim();
        if (!chapterIdStr) return;
        const meta = planMaps.chapterMap?.[chapterIdStr] || {};
        const existing = next[chapterIdStr];
        const incoming = {
          planned_hours: meta?.planned_hours ?? '',
          planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
          planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
        };
        if (planEditMode) {
          if (!existing) next[chapterIdStr] = incoming;
        } else if (!existing || isEmptyEdit(existing) || !isEmptyEdit(incoming)) {
          next[chapterIdStr] = incoming;
        }
      });
      return next;
    });
  }, [chapters, planMaps, planEditMode]);

  useEffect(() => {
    const topicRows = Object.values(topicsByChapterId || {}).flatMap((arr) => (Array.isArray(arr) ? arr : []));
    if (topicRows.length === 0) return;
    setTopicEdits((prev) => {
      const next = { ...prev };
      topicRows.forEach((tp) => {
        const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
        const topicIdStr = String(topicId || '').trim();
        if (!topicIdStr) return;
        const meta = planMaps.topicMap?.[topicIdStr] || {};
        const existing = next[topicIdStr];
        const incoming = {
          planned_hours: meta?.planned_hours ?? '',
          planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
          planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
        };
        if (planEditMode) {
          if (!existing) next[topicIdStr] = incoming;
        } else if (!existing || isEmptyEdit(existing) || !isEmptyEdit(incoming)) {
          next[topicIdStr] = incoming;
        }
      });
      return next;
    });
  }, [topicsByChapterId, planMaps, planEditMode]);

  useEffect(() => {
    const subRows = Object.values(subtopicsByTopicId || {}).flatMap((arr) => (Array.isArray(arr) ? arr : []));
    if (subRows.length === 0) return;
    setSubtopicEdits((prev) => {
      const next = { ...prev };
      subRows.forEach((st) => {
        const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
        const subIdStr = String(subId || '').trim();
        if (!subIdStr) return;
        const meta = planMaps.subtopicMap?.[subIdStr] || {};
        const existing = next[subIdStr];
        const incoming = {
          planned_hours: meta?.planned_hours ?? '',
          planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
          planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
        };
        if (planEditMode) {
          if (!existing) next[subIdStr] = incoming;
        } else if (!existing || isEmptyEdit(existing) || !isEmptyEdit(incoming)) {
          next[subIdStr] = incoming;
        }
      });
      return next;
    });
  }, [subtopicsByTopicId, planMaps, planEditMode]);

  const fetchTopicsForChapter = async (chapterId) => {
    const chapterIdStr = String(chapterId || '').trim();
    if (!chapterIdStr) return;
    try {
      setTopicsLoadingByChapterId((prev) => ({ ...prev, [chapterIdStr]: true }));
      const response = await syllabusTopicService.getTopics(chapterIdStr);
      const rows = response?.data?.topics || response?.data || response?.topics || [];
      setTopicsByChapterId((prev) => ({ ...prev, [chapterIdStr]: Array.isArray(rows) ? rows : [] }));
    } catch (error) {
      console.error('Failed to load topics:', error);
      setTopicsByChapterId((prev) => ({ ...prev, [chapterIdStr]: [] }));
    } finally {
      setTopicsLoadingByChapterId((prev) => ({ ...prev, [chapterIdStr]: false }));
    }
  };

  const fetchSubtopicsForTopic = async (topicId) => {
    const topicIdStr = String(topicId || '').trim();
    if (!topicIdStr) return;
    try {
      setSubtopicsLoadingByTopicId((prev) => ({ ...prev, [topicIdStr]: true }));
      const response = await syllabusSubtopicService.getSubtopics(topicIdStr);
      const rows = response?.data?.subtopics || response?.data || response?.subtopics || [];
      setSubtopicsByTopicId((prev) => ({ ...prev, [topicIdStr]: Array.isArray(rows) ? rows : [] }));
    } catch (error) {
      console.error('Failed to load subtopics:', error);
      setSubtopicsByTopicId((prev) => ({ ...prev, [topicIdStr]: [] }));
    } finally {
      setSubtopicsLoadingByTopicId((prev) => ({ ...prev, [topicIdStr]: false }));
    }
  };

  const toggleChapterExpanded = async (chapter) => {
    const chapterId = chapter?.chapter_id ?? chapter?.chapterId ?? chapter?.id ?? null;
    const chapterIdStr = String(chapterId || '').trim();
    if (!chapterIdStr) return;
    const next = expandedChapterId === chapterIdStr ? null : chapterIdStr;
    setExpandedChapterId(next);
    setExpandedTopicId(null);
    if (next && topicsByChapterId[chapterIdStr] === undefined) {
      await fetchTopicsForChapter(chapterIdStr);
    }
  };

  const toggleTopicExpanded = async (topic) => {
    const topicId = topic?.topic_id ?? topic?.topicId ?? topic?.id ?? null;
    const topicIdStr = String(topicId || '').trim();
    if (!topicIdStr) return;
    const next = expandedTopicId === topicIdStr ? null : topicIdStr;
    setExpandedTopicId(next);
    if (next && subtopicsByTopicId[topicIdStr] === undefined) {
      await fetchSubtopicsForTopic(topicIdStr);
    }
  };

  const getChapterEdit = (chapterIdStr) => {
    const existing = chapterEdits?.[chapterIdStr];
    if (existing) return existing;
    const meta = planMaps.chapterMap?.[chapterIdStr] || {};
    return {
      planned_hours: meta?.planned_hours ?? '',
      planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
      planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
    };
  };

  const getTopicEdit = (topicIdStr) => {
    const existing = topicEdits?.[topicIdStr];
    if (existing) return existing;
    const meta = planMaps.topicMap?.[topicIdStr] || {};
    return {
      planned_hours: meta?.planned_hours ?? '',
      planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
      planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
    };
  };

  const getSubtopicEdit = (subtopicIdStr) => {
    const existing = subtopicEdits?.[subtopicIdStr];
    if (existing) return existing;
    const meta = planMaps.subtopicMap?.[subtopicIdStr] || {};
    return {
      planned_hours: meta?.planned_hours ?? '',
      planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
      planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
    };
  };

  const formatDate = (d) => (d ? d.toISOString().slice(0, 10) : '');

  const minDateFromStrings = (values) => {
    const dates = (values || []).map(toDateOrNull).filter(Boolean);
    if (dates.length === 0) return '';
    const min = dates.reduce((acc, cur) => (cur.getTime() < acc.getTime() ? cur : acc), dates[0]);
    return formatDate(min);
  };

  const maxDateFromStrings = (values) => {
    const dates = (values || []).map(toDateOrNull).filter(Boolean);
    if (dates.length === 0) return '';
    const max = dates.reduce((acc, cur) => (cur.getTime() > acc.getTime() ? cur : acc), dates[0]);
    return formatDate(max);
  };

  const computeSubtopicMeta = (subIdStr) => {
    const edit = getSubtopicEdit(subIdStr);
    return {
      planned_hours: toNumberOrNull(edit.planned_hours),
      planned_start_date: normalizeDateInput(edit.planned_start_date),
      planned_end_date: normalizeDateInput(edit.planned_end_date)
    };
  };

  const computeTopicMeta = (topicIdStr) => {
    const subRows = subtopicsByTopicId?.[topicIdStr];
    if (Array.isArray(subRows) && subRows.length > 0) {
      const subMetas = subRows
        .map((st) => st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .map((sid) => computeSubtopicMeta(sid));

      const hours = subMetas.reduce((sum, m) => sum + (toNumberOrNull(m.planned_hours) || 0), 0);
      const start = minDateFromStrings(subMetas.map((m) => m.planned_start_date).filter(Boolean));
      const end = maxDateFromStrings(subMetas.map((m) => m.planned_end_date).filter(Boolean));

      return { planned_hours: hours, planned_start_date: start, planned_end_date: end, derived: true };
    }

    const edit = getTopicEdit(topicIdStr);
    return {
      planned_hours: toNumberOrNull(edit.planned_hours),
      planned_start_date: normalizeDateInput(edit.planned_start_date),
      planned_end_date: normalizeDateInput(edit.planned_end_date),
      derived: false
    };
  };

  const computeChapterMeta = (chapterIdStr) => {
    const tpRows = topicsByChapterId?.[chapterIdStr];
    if (Array.isArray(tpRows) && tpRows.length > 0) {
      const topicMetas = tpRows
        .map((tp) => tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .map((tid) => computeTopicMeta(tid));

      const hours = topicMetas.reduce((sum, m) => sum + (toNumberOrNull(m.planned_hours) || 0), 0);
      const start = minDateFromStrings(topicMetas.map((m) => m.planned_start_date).filter(Boolean));
      const end = maxDateFromStrings(topicMetas.map((m) => m.planned_end_date).filter(Boolean));

      return { planned_hours: hours, planned_start_date: start, planned_end_date: end, derived: true };
    }

    const edit = getChapterEdit(chapterIdStr);
    return {
      planned_hours: toNumberOrNull(edit.planned_hours),
      planned_start_date: normalizeDateInput(edit.planned_start_date),
      planned_end_date: normalizeDateInput(edit.planned_end_date),
      derived: false
    };
  };

  const resetEditsToCurrentPlan = () => {
    const nextChapters = {};
    (Array.isArray(chapters) ? chapters : []).forEach((ch) => {
      const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
      const chapterIdStr = String(chapterId || '').trim();
      if (!chapterIdStr) return;
      const meta = planMaps.chapterMap?.[chapterIdStr] || {};
      nextChapters[chapterIdStr] = {
        planned_hours: meta?.planned_hours ?? '',
        planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
        planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
      };
    });
    setChapterEdits(nextChapters);

    const nextTopics = {};
    Object.values(topicsByChapterId || {})
      .flatMap((arr) => (Array.isArray(arr) ? arr : []))
      .forEach((tp) => {
        const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
        const topicIdStr = String(topicId || '').trim();
        if (!topicIdStr) return;
        const meta = planMaps.topicMap?.[topicIdStr] || {};
        nextTopics[topicIdStr] = {
          planned_hours: meta?.planned_hours ?? '',
          planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
          planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
        };
      });
    setTopicEdits(nextTopics);

    const nextSubs = {};
    Object.values(subtopicsByTopicId || {})
      .flatMap((arr) => (Array.isArray(arr) ? arr : []))
      .forEach((st) => {
        const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
        const subIdStr = String(subId || '').trim();
        if (!subIdStr) return;
        const meta = planMaps.subtopicMap?.[subIdStr] || {};
        nextSubs[subIdStr] = {
          planned_hours: meta?.planned_hours ?? '',
          planned_start_date: normalizeDateInput(meta?.planned_start_date ?? ''),
          planned_end_date: normalizeDateInput(meta?.planned_end_date ?? '')
        };
      });
    setSubtopicEdits(nextSubs);
  };

  const validatePlannedMeta = ({ label, planned_hours, planned_start_date, planned_end_date }) => {
    const start = normalizeDateInput(planned_start_date);
    const end = normalizeDateInput(planned_end_date);
    const hours = toNumberOrNull(planned_hours);

    if (hours != null && hours < 0) {
      return `${label}: Planned hours must be >= 0.`;
    }

    if ((start && !end) || (!start && end)) {
      return `${label}: Please set both planned start date and planned end date.`;
    }
    if (start && end) {
      const s = toDateOrNull(start);
      const e = toDateOrNull(end);
      if (!s || !e) return `${label}: Invalid planned dates.`;
      if (s.getTime() > e.getTime()) {
        return `${label}: Planned start date must be less than or equal to planned end date.`;
      }
      if (hours != null) {
        const available = diffHoursInclusiveUTC(start, end);
        if (available != null && hours > available) {
          return `${label}: Planned hours (${hours}) exceed the time window (${available} hours) between planned start and end dates.`;
        }
      }
    }
    return null;
  };

  const computeActualSubtopicMeta = (subIdStr) => {
    const meta = planMaps.subtopicMap?.[subIdStr] || {};
    return {
      actual_hours: toNumberOrNull(meta?.actual_hours),
      actual_start_date: normalizeDateInput(meta?.actual_start_date),
      actual_end_date: normalizeDateInput(meta?.actual_end_date)
    };
  };

  const computeActualTopicMeta = (topicIdStr) => {
    const subRows = subtopicsByTopicId?.[topicIdStr];
    if (Array.isArray(subRows) && subRows.length > 0) {
      const subMetas = subRows
        .map((st) => st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .map((sid) => computeActualSubtopicMeta(sid));

      const hours = subMetas.reduce((sum, m) => sum + (toNumberOrNull(m.actual_hours) || 0), 0);
      const start = minDateFromStrings(subMetas.map((m) => m.actual_start_date).filter(Boolean));
      const end = maxDateFromStrings(subMetas.map((m) => m.actual_end_date).filter(Boolean));
      return { actual_hours: hours, actual_start_date: start, actual_end_date: end };
    }

    const meta = planMaps.topicMap?.[topicIdStr] || {};
    return {
      actual_hours: toNumberOrNull(meta?.actual_hours),
      actual_start_date: normalizeDateInput(meta?.actual_start_date),
      actual_end_date: normalizeDateInput(meta?.actual_end_date)
    };
  };

  const computeActualChapterMeta = (chapterIdStr) => {
    const tpRows = topicsByChapterId?.[chapterIdStr];
    if (Array.isArray(tpRows) && tpRows.length > 0) {
      const topicMetas = tpRows
        .map((tp) => tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .map((tid) => computeActualTopicMeta(tid));

      const hours = topicMetas.reduce((sum, m) => sum + (toNumberOrNull(m.actual_hours) || 0), 0);
      const start = minDateFromStrings(topicMetas.map((m) => m.actual_start_date).filter(Boolean));
      const end = maxDateFromStrings(topicMetas.map((m) => m.actual_end_date).filter(Boolean));
      return { actual_hours: hours, actual_start_date: start, actual_end_date: end };
    }

    const meta = planMaps.chapterMap?.[chapterIdStr] || {};
    return {
      actual_hours: toNumberOrNull(meta?.actual_hours),
      actual_start_date: normalizeDateInput(meta?.actual_start_date),
      actual_end_date: normalizeDateInput(meta?.actual_end_date)
    };
  };

  const formatPercent = (plannedHours, actualHours) => {
    const p = toNumberOrNull(plannedHours);
    if (p == null || p <= 0) return null;
    const a = toNumberOrNull(actualHours) || 0;
    const pct = Math.max(0, Math.min(100, (a / p) * 100));
    return `${Math.round(pct)}%`;
  };

  const CompletionCell = ({ plannedHours, actualHours }) => {
    const pct = formatPercent(plannedHours, actualHours);
    if (!pct) return <div className="text-sm text-secondary-500">—</div>;
    const n = Number.parseInt(pct.replace('%', ''), 10);
    const cls =
      n >= 100
        ? 'bg-emerald-100 text-emerald-800'
        : n > 0
          ? 'bg-blue-100 text-blue-800'
          : 'bg-secondary-100 text-secondary-700';
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{pct}</span>;
  };

  const handleSavePlan = async () => {
    console.log('[SyllabusProgressDetailsPage] Save Plan clicked');
    if (!canCreatePlans) {
      console.log('[SyllabusProgressDetailsPage] Save Plan blocked: missing permission');
      toast.error('You do not have permission to create plans');
      return;
    }
    const ay = toNumberOrNull(academicYearId);
    const sid = toNumberOrNull(sectionId);
    const subjectName = String(selectedSubjectName || '').trim();
    if (!ay || !sid || !subjectName) {
      console.log('[SyllabusProgressDetailsPage] Save Plan blocked: missing ay/section/subject', { ay, sid, subjectName });
      toast.error('Select Academic Year, Subject and Section to save the plan');
      return;
    }
    if (!String(bookId || '').trim()) {
      console.log('[SyllabusProgressDetailsPage] Save Plan blocked: missing bookId', { bookId });
      toast.error('Please select a Book');
      return;
    }
    if (!Array.isArray(chapters) || chapters.length === 0) {
      console.log('[SyllabusProgressDetailsPage] Save Plan blocked: no chapters', { chaptersCount: Array.isArray(chapters) ? chapters.length : null });
      toast.error('No chapters exist for this book');
      return;
    }

    try {
      setPlanSaveLoading(true);
      console.log('[SyllabusProgressDetailsPage] Save Plan started', {
        academic_year_id: ay,
        section_id: sid,
        subject_name: subjectName,
        chaptersCount: chapters.length
      });

      const localTopicsByChapterId = { ...(topicsByChapterId || {}) };
      const localSubtopicsByTopicId = { ...(subtopicsByTopicId || {}) };

      await Promise.all(
        chapters.map(async (ch) => {
          const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
          const chapterIdStr = String(chapterId || '').trim();
          if (!chapterIdStr) return;
          if (localTopicsByChapterId[chapterIdStr] !== undefined) return;
          const tRes = await syllabusTopicService.getTopics(chapterIdStr);
          const tRows = tRes?.data?.topics || tRes?.data || tRes?.topics || [];
          localTopicsByChapterId[chapterIdStr] = Array.isArray(tRows) ? tRows : [];
        })
      );
      setTopicsByChapterId((prev) => ({ ...(prev || {}), ...localTopicsByChapterId }));
      console.log('[SyllabusProgressDetailsPage] Topics ensured', {
        chaptersWithTopics: Object.keys(localTopicsByChapterId).length
      });

      const topicIds = Object.values(localTopicsByChapterId)
        .flatMap((arr) => (Array.isArray(arr) ? arr : []))
        .map((tp) => tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean);

      await Promise.all(
        topicIds.map(async (topicIdStr) => {
          if (localSubtopicsByTopicId[topicIdStr] !== undefined) return;
          const sRes = await syllabusSubtopicService.getSubtopics(topicIdStr);
          const sRows = sRes?.data?.subtopics || sRes?.data || sRes?.subtopics || [];
          localSubtopicsByTopicId[topicIdStr] = Array.isArray(sRows) ? sRows : [];
        })
      );
      setSubtopicsByTopicId((prev) => ({ ...(prev || {}), ...localSubtopicsByTopicId }));
      console.log('[SyllabusProgressDetailsPage] Subtopics ensured', {
        topicsWithSubtopics: Object.keys(localSubtopicsByTopicId).length
      });

      const updates = [];
      const changedPlanIds = new Set();

      const maybeAddUpdate = (planId, oldMeta, newMeta) => {
        if (!planId) return;
        const oldH = toNumberOrNull(oldMeta?.planned_hours);
        const newH = toNumberOrNull(newMeta.planned_hours);
        const oldS = oldMeta?.planned_start_date || null;
        const newS = newMeta.planned_start_date || null;
        const oldE = oldMeta?.planned_end_date || null;
        const newE = newMeta.planned_end_date || null;

        if (oldH !== newH || oldS !== newS || oldE !== newE) {
          if (!changedPlanIds.has(planId)) {
            updates.push({
              plan_id: planId,
              fields_to_update: {
                planned_hours: newH,
                planned_start_date: newS,
                planned_end_date: newE
              }
            });
            changedPlanIds.add(planId);
          }
        }
      };

      const validationErrors = [];
      chapters.forEach((ch) => {
        const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
        const chapterIdStr = String(chapterId || '').trim();
        if (!chapterIdStr) return;

        const topicRows = localTopicsByChapterId?.[chapterIdStr] || [];
        const topics = Array.isArray(topicRows) ? topicRows : [];

        const chapterMeta = computeChapterMeta(chapterIdStr);
        const oldChapterMeta = planMaps.chapterMap?.[chapterIdStr];

        const chapterLabel = `Chapter ${String(ch?.chapter_title ?? ch?.chapterTitle ?? chapterIdStr).trim() || chapterIdStr}`;
        const chapterErr = validatePlannedMeta({
          label: chapterLabel,
          planned_hours: chapterMeta.planned_hours,
          planned_start_date: chapterMeta.planned_start_date,
          planned_end_date: chapterMeta.planned_end_date
        });
        if (chapterErr) validationErrors.push(chapterErr);
        maybeAddUpdate(oldChapterMeta?.plan_id, oldChapterMeta, chapterMeta);

        topics.forEach((tp) => {
          const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
          const topicIdStr = String(topicId || '').trim();
          if (!topicIdStr) return;

          const subRows = localSubtopicsByTopicId?.[topicIdStr] || [];
          const subtopics = Array.isArray(subRows) ? subRows : [];

          const topicMeta = computeTopicMeta(topicIdStr);
          const oldTopicMeta = planMaps.topicMap?.[topicIdStr];

          const topicLabel = `Topic ${String(tp?.topic_title ?? tp?.topicTitle ?? topicIdStr).trim() || topicIdStr}`;
          const topicErr = validatePlannedMeta({
            label: topicLabel,
            planned_hours: topicMeta.planned_hours,
            planned_start_date: topicMeta.planned_start_date,
            planned_end_date: topicMeta.planned_end_date
          });
          if (topicErr) validationErrors.push(topicErr);
          maybeAddUpdate(oldTopicMeta?.plan_id, oldTopicMeta, topicMeta);

          subtopics.forEach((st) => {
            const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
            const subIdStr = String(subId || '').trim();
            if (!subIdStr) return;

            const m = computeSubtopicMeta(subIdStr);
            const oldSubMeta = planMaps.subtopicMap?.[subIdStr];

            const err = validatePlannedMeta({
              label: `Subtopic ${String(st?.subtopic_title ?? st?.subtopicTitle ?? subIdStr).trim() || subIdStr}`,
              planned_hours: m.planned_hours,
              planned_start_date: m.planned_start_date,
              planned_end_date: m.planned_end_date
            });
            if (err) validationErrors.push(err);

            maybeAddUpdate(oldSubMeta?.plan_id, oldSubMeta, m);
          });
        });
      });

      if (validationErrors.length > 0) {
        console.log('[SyllabusProgressDetailsPage] Save Plan validation failed', { firstError: validationErrors[0] });
        toast.error(validationErrors[0]);
        return;
      }

      if (updates.length === 0) {
        console.log('[SyllabusProgressDetailsPage] No changes detected', {
          planRowsCount: Array.isArray(planRows) ? planRows.length : null
        });
        toast.success('No changes to save');
        return;
      }

      console.log('[SyllabusProgressDetailsPage] Sending updates', { count: updates.length, updates });
      try {
        console.log('[SyllabusProgressDetailsPage] Sending updates JSON', JSON.stringify(updates, null, 2));
      } catch (e) {
        console.log('[SyllabusProgressDetailsPage] Failed to stringify updates', e);
      }
      const response = await syllabusPlanService.updatePlan(updates);
      console.log('[SyllabusProgressDetailsPage] Update response', response);

      if (response?.success) {
        toast.success(response?.message || 'Plan saved successfully');
        setPlanEditMode(false);
        const refreshed = await syllabusPlanService.getPlans({
          academic_year_id: ay,
          section_id: sid,
          subject_name: subjectName
        });
        console.log('[SyllabusProgressDetailsPage] Refreshed getPlans response', refreshed);
        const refreshedData = refreshed?.data ?? refreshed;
        const plans = refreshedData?.plans || [];
        const normalizedPlans = Array.isArray(plans) ? plans : [];
        console.log('[SyllabusProgressDetailsPage] Refreshed plans normalized', { count: normalizedPlans.length, plans: normalizedPlans });
        setPlanRows(normalizedPlans);
        setPlanMaps(buildPlanMapsFromPlans(normalizedPlans));
      } else {
        console.log('[SyllabusProgressDetailsPage] Update returned success=false', response);
        toast.error(response?.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Failed to save plan:', error);
      console.log('[SyllabusProgressDetailsPage] Save Plan error object', error);
      toast.error(error?.message || 'Failed to save plan');
    } finally {
      setPlanSaveLoading(false);
      console.log('[SyllabusProgressDetailsPage] Save Plan finished');
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl">
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-secondary-900">Syllabus Progress</h2>
                <p className="text-secondary-600 text-sm font-medium">View syllabus plan for a section</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Academic Year</option>
                  {(academicYears || []).map((y) => (
                    <option key={String(y.academic_year_id)} value={String(y.academic_year_id)}>
                      {String(y.year_name || '').trim() || '—'} - {String(y.curriculum_code || '').trim() || '—'} - {String(y.medium || '').trim() || '—'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!String(academicYearId || '').trim()}
                >
                  <option value="">Select Subject</option>
                  {(filteredSubjects || []).map((s) => (
                    <option key={String(s.subject_id)} value={String(s.subject_id)}>
                      {String(s.subject_name || '').trim() || '—'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                <select
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!String(academicYearId || '').trim() || !String(subjectId || '').trim() || booksLoading}
                >
                  <option value="">{booksLoading ? 'Loading books...' : 'Select Book'}</option>
                  {availableBooks.map((b) => {
                    const id = b?.curriculum_book_id ?? b?.curriculumBookId ?? b?.id ?? null;
                    const label = String(b?.book_name ?? b?.bookName ?? '').trim() || '—';
                    const version = b?.version_no ?? b?.versionNo ?? b?.version ?? null;
                    return (
                      <option key={String(id)} value={String(id)}>
                        {version != null && String(version).trim() !== '' ? `${label} (v${version})` : label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={classesLoading}
                >
                  <option value="">{classesLoading ? 'Loading classes...' : 'Select Class'}</option>
                  {(classes || []).map((cls) => (
                    <option key={String(cls.class_id ?? cls.classId ?? cls.id)} value={String(cls.class_id ?? cls.classId ?? cls.id)}>
                      {String(cls.class_name ?? cls.className ?? cls.name ?? cls.class_level ?? '').trim() || '—'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!String(classId || '').trim() || sectionsLoading}
                >
                  <option value="">{sectionsLoading ? 'Loading sections...' : 'Select Section'}</option>
                  {(sections || []).map((sec) => (
                    <option key={String(sec.section_id ?? sec.sectionId ?? sec.id)} value={String(sec.section_id ?? sec.sectionId ?? sec.id)}>
                      {String(sec.section_name ?? sec.sectionName ?? sec.name ?? '').trim() || '—'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-5xl">
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary-900">Plan</h3>
              <div className="flex items-center gap-3">
                {planLoading && (
                  <div className="flex items-center">
                    <LoadingSpinner className="w-4 h-4" />
                    <span className="ml-2 text-sm text-gray-500">Loading plan...</span>
                  </div>
                )}
                {canCreatePlans && !planEditMode && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPlanEditMode(true)}
                    disabled={
                      planLoading ||
                      planSaveLoading ||
                      !String(academicYearId || '').trim() ||
                      !String(subjectId || '').trim() ||
                      !String(bookId || '').trim() ||
                      !String(sectionId || '').trim() ||
                      chaptersLoading ||
                      chapters.length === 0
                    }
                  >
                    Edit
                  </button>
                )}
                {canCreatePlans && planEditMode && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      resetEditsToCurrentPlan();
                      setPlanEditMode(false);
                    }}
                    disabled={planSaveLoading}
                  >
                    Cancel
                  </button>
                )}
                {canCreatePlans && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSavePlan}
                    disabled={
                      planSaveLoading ||
                      !planEditMode ||
                      !String(academicYearId || '').trim() ||
                      !String(subjectId || '').trim() ||
                      !String(bookId || '').trim() ||
                      !String(sectionId || '').trim() ||
                      chaptersLoading ||
                      chapters.length === 0
                    }
                  >
                    {planSaveLoading ? 'Saving...' : 'Save Plan'}
                  </button>
                )}
              </div>
            </div>

            {!canViewPlans ? (
              <div className="text-sm text-secondary-700">You do not have permission to view plans.</div>
            ) : !String(academicYearId || '').trim() || !String(subjectId || '').trim() || !String(bookId || '').trim() || !String(sectionId || '').trim() ? (
              <div className="text-sm text-secondary-700">Select Academic Year, Subject, Book, Class and Section to view the plan.</div>
            ) : chaptersLoading ? (
              <div className="flex items-center">
                <LoadingSpinner className="w-4 h-4" />
                <span className="ml-2 text-gray-500">Loading chapters...</span>
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-sm text-secondary-700">No chapters exist for this book.</div>
            ) : (
              <div className="overflow-x-auto">
                {planRows.length === 0 && (
                  <div className="mb-3 text-sm text-secondary-700">No plan found for the selected section and subject.</div>
                )}
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Chapter</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned Start</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned End</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {chapters.map((ch) => {
                      const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
                      const chapterIdStr = String(chapterId || '').trim();
                      const expanded = expandedChapterId === chapterIdStr;
                      const title = String(ch?.chapter_title ?? ch?.chapterTitle ?? '').trim() || `Chapter #${chapterIdStr || '—'}`;
                      const chapterTopics = topicsByChapterId?.[chapterIdStr];
                      const topicsResolved = chapterTopics !== undefined;
                      const hasTopics = Array.isArray(chapterTopics) && chapterTopics.length > 0;
                      const canEditChapter = planEditMode && !hasTopics;
                      const meta = computeChapterMeta(chapterIdStr);
                      const actualMeta = computeActualChapterMeta(chapterIdStr);
                      const edit = getChapterEdit(chapterIdStr);
                      return (
                        <React.Fragment key={chapterIdStr || title}>
                          <tr className="bg-blue-50/60 hover:bg-blue-100/60">
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => toggleChapterExpanded(ch)}
                                className="flex items-center gap-2 text-sm font-medium text-secondary-900"
                              >
                                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                <span>{title}</span>
                              </button>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min={0}
                                step={0.25}
                                value={
                                  planEditMode && canEditChapter ? edit.planned_hours : meta.planned_hours == null ? '' : meta.planned_hours
                                }
                                onChange={(e) =>
                                  setChapterEdits((prev) => ({
                                    ...prev,
                                    [chapterIdStr]: { ...(prev?.[chapterIdStr] || getChapterEdit(chapterIdStr)), planned_hours: e.target.value }
                                  }))
                                }
                                disabled={!planEditMode || !canEditChapter || planSaveLoading || planLoading || !topicsResolved}
                                className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode && canEditChapter ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="date"
                                value={planEditMode && canEditChapter ? edit.planned_start_date : meta.planned_start_date || ''}
                                onChange={(e) =>
                                  setChapterEdits((prev) => ({
                                    ...prev,
                                    [chapterIdStr]: {
                                      ...(prev?.[chapterIdStr] || getChapterEdit(chapterIdStr)),
                                      planned_start_date: e.target.value
                                    }
                                  }))
                                }
                                disabled={!planEditMode || !canEditChapter || planSaveLoading || planLoading || !topicsResolved}
                                className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode && canEditChapter ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="date"
                                value={planEditMode && canEditChapter ? edit.planned_end_date : meta.planned_end_date || ''}
                                onChange={(e) =>
                                  setChapterEdits((prev) => ({
                                    ...prev,
                                    [chapterIdStr]: { ...(prev?.[chapterIdStr] || getChapterEdit(chapterIdStr)), planned_end_date: e.target.value }
                                  }))
                                }
                                disabled={!planEditMode || !canEditChapter || planSaveLoading || planLoading || !topicsResolved}
                                className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode && canEditChapter ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <CompletionCell plannedHours={meta.planned_hours} actualHours={actualMeta.actual_hours} />
                            </td>
                          </tr>

                          {expanded && (
                            <tr>
                              <td colSpan={5} className="px-4 py-3 bg-secondary-50/40">
                                {topicsLoadingByChapterId[chapterIdStr] ? (
                                  <div className="flex items-center">
                                    <LoadingSpinner className="w-4 h-4" />
                                    <span className="ml-2 text-gray-500">Loading topics...</span>
                                  </div>
                                ) : (topicsByChapterId[chapterIdStr] || []).length === 0 ? (
                                  <div className="text-sm text-secondary-700">No topics found for this chapter.</div>
                                ) : (
                                  <div className="overflow-x-auto bg-white rounded-lg border border-secondary-200">
                                    <table className="min-w-full divide-y divide-secondary-200">
                                      <thead className="bg-secondary-50">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Topic</th>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned Hours</th>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned Start</th>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned End</th>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Completion</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-secondary-200 bg-white">
                                        {(topicsByChapterId[chapterIdStr] || []).map((tp) => {
                                          const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
                                          const topicIdStr = String(topicId || '').trim();
                                          const topicExpanded = expandedTopicId === topicIdStr;
                                          const topicTitle = String(tp?.topic_title ?? tp?.topicTitle ?? '').trim() || `Topic #${topicIdStr || '—'}`;
                                          const topicSubs = subtopicsByTopicId?.[topicIdStr];
                                          const subtopicsResolved = topicSubs !== undefined;
                                          const hasSubtopics = Array.isArray(topicSubs) && topicSubs.length > 0;
                                          const canEditTopic = planEditMode && !hasSubtopics;
                                          const topicMeta = computeTopicMeta(topicIdStr);
                                          const topicActual = computeActualTopicMeta(topicIdStr);
                                          const topicEdit = getTopicEdit(topicIdStr);
                                          return (
                                            <React.Fragment key={topicIdStr || topicTitle}>
                                              <tr className="bg-indigo-50/60 hover:bg-indigo-100/60">
                                                <td className="px-4 py-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleTopicExpanded(tp)}
                                                    className="flex items-center gap-2 text-sm font-medium text-secondary-900"
                                                  >
                                                    {topicExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    <span>{topicTitle}</span>
                                                  </button>
                                                </td>
                                                <td className="px-4 py-2">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    step={0.25}
                                                    value={planEditMode && canEditTopic ? topicEdit.planned_hours : topicMeta.planned_hours == null ? '' : topicMeta.planned_hours}
                                                    onChange={(e) =>
                                                      setTopicEdits((prev) => ({
                                                        ...prev,
                                                        [topicIdStr]: { ...(prev?.[topicIdStr] || getTopicEdit(topicIdStr)), planned_hours: e.target.value }
                                                      }))
                                                    }
                                                    disabled={!planEditMode || !canEditTopic || planSaveLoading || planLoading || !subtopicsResolved}
                                                    className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode && canEditTopic ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <input
                                                    type="date"
                                                    value={planEditMode && canEditTopic ? topicEdit.planned_start_date : topicMeta.planned_start_date || ''}
                                                    onChange={(e) =>
                                                      setTopicEdits((prev) => ({
                                                        ...prev,
                                                        [topicIdStr]: {
                                                          ...(prev?.[topicIdStr] || getTopicEdit(topicIdStr)),
                                                          planned_start_date: e.target.value
                                                        }
                                                      }))
                                                    }
                                                    disabled={!planEditMode || !canEditTopic || planSaveLoading || planLoading || !subtopicsResolved}
                                                    className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode && canEditTopic ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <input
                                                    type="date"
                                                    value={planEditMode && canEditTopic ? topicEdit.planned_end_date : topicMeta.planned_end_date || ''}
                                                    onChange={(e) =>
                                                      setTopicEdits((prev) => ({
                                                        ...prev,
                                                        [topicIdStr]: { ...(prev?.[topicIdStr] || getTopicEdit(topicIdStr)), planned_end_date: e.target.value }
                                                      }))
                                                    }
                                                    disabled={!planEditMode || !canEditTopic || planSaveLoading || planLoading || !subtopicsResolved}
                                                    className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode && canEditTopic ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <CompletionCell plannedHours={topicMeta.planned_hours} actualHours={topicActual.actual_hours} />
                                                </td>
                                              </tr>

                                              {topicExpanded && (
                                                <tr>
                                                  <td colSpan={5} className="px-4 py-3 bg-secondary-50/50">
                                                    {subtopicsLoadingByTopicId[topicIdStr] ? (
                                                      <div className="flex items-center">
                                                        <LoadingSpinner className="w-4 h-4" />
                                                        <span className="ml-2 text-gray-500">Loading subtopics...</span>
                                                      </div>
                                                    ) : (subtopicsByTopicId[topicIdStr] || []).length === 0 ? (
                                                      <div className="text-sm text-secondary-700">No subtopics found for this topic.</div>
                                                    ) : (
                                                      <div className="overflow-x-auto bg-white rounded-lg border border-secondary-200">
                                                        <table className="min-w-full divide-y divide-secondary-200">
                                                          <thead className="bg-secondary-50">
                                                            <tr>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Subtopic</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned Hours</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned Start</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Planned End</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Completion</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-secondary-200 bg-white">
                                                            {(subtopicsByTopicId[topicIdStr] || []).map((st) => {
                                                              const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
                                                              const subIdStr = String(subId || '').trim();
                                                              const stTitle = String(st?.subtopic_title ?? st?.subtopicTitle ?? '').trim() || `Subtopic #${subIdStr || '—'}`;
                                                              const stEdit = getSubtopicEdit(subIdStr);
                                                              const stActual = computeActualSubtopicMeta(subIdStr);
                                                              return (
                                                                <tr key={subIdStr || stTitle} className="bg-emerald-50/30 hover:bg-emerald-100/40">
                                                                  <td className="px-4 py-2 text-sm font-medium text-secondary-900">{stTitle}</td>
                                                                  <td className="px-4 py-2">
                                                                    <input
                                                                      type="number"
                                                                      min={0}
                                                                      step={0.25}
                                                                      value={stEdit.planned_hours}
                                                                      onChange={(e) =>
                                                                        setSubtopicEdits((prev) => ({
                                                                          ...prev,
                                                                          [subIdStr]: { ...(prev?.[subIdStr] || getSubtopicEdit(subIdStr)), planned_hours: e.target.value }
                                                                        }))
                                                                      }
                                                                      disabled={!planEditMode || planSaveLoading || planLoading}
                                                                      className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                                                                    />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                    <input
                                                                      type="date"
                                                                      value={stEdit.planned_start_date}
                                                                      onChange={(e) =>
                                                                        setSubtopicEdits((prev) => ({
                                                                          ...prev,
                                                                          [subIdStr]: {
                                                                            ...(prev?.[subIdStr] || getSubtopicEdit(subIdStr)),
                                                                            planned_start_date: e.target.value
                                                                          }
                                                                        }))
                                                                      }
                                                                      disabled={!planEditMode || planSaveLoading || planLoading}
                                                                      className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                                                                    />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                    <input
                                                                      type="date"
                                                                      value={stEdit.planned_end_date}
                                                                      onChange={(e) =>
                                                                        setSubtopicEdits((prev) => ({
                                                                          ...prev,
                                                                          [subIdStr]: { ...(prev?.[subIdStr] || getSubtopicEdit(subIdStr)), planned_end_date: e.target.value }
                                                                        }))
                                                                      }
                                                                      disabled={!planEditMode || planSaveLoading || planLoading}
                                                                      className={`w-full px-2 py-1 text-sm border rounded-md ${planEditMode ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50 text-secondary-700'}`}
                                                                    />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                    <CompletionCell plannedHours={toNumberOrNull(stEdit.planned_hours)} actualHours={stActual.actual_hours} />
                                                                  </td>
                                                                </tr>
                                                              );
                                                            })}
                                                          </tbody>
                                                        </table>
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
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
