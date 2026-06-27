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

export async function* streamFounderChat(
  conversationId: string,
  prompt: string,
  planType?: string | null
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(
    `/api/v1/founder-agent/conversations/${conversationId}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, plan_type: planType ?? null }),
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
