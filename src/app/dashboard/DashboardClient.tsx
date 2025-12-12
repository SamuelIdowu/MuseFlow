'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, Sparkles, User, FileText, Zap, Calendar, Users, GripVertical, Edit } from 'lucide-react';
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
import { saveToIdeasAction } from '@/lib/dashboardServerActions';

// Types
interface DashboardClientProps {
  activeProfile: Profile | null;
  initialStats?: any;
  initialChatSession?: { id: string; messages: Message[] } | null;
  error?: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'ideas';
  data?: any; // For ideas
  timestamp: Date;
}

export function DashboardClient({
  activeProfile,
  initialStats,
  initialChatSession,
  error
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // To detect if we should clear
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }, [initialChatSession, searchParams]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleValuesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
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

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await apiCall('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: userMessage.content,
          input_type: 'text',
          active_profile: activeProfile,
          chat_id: currentChatId, // Optional now
          history: messages // Pass current history for stateless continuity
        }),
      }, 'IDEAS_API');

      // Update current chat ID if it was a new chat AND the server returned one (likely won't for stateless)
      if (!currentChatId && response.id) {
        setCurrentChatId(response.id);
      }

      // The response is the idea kernel with { kernels: [...] }
      const ideas = response.kernels || [];
      const chatResponse = response.generated_content || (Array.isArray(ideas) && ideas[0]?.content) || "I couldn't generate a response.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatResponse, // Direct content from AI
        type: 'text',
        data: ideas,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      // router.refresh(); // REMOVED: Fix disappearing chat bug. State is local until Saved.
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate ideas');
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while generating ideas. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
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
      router.refresh(); // Update sidebar with new saved idea
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
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      {/* Chat Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef} >
        <div className="py-6 space-y-8 min-h-full flex flex-col">

          {isEmptyState ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 mt-10 md:mt-20">
              <div className="space-y-4 max-w-2xl">
                <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">
                  What do you want to create?
                </h1>

                {/* Active Profile Context */}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xl text-muted-foreground font-light">
                    {activeProfile
                      ? `Generating for ${activeProfile.profile_name}`
                      : "Select a profile to get started with tailored content"}
                  </p>

                  {activeProfile && (
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground mt-1 bg-muted/30 px-3 py-1.5 rounded-full border">
                      {activeProfile.niche && (
                        <>
                          <span className="font-medium text-foreground">Niche:</span>
                          <span>{activeProfile.niche}</span>
                          <div className="h-3 w-px bg-border mx-1" />
                        </>
                      )}
                      {activeProfile.tone_config && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Tone:</span>
                          <span>P: {activeProfile.tone_config.professionalism}/10</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>C: {activeProfile.tone_config.casualness}/10</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Cards for Empty State */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8">
                {initialStats ? (
                  <>
                    <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                      <Sparkles className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-2xl font-bold">{initialStats.ideasCount}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ideas</span>
                    </div>
                    <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                      <FileText className="h-6 w-6 mb-2 text-blue-500" />
                      <span className="text-2xl font-bold">{initialStats.contentCount}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Content</span>
                    </div>
                    <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                      <Calendar className="h-6 w-6 mb-2 text-green-500" />
                      <span className="text-2xl font-bold">{initialStats.scheduledCount}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Scheduled</span>
                    </div>
                    <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                      <Users className="h-6 w-6 mb-2 text-orange-500" />
                      <span className="text-2xl font-bold">{initialStats.profileCount}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Profiles</span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-4 text-center text-muted-foreground text-sm">Loading stats...</div>
                )}
              </div>

            </div>
          ) : (
            <div className="space-y-8 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1 border">
                      <AvatarFallback><Sparkles className="h-4 w-4 text-primary" /></AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/40 border rounded-tl-sm'
                      }`}>
                      <div className="prose dark:prose-invert text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>

                    {message.role === 'assistant' && (
                      <div className="mt-2 flex justify-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEditModal(message.content)}
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Review & Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1 border">
                      <AvatarImage src="" /> {/* Add user image if available */}
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 mt-1 border">
                    <AvatarFallback><Sparkles className="h-4 w-4 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm pt-2">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-6xl  flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
            <DialogDescription>
              Edit the generated content before saving or opening in Canvas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 py-4">
            <Textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="min-h-[70vh] resize-none font-mono text-sm leading-relaxed"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button variant="secondary" onClick={handleSaveToIdeas}>
                <Sparkles className="mr-2 h-4 w-4" />
                Save to Ideas
              </Button>
              <Button onClick={handleOpenInCanvas}>
                <FileText className="mr-2 h-4 w-4" />
                Open in Canvas
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-sm sticky bottom-0 z-10 transition-all duration-300">
        <div className="max-w-3xl mx-auto relative rounded-xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all">
          <Textarea
            ref={textareaRef}
            placeholder={activeProfile ? `Generate ideas for ${activeProfile.profile_name}...` : "Ask anything..."}
            className="min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-4 pr-12 text-base shadow-none"
            value={inputText}
            onChange={handleValuesChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-transform hover:scale-105 active:scale-95"
            onClick={handleGenerateIdeas}
            disabled={!inputText.trim() || isLoading}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">
            {isLoading ? "Generating ideas..." : "AI can make mistakes. Check important info."}
          </p>
        </div>
      </div>
    </div>
  );
}