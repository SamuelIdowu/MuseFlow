import { EditorClient } from "./EditorClient";

export const metadata = {
  title: "AI Editor | MuseFlow",
  description: "AI-powered WYSIWYG editor",
};

export default function EditorPage() {
  return (
    <div className="h-full w-full flex-grow flex flex-col -m-3 md:-m-4">
      <EditorClient />
    </div>
  );
}
