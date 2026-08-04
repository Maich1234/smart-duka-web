'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { History, Plus, Trash2 } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatComposer from '@/components/chat/ChatComposer';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';
import { UpsellCard, AiDisabledCard } from '@/components/insights/InsightSections';
import { useAiAccess } from '@/hooks/useAiAccess';
import { useSubscription } from '@/hooks/useSubscription';
import {
  useArchiveConversation,
  useConversationHistory,
  useConversationMessages,
  useSendChatMessage,
} from '@/hooks/useAiChat';
import { describeChatError } from '@/services/aiChat';

interface DisplayMessage {
  _id: string;
  role: 'user' | 'model';
  text: string;
  toolsUsed?: string[];
}

const SUGGESTIONS = [
  'When is my shop busiest?',
  'How are my staff doing this month?',
  'What should I restock first?',
  'Where is my money going?',
];

/**
 * Ask Dukana — the business consultant chat.
 *
 * Opens the most recent thread and creates one on the first message. Past
 * threads are reachable from the history panel, which is what makes the
 * plan's "delete an old conversation" cap message actionable.
 */
export default function ChatPage() {
  // Same gate as /owner/insights: subscription state, the plan's ai_insights
  // feature, and the shop's own toggle — mirroring requireActiveSubscription
  // + requireFeature + requireAiEnabled on POST /ai/chat.
  const { hasAiAccess, state: aiAccessState, isLoading: isAccessLoading } = useAiAccess();
  const { plan } = useSubscription();

  const [conversationId, setConversationId] = useState<string | undefined>();
  // Set when the owner explicitly starts a fresh thread, so the auto-open
  // effect below doesn't immediately pull the previous one back.
  const [skipAutoLoad, setSkipAutoLoad] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading: isLoadingHistory } = useConversationHistory(hasAiAccess);
  const { data: thread, isLoading: isLoadingThread } = useConversationMessages(conversationId);
  const sendMutation = useSendChatMessage(conversationId);
  const archiveMutation = useArchiveConversation();

  useEffect(() => {
    if (!conversationId && !skipAutoLoad && history?.latest?._id) {
      setConversationId(history.latest._id);
    }
  }, [history, conversationId, skipAutoLoad]);

  // The response carries only the model's turn, so the question is shown from
  // local state until the thread refetches with the persisted copy.
  const messages: DisplayMessage[] = useMemo(() => {
    const persisted: DisplayMessage[] = (thread?.data.messages ?? []).map((m) => ({
      _id: m._id,
      role: m.role,
      text: m.text,
      toolsUsed: m.toolsUsed,
    }));
    if (pendingText) persisted.push({ _id: 'pending', role: 'user', text: pendingText });
    return persisted;
  }, [thread, pendingText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sendMutation.isPending]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    setInputText('');
    setPendingText(text);
    setError('');
    sendMutation.mutate(text, {
      onSuccess: (response) => {
        setPendingText(null);
        if (!conversationId) {
          setConversationId(response.data.conversationId);
          setSkipAutoLoad(false);
        }
      },
      onError: (err) => {
        // Give the question back rather than making them retype it.
        setPendingText(null);
        setInputText(text);
        setError(describeChatError(err));
      },
    });
  };

  const handleNewChat = () => {
    if (sendMutation.isPending) return;
    const maxConversations = plan?.chatLimits?.maxConversations;
    // Catch the cap here so the owner is told before losing their place,
    // rather than after a 403 on the first message of the new thread.
    if (maxConversations != null && (history?.totalConversations ?? 0) >= maxConversations) {
      setError(
        `Your plan allows up to ${maxConversations} conversation${maxConversations === 1 ? '' : 's'}. Open Past conversations to delete one, or move to a bigger plan.`
      );
      return;
    }
    setConversationId(undefined);
    setSkipAutoLoad(true);
    setPendingText(null);
    setInputText('');
    setError('');
  };

  const handleDelete = () => {
    if (!conversationId) return;
    archiveMutation.mutate(conversationId, {
      onSuccess: () => {
        setConfirmDelete(false);
        // Fall back to whatever thread is newest now, if any.
        setConversationId(undefined);
        setSkipAutoLoad(false);
        setPendingText(null);
        setInputText('');
      },
      onError: (err) => {
        setConfirmDelete(false);
        setError(describeChatError(err));
      },
    });
  };

  if (isAccessLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasAiAccess) {
    return (
      <div className="max-w-xl mx-auto py-8">
        {aiAccessState === 'disabled' ? <AiDisabledCard /> : <UpsellCard />}
      </div>
    );
  }

  const showThreadLoading = isLoadingHistory || (!!conversationId && isLoadingThread);

  return (
    // dvh, not vh: on mobile browsers 100vh ignores the address bar, which
    // would push the composer below the fold on the one screen where it has
    // to stay reachable.
    <div className="flex flex-col h-[calc(100dvh-11rem)] min-h-[24rem] max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Ask Dukana</h1>
          <p className="text-gray-500 text-sm mt-1">Grounded answers about your business</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(history?.conversations.length ?? 0) > 0 && (
            <button
              onClick={() => setHistoryOpen(true)}
              aria-label="Past conversations"
              title="Past conversations"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleNewChat}
            aria-label="Start a new conversation"
            title="New conversation"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          {conversationId && (
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete this conversation"
              title="Delete conversation"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 p-4"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        {showThreadLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="font-bold mb-1" style={{ color: '#0F172A' }}>
              Ask anything about your business
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Answers come from your own sales, stock and expenses.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputText(suggestion)}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                role={message.role}
                text={message.text}
                toolsUsed={message.toolsUsed}
              />
            ))}
            {sendMutation.isPending && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <ChatComposer
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        disabled={sendMutation.isPending}
      />

      <ChatHistoryPanel
        isOpen={historyOpen}
        conversations={history?.conversations ?? []}
        activeId={conversationId}
        onClose={() => setHistoryOpen(false)}
        onSelect={(id) => {
          // An explicit choice cancels any pending "new chat", otherwise the
          // auto-open effect would fight it.
          setSkipAutoLoad(false);
          setPendingText(null);
          setError('');
          setConversationId(id);
        }}
      />

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this conversation?"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          It will be removed from Dukana AI. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" loading={archiveMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
