import type { ReactNode } from 'react';

/**
 * Turns the model's markdown-lite prose (**bold**, "- " / "1. " lists) into
 * real DOM structure instead of showing raw asterisks. Deliberately narrow —
 * the chat system prompt caps answers at 150 words of plain business
 * commentary, so bold + lists cover everything Gemini actually emits. Not a
 * general markdown renderer; no need for a parser dependency for this.
 */
export default function formatChatText(text: string): ReactNode[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items;
    const ordered = list.ordered;
    blocks.push(
      ordered ? (
        <ol key={key} className="my-1 list-decimal space-y-0.5 pl-5">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="my-1 list-disc space-y-0.5 pl-5">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ul>
      )
    );
    list = null;
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^[-*]\s+(.*)/);
    const ordered = line.match(/^\d+\.\s+(.*)/);
    if (bullet) {
      if (!list || list.ordered) {
        flushList(`list-${idx}`);
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (ordered) {
      if (!list || !list.ordered) {
        flushList(`list-${idx}`);
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1]);
    } else {
      flushList(`p-${idx}`);
      blocks.push(
        <p key={`p-${idx}`} className="m-0 mt-1.5 first:mt-0">
          {renderInline(line, `p-${idx}`)}
        </p>
      );
    }
  });
  flushList('list-end');

  return blocks;
}

function renderInline(line: string, keyPrefix: string): ReactNode[] {
  return line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold" style={{ color: '#0F766E' }}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={`${keyPrefix}-${i}`}>{part}</span>
      )
    );
}
