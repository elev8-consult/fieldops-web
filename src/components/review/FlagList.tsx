import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FLAG_CODE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ReportFlag } from '@/types';
import { CheckCircle, X } from 'lucide-react';

export interface FlagListProps {
  flags: ReportFlag[];
  reportId: string;
  onResolve: (flagId: string) => void;
  onDismiss: (flagId: string) => void;
  busyId?: string | null;
}

const severityClass: Record<string, string> = {
  error: 'border-l-4 border-red-500 bg-red-50 text-red-600',
  warning:
    'border-l-4 border-amber-500 bg-amber-50 text-amber-600',
  info: 'border-l-4 border-blue-500 bg-blue-50 text-blue-600',
};

export function FlagList({
  flags,
  reportId: _reportId,
  onResolve,
  onDismiss,
  busyId,
}: FlagListProps) {
  if (!flags.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
        <p className="text-sm font-medium text-slate-700">No open flags</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {flags.map((f) => (
        <li
          key={f.id}
          className={cn(
            'rounded-lg border border-slate-100 p-3 text-sm',
            severityClass[f.severity] ?? severityClass.info,
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold">
                {FLAG_CODE_LABELS[f.flagCode] ?? f.flagCode}
              </div>
              {f.fieldName && (
                <code className="mt-1 block text-xs opacity-80">{f.fieldName}</code>
              )}
              <p className="mt-2 text-sm">{f.message}</p>
              {f.flagCode === 'UNRECOGNIZED_PRODUCT' && (
                <div className="mt-2 text-xs">
                  {(() => {
                    try {
                      const raw =
                        typeof f.context === 'string' && f.context.trim().length > 0
                          ? f.context
                          : f.message.includes('{')
                            ? f.message
                            : '{}';
                      const ctx = JSON.parse(raw) as {
                        suggestions?: Array<{
                          productId?: string;
                          canonicalName?: string;
                          canonical_name?: string;
                          confidence?: number;
                        }>;
                      };
                      const suggestions = Array.isArray(ctx.suggestions)
                        ? ctx.suggestions
                        : [];
                      if (suggestions.length > 0) {
                        const top = suggestions[0];
                        const name = top.canonicalName ?? top.canonical_name ?? '—';
                        const confidence = Math.round((top.confidence ?? 0) * 100);
                        return (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-slate-500">Best match:</span>
                            <span className="font-medium text-slate-700">{name}</span>
                            <span className="text-amber-600">{confidence}%</span>
                          </div>
                        );
                      }
                    } catch {
                      // noop
                    }
                    return null;
                  })()}
                </div>
              )}
              <div className="mt-2">
                <Badge status={f.status}>{f.status}</Badge>
              </div>
            </div>
            {f.status === 'open' && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="!p-2 text-emerald-600"
                  title="Resolve"
                  disabled={busyId === f.id}
                  onClick={() => onResolve(f.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="!p-2 text-slate-600"
                  title="Dismiss"
                  disabled={busyId === f.id}
                  onClick={() => onDismiss(f.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
