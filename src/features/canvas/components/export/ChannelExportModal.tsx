"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Download, Share2, Twitter, Linkedin, FileText, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

interface ChannelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string; // Plain text or markdown
}

// Convert regular letters to bold unicode characters for LinkedIn hooks
function toUnicodeBold(text: string): string {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bold = "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";
  return text
    .split("")
    .map((c) => {
      const idx = normal.indexOf(c);
      return idx >= 0 ? Array.from(bold)[idx] : c;
    })
    .join("");
}

// Split content into Twitter / X thread cards (max 270 chars to account for numbering)
function splitIntoThread(text: string, title: string): string[] {
  const clean = text.replace(/<[^>]+>/g, "").trim();
  if (!clean) return [];

  const rawParagraphs = clean.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  const tweets: string[] = [];
  let currentTweet = "";

  // If title exists and isn't the first line, prepend it
  const allBlocks = rawParagraphs[0]?.toLowerCase().includes(title.toLowerCase())
    ? rawParagraphs
    : [`${title}\n\n[Thread]`, ...rawParagraphs];

  for (const block of allBlocks) {
    if ((currentTweet + "\n\n" + block).length <= 260) {
      currentTweet = currentTweet ? `${currentTweet}\n\n${block}` : block;
    } else {
      if (currentTweet) tweets.push(currentTweet);
      // If single block is longer than 260 chars, split by sentences
      if (block.length > 260) {
        const sentences = block.split(/(?<=[.?!])\s+/);
        let subTweet = "";
        for (const s of sentences) {
          if ((subTweet + " " + s).length <= 260) {
            subTweet = subTweet ? `${subTweet} ${s}` : s;
          } else {
            if (subTweet) tweets.push(subTweet);
            subTweet = s;
          }
        }
        currentTweet = subTweet;
      } else {
        currentTweet = block;
      }
    }
  }

  if (currentTweet) tweets.push(currentTweet);

  const total = tweets.length;
  return tweets.map((t, idx) => `${t}\n\n(${idx + 1}/${total})`);
}

export function ChannelExportModal({
  isOpen,
  onClose,
  title,
  content,
}: ChannelExportModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [useUnicodeBold, setUseUnicodeBold] = useState(false);

  // Clean text representations
  const plainText = useMemo(() => {
    return content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }, [content]);

  // LinkedIn formatted text
  const linkedInText = useMemo(() => {
    const lines = plainText.split("\n\n");
    if (lines.length === 0) return "";

    let headline = lines[0];
    if (useUnicodeBold) {
      headline = toUnicodeBold(headline);
    }

    const body = lines.slice(1).join("\n\n");
    return `${headline}\n\n${body}\n\n---\n#contentcreation #creator #strategy #growth`;
  }, [plainText, useUnicodeBold]);

  // Twitter thread cards
  const threadTweets = useMemo(() => {
    return splitIntoThread(plainText, title);
  }, [plainText, title]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([`# ${title}\n\n${plainText}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "content"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded Markdown file");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Share2 className="w-4 h-4" />
            </span>
            <DialogTitle className="text-lg font-semibold">Multi-Channel Smart Clipboard</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Export and copy publication-ready formats tailored to LinkedIn linebreaks, X character limits, and Markdown.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="linkedin" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="linkedin" className="gap-2 text-xs">
              <Linkedin className="w-3.5 h-3.5 text-sky-600" />
              <span>LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="twitter" className="gap-2 text-xs">
              <Twitter className="w-3.5 h-3.5 text-blue-400" />
              <span>X / Thread ({threadTweets.length})</span>
            </TabsTrigger>
            <TabsTrigger value="markdown" className="gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Markdown</span>
            </TabsTrigger>
          </TabsList>

          {/* LinkedIn Tab */}
          <TabsContent value="linkedin" className="flex-1 flex flex-col space-y-3 overflow-hidden pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Characters: {linkedInText.length} / 3,000</span>
                {linkedInText.length > 3000 && (
                  <Badge variant="destructive" className="text-[10px]">Over limit</Badge>
                )}
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs">
                <input
                  type="checkbox"
                  checked={useUnicodeBold}
                  onChange={(e) => setUseUnicodeBold(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="text-foreground font-medium">Bold Hook Unicode</span>
              </label>
            </div>

            <Textarea
              readOnly
              value={linkedInText}
              className="flex-1 font-mono text-xs resize-none bg-muted/30 min-h-[220px]"
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                onClick={() => copyToClipboard(linkedInText, "linkedin")}
                className="gap-2 text-xs"
              >
                {copiedKey === "linkedin" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === "linkedin" ? "Copied to Clipboard!" : "Copy LinkedIn Post"}
              </Button>
            </div>
          </TabsContent>

          {/* Twitter / X Thread Tab */}
          <TabsContent value="twitter" className="flex-1 flex flex-col space-y-3 overflow-hidden pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{threadTweets.length} Sequential Tweets generated</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(threadTweets.join("\n\n---\n\n"), "all-thread")}
                className="h-7 text-xs gap-1.5"
              >
                {copiedKey === "all-thread" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy Full Thread
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[280px]">
              {threadTweets.map((tweet, idx) => {
                const charCount = tweet.length;
                const isOver = charCount > 280;
                const isCopied = copiedKey === `tweet-${idx}`;

                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 text-xs space-y-2 transition-colors ${
                      isOver ? "border-destructive/60 bg-destructive/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Tweet {idx + 1}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono ${isOver ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                          {charCount} / 280
                        </span>
                        <Button
                          size="sm"
                          variant={isCopied ? "secondary" : "ghost"}
                          onClick={() => copyToClipboard(tweet, `tweet-${idx}`)}
                          className="h-6 px-2 text-[11px] gap-1"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{tweet}</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Markdown Tab */}
          <TabsContent value="markdown" className="flex-1 flex flex-col space-y-3 overflow-hidden pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Standard Markdown format</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMarkdown}
                  className="h-7 text-xs gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  Download .md
                </Button>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(`# ${title}\n\n${plainText}`, "markdown")}
                  className="h-7 text-xs gap-1.5"
                >
                  {copiedKey === "markdown" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy Markdown
                </Button>
              </div>
            </div>

            <Textarea
              readOnly
              value={`# ${title}\n\n${plainText}`}
              className="flex-1 font-mono text-xs resize-none bg-muted/30 min-h-[220px]"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
