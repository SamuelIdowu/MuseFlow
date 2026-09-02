"use client";

import { useState, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { marked } from 'marked';
import { getGlobalChatMessagesAction, addChatMessageAction, generateCanvasChatResponseAction } from '@/features/canvas/actions/canvasActions';
import { toast } from 'react-hot-toast';

interface AiChatPanelProps {
  editorContent: string;
  onApplyContent?: (content: string) => void;
}

export function AiChatPanel({ editorContent, onApplyContent }: AiChatPanelProps) {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getGlobalChatMessagesAction().then(msgs => {
      const formattedMsgs = msgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
        parts: [{ type: 'text', text: m.content || '' }]
      }));
      setMessages(formattedMsgs);
      setInitialLoaded(true);
    }).catch(err => {
      console.error("Failed to load chat history", err);
      setInitialLoaded(true);
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptText = input.trim();
    if (!promptText || isLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: promptText,
      parts: [{ type: 'text', text: promptText }]
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message
    try {
      await addChatMessageAction(userMessage);
    } catch (err) {
      console.error("Failed to save user message", err);
    }

    try {
      const plainDoc = editorContent.replace(/<[^>]*>/g, " ").slice(0, 3000);
      const contextualInput = `[CURRENT DOCUMENT CONTEXT]:\n${plainDoc}\n\n[USER REQUEST]:\n${promptText}`;

      const historyFormatted = messages.map(m => ({
        role: m.role,
        content: m.content || (m.parts?.[0]?.text) || ''
      }));

      const response = await generateCanvasChatResponseAction(contextualInput, historyFormatted);
      const replyText = typeof response === 'string' ? response : (response?.message || (response as any)?.content || '');

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: replyText,
        parts: [{ type: 'text', text: replyText }]
      };

      setMessages(prev => [...prev, assistantMessage]);

      try {
        await addChatMessageAction(assistantMessage);
      } catch (err) {
        console.error("Failed to save assistant message", err);
      }
    } catch (error: any) {
      console.error("Agent communication error:", error);
      toast.error("Error communicating with AI assistant");
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: "Sorry, I ran into an issue connecting to the AI assistant.",
          parts: [{ type: 'text', text: "Sorry, I ran into an issue connecting to the AI assistant." }]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/```[\w]*\n?/);
    if (parts.length === 1) {
      return <div>{content}</div>;
    }

    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          if (index % 2 === 0) {
            return <div key={index}>{part}</div>;
          } else {
            return (
              <div key={index} className="relative mt-2 mb-2">
                <div className="p-3 bg-zinc-900 text-zinc-100 rounded-md text-xs font-mono overflow-x-auto">
                  {part}
                </div>
                {onApplyContent && (
                  <button 
                    onClick={async () => {
                      const htmlContent = await marked.parse(part);
                      onApplyContent(htmlContent);
                    }}
                    className="mt-2 text-xs flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors font-medium"
                  >
                    Apply to Editor
                  </button>
                )}
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (!initialLoaded) {
    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayMessages = messages.length > 0 ? messages : [
    { id: 'intro', role: 'assistant', parts: [{ type: 'text', text: "Hello! I'm your AI writing assistant. I can read your document and help you write, edit, or brainstorm." }] } as any
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold flex items-center gap-2">
        <Bot className="w-5 h-5 text-indigo-500" />
        AI Assistant
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: any) => {
          const textContent = typeof m.content === 'string' && m.content ? m.content : (m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '');
          return (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-orange-600' : 'bg-orange-100 border border-orange-200'
                }`}>
                  {m.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                
                <div className={`p-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-none' 
                    : 'bg-white border shadow-sm rounded-tl-none'
                }`}>
                  <div 
                    className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}
                    dangerouslySetInnerHTML={{ __html: marked(textContent) }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={onSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask AI to help..."
            className="w-full pl-4 pr-10 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
