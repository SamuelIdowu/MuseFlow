"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Trash2,
  X,
  MessageSquare,
  Layout,
  Loader2,
  CheckCircle2,
  Paperclip,
  Send,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CanvasChatSidebarProps {
  isChatOpen: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
  modelProvider: string | null;
  agentStatus: string | null;
  chatMessages: any[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatLoading: boolean;
  selectedFiles: { name: string; type: string; data: string }[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSendMessage: () => void;
  onClearChat: () => void;
  isFullscreen?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function CanvasChatSidebar({
  isChatOpen,
  onClose,
  onToggleOpen,
  modelProvider,
  agentStatus,
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  selectedFiles,
  onFileSelect,
  onRemoveFile,
  onSendMessage,
  onClearChat,
  isFullscreen,
  containerRef,
}: CanvasChatSidebarProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen, agentStatus]);

  return (
    <>
      {/* Sidebar Panel */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] border-l bg-card flex flex-col transition-all duration-300 z-30 fixed md:relative inset-y-0 right-0 shadow-2xl md:shadow-none ${
          isChatOpen ? "translate-x-0" : "translate-x-full md:hidden"
        }`}
      >
        <div className="p-3 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm leading-none">
                Canvas AI Assistant
              </h3>
              {modelProvider && (
                <span className="text-[9px] text-muted-foreground leading-none flex items-center gap-1">
                  Powered by{" "}
                  <span className="font-medium text-orange-600/80 uppercase tracking-tighter">
                    {modelProvider}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Clear Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="max-w-sm mx-4 z-50"
                container={isFullscreen ? containerRef?.current : undefined}
              >
                <AlertDialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-base">
                      Clear chat history?
                    </AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="text-sm leading-relaxed">
                    This will permanently delete all messages in this conversation. The canvas blocks you've already created will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-2 flex-row gap-2 justify-end">
                  <AlertDialogCancel className="h-9 text-sm mt-0">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onClearChat}
                  >
                    Clear History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground px-4">
                Ask me to generate a blog post, social media thread, or brainstorm ideas for your canvas.
              </p>
            </div>
          )}
          {chatMessages.map((msg: any) => {
            const textContent =
              typeof msg.content === "string" && msg.content
                ? msg.content
                : msg.parts
                    ?.filter((p: any) => p.type === "text")
                    .map((p: any) => p.text)
                    .join("") || "";
            const toolInvocations =
              msg.parts
                ?.filter(
                  (p: any) =>
                    p.type === "tool-invocation" || p.type === "tool-call"
                )
                .map((p: any) => p.toolInvocation || p) || [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-2 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {msg.role === "user" && (
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm bg-orange-600 text-white rounded-tr-none shadow-xs`}
                  >
                    {textContent && (
                      <p className="whitespace-pre-wrap">{textContent}</p>
                    )}
                  </div>
                )}

                {toolInvocations.length > 0 && (
                  <div className="w-[85%] space-y-1.5">
                    {toolInvocations.map((tool: any) => (
                      <Accordion
                        key={tool.toolCallId}
                        type="single"
                        collapsible
                        defaultValue={
                          tool.state !== "result" ? tool.toolCallId : undefined
                        }
                        className="w-full"
                      >
                        <AccordionItem
                          value={tool.toolCallId}
                          className={`border rounded-lg px-2 overflow-hidden transition-colors ${
                            tool.state !== "result"
                              ? "bg-orange-500/5 border-orange-500/20"
                              : "bg-green-500/5 border-green-500/20"
                          }`}
                        >
                          <AccordionTrigger className="py-2 text-[10px] hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1 rounded ${
                                    tool.toolName === "manage_canvas"
                                      ? "bg-orange-500/10"
                                      : "bg-muted/10"
                                  }`}
                                >
                                  <Layout
                                    className={`h-3 w-3 ${
                                      tool.toolName === "manage_canvas"
                                        ? "text-orange-500"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </div>
                                <span className="font-bold uppercase tracking-wider text-xs">
                                  {tool.toolName.replace(/_/g, " ")}
                                </span>
                                {tool.state !== "result" && (
                                  <span className="text-[9px] text-orange-500 animate-pulse font-medium">
                                    Running...
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {tool.state !== "result" ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-[10px] text-muted-foreground pb-2">
                            <div className="space-y-2">
                              <div className="bg-background/50 p-2 rounded border border-dashed">
                                <p className="text-[9px] font-semibold uppercase opacity-50 mb-1">
                                  Inputs
                                </p>
                                <pre className="font-mono whitespace-pre-wrap break-all">
                                  {JSON.stringify(tool.args, null, 2)}
                                </pre>
                              </div>
                              {tool.state === "result" && (
                                <div className="p-2 bg-green-500/5 rounded border border-green-500/10">
                                  <p className="text-[9px] font-semibold uppercase text-green-600 dark:text-green-400 mb-1">
                                    Result
                                  </p>
                                  <div className="text-foreground/80 font-medium text-[10px]">
                                    Completed successfully.
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                )}

                {msg.role === "assistant" && textContent && (
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none p-3 text-sm bg-muted shadow-xs">
                    <p className="whitespace-pre-wrap">{textContent}</p>
                  </div>
                )}
              </div>
            );
          })}
          {(isChatLoading || agentStatus) && (
            <div className="flex flex-col gap-1.5 items-start w-full">
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-xl border border-orange-500/20 max-w-[95%] w-full">
                <Loader2 className="h-3 w-3 animate-spin text-orange-600 shrink-0" />
                <span className="text-[10px] font-semibold text-orange-600 flex-1 truncate">
                  {agentStatus || "Agent is thinking..."}
                </span>
                <span className="flex gap-0.5">
                  <span
                    className="h-1 w-1 rounded-full bg-orange-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1 w-1 rounded-full bg-orange-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1 w-1 rounded-full bg-orange-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t bg-muted/10">
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="relative group bg-muted rounded px-2 py-1 text-xs pr-6 truncate max-w-[150px]"
                >
                  {file.name}
                  <button
                    onClick={() => onRemoveFile(i)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-muted/50 rounded-xl overflow-hidden border focus-within:ring-1 focus-within:ring-orange-600/50 transition-shadow">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="How can I help with your content?"
                className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 max-h-[120px] min-h-[44px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
              <div className="px-2 pb-2 flex items-center justify-between">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                  multiple
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-orange-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                  onClick={onSendMessage}
                  disabled={
                    isChatLoading ||
                    (!chatInput.trim() && selectedFiles.length === 0)
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Open Button (Bottom Right) */}
      <div
        className={`fixed md:absolute bottom-4 sm:bottom-6 transition-all duration-300 z-40 flex flex-col gap-3 ${
          isChatOpen ? "md:right-[370px] right-4 sm:right-6" : "right-4 sm:right-6"
        }`}
      >
        <Button
          onClick={onToggleOpen}
          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isChatOpen
              ? "bg-background text-foreground border"
              : "bg-orange-600 hover:bg-orange-700 text-white"
          }`}
          size="icon"
        >
          {isChatOpen ? (
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </Button>
      </div>
    </>
  );
}
