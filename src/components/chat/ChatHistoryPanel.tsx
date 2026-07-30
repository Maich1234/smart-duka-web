'use client';

import { format } from 'date-fns';
import clsx from 'clsx';
import { MessageSquare } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { ConversationSummary } from '@/services/aiChat';

interface ChatHistoryPanelProps {
  isOpen: boolean;
  conversations: ConversationSummary[];
  activeId?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

/**
 * Past threads.
 *
 * Not optional polish: the plan's conversation cap tells owners to delete an
 * old conversation, which is only actionable if they can see the old ones.
 * The backend has always paginated the full list.
 */
export default function ChatHistoryPanel({
  isOpen,
  conversations,
  activeId,
  onClose,
  onSelect,
}: ChatHistoryPanelProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Past conversations">
      {conversations.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No conversations yet.</p>
      ) : (
        <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
          {conversations.map((conversation) => {
            const active = conversation._id === activeId;
            return (
              <li key={conversation._id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(conversation._id);
                    onClose();
                  }}
                  className={clsx(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors',
                    active ? 'bg-teal-50' : 'hover:bg-gray-50'
                  )}
                >
                  <MessageSquare
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: active ? '#0F766E' : '#94A3B8' }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                      {conversation.title || 'Untitled conversation'}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {format(new Date(conversation.lastMessageAt), 'd MMM yyyy')} ·{' '}
                      {conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
