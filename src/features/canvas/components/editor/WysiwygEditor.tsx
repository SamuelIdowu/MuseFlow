"use client";

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { Star, MessageSquare, Share, Lock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = () => {
  const menus = ["File", "Edit", "View", "Insert", "Format", "Tools", "Extensions", "Help"];
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 pt-2 pb-1 border-b">
      <div className="flex items-center justify-between px-3 sm:px-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                defaultValue="Untitled document" 
                className="text-base sm:text-lg font-medium bg-transparent border-none outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 px-1 rounded -ml-1 text-zinc-900 dark:text-zinc-100 w-full min-w-0 truncate"
              />
              <Star className="w-4 h-4 text-zinc-400 hover:text-zinc-600 cursor-pointer shrink-0 hidden sm:block" />
            </div>
            <div className="hidden md:flex gap-1 mt-0.5 overflow-x-auto">
              {menus.map((menu) => (
                <button key={menu} className="text-xs px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded shrink-0">
                  {menu}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm flex gap-1.5 sm:gap-2">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type @ to insert...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[1056px] w-full max-w-[816px] mx-auto bg-white dark:bg-zinc-900 p-4 sm:p-6 md:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0a]">
      <MenuBar />
      {editor && <EditorToolbar editor={editor} />}
      <div className="flex-grow overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-zinc-100 dark:bg-[#111111]">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
