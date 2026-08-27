"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  PlusCircle,
  RefreshCw,
  Trash2,
  CornerDownLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateCanvasChatResponseAction } from "../../actions/canvasActions";
import { marked } from "marked";
import { toast } from "react-hot-toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AiChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  documentContent: string;
  onInsertContent: (html: string) => void;
  onReplaceContent?: (html: string) => void;
}

const QUICK_PROMPTS = [
  "Write 3 viral hooks for this post",
  "Strengthen the Call to Action",
  "Make this more concise & punchy",
  "Suggest practical examples or data points",
];

export function AiChatSidebar({
  isOpen,
  onToggle,
  documentContent,
  onInsertContent,
  onReplaceContent,
}: AiChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 I'm your AI Writing Copilot. I have full context of your document.\n\nAsk me to brainstorm hooks, rewrite sections, expand bullet points, or optimize for your brand voice!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build context including stripped text of current document
      const plainDoc = documentContent.replace(/<[^>]*>/g, " ").slice(0, 3000);
      const contextualInput = `[CURRENT DOCUMENT CONTEXT]:\n${plainDoc}\n\n[USER REQUEST]:\n${promptText}`;

      const historyFormatted = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await generateCanvasChatResponseAction(contextualInput, historyFormatted);

      let replyContent = "";
      if (typeof response === "string") {
        replyContent = response;
      } else if (response && (response as any).message) {
        replyContent = (response as any).message;
      } else if (response && (response as any).content) {
        replyContent = (response as any).content;
      } else {
        replyContent = JSON.stringify(response);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("AI Copilot Error:", err);
      toast.error("Failed to generate AI response");
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I ran into an issue connecting to the AI engine. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertHtml = async (rawMarkdownOrHtml: string) => {
    try {
      const parsedHtml = await marked.parse(rawMarkdownOrHtml);
      onInsertContent(parsedHtml);
      toast.success("Inserted into document!");
    } catch {
      onInsertContent(`<p>${rawMarkdownOrHtml}</p>`);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat history cleared. How can I help with your draft next?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-full h-full bg-card border-l border-border/80 flex flex-col select-none overflow-hidden transition-all duration-200 z-20">
      {/* Copilot Header */}
      <div className="h-14 px-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <span className="font-semibold text-xs text-foreground tracking-tight">AI Copilot</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1 text-primary border-primary/30 bg-primary/10">
            Gemini 2.0
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
            title="Clear Chat"
          >
            <Trash2 size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
            title="Close Copilot"
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>

      {/* Quick Prompt Catalyst Chips */}
      <div className="px-3.5 py-2 border-b border-border/50 bg-muted/10 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-border/70 bg-card hover:bg-muted/70 hover:border-primary/40 text-muted-foreground hover:text-foreground whitespace-nowrap transition-all shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex gap-2.5 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? "bg-primary text-primary-foreground font-semibold text-xs"
                    : "bg-primary/15 text-primary border border-primary/25"
                }`}
              >
                {isUser ? <User size={13} /> : <Bot size={14} />}
              </div>

              {/* Message Box */}
              <div
                className={`max-w-[84%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-none shadow-xs"
                    : "bg-muted/40 text-foreground border border-border/70 rounded-tl-none"
                }`}
              >
                {/* Message Body */}
                <div
                  className={`prose prose-xs max-w-none ${
                    isUser
                      ? "prose-invert text-white [&_p]:text-white [&_a]:text-white"
                      : "dark:prose-invert text-foreground"
                  }`}
                  dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }}
                />

                {/* Assistant Action Buttons */}
                {!isUser && m.id !== "welcome" && (
                  <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInsertHtml(m.content)}
                      className="h-6 px-2 text-[10px] font-medium text-primary hover:bg-primary/10 border-primary/30 flex items-center gap-1"
                    >
                      <PlusCircle size={10} />
                      Insert into Editor
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyMessage(m.content, m.id)}
                      className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copiedId === m.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      {copiedId === m.id ? "Copied" : "Copy"}
                    </Button>
                  </div>
                )}

                <div className={`text-[9px] mt-1 text-right ${isUser ? "text-white/70" : "text-muted-foreground/70"}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-center mb-4">
            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 rounded-tl-none flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border/70">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to write, edit, expand..."
            disabled={isLoading}
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 transition-all"
          >
            <CornerDownLeft size={12} />
          </Button>
        </form>
      </div>
    </aside>
  );
}
