import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, BookOpen, Lightbulb, 
  Brain, HelpCircle, ClipboardList, ArrowRight, 
  ChevronRight, CheckCircle2, XCircle, Info
} from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import aiService from '../services/aiService';
import { toast } from 'react-hot-toast';

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
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingStatus('Fetching API...');

    try {
      const response = await aiService.query(input);
      console.log('Raw AI Response:', response);
      
      setLoadingStatus('Generating markdown...');
      
      let structuredData = null;
      let textContent = '';

      // HELPER: Deep search for a structured object in the response
      const findStructuredData = (obj, depth = 0) => {
        if (!obj || depth > 5) return null; // Prevent infinite recursion
        
        // If it's a string, try to extract JSON
        if (typeof obj === 'string') {
          const trimmed = obj.trim();
          
          // 1. Try direct parse
          try {
            const direct = JSON.parse(trimmed);
            const result = findStructuredData(direct, depth + 1);
            if (result) return result;
          } catch (e) {}

          // 2. Try extracting from markdown or text using regex
          try {
            // Find all potential JSON objects in the string
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

        // If it's an object, check if it's our target structure
        if (typeof obj === 'object' && obj !== null) {
          // If it's an array, check each element
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const result = findStructuredData(item, depth + 1);
              if (result) return result;
            }
            return null;
          }

          // Target fields that identify our structured data
          const targetFields = ['status', 'practice', 'topic_breakdown', 'textbook_points', 'current_subtopic', 'simple_explanation'];
          const hasTargetField = targetFields.some(field => obj[field] !== undefined);
          
          if (hasTargetField) {
            // If it has at least one major target field, we consider it our data
            return obj;
          }
          
          // Recursively search ALL keys in the object
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

      structuredData = findStructuredData(response);

      // Handle the specific "Response: status=..." string format if it's not caught by findStructuredData
      if (!structuredData && typeof response === 'string' && response.includes('status="refused"')) {
        const messageMatch = response.match(/message="(.*?)"/);
        structuredData = {
          status: 'refused',
          message: messageMatch ? messageMatch[1] : "I'm here to help you learn your subject 😊 Let's focus on your lesson."
        };
      }

      // Always try to get a textual message for fallback/accessibility
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

      if (structuredData) {
        console.log('Successfully identified structured data:', structuredData);
        // If we found structured data but still have no text content, use a generic success message
        if (!textContent) {
          textContent = structuredData.message || structuredData.answer || "Here's your lesson breakdown:";
        }
      } else {
        // Fallback to plain text - strictly avoid showing raw JSON
        if (!textContent) {
          textContent = "I processed your request but couldn't format the response properly.";
        }
      }

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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Assistant</h1>
          <p className="text-sm text-secondary-500">Ask me anything about your school management</p>
        </div>
      </div>

      {/* Chat Messages Area */}
      <Card className="flex-1 flex flex-col overflow-hidden bg-secondary-50/30 border-secondary-200">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-soft border border-secondary-100 text-primary-500">
                <Bot className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-secondary-800">Welcome to AI Assistant</h3>
                <p className="text-secondary-500 mt-2">
                  Try asking something like "How to balance a chemical equation?"
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 ${
                    msg.sender === 'user' ? 'flex-row-reverse max-w-[80%]' : 'flex-row max-w-[90%]'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                      msg.sender === 'user' ? 'bg-primary-500' : msg.isError ? 'bg-error-500' : 'bg-secondary-600'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div
                    className={`p-4 rounded-2xl shadow-sm text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-white border border-secondary-100 text-secondary-800 rounded-tl-none w-full'
                    }`}
                  >
                    {/* {msg.sender === 'ai' && (
                      <div className="mb-4 pb-4 border-b border-secondary-100">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary-400">
                          <Info className="w-3 h-3" />
                          Raw Response (Before)
                        </div>
                        <pre className="p-3 bg-secondary-900 text-secondary-100 rounded-lg text-[11px] overflow-x-auto whitespace-pre-wrap font-mono max-h-40">
                          {msg.rawResponse || msg.text}
                        </pre>
                      </div>
                    )} */}

                    {/* {msg.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-500">
                        <Sparkles className="w-3 h-3" />
                        Rendered Output (After)
                      </div>
                    )} */}

                    {msg.structuredData ? (
                      <StructuredAIResponse data={msg.structuredData} fallbackText={msg.text} />
                    ) : msg.sender === 'ai' ? (
                      <MarkdownFallback text={msg.text} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                    <span
                      className={`text-[10px] mt-2 block opacity-60 ${
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
              <div className="flex max-w-[80%] gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary-600 text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-secondary-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <LoadingSpinner size="sm" color="primary" />
                  <span className="text-xs text-secondary-500 animate-pulse">{loadingStatus}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-secondary-100">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full pl-4 pr-12 py-3 bg-secondary-100 border border-secondary-400 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-secondary-800"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                !input.trim() || isLoading
                  ? 'text-secondary-400 cursor-not-allowed'
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-secondary-400 mt-2 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AIChatPage;
