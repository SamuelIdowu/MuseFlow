"use client";

import { useState, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { marked } from 'marked';
import { useChat } from '@ai-sdk/react';
import { type UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { getGlobalChatMessagesAction, addChatMessageAction } from '@/lib/dashboardServerActions';
import { toast } from 'react-hot-toast';

interface AiChatPanelProps {
  editorContent: string;
  onApplyContent?: (content: string) => void;
}

export function AiChatPanel({ editorContent, onApplyContent }: AiChatPanelProps) {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    getGlobalChatMessagesAction().then(msgs => {
      const formattedMsgs: UIMessage[] = msgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
        parts: [{ type: 'text', text: m.content || '' }]
      }));
      setInitialMessages(formattedMsgs);
      setInitialLoaded(true);
    }).catch(err => {
      console.error("Failed to load chat history", err);
      setInitialLoaded(true);
    });
  }, []);

  const [input, setInput] = useState('');
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_FASTAPI_URL || '/api/chat',
      body: {
        editorContent, 
      }
    }),
    messages: initialMessages,
    onFinish: async (event) => {
      try {
        await addChatMessageAction(event.message);
      } catch (err) {
        console.error("Failed to save assistant message", err);
      }
    },
    onError: (error) => {
      console.error("Agent communication error:", error);
      toast.error("Error communicating with AI assistant");
    }
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Save user message immediately
    const userMessageId = crypto.randomUUID();
    try {
      await addChatMessageAction({
        id: userMessageId,
        role: 'user',
        content: input,
      });
    } catch (err) {
      console.error("Failed to save user message", err);
    }

    sendMessage({ text: input });
    setInput('');
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
        {messages.map((m) => {
          const textContent = m.parts?.filter(p => p.type === 'text').map(p => (p as any).text).join('') || '';
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
