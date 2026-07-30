import clsx from 'clsx';

const STEPS = ['Shop', 'You', 'Start'];

/** Three dots, so nobody wonders how much more of this there is. */
export default function JourneyProgress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
      {STEPS.map((label, i) => (
        <span key={label} className="flex items-center gap-2">
          <span
            className={clsx('h-1.5 rounded-full transition-all', i <= step ? 'w-8' : 'w-4')}
            style={{ backgroundColor: i <= step ? '#0F766E' : '#E2E8F0' }}
          />
        </span>
      ))}
    </div>
  );
}
