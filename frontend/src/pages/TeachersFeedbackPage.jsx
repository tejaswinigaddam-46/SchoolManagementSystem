import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Book,
  BookOpen,
  Bot,
  Brain,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Info,
  Lightbulb,
  ListTodo,
  Menu,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  User,
  XCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import conversationService from '../services/conversationService';
import questionService from '../services/questionService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CURRICULUM_BOOKS = [
  { value: 'GOV_SSC_ENGLISH', label: 'SSC English' },
  { value: 'GOV_SSC_PHYSICS', label: 'SSC Physics' },
  { value: 'GOV_SSC_CHEMISTRY', label: 'SSC Chemistry' }
];

const MarkdownFallback = ({ text }) => {
  if (!text) return null;

  const renderTable = (lines, startIdx) => {
    const tableLines = [];
    let i = startIdx;
    while (i < lines.length && (lines[i].includes('|') || lines[i].trim().startsWith('|-'))) {
      tableLines.push(lines[i]);
      i++;
    }

    if (tableLines.length < 2) return null;

    const headers = tableLines[0].split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
    const rows = tableLines.slice(2).map(row =>
      row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
    );

    return {
      element: (
        <div className="my-4 overflow-x-auto border border-secondary-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-100">
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-secondary-50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 text-sm text-secondary-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
      nextIdx: i - 1
    };
  };

  const formatInline = (value) => {
    if (!value) return value;
    let html = value.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-secondary-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/<b[^>]*>/gi, '<strong class="font-bold text-secondary-900">')
      .replace(/<\/b>/gi, '</strong>')
      .replace(/<strong[^>]*>/gi, '<strong class="font-bold text-secondary-900">');
    return html;
  };

  const lines = text.split('\n');
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('<table')) {
      let tableHtml = '';
      let j = i;
      while (j < lines.length) {
        tableHtml += lines[j] + '\n';
        if (lines[j].includes('</table>')) break;
        j++;
      }

      if (tableHtml.includes('</table>')) {
        const hasThead = tableHtml.includes('<thead');
        const rows = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

        elements.push(
          <div key={i} className="my-4 overflow-x-auto border border-secondary-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-secondary-200">
              <tbody className="bg-white divide-y divide-secondary-100">
                {rows.map((row, rowIdx) => {
                  const isHeaderRow = row.includes('<th') || (rowIdx === 0 && hasThead);
                  const cells = row.match(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || [];

                  return (
                    <tr key={rowIdx} className={isHeaderRow ? "bg-secondary-50" : "hover:bg-secondary-50 transition-colors"}>
                      {cells.map((cell, cellIdx) => {
                        const cellContent = cell.replace(/<(?:th|td)[^>]*>/i, '').replace(/<\/(?:th|td)>/i, '').trim();
                        return isHeaderRow ? (
                          <th key={cellIdx} className="px-4 py-3 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">
                            {formatInline(cellContent)}
                          </th>
                        ) : (
                          <td key={cellIdx} className="px-4 py-3 text-sm text-secondary-700">
                            {formatInline(cellContent)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        i = j;
        continue;
      }
    }

    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
      const table = renderTable(lines, i);
      if (table) {
        elements.push(<React.Fragment key={i}>{table.element}</React.Fragment>);
        i = table.nextIdx;
        continue;
      }
    }

    if (line.startsWith('###')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-secondary-900 mt-6 mb-2 border-b border-secondary-100 pb-1">{line.replace('###', '').trim()}</h3>);
      continue;
    }
    if (line.startsWith('##')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-secondary-900 mt-8 mb-3">{line.replace('##', '').trim()}</h2>);
      continue;
    }

    if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•') || line.trim().startsWith('<li>') || line.includes('<li>')) {
      const content = line.trim().startsWith('<li>') || line.includes('<li>')
        ? line.replace(/<li[^>]*>/gi, '').replace(/<\/li>/gi, '').trim()
        : line.replace(/^[\s]*[-*•]\s*/, '').trim();

      elements.push(
        <div key={i} className="flex gap-3 pl-2 py-0.5">
          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 shadow-sm" />
          <span
            className="text-secondary-700"
            dangerouslySetInnerHTML={{ __html: formatInline(content) }}
          />
        </div>
      );
      continue;
    }

    if (!line.trim() || line.trim() === '<ul>' || line.trim() === '</ul>' || line.trim() === '<ol>' || line.trim() === '</ol>') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    elements.push(
      <p
        key={i}
        className="text-secondary-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatInline(line) }}
      />
    );
  }

  return <div className="space-y-3">{elements}</div>;
};

const QuizQuestion = ({ questionData, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
      onAnswer?.(selectedOption);
    }
  };

  const isCorrect = selectedOption === questionData.correct_answer;

  return (
    <div className="bg-white border border-secondary-100 rounded-xl p-4 space-y-4 shadow-sm">
      <h4 className="font-medium text-secondary-900">{questionData.question}</h4>

      <div className="space-y-2">
        {questionData.options.map((option) => (
          <button
            key={option.id}
            onClick={() => !isSubmitted && setSelectedOption(option.id)}
            disabled={isSubmitted}
            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
              selectedOption === option.id
                ? isSubmitted
                  ? isCorrect
                    ? 'bg-success-50 border-success-500 text-success-700'
                    : 'bg-error-50 border-error-500 text-error-700'
                  : 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-secondary-50 border-secondary-200 text-secondary-700 hover:border-primary-300'
            } ${isSubmitted && option.id === questionData.correct_answer ? 'bg-success-50 border-success-500 text-success-700' : ''}`}
          >
            <span>{option.text}</span>
            {isSubmitted && option.id === questionData.correct_answer && (
              <CheckCircle2 className="w-5 h-5 text-success-500" />
            )}
            {isSubmitted && selectedOption === option.id && option.id !== questionData.correct_answer && (
              <XCircle className="w-5 h-5 text-error-500" />
            )}
          </button>
        ))}
      </div>

      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null}
          className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
        >
          Submit Answer
        </button>
      ) : (
        <div className={`p-4 rounded-lg text-sm w-full ${isCorrect ? 'bg-success-50 text-success-800' : 'bg-error-50 text-error-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="font-bold uppercase tracking-wider text-[10px]">{isCorrect ? 'Correct Answer' : 'Incorrect Answer'}</span>
          </div>
          <div className="text-sm leading-relaxed">
            <MarkdownFallback text={questionData.explanation} />
          </div>
        </div>
      )}
    </div>
  );
};

const StructuredAIResponse = ({ data, fallbackText, quizConversationId, quizKeyPrefix, onQuizAnswered }) => {
  if (!data) return <MarkdownFallback text={fallbackText} />;

  if (data.status === 'refused') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start animate-in fade-in duration-500">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-amber-900 text-sm leading-relaxed">
          {data.message || "I'm here to help you learn your subject. Let's focus on your lesson."}
        </div>
      </div>
    );
  }

  const ensureObject = (val) => {
    if (!val) return null;
    if (typeof val === 'string' && (val.includes('{') || val.includes('['))) {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
    return val;
  };

  const topic_breakdown = ensureObject(data.topic_breakdown);
  const current_subtopic = data.current_subtopic;
  const textbookPoints = ensureObject(data.textbook_points);
  const simpleExplanation = data.simple_explanation;
  const example = data.example;
  const memory_trick = data.memory_trick;
  const why_it_works = data.why_it_works;
  const practice = ensureObject(data.practice);
  const next_step = data.next_step;

  const hasContent =
    textbookPoints ||
    simpleExplanation ||
    example ||
    (practice && practice.length > 0) ||
    (topic_breakdown && topic_breakdown.length > 0) ||
    current_subtopic ||
    next_step ||
    memory_trick ||
    why_it_works;

  if (!hasContent) {
    return <MarkdownFallback text={fallbackText || data.message || data.answer} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {data.message && (data.message !== fallbackText) && (
        <div className="text-secondary-800 leading-relaxed mb-4">
          <MarkdownFallback text={data.message} />
        </div>
      )}

      {(current_subtopic || (topic_breakdown && topic_breakdown.length > 0)) && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          {Array.isArray(topic_breakdown) && topic_breakdown.map((topic, idx) => (
            topic && (
              <React.Fragment key={idx}>
                <span className="text-secondary-500">{topic}</span>
                <ChevronRight className="w-3 h-3 text-secondary-300" />
              </React.Fragment>
            )
          ))}
          {current_subtopic && <Badge color="primary" variant="soft">{current_subtopic}</Badge>}
        </div>
      )}

      {(textbookPoints || simpleExplanation) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-primary-600 font-semibold">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-lg">{current_subtopic || "Concept Overview"}</h3>
          </div>
          <div className="bg-white border border-secondary-100 rounded-2xl p-5 shadow-sm space-y-4">
            {simpleExplanation && (
              <div className="text-secondary-800 leading-relaxed text-sm border-b border-secondary-50 pb-4 mb-4">
                <MarkdownFallback text={simpleExplanation} />
              </div>
            )}

            {textbookPoints && Array.isArray(textbookPoints) && (
              <ul className="space-y-3">
                {textbookPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-3 text-secondary-700">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                    <div className="text-sm leading-relaxed flex-1">
                      {typeof point === 'string' ? point : JSON.stringify(point)}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {example && (
              <div className="bg-secondary-50 rounded-xl p-4 border border-secondary-100 mt-4">
                <div className="flex items-center gap-2 text-secondary-700 font-bold text-xs uppercase tracking-wider mb-2">
                  <ClipboardList className="w-4 h-4" />
                  Example
                </div>
                <div className="text-sm text-secondary-800 leading-relaxed">
                  <MarkdownFallback text={example} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {memory_trick && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    Memory Trick
                  </div>
                  <div className="text-sm text-amber-900 leading-relaxed italic">
                    {memory_trick}
                  </div>
                </div>
              )}
              {why_it_works && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
                    <Lightbulb className="w-4 h-4" />
                    Why it works
                  </div>
                  <div className="text-sm text-blue-900 leading-relaxed">
                    {why_it_works}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {practice && Array.isArray(practice) && practice.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <Brain className="w-5 h-5" />
            <h3 className="text-lg">Quick Practice</h3>
          </div>
          <div className="space-y-4">
            {practice.map((q, idx) => {
              const keyBase = String(quizKeyPrefix ?? '').trim();
              const quizKey = keyBase ? `${keyBase}:${idx}` : `quiz:${idx}`;
              return (
                <QuizQuestion
                  key={quizKey}
                  questionData={q}
                  index={idx}
                  onAnswer={() => onQuizAnswered?.({ conversationId: quizConversationId, quizKey })}
                />
              );
            })}
          </div>
        </section>
      )}

      {next_step && (
        <div className="bg-secondary-50 border border-secondary-100 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-secondary-200 p-2 rounded-lg">
            <ArrowRight className="w-4 h-4 text-secondary-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">Next Step</p>
            <p className="text-sm text-secondary-800">{next_step}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const TeachersFeedbackPage = ({ selectedBook }) => {
  const { getUserName } = useAuth();
  const studentUsername = String(getUserName?.() || '').trim();

  const [teacherSelectedBook, setTeacherSelectedBook] = useState(String(selectedBook ?? '').trim());
  const [teacherMessages, setTeacherMessages] = useState([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [teacherIsLoading, setTeacherIsLoading] = useState(false);
  const [teacherLoadingStatus, setTeacherLoadingStatus] = useState('');
  const [teacherConversationId, setTeacherConversationId] = useState(null);
  const [teacherSubtopicConversations, setTeacherSubtopicConversations] = useState({});
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

  const [teacherFeedbackStatus, setTeacherFeedbackStatus] = useState({
    todo: '',
    inProgress: '',
    completed: ''
  });

  const [teacherProgressOptions, setTeacherProgressOptions] = useState({
    todo: [],
    inProgress: [],
    completed: []
  });

  const [teacherProgressLoading, setTeacherProgressLoading] = useState(false);
  const [teacherProgressError, setTeacherProgressError] = useState('');
  const [answeredQuizKeysByConversation, setAnsweredQuizKeysByConversation] = useState({});
  const [teacherChatDisabledByConversation, setTeacherChatDisabledByConversation] = useState({});
  const [markAsCompletedLoading, setMarkAsCompletedLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setTeacherSelectedBook(String(selectedBook ?? '').trim());
  }, [selectedBook]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teacherMessages]);

  const normalizeProgressStatus = (status) => {
    const raw = String(status || '').trim();
    const compact = raw.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (compact === 'todo' || compact === 'yettostart') return 'TODO';
    if (compact === 'inprogress' || compact === 'learning') return 'InProgress';
    if (compact === 'completed' || compact === 'complete') return 'completed';
    return raw || 'Unknown';
  };

  const findStructuredData = (obj, depth = 0) => {
    if (!obj || depth > 5) return null;

    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      try {
        const direct = JSON.parse(trimmed);
        const result = findStructuredData(direct, depth + 1);
        if (result) return result;
      } catch (e) {}

      try {
        const jsonMatches = trimmed.match(/\{[\s\S]*?\}/g);
        if (jsonMatches) {
          for (const candidate of jsonMatches) {
            try {
              const parsed = JSON.parse(candidate);
              const result = findStructuredData(parsed, depth + 1);
              if (result) return result;
            } catch (e) {}
          }
        }
      } catch (e) {}
      return null;
    }

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = findStructuredData(item, depth + 1);
          if (result) return result;
        }
        return null;
      }

      const targetFields = ['status', 'practice', 'topic_breakdown', 'textbook_points', 'current_subtopic', 'simple_explanation'];
      const hasTargetField = targetFields.some(field => obj[field] !== undefined);
      if (hasTargetField) return obj;

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const val = obj[key];
          if (val && (typeof val === 'object' || (typeof val === 'string' && val.includes('{')))) {
            const result = findStructuredData(val, depth + 1);
            if (result) return result;
          }
        }
      }
    }
    return null;
  };

  const fetchTeacherProgress = async (book) => {
    if (!studentUsername || !book) return;
    setTeacherProgressLoading(true);
    setTeacherProgressError('');
    try {
      // here commenting
      const response = await questionService.getQuestionsProgress({
        studentusername: studentUsername,
        book
      });
      const rows =
        Array.isArray(response) ? response :
        Array.isArray(response?.data) ? response.data :
        Array.isArray(response?.results) ? response.results :
        Array.isArray(response?.items) ? response.items :
        Array.isArray(response?.progress) ? response.progress :
        Array.isArray(response?.data?.data) ? response.data.data :
        [];
      //const rows = [];

      const todo = [];
      const inProgress = [];
      const completed = [];
      const conversationsBySubtopicId = {};

      for (const row of rows) {
        const normalized = normalizeProgressStatus(row?.status);
        const questionSubtopicsId =
          row?.question_subtopics_id ??
          row?.question_subtopic_id ??
          row?.subtopic_id ??
          row?.question_subtopic_progress_id ??
          row?.id ??
          null;
        const questionId = row?.question_id ?? null;
        const label = String(
          row?.question_subtopic_name ??
          row?.question_subtopics_name ??
          row?.subtopic_name ??
          row?.subtopic ??
          row?.question_name ??
          row?.question_id ??
          'Question'
        ).trim();
        const conversationIdRaw =
          row?.conversation_id ??
          row?.conversationId ??
          row?.conversationID ??
          row?.chat_conversation_id ??
          row?.chat_id ??
          row?.conversation?.id ??
          null;
        const conversationId = String(conversationIdRaw ?? '').trim() || null;

        const option = {
          value: String(questionSubtopicsId ?? questionId ?? ''),
          questionSubtopicsId: String(questionSubtopicsId ?? ''),
          questionId: String(questionId ?? ''),
          label,
          conversationId
        };
        if (!option.value) continue;

        if (option.questionSubtopicsId && conversationId) {
          conversationsBySubtopicId[option.questionSubtopicsId] = conversationId;
        }

        if (normalized === 'TODO') todo.push(option);
        else if (normalized === 'InProgress') inProgress.push(option);
        else if (normalized === 'completed') completed.push(option);
      }

      setTeacherProgressOptions({ todo, inProgress, completed });
      if (Object.keys(conversationsBySubtopicId).length > 0) {
        setTeacherSubtopicConversations((prev) => ({ ...prev, ...conversationsBySubtopicId }));
      }
    } catch (error) {
      setTeacherProgressOptions({ todo: [], inProgress: [], completed: [] });
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch questions progress';
      setTeacherProgressError(message);
      toast.error(message);
    } finally {
      setTeacherProgressLoading(false);
    }
  };

  useEffect(() => {
    if (!teacherSelectedBook) return;
    if (!studentUsername) {
      setTeacherProgressOptions({ todo: [], inProgress: [], completed: [] });
      setTeacherProgressError('Username not available in session');
      return;
    }
    fetchTeacherProgress(teacherSelectedBook);
  }, [teacherSelectedBook, studentUsername]);

  useEffect(() => {
    setTeacherFeedbackStatus((prev) => {
      const next = { ...prev };
      if (next.todo && !teacherProgressOptions.todo.some((o) => o.value === next.todo)) next.todo = '';
      if (next.inProgress && !teacherProgressOptions.inProgress.some((o) => o.value === next.inProgress)) next.inProgress = '';
      if (next.completed && !teacherProgressOptions.completed.some((o) => o.value === next.completed)) next.completed = '';
      return next;
    });
  }, [teacherProgressOptions]);

  const selectedInProgressOption =
    teacherFeedbackStatus.inProgress
      ? teacherProgressOptions.inProgress.find((o) => o.value === teacherFeedbackStatus.inProgress)
      : null;
  const selectedTodoOption =
    teacherFeedbackStatus.todo ? teacherProgressOptions.todo.find((o) => o.value === teacherFeedbackStatus.todo) : null;
  const selectedCompletedOption =
    teacherFeedbackStatus.completed
      ? teacherProgressOptions.completed.find((o) => o.value === teacherFeedbackStatus.completed)
      : null;

  const activeTeacherOption = selectedInProgressOption || selectedTodoOption || selectedCompletedOption;
  const activeTeacherSubtopicId = String(activeTeacherOption?.questionSubtopicsId ?? '').trim();
  const activeTeacherQuestionId = String(activeTeacherOption?.questionId ?? '').trim();
  const activeTeacherConversationId =
    String(activeTeacherOption?.conversationId ?? '').trim() ||
    (activeTeacherSubtopicId ? String(teacherSubtopicConversations?.[activeTeacherSubtopicId] ?? '').trim() : '') ||
    '';
  const conversationIdToUse = activeTeacherConversationId || String(teacherConversationId ?? '').trim() || null;
  const isTeacherConversationDisabled = Boolean(conversationIdToUse && teacherChatDisabledByConversation?.[conversationIdToUse]);

  const toPositiveIntOrNull = (val) => {
    const raw = String(val ?? '').trim();
    if (!raw) return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    const intVal = Math.trunc(num);
    return intVal > 0 ? intVal : null;
  };

  const coerceArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return null;
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const getQuizKeysForConversation = (convId, msgs) => {
    const id = String(convId ?? '').trim();
    if (!id || !Array.isArray(msgs)) return [];
    const keys = [];
    for (const msg of msgs) {
      if (!msg || msg.sender !== 'ai' || !msg.structuredData) continue;
      const practiceArr = coerceArray(msg.structuredData.practice);
      if (!practiceArr || practiceArr.length === 0) continue;
      for (let i = 0; i < practiceArr.length; i += 1) {
        keys.push(`${id}:${msg.id}:${i}`);
      }
    }
    return keys;
  };

  const activeTeacherQuizKeys = conversationIdToUse ? getQuizKeysForConversation(conversationIdToUse, teacherMessages) : [];
  const answeredForActiveConversation = (conversationIdToUse && answeredQuizKeysByConversation?.[conversationIdToUse]) || {};
  const allActiveTeacherQuizzesAnswered =
    activeTeacherQuizKeys.length > 0 && activeTeacherQuizKeys.every((k) => Boolean(answeredForActiveConversation?.[k]));

  const showMarkAsCompletedButton =
    teacherSelectedBook &&
    Boolean(selectedInProgressOption) &&
    activeTeacherSubtopicId &&
    conversationIdToUse &&
    allActiveTeacherQuizzesAnswered &&
    !isTeacherConversationDisabled;

  const handleQuizAnswered = ({ conversationId, quizKey }) => {
    const id = String(conversationId ?? '').trim();
    const key = String(quizKey ?? '').trim();
    if (!id || !key) return;
    setAnsweredQuizKeysByConversation((prev) => {
      const existingForConversation = prev?.[id] || {};
      if (existingForConversation[key]) return prev;
      return {
        ...prev,
        [id]: {
          ...existingForConversation,
          [key]: true
        }
      };
    });
  };

  const handleMarkAsCompleted = async () => {
    if (!activeTeacherSubtopicId || !conversationIdToUse) return;
    if (markAsCompletedLoading) return;
    setMarkAsCompletedLoading(true);
    try {
      // here commenting
      await questionService.updateQuestionSubtopicProgress(activeTeacherSubtopicId, 'completed')
      setTeacherChatDisabledByConversation((prev) => ({
        ...prev,
        [conversationIdToUse]: true
      }));
      toast.success('Marked as completed');
      await fetchTeacherProgress(teacherSelectedBook);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update progress';
      toast.error(message);
    } finally {
      setMarkAsCompletedLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || !window.confirm('Delete this message?')) return;
    try {
      // here commenting
      await conversationService.deleteMessage(messageId);
      toast.success('Message deleted');
      setTeacherMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleStartInProgressLearning = async (subtopicOrOption) => {
    const option = subtopicOrOption && typeof subtopicOrOption === 'object' ? subtopicOrOption : null;
    const questionSubtopicsId = String(option?.questionSubtopicsId ?? '').trim();
    const raw = String(option?.label ?? subtopicOrOption ?? '').trim();
    if (!raw) return;
    if (!teacherSelectedBook) {
      toast.error('Please select a curriculum book first');
      return;
    }

    const cleaned = raw.replace(/^topic\s*:\s*/i, '').trim();
    const questionText = `Topic:${cleaned || raw}`;

    setTeacherIsLoading(true);
    setTeacherLoadingStatus('Fetching AI response...');

    try {
      const existingConversationId =
        String(option?.conversationId ?? '').trim() ||
        (questionSubtopicsId ? String(teacherSubtopicConversations?.[questionSubtopicsId] ?? '').trim() : '') ||
        null;

      const result = await conversationService.ask({
        question: questionText,
        curriculum_book_name: teacherSelectedBook,
        conversation_id: existingConversationId,
        title: cleaned || raw || null,
        question_id: toPositiveIntOrNull(option?.questionId),
        question_subtopic_id: toPositiveIntOrNull(questionSubtopicsId) || null
      });

      const conversationId = String(result?.conversation_id ?? existingConversationId ?? '').trim() || null;
      if (conversationId) setTeacherConversationId(conversationId);
      if (questionSubtopicsId && conversationId) {
        setTeacherSubtopicConversations((prev) => ({ ...prev, [questionSubtopicsId]: conversationId }));
      }

      const userMsg = result?.user_message || null;
      const assistantMsg = result?.assistant_message || null;

      const userTimestamp = userMsg?.created_at ? new Date(userMsg.created_at) : new Date();
      const assistantTimestamp = assistantMsg?.created_at ? new Date(assistantMsg.created_at) : new Date();

      const userMessage = {
        id: userMsg?.id || Date.now(),
        text: String(userMsg?.content ?? questionText),
        sender: 'user',
        timestamp: userTimestamp,
        conversationId
      };

      const rawAnswer = result?.ai?.answer ?? assistantMsg?.content ?? '';
      let parsedAnswer = rawAnswer;
      if (typeof rawAnswer === 'string') {
        const trimmed = rawAnswer.trim();
        if (trimmed) {
          try {
            parsedAnswer = JSON.parse(trimmed);
          } catch (e) {
            parsedAnswer = rawAnswer;
          }
        }
      }

      const structuredData = findStructuredData(parsedAnswer);
      const assistantText =
        typeof parsedAnswer === 'string'
          ? parsedAnswer
          : parsedAnswer?.message || parsedAnswer?.answer || parsedAnswer?.response || parsedAnswer?.text || '';
      const assistantMessage = {
        id: assistantMsg?.id || Date.now() + 1,
        text: assistantText || (typeof rawAnswer === 'string' ? rawAnswer : ''),
        sender: 'ai',
        timestamp: assistantTimestamp,
        structuredData,
        rawResponse: typeof parsedAnswer === 'object' ? JSON.stringify(parsedAnswer, null, 2) : String(parsedAnswer ?? ''),
        conversationId
      };

      setTeacherMessages((prev) => [...prev, userMessage, assistantMessage]);

      if (questionSubtopicsId) {
        try {
          setTeacherLoadingStatus('Updating progress...');
          await questionService.updateQuestionSubtopicProgress(questionSubtopicsId, 'learning')
        } catch (error) {}
      }

      setTeacherLoadingStatus('Refreshing progress...');
      await fetchTeacherProgress(teacherSelectedBook);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to get response from AI. Please try again.';
      toast.error(message);
      setTeacherMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error processing your request.',
          sender: 'ai',
          isError: true,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setTeacherIsLoading(false);
      setTeacherLoadingStatus('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!teacherInput.trim() || teacherIsLoading) return;
    if (conversationIdToUse && teacherChatDisabledByConversation?.[conversationIdToUse]) return;
    if (!teacherSelectedBook) {
      toast.error('Please select a curriculum book first');
      return;
    }

    const userMessageText = teacherInput;
    setTeacherInput('');
    setTeacherIsLoading(true);
    setTeacherLoadingStatus('Saving message...');

    try {
      const statuses = [];
      if (teacherFeedbackStatus.todo) {
        const label = teacherProgressOptions.todo.find(o => o.value === teacherFeedbackStatus.todo)?.label || teacherFeedbackStatus.todo;
        statuses.push(`TODO: ${label}`);
      }
      if (teacherFeedbackStatus.inProgress) {
        const label = teacherProgressOptions.inProgress.find(o => o.value === teacherFeedbackStatus.inProgress)?.label || teacherFeedbackStatus.inProgress;
        statuses.push(`In Progress: ${label}`);
      }
      if (teacherFeedbackStatus.completed) {
        const label = teacherProgressOptions.completed.find(o => o.value === teacherFeedbackStatus.completed)?.label || teacherFeedbackStatus.completed;
        statuses.push(`Completed: ${label}`);
      }

      const enhancedQuery =
        statuses.length > 0
          ? `Context: Current student progress for ${teacherSelectedBook}: ${statuses.join(', ')}.\n\nQuestion: ${userMessageText}`
          : userMessageText;

      setTeacherLoadingStatus('Fetching AI response...');

      const result = await conversationService.ask({
        question: enhancedQuery,
        curriculum_book_name: teacherSelectedBook,
        conversation_id: conversationIdToUse,
        title: userMessageText || null,
        question_id: toPositiveIntOrNull(activeTeacherQuestionId),
        question_subtopic_id: toPositiveIntOrNull(activeTeacherSubtopicId) || null
      });

      const conversationId = String(result?.conversation_id ?? conversationIdToUse ?? '').trim() || null;
      if (conversationId) setTeacherConversationId(conversationId);

      const userMsg = result?.user_message || null;
      const assistantMsg = result?.assistant_message || null;
      const userTimestamp = userMsg?.created_at ? new Date(userMsg.created_at) : new Date();
      const assistantTimestamp = assistantMsg?.created_at ? new Date(assistantMsg.created_at) : new Date();

      const userMessage = {
        id: userMsg?.id || Date.now(),
        text: String(userMsg?.content ?? userMessageText),
        sender: 'user',
        timestamp: userTimestamp,
        conversationId
      };

      const rawAnswer = result?.ai?.answer ?? assistantMsg?.content ?? '';
      let parsedAnswer = rawAnswer;
      if (typeof rawAnswer === 'string') {
        const trimmed = rawAnswer.trim();
        if (trimmed) {
          try {
            parsedAnswer = JSON.parse(trimmed);
          } catch (err) {
            parsedAnswer = rawAnswer;
          }
        }
      }

      const structuredData = findStructuredData(parsedAnswer);
      const assistantText =
        typeof parsedAnswer === 'string'
          ? parsedAnswer
          : parsedAnswer?.message || parsedAnswer?.answer || parsedAnswer?.response || parsedAnswer?.text || '';

      const assistantMessage = {
        id: assistantMsg?.id || Date.now() + 1,
        text: assistantText || (typeof rawAnswer === 'string' ? rawAnswer : ''),
        sender: 'ai',
        timestamp: assistantTimestamp,
        structuredData,
        rawResponse: typeof parsedAnswer === 'object' ? JSON.stringify(parsedAnswer, null, 2) : String(parsedAnswer ?? ''),
        conversationId
      };

      setTeacherMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to get response from AI. Please try again.';
      toast.error(message);
      setTeacherMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: userMessageText,
          sender: 'user',
          timestamp: new Date(),
          conversationId: conversationIdToUse || null
        },
        {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error processing your request.',
          sender: 'ai',
          isError: true,
          timestamp: new Date(),
          conversationId: conversationIdToUse || null
        }
      ]);
    } finally {
      setTeacherIsLoading(false);
      setTeacherLoadingStatus('');
    }
  };

  const startOptionForCard = selectedInProgressOption || selectedTodoOption || selectedCompletedOption;

  return (
    <div className="space-y-4 min-h-screen flex flex-col">
      <div className="relative flex flex-1 bg-secondary-50 overflow-hidden rounded-2xl border border-secondary-200 shadow-sm min-h-0">
        {isChatSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm"
            onClick={() => setIsChatSidebarOpen(false)}
          />
        )}

        <div className={`
          fixed inset-y-0 left-0 z-[70] w-[280px] bg-white border-r border-secondary-200 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:shadow-sm md:w-72 md:z-30
          ${isChatSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 md:p-6 border-b border-secondary-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-lg text-white shadow-soft">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-secondary-900 leading-none">Teacher Feed</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                  <span className="text-[10px] text-success-600 font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
            <button
              className="md:hidden p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-full transition-colors"
              onClick={() => setIsChatSidebarOpen(false)}
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest px-2 mb-4">Navigation</div>
            <button
              onClick={() => {
                setTeacherConversationId(null);
                setTeacherMessages([]);
                setTeacherInput('');
                setTeacherLoadingStatus('');
                setTeacherFeedbackStatus({ todo: '', inProgress: '', completed: '' });
                if (window.innerWidth < 768) setIsChatSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg font-medium transition-colors hover:bg-primary-100"
            >
              <Sparkles className="w-4 h-4" />
              New Feedback Session
            </button>
          </div>

          <div className="p-4 border-t border-secondary-100 space-y-4 bg-secondary-50/50">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-secondary-500 mb-2 uppercase tracking-widest">
                <Book className="w-3 h-3" />
                Curriculum Book
              </label>
              <div className="relative">
                <select
                  value={teacherSelectedBook}
                  onChange={(e) => {
                    setTeacherSelectedBook(e.target.value);
                    setTeacherFeedbackStatus({ todo: '', inProgress: '', completed: '' });
                    setTeacherMessages([]);
                    setTeacherConversationId(null);
                    setTeacherInput('');
                    setTeacherLoadingStatus('');
                    if (window.innerWidth < 768) setIsChatSidebarOpen(false);
                  }}
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none transition-all cursor-pointer hover:border-primary-300"
                >
                  <option value="">Select Book</option>
                  {CURRICULUM_BOOKS.map(book => (
                    <option key={book.value} value={book.value}>{book.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
              </div>
              <div className="text-[10px] text-secondary-500 mt-2 px-1">
                Student: <span className="font-medium text-secondary-700">{studentUsername || '-'}</span>
              </div>
              {teacherProgressLoading && (
                <div className="text-[10px] text-secondary-500 mt-2 px-1">Loading topics...</div>
              )}
              {!teacherProgressLoading && teacherProgressError && (
                <div className="text-[10px] text-error-600 mt-2 px-1">{teacherProgressError}</div>
              )}
              {!teacherProgressLoading && !teacherProgressError && (
                <div className="text-[10px] text-secondary-500 mt-2 px-1">
                  Topics: <span className="font-medium text-secondary-700">{teacherProgressOptions.todo.length + teacherProgressOptions.inProgress.length + teacherProgressOptions.completed.length}</span>
                </div>
              )}
            </div>

            {teacherSelectedBook && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-secondary-500 mb-2 uppercase tracking-widest">
                    <ListTodo className="w-3 h-3 text-amber-500" />
                    TODO
                  </label>
                  <div className="relative">
                    <select
                      value={teacherFeedbackStatus.todo}
                      onChange={(e) => setTeacherFeedbackStatus(prev => ({ ...prev, todo: e.target.value }))}
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none transition-all cursor-pointer hover:border-primary-300"
                      disabled={teacherProgressLoading}
                    >
                      <option value="">Select Topic</option>
                      {!teacherProgressLoading && teacherProgressOptions.todo.length === 0 && (
                        <option value="" disabled>No topics</option>
                      )}
                      {teacherProgressOptions.todo.map(opt => (
                        <option key={opt.value} value={opt.value}>{String(opt.label).slice(0, 20)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-secondary-500 mb-2 uppercase tracking-widest">
                    <Clock className="w-3 h-3 text-primary-500" />
                    In Progress
                  </label>
                  <div className="relative">
                    <select
                      value={teacherFeedbackStatus.inProgress}
                      onChange={(e) => setTeacherFeedbackStatus(prev => ({ ...prev, inProgress: e.target.value }))}
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none transition-all cursor-pointer hover:border-primary-300"
                      disabled={teacherProgressLoading}
                    >
                      <option value="">Select Topic</option>
                      {!teacherProgressLoading && teacherProgressOptions.inProgress.length === 0 && (
                        <option value="" disabled>No topics</option>
                      )}
                      {teacherProgressOptions.inProgress.map(opt => (
                        <option key={opt.value} value={opt.value}>{String(opt.label).slice(0, 20)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-secondary-500 mb-2 uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3 text-primary-500" />
                    Completed
                  </label>
                  <div className="relative">
                    <select
                      value={teacherFeedbackStatus.completed}
                      onChange={(e) => setTeacherFeedbackStatus(prev => ({ ...prev, completed: e.target.value }))}
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none transition-all cursor-pointer hover:border-primary-300"
                      disabled={teacherProgressLoading}
                    >
                      <option value="">Select Topic</option>
                      {!teacherProgressLoading && teacherProgressOptions.completed.length === 0 && (
                        <option value="" disabled>No topics</option>
                      )}
                      {teacherProgressOptions.completed.map(opt => (
                        <option key={opt.value} value={opt.value}>{String(opt.label).slice(0, 20)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-2 md:p-4 lg:p-6 overflow-hidden">
            <div className="mb-2 md:mb-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  className="md:hidden p-2.5 bg-secondary-100 rounded-xl text-secondary-600 hover:bg-secondary-200 transition-colors"
                  onClick={() => setIsChatSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600 hidden xs:block">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h1 className="text-base md:text-xl font-bold text-secondary-900 line-clamp-1">
                    {teacherSelectedBook
                      ? `Feedback: ${CURRICULUM_BOOKS.find(b => b.value === teacherSelectedBook)?.label || teacherSelectedBook}`
                      : 'Teacher Feedback Assistant'}
                  </h1>
                  <p className="text-[10px] md:text-xs text-secondary-500 font-medium">Optimize your teaching with AI insights</p>
                </div>
              </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-secondary-50/30 border-secondary-200 rounded-xl md:rounded-2xl shadow-inner">
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
                {teacherMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8 space-y-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-soft border border-secondary-100 text-primary-500">
                      <MessageSquare className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-base md:text-lg font-semibold text-secondary-800">
                        {teacherSelectedBook
                          ? `I'm ready to provide feedback on ${CURRICULUM_BOOKS.find(b => b.value === teacherSelectedBook)?.label || teacherSelectedBook}`
                          : "Welcome to Teacher Feedback Assistant"}
                      </h3>
                      {!teacherSelectedBook && (
                        <p className="text-sm text-secondary-500 mt-2">
                          Please select a curriculum book to get started with teacher feedback
                        </p>
                      )}
                      {teacherSelectedBook && startOptionForCard && !conversationIdToUse && (
                        <div className="mt-6 p-6 bg-white border border-primary-200 rounded-2xl shadow-sm animate-in zoom-in-95 duration-300 max-w-sm mx-auto">
                          <p className="text-secondary-700 font-medium mb-4">
                            Click start to learn about <span className="text-primary-600 font-bold underline decoration-primary-200 underline-offset-4">
                              {startOptionForCard?.label}
                            </span>
                          </p>
                          <button
                            onClick={() => handleStartInProgressLearning(startOptionForCard)}
                            className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                          >
                            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                            Start Learning
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {teacherSelectedBook && selectedInProgressOption && !conversationIdToUse && (
                      <div className="p-4 bg-white border border-primary-200 rounded-2xl shadow-sm max-w-sm mx-auto">
                        <button
                          onClick={() => handleStartInProgressLearning(selectedInProgressOption)}
                          className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                        >
                          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                          Start Learning "{selectedInProgressOption?.label}"
                        </button>
                      </div>
                    )}
                    {teacherMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex gap-2 md:gap-3 ${
                            msg.sender === 'user' ? 'flex-row-reverse max-w-[90%] md:max-w-[80%]' : 'flex-row max-w-[95%] md:max-w-[90%]'
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white ${
                              msg.sender === 'user' ? 'bg-primary-500' : msg.isError ? 'bg-error-500' : 'bg-secondary-600'
                            }`}
                          >
                            {msg.sender === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                          </div>
                          <div
                            className={`p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm text-xs md:text-sm relative group ${
                              msg.sender === 'user'
                                ? 'bg-primary-600 text-white rounded-tr-none'
                                : 'bg-white border border-secondary-100 text-secondary-800 rounded-tl-none w-full'
                            }`}
                          >
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5 ${
                                msg.sender === 'user' ? '-left-8 text-secondary-400' : '-right-8 text-secondary-400'
                              }`}
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {msg.structuredData ? (
                              <StructuredAIResponse
                                data={msg.structuredData}
                                fallbackText={msg.text}
                                quizConversationId={conversationIdToUse || null}
                                quizKeyPrefix={conversationIdToUse ? `${conversationIdToUse}:${msg.id}` : null}
                                onQuizAnswered={handleQuizAnswered}
                              />
                            ) : msg.sender === 'ai' ? (
                              <MarkdownFallback text={msg.text} />
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                            <span
                              className={`text-[9px] md:text-[10px] mt-2 block opacity-60 ${
                                msg.sender === 'user' ? 'text-right' : 'text-left'
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {teacherIsLoading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[90%] md:max-w-[80%] gap-3">
                      <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-secondary-600 text-white">
                        <Bot className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="bg-white border border-secondary-100 p-3 md:p-4 rounded-xl md:rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                        <LoadingSpinner size="sm" color="primary" />
                        <span className="text-xs text-secondary-500 animate-pulse">{teacherLoadingStatus}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 md:p-4 bg-white border-t border-secondary-100">
                {showMarkAsCompletedButton && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={handleMarkAsCompleted}
                      disabled={teacherIsLoading || markAsCompletedLoading}
                      className="w-full py-2.5 px-4 bg-success-600 hover:bg-success-700 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as completed
                    </button>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    type="text"
                    value={teacherInput}
                    onChange={(e) => setTeacherInput(e.target.value)}
                    placeholder="Ask for feedback..."
                    className="w-full pl-4 pr-12 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    disabled={teacherIsLoading || !teacherSelectedBook || isTeacherConversationDisabled}
                  />
                  <button
                    type="submit"
                    disabled={teacherIsLoading || !teacherInput.trim() || !teacherSelectedBook || isTeacherConversationDisabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-center text-secondary-400 mt-2">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachersFeedbackPage;
