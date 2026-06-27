"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFounderConversation,
  deleteFounderConversation,
  fetchFounderConversation,
  fetchFounderConversations,
  fetchPromptSuggestions,
  type AgentConversationDetail,
  type AgentConversationPublic,
  type PromptSuggestion,
} from "@/lib/api/founder-agent";

export function useFounderConversations() {
  return useQuery<AgentConversationPublic[]>({
    queryKey: ["founder-agent", "conversations"],
    queryFn: fetchFounderConversations,
  });
}

export function useFounderConversation(conversationId: string | null) {
  return useQuery<AgentConversationDetail>({
    queryKey: ["founder-agent", "conversation", conversationId],
    queryFn: () => fetchFounderConversation(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function usePromptSuggestions() {
  return useQuery<PromptSuggestion[]>({
    queryKey: ["founder-agent", "suggestions"],
    queryFn: fetchPromptSuggestions,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFounderConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFounderConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "conversations"] });
    },
  });
}
