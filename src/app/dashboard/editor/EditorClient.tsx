"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentTopBar } from "@/features/canvas/components/editor/DocumentTopBar";
import { DocumentLeftSidebar } from "@/features/canvas/components/editor/DocumentLeftSidebar";
import { DocumentSheet } from "@/features/canvas/components/editor/DocumentSheet";
import { EditorToolbar } from "@/features/canvas/components/editor/EditorToolbar";
import { AiChatSidebar } from "@/features/canvas/components/editor/AiChatSidebar";
import { getActiveProfile } from "@/lib/dashboardServerActions";
import { toast } from "react-hot-toast";
import { type Editor } from "@tiptap/react";
import { marked } from "marked";
import { Loader2 } from "lucide-react";
import {
  saveDocumentAction,
  getDocumentAction,
  getUserDocumentsAction,
} from "@/features/editor/actions/documentActions";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { htmlToMarkdown } from "@/lib/htmlToMarkdown";

export function EditorClient() {
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("Designing for High-Retention Growth");
  const [documentSubtitle, setDocumentSubtitle] = useState("UX Research & Creator Edition");
  const [documentExcerpt, setDocumentExcerpt] = useState(
    "Explores how intentional design decisions and clear copywriting create high-retention experiences."
  );
  const [documentContent, setDocumentContent] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<{ name: string; niche: string }>({
    name: "Creator Authority",
    niche: "Tech & SaaS",
  });

  const editorInstanceRef = useRef<Editor | null>(null);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [documentFont, setDocumentFont] = useState<{ name: string; value: string }>({
    name: "Inter",
    value: "'Inter', sans-serif",
  });
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);
  const [isGeneratingAutocomplete, setIsGeneratingAutocomplete] = useState(false);
  const [completionSource, setCompletionSource] = useState<"research_agent" | "gemini_fallback" | null>(null);

  const searchParams = useSearchParams();
  const importParam = searchParams.get("import");

  const applyImportPayload = async (payload: { title?: string; content?: string; channel?: string }) => {
    if (payload.title) setDocumentTitle(payload.title);
    if (payload.channel && payload.channel !== 'all') {
      setDocumentSubtitle(`${payload.channel.toUpperCase()} Draft • MuseFlow AI Studio`);
    } else {
      setDocumentSubtitle("AI Content Draft • MuseFlow Studio");
    }

    if (payload.content) {
      const plainText = payload.content.replace(/<[^>]+>/g, '').replace(/[#*_`]/g, '').trim();
      setDocumentExcerpt(plainText.slice(0, 160) + (plainText.length > 160 ? '...' : ''));

      const htmlContent = await marked.parse(payload.content);
      setDocumentContent(htmlContent);

      if (editorInstanceRef.current && !editorInstanceRef.current.isDestroyed) {
        editorInstanceRef.current.commands.setContent(htmlContent, { emitUpdate: true });
      }
      return true;
    }
    return false;
  };

  const handleLoadLatestDashboardChat = async () => {
    try {
      const raw = localStorage.getItem('museflow_latest_ai_chat');
      if (!raw) {
        toast.error("No recent AI chat draft found in storage.");
        return;
      }
      const parsed = JSON.parse(raw);
      const success = await applyImportPayload(parsed);
      if (success) {
        toast.success("Loaded latest draft from AI Chat!", { icon: "📝" });
      }
    } catch (err) {
      console.error("Failed to load latest chat:", err);
      toast.error("Could not load dashboard chat");
    }
  };

  // Load active profile info
  useEffect(() => {
    getActiveProfile()
      .then((profile) => {
        if (profile) {
          setActiveProfile({
            name: profile.profile_name || "Creator Profile",
            niche: profile.niche || "Content Creator",
          });
        }
      })
      .catch((err) => {
        console.error("Error loading active profile for editor:", err);
      });
  }, []);

  // Restore saved document draft from Cloud (Supabase) or staged import from Home Chat
  useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      // 1. Check if there is an imported draft from Home Chat
      try {
        const imported = localStorage.getItem("museflow_editor_import");
        if (imported) {
          const parsed = JSON.parse(imported);
          const success = await applyImportPayload(parsed);
          localStorage.removeItem("museflow_editor_import");
          if (!isCancelled) {
            if (success) {
              toast.success("Loaded draft from AI Chat Hub!", { icon: "📝" });
            }
            setIsLoaded(true);
          }
          return;
        }
      } catch (e) {
        console.error("Error reading editor import:", e);
      }

      // 2. Load from Supabase Cloud
      try {
        const userDocs = await getUserDocumentsAction();
        if (userDocs && userDocs.length > 0) {
          const latest = userDocs[0];
          const fullDoc = await getDocumentAction(latest.id);
          if (fullDoc && !isCancelled) {
            setCurrentDocId(fullDoc.id);
            if (fullDoc.title) setDocumentTitle(fullDoc.title);
            if (fullDoc.subtitle) setDocumentSubtitle(fullDoc.subtitle);
            if (fullDoc.excerpt) setDocumentExcerpt(fullDoc.excerpt);
            if (fullDoc.content_html) {
              setDocumentContent(fullDoc.content_html);
              if (editorInstanceRef.current && !editorInstanceRef.current.isDestroyed) {
                editorInstanceRef.current.commands.setContent(fullDoc.content_html, { emitUpdate: false });
              }
            }
            if (fullDoc.updated_at) setLastSavedAt(new Date(fullDoc.updated_at));
            setIsLoaded(true);
            return;
          }
        }
      } catch (cloudErr) {
        console.warn("Could not load from cloud, checking local backup:", cloudErr);
      }

      // 3. Fallback to localStorage backup if no cloud docs exist yet
      try {
        const savedDoc = localStorage.getItem("museflow_editor_doc");
        if (savedDoc) {
          const parsed = JSON.parse(savedDoc);
          if (parsed.title !== undefined) setDocumentTitle(parsed.title);
          if (parsed.subtitle !== undefined) setDocumentSubtitle(parsed.subtitle);
          if (parsed.excerpt !== undefined) setDocumentExcerpt(parsed.excerpt);
          if (parsed.content !== undefined && parsed.content.trim()) {
            setDocumentContent(parsed.content);
            if (editorInstanceRef.current && !editorInstanceRef.current.isDestroyed) {
              editorInstanceRef.current.commands.setContent(parsed.content, { emitUpdate: false });
            }
          }
          if (parsed.updatedAt) setLastSavedAt(new Date(parsed.updatedAt));
        }
      } catch (e) {
        console.error("Error restoring editor document backup:", e);
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [importParam]);

  // Autosave to Cloud (debounced 1000ms) with localStorage backup
  useEffect(() => {
    if (!isLoaded) return;
    setIsSaving(true);
    const timer = setTimeout(async () => {
      const now = new Date();
      try {
        // Cloud Save via Server Action
        const saved = await saveDocumentAction({
          id: currentDocId || undefined,
          title: documentTitle,
          subtitle: documentSubtitle,
          excerpt: documentExcerpt,
          content_html: documentContent,
          word_count: wordCount,
        });

        if (saved && saved.id) {
          if (!currentDocId) {
            setCurrentDocId(saved.id);
          }
        }

        setLastSavedAt(now);
      } catch (cloudSaveErr) {
        console.warn("Cloud autosave warning (saved to local backup):", cloudSaveErr);
      } finally {
        setIsSaving(false);
      }

      // Always save local backup
      try {
        localStorage.setItem(
          "museflow_editor_doc",
          JSON.stringify({
            id: currentDocId,
            title: documentTitle,
            subtitle: documentSubtitle,
            excerpt: documentExcerpt,
            content: documentContent,
            updatedAt: now.toISOString(),
          })
        );
      } catch (err) {
        console.error("Failed to backup document to localStorage:", err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [documentTitle, documentSubtitle, documentExcerpt, documentContent, wordCount, isLoaded, currentDocId]);

  // Handle export formats
  const handleExport = (format: "markdown" | "html" | "text") => {
    let contentToExport = "";
    let mimeType = "text/plain";
    let fileExtension = "txt";

    if (format === "markdown") {
      contentToExport = `# ${documentTitle}\n\n` + htmlToMarkdown(documentContent);
      mimeType = "text/markdown";
      fileExtension = "md";
    } else if (format === "html") {
      contentToExport = `<!DOCTYPE html><html><head><title>${documentTitle}</title></head><body><h1>${documentTitle}</h1>${documentContent}</body></html>`;
      mimeType = "text/html";
      fileExtension = "html";
    } else {
      contentToExport = `${documentTitle}\n\n` + documentContent.replace(/<[^>]+>/g, " ");
    }

    const blob = new Blob([contentToExport], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${fileExtension.toUpperCase()}!`);
  };

  const handleCopyContent = () => {
    const plain = `${documentTitle}\n\n` + documentContent.replace(/<[^>]+>/g, " ");
    navigator.clipboard.writeText(plain);
    toast.success("Document copied to clipboard!");
  };

  const handleInsertFromAi = (html: string) => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.chain().focus().insertContent(html).run();
    } else {
      setDocumentContent((prev) => `${prev}<br/>${html}`);
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] h-full w-full flex flex-col overflow-hidden bg-muted/20">
      {/* Top Header Bar */}
      <DocumentTopBar
        title={documentTitle}
        onTitleChange={setDocumentTitle}
        wordCount={wordCount}
        charCount={charCount}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        onExport={handleExport}
        onCopyContent={handleCopyContent}
        onLoadRecentChat={handleLoadLatestDashboardChat}
      />

      {/* Main 3-Column Studio Layout with Resizable Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {/* Left Column: Creator Companion */}
          {isLeftSidebarOpen ? (
            <>
              <ResizablePanel
                defaultSize="19%"
                minSize="14%"
                maxSize="32%"
                className="h-full flex flex-col overflow-hidden"
              >
                <DocumentLeftSidebar
                  editor={editorInstanceRef.current}
                  isOpen={true}
                  onToggle={() => setIsLeftSidebarOpen(false)}
                  activeProfileName={activeProfile.name}
                  activeNiche={activeProfile.niche}
                  wordCount={wordCount}
                  charCount={charCount}
                  onLoadRecentChat={handleLoadLatestDashboardChat}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          ) : (
            <DocumentLeftSidebar
              editor={editorInstanceRef.current}
              isOpen={false}
              onToggle={() => setIsLeftSidebarOpen(true)}
              activeProfileName={activeProfile.name}
              activeNiche={activeProfile.niche}
              wordCount={wordCount}
              charCount={charCount}
              onLoadRecentChat={handleLoadLatestDashboardChat}
            />
          )}

          {/* Middle Column: Scrollable Document Canvas Sheet */}
          <ResizablePanel
            minSize="30%"
            defaultSize={isLeftSidebarOpen && isRightSidebarOpen ? "59%" : isLeftSidebarOpen ? "81%" : isRightSidebarOpen ? "78%" : "100%"}
            className="h-full flex flex-col overflow-hidden"
          >
            {/* Sticky Toolbar — lives outside the scroll area so it always pins to the top */}
            <div className="sticky top-0 z-30 px-2 sm:px-4 py-1.5 bg-zinc-100/95 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border/40">
              <EditorToolbar
                editor={editorInstance}
                activeFont={documentFont.name}
                onFontChange={(name, value) => setDocumentFont({ name, value })}
                isAutocompleteEnabled={isAutocompleteEnabled}
                onToggleAutocomplete={() => setIsAutocompleteEnabled((prev) => !prev)}
                isGeneratingAutocomplete={isGeneratingAutocomplete}
                completionSource={completionSource}
              />
            </div>

            <main className="w-full flex-1 overflow-y-auto py-1.5 sm:py-2.5 px-2 sm:px-4 bg-zinc-100/70 dark:bg-zinc-950/60 transition-all">
              {isLoaded ? (
                <DocumentSheet
                  content={documentContent}
                  fontFamily={documentFont.value}
                  onChange={(html, words, chars) => {
                    setDocumentContent(html);
                    setWordCount(words);
                    setCharCount(chars);
                  }}
                  documentTitle={documentTitle}
                  onDocumentTitleChange={setDocumentTitle}
                  subtitle={documentSubtitle}
                  onSubtitleChange={setDocumentSubtitle}
                  excerpt={documentExcerpt}
                  onExcerptChange={setDocumentExcerpt}
                  isAutocompleteEnabled={isAutocompleteEnabled}
                  onAutocompleteStatusChange={({ isGenerating, source }) => {
                    setIsGeneratingAutocomplete(isGenerating);
                    if (source !== undefined) setCompletionSource(source);
                  }}
                  onEditorReady={(editor) => {
                    editorInstanceRef.current = editor;
                    setEditorInstance(editor);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-2 text-muted-foreground">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs font-medium">Preparing editor canvas...</span>
                </div>
              )}
            </main>
          </ResizablePanel>

          {/* Right Column: AI Writing Copilot */}
          {isRightSidebarOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize="22%"
                minSize="16%"
                maxSize="36%"
                className="h-full flex flex-col overflow-hidden"
              >
                <AiChatSidebar
                  isOpen={true}
                  onToggle={() => setIsRightSidebarOpen(false)}
                  documentContent={documentContent}
                  onInsertContent={handleInsertFromAi}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
