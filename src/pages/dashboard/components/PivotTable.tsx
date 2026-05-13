import type { MerchandiserDashboardResponse } from '@/types';
import { PivotTableHeader } from './PivotTableHeader';
import { PivotTableRow } from './PivotTableRow';

interface PivotTableProps {
  data: MerchandiserDashboardResponse;
  canEdit: boolean;
}

export function PivotTable({ data, canEdit }: PivotTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-max min-w-full border-collapse">
          <PivotTableHeader products={data.products} />
          <tbody>
            {data.rows.map((row) => (
              <PivotTableRow
                key={row.outlet_id}
                row={row}
                products={data.products}
                canEdit={canEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
