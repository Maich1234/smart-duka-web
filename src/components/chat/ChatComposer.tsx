'use client';

import { useEffect, useRef } from 'react';
import { SendHorizonal } from 'lucide-react';

interface ChatComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

const MAX_ROWS_PX = 140;

export default function ChatComposer({ value, onChange, onSend, disabled }: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the question, up to a point. Owners paste in multi-line
  // context often enough that a single-line input hides what they typed.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter breaks the line — the convention
            // every other chat box uses.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder="Ask about your sales, stock, staff…"
          aria-label="Message Dukana AI"
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-100 disabled:bg-gray-50"
          style={{ color: '#0F172A' }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#0F766E' }}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
