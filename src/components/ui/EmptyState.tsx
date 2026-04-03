import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({
  title = 'No results found',
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="mb-4 h-16 w-16 text-slate-300" />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {subtitle && (
        <p className="mt-2 max-w-md text-sm text-slate-500">{subtitle}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
