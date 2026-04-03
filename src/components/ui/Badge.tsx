import { REPORT_TYPE_LABELS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  parsed: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  flagged: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  failed: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  approved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  pending_review: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  draft: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  unknown: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
  received: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  processing: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  reviewed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  duplicate: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  merchandiser: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
  promoter: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  text: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  image: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
  document: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  audio: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  open: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  resolved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

export interface BadgeProps {
  status?: string;
  reportType?: string;
  className?: string;
  children?: string;
}

export function Badge({ status, reportType, className, children }: BadgeProps) {
  const key = reportType ?? status ?? '';
  const label =
    children ??
    (reportType
      ? REPORT_TYPE_LABELS[reportType] ?? reportType
      : STATUS_LABELS[status ?? ''] ?? status ?? '—');
  const style =
    statusStyles[key] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
