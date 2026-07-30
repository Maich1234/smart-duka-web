'use client';

import clsx from 'clsx';

interface Choice {
  value: string;
  label: string;
  emoji?: string;
  subtitle?: string;
}

/**
 * The picker used by every quiz question. Buttons rather than radio/checkbox
 * inputs, with aria-pressed carrying the state — the same choice the mobile
 * app made after radio roles proved unreliable there.
 */
export default function ChoiceGrid({
  choices,
  selected,
  multi,
  onChange,
}: {
  choices: Choice[];
  selected: string[];
  multi?: boolean;
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (!multi) return onChange([value]);
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {choices.map((choice) => {
        const active = selected.includes(choice.value);
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(choice.value)}
            className={clsx('p-3 rounded-xl border text-left transition-colors')}
            style={{
              borderColor: active ? '#0F766E' : '#E5E7EB',
              backgroundColor: active ? '#F0FDFA' : 'white',
            }}
          >
            <span className="block text-sm font-semibold" style={{ color: active ? '#0F766E' : '#0F172A' }}>
              {choice.emoji ? `${choice.emoji} ` : ''}{choice.label}
            </span>
            {choice.subtitle && (
              <span className="block text-xs text-gray-500 mt-0.5">{choice.subtitle}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
