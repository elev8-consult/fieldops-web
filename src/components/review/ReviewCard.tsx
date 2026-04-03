import { Badge } from '@/components/ui/Badge';
import { FLAG_CODE_LABELS } from '@/lib/constants';
import { formatConfidence, formatRelative } from '@/lib/utils';
import type { ParsedReport } from '@/types';
import {
  Calendar,
  ChevronRight,
  MapPin,
  Package,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ReviewCardProps {
  report: ParsedReport;
  senderPhone?: string;
  senderName?: string;
  itemCount?: number;
}

export function ReviewCard({
  report,
  senderPhone,
  senderName,
  itemCount = 0,
}: ReviewCardProps) {
  const navigate = useNavigate();
  const flags = report.flags ?? [];
  const hasError = flags.some(
    (f) => f.severity === 'error' && f.status === 'open',
  );
  const hasWarn = flags.some(
    (f) => f.severity === 'warning' && f.status === 'open',
  );
  const openFlags = flags.filter((f) => f.status === 'open');
  const borderClass = hasError
    ? 'border-l-4 border-l-red-500'
    : hasWarn
      ? 'border-l-4 border-l-amber-500'
      : 'border-l-4 border-l-transparent';

  const pills = openFlags.slice(0, 3).map((f) => (
    <span
      key={f.id}
      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
    >
      {FLAG_CODE_LABELS[f.flagCode] ?? f.flagCode}
    </span>
  ));

  return (
    <button
      type="button"
      onClick={() => navigate(`/review/${report.id}`)}
      className={`w-full rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md ${borderClass}`}
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">
                {senderName || 'Unknown sender'}
              </div>
              {senderPhone && (
                <div className="text-sm text-slate-400">{senderPhone}</div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge reportType={report.reportType} />
              <Badge status={report.status} />
              <span className="text-sm text-slate-400">
                {formatRelative(report.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-slate-400" />
              {report.locationRaw ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              {report.reportDate ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-4 w-4 text-slate-400" />
              {formatConfidence(report.confidence)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="h-4 w-4 text-slate-400" />
              {itemCount} items
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Flags:</span>
            {hasError && (
              <span className="h-2 w-2 rounded-full bg-red-500" title="Errors" />
            )}
            {!hasError && hasWarn && (
              <span
                className="h-2 w-2 rounded-full bg-amber-500"
                title="Warnings"
              />
            )}
            {pills}
            {openFlags.length > 3 && (
              <span className="text-xs text-slate-500">
                +{openFlags.length - 3} more
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-6 w-6 shrink-0 text-indigo-500" />
      </div>
    </button>
  );
}
