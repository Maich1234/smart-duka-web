import api from '@/lib/api';

/**
 * Smart Duka AI chat — the business consultant thread.
 *
 * Owner-only on the backend (the whole /ai router is `ownerOnly`), and gated
 * behind an active subscription, the plan's ai_insights feature, and the
 * shop's own aiEnabled toggle. useAiAccess() already composes all three.
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  /** Which real data the answer was grounded in; drives the "Based on" line. */
  toolsUsed?: string[];
  createdAt: string;
}

export interface SendChatMessageData {
  conversationId: string;
  message: ChatMessage;
  source: 'gemini' | 'fallback' | 'error';
}

export interface ConversationSummary {
  _id: string;
  title: string | null;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: ConversationSummary;
  messages: (ChatMessage & { _id: string })[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: { page: number; limit: number; total: number; pages: number };
}

/**
 * One turn. A single question can cost several Gemini round trips
 * server-side when the model calls tools, so this overrides the default
 * timeout rather than mistaking a slow-but-successful answer for a failure.
 */
export async function sendChatMessage(params: {
  conversationId?: string;
  message: string;
}): Promise<ApiResponse<SendChatMessageData>> {
  try {
    const res = await api.post('/ai/chat', params, { timeout: 30000 });
    return res.data;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'ECONNABORTED') {
      throw new Error('Smart Duka AI is taking longer than usual. Please try again.');
    }
    throw err;
  }
}

export async function getConversations(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ConversationSummary[]>> {
  const res = await api.get('/ai/chat/conversations', { params });
  return res.data;
}

export async function getConversation(
  id: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<ConversationDetail>> {
  const res = await api.get(`/ai/chat/conversations/${id}`, { params });
  return res.data;
}

/** Soft-delete. Deliberately not subscription-gated server-side, so a lapsed
 *  owner can still tidy up threads. */
export async function archiveConversation(id: string): Promise<ApiResponse<null>> {
  const res = await api.delete(`/ai/chat/conversations/${id}`);
  return res.data;
}

/**
 * Turns the backend's chat-limit rejections into something a person can act
 * on. Each has a different remedy, so a single "limit reached" would leave
 * owners guessing which wall they hit.
 */
export function describeChatError(err: unknown): string {
  const e = err as {
    message?: string;
    response?: { status?: number; data?: { code?: string; message?: string } };
  };

  switch (e.response?.data?.code) {
    case 'CHAT_CONVERSATION_LIMIT':
      return 'Your plan caps how many conversations you can keep. Delete an old one from Past conversations, or move to a bigger plan.';
    case 'CHAT_NEW_CONVERSATION_DAILY_LIMIT':
      return "You've started as many new conversations as your plan allows today. Carry on in an existing one, or try again tomorrow.";
    case 'CHAT_MESSAGE_DAILY_LIMIT':
      return "You've used up today's questions on your plan. They reset tomorrow.";
    default:
      break;
  }

  if (e.response?.status === 429) {
    return "That's a lot of questions at once — wait a minute and try again.";
  }

  return e.response?.data?.message || e.message || 'Could not send your message. Please try again.';
}
