import clsx from 'clsx';
import ToolsUsedFootnote from './ToolsUsedFootnote';
import formatChatText from './formatChatText';

interface MessageBubbleProps {
  role: 'user' | 'model';
  text: string;
  toolsUsed?: string[];
}

export default function MessageBubble({ role, text, toolsUsed }: MessageBubbleProps) {
  const isUser = role === 'user';
  return (
    <div className={clsx('mb-3 max-w-[85%]', isUser ? 'ml-auto' : 'mr-auto')}>
      <div
        className={clsx(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
          // User text has no markdown to parse; preserve their own line
          // breaks verbatim. Model text is rendered as real paragraphs/lists
          // by formatChatText, which handles its own line spacing.
          isUser && 'whitespace-pre-wrap',
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-white border border-gray-100 rounded-bl-sm'
        )}
        style={isUser ? { backgroundColor: '#0F766E' } : { color: '#0F172A' }}
      >
        {isUser ? text : formatChatText(text)}
      </div>
      {!isUser && toolsUsed && toolsUsed.length > 0 && <ToolsUsedFootnote toolsUsed={toolsUsed} />}
    </div>
  );
}
