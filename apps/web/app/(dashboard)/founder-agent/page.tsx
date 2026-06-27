"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { ChatMessage, type ChatMessageData } from "@/components/founder-agent/chat-message";
import { ConversationSidebar } from "@/components/founder-agent/conversation-sidebar";
import { PromptSuggestions } from "@/components/founder-agent/prompt-suggestions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import {
  useCreateConversation,
  useDeleteConversation,
  useFounderConversation,
  useFounderConversations,
  usePromptSuggestions,
} from "@/hooks/use-founder-agent";
import { streamFounderChat, type PromptSuggestion } from "@/lib/api/founder-agent";

const WELCOME_MESSAGE: ChatMessageData = {
  id: "welcome",
  sender: "agent",
  content:
    "Hello! I am your AI Founder Agent. I can help you draft roadmaps, build Lean Canvases, analyze competitors, recommend tech stacks, and outline pitch decks. How can I assist you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

function toChatMessages(
  apiMessages: { id: string; sender: string; content: string; created_at: string }[]
): ChatMessageData[] {
  return apiMessages.map((m) => ({
    id: m.id,
    sender: m.sender === "user" ? "user" : "agent",
    content: m.content,
    timestamp: new Date(m.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
}

export default function FounderAgentPage() {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useFounderConversations();
  const conversationQuery = useFounderConversation(activeConversationId);
  const suggestionsQuery = usePromptSuggestions();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (conversationQuery.data) {
      const loaded = toChatMessages(conversationQuery.data.messages);
      setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE]);
    }
  }, [conversationQuery.data]);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (activeConversationId) return activeConversationId;
    const conv = await createConversation.mutateAsync();
    setActiveConversationId(conv.id);
    return conv.id;
  }, [activeConversationId, createConversation]);

  const handleSend = useCallback(
    async (text: string, planType?: string | null) => {
      if (!text.trim() || streaming) return;

      setError(null);
      setInput("");

      const userMsg: ChatMessageData = {
        id: `user-${Date.now()}`,
        sender: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const agentMsgId = `agent-${Date.now()}`;
      const agentMsg: ChatMessageData = {
        id: agentMsgId,
        sender: "agent",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        streaming: true,
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== "welcome"), userMsg, agentMsg]);
      setStreaming(true);

      try {
        const conversationId = await ensureConversation();
        let fullText = "";

        for await (const chunk of streamFounderChat(conversationId, text, planType)) {
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId ? { ...m, content: fullText, streaming: true } : m
            )
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId ? { ...m, content: fullText, streaming: false } : m
          )
        );

        queryClient.invalidateQueries({ queryKey: ["founder-agent", "conversations"] });
        queryClient.invalidateQueries({
          queryKey: ["founder-agent", "conversation", conversationId],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send message";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
      } finally {
        setStreaming(false);
      }
    },
    [streaming, ensureConversation, queryClient]
  );

  const handleNewConversation = async () => {
    setError(null);
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    const conv = await createConversation.mutateAsync();
    setActiveConversationId(conv.id);
  };

  const handleSelectConversation = (id: string) => {
    setError(null);
    setActiveConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation.mutateAsync(id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const handleSuggestion = (suggestion: PromptSuggestion) => {
    handleSend(suggestion.prompt, suggestion.plan_type);
  };

  const isLoading = conversationsQuery.isLoading || conversationQuery.isLoading;
  const pageError =
    conversationsQuery.error instanceof Error
      ? conversationsQuery.error.message
      : conversationQuery.error instanceof Error
        ? conversationQuery.error.message
        : null;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4 max-w-6xl mx-auto">
      <PageHeader
        title="AI Founder Agent"
        description="Conversational intelligence to validate ideas, structure business models, and build launch plans."
      />

      <div className="flex flex-1 gap-4 min-h-0 flex-col lg:flex-row">
        <ConversationSidebar
          conversations={conversationsQuery.data ?? []}
          activeId={activeConversationId}
          loading={conversationsQuery.isLoading}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
        />

        <div className="glass-card flex flex-col flex-1 overflow-hidden min-h-0">
          {suggestionsQuery.data && (
            <PromptSuggestions
              suggestions={suggestionsQuery.data}
              disabled={streaming}
              onSelect={handleSuggestion}
            />
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {pageError && !error ? (
              <ErrorState
                message={pageError}
                onRetry={() => {
                  conversationsQuery.refetch();
                  if (activeConversationId) conversationQuery.refetch();
                }}
              />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="Hello, Founder"
                description="Describe your startup idea or pick a suggested prompt below."
                className="h-full"
              />
            ) : (
              messages.map((m) => <ChatMessage key={m.id} message={m} />)
            )}

            {isLoading && messages.length <= 1 && <PageSpinner label="Loading conversation..." />}

            {error && (
              <ErrorState message={error} onRetry={() => setError(null)} className="py-8" />
            )}

            {streaming && messages[messages.length - 1]?.content === "" && (
              <PageSpinner label="AI Founder Agent is thinking..." />
            )}

            <div ref={scrollRef} />
          </div>

          <div className="p-4 border-t border-border-muted bg-surface-slate/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="relative flex-1"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message your AI co-founder..."
                className="w-full pr-12 h-12 rounded-xl text-base bg-surface-obsidian border-border-muted focus:border-neon-purple focus:ring-neon-purple/30"
                disabled={streaming}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || streaming}
                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-neon-purple hover:bg-neon-purple/80 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
