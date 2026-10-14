import { Suspense } from "react";
import { EditorClient } from "./EditorClient";

export const metadata = {
  title: "AI Editor | MuseFlow",
  description: "AI-powered WYSIWYG editor",
};

export default function EditorPage() {
  return (
    <div className="h-full w-full flex-grow flex flex-col">
      <Suspense fallback={<div className="flex-1 w-full flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <EditorClient />
      </Suspense>
    </div>
  );
}
