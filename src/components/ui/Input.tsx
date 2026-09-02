import { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
  /** 'sm' for dense filter-bar inputs. Defaults to 'md'. Not the native `size` attribute. */
  uiSize?: 'sm' | 'md';
}

const uiSizeStyles = {
  sm: 'py-1.5 text-sm',
  md: 'py-2 text-sm',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, uiSize = 'md', className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-control border transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30',
              uiSizeStyles[uiSize],
              icon ? 'pl-10 pr-4' : 'px-4',
              error ? 'border-red-400' : 'border-gray-200 focus:border-[#0F766E]',
              className
            )}
            style={{ color: '#0F172A' }}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
