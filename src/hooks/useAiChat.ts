import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveConversation,
  getConversation,
  getConversations,
  sendChatMessage,
} from '@/services/aiChat';

const CONVERSATIONS_KEY = ['aiChat', 'conversations'] as const;
const conversationKey = (id: string) => ['aiChat', 'conversation', id] as const;

/** How many past threads the history panel lists. */
const HISTORY_LIMIT = 50;

/**
 * The owner's conversation history, most recent first.
 *
 * `totalConversations` comes from the list endpoint's own pagination, which
 * lets the plan's conversation cap be caught before the request rather than
 * after a 403 — and matters because the cap's remedy ("delete an old one")
 * is only actionable if the old ones are actually reachable.
 */
export const useConversationHistory = (enabled: boolean) =>
  useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => getConversations({ limit: HISTORY_LIMIT }),
    enabled,
    select: (res) => ({
      conversations: res.data,
      latest: res.data[0] ?? null,
      totalConversations: res.pagination.total,
    }),
  });

export const useConversationMessages = (conversationId: string | undefined) =>
  useQuery({
    queryKey: conversationId ? conversationKey(conversationId) : conversationKey('none'),
    queryFn: () => getConversation(conversationId as string),
    enabled: !!conversationId,
  });

/**
 * Sends one message. The response carries only the model's turn, not an echo
 * of the question — so the screen shows an optimistic local bubble for the
 * user's own message until this resolves and the thread refetches.
 */
export const useSendChatMessage = (conversationId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => sendChatMessage({ conversationId, message }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: conversationKey(response.data.conversationId) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
};

export const useArchiveConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveConversation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.removeQueries({ queryKey: conversationKey(id) });
    },
  });
};
