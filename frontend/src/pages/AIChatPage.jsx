import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, BookOpen, Lightbulb, 
  Brain, Menu, ClipboardList, ArrowRight, 
  ChevronRight, CheckCircle2, XCircle, Info,
  History, Book, ChevronDown, Trash2
} from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import aiService from '../services/aiService';
import conversationService from '../services/conversationService';
import { toast } from 'react-hot-toast';

const CURRICULUM_BOOKS = [
  { value: 'GOV_SSC_ENGLISH', label: 'SSC English' },
  { value: 'GOV_SSC_PHYSICS', label: 'SSC Physics' },
  { value: 'GOV_SSC_CHEMISTRY', label: 'SSC Chemistry' }
];

const MarkdownFallback = ({ text }) => {
  if (!text) return null;

  // Helper to parse markdown table
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

  // Helper to handle inline formatting (Bold, Italic, and HTML tags)
  const formatInline = (text) => {
    if (!text) return text;
    // Convert markdown bold to HTML
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-secondary-900">$1</strong>');
    // Convert markdown italic to HTML
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    // Ensure <b> and <strong> tags have our classes
    html = html.replace(/<b[^>]*>/gi, '<strong class="font-bold text-secondary-900">')
               .replace(/<\/b>/gi, '</strong>')
               .replace(/<strong[^>]*>/gi, '<strong class="font-bold text-secondary-900">');
    return html;
  };

  const lines = text.split('\n');
  const elements = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // HTML Tables
    if (line.includes('<table')) {
      let tableHtml = '';
      let j = i;
      while (j < lines.length) {
        tableHtml += lines[j] + '\n';
        if (lines[j].includes('</table>')) break;
        j++;
      }
      
      if (tableHtml.includes('</table>')) {
        // Simple regex-based approach to extract table structure for styling
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

    // Markdown Tables
    if (line.includes('|') && i + 1 < lines.length && lines[i+1].includes('|') && lines[i+1].includes('-')) {
      const table = renderTable(lines, i);
      if (table) {
        elements.push(<React.Fragment key={i}>{table.element}</React.Fragment>);
        i = table.nextIdx;
        continue;
      }
    }

    // Headers
    if (line.startsWith('###')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-secondary-900 mt-6 mb-2 border-b border-secondary-100 pb-1">{line.replace('###', '').trim()}</h3>);
      continue;
    }
    if (line.startsWith('##')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-secondary-900 mt-8 mb-3">{line.replace('##', '').trim()}</h2>);
      continue;
    }
    
    // Bullet points (Markdown and HTML <li>)
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

    // Empty line or structural tags
    if (!line.trim() || line.trim() === '<ul>' || line.trim() === '</ul>' || line.trim() === '<ol>' || line.trim() === '</ol>') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
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

/**
 * QuizQuestion Component
 * Handles individual quiz questions with local state for selection and submission.
 */
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

  // Helper to render text with potential bullet points
  const renderFormattedText = (text) => {
    if (!text) return null;
    return <MarkdownFallback text={text} />;
  };

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
            {renderFormattedText(questionData.explanation)}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StructuredAIResponse Component
 * Renders the formatted JSON output from the AI.
 */
const StructuredAIResponse = ({ data, fallbackText }) => {
  if (!data) return <MarkdownFallback text={fallbackText} />;

  // Handle Refused Status
  if (data.status === 'refused') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start animate-in fade-in duration-500">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-amber-900 text-sm leading-relaxed">
          {data.message || "I'm here to help you learn your subject 😊 Let's focus on your lesson."}
        </div>
      </div>
    );
  }

  // HELPER: Try to parse a value if it's a string, otherwise return as is
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

  // Map to the new schema fields
  const topic_breakdown = ensureObject(data.topic_breakdown);
  const current_subtopic = data.current_subtopic;
  const textbookPoints = ensureObject(data.textbook_points);
  const simpleExplanation = data.simple_explanation;
  const example = data.example;
  const memory_trick = data.memory_trick;
  const why_it_works = data.why_it_works;
  const practice = ensureObject(data.practice);
  const next_step = data.next_step;

  // Check if we have anything to render at all
  const hasContent = textbookPoints || simpleExplanation || example || (practice && practice.length > 0) || (topic_breakdown && topic_breakdown.length > 0) || current_subtopic || next_step || memory_trick || why_it_works;

  if (!hasContent) {
    return <MarkdownFallback text={fallbackText || data.message || data.answer} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Introduction/Message if present */}
      {data.message && (data.message !== fallbackText) && (
        <div className="text-secondary-800 leading-relaxed mb-4">
          <MarkdownFallback text={data.message} />
        </div>
      )}

      {/* Topic Header */}
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

      {/* Concept Section */}
      {(textbookPoints || simpleExplanation) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-primary-600 font-semibold">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-lg">{current_subtopic || "Concept Overview"}</h3>
          </div>
          <div className="bg-white border border-secondary-100 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Simple Explanation */}
            {simpleExplanation && (
              <div className="text-secondary-800 leading-relaxed text-sm border-b border-secondary-50 pb-4 mb-4">
                <MarkdownFallback text={simpleExplanation} />
              </div>
            )}

            {/* Textbook Points */}
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
            
            {/* Example Section */}
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

      {/* Practice Section */}
      {practice && Array.isArray(practice) && practice.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <Brain className="w-5 h-5" />
            <h3 className="text-lg">Quick Practice</h3>
          </div>
          <div className="space-y-4">
            {practice.map((q, idx) => (
              <QuizQuestion key={idx} questionData={q} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Next Step */}
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

/**
 * AIChatPage Component
 * Provides a ChatGPT-like interface for interacting with the AI backend.
 */
const AIChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedRecentChat, setSelectedRecentChat] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch recent chats on mount
  useEffect(() => {
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      const chats = await conversationService.listConversations();
      console.log('Recent chats titles:', chats.map(chat => chat.title || 'Untitled Chat'));
      setRecentChats(chats);
      
      // Check if the currently selected chat still exists in the updated list
      if (selectedRecentChat) {
        const chatStillExists = chats.some(chat => chat.id === selectedRecentChat);
        if (!chatStillExists) {
          setSelectedRecentChat('');
        }
      }
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      // Don't show toast on initial load to avoid noise
    }
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRecentChatChange = async (convId) => {
    if (!convId) {
      setSelectedRecentChat('');
      setCurrentConversationId(null);
      setMessages([]);
      return;
    }

    setSelectedRecentChat(convId);
    setCurrentConversationId(convId);
    setIsLoading(true);
    setLoadingStatus('Loading conversation...');

    try {
      const chatMessages = await conversationService.getMessages(convId);
      
      // Transform API messages to UI format
      const formattedMessages = chatMessages.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: new Date(msg.created_at || Date.now()),
        // Try to find structured data if it's an AI message
        structuredData: msg.role === 'assistant' ? findStructuredData(msg.content) : null
      }));

      setMessages(formattedMessages);
      
      // Also set the curriculum if possible
      if (chatMessages.length > 0 && chatMessages[0].curriculum_book_name) {
        setSelectedCurriculum(chatMessages[0].curriculum_book_name);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Helper function to find structured data in text (moved inside component or made accessible)
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

  const handleDeleteConversation = async (convId) => {
    if (!convId || !window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await conversationService.deleteConversation(convId);
      toast.success('Conversation deleted');
      
      // If we're deleting the current conversation, reset state
      if (convId === currentConversationId) {
        setCurrentConversationId(null);
        setSelectedRecentChat('');
        setMessages([]);
      }
      
      // Refresh the list
      fetchRecentChats();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || !window.confirm('Delete this message?')) return;

    try {
      await conversationService.deleteMessage(messageId);
      toast.success('Message deleted');
      
      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input;
    const userMessageId = Date.now();
    const userMessage = {
      id: userMessageId,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingStatus('Saving message...');

    try {
      if (!selectedCurriculum) {
        toast.error('Please select a curriculum book first');
        setIsLoading(false);
        setLoadingStatus('');
        return;
      }

      // 1. Save user message to database
      const userMsgResponse = await conversationService.createMessage({
        content: userMessageText,
        role: 'user',
        conversation_id: currentConversationId,
        curriculum_book_name: selectedCurriculum,
        title: userMessageText.substring(0, 30)
      });

      // Update conversation ID if it was a new conversation
      if (!currentConversationId && userMsgResponse.conversation_id) {
        setCurrentConversationId(userMsgResponse.conversation_id);
        setSelectedRecentChat(userMsgResponse.conversation_id);
        fetchRecentChats(); // Refresh sidebar list
      }

      setLoadingStatus('Fetching AI response...');
      
      // 2. Get AI response
      const response = await aiService.query(userMessageText, selectedCurriculum);
      console.log('Raw AI Response:', response);
      
      setLoadingStatus('Saving AI response...');
      
      let structuredData = findStructuredData(response);
      let textContent = '';

      // Handle the specific "Response: status=..." string format if it's not caught by findStructuredData
      if (!structuredData && typeof response === 'string' && response.includes('status="refused"')) {
        const messageMatch = response.match(/message="(.*?)"/);
        structuredData = {
          status: 'refused',
          message: messageMatch ? messageMatch[1] : "I'm here to help you learn your subject 😊 Let's focus on your lesson."
        };
      }

      if (typeof response === 'string') {
        const trimmed = response.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            textContent = parsed.message || parsed.answer || parsed.response || parsed.text || '';
          } catch (e) {}
        } else {
          textContent = response;
        }
      } else if (typeof response === 'object' && response !== null) {
        textContent = response.message || response.answer || response.response || response.text || '';
      }

      if (structuredData && !textContent) {
        textContent = structuredData.message || structuredData.answer || "Here's your lesson breakdown:";
      }

      if (!textContent) {
        textContent = typeof response === 'string' ? response : "I processed your request but couldn't format the response properly.";
      }

      // Extract summary and title from structured data
      let aiSummary = '';
      let aiTitle = '';
      
      if (structuredData) {
        aiSummary = structuredData.message || structuredData.answer || structuredData.simple_explanation || '';
        aiTitle = structuredData.current_subtopic || 'AI Response';
      }
      
      // 3. Save AI response to database
      await conversationService.createMessage({
        content: typeof response === 'object' ? JSON.stringify(response) : response,
        role: 'assistant',
        conversation_id: currentConversationId || userMsgResponse.conversation_id,
        curriculum_book_name: selectedCurriculum,
        summary: aiSummary.substring(0, 200),
        title: aiTitle.substring(0, 50)
      });

      const assistantMessage = {
        id: Date.now() + 1,
        text: textContent,
        sender: 'ai',
        timestamp: new Date(),
        structuredData: structuredData,
        rawResponse: typeof response === 'object' ? JSON.stringify(response, null, 2) : response
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Query Error:', error);
      toast.error('Failed to get response from AI. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        isError: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-180px)] bg-secondary-50 overflow-hidden rounded-2xl border border-secondary-200 shadow-sm">
      {/* Sidebar - Mobile Overlay Backdrop */}
      {isChatSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm"
          onClick={() => setIsChatSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-[70] w-[280px] bg-white border-r border-secondary-200 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-sm md:w-72 md:z-30
        ${isChatSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 md:p-6 border-b border-secondary-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-lg text-white shadow-soft">
              <Bot className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 leading-none">AI Assistant</h2>
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

        {/* Sidebar Content (Scrollable Area for future items) */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest px-2 mb-4">
            Navigation
          </div>
          <button 
            onClick={() => {
              setCurrentConversationId(null);
              setSelectedRecentChat('');
              setMessages([]);
              if (window.innerWidth < 768) setIsChatSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg font-medium transition-colors hover:bg-primary-100"
          >
            <Sparkles className="w-4 h-4" />
            New Learning Session
          </button>
        </div>

        {/* Sidebar Bottom (Dropdowns) */}
        <div className="p-4 border-t border-secondary-100 space-y-4 bg-secondary-50/50">
          <div>
            <label className="flex items-center gap-2 text-[10px] font-bold text-secondary-500 mb-2 uppercase tracking-widest">
              <Book className="w-3 h-3" />
              Curriculum Book
            </label>
            <div className="relative">
              <select 
                value={selectedCurriculum}
                onChange={(e) => {
                  setSelectedCurriculum(e.target.value);
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-secondary-500 uppercase tracking-widest">
                <History className="w-3 h-3" />
                Recent Chats
              </label>
              {selectedRecentChat && (
                <button 
                  onClick={() => handleDeleteConversation(selectedRecentChat)}
                  className="text-error-500 hover:text-error-600 p-1 rounded-md hover:bg-error-50 transition-colors"
                  title="Delete this conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select 
                value={selectedRecentChat}
                onChange={(e) => {
                  handleRecentChatChange(e.target.value);
                  if (window.innerWidth < 768) setIsChatSidebarOpen(false);
                }}
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none transition-all cursor-pointer hover:border-primary-300"
              >
                <option value="">Select a recent chat</option>
                {recentChats.map(chat => (
                  <option key={chat.id} value={chat.id}>{chat.title || 'Untitled Chat'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-2 md:p-4 lg:p-6 overflow-hidden">
          {/* Header */}
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
                  {selectedCurriculum 
                    ? `${CURRICULUM_BOOKS.find(b => b.value === selectedCurriculum)?.label}`
                    : 'AI Learning Assistant'}
                </h1>
                <p className="text-[10px] md:text-xs text-secondary-500 font-medium">Master your subjects with AI</p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <Card className="flex-1 flex flex-col overflow-hidden bg-secondary-50/30 border-secondary-200 rounded-xl md:rounded-2xl shadow-inner">
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8 space-y-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-soft border border-secondary-100 text-primary-500">
                    <Bot className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-base md:text-lg font-semibold text-secondary-800">
                      {selectedCurriculum 
                        ? `Ask me anything about ${CURRICULUM_BOOKS.find(b => b.value === selectedCurriculum)?.label}`
                        : "Welcome to AI Assistant"}
                    </h3>
                    {!selectedCurriculum && (
                      <p className="text-sm text-secondary-500 mt-2">
                        Please select a book to start new chat or select recent chat to view past chats
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
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
                        {/* Delete Message Button */}
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
                          <StructuredAIResponse data={msg.structuredData} fallbackText={msg.text} />
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
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[90%] md:max-w-[80%] gap-3">
                    <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-secondary-600 text-white">
                      <Bot className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="bg-white border border-secondary-100 p-3 md:p-4 rounded-xl md:rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                      <LoadingSpinner size="sm" color="primary" />
                      <span className="text-xs text-secondary-500 animate-pulse">{loadingStatus}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-white border-t border-secondary-100">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedCurriculum ? "Type your message here..." : "Select a book to start chatting"}
                  className="w-full pl-4 pr-12 py-2.5 md:py-3 bg-secondary-100 border border-secondary-400 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm md:text-base text-secondary-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isLoading || !selectedCurriculum}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !selectedCurriculum}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    !input.trim() || isLoading || !selectedCurriculum
                      ? 'text-secondary-400 cursor-not-allowed'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="text-[9px] md:text-[10px] text-secondary-400 mt-2 text-center">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
