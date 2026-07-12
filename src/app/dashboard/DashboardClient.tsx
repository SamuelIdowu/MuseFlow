'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, Sparkles, User, FileText, Zap, Calendar, Users, GripVertical, Edit, Settings, Share, Image as ImageIcon, Paperclip, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { apiCall } from '@/lib/apiClient';
import { Profile } from '@/types/profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CONTENT_TYPES } from "@/types/content";
import { saveToIdeasAction } from '@/lib/dashboardServerActions';
import { FileContextUploader } from "@/components/ui/file-context-uploader";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Search,
  Calculator,
  Database,
  Layout,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  X,
  MessageSquare,
  Send,
  PlusCircle
} from "lucide-react";

// Types
interface DashboardClientProps {
  activeProfile: Profile | null;
  initialStats?: any;
  initialChatSession?: { id: string; messages: Message[] } | null;
  error?: string | null;
}

interface ToolCall {
  id: string;
  tool: string;
  args: any;
  result?: any;
  status: 'pending' | 'success' | 'error';
  summary?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'ideas';
  data?: any; // For ideas
  timestamp: Date;
  reasoning?: string[];
  toolCalls?: ToolCall[];
}

// Parse a raw JSON string if it looks like a tool-call leaked into content
function parseToolCallJson(content: string): { tool: string; args: any; fullMatch: string } | null {
  if (!content) return null;
  
  // Look for JSON-like patterns that match our tool call structures
  // Pattern 1: {"function": "name", ...}
  // Pattern 2: {"name": "name", "parameters": {...}}
  // Pattern 3: {"tool": "name", ...}
  const jsonRegex = /\{(?:[^{}]|\{[^{}]*\})*\}/g;
  const matches = content.match(jsonRegex);
  
  if (!matches) return null;

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match);
      if (typeof parsed !== 'object' || parsed === null) continue;

      if ('function' in parsed && typeof parsed.function === 'string') {
        return { tool: parsed.function, args: parsed.parameters ?? parsed.args ?? {}, fullMatch: match };
      }
      if ('name' in parsed && 'parameters' in parsed && typeof parsed.name === 'string') {
        return { tool: parsed.name, args: parsed.parameters, fullMatch: match };
      }
      if ('tool' in parsed && typeof parsed.tool === 'string') {
        return { tool: parsed.tool, args: parsed.parameters ?? parsed.args ?? {}, fullMatch: match };
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

function isRawToolCallJson(content: string): boolean {
  return parseToolCallJson(content) !== null;
}

// Temporary stub for missing agentClient
const agentClient = {
  runAgent: async function* (content: string, context: any, history: any, executor: any): AsyncGenerator<any, void, unknown> {
    yield { type: 'thinking', content: 'Connecting to agent...' };
    await new Promise(r => setTimeout(r, 1000));
    yield { type: 'final_response', content: 'Agent client is currently disabled in this build.' };
  }
};

export function DashboardClient({
  activeProfile,
  initialStats,
  initialChatSession,
  error
}: DashboardClientProps) {
  // ... (rest of component)
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [sessionId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));
  const [inputText, setInputText] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialChatSession?.messages || []);
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatSession?.id || null);

  // Sync state when prop changes (navigation)
  useEffect(() => {
    if (initialChatSession) {
      setMessages(initialChatSession.messages);
      setCurrentChatId(initialChatSession.id);
    } else {
      // If navigating to /dashboard (no ID), reset
      if (!searchParams.get('chatId') && currentChatId) {
        setMessages([]);
        setCurrentChatId(null);
      }

      // Explicit "New Chat" action
      if (searchParams.get('action') === 'new') {
        setMessages([]);
        setCurrentChatId(null);
        // Clean URL without refresh
        router.replace('/dashboard');
      }
    }
  }, [initialChatSession, searchParams, currentChatId, router]);

  // Set default content type when profile changes
  useEffect(() => {
    if (activeProfile?.default_content_type) {
      setSelectedContentType(activeProfile.default_content_type);
    } else {
      setSelectedContentType('');
    }
  }, [activeProfile]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleValuesChange = (e: React.ChangeEvent<HTMLTextAreaElement> | { target: { value: string } }) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateIdeas();
    }
  };

  const handleGenerateIdeas = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "",
      timestamp: new Date(),
      toolCalls: [],
      reasoning: []
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const context = {
        userId: user?.id || "",
        sessionId: sessionId,
        profile: activeProfile
      };

      const history = updatedMessages.slice(-10).flatMap(m => {
        const msgs: any[] = [];
        const baseMsg: any = {
          role: m.role,
          content: m.content || "",
        };

        if (m.toolCalls && m.toolCalls.length > 0) {
          baseMsg.tool_calls = m.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.tool,
              arguments: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args)
            }
          }));
        }

        msgs.push(baseMsg);

        if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
          m.toolCalls.forEach(tc => {
            if (tc.status === 'success' || tc.status === 'error') {
              msgs.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: tc.tool,
                content: tc.result ? JSON.stringify(tc.result) : (tc.status === 'error' ? 'Error executing tool' : 'Success')
              });
            }
          });
        }

        return msgs;
      });

      // Tool executor for dashboard chat (no canvas context here).
      // Returning stub results keeps the agent loop alive so it produces a final text response.
      const externalToolExecutor = async (tool: string, args: any): Promise<any> => {
        if (tool === 'manage_canvas') {
          return { status: 'no_canvas', message: 'Canvas is not available here. Please return the generated content as plain text in your final response.' };
        }
        if (tool === 'web_search' || tool === 'analyze_trends') {
          return { status: 'completed', message: `${tool} executed using internal knowledge. Now write the final content directly.`, query: args?.query || args?.topic || '' };
        }
        if (tool === 'search_knowledge_base') {
          return { status: 'completed', results: [], message: 'No knowledge base results. Generate content from your training data.' };
        }
        // Generic fallback for any unrecognised tool
        return { status: 'completed', message: `Tool ${tool} executed. Please generate the final content now.` };
      };

      let assistantContent = "";

      for await (const event of agentClient.runAgent(userMessage.content, context, history, externalToolExecutor)) {
        switch (event.type) {
          case 'thinking':
            setAgentStatus(event.content || "Thinking...");
            // Add to reasoning log for the assistant message
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
              ...m,
              reasoning: [...(m.reasoning || []), event.content || "Thinking..."]
            } : m));
            break;
          case 'tool_call':
            setAgentStatus(`🔧 Calling ${event.tool?.replace(/_/g, ' ')}...`);
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
              ...m,
              toolCalls: [...(m.toolCalls || []), {
                id: event.id || `call_${Date.now()}`,
                tool: event.tool!,
                args: event.args,
                status: 'pending'
              }]
            } : m));
            break;
          case 'tool_result':
            setAgentStatus(`✓ ${event.tool?.replace(/_/g, ' ')} completed`);
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
              ...m,
              toolCalls: (m.toolCalls || []).map(tc => (tc.id === event.id || tc.tool === event.tool) ? {
                ...tc,
                result: event.result,
                status: 'success',
                summary: event.result?.summary || (Array.isArray(event.result) ? `Found ${event.result.length} results` : undefined)
              } : tc)
            } : m));
            break;
          case 'token':
            assistantContent += event.content || "";
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
              ...m,
              content: assistantContent
            } : m));
            break;
          case 'final_response':
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
              ...m,
              content: event.content || assistantContent
            } : m));
            break;
          case 'error':
            toast.error(event.content || "An error occurred");
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
              ...m,
              content: (m.content || "") + `\n\n❌ **Error**: ${event.content || "Unknown agent error"}`
            } : m));
            break;
        }
      }
    } catch (error: any) {
      console.error("Agent execution failed:", error);
      toast.error(error.message || 'Failed to generate response');
      setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {
        ...m,
        content: m.content || "I'm sorry, I encountered an error. Please try again.",
      } : m));
    } finally {
      setIsLoading(false);
      setAgentStatus(null);
    }
  };

  const handleOpenEditModal = (content: string) => {
    setEditingContent(content);
    setIsEditModalOpen(true);
  };

  const handleSaveToIdeas = async () => {
    try {
      await saveToIdeasAction(editingContent, "Saved from Chat");
      toast.success("Saved to Ideas!");
      router.refresh();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to save idea:", error);
      toast.error("Failed to save idea");
    }
  };

  const handleOpenInCanvas = () => {
    const params = new URLSearchParams({
      title: "Computed Idea",
      context: editingContent
    });
    router.push(`/dashboard/canvas?${params.toString()}`);
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="flex flex-col w-full bg-background relative transition-colors duration-500">

      {/* Background Gradients (Orb Effect) */}
      {isEmptyState && (
        <>
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-[10%] left-[40%] -translate-x-1/2 w-[200px] h-[200px] bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}

      {/* Header Controls */}
      <div className="flex items-center justify-between p-3 z-10 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-full bg-muted/50 border hover:bg-muted/80 text-[13px] font-medium h-7">
            {activeProfile ? activeProfile.profile_name : 'Default Agent'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-full bg-muted/50 border hover:bg-muted/80 h-7 text-[12px]">
            <span className="hidden sm:inline mr-1.5">Settings</span> <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full bg-muted/50 border hover:bg-muted/80 h-7 text-[12px]">
            <span className="hidden sm:inline mr-1.5">Export</span> <Share className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        <div className="flex flex-col min-h-full">

          {isEmptyState ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 space-y-8 max-w-5xl mx-auto w-full z-10">

              {/* Hero Section */}
              <div className="flex flex-col items-center space-y-4 text-center mt-6">
                <div className="relative w-20 h-20 mb-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-600 rounded-full blur-sm animate-pulse" />
                  <div className="absolute inset-1 bg-gradient-to-tr from-primary/80 to-orange-500 rounded-full shadow-inner border border-white/20" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground/90">
                  Ready to Create?
                </h1>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full backdrop-blur-sm h-8 px-4 text-[13px]">
                  Create Image <ImageIcon className="ml-1.5 h-3.5 w-3.5 text-purple-400" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full backdrop-blur-sm h-8 px-4 text-[13px]" onClick={() => handleValuesChange({ target: { value: "Brainstorm " } } as any)}>
                  Brainstorm <Sparkles className="ml-1.5 h-3.5 w-3.5 text-yellow-400" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full backdrop-blur-sm h-8 px-4 text-[13px]" onClick={() => handleValuesChange({ target: { value: "Make a plan for " } } as any)}>
                  Make a plan <FileText className="ml-1.5 h-3.5 w-3.5 text-blue-400" />
                </Button>
              </div>

              {/* Center Input Area */}
              <div className="w-full max-w-2xl relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-muted/40 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden flex flex-col p-1.5 space-y-1.5 shadow-xl">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask Anything..."
                    className="min-h-[50px] max-h-[180px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 text-[15px] placeholder:text-muted-foreground/70"
                    value={inputText}
                    onChange={handleValuesChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                  />

                  <div className="flex items-center justify-between px-1.5 pb-1">
                    <div className="flex items-center gap-1">
                      <FileContextUploader
                        onTextExtracted={(text) => setInputText((prev) => prev + (prev ? "\n\n" : "") + text)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
                      />
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-full">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-full bg-background/20">
                        <Mic className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        className={`h-7 w-7 rounded-lg transition-all duration-300 ${inputText.trim() ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted/50 text-muted-foreground'}`}
                        onClick={handleGenerateIdeas}
                        disabled={!inputText.trim() || isLoading}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mt-6">
                {initialStats ? (
                  <>
                    <div className="bg-muted/10 border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/20 transition-all duration-300 group">
                      <div className="p-2 bg-purple-500/10 rounded-full mb-2 group-hover:bg-purple-500/20 transition-colors">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="text-xl font-bold tracking-tight font-space-grotesk">{initialStats.ideasCount}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Ideas</span>
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/20 transition-all duration-300 group">
                      <div className="p-2 bg-blue-500/10 rounded-full mb-2 group-hover:bg-blue-500/20 transition-colors">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="text-xl font-bold tracking-tight font-space-grotesk">{initialStats.contentCount}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Content</span>
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/20 transition-all duration-300 group">
                      <div className="p-2 bg-green-500/10 rounded-full mb-2 group-hover:bg-green-500/20 transition-colors">
                        <Calendar className="h-5 w-5 text-green-400" />
                      </div>
                      <span className="text-xl font-bold tracking-tight font-space-grotesk">{initialStats.scheduledCount}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Scheduled</span>
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/20 transition-all duration-300 group">
                      <div className="p-2 bg-orange-500/10 rounded-full mb-2 group-hover:bg-orange-500/20 transition-colors">
                        <Users className="h-5 w-5 text-orange-400" />
                      </div>
                      <span className="text-xl font-bold tracking-tight font-space-grotesk">{initialStats.profileCount}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Profiles</span>
                    </div>
                  </>
                ) : error ? (
                  <div className="col-span-full text-center text-red-400 text-xs py-8">
                    Unable to load stats.
                  </div>
                ) : (
                  <div className="col-span-full text-center text-muted-foreground text-xs py-8">
                    No stats available.
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Standard Chat View */
            <div className="space-y-6 pb-4 p-4 md:p-6 max-w-3xl mx-auto w-full">
              {messages.map((message) => {
                let displayContent = message.content || '';
                let additionalReasoning: string[] = [];

                if (message.role === 'assistant' && displayContent) {
                  // 1. Extract <think> or <thinking> blocks (including unclosed ones for streaming)
                  const thinkRegex = /<(?:think|thinking)>([\s\S]*?)(?:<\/(?:think|thinking)>|$)/gi;
                  displayContent = displayContent.replace(thinkRegex, (match, p1) => {
                    if (p1 && p1.trim()) {
                      additionalReasoning.push(p1.trim());
                    }
                    return '';
                  });

                  // 2. Extract and remove JSON tool calls that leaked into text
                  const toolCallInfo = parseToolCallJson(displayContent);
                  if (toolCallInfo) {
                    displayContent = displayContent.replace(toolCallInfo.fullMatch, '');
                  }

                  // 3. Heuristic: If content starts with "Plan" or "Research" and is followed by tool-like structures,
                  // move it to reasoning if it feels like internal state.
                  const reasoningHeaders = /^(?:Plan|Research|Thinking|Analyzing|Processing):?\s*[\s\S]{0,300}(?=\n|$)/i;
                  const headerMatch = displayContent.match(reasoningHeaders);
                  if (headerMatch && (isRawToolCallJson(message.content) || additionalReasoning.length > 0 || message.toolCalls?.length)) {
                     additionalReasoning.unshift(headerMatch[0].trim());
                     displayContent = displayContent.replace(headerMatch[0], '');
                  }
                  
                  // Clean up trailing whitespace and "Waiting for results..."
                  displayContent = displayContent.replace(/Waiting for the results\.\.\./gi, '');
                  displayContent = displayContent.replace(/Please wait while I gather the necessary information\..*/gi, '');
                  displayContent = displayContent.trim();
                }

                const allReasoning = [...(message.reasoning || []), ...additionalReasoning];

                return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-7 w-7 mt-0.5 border">
                      <AvatarFallback className="bg-primary/10"><Sparkles className="h-3.5 w-3.5 text-primary" /></AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Only render content bubble if content is non-empty */}
                    {displayContent && displayContent.trim().length > 0 && (
                      <div className={`px-3.5 py-2.5 rounded-xl text-[14px] ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm'
                        : 'bg-muted/50 border rounded-tl-sm'
                        }`}>
                        <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {displayContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Reasoning Accordion */}
                    {message.role === 'assistant' && allReasoning && allReasoning.length > 0 && (
                      <div className="w-full mt-2">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="reasoning" className="border-none">
                            <AccordionTrigger className="py-1.5 text-[10px] text-muted-foreground hover:no-underline justify-start gap-1 opacity-70">
                              <Info className="h-3 w-3" />
                              <span>Show Reasoning ({allReasoning.length} steps)</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-[10px] text-muted-foreground border-l-2 border-orange-200 dark:border-orange-900 ml-1.5 pl-3 pt-2 space-y-1.5">
                              {allReasoning.map((step, i) => (
                                <div key={i} className="flex gap-2">
                                  <span className="shrink-0 text-orange-400 font-mono">{i + 1}.</span>
                                  <p className="italic whitespace-pre-wrap">{step}</p>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}

                    {/* Tool Calls Accordion */}
                    {message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="w-full mt-2">
                        <Accordion type="multiple" className="w-full space-y-2">
                          {message.toolCalls.map((tool) => (
                            <AccordionItem key={tool.id} value={tool.id} className="border rounded-lg bg-muted/20 px-2 overflow-hidden">
                              <AccordionTrigger className="py-2 text-[10px] hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${tool.tool === 'web_search' ? 'bg-blue-500/10' :
                                      tool.tool === 'calculator' ? 'bg-green-500/10' :
                                        tool.tool === 'search_knowledge_base' ? 'bg-purple-500/10' :
                                          'bg-orange-500/10'
                                      }`}>
                                      {tool.tool === 'web_search' && <Search className="h-3 w-3 text-blue-500" />}
                                      {tool.tool === 'calculator' && <Calculator className="h-3 w-3 text-green-500" />}
                                      {tool.tool === 'search_knowledge_base' && <Database className="h-3 w-3 text-purple-500" />}
                                      {tool.tool === 'manage_canvas' && <Layout className="h-3 w-3 text-orange-500" />}
                                    </div>
                                    <span className="font-bold uppercase tracking-wider text-[10px]">{tool.tool.replace(/_/g, ' ')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {tool.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-orange-500" />}
                                    {tool.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                    {tool.status === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="text-[10px] text-muted-foreground pb-2">
                                <div className="space-y-2">
                                  <div className="bg-background/50 p-2 rounded border border-dashed">
                                    <p className="text-[9px] font-semibold uppercase opacity-50 mb-1">Inputs</p>
                                    <pre className="font-mono whitespace-pre-wrap">{JSON.stringify(tool.args, null, 2)}</pre>
                                  </div>
                                  {tool.result && (
                                    <div className="p-2 bg-green-500/5 rounded border border-green-500/10">
                                      <p className="text-[9px] font-semibold uppercase text-green-600 dark:text-green-400 mb-1">Result Summary</p>
                                      <div className="text-foreground/80 font-medium">
                                        {tool.summary || (typeof tool.result === 'string' ? tool.result : 'Task completed successfully.')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {/* Skeleton loading state — shown when agent is working and no content yet */}
                    {message.role === 'assistant' && isLoading && message.id === messages[messages.length - 1]?.id && !message.content && (!message.toolCalls || message.toolCalls.length === 0) && (
                      <div className="w-full space-y-2 mt-1">
                        {/* Shimmer lines */}
                        <div className="flex flex-col gap-2 bg-muted/40 border rounded-xl px-4 py-3 w-72">
                          <Skeleton className="h-3 w-full rounded-full" />
                          <Skeleton className="h-3 w-4/5 rounded-full" />
                          <Skeleton className="h-3 w-3/5 rounded-full" />
                        </div>
                        {/* Thinking pill */}
                        <div className="flex items-center gap-1.5 px-2 py-1 w-fit">
                          <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                          <span className="text-[10px] text-orange-500 font-medium">{agentStatus || 'Thinking…'}</span>
                        </div>
                      </div>
                    )}

                    {/* Compact status pill once tool calls or content start streaming in */}
                    {message.role === 'assistant' && isLoading && message.id === messages[messages.length - 1]?.id && agentStatus && (message.content || (message.toolCalls && message.toolCalls.length > 0)) && (
                      <div className="mt-2 flex items-center gap-1.5 px-2 py-1">
                        <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                        <span className="text-[10px] text-orange-500 font-medium">{agentStatus}</span>
                      </div>
                    )}

                    {message.role === 'assistant' && message.content && message.content.trim().length > 0 && !isRawToolCallJson(message.content) && (
                      <div className="mt-2 flex justify-start gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEditModal(message.content)}
                        >
                          <Edit className="mr-1.5 h-3 w-3" />
                          Review & Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-7 w-7 mt-0.5 border">
                      <AvatarFallback className="bg-muted text-[10px]"><User className="h-3.5 w-3.5" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
              })}

              <div className="h-24"></div>
              <div ref={scrollAreaRef} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl flex flex-col h-[85vh] p-4">
          <DialogHeader className="px-2">
            <DialogTitle className="text-lg">Review Content</DialogTitle>
            <DialogDescription className="text-[13px]">
              Edit before saving or opening in Canvas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 py-3 overflow-hidden flex flex-col">
            <Textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="flex-1 resize-none font-mono text-[13px] leading-relaxed border p-3"
            />
          </div>
          <DialogFooter className="px-2 pt-2 gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)} className="h-8">
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button variant="secondary" size="sm" onClick={handleSaveToIdeas} className="h-8">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Save to Ideas
              </Button>
              <Button size="sm" onClick={handleOpenInCanvas} className="h-8">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Open in Canvas
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Input Area */}
      {!isEmptyState && (
        <div className="p-3 bg-background/80 backdrop-blur-sm sticky bottom-0 z-10 border-t">
          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-lg border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all p-1">
              <Textarea
                ref={textareaRef}
                placeholder={activeProfile ? `Generate ideas for ${activeProfile.profile_name}...` : "Ask anything..."}
                className="min-h-[40px] max-h-[150px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 text-[14px] shadow-none"
                value={inputText}
                onChange={handleValuesChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className={`absolute right-1.5 bottom-1.5 h-7 w-7 rounded-md transition-all ${inputText.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}
                onClick={handleGenerateIdeas}
                disabled={!inputText.trim() || isLoading}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[9px] text-center text-muted-foreground mt-1.5 uppercase tracking-tight opacity-60">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
