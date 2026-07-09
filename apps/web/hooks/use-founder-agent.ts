"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveConversation,
  createFounderConversation,
  deleteFounderConversation,
  fetchAIHealth,
  fetchAIModels,
  fetchAIProviders,
  fetchAISettings,
  fetchArchivedConversations,
  fetchFounderConversation,
  fetchFounderConversations,
  fetchFounderUsage,
  fetchPromptSuggestions,
  fetchProviderPreferences,
  fetchProviderStatus,
  togglePinConversation,
  updateAISettings,
  updateFounderConversation,
  updateProviderPreferences,
  type AIProviderHealth,
  type AgentConversationDetail,
  type AgentConversationPublic,
  type AIModelPublic,
  type AIProviderPublic,
  type AISettings,
  type PromptSuggestion,
  type ProviderPreference,
  type ProviderStatus,
  type UsageSummary,
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

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateFounderConversation(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "conversations"] });
    },
  });
}

export function useTogglePinConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_pinned }: { id: string; is_pinned: boolean }) =>
      togglePinConversation(id, is_pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "conversations"] });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_archived }: { id: string; is_archived: boolean }) =>
      archiveConversation(id, is_archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "conversations"] });
    },
  });
}

export function useArchivedConversations() {
  return useQuery<AgentConversationPublic[]>({
    queryKey: ["founder-agent", "conversations", "archived"],
    queryFn: fetchArchivedConversations,
  });
}

export function useUsageSummary() {
  return useQuery<UsageSummary>({
    queryKey: ["founder-agent", "usage"],
    queryFn: fetchFounderUsage,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProviderPreferences() {
  return useQuery<ProviderPreference>({
    queryKey: ["founder-agent", "provider-preferences"],
    queryFn: fetchProviderPreferences,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProviderPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProviderPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "provider-preferences"] });
    },
  });
}

export function useProviderStatus() {
  return useQuery<ProviderStatus[]>({
    queryKey: ["founder-agent", "provider-status"],
    queryFn: fetchProviderStatus,
    staleTime: 1000 * 30,
  });
}

// ---------------------------------------------------------------------------
// AI Provider & Model Management hooks
// ---------------------------------------------------------------------------

export function useAIProviders() {
  return useQuery<AIProviderPublic[]>({
    queryKey: ["ai", "providers"],
    queryFn: fetchAIProviders,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAIModels(provider: string | null) {
  return useQuery<AIModelPublic[]>({
    queryKey: ["ai", "models", provider],
    queryFn: () => fetchAIModels(provider!),
    enabled: Boolean(provider),
    staleTime: 1000 * 30,
  });
}

export function useAISettings() {
  return useQuery<AISettings>({
    queryKey: ["ai", "settings"],
    queryFn: fetchAISettings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAISettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["founder-agent", "provider-preferences"] });
    },
  });
}

export function useAIHealth() {
  return useQuery<AIProviderHealth[]>({
    queryKey: ["ai", "health"],
    queryFn: fetchAIHealth,
    staleTime: 1000 * 30,
  });
}
