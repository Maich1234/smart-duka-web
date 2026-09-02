import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** Adds hover elevation for cards that act as clickable previews/links. */
  hoverable?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className, padding = 'md', hoverable }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-card border border-gray-100 shadow-elevation-1',
        hoverable && 'transition-shadow duration-150 hover:shadow-elevation-2 hover:border-gray-200',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
