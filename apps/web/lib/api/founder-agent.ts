export type AgentMessagePublic = {
  id: string;
  conversation_id: string;
  sender: "user" | "agent";
  content: string;
  created_at: string;
};

export type AgentConversationPublic = {
  id: string;
  user_id: string;
  title: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type AgentConversationDetail = AgentConversationPublic & {
  messages: AgentMessagePublic[];
};

export type PromptSuggestion = {
  label: string;
  prompt: string;
  plan_type: string | null;
};

export type StartupPlanPublic = {
  id: string;
  conversation_id: string;
  plan_type: string;
  content_json: Record<string, unknown>;
  created_at: string;
};

export type UsageSummary = {
  total_requests: number;
  total_tokens_input: number;
  total_tokens_output: number;
  avg_latency_ms: number;
  by_provider: Record<string, number>;
};

export type ConversationSearchResult = {
  id: string;
  title: string | null;
  match_preview: string | null;
  created_at: string;
  updated_at: string;
};

type ApiResponseEnvelope<T> = {
  data: T | null;
  error: { message?: string } | null;
};

async function founderRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || res.statusText);
  }

  const envelope = (await res.json()) as ApiResponseEnvelope<T>;
  if (envelope.error) {
    throw new Error(envelope.error.message || "Unknown API error");
  }
  if (envelope.data === null || envelope.data === undefined) {
    throw new Error("No data returned");
  }
  return envelope.data;
}

export async function fetchFounderConversations(): Promise<AgentConversationPublic[]> {
  return founderRequest("/api/v1/founder-agent/conversations");
}

export async function createFounderConversation(): Promise<AgentConversationPublic> {
  return founderRequest("/api/v1/founder-agent/conversations", { method: "POST" });
}

export async function fetchFounderConversation(
  id: string
): Promise<AgentConversationDetail> {
  return founderRequest(`/api/v1/founder-agent/conversations/${id}`);
}

export async function updateFounderConversation(
  id: string,
  updates: { title?: string; is_pinned?: boolean; is_archived?: boolean }
): Promise<AgentConversationPublic> {
  return founderRequest(`/api/v1/founder-agent/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function togglePinConversation(id: string, is_pinned: boolean): Promise<AgentConversationPublic> {
  return updateFounderConversation(id, { is_pinned });
}

export async function archiveConversation(id: string, is_archived: boolean): Promise<AgentConversationPublic> {
  return updateFounderConversation(id, { is_archived });
}

export async function fetchArchivedConversations(): Promise<AgentConversationPublic[]> {
  return founderRequest("/api/v1/founder-agent/conversations/archived");
}

export async function deleteFounderConversation(
  id: string
): Promise<{ deleted: boolean }> {
  return founderRequest(`/api/v1/founder-agent/conversations/${id}`, {
    method: "DELETE",
  });
}

export async function fetchPromptSuggestions(): Promise<PromptSuggestion[]> {
  return founderRequest("/api/v1/founder-agent/prompts/suggestions");
}

export async function fetchFounderUsage(): Promise<UsageSummary> {
  return founderRequest("/api/v1/founder-agent/usage");
}

export async function exportFounderConversation(
  conversationId: string,
  format: "md" | "json" | "pdf"
): Promise<void> {
  const res = await fetch(
    `/api/v1/founder-agent/conversations/${conversationId}/export?format=${format}`
  );

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.error?.message || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename=["']?([^"';]+)["']?/);
  const filename = match?.[1] ?? `conversation-${conversationId.slice(0, 8)}.${format}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function searchFounderConversations(
  query: string
): Promise<ConversationSearchResult[]> {
  return founderRequest(
    `/api/v1/founder-agent/conversations/search?q=${encodeURIComponent(query)}`
  );
}

export type ProviderPreference = {
  provider: string;
};

export type ProviderStatus = {
  name: string;
  displayName: string;
  available: boolean;
  configured: boolean;
};

// ---------------------------------------------------------------------------
// AI Provider & Model Management types (from /api/v1/ai/*)
// ---------------------------------------------------------------------------

export type AIProviderPublic = {
  id: string;
  displayName: string;
  healthy: boolean;
  defaultModel: string;
  supportsStreaming: boolean;
  supportsVision: boolean;
};

export type AIModelPublic = {
  id: string;
};

export type AISettings = {
  defaultProvider: string;
  defaultModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  streamingEnabled: boolean;
  memoryEnabled: boolean;
  maxRetrievedDocs: number;
};

export type AIProviderHealth = {
  provider: string;
  displayName: string;
  status: string;
  configured: boolean;
};

export async function fetchAIProviders(): Promise<AIProviderPublic[]> {
  return founderRequest("/api/v1/ai/providers");
}

export async function fetchAIModels(provider: string): Promise<AIModelPublic[]> {
  return founderRequest(`/api/v1/ai/providers/${encodeURIComponent(provider)}/models`);
}

export async function fetchAISettings(): Promise<AISettings> {
  return founderRequest("/api/v1/ai/settings");
}

export async function updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
  return founderRequest("/api/v1/ai/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

export async function fetchAIHealth(): Promise<AIProviderHealth[]> {
  return founderRequest("/api/v1/ai/health");
}

export async function fetchProviderPreferences(): Promise<ProviderPreference> {
  return founderRequest("/api/v1/founder-agent/provider/preferences");
}

export async function updateProviderPreferences(
  provider: string
): Promise<ProviderPreference> {
  return founderRequest("/api/v1/founder-agent/provider/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
}

export async function fetchProviderStatus(): Promise<ProviderStatus[]> {
  return founderRequest("/api/v1/founder-agent/provider/status");
}

export async function* streamFounderChat(
  conversationId: string,
  prompt: string,
  planType?: string | null,
  signal?: AbortSignal,
  provider?: string | null,
  enableMemory?: boolean
): AsyncGenerator<string, void, unknown> {
  const body: Record<string, unknown> = { prompt, plan_type: planType ?? null };
  if (provider) body.provider = provider;
  if (enableMemory !== undefined) body.enable_memory = enableMemory;
  const res = await fetch(
    `/api/v1/founder-agent/conversations/${conversationId}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }
  );

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || "Chat request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as { text?: string; error?: string };
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          yield parsed.text;
        }
      } catch (error) {
        if (error instanceof Error && error.message !== "Unexpected end of JSON input") {
          throw error;
        }
      }
    }
  }
}
