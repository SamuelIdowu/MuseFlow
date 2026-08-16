"use client";

import { useState, useEffect } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { WysiwygEditor } from "@/features/canvas/components/editor/WysiwygEditor";
import { AiChatPanel } from "@/features/canvas/components/editor/AiChatPanel";
import { GripVertical } from "lucide-react";

export function EditorClient() {
  const [editorContent, setEditorContent] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleApplyContent = (content: string) => {
    setEditorContent(content);
  };

  return (
    <div className="h-[calc(100vh-65px)] w-full overflow-hidden max-w-full">
      <PanelGroup orientation={isMobile ? "vertical" : "horizontal"}>
        <Panel defaultSize={isMobile ? 60 : 70} minSize={30}>
          <WysiwygEditor content={editorContent} onChange={setEditorContent} />
        </Panel>
        
        <PanelResizeHandle className={`${isMobile ? 'h-2 w-full cursor-row-resize' : 'w-2 h-full cursor-col-resize'} bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center group`}>
          <div className={`${isMobile ? 'w-8 h-2' : 'h-8 w-2'} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
            <GripVertical size={14} className={`text-zinc-400 ${isMobile ? 'rotate-90' : ''}`} />
          </div>
        </PanelResizeHandle>
        
        <Panel defaultSize={isMobile ? 40 : 30} minSize={20}>
          <AiChatPanel editorContent={editorContent} onApplyContent={handleApplyContent} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
