import { cn } from '@/lib/utils';
import type { MerchandiserDashboardRow } from '@/types';
import { Warehouse } from 'lucide-react';
import { PivotCell } from './PivotCell';

interface PivotTableRowProps {
  row: MerchandiserDashboardRow;
  products: Array<{ id: string; name: string }>;
}

export function PivotTableRow({ row, products }: PivotTableRowProps) {
  return (
    <tr className={cn(row.isDepot && 'bg-slate-50')}>
      <td
        className={cn(
          'sticky left-0 z-20 min-w-56 border-r border-b border-slate-200 px-3 py-2 text-sm font-medium',
          row.isDepot ? 'bg-slate-50' : 'bg-white',
        )}
      >
        <div className="flex items-center gap-2">
          <span className="truncate">{row.outletName}</span>
          {row.isDepot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
              <Warehouse className="h-3 w-3" />
              Depot
            </span>
          )}
        </div>
      </td>
      {products.map((product) => (
        <td
          key={`${row.outletId}-${product.id}`}
          className="min-w-36 border-b border-r border-slate-100 px-2 py-1 align-top"
        >
          <PivotCell
            cell={row.cells[product.id]}
            productName={product.name}
            outletName={row.outletName}
          />
        </td>
      ))}
    </tr>
  );
}
