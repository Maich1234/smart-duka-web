import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  iconColor = '#0F766E',
  iconBg = '#CCFBF1',
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {change !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
              isPositive ? 'bg-green-100 text-green-700' :
              isNegative ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> :
             isNegative ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>{value}</p>
      {changeLabel && (
        <p className="text-xs text-gray-400 mt-1">{changeLabel}</p>
      )}
    </div>
  );
}
