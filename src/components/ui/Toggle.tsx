'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Required: the switch is icon-only, so it needs its own accessible name. */
  label: string;
}

/**
 * A switch. Extracted from the inline copy in SmartDukaAiCard once the shop
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
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ backgroundColor: checked ? '#0F766E' : '#E5E7EB' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
      />
    </button>
  );
}
