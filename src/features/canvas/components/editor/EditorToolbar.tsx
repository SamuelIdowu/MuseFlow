"use client";

import { type Editor } from '@tiptap/react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 p-1.5 sm:p-2 flex gap-1 sm:gap-2 items-center sticky top-0 bg-white dark:bg-zinc-950 z-10 overflow-x-auto max-w-full">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
        aria-label="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
        aria-label="Italic"
      >
        <Italic size={16} />
      </button>
      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
        aria-label="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
        aria-label="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor.isActive('bulletList') ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
        aria-label="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${editor.isActive('orderedList') ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
        aria-label="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
}
