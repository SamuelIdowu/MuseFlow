"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import { Link2, Unlink, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

interface LinkImageDialogsProps {
  editor: Editor;
}

export function LinkImageDialogs({ editor }: LinkImageDialogsProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      (editor.commands as any).unsetLink();
      toast.success("Link removed");
    } else {
      let formattedUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      (editor.commands as any).setLink({ href: formattedUrl });
      toast.success("Link applied");
    }
    setIsLinkDialogOpen(false);
    setLinkUrl("");
  };

  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    (editor.commands as any).setImage({ src: imageUrl.trim(), alt: imageAlt.trim() });
    toast.success("Image inserted");
    setIsImageDialogOpen(false);
    setImageUrl("");
    setImageAlt("");
  };

  return (
    <>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setIsImageDialogOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Insert Image"
        >
          <ImageIcon size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href || "";
            setLinkUrl(previousUrl);
            setIsLinkDialogOpen(true);
          }}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("link")
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Hyperlink"
        >
          <Link2 size={14} />
        </button>
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editor.isActive("link") ? "Edit Link" : "Insert Hyperlink"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter the target destination URL for the highlighted text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="text-xs h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyLink();
                }
              }}
            />
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            {editor.isActive("link") ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  (editor.commands as any).unsetLink();
                  setIsLinkDialogOpen(false);
                  toast.success("Link removed");
                }}
                className="h-8 text-destructive text-xs hover:bg-destructive/10"
              >
                <Unlink size={12} className="mr-1" /> Remove Link
              </Button>
            ) : (
              <div />
            )}
            <Button size="sm" onClick={handleApplyLink} className="h-8 text-xs">
              Apply Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Insert Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Insert Web Image</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide a direct image URL (PNG, JPG, SVG, WebP, GIF) to embed in your document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Image URL</label>
              <Input
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Alt Text (Description)</label>
              <Input
                placeholder="Visual mockup / illustration"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInsertImage}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
