import type { PromoterDashboardGridResponse } from '@/types';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMemo } from 'react';

type GridItem = PromoterDashboardGridResponse['rows'][number];

interface PromoterGridProps {
  grid: PromoterDashboardGridResponse;
  onOutletClick: (outletId: string) => void;
}

const display = (value: number) => (value === 0 ? '' : value.toLocaleString());

export function PromoterGrid({ grid, onOutletClick }: PromoterGridProps) {
  const columns = useMemo<ColumnDef<GridItem>[]>(() => {
    const dynamicProductColumns = grid.products.map<ColumnDef<GridItem>>((product) => ({
      id: `product:${product.id}`,
      header: () => (
        <span title={product.canonical_name}>
          {product.canonical_name.length > 14
            ? `${product.canonical_name.slice(0, 14)}...`
            : product.canonical_name}
        </span>
      ),
      cell: ({ row }) => {
        const qty = grid.dates.reduce(
          (sum, date) => sum + (row.original.cells[date]?.[product.id] ?? 0),
          0,
        );
        return display(qty);
      },
      meta: { offer: product.is_offer },
    }));

    return [
      {
        id: 'outlet',
        header: 'Outlet',
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-medium text-slate-900 hover:text-indigo-700"
            onClick={() => onOutletClick(row.original.outlet_id)}
          >
            {row.original.has_flags && (
              <span className="mr-1 text-red-600" title={row.original.flag_messages.join('\n')}>
                ●
              </span>
            )}
            {row.original.outlet_name}
            {row.original.pending_review && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                ⏳
              </span>
            )}
          </button>
        ),
      },
      {
        id: 'region',
        header: 'Region',
        cell: ({ row }) => row.original.region_name ?? '-',
      },
      ...dynamicProductColumns,
      {
        id: 'palette',
        header: 'Palette',
        cell: ({ row }) =>
          display(grid.dates.reduce((sum, date) => sum + (row.original.palette[date] ?? 0), 0)),
      },
      {
        id: 'gifts',
        header: 'Gifts',
        cell: ({ row }) =>
          display(grid.dates.reduce((sum, date) => sum + (row.original.gifts[date] ?? 0), 0)),
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => display(row.original.row_total),
      },
    ];
  }, [grid, onOutletClick]);

  const table = useReactTable({
    data: grid.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as { offer?: boolean } | undefined;
                  const isGifts = header.column.id === 'gifts';
                  const isTotal = header.column.id === 'total';
                  return (
                    <th
                      key={header.id}
                      className={[
                        'border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700',
                        meta?.offer ? 'bg-[#FFF9C4]' : '',
                        isGifts ? 'bg-[#F3E5F5]' : '',
                        isTotal ? 'bg-[#F5F5F5]' : '',
                      ].join(' ')}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { offer?: boolean } | undefined;
                  const isGifts = cell.column.id === 'gifts';
                  const isTotal = cell.column.id === 'total';
                  return (
                    <td
                      key={cell.id}
                      className={[
                        'border border-slate-200 px-3 py-2',
                        meta?.offer ? 'bg-[#FFF9C4]' : '',
                        isGifts ? 'bg-[#F3E5F5]' : '',
                        isTotal ? 'bg-[#F5F5F5] font-semibold' : '',
                      ].join(' ')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-[#E3F2FD] font-semibold">
              <td className="border border-slate-200 px-3 py-2">Total</td>
              <td className="border border-slate-200 px-3 py-2"></td>
              {grid.products.map((product) => (
                <td key={product.id} className="border border-slate-200 px-3 py-2">
                  {display(grid.column_totals[product.id] ?? 0)}
                </td>
              ))}
              <td className="border border-slate-200 px-3 py-2">
                {display(grid.column_totals.palette ?? 0)}
              </td>
              <td className="border border-slate-200 px-3 py-2">
                {display(grid.column_totals.gifts ?? 0)}
              </td>
              <td className="border border-slate-200 px-3 py-2">
                {display(grid.column_totals.grand_total ?? 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
