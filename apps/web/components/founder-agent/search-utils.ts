import type { AgentConversationPublic } from "@/lib/api/founder-agent";

export function filterConversations(
  conversations: AgentConversationPublic[],
  query: string
): AgentConversationPublic[] {
  const trimmed = query.trim();
  if (!trimmed) return conversations;
  const lower = trimmed.toLowerCase();
  return conversations.filter((c) => (c.title ?? "").toLowerCase().includes(lower));
}
