"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createDocument,
  deleteDocument,
  fetchDocuments,
  searchDocuments,
  type KnowledgeDocument,
  type SearchResult,
} from "@/lib/api/memory";

type ViewMode = "all" | "search";

export default function WorkspacePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSource, setFormSource] = useState("manual");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setViewMode("all");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const results = await searchDocuments(searchQuery);
      setSearchResults(results);
      setViewMode("search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(handleSearch, 300);
      return () => clearTimeout(timer);
    } else {
      setViewMode("all");
    }
  }, [searchQuery, handleSearch]);

  const handleCreateManual = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setCreating(true);
    try {
      await createDocument({
        title: formTitle,
        content: formContent,
        source: formSource,
      });
      setShowCreateDialog(false);
      setFormTitle("");
      setFormContent("");
      setFormSource("manual");
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const source = ext === "md" ? "markdown" : ext === "txt" ? "text" : ext === "pdf" ? "pdf" : "file";
        await createDocument({
          title: file.name.replace(/\.[^/.]+$/, ""),
          content,
          source,
        });
        await loadDocuments();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      }
    };
    if (file.type === "application/pdf") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setShowDeleteDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const sourceBadge = (source: string) => {
    const variants: Record<string, "info" | "primary" | "warning" | "neutral" | "danger"> = {
      manual: "info",
      markdown: "primary",
      text: "warning",
      pdf: "danger",
      file: "neutral",
    };
    return (
      <Badge variant={variants[source] || "neutral"} className="text-[9px]">
        {source === "pdf" ? "PDF" : source}
      </Badge>
    );
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Workspace Knowledge"
        description="Upload documents, notes, and markdown files to build your AI workspace knowledge base."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.pdf"
              className="hidden"
              onChange={handleFileUpload}
              aria-label="Upload markdown, text, or PDF file"
            />
            <Button
              size="sm"
              className="bg-neon-purple hover:bg-neon-purple/80 text-white"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Note
            </Button>
          </div>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your knowledge base..."
          className="pl-10 pr-10 h-10"
          aria-label="Search knowledge documents"
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <ErrorState message={error} onRetry={loadDocuments} className="py-4" />
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "search" ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description="No documents matched your search query."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((result) => (
                <Card key={result.id} className="hover:border-neon-purple/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{result.title}</CardTitle>
                      {sourceBadge(result.source)}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Score: {Math.round(result.score * 100)}% · {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {result.snippet}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Knowledge Documents"
          description="Upload markdown, text files, or create manual notes to build your workspace knowledge base."
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload File
              </Button>
              <Button
                size="sm"
                className="bg-neon-purple hover:bg-neon-purple/80 text-white"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Note
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="group hover:border-neon-purple/30 transition-colors relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm truncate flex-1">{doc.title}</CardTitle>
                  {sourceBadge(doc.source)}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {new Date(doc.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {truncate(doc.content, 200)}
                </p>
              </CardContent>
              <button
                className="absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(doc.id)}
                aria-label={`Delete ${doc.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogHeader>
          <DialogTitle>Create Knowledge Note</DialogTitle>
        </DialogHeader>
        <DialogCloseButton onClose={() => setShowCreateDialog(false)} />
        <DialogBody className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Title
            </label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Note title..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Content
            </label>
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Write your knowledge content here... Supports markdown formatting."
              rows={8}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-neon-purple hover:bg-neon-purple/80 text-white"
            disabled={!formTitle.trim() || !formContent.trim() || creating}
            onClick={handleCreateManual}
          >
            {creating ? "Creating..." : "Create Note"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!showDeleteDialog} onClose={() => setShowDeleteDialog(null)}>
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
          >
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
