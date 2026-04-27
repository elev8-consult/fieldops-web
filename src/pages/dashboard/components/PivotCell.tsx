import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { MerchandiserDashboardCell } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PivotCellProps {
  cell?: MerchandiserDashboardCell;
  productName: string;
  outletName: string;
}

const formatLebaneseDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy');
};

const formatBatchExpiry = (date: string | null, raw: string | null) => {
  if (raw) return raw;
  return formatLebaneseDate(date);
};

const getCellColor = (cell: MerchandiserDashboardCell | undefined): string => {
  if (!cell || cell.quantity === null || cell.quantity === 0) {
    return 'bg-red-50 text-red-700';
  }
  if (cell.expiryDate) {
    const daysToExpiry = differenceInDays(new Date(cell.expiryDate), new Date());
    if (daysToExpiry <= 30 && daysToExpiry >= 0) {
      return 'bg-yellow-50 text-yellow-800';
    }
    if (daysToExpiry < 0) {
      return 'bg-red-100 text-red-800';
    }
  }
  return 'bg-white text-slate-900';
};

export function PivotCell({ cell, productName, outletName }: PivotCellProps) {
  if (!cell) {
    return <div className="text-center text-slate-400">—</div>;
  }

  return (
    <details className="group relative">
      <summary
        className={cn(
          'list-none cursor-pointer rounded-md p-2 text-center transition hover:ring-1 hover:ring-indigo-300',
          getCellColor(cell),
        )}
      >
        <div className="flex items-center justify-center gap-1 text-lg font-semibold">
          {cell.quantity ?? 0}
          {cell.status === 'flagged' && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="text-xs text-slate-500">
          {formatLebaneseDate(cell.reportDate)}
        </div>
      </summary>

      <div className="absolute left-1/2 z-40 mt-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">{productName}</p>
          <p className="text-slate-600">{outletName}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-slate-500">Report date</span>
            <span className="text-right">{formatLebaneseDate(cell.reportDate)}</span>
            <span className="text-slate-500">Quantity</span>
            <span className="text-right">{cell.quantity ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Status</span>
            <Badge status={cell.status} />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-slate-700">Batches</p>
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-1 text-left">Batch</th>
                    <th className="px-2 py-1 text-right">Qty</th>
                    <th className="px-2 py-1 text-right">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {cell.batches.map((batch, idx) => (
                    <tr key={`${cell.reportId}-batch-${idx}`} className="border-t">
                      <td className="px-2 py-1">{idx + 1}</td>
                      <td className="px-2 py-1 text-right">{batch.quantity ?? '—'}</td>
                      <td className="px-2 py-1 text-right">
                        {formatBatchExpiry(batch.expiryDate, batch.expiryRaw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Link
            to={`/review/${cell.reportId}`}
            className="inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View full report →
          </Link>
        </div>
      </div>
    </details>
  );
}
