import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectPropsBase {
  label?: string;
  error?: string;
  placeholder?: string;
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    SelectPropsBase {
  /**
   * Optional convenience API: pass string options.
   * If provided, children are ignored.
   */
  options?: SelectOption[];
  /**
   * Optional convenience callback that receives the raw string value.
   * This avoids parseInt/Number on UUIDs.
   */
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500',
              error && 'border-red-500',
              className,
            )}
            {...props}
            onChange={(e) => {
              props.onChange?.(e);
              props.onValueChange?.(e.target.value);
            }}
          >
            {props.placeholder != null && (
              <option value="">{props.placeholder}</option>
            )}
            {props.options
              ? props.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
