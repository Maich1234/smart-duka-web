import clsx from 'clsx';

type Color = 'green' | 'red' | 'yellow' | 'blue' | 'teal' | 'gray' | 'gold';

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  className?: string;
}

const colorMap: Record<Color, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-[#CCFBF1] text-[#0F766E]',
  gray: 'bg-gray-100 text-gray-600',
  gold: 'bg-amber-100 text-amber-700',
};

export default function Badge({ children, color = 'teal', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
