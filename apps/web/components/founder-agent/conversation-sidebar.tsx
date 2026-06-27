"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentConversationPublic } from "@/lib/api/founder-agent";

interface ConversationSidebarProps {
  conversations: AgentConversationPublic[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <aside className="glass-card flex flex-col w-full lg:w-64 shrink-0 overflow-hidden">
      <div className="p-3 border-b border-border-muted flex items-center justify-between">
        <h3 className="font-heading text-xs font-semibold text-foreground">History</h3>
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

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                activeId === conv.id
                  ? "bg-neon-purple/10 border border-neon-purple/20"
                  : "hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {conv.title || "New Conversation"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export { ConversationSidebar };
