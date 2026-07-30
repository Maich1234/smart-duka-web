import clsx from 'clsx';
import ToolsUsedFootnote from './ToolsUsedFootnote';

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
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          // Answers are prose with line breaks the model chose; preserving
          // them is the difference between a readable list and a wall.
          'whitespace-pre-wrap break-words',
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-white border border-gray-100 rounded-bl-sm'
        )}
        style={isUser ? { backgroundColor: '#0F766E' } : { color: '#0F172A' }}
      >
        {text}
      </div>
      {!isUser && toolsUsed && toolsUsed.length > 0 && <ToolsUsedFootnote toolsUsed={toolsUsed} />}
    </div>
  );
}
