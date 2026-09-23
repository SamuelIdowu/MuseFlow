"use client";

import React, { useState } from "react";
import { Plus, Sparkles, Search, Trash2, ArrowRight, Clock, FileText, BookOpen, Layers, PenTool, Mail, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EDITOR_TEMPLATES, EditorTemplate } from "@/features/editor/constants/editorTemplates";

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "pen-tool": PenTool,
  mail: Mail,
  "trending-up": TrendingUp,
};

export interface DocumentSummary {
  id: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  word_count?: number | null;
  updated_at?: string;
  created_at?: string;
}

interface EditorHubViewProps {
  documents: DocumentSummary[];
  onCreateNew: () => Promise<void>;
  onSelectDocument: (docId: string) => void;
  onSelectTemplate: (template: EditorTemplate) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  isCreating?: boolean;
}

export function EditorHubView({
  documents,
  onCreateNew,
  onSelectDocument,
  onSelectTemplate,
  onDeleteDocument,
  isCreating = false,
}: EditorHubViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) =>
    (doc.title || "Untitled Document").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateClick = async (template: EditorTemplate) => {
    try {
      setLoadingTemplateId(template.id);
      await onSelectTemplate(template);
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document? This cannot be undone.")) {
      try {
        setDeletingId(id);
        await onDeleteDocument(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto bg-background p-6 md:p-10 space-y-10">
      {/* Header & Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </span>
            <Badge variant="outline" className="text-xs tracking-wider uppercase font-semibold">
              Document Studio
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Long-Form Writing & Publishing
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Draft newsletters, thought leadership essays, and case studies with real-time AI assistance,
            dynamic outline navigation, and instant channel formatting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onCreateNew}
            disabled={isCreating}
            className="gap-2 shadow-sm font-medium"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Blank Document</span>
          </Button>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold tracking-tight">Writing Blueprints & Templates</h2>
          </div>
          <span className="text-xs text-muted-foreground">Pre-structured editorial formats</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EDITOR_TEMPLATES.map((tpl) => (
            <Card
              key={tpl.id}
              className="group hover:border-primary/60 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-card/50"
              onClick={() => handleTemplateClick(tpl)}
            >
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  {(() => {
                    const IconComponent = TEMPLATE_ICONS[tpl.icon] || Sparkles;
                    return (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-200 shadow-2xs">
                        <IconComponent className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <Badge variant="secondary" className="text-[10px] font-medium tracking-wide">
                    {tpl.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {tpl.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                  {tpl.description}
                </CardDescription>
              </CardHeader>

              <CardFooter className="pt-2 pb-4 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                <span>{tpl.category}</span>
                <span className="flex items-center gap-1 font-medium text-primary group-hover:translate-x-1 transition-transform">
                  {loadingTemplateId === tpl.id ? "Loading..." : "Use Blueprint"}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Recent Documents</h2>
            <Badge variant="outline" className="text-xs ml-1">
              {documents.length}
            </Badge>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {searchQuery ? "No matching documents found" : "No documents yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchQuery
                  ? "Try searching with a different keyword or create a new draft."
                  : "Create a new blank document or choose a blueprint above to start writing."}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={onCreateNew} size="sm" className="mt-2 gap-2">
                <Plus className="w-3.5 h-3.5" />
                Create Blank Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => (
              <Card
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className="group hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between bg-card"
              >
                <CardHeader className="pb-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {doc.title || "Untitled Document"}
                    </CardTitle>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {doc.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {doc.excerpt}
                    </p>
                  )}
                </CardHeader>

                <CardFooter className="pt-2 pb-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {doc.updated_at
                        ? format(new Date(doc.updated_at), "MMM d, yyyy")
                        : "Recently"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.word_count ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {doc.word_count} words
                      </span>
                    ) : null}
                    <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Open <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
