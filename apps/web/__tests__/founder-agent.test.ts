import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  exportFounderConversation,
  fetchAIHealth,
  fetchAIModels,
  fetchAIProviders,
  fetchAISettings,
  fetchFounderUsage,
  fetchProviderPreferences,
  fetchProviderStatus,
  searchFounderConversations,
  streamFounderChat,
  updateAISettings,
  updateFounderConversation,
  updateProviderPreferences,
  type AgentConversationPublic,
  type AIProviderHealth,
  type AISettings,
} from "@/lib/api/founder-agent";
import { filterConversations } from "@/components/founder-agent/search-utils";

function mockSSEResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "Content-Type": "text/event-stream" }),
    body: new ReadableStream({
      start(controller) {
        chunks.forEach((c) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: c })}\n\n`));
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
  } as Response;
}

describe("streamFounderChat", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should stream text chunks from SSE response", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSSEResponse(["Hello ", "world!"]));

    const chunks: string[] = [];
    for await (const chunk of streamFounderChat("conv-1", "test prompt")) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Hello ", "world!"]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/founder-agent/conversations/conv-1/chat"),
      expect.objectContaining({
        method: "POST",
        signal: undefined,
      })
    );
  });

  it("should pass AbortSignal to fetch when provided", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSSEResponse(["data"]));
    const controller = new AbortController();

    const iter = streamFounderChat("conv-1", "test", null, controller.signal);
    await iter.next();

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      })
    );
  });

  it("should throw AbortError when signal is aborted before response", async () => {
    global.fetch = vi.fn().mockImplementation(
      (_, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    const controller = new AbortController();
    const promise = (async () => {
      const chunks: string[] = [];
      for await (const chunk of streamFounderChat("conv-1", "test", null, controller.signal)) {
        chunks.push(chunk);
      }
      return chunks;
    })();

    controller.abort();

    await expect(promise).rejects.toThrow("Aborted");
  });

  it("should throw on 401 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    } as Response);

    const iter = streamFounderChat("conv-1", "test");
    await expect(iter.next()).rejects.toThrow("UNAUTHORIZED");
  });

  it("should throw on API error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ detail: "LLM provider unavailable" }),
    } as Response);

    const iter = streamFounderChat("conv-1", "test");
    await expect(iter.next()).rejects.toThrow("LLM provider unavailable");
  });

  it("should stop iteration on [DONE] signal", async () => {
    const encoder = new TextEncoder();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "text/event-stream" }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    } as Response);

    const chunks: string[] = [];
    for await (const chunk of streamFounderChat("conv-1", "test")) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([]);
  });
});

describe("updateFounderConversation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should send PATCH request with new title", async () => {
    const mockResponse = { data: { id: "conv-1", title: "New Title", user_id: "u1" } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await updateFounderConversation("conv-1", { title: "New Title" });

    expect(result.title).toBe("New Title");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/conversations/conv-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Title" }),
      })
    );
  });

  it("should throw UNAUTHORIZED on 401", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    } as Response);

    await expect(updateFounderConversation("conv-1", { title: "title" })).rejects.toThrow(
      "UNAUTHORIZED"
    );
  });

  it("should throw on API error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({}),
    } as Response);

    await expect(updateFounderConversation("bad-id", { title: "title" })).rejects.toThrow(
      "API error (404)"
    );
  });
});

describe("searchFounderConversations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call fetch with search URL and no options", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as Response);

    await searchFounderConversations("Hello");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/conversations/search?q=Hello",
      undefined
    );
  });

  it("should encode query parameter with encodeURIComponent", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as Response);

    await searchFounderConversations("hello world");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/conversations/search?q=hello%20world",
      undefined
    );
  });

  it("should throw UNAUTHORIZED on 401", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    } as Response);

    await expect(searchFounderConversations("test")).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("filterConversations", () => {
  const conversations: AgentConversationPublic[] = [
    { id: "1", user_id: "u1", title: "Lean Canvas", is_pinned: false, is_archived: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    { id: "2", user_id: "u1", title: "SWOT Analysis", is_pinned: false, is_archived: false, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
    { id: "3", user_id: "u1", title: "Pitch Deck", is_pinned: false, is_archived: false, created_at: "2026-01-03T00:00:00Z", updated_at: "2026-01-03T00:00:00Z" },
    { id: "4", user_id: "u1", title: null, is_pinned: false, is_archived: false, created_at: "2026-01-04T00:00:00Z", updated_at: "2026-01-04T00:00:00Z" },
  ];

  it("should return all conversations when query is empty", () => {
    const result = filterConversations(conversations, "");
    expect(result).toHaveLength(4);
  });

  it("should return all conversations when query is whitespace", () => {
    const result = filterConversations(conversations, "   ");
    expect(result).toHaveLength(4);
  });

  it("should search by partial title", () => {
    const result = filterConversations(conversations, "Lean");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should be case-insensitive", () => {
    const result = filterConversations(conversations, "lean");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should match uppercase query against lowercase titles", () => {
    const result = filterConversations(conversations, "SWOT");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("should return empty array when no results match", () => {
    const result = filterConversations(conversations, "zzzzzzz");
    expect(result).toHaveLength(0);
  });

  it("should match partial word fragments", () => {
    const result = filterConversations(conversations, "Deck");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("should preserve conversation ordering", () => {
    const result = filterConversations(conversations, "a");
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
    expect(result).toHaveLength(2);
  });

  it("should treat null title as empty string and not match", () => {
    const result = filterConversations(conversations, "null");
    expect(result).toHaveLength(0);
  });
});

describe("fetchFounderUsage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch usage summary", async () => {
    const mockUsage = {
      data: {
        total_requests: 42,
        total_tokens_input: 15000,
        total_tokens_output: 30000,
        avg_latency_ms: 1234.5,
        by_provider: { mock: 42 },
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUsage,
    } as Response);

    const result = await fetchFounderUsage();

    expect(result).toEqual(mockUsage.data);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/usage",
      undefined
    );
  });

  it("should return zeros when no usage", async () => {
    const emptyUsage = {
      data: {
        total_requests: 0,
        total_tokens_input: 0,
        total_tokens_output: 0,
        avg_latency_ms: 0,
        by_provider: {},
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => emptyUsage,
    } as Response);

    const result = await fetchFounderUsage();

    expect(result.total_requests).toBe(0);
    expect(result.by_provider).toEqual({});
  });

  it("should throw UNAUTHORIZED on 401", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    } as Response);

    await expect(fetchFounderUsage()).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("exportFounderConversation", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:http://test/export");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  function mockBlobResponse(
    content: string,
    contentType: string,
    disposition?: string
  ) {
    const headers = new Headers({ "Content-Type": contentType });
    if (disposition) {
      headers.set("Content-Disposition", disposition);
    }
    return {
      ok: true,
      status: 200,
      headers,
      blob: async () => new Blob([content], { type: contentType }),
    } as unknown as Response;
  }

  it("should fetch export endpoint and trigger download", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockBlobResponse("# Hello", "text/markdown", 'attachment; filename="conv.md"')
    );

    const anchor = document.createElement("a");
    const anchorClick = vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    await exportFounderConversation("conv-123", "md");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/conversations/conv-123/export?format=md"
    );
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe("conv.md");
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://test/export");
  });

  it("should fallback to default filename when no Content-Disposition", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockBlobResponse("{}", "application/json"));

    const anchor = document.createElement("a");
    vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    await exportFounderConversation("conv-123", "json");

    expect(anchor.download).toBe("conversation-conv-123.json");
  });

  it("should use correct URL format parameter per format", async () => {
    const anchor = document.createElement("a");
    vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    const mockFetch = vi.fn().mockResolvedValue(
      mockBlobResponse("{}", "application/json")
    );
    global.fetch = mockFetch;

    await exportFounderConversation("conv-1", "pdf");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/conversations/conv-1/export?format=pdf"
    );

    await exportFounderConversation("conv-1", "json");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/conversations/conv-1/export?format=json"
    );
  });

  it("should throw UNAUTHORIZED on 401", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    } as Response);

    await expect(exportFounderConversation("conv-123", "md")).rejects.toThrow("UNAUTHORIZED");
  });

  it("should throw on API error with detail", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ detail: "Unsupported format" }),
    } as Response);

    await expect(exportFounderConversation("conv-123", "docx" as "md")).rejects.toThrow(
      "Unsupported format"
    );
  });

  it("should throw on API error without detail", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as Response);

    await expect(exportFounderConversation("conv-123", "md")).rejects.toThrow(
      "Export failed (500)"
    );
  });
});

describe("fetchProviderPreferences", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch provider preferences", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { provider: "gemini" } }),
    } as Response);

    const result = await fetchProviderPreferences();
    expect(result.provider).toBe("gemini");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/provider/preferences",
      undefined
    );
  });

  it("should throw UNAUTHORIZED on 401", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    } as Response);

    await expect(fetchProviderPreferences()).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("updateProviderPreferences", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should send PUT request with provider name", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { provider: "ollama" } }),
    } as Response);

    const result = await updateProviderPreferences("ollama");
    expect(result.provider).toBe("ollama");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/provider/preferences",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "ollama" }),
      })
    );
  });

  it("should throw on invalid provider response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ detail: "Unknown provider 'bad'" }),
    } as Response);

    await expect(updateProviderPreferences("bad")).rejects.toThrow(
      "Unknown provider 'bad'"
    );
  });
});

describe("fetchProviderStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch provider status list", async () => {
    const mockStatus = [
      { name: "gemini", displayName: "Gemini", available: true, configured: true },
      { name: "ollama", displayName: "Ollama (Local)", available: false, configured: false },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockStatus }),
    } as Response);

    const result = await fetchProviderStatus();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("gemini");
    expect(result[0].configured).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/founder-agent/provider/status",
      undefined
    );
  });
});

describe("streamFounderChat with provider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should include provider in request body when specified", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "Content-Type": "text/event-stream" }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    } as Response);

    const iter = streamFounderChat("conv-1", "test prompt", null, undefined, "ollama");
    await iter.next();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/founder-agent/conversations/conv-1/chat"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"provider"'),
      })
    );

    const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(callBody.provider).toBe("ollama");
  });

  it("should not include provider when not specified", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "Content-Type": "text/event-stream" }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    } as Response);

    const iter = streamFounderChat("conv-1", "test prompt");
    await iter.next();

    const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(callBody.provider).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AI Provider Management API
// ---------------------------------------------------------------------------

describe("fetchAIProviders", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("should fetch providers list", async () => {
    const mockData = [
      { id: "gemini", displayName: "Gemini", status: "available", defaultModel: "gemini-2.0-flash" },
      { id: "openai", displayName: "OpenAI", status: "available", defaultModel: "gpt-4o" },
    ];
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: mockData }) } as Response);

    const result = await fetchAIProviders();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("gemini");
    expect(fetch).toHaveBeenCalledWith("/api/v1/ai/providers", undefined);
  });

  it("should throw UNAUTHORIZED on 401", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: "Unauthorized", json: async () => ({}) } as Response);
    await expect(fetchAIProviders()).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("fetchAIModels", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("should fetch models for a provider", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ id: "gpt-4o" }, { id: "gpt-4o-mini" }] }) } as Response);

    const result = await fetchAIModels("openai");
    expect(result).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith("/api/v1/ai/providers/openai/models", undefined);
  });

  it("should encode provider parameter", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) } as Response);
    await fetchAIModels("gemini 2.0");
    expect(fetch).toHaveBeenCalledWith("/api/v1/ai/providers/gemini%202.0/models", undefined);
  });
});

describe("fetchAISettings", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("should fetch AI settings", async () => {
    const mockSettings: AISettings = {
      defaultProvider: "ollama",
      defaultModel: "llama3",
      temperature: 0.5,
      topP: 0.9,
      maxTokens: 2048,
      streamingEnabled: false,
      memoryEnabled: true,
      maxRetrievedDocs: 5,
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: mockSettings }) } as Response);

    const result = await fetchAISettings();
    expect(result.defaultProvider).toBe("ollama");
    expect(result.defaultModel).toBe("llama3");
    expect(result.temperature).toBe(0.5);
    expect(result.streamingEnabled).toBe(false);
  });
});

describe("updateAISettings", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("should send PUT request with settings", async () => {
    const updated: AISettings = {
      defaultProvider: "gemini",
      defaultModel: "gemini-2.0-flash",
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      streamingEnabled: true,
      memoryEnabled: true,
      maxRetrievedDocs: 5,
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: updated }) } as Response);

    const result = await updateAISettings({ defaultProvider: "gemini" });
    expect(result.defaultProvider).toBe("gemini");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/ai/settings",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("gemini"),
      })
    );
  });
});

describe("fetchAIHealth", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("should fetch provider health statuses", async () => {
    const mockHealth: AIProviderHealth[] = [
      { provider: "gemini", displayName: "Gemini", status: "healthy", configured: true },
      { provider: "ollama", displayName: "Ollama (Local)", status: "unavailable", configured: false },
    ];
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: mockHealth }) } as Response);

    const result = await fetchAIHealth();
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("healthy");
    expect(result[1].configured).toBe(false);
  });
});


