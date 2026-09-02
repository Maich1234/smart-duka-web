'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Required: the switch is icon-only, so it needs its own accessible name. */
  label: string;
}

/**
 * A switch. Extracted from the inline copy in DukanaAiCard once the shop
 * settings grew five more of them.
 */
export default function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors hover:brightness-95 disabled:opacity-50 disabled:hover:brightness-100"
      style={{ backgroundColor: checked ? '#0F766E' : '#E5E7EB' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(19px)' : 'translateX(3px)' }}
      />
    </button>
  );
}
