"use client";

import { useState } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { WysiwygEditor } from "@/components/editor/WysiwygEditor";
import { AiChatPanel } from "@/components/editor/AiChatPanel";
import { GripVertical } from "lucide-react";

export function EditorClient() {
  const [editorContent, setEditorContent] = useState("");

  const handleApplyContent = (content: string) => {
    setEditorContent(content);
  };

  return (
    <div className="h-[calc(100vh-65px)] w-full overflow-hidden">
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={70} minSize={30}>
          <WysiwygEditor content={editorContent} onChange={setEditorContent} />
        </Panel>
        
        <PanelResizeHandle className="w-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center cursor-col-resize group">
          <div className="h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={14} className="text-zinc-400" />
          </div>
        </PanelResizeHandle>
        
        <Panel defaultSize={30} minSize={20}>
          <AiChatPanel editorContent={editorContent} onApplyContent={handleApplyContent} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
