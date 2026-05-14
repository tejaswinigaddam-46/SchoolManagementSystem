import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import { academicService } from '../services/academicService';
import { sectionService } from '../services/sectionService';
import syllabusBookService, {
  syllabusChapterService,
  syllabusPlanService,
  syllabusProgressService,
  syllabusSubtopicService,
  syllabusTopicService
} from '../services/syllabusBookService';

const normalizeDateInput = (value) => {
  if (!value) return '';
  const s = String(value);
  if (s.includes('T')) return s.split('T')[0];
  return s.slice(0, 10);
};

const toNumberOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toDateOrNull = (s) => {
  const v = normalizeDateInput(s);
  if (!v) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const diffHoursInclusiveUTC = (startStr, endStr) => {
  const s = toDateOrNull(startStr);
  const e = toDateOrNull(endStr);
  if (!s || !e) return null;
  const ms = e.getTime() - s.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return days * 24;
};

const buildProgressMapsFromRows = (rows) => {
  const chapterMap = {};
  const topicMap = {};
  const subtopicMap = {};

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const planId = row?.plan_id ?? row?.planId ?? null;
    const progressId = row?.progress_id ?? row?.progressId ?? null;
    const chapterId = row?.chapter_id ?? row?.chapterId ?? null;
    const topicId = row?.topic_id ?? row?.topicId ?? null;
    const subtopicId = row?.subtopic_id ?? row?.subtopicId ?? null;

    const meta = {
      plan_id: planId,
      progress_id: progressId,
      planned_hours: row?.planned_hours ?? row?.plannedHours ?? null,
      planned_start_date: row?.planned_start_date ?? row?.plannedStartDate ?? null,
      planned_end_date: row?.planned_end_date ?? row?.plannedEndDate ?? null,
      actual_hours: row?.actual_hours ?? row?.actualHours ?? null,
      actual_start_date: row?.started_at ?? row?.startedAt ?? row?.actual_start_date ?? row?.actualStartDate ?? null,
      actual_end_date: row?.completed_at ?? row?.completedAt ?? row?.actual_end_date ?? row?.actualEndDate ?? null,
      status: row?.status ?? null,
      completion_percentage: row?.completion_percentage ?? row?.completionPercentage ?? null,
      notes: row?.notes ?? null,
      updated_at: row?.updated_at ?? row?.updatedAt ?? null
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

export default function SyllabusProgressUpdaterPage({ academicYears, subjects }) {
  const { hasPermission, getCampusId } = useAuth();
  const campusId = getCampusId();
  const canViewPlans = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_PLAN_LIST_READ);
  const canUpdatePlans = !!hasPermission && hasPermission(PERMISSIONS.SYLLABUS_PLAN_CREATE);

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
  const [progressSource, setProgressSource] = useState('progress'); // 'progress' | 'plans'

  const [chapterActualEdits, setChapterActualEdits] = useState({});
  const [topicActualEdits, setTopicActualEdits] = useState({});
  const [subtopicActualEdits, setSubtopicActualEdits] = useState({});
  const [saveActualLoading, setSaveActualLoading] = useState(false);

  const selectedSubjectName = useMemo(() => {
    const s = (subjects || []).find((x) => String(x?.subject_id) === String(subjectId));
    return String(s?.subject_name || '').trim();
  }, [subjects, subjectId]);

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
      } catch (_) {
        setSelectedCurriculumId(null);
      }
    };

    fetchAcademicYearDetails();
  }, [academicYears, campusId, academicYearId]);

  const filteredSubjects = useMemo(() => {
    const cid = String(selectedCurriculumId || '').trim();
    if (!cid) return subjects || [];
    return (subjects || []).filter((s) => String(s?.curriculum_id ?? s?.curriculumId ?? '') === cid);
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
        const rows = res?.success ? res.data?.classes || [] : [];
        setClasses(Array.isArray(rows) ? rows : []);
      } catch (_) {
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
    setChapterActualEdits({});
    setTopicActualEdits({});
    setSubtopicActualEdits({});
  }, [academicYearId, subjectId]);

  useEffect(() => {
    if (!String(bookId || '').trim()) return;
    setExpandedChapterId(null);
    setExpandedTopicId(null);
    setTopicsByChapterId({});
    setTopicsLoadingByChapterId({});
    setSubtopicsByTopicId({});
    setSubtopicsLoadingByTopicId({});
    setChapterActualEdits({});
    setTopicActualEdits({});
    setSubtopicActualEdits({});
  }, [bookId]);

  useEffect(() => {
    if (!String(sectionId || '').trim()) return;
    setPlanRows([]);
    setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
    setChapterActualEdits({});
    setTopicActualEdits({});
    setSubtopicActualEdits({});
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
      } catch (_) {
        setSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };
    loadSections();
  }, [classId]);

  useEffect(() => {
    const loadChapters = async () => {
      const bId = String(bookId || '').trim();
      if (!bId) {
        setChapters([]);
        return;
      }
      try {
        setChaptersLoading(true);
        const res = await syllabusChapterService.getChapters({ curriculum_book_id: bId });
        const rows = res?.data?.chapters || res?.data || res?.chapters || [];
        setChapters(Array.isArray(rows) ? rows : []);
      } catch (error) {
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

  const fetchTopicsForChapter = async (chapterId) => {
    const chapterIdStr = String(chapterId || '').trim();
    if (!chapterIdStr) return;
    try {
      setTopicsLoadingByChapterId((prev) => ({ ...prev, [chapterIdStr]: true }));
      const response = await syllabusTopicService.getTopics(chapterIdStr);
      const rows = response?.data?.topics || response?.data || response?.topics || [];
      setTopicsByChapterId((prev) => ({ ...prev, [chapterIdStr]: Array.isArray(rows) ? rows : [] }));
    } catch (_) {
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
    } catch (_) {
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

  const extractProgressRows = (response) => {
    const raw = response ?? {};
    const root = raw?.data ?? raw;
    const candidate = root?.success && root?.data ? root.data : root;

    const tries = [
      candidate?.progress,
      candidate?.rows,
      candidate?.data?.progress,
      candidate?.data?.rows,
      raw?.progress,
      raw?.rows,
      raw?.data?.progress,
      raw?.data?.rows,
      raw?.data?.data?.progress,
      raw?.data?.data?.rows
    ];

    for (const t of tries) {
      if (Array.isArray(t)) return t;
    }
    return [];
  };

  const refreshProgress = async ({ ay, sid, subjectName }) => {
    const response = await syllabusProgressService.getProgress({
      academic_year_id: ay,
      section_id: sid,
      subject_name: subjectName
    });
    const normalized = extractProgressRows(response);
    console.log('[SyllabusProgressUpdaterPage] getProgress rows', {
      count: normalized.length,
      sampleKeys: normalized[0] ? Object.keys(normalized[0]) : [],
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : []
    });
    setPlanRows(normalized);
    setPlanMaps(buildProgressMapsFromRows(normalized));
    setProgressSource(normalized.length > 0 ? 'progress' : 'plans');
    setChapterActualEdits({});
    setTopicActualEdits({});
    setSubtopicActualEdits({});
    return normalized;
  };

  useEffect(() => {
    const loadProgress = async () => {
      if (!canViewPlans) return;
      const ay = toNumberOrNull(academicYearId);
      const sid = toNumberOrNull(sectionId);
      const subjectName = String(selectedSubjectName || '').trim();
      if (!ay || !sid || !subjectName) {
        setPlanRows([]);
        setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
        setProgressSource('progress');
        return;
      }
      try {
        setPlanLoading(true);
        const normalized = await refreshProgress({ ay, sid, subjectName });
        if (normalized.length === 0) {
          console.log('[SyllabusProgressUpdaterPage] getProgress returned 0 rows; falling back to plans');
          const plansRes = await syllabusPlanService.getPlans({
            academic_year_id: ay,
            section_id: sid,
            subject_name: subjectName
          });
          const plansData = plansRes?.data ?? plansRes;
          const plans = plansData?.plans || [];
          const planRowsFallback = (Array.isArray(plans) ? plans : []).map((r) => ({
            ...r,
            actual_hours: 0,
            completion_percentage: 0,
            status: 'pending',
            started_at: null,
            completed_at: null
          }));
          setPlanRows(planRowsFallback);
          setPlanMaps(buildProgressMapsFromRows(planRowsFallback));
          setProgressSource(planRowsFallback.length > 0 ? 'plans' : 'progress');
          setChapterActualEdits({});
          setTopicActualEdits({});
          setSubtopicActualEdits({});
        }
      } catch (_) {
        setPlanRows([]);
        setPlanMaps({ chapterMap: {}, topicMap: {}, subtopicMap: {} });
        setProgressSource('progress');
        setChapterActualEdits({});
        setTopicActualEdits({});
        setSubtopicActualEdits({});
      } finally {
        setPlanLoading(false);
      }
    };
    loadProgress();
  }, [canViewPlans, academicYearId, sectionId, selectedSubjectName]);

  useEffect(() => {
    if (!Array.isArray(chapters) || chapters.length === 0) return;
    setChapterActualEdits((prev) => {
      const next = { ...prev };
      chapters.forEach((ch) => {
        const chapterId = ch?.chapter_id ?? ch?.chapterId ?? ch?.id ?? null;
        const chapterIdStr = String(chapterId || '').trim();
        if (!chapterIdStr) return;
        if (next[chapterIdStr]) return;
        const meta = planMaps.chapterMap?.[chapterIdStr] || {};
        next[chapterIdStr] = {
          actual_hours: meta?.actual_hours ?? '',
          actual_start_date: normalizeDateInput(meta?.actual_start_date ?? ''),
          actual_end_date: normalizeDateInput(meta?.actual_end_date ?? '')
        };
      });
      return next;
    });
  }, [chapters, planMaps]);

  useEffect(() => {
    const topicRows = Object.values(topicsByChapterId || {}).flatMap((arr) => (Array.isArray(arr) ? arr : []));
    if (topicRows.length === 0) return;
    setTopicActualEdits((prev) => {
      const next = { ...prev };
      topicRows.forEach((tp) => {
        const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
        const topicIdStr = String(topicId || '').trim();
        if (!topicIdStr) return;
        if (next[topicIdStr]) return;
        const meta = planMaps.topicMap?.[topicIdStr] || {};
        next[topicIdStr] = {
          actual_hours: meta?.actual_hours ?? '',
          actual_start_date: normalizeDateInput(meta?.actual_start_date ?? ''),
          actual_end_date: normalizeDateInput(meta?.actual_end_date ?? '')
        };
      });
      return next;
    });
  }, [topicsByChapterId, planMaps]);

  useEffect(() => {
    const subRows = Object.values(subtopicsByTopicId || {}).flatMap((arr) => (Array.isArray(arr) ? arr : []));
    if (subRows.length === 0) return;
    setSubtopicActualEdits((prev) => {
      const next = { ...prev };
      subRows.forEach((st) => {
        const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
        const subIdStr = String(subId || '').trim();
        if (!subIdStr) return;
        if (next[subIdStr]) return;
        const meta = planMaps.subtopicMap?.[subIdStr] || {};
        next[subIdStr] = {
          actual_hours: meta?.actual_hours ?? '',
          actual_start_date: normalizeDateInput(meta?.actual_start_date ?? ''),
          actual_end_date: normalizeDateInput(meta?.actual_end_date ?? '')
        };
      });
      return next;
    });
  }, [subtopicsByTopicId, planMaps]);

  const minDateFromStrings = (values) => {
    const dates = (values || []).map(toDateOrNull).filter(Boolean);
    if (dates.length === 0) return '';
    const min = dates.reduce((acc, cur) => (cur.getTime() < acc.getTime() ? cur : acc), dates[0]);
    return min.toISOString().slice(0, 10);
  };

  const maxDateFromStrings = (values) => {
    const dates = (values || []).map(toDateOrNull).filter(Boolean);
    if (dates.length === 0) return '';
    const max = dates.reduce((acc, cur) => (cur.getTime() > acc.getTime() ? cur : acc), dates[0]);
    return max.toISOString().slice(0, 10);
  };

  const computePlannedSubtopicMeta = (subIdStr) => {
    const meta = planMaps.subtopicMap?.[subIdStr] || {};
    return {
      planned_hours: toNumberOrNull(meta?.planned_hours),
      planned_start_date: normalizeDateInput(meta?.planned_start_date),
      planned_end_date: normalizeDateInput(meta?.planned_end_date)
    };
  };

  const computePlannedTopicMeta = (topicIdStr) => {
    const subRows = subtopicsByTopicId?.[topicIdStr];
    if (Array.isArray(subRows) && subRows.length > 0) {
      const subMetas = subRows
        .map((st) => st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .map((sid) => computePlannedSubtopicMeta(sid));
      const hours = subMetas.reduce((sum, m) => sum + (toNumberOrNull(m.planned_hours) || 0), 0);
      const start = minDateFromStrings(subMetas.map((m) => m.planned_start_date).filter(Boolean));
      const end = maxDateFromStrings(subMetas.map((m) => m.planned_end_date).filter(Boolean));
      return { planned_hours: hours, planned_start_date: start, planned_end_date: end, derived: true };
    }
    const meta = planMaps.topicMap?.[topicIdStr] || {};
    return {
      planned_hours: toNumberOrNull(meta?.planned_hours),
      planned_start_date: normalizeDateInput(meta?.planned_start_date),
      planned_end_date: normalizeDateInput(meta?.planned_end_date),
      derived: false
    };
  };

  const computePlannedChapterMeta = (chapterIdStr) => {
    const tpRows = topicsByChapterId?.[chapterIdStr];
    if (Array.isArray(tpRows) && tpRows.length > 0) {
      const topicMetas = tpRows
        .map((tp) => tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .map((tid) => computePlannedTopicMeta(tid));
      const hours = topicMetas.reduce((sum, m) => sum + (toNumberOrNull(m.planned_hours) || 0), 0);
      const start = minDateFromStrings(topicMetas.map((m) => m.planned_start_date).filter(Boolean));
      const end = maxDateFromStrings(topicMetas.map((m) => m.planned_end_date).filter(Boolean));
      return { planned_hours: hours, planned_start_date: start, planned_end_date: end, derived: true };
    }
    const meta = planMaps.chapterMap?.[chapterIdStr] || {};
    return {
      planned_hours: toNumberOrNull(meta?.planned_hours),
      planned_start_date: normalizeDateInput(meta?.planned_start_date),
      planned_end_date: normalizeDateInput(meta?.planned_end_date),
      derived: false
    };
  };

  const getChapterActualEdit = (chapterIdStr) => {
    const existing = chapterActualEdits?.[chapterIdStr];
    if (existing) return existing;
    const meta = planMaps.chapterMap?.[chapterIdStr] || {};
    return {
      actual_hours: meta?.actual_hours ?? '',
      actual_start_date: normalizeDateInput(meta?.actual_start_date),
      actual_end_date: normalizeDateInput(meta?.actual_end_date)
    };
  };

  const getTopicActualEdit = (topicIdStr) => {
    const existing = topicActualEdits?.[topicIdStr];
    if (existing) return existing;
    const meta = planMaps.topicMap?.[topicIdStr] || {};
    return {
      actual_hours: meta?.actual_hours ?? '',
      actual_start_date: normalizeDateInput(meta?.actual_start_date),
      actual_end_date: normalizeDateInput(meta?.actual_end_date)
    };
  };

  const getSubtopicActualEdit = (subIdStr) => {
    const existing = subtopicActualEdits?.[subIdStr];
    if (existing) return existing;
    const meta = planMaps.subtopicMap?.[subIdStr] || {};
    return {
      actual_hours: meta?.actual_hours ?? '',
      actual_start_date: normalizeDateInput(meta?.actual_start_date),
      actual_end_date: normalizeDateInput(meta?.actual_end_date)
    };
  };

  const computeActualSubtopicMeta = (subIdStr) => {
    const e = getSubtopicActualEdit(subIdStr);
    return {
      actual_hours: toNumberOrNull(e.actual_hours),
      actual_start_date: normalizeDateInput(e.actual_start_date),
      actual_end_date: normalizeDateInput(e.actual_end_date)
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
      const anyHours = subMetas.some((m) => toNumberOrNull(m.actual_hours) != null);
      const start = minDateFromStrings(subMetas.map((m) => m.actual_start_date).filter(Boolean));
      const end = maxDateFromStrings(subMetas.map((m) => m.actual_end_date).filter(Boolean));
      const anyDates = !!start || !!end;

      if (anyHours || anyDates) {
        const hours = subMetas.reduce((sum, m) => sum + (toNumberOrNull(m.actual_hours) || 0), 0);
        return { actual_hours: hours, actual_start_date: start, actual_end_date: end, derived: true };
      }

      const meta = planMaps.topicMap?.[topicIdStr] || {};
      return {
        actual_hours: toNumberOrNull(meta?.actual_hours),
        actual_start_date: normalizeDateInput(meta?.actual_start_date),
        actual_end_date: normalizeDateInput(meta?.actual_end_date),
        derived: true
      };
    }
    const e = getTopicActualEdit(topicIdStr);
    return {
      actual_hours: toNumberOrNull(e.actual_hours),
      actual_start_date: normalizeDateInput(e.actual_start_date),
      actual_end_date: normalizeDateInput(e.actual_end_date),
      derived: false
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
      const anyHours = topicMetas.some((m) => toNumberOrNull(m.actual_hours) != null);
      const start = minDateFromStrings(topicMetas.map((m) => m.actual_start_date).filter(Boolean));
      const end = maxDateFromStrings(topicMetas.map((m) => m.actual_end_date).filter(Boolean));
      const anyDates = !!start || !!end;

      if (anyHours || anyDates) {
        const hours = topicMetas.reduce((sum, m) => sum + (toNumberOrNull(m.actual_hours) || 0), 0);
        return { actual_hours: hours, actual_start_date: start, actual_end_date: end, derived: true };
      }

      const meta = planMaps.chapterMap?.[chapterIdStr] || {};
      return {
        actual_hours: toNumberOrNull(meta?.actual_hours),
        actual_start_date: normalizeDateInput(meta?.actual_start_date),
        actual_end_date: normalizeDateInput(meta?.actual_end_date),
        derived: true
      };
    }
    const e = getChapterActualEdit(chapterIdStr);
    return {
      actual_hours: toNumberOrNull(e.actual_hours),
      actual_start_date: normalizeDateInput(e.actual_start_date),
      actual_end_date: normalizeDateInput(e.actual_end_date),
      derived: false
    };
  };

  const validateActualMeta = ({ label, actual_hours, actual_start_date, actual_end_date }) => {
    const start = normalizeDateInput(actual_start_date);
    const end = normalizeDateInput(actual_end_date);
    const hours = toNumberOrNull(actual_hours);
    if (hours != null && hours < 0) return `${label}: Actual hours must be >= 0.`;
    if ((start && !end) || (!start && end)) return `${label}: Please set both actual start date and actual end date.`;
    if (start && end) {
      const s = toDateOrNull(start);
      const e = toDateOrNull(end);
      if (!s || !e) return `${label}: Invalid actual dates.`;
      if (s.getTime() > e.getTime()) return `${label}: Actual start date must be less than or equal to actual end date.`;
      if (hours != null) {
        const available = diffHoursInclusiveUTC(start, end);
        if (available != null && hours > available) {
          return `${label}: Actual hours (${hours}) exceed the time window (${available} hours) between actual start and end dates.`;
        }
      }
    }
    return null;
  };

  const formatPercent = (plannedHours, actualHours) => {
    const p = toNumberOrNull(plannedHours);
    if (p == null || p <= 0) return null;
    const a = toNumberOrNull(actualHours) || 0;
    const pct = Math.max(0, Math.min(100, (a / p) * 100));
    return Math.round(pct);
  };

  const CompletionCell = ({ plannedHours, actualHours, backendPercentage, backendStatus }) => {
    const computed = formatPercent(plannedHours, actualHours);
    const backendPctNum = toNumberOrNull(backendPercentage);
    const pctNum = computed != null ? computed : backendPctNum;
    if (pctNum == null) return <div className="text-sm text-secondary-500">—</div>;

    const pct = `${Math.max(0, Math.min(100, pctNum))}%`;
    const n = Number.parseInt(pct.replace('%', ''), 10);
    const cls =
      n >= 100
        ? 'bg-emerald-100 text-emerald-800'
        : n > 0
          ? 'bg-blue-100 text-blue-800'
          : 'bg-secondary-100 text-secondary-700';

    const statusRaw = String(backendStatus || '').trim();
    const status = statusRaw || (n >= 100 ? 'completed' : n > 0 ? 'in_progress' : 'pending');

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{pct}</span>
        <span className="text-xs font-medium text-secondary-600">{status}</span>
      </div>
    );
  };

  const handleSaveActual = async () => {
    if (!canUpdatePlans) {
      toast.error('You do not have permission to update plans');
      return;
    }
    const ay = toNumberOrNull(academicYearId);
    const sid = toNumberOrNull(sectionId);
    const subjectName = String(selectedSubjectName || '').trim();
    if (!ay || !sid || !subjectName) {
      toast.error('Select Academic Year, Subject and Section to save actuals');
      return;
    }
    if (!String(bookId || '').trim()) {
      toast.error('Please select a Book');
      return;
    }
    if (!Array.isArray(chapters) || chapters.length === 0) {
      toast.error('No chapters exist for this book');
      return;
    }

    try {
      setSaveActualLoading(true);

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

      const updates = [];
      const changedPlanIds = new Set();

      const maybeAddUpdate = (planId, oldMeta, newMeta) => {
        if (!planId) return;
        const oldH = toNumberOrNull(oldMeta?.actual_hours);
        const newH = toNumberOrNull(newMeta.actual_hours);
        const oldS = normalizeDateInput(oldMeta?.actual_start_date || '') || null;
        const newS = normalizeDateInput(newMeta.actual_start_date || '') || null;
        const oldE = normalizeDateInput(oldMeta?.actual_end_date || '') || null;
        const newE = normalizeDateInput(newMeta.actual_end_date || '') || null;
        if (oldH !== newH || oldS !== newS || oldE !== newE) {
          if (!changedPlanIds.has(planId)) {
            updates.push({
              plan_id: planId,
              fields_to_update: {
                actual_hours: newH,
                started_at: newS,
                completed_at: newE
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
        const oldChapterMeta = planMaps.chapterMap?.[chapterIdStr];

        if (!topics.length) {
          const chapterMeta = computeActualChapterMeta(chapterIdStr);
          const chErr = validateActualMeta({
            label: `Chapter ${String(ch?.chapter_title ?? ch?.chapterTitle ?? chapterIdStr).trim() || chapterIdStr}`,
            actual_hours: chapterMeta.actual_hours,
            actual_start_date: chapterMeta.actual_start_date,
            actual_end_date: chapterMeta.actual_end_date
          });
          if (chErr) validationErrors.push(chErr);
          maybeAddUpdate(oldChapterMeta?.plan_id, oldChapterMeta, chapterMeta);
          return;
        }

        topics.forEach((tp) => {
          const topicId = tp?.topic_id ?? tp?.topicId ?? tp?.id ?? null;
          const topicIdStr = String(topicId || '').trim();
          if (!topicIdStr) return;
          const subRows = localSubtopicsByTopicId?.[topicIdStr] || [];
          const subtopics = Array.isArray(subRows) ? subRows : [];

          const oldTopicMeta = planMaps.topicMap?.[topicIdStr];

          if (!subtopics.length) {
            const topicMeta = computeActualTopicMeta(topicIdStr);
            const tpErr = validateActualMeta({
              label: `Topic ${String(tp?.topic_title ?? tp?.topicTitle ?? topicIdStr).trim() || topicIdStr}`,
              actual_hours: topicMeta.actual_hours,
              actual_start_date: topicMeta.actual_start_date,
              actual_end_date: topicMeta.actual_end_date
            });
            if (tpErr) validationErrors.push(tpErr);
            maybeAddUpdate(oldTopicMeta?.plan_id, oldTopicMeta, topicMeta);
            return;
          }

          subtopics.forEach((st) => {
            const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
            const subIdStr = String(subId || '').trim();
            if (!subIdStr) return;

            const m = computeActualSubtopicMeta(subIdStr);
            const oldSubMeta = planMaps.subtopicMap?.[subIdStr];

            const stErr = validateActualMeta({
              label: `Subtopic ${String(st?.subtopic_title ?? st?.subtopicTitle ?? subIdStr).trim() || subIdStr}`,
              actual_hours: m.actual_hours,
              actual_start_date: m.actual_start_date,
              actual_end_date: m.actual_end_date
            });
            if (stErr) validationErrors.push(stErr);
            maybeAddUpdate(oldSubMeta?.plan_id, oldSubMeta, m);
          });
        });
      });

      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      if (updates.length === 0) {
        toast.success('No changes to save');
        return;
      }

      if (progressSource === 'plans') {
        const progress = updates
          .map((u) => ({
            plan_id: u.plan_id,
            actual_hours: u.fields_to_update?.actual_hours ?? null,
            started_at: u.fields_to_update?.started_at ?? null,
            completed_at: u.fields_to_update?.completed_at ?? null
          }))
          .filter((p) => p.actual_hours != null || p.started_at || p.completed_at);
        if (progress.length === 0) {
          toast.success('No changes to save');
          return;
        }
      }

      const response =
        progressSource === 'plans'
          ? await syllabusProgressService.createProgress({
              academic_year_id: ay,
              section_id: sid,
              subject_name: subjectName,
              progress: updates
                .map((u) => ({
                  plan_id: u.plan_id,
                  actual_hours: u.fields_to_update?.actual_hours ?? null,
                  started_at: u.fields_to_update?.started_at ?? null,
                  completed_at: u.fields_to_update?.completed_at ?? null
                }))
                .filter((p) => p.actual_hours != null || p.started_at || p.completed_at)
            })
          : await syllabusProgressService.updateProgressBulk(updates, {
              academic_year_id: ay,
              section_id: sid,
              subject_name: subjectName
            });
      if (response?.success) {
        toast.success(response?.message || 'Actuals saved successfully');
        await refreshProgress({ ay, sid, subjectName });
        setChapterActualEdits({});
        setTopicActualEdits({});
        setSubtopicActualEdits({});
      } else {
        toast.error(response?.message || 'Failed to save actuals');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to save actuals');
    } finally {
      setSaveActualLoading(false);
    }
  };

  const plannedInputClassName = 'w-full px-2 py-1 text-sm border border-gray-200 rounded-md bg-gray-50 text-secondary-700';
  const editableInputClassName =
    'w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  const DualNumberCell = ({ plannedValue, actualValue, onActualChange, actualDisabled }) => (
    <div className="space-y-2 min-w-[160px]">
      <div>
        <div className="text-[11px] font-semibold text-secondary-500 uppercase tracking-wide">Planned</div>
        <input type="number" value={plannedValue == null ? '' : plannedValue} disabled className={plannedInputClassName} />
      </div>
      <div>
        <div className="text-[11px] font-semibold text-secondary-500 uppercase tracking-wide">Actual</div>
        <input
          type="number"
          min={0}
          step={0.25}
          value={actualValue == null ? '' : actualValue}
          onChange={onActualChange}
          disabled={actualDisabled}
          className={actualDisabled ? plannedInputClassName : editableInputClassName}
        />
      </div>
    </div>
  );

  const DualDateCell = ({ plannedValue, actualValue, onActualChange, actualDisabled }) => (
    <div className="space-y-2 min-w-[175px]">
      <div>
        <div className="text-[11px] font-semibold text-secondary-500 uppercase tracking-wide">Planned</div>
        <input type="date" value={plannedValue || ''} disabled className={plannedInputClassName} />
      </div>
      <div>
        <div className="text-[11px] font-semibold text-secondary-500 uppercase tracking-wide">Actual</div>
        <input
          type="date"
          value={actualValue || ''}
          onChange={onActualChange}
          disabled={actualDisabled}
          className={actualDisabled ? plannedInputClassName : editableInputClassName}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="max-w-5xl">
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-secondary-900">Syllabus Progress Updater</h2>
                <p className="text-secondary-600 text-sm font-medium">Update actuals for a section</p>
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
                    const id = String(b?.curriculum_book_id ?? b?.curriculumBookId ?? b?.id ?? b?.book_id ?? b?.bookId ?? '');
                    const label = String(b?.book_name ?? b?.bookName ?? '').trim() || '—';
                    const versionNo = String(b?.version ?? b?.version_no ?? b?.versionNo ?? '').trim();
                    return (
                      <option key={id} value={id}>
                        {label}
                        {versionNo ? ` (v${versionNo})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-1">
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

              <div className="md:col-span-1">
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
              <h3 className="text-lg font-bold text-secondary-900">Actuals</h3>
              <div className="flex items-center gap-3">
                {planLoading && (
                  <div className="flex items-center">
                    <LoadingSpinner className="w-4 h-4" />
                    <span className="ml-2 text-sm text-gray-500">Loading plan...</span>
                  </div>
                )}
                {canUpdatePlans && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveActual}
                    disabled={
                      saveActualLoading ||
                      !String(academicYearId || '').trim() ||
                      !String(subjectId || '').trim() ||
                      !String(bookId || '').trim() ||
                      !String(sectionId || '').trim() ||
                      chaptersLoading ||
                      chapters.length === 0
                    }
                  >
                    {saveActualLoading ? 'Saving...' : 'Save Actuals'}
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
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Start</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">End</th>
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
                      const canEditChapterActual = !hasTopics;
                      const plannedMeta = computePlannedChapterMeta(chapterIdStr);
                      const actualMeta = computeActualChapterMeta(chapterIdStr);
                      const edit = getChapterActualEdit(chapterIdStr);

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
                              <DualNumberCell
                                plannedValue={plannedMeta.planned_hours}
                                actualValue={canEditChapterActual ? edit.actual_hours : actualMeta.actual_hours}
                                onActualChange={(e) =>
                                  setChapterActualEdits((prev) => ({
                                    ...prev,
                                    [chapterIdStr]: { ...(prev?.[chapterIdStr] || getChapterActualEdit(chapterIdStr)), actual_hours: e.target.value }
                                  }))
                                }
                                actualDisabled={!canEditChapterActual || saveActualLoading || planLoading}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <DualDateCell
                                plannedValue={plannedMeta.planned_start_date}
                                actualValue={canEditChapterActual ? edit.actual_start_date : actualMeta.actual_start_date}
                                onActualChange={(e) =>
                                  setChapterActualEdits((prev) => ({
                                    ...prev,
                                    [chapterIdStr]: {
                                      ...(prev?.[chapterIdStr] || getChapterActualEdit(chapterIdStr)),
                                      actual_start_date: e.target.value
                                    }
                                  }))
                                }
                                actualDisabled={!canEditChapterActual || saveActualLoading || planLoading}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <DualDateCell
                                plannedValue={plannedMeta.planned_end_date}
                                actualValue={canEditChapterActual ? edit.actual_end_date : actualMeta.actual_end_date}
                                onActualChange={(e) =>
                                  setChapterActualEdits((prev) => ({
                                    ...prev,
                                    [chapterIdStr]: { ...(prev?.[chapterIdStr] || getChapterActualEdit(chapterIdStr)), actual_end_date: e.target.value }
                                  }))
                                }
                                actualDisabled={!canEditChapterActual || saveActualLoading || planLoading}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <CompletionCell
                                plannedHours={plannedMeta.planned_hours}
                                actualHours={actualMeta.actual_hours}
                                backendPercentage={planMaps.chapterMap?.[chapterIdStr]?.completion_percentage}
                                backendStatus={planMaps.chapterMap?.[chapterIdStr]?.status}
                              />
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
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Hours</th>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Start</th>
                                          <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">End</th>
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
                                          const canEditTopicActual = !hasSubtopics;
                                          const plannedTopic = computePlannedTopicMeta(topicIdStr);
                                          const actualTopic = computeActualTopicMeta(topicIdStr);
                                          const topicEdit = getTopicActualEdit(topicIdStr);

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
                                                  <DualNumberCell
                                                    plannedValue={plannedTopic.planned_hours}
                                                    actualValue={canEditTopicActual ? topicEdit.actual_hours : actualTopic.actual_hours}
                                                    onActualChange={(e) =>
                                                      setTopicActualEdits((prev) => ({
                                                        ...prev,
                                                        [topicIdStr]: { ...(prev?.[topicIdStr] || getTopicActualEdit(topicIdStr)), actual_hours: e.target.value }
                                                      }))
                                                    }
                                                    actualDisabled={!canEditTopicActual || saveActualLoading || planLoading}
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <DualDateCell
                                                    plannedValue={plannedTopic.planned_start_date}
                                                    actualValue={canEditTopicActual ? topicEdit.actual_start_date : actualTopic.actual_start_date}
                                                    onActualChange={(e) =>
                                                      setTopicActualEdits((prev) => ({
                                                        ...prev,
                                                        [topicIdStr]: {
                                                          ...(prev?.[topicIdStr] || getTopicActualEdit(topicIdStr)),
                                                          actual_start_date: e.target.value
                                                        }
                                                      }))
                                                    }
                                                    actualDisabled={!canEditTopicActual || saveActualLoading || planLoading}
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <DualDateCell
                                                    plannedValue={plannedTopic.planned_end_date}
                                                    actualValue={canEditTopicActual ? topicEdit.actual_end_date : actualTopic.actual_end_date}
                                                    onActualChange={(e) =>
                                                      setTopicActualEdits((prev) => ({
                                                        ...prev,
                                                        [topicIdStr]: { ...(prev?.[topicIdStr] || getTopicActualEdit(topicIdStr)), actual_end_date: e.target.value }
                                                      }))
                                                    }
                                                    actualDisabled={!canEditTopicActual || saveActualLoading || planLoading}
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <CompletionCell
                                                    plannedHours={plannedTopic.planned_hours}
                                                    actualHours={actualTopic.actual_hours}
                                                    backendPercentage={planMaps.topicMap?.[topicIdStr]?.completion_percentage}
                                                    backendStatus={planMaps.topicMap?.[topicIdStr]?.status}
                                                  />
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
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Hours</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Start</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">End</th>
                                                              <th className="px-4 py-2 text-left text-xs font-bold text-secondary-500 uppercase tracking-wider">Completion</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-secondary-200 bg-white">
                                                            {(subtopicsByTopicId[topicIdStr] || []).map((st) => {
                                                              const subId = st?.subtopic_id ?? st?.subtopicId ?? st?.id ?? null;
                                                              const subIdStr = String(subId || '').trim();
                                                              const stTitle =
                                                                String(st?.subtopic_title ?? st?.subtopicTitle ?? '').trim() || `Subtopic #${subIdStr || '—'}`;
                                                              const plannedSub = computePlannedSubtopicMeta(subIdStr);
                                                              const stEdit = getSubtopicActualEdit(subIdStr);
                                                              return (
                                                                <tr key={subIdStr || stTitle} className="bg-emerald-50/30 hover:bg-emerald-100/40">
                                                                  <td className="px-4 py-2 text-sm font-medium text-secondary-900">{stTitle}</td>
                                                                  <td className="px-4 py-2">
                                                                    <DualNumberCell
                                                                      plannedValue={plannedSub.planned_hours}
                                                                      actualValue={stEdit.actual_hours}
                                                                      onActualChange={(e) =>
                                                                        setSubtopicActualEdits((prev) => ({
                                                                          ...prev,
                                                                          [subIdStr]: { ...(prev?.[subIdStr] || getSubtopicActualEdit(subIdStr)), actual_hours: e.target.value }
                                                                        }))
                                                                      }
                                                                      actualDisabled={saveActualLoading || planLoading}
                                                                    />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                    <DualDateCell
                                                                      plannedValue={plannedSub.planned_start_date}
                                                                      actualValue={stEdit.actual_start_date}
                                                                      onActualChange={(e) =>
                                                                        setSubtopicActualEdits((prev) => ({
                                                                          ...prev,
                                                                          [subIdStr]: {
                                                                            ...(prev?.[subIdStr] || getSubtopicActualEdit(subIdStr)),
                                                                            actual_start_date: e.target.value
                                                                          }
                                                                        }))
                                                                      }
                                                                      actualDisabled={saveActualLoading || planLoading}
                                                                    />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                    <DualDateCell
                                                                      plannedValue={plannedSub.planned_end_date}
                                                                      actualValue={stEdit.actual_end_date}
                                                                      onActualChange={(e) =>
                                                                        setSubtopicActualEdits((prev) => ({
                                                                          ...prev,
                                                                          [subIdStr]: { ...(prev?.[subIdStr] || getSubtopicActualEdit(subIdStr)), actual_end_date: e.target.value }
                                                                        }))
                                                                      }
                                                                      actualDisabled={saveActualLoading || planLoading}
                                                                    />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                    <CompletionCell
                                                                      plannedHours={plannedSub.planned_hours}
                                                                      actualHours={stEdit.actual_hours}
                                                                      backendPercentage={planMaps.subtopicMap?.[subIdStr]?.completion_percentage}
                                                                      backendStatus={planMaps.subtopicMap?.[subIdStr]?.status}
                                                                    />
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
