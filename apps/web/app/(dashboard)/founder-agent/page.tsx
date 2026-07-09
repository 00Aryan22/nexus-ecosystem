"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, BarChart3, Bot, Download, RefreshCw, Send, Square } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { ChatMessage, type ChatMessageData } from "@/components/founder-agent/chat-message";
import { ConversationSidebar } from "@/components/founder-agent/conversation-sidebar";
import { ModelSelector } from "@/components/founder-agent/model-selector";
import { PromptSuggestions } from "@/components/founder-agent/prompt-suggestions";
import { ProviderSelector } from "@/components/founder-agent/provider-selector";
import { UsageAnalytics } from "@/components/founder-agent/usage-analytics";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  useAIHealth,
  useAIModels,
  useAIProviders,
  useAISettings,
  useArchiveConversation,
  useArchivedConversations,
  useCreateConversation,
  useDeleteConversation,
  useFounderConversation,
  useFounderConversations,
  usePromptSuggestions,
  useProviderPreferences,
  useProviderStatus,
  useTogglePinConversation,
  useUpdateAISettings,
  useUpdateConversationTitle,
  useUsageSummary,
} from "@/hooks/use-founder-agent";
import { exportFounderConversation, streamFounderChat, type AIProviderHealth, type PromptSuggestion } from "@/lib/api/founder-agent";

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
  const [searchInput, setSearchInput] = useState("");
  const [usageOpen, setUsageOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [memoryActive, setMemoryActive] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const conversationsQuery = useFounderConversations();
  const conversationQuery = useFounderConversation(activeConversationId);
  const suggestionsQuery = usePromptSuggestions();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const renameConversation = useUpdateConversationTitle();
  const togglePin = useTogglePinConversation();
  const archiveConv = useArchiveConversation();
  const archivedQuery = useArchivedConversations();
  const usageSummary = useUsageSummary();
  const providerPrefs = useProviderPreferences();
  const providerStatus = useProviderStatus();
  const aiSettings = useAISettings();
  const aiProviders = useAIProviders();
  const aiHealth = useAIHealth();
  const [currentProvider, setCurrentProvider] = useState<string>("gemini");
  const [currentModel, setCurrentModel] = useState<string>("gemini-1.5-pro");
  const { data: modelsData, isLoading: modelsLoading, refetch: refetchModels } = useAIModels(currentProvider);
  const updateAiSettings = useUpdateAISettings();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [dismissedHealthWarning, setDismissedHealthWarning] = useState(false);

  const healthDetails: Record<string, AIProviderHealth> = {};
  if (aiHealth.data) {
    for (const h of aiHealth.data) {
      healthDetails[h.provider] = h;
    }
  }

  const currentHealthStatus = healthDetails[currentProvider]?.status;

  useEffect(() => {
    if (aiSettings.data && !settingsLoaded) {
      setCurrentProvider(aiSettings.data.defaultProvider);
      setCurrentModel(aiSettings.data.defaultModel);
      setMemoryActive(aiSettings.data.streamingEnabled !== false);
      setSettingsLoaded(true);
    }
  }, [aiSettings.data, settingsLoaded]);

  useEffect(() => {
    if (providerPrefs.data && !settingsLoaded && !aiSettings.data) {
      setCurrentProvider(providerPrefs.data.provider);
    }
  }, [providerPrefs.data, settingsLoaded, aiSettings.data]);

  useEffect(() => {
    setDismissedHealthWarning(false);
  }, [currentProvider]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  useEffect(() => {
    if (conversationQuery.data) {
      const loaded = toChatMessages(conversationQuery.data.messages);
      setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE]);
    }
  }, [conversationQuery.data]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && streaming) {
        e.preventDefault();
        handleStop();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (activeConversationId) return activeConversationId;
    const conv = await createConversation.mutateAsync();
    setActiveConversationId(conv.id);
    return conv.id;
  }, [activeConversationId, createConversation]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
  }, []);

  const handleSend = useCallback(
    async (text: string, planType?: string | null) => {
      if (!text.trim() || streaming) return;

      setError(null);
      setLastPrompt(text);
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

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const conversationId = await ensureConversation();
        let fullText = "";

        for await (const chunk of streamFounderChat(conversationId, text, planType, controller.signal, currentProvider, memoryActive)) {
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
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to send message";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [streaming, ensureConversation, queryClient, currentProvider]
  );

  const handleRetry = useCallback(async () => {
    if (lastPrompt) {
      await handleSend(lastPrompt);
    }
  }, [lastPrompt, handleSend]);

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex < 0) return;

      const lastUserMsg = [...messages]
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.sender === "user");
      if (lastUserMsg) {
        await handleSend(lastUserMsg.content);
      }
    },
    [messages, handleSend]
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

  const handleRenameConversation = (id: string, title: string) => {
    renameConversation.mutate({ id, title });
  };

  const handleExport = async (format: "md" | "json" | "pdf") => {
    if (!activeConversationId || exporting) return;
    setExporting(true);
    setExportOpen(false);
    try {
      await exportFounderConversation(activeConversationId, format);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setCurrentProvider(provider);
    const providersList = aiProviders.data ?? [];
    const providerMeta = providersList.find((p) => p.id === provider);
    const newModel = providerMeta?.defaultModel ?? modelsData?.[0]?.id ?? "gemini-1.5-pro";
    setCurrentModel(newModel);
    updateAiSettings.mutate({ defaultProvider: provider, defaultModel: newModel });
  };

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    updateAiSettings.mutate({ defaultProvider: currentProvider, defaultModel: model });
  };

  const handleRefreshModels = () => {
    refetchModels();
  };

  const handleSuggestion = (suggestion: PromptSuggestion) => {
    handleSend(suggestion.prompt, suggestion.plan_type);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend(input);
    }
    if (e.key === "ArrowUp" && !input && lastPrompt) {
      e.preventDefault();
      setInput(lastPrompt);
    }
  };

  const isLoading = conversationsQuery.isLoading || conversationQuery.isLoading;
  const pageError =
    conversationsQuery.error instanceof Error
      ? conversationsQuery.error.message
      : conversationQuery.error instanceof Error
        ? conversationQuery.error.message
        : null;

  const modelList = (modelsData ?? []).map((m) => m.id);

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4 max-w-6xl mx-auto">
      <PageHeader
        title="AI Founder Agent"
        description="Conversational intelligence to validate ideas, structure business models, and build launch plans."
        action={
          <div className="flex items-center gap-2">
            <ProviderSelector
              providers={providerStatus.data ?? []}
              currentProvider={currentProvider}
              onSelect={handleProviderChange}
              disabled={streaming}
              loading={providerStatus.isLoading}
              healthDetails={healthDetails}
            />
            <ModelSelector
              models={modelList}
              currentModel={currentModel}
              onSelect={handleModelChange}
              onRefresh={handleRefreshModels}
              disabled={streaming}
              loading={modelsLoading}
            />
            <div className="relative" ref={exportRef}>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                disabled={!activeConversationId || exporting}
                onClick={() => setExportOpen((prev) => !prev)}
              >
                <Download className="h-4 w-4 mr-1.5" />
                {exporting ? "Exporting..." : "Export"}
              </Button>
              {exportOpen && (
                <div className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-border bg-background shadow-lg" role="menu">
                  <button className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted rounded-t-lg" role="menuitem" onClick={() => handleExport("md")}>
                    Markdown (.md)
                  </button>
                  <button className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted" role="menuitem" onClick={() => handleExport("pdf")}>
                    PDF (.pdf)
                  </button>
                  <button className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted rounded-b-lg" role="menuitem" onClick={() => handleExport("json")}>
                    JSON (.json)
                  </button>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setUsageOpen(true)}
            >
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Usage
            </Button>
          </div>
        }
      />

      <UsageAnalytics
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        summary={usageSummary.data}
        loading={usageSummary.isLoading}
      />

      {currentHealthStatus && currentHealthStatus !== "healthy" && !dismissedHealthWarning && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {currentProvider === "gemini" || currentProvider === "openai"
              ? `${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)} API key may not be configured. Chat may fail.`
              : `${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)} is unavailable.`}
          </span>
          <button className="text-xs underline hover:no-underline" onClick={() => setDismissedHealthWarning(true)}>
            Dismiss
          </button>
        </div>
      )}

      {memoryActive && messages.some((m) => m.sender === "agent" && m.content && !m.streaming) && (
        <StatusBanner kind="info" message="Using Workspace Knowledge — AI has access to your uploaded documents." className="mb-0" />
      )}

      <div className="flex flex-1 gap-4 min-h-0 flex-col lg:flex-row">
        <ConversationSidebar
          conversations={conversationsQuery.data ?? []}
          archivedConversations={archivedQuery.data ?? []}
          activeId={activeConversationId}
          loading={conversationsQuery.isLoading}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
          onTogglePin={(id, pinned) => togglePin.mutate({ id, is_pinned: pinned })}
          onArchive={(id, archived) => archiveConv.mutate({ id, is_archived: archived })}
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
        />

        <div className="glass-card flex flex-col flex-1 overflow-hidden min-h-0">
          {suggestionsQuery.data && !streaming && messages.length <= 1 && (
            <PromptSuggestions
              suggestions={suggestionsQuery.data}
              disabled={streaming}
              onSelect={handleSuggestion}
            />
          )}

          <div
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            role="log"
            aria-label="Chat messages"
            aria-live="polite"
          >
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
              messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onRetry={m.sender === "user" ? handleRetry : undefined}
                  onRegenerate={m.sender === "agent" ? handleRegenerate : undefined}
                />
              ))
            )}

            {isLoading && messages.length <= 1 && <PageSpinner label="Loading conversation..." />}

            {error && !streaming && (
              <div className="flex flex-col items-center gap-2 py-4">
                <ErrorState message={error} className="py-4" />
                {lastPrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-muted hover:bg-white/5"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
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
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your AI co-founder... (Ctrl+Enter to send)"
                className="w-full pr-24 h-12 rounded-xl text-base bg-surface-obsidian border-border-muted focus:border-neon-purple focus:ring-neon-purple/30"
                disabled={streaming}
                aria-label="Chat input"
              />
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                {streaming && (
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-red-500/80 hover:bg-red-500 text-white"
                    onClick={handleStop}
                    aria-label="Stop generation"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type={streaming ? "button" : "submit"}
                  size="icon"
                  disabled={!input.trim() || streaming}
                  className="h-9 w-9 rounded-lg bg-neon-purple hover:bg-neon-purple/80 text-white"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
              {streaming
                ? "Press Esc to stop generation"
                : "Ctrl+Enter to send · ↑ to edit last prompt"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
