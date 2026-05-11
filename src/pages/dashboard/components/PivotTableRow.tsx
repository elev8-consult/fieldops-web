import { cn } from '@/lib/utils';
import type { MerchandiserDashboardRow } from '@/types';
import { Warehouse } from 'lucide-react';
import { PivotCell } from './PivotCell';

interface PivotTableRowProps {
  row: MerchandiserDashboardRow;
  products: Array<{ id: string; canonical_name: string }>;
}

export function PivotTableRow({ row, products }: PivotTableRowProps) {
  return (
    <tr className={cn(row.is_depot && 'bg-slate-50')}>
      <td
        className={cn(
          'sticky left-0 z-20 min-w-56 border-r border-b border-slate-200 px-3 py-2 text-sm font-medium',
          row.is_depot ? 'bg-slate-50' : 'bg-white',
        )}
      >
        <div className="flex items-center gap-2">
          <span className="truncate">{row.outlet_name}</span>
          {row.is_depot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
              <Warehouse className="h-3 w-3" />
              Depot
            </span>
          )}
          {row.pending_review && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              Review
            </span>
          )}
          {row.has_flags && (
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
        </div>
      </td>
      {products.map((product) => (
        <td
          key={`${row.outlet_id}-${product.id}`}
          className="min-w-36 border-b border-r border-slate-100 px-2 py-1 align-top"
        >
          <PivotCell
            cell={row.cells[product.id]}
            productName={product.canonical_name}
            outletName={row.outlet_name}
          />
        </td>
      ))}
    </tr>
  );
}
