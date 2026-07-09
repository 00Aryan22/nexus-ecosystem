"use client";

import { useMemo, useRef, useState } from "react";
import {
  Archive,
  MessageSquarePlus,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { filterConversations } from "@/components/founder-agent/search-utils";
import type { AgentConversationPublic } from "@/lib/api/founder-agent";

interface ConversationSidebarProps {
  conversations: AgentConversationPublic[];
  archivedConversations?: AgentConversationPublic[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin?: (id: string, is_pinned: boolean) => void;
  onArchive?: (id: string, is_archived: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-neon-purple/20 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Delete Conversation</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong className="text-foreground">&ldquo;{title}&rdquo;</strong>?
          This action cannot be undone.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function ConversationItem({
  conv,
  activeId,
  searchQuery,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  onArchive,
}: {
  conv: AgentConversationPublic;
  activeId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin?: (id: string, is_pinned: boolean) => void;
  onArchive?: (id: string, is_archived: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conv.title || "");
  const [showDelete, setShowDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = activeId === conv.id;

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(conv.title || "");
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== (conv.title || "")) {
      onRename(conv.id, trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      setDraft(conv.title || "");
      setEditing(false);
    }
  }

  return (
    <>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
          isActive
            ? "bg-neon-purple/10 border border-neon-purple/20"
            : "hover:bg-white/5 border border-transparent"
        }`}
        onClick={() => onSelect(conv.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onSelect(conv.id); }}
        aria-current={isActive ? "true" : undefined}
        aria-label={`Conversation: ${conv.title || "Untitled"}`}
      >
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              className="h-6 text-xs px-1 py-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-xs font-medium text-foreground truncate flex items-center gap-1">
              {conv.is_pinned && <Pin className="h-3 w-3 text-neon-blue shrink-0" />}
              <span className="truncate">
                {searchQuery ? highlightText(conv.title || "New Conversation", searchQuery) : (conv.title || "New Conversation")}
              </span>
            </p>
          )}
          <p className="text-[10px] text-muted-foreground font-mono">
            {formatTimestamp(conv.updated_at)}
          </p>
        </div>
        {!editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {onTogglePin && (
              <Button
                size="icon-xs"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => onTogglePin(conv.id, !conv.is_pinned)}
                aria-label={conv.is_pinned ? "Unpin conversation" : "Pin conversation"}
              >
                {conv.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </Button>
            )}
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={startEditing}
              aria-label="Rename conversation"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {onArchive && (
              <Button
                size="icon-xs"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => onArchive(conv.id, true)}
                aria-label="Archive conversation"
              >
                <Archive className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDelete(true)}
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <DeleteConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => {
          setShowDelete(false);
          onDelete(conv.id);
        }}
        title={conv.title || "New Conversation"}
      />
    </>
  );
}

function ConversationSidebar({
  conversations,
  archivedConversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  onArchive,
  searchQuery,
  onSearchChange,
}: ConversationSidebarProps) {
  const searchActive = searchQuery.trim().length > 0;

  const filtered = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery]
  );

  const pinned = useMemo(() => filtered.filter((c) => c.is_pinned), [filtered]);
  const recent = useMemo(() => filtered.filter((c) => !c.is_pinned), [filtered]);

  return (
    <aside className="glass-card flex flex-col w-full lg:w-64 shrink-0 overflow-hidden" aria-label="Conversations">
      <div className="p-3 border-b border-border-muted flex items-center justify-between gap-2">
        <h3 className="font-heading text-xs font-semibold text-foreground shrink-0">
          {searchActive ? "Search" : "Conversations"}
        </h3>
        <div className="flex items-center gap-1">
          {searchActive && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-neon-purple hover:text-neon-purple hover:bg-neon-purple/10"
            onClick={onNew}
          >
            <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
        </div>
      </div>

      <div className="px-2 pt-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-8 pl-7 pr-2 text-xs rounded-md"
            aria-label="Search conversations"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : filtered.length === 0 && searchActive ? (
          <p className="text-xs text-muted-foreground p-2">No conversations found.</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">No conversations yet.</p>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-1 pb-1">
                  Pinned
                </p>
                {pinned.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    activeId={activeId}
                    searchQuery={searchQuery}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onRename={onRename}
                    onTogglePin={onTogglePin}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            )}
            {recent.length > 0 && (
              <div className="space-y-1">
                {pinned.length > 0 && (
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-1 pt-2 pb-1">
                    Recent
                  </p>
                )}
                {recent.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    activeId={activeId}
                    searchQuery={searchQuery}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onRename={onRename}
                    onTogglePin={onTogglePin}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

export { ConversationSidebar };
