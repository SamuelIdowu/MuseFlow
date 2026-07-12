'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder, Plus, Search } from 'lucide-react';
import { useState } from 'react';

const mockFiles = [
  { name: 'Marketing Campaign', type: 'folder', isOpen: true, children: [
    { name: 'Email Sequence.md', type: 'file', active: false },
    { name: 'Landing Page Copy.md', type: 'file', active: true },
    { name: 'Ad Creatives.md', type: 'file', active: false },
  ]},
  { name: 'Product Launch', type: 'folder', isOpen: false, children: [
    { name: 'Press Release.md', type: 'file', active: false },
    { name: 'Social Media Posts.md', type: 'file', active: false },
  ]},
  { name: 'Weekly Newsletter.md', type: 'file', active: false },
];

export function ProjectNavigation() {
  const [files, setFiles] = useState(mockFiles);

  const toggleFolder = (index: number) => {
    const newFiles = [...files];
    if (newFiles[index].type === 'folder') {
      newFiles[index].isOpen = !newFiles[index].isOpen;
    }
    setFiles(newFiles);
  };

  return (
    <div className="flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111111] h-full flex-shrink-0">
      <div className="p-4 flex items-center justify-between text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800">
        <span className="font-semibold text-sm">Project Files</span>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {files.map((item, i) => (
          <div key={i}>
            <div 
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
                item.active 
                  ? "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
              onClick={() => item.type === 'folder' ? toggleFolder(i) : null}
            >
              {item.type === 'folder' ? (
                <>
                  {item.isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                  <Folder className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                </>
              ) : (
                <>
                  <div className="w-3.5" />
                  <File className="h-4 w-4 shrink-0 opacity-70" />
                </>
              )}
              <span className="truncate">{item.name}</span>
            </div>
            
            {item.type === 'folder' && item.isOpen && item.children && (
              <div className="ml-5 mt-0.5 space-y-0.5">
                {item.children.map((child, j) => (
                  <div 
                    key={j}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
                      child.active 
                        ? "bg-primary/10 text-primary dark:bg-primary/20" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <File className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
