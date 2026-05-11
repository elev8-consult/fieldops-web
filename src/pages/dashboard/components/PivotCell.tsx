import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { MerchandiserDashboardCell } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

interface PivotCellProps {
  cell?: MerchandiserDashboardCell;
  productName: string;
  outletName: string;
}

const formatLebaneseDate = (date: string | null | undefined) => {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy');
};

const getCellColor = (cell: MerchandiserDashboardCell | undefined): string => {
  if (!cell || cell.quantity === null || cell.quantity === 0) {
    return 'bg-red-50 text-red-700';
  }
  if (cell.expiry_date) {
    const daysToExpiry = differenceInDays(new Date(cell.expiry_date), new Date());
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
          {cell.match_type === 'none' && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="text-xs text-slate-500">
          {formatLebaneseDate(cell.report_date)}
        </div>
      </summary>

      <div className="absolute left-1/2 z-40 mt-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">{productName}</p>
          <p className="text-slate-600">{outletName}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-slate-500">Report date</span>
            <span className="text-right">{formatLebaneseDate(cell.report_date)}</span>
            <span className="text-slate-500">Quantity</span>
            <span className="text-right">{cell.quantity ?? '—'}</span>
            <span className="text-slate-500">Expiry date</span>
            <span className="text-right">
              {cell.expiry_raw ?? formatLebaneseDate(cell.expiry_date)}
            </span>
            <span className="text-slate-500">Has batches</span>
            <span className="text-right">{cell.has_batches ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Match type</span>
            <Badge>{cell.match_type ?? '—'}</Badge>
          </div>
        </div>
      </div>
    </details>
  );
}
