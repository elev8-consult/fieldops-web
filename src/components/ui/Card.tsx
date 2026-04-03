import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  padding?: boolean;
  className?: string;
}

export function Card({
  title,
  subtitle,
  action,
  children,
  padding = true,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-100 bg-white shadow-sm',
        className,
      )}
    >
      {(title || subtitle || action) && (
        <div
          className={cn(
            'flex flex-wrap items-start justify-between gap-4 border-b border-slate-100',
            padding && 'p-6 pb-4',
          )}
        >
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn(padding && 'p-6')}>{children}</div>
    </div>
  );
}
