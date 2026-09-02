'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Send,
  Loader2,
  FileEdit,
  SquarePen,
  Calendar,
  Copy,
  Check,
  BookmarkPlus,
  RefreshCw,
  Trash2,
  Bot,
  User,
  ArrowRight,
  Lightbulb,
  Zap,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Profile } from '@/types/profile';
import { saveToIdeasAction } from '@/features/ideas/actions/ideaActions';
import { ScheduleDialog } from '@/components/modals/ScheduleDialog';
import { cn } from '@/lib/utils';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  channel?: string;
  savedToIdeas?: boolean;
}

interface HomeChatHubProps {
  activeProfile: Profile | null;
  onPostScheduled?: () => void;
}

// ─── Preset Constants ─────────────────────────────────────────────────────────

const CHANNEL_PRESETS = [
  { id: 'all', label: 'All Formats', icon: Zap },
  { id: 'linkedin', label: 'LinkedIn Post', icon: Share2 },
  { id: 'x', label: 'X / Thread', icon: Sparkles },
  { id: 'newsletter', label: 'Newsletter', icon: FileEdit },
  { id: 'script', label: 'Short Video Script', icon: Lightbulb },
];

const STARTER_PROMPTS = [
  {
    title: '5 Viral LinkedIn Hooks',
    prompt: 'Give me 5 punchy LinkedIn hooks on building a micro-SaaS as a solo developer with high retention.',
    channel: 'linkedin',
  },
  {
    title: 'Multi-Tweet Thread',
    prompt: 'Create a 6-part actionable Twitter/X thread breaking down why product positioning beats feature velocity.',
    channel: 'x',
  },
  {
    title: 'Weekly Newsletter Intro',
    prompt: 'Draft an engaging story-driven intro for my newsletter about overcoming creative burnout with AI workflows.',
    channel: 'newsletter',
  },
  {
    title: '60-Sec Reel / TikTok Script',
    prompt: 'Write a high-energy 60-second video script with a 3-second hook on 3 AI tools every creator must use.',
    channel: 'script',
  },
];

const REFINEMENT_ACTIONS = [
  'Make the hook more controversial',
  'Shorten into punchy bullet points',
  'Add 3 strong Call-to-Actions (CTAs)',
  'Rewrite in a more conversational, authentic tone',
];

const STORAGE_KEY = 'museflow_home_chat_v1';

export function HomeChatHub({ activeProfile, onPostScheduled }: HomeChatHubProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleContent, setScheduleContent] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load Chat History from LocalStorage ─────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ── Save Chat History ───────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // ── Auto scroll to bottom when messages update ─────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // ── Clear Chat ─────────────────────────────────────────────────────────────
  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast('Chat reset', { icon: '🧹' });
  };

  // ── Submit Prompt to Gemini ────────────────────────────────────────────────
  const handleSendMessage = async (textToSend?: string, overrideChannel?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const channel = overrideChannel || selectedChannel;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      channel,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation payload for the API
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: query,
          content_type: channel === 'all' ? undefined : channel,
          active_profile: activeProfile,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate response');
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.generated_content || 'No output generated. Please try again.',
        timestamp: new Date().toISOString(),
        channel,
      };

      setMessages([...newHistory, assistantMessage]);
    } catch (err) {
      console.error('Home chat generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generating content');
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Sorry, there was an issue generating your content. Please check your connection or try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...newHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Actions on Output ──────────────────────────────────────────────────────

  const handleCopy = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInEditor = (msg: ChatMessage) => {
    try {
      const firstLine = msg.content.split('\n')[0].replace(/^[#*\- ]+/, '').slice(0, 60);
      localStorage.setItem(
        'museflow_editor_import',
        JSON.stringify({
          title: firstLine || 'AI Draft',
          content: msg.content,
          importedAt: new Date().toISOString(),
        })
      );
      toast.success('Transferring to Editor...');
      router.push('/dashboard/editor');
    } catch (e) {
      console.error('Failed to stage editor import:', e);
      router.push('/dashboard/editor');
    }
  };

  const handleSendToCanvas = (msg: ChatMessage) => {
    try {
      const firstLine = msg.content.split('\n')[0].replace(/^[#*\- ]+/, '').slice(0, 60);
      localStorage.setItem(
        'museflow_canvas_import',
        JSON.stringify({
          topic: firstLine || 'AI Brainstorm',
          content: msg.content,
          channel: msg.channel || 'all',
        })
      );
      toast.success('Opening in Visual Canvas...');
      router.push('/dashboard/canvas');
    } catch {
      router.push('/dashboard/canvas');
    }
  };

  const handleOpenScheduleModal = (msg: ChatMessage) => {
    const firstLine = msg.content.split('\n')[0].replace(/^[#*\- ]+/, '').slice(0, 60);
    setScheduleTitle(firstLine || 'Scheduled Post');
    setScheduleContent(msg.content);
    setIsScheduleOpen(true);
  };

  const handleSaveToIdeas = async (msg: ChatMessage) => {
    try {
      const firstLine = msg.content.split('\n')[0].replace(/^[#*\- ]+/, '').slice(0, 80);
      await saveToIdeasAction(msg.content, firstLine || 'Saved Idea');
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, savedToIdeas: true } : m))
      );
      toast.success('Saved to your Ideas collection!', { icon: '💡' });
    } catch (e) {
      console.error('Failed to save idea:', e);
      toast.error('Failed to save to ideas');
    }
  };

  const handleSchedulePostSubmit = async (post: {
    title: string;
    content: string;
    channel: string;
    scheduledTime: string;
    optimizeTime: boolean;
  }) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_blocks: [{ content: post.content, type: 'paragraph' }],
          channel: post.channel,
          scheduled_time: post.scheduledTime,
          optimize_time: post.optimizeTime,
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule post');
      toast.success('Post added to Content Calendar!', { icon: '📅' });
      setIsScheduleOpen(false);
      if (onPostScheduled) onPostScheduled();
    } catch (err) {
      console.error('Schedule error:', err);
      toast.error('Failed to schedule post');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* ── Main Chat Container ──────────────────────────────────────────────── */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mt-24" />

        {/* Card Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">AI Creation Hub</span>
                <Badge variant="outline" className="text-[10px] py-0 font-medium text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                  Ready
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                Chat, brainstorm hooks, write drafts, or transform ideas into multi-channel campaigns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                title="Start a new chat session"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 flex flex-col gap-5">
          {/* ── Empty State / Starter Prompts ─────────────────────────────────── */}
          {messages.length === 0 && (
            <div className="py-6 sm:py-8 flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-xs border border-primary/20">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                What are you creating today?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
                Type any idea or prompt below, or start with a pre-configured template tailored for creators:
              </p>

              {/* Starter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6 text-left">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(item.channel);
                      handleSendMessage(item.prompt, item.channel);
                    }}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/60 hover:shadow-xs transition-all text-left group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block mb-1">
                        {item.title}
                      </span>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60 text-[10px] text-muted-foreground font-medium">
                      <span className="capitalize">{item.channel} format</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Conversational Messages List ──────────────────────────────────── */}
          {messages.length > 0 && (
            <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 text-xs sm:text-sm leading-relaxed',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-4.5 py-3.5 max-w-[88%] sm:max-w-[80%]',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-xs shadow-xs font-medium'
                        : 'bg-card border border-border text-foreground rounded-tl-xs shadow-xs'
                    )}
                  >
                    {/* Header info */}
                    {msg.role === 'assistant' && msg.channel && msg.channel !== 'all' && (
                      <div className="mb-2 pb-1.5 border-b border-border flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] py-0 capitalize bg-muted/60 text-foreground font-medium border-border">
                          {msg.channel} format
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Markdown Output */}
                    <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_strong]:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* ── Assistant Action Bar ───────────────────────────────── */}
                    {msg.role === 'assistant' && (
                      <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between flex-wrap gap-2">
                        {/* Quick Transfer Actions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenInEditor(msg)}
                            className="h-7 text-[11px] px-2.5 gap-1.5 bg-muted/70 hover:bg-muted text-foreground border border-border font-medium shadow-2xs"
                            title="Continue drafting in the full rich text editor"
                          >
                            <FileEdit className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Editor</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSendToCanvas(msg)}
                            className="h-7 text-[11px] px-2.5 gap-1.5 bg-muted/70 hover:bg-muted text-foreground border border-border font-medium shadow-2xs"
                            title="Open inside the visual node canvas planner"
                          >
                            <SquarePen className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            <span>Canvas</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenScheduleModal(msg)}
                            className="h-7 text-[11px] px-2.5 gap-1.5 bg-muted/70 hover:bg-muted text-foreground border border-border font-medium shadow-2xs"
                            title="Schedule this post with browser reminders"
                          >
                            <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Schedule</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveToIdeas(msg)}
                            disabled={msg.savedToIdeas}
                            className="h-7 text-[11px] px-2 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10"
                            title="Bookmark in Ideas collection"
                          >
                            <BookmarkPlus className={cn('w-3.5 h-3.5', msg.savedToIdeas && 'text-amber-500 fill-amber-500')} />
                          </Button>
                        </div>

                        {/* Copy Utility */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(msg)}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Copy markdown text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-muted text-foreground border border-border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start items-center text-muted-foreground text-xs pl-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 bg-card px-3.5 py-2 rounded-xl border border-border shadow-2xs">
                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                    <span className="font-medium text-foreground">Gemini is generating your content...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

          {/* ── Follow-up Refinement Chips (Shown when messages exist) ──────────── */}
          {messages.length > 0 && !isLoading && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3 h-3" /> Refine:
              </span>
              {REFINEMENT_ACTIONS.map((refine, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(refine)}
                  className="shrink-0 px-3 py-1 rounded-full border border-border bg-card hover:bg-muted/80 hover:border-primary/40 text-foreground/80 hover:text-foreground font-medium shadow-2xs transition-all"
                >
                  "{refine}"
                </button>
              ))}
            </div>
          )}

          {/* ── Input Omnibar ──────────────────────────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-border">
            {/* Format Channels Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-medium text-muted-foreground mr-1 hidden sm:inline">
                Target:
              </span>
              {CHANNEL_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedChannel === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedChannel(preset.id)}
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 border',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                        : 'bg-muted/60 text-foreground/80 border-border hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end rounded-2xl border border-border bg-card shadow-xs focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all p-1.5"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="What would you like to create or refine? (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-[140px] resize-none border-0 shadow-none focus-visible:ring-0 text-xs sm:text-sm py-2 px-2.5 bg-transparent text-foreground placeholder:text-muted-foreground"
                rows={1}
              />

              <div className="flex items-center gap-1.5 pb-1 pr-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Generate</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* ── Schedule Modal for Direct Scheduling ──────────────────────────────── */}
      <ScheduleDialog
        isOpen={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        ideaTitle={scheduleTitle}
        ideaDescription={scheduleContent}
        activeProfile={activeProfile}
        onSchedule={handleSchedulePostSubmit}
      />
    </div>
  );
}
