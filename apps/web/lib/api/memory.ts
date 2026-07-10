export type KnowledgeDocument = {
  id: string;
  workspace_id: string | null;
  title: string;
  source: string;
  content: string;
  doc_metadata: Record<string, unknown> | null;
  embedding_provider: string;
  embedding_model: string;
  created_at: string;
  updated_at: string;
};

export type DocumentCreate = {
  workspace_id?: string | null;
  title: string;
  source: string;
  content: string;
  doc_metadata?: Record<string, unknown> | null;
};

export type SearchResult = {
  id: string;
  title: string;
  source: string;
  snippet: string;
  score: number;
  doc_metadata: Record<string, unknown> | null;
  created_at: string;
};

type ApiResponseEnvelope<T> = {
  data: T | null;
  error: { message?: string } | null;
  meta?: Record<string, unknown>;
};

async function memoryRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `API error (${res.status})`);
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

export async function fetchDocuments(
  workspaceId?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<KnowledgeDocument[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspace_id", workspaceId);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  return memoryRequest(`/api/v1/memory/documents?${params.toString()}`);
}

export async function createDocument(body: DocumentCreate): Promise<KnowledgeDocument> {
  return memoryRequest("/api/v1/memory/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteDocument(id: string): Promise<{ deleted: boolean }> {
  return memoryRequest(`/api/v1/memory/documents/${id}`, {
    method: "DELETE",
  });
}

export async function searchDocuments(
  query: string,
  topK: number = 5,
  workspaceId?: string
): Promise<SearchResult[]> {
  return memoryRequest("/api/v1/memory/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      workspace_id: workspaceId ?? null,
    }),
  });
}
