import { fetchBrands } from '@/api/brands';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import {
  usePromoterDashboardFilters,
  usePromoterDashboardGrid,
  usePromoterDashboardSummary,
  usePromoterOutletReports,
} from '@/hooks/usePromoterDashboard';
import { ROLES, STATUS_LABELS } from '@/lib/constants';
import { getAxiosMessage } from '@/lib/utils';
import type { PromoterDashboardParams, PromoterDashboardRow } from '@/types';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Download,
  Filter,
  Info,
  PackageSearch,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type TableItem = {
  row: PromoterDashboardRow;
};

const DEFAULT_STATUSES: PromoterDashboardParams['status'] = [
  'approved',
  'pending_review',
  'reviewed',
];

const defaultFilters = (brandId?: string): PromoterDashboardParams => ({
  brand_id: brandId,
  date_from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
  date_to: format(new Date(), 'yyyy-MM-dd'),
  status: DEFAULT_STATUSES,
});

function getDateProductTotal(rows: PromoterDashboardRow[], date: string, productId: string) {
  return rows.reduce((sum, row) => sum + (row.cells[date]?.[productId] ?? 0), 0);
}

function getDateSpecialTotal(
  rows: PromoterDashboardRow[],
  date: string,
  key: 'palette' | 'gifts',
) {
  return rows.reduce((sum, row) => sum + (row[key][date] ?? 0), 0);
}

function toDisplayNumber(value?: number | null) {
  if (!value) return '';
  return value.toLocaleString();
}

export function PromoterDashboard() {
  const { user } = useAuth();
  const isBrandManager = user?.role === ROLES.BRAND_MANAGER;
  const managerBrandId = isBrandManager ? (user?.brandId ?? undefined) : undefined;

  const [draftFilters, setDraftFilters] = useState<PromoterDashboardParams>(
    defaultFilters(managerBrandId),
  );
  const [filters, setFilters] = useState<PromoterDashboardParams>(
    defaultFilters(managerBrandId),
  );
  const [outletInput, setOutletInput] = useState('');
  const [promoterInput, setPromoterInput] = useState('');
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);

  const brandsQ = useQuery({
    queryKey: ['brands', 'promoter-dashboard'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const gridQ = usePromoterDashboardGrid(filters);
  const summaryQ = usePromoterDashboardSummary(filters);
  const filterOptionsQ = usePromoterDashboardFilters({
    brand_id: draftFilters.brand_id,
    date_from: draftFilters.date_from,
    date_to: draftFilters.date_to,
  });
  const outletReportsQ = usePromoterOutletReports(selectedOutletId, filters);

  const outletNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of filterOptionsQ.data?.outlets ?? []) {
      map.set(item.id, item.name);
    }
    return map;
  }, [filterOptionsQ.data?.outlets]);

  const promoterNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of filterOptionsQ.data?.promoters ?? []) {
      map.set(item.id, item.full_name);
    }
    return map;
  }, [filterOptionsQ.data?.promoters]);

  const tableData = useMemo<TableItem[]>(
    () => (gridQ.data?.rows ?? []).map((row) => ({ row })),
    [gridQ.data?.rows],
  );

  const columns = useMemo<ColumnDef<TableItem>[]>(() => {
    const products = gridQ.data?.products ?? [];
    const dates = gridQ.data?.dates ?? [];

    const baseColumns: ColumnDef<TableItem>[] = [
      {
        id: 'outlet',
        header: 'Outlet',
        cell: ({ row }) => {
          const outlet = row.original.row;
          return (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-left font-medium text-slate-900 hover:text-indigo-700"
              onClick={() => setSelectedOutletId(outlet.outlet_id)}
            >
              <span>{outlet.outlet_name}</span>
              {outlet.has_flags && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"
                  title={outlet.flag_messages.join('\n')}
                />
              )}
              {outlet.pending_review && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  ⏳ Review
                </span>
              )}
            </button>
          );
        },
      },
    ];

    const dateColumns: ColumnDef<TableItem>[] = dates.map((date) => ({
      id: `date:${date}`,
      header: () => format(new Date(date), 'dd MMM yyyy'),
      columns: [
        ...products.map<ColumnDef<TableItem>>((product) => ({
          id: `cell:${date}:${product.id}`,
          header: () => product.canonical_name,
          cell: ({ row }) => toDisplayNumber(row.original.row.cells[date]?.[product.id]),
          meta: {
            isOffer: product.is_offer,
          },
        })),
        {
          id: `palette:${date}`,
          header: 'Palette',
          cell: ({ row }) => toDisplayNumber(row.original.row.palette[date]),
        },
        {
          id: `gifts:${date}`,
          header: 'Gifts',
          cell: ({ row }) => toDisplayNumber(row.original.row.gifts[date]),
        },
        {
          id: `date-total:${date}`,
          header: 'Total',
          cell: ({ row }) => {
            const dateTotal =
              products.reduce(
                (sum, product) => sum + (row.original.row.cells[date]?.[product.id] ?? 0),
                0,
              ) +
              (row.original.row.palette[date] ?? 0) +
              (row.original.row.gifts[date] ?? 0);
            return toDisplayNumber(dateTotal);
          },
          meta: {
            isTotal: true,
          },
        },
      ],
    }));

    return [
      ...baseColumns,
      ...dateColumns,
      {
        id: 'grand-total',
        header: 'Grand Total',
        cell: ({ row }) => toDisplayNumber(row.original.row.row_total),
        meta: {
          isGrandTotal: true,
        },
      },
    ];
  }, [gridQ.data?.dates, gridQ.data?.products]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const exportExcel = () => {
    const grid = gridQ.data;
    if (!grid || !filters.brand_id) return;

    const brandName =
      brandsQ.data?.find((brand) => brand.id === filters.brand_id)?.name ?? 'Brand';
    const dateLabel = `${filters.date_from ?? ''}-${filters.date_to ?? ''}`;
    const sheetName = `${brandName} ${dateLabel}`.slice(0, 31);

    const rows: Array<Array<string | number>> = [];
    const topHeader: Array<string> = ['Outlet'];
    const secondHeader: Array<string> = ['Outlet'];

    for (const date of grid.dates) {
      topHeader.push(format(new Date(date), 'dd MMM yyyy'));
      for (let i = 0; i < grid.products.length + 2; i += 1) {
        topHeader.push('');
      }
      for (const product of grid.products) {
        secondHeader.push(product.canonical_name);
      }
      secondHeader.push('Palette', 'Gifts', 'Total');
    }

    topHeader.push('Grand Total');
    secondHeader.push('Grand Total');
    rows.push(topHeader, secondHeader);

    for (const row of grid.rows) {
      const excelRow: Array<string | number> = [row.outlet_name];
      for (const date of grid.dates) {
        for (const product of grid.products) {
          excelRow.push(row.cells[date]?.[product.id] ?? '');
        }
        excelRow.push(row.palette[date] ?? '', row.gifts[date] ?? '');
        const dateTotal =
          grid.products.reduce(
            (sum, product) => sum + (row.cells[date]?.[product.id] ?? 0),
            0,
          ) +
          (row.palette[date] ?? 0) +
          (row.gifts[date] ?? 0);
        excelRow.push(dateTotal || '');
      }
      excelRow.push(row.row_total || '');
      rows.push(excelRow);
    }

    const totalRow: Array<string | number> = ['Total'];
    for (const date of grid.dates) {
      for (const product of grid.products) {
        totalRow.push(getDateProductTotal(grid.rows, date, product.id) || '');
      }
      totalRow.push(
        getDateSpecialTotal(grid.rows, date, 'palette') || '',
        getDateSpecialTotal(grid.rows, date, 'gifts') || '',
      );
      const dateTotal =
        grid.products.reduce(
          (sum, product) => sum + getDateProductTotal(grid.rows, date, product.id),
          0,
        ) +
        getDateSpecialTotal(grid.rows, date, 'palette') +
        getDateSpecialTotal(grid.rows, date, 'gifts');
      totalRow.push(dateTotal || '');
    }
    totalRow.push(grid.column_totals.grand_total || '');
    rows.push(totalRow);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = Array.from({ length: rows[0].length }).map((_, index) => ({
      wch: index === 0 ? 28 : 14,
    }));

    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E2E8F0' } },
    };
    const offerStyle = {
      fill: { fgColor: { rgb: 'FEF08A' } },
    };
    const totalStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } },
    };
    const totalRowStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'DBEAFE' } },
    };

    for (let c = 0; c < rows[0].length; c += 1) {
      const topCell = XLSX.utils.encode_cell({ r: 0, c });
      const secondCell = XLSX.utils.encode_cell({ r: 1, c });
      if (worksheet[topCell]) worksheet[topCell].s = headerStyle;
      if (worksheet[secondCell]) worksheet[secondCell].s = headerStyle;
    }

    const firstDataRow = 2;
    const lastDataRow = firstDataRow + grid.rows.length - 1;
    const totalRowIndex = rows.length - 1;
    const blockWidth = grid.products.length + 3;

    for (let r = firstDataRow; r <= lastDataRow; r += 1) {
      for (let dateIndex = 0; dateIndex < grid.dates.length; dateIndex += 1) {
        const blockStart = 1 + dateIndex * blockWidth;
        grid.products.forEach((product, productIndex) => {
          if (!product.is_offer) return;
          const cellAddress = XLSX.utils.encode_cell({
            r,
            c: blockStart + productIndex,
          });
          if (worksheet[cellAddress]) worksheet[cellAddress].s = offerStyle;
        });

        const totalCell = XLSX.utils.encode_cell({
          r,
          c: blockStart + blockWidth - 1,
        });
        if (worksheet[totalCell]) worksheet[totalCell].s = totalStyle;
      }

      const grandTotalCell = XLSX.utils.encode_cell({ r, c: rows[0].length - 1 });
      if (worksheet[grandTotalCell]) worksheet[grandTotalCell].s = totalStyle;
    }

    for (let c = 0; c < rows[0].length; c += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c });
      if (worksheet[cellAddress]) worksheet[cellAddress].s = totalRowStyle;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sheetName}.xlsx`);
  };

  const disabledApply = !draftFilters.brand_id;
  const isLoading = gridQ.isLoading || summaryQ.isLoading;
  const hasData = (gridQ.data?.rows.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promoter Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Excel-style Gliss report view with multi-date product pivoting.
          </p>
        </div>
        <Button
          leftIcon={<Download className="h-4 w-4" />}
          onClick={exportExcel}
          disabled={!hasData}
        >
          Export to Excel
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Brand</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={draftFilters.brand_id ?? ''}
              disabled={isBrandManager}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, brand_id: event.target.value || undefined }))
              }
            >
              <option value="">Select brand</option>
              {(brandsQ.data ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Date from</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={draftFilters.date_from ?? ''}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, date_from: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Date to</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={draftFilters.date_to ?? ''}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, date_to: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Outlet</label>
            <input
              list="promoter-dashboard-outlets"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Search outlet..."
              value={outletInput}
              onChange={(event) => {
                const value = event.target.value;
                setOutletInput(value);
                const match = (filterOptionsQ.data?.outlets ?? []).find(
                  (item) => item.name === value,
                );
                setDraftFilters((prev) => ({
                  ...prev,
                  outlet_id: match?.id,
                }));
              }}
            />
            <datalist id="promoter-dashboard-outlets">
              {(filterOptionsQ.data?.outlets ?? []).map((outlet) => (
                <option key={outlet.id} value={outlet.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Promoter</label>
            <input
              list="promoter-dashboard-promoters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Search promoter..."
              value={promoterInput}
              onChange={(event) => {
                const value = event.target.value;
                setPromoterInput(value);
                const match = (filterOptionsQ.data?.promoters ?? []).find(
                  (item) => item.full_name === value,
                );
                setDraftFilters((prev) => ({
                  ...prev,
                  reported_by: match?.id,
                }));
              }}
            />
            <datalist id="promoter-dashboard-promoters">
              {(filterOptionsQ.data?.promoters ?? []).map((promoter) => (
                <option key={promoter.id} value={promoter.full_name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <details className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <summary className="cursor-pointer list-none">
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {(draftFilters.status?.length ?? 0) > 0
                    ? `${draftFilters.status?.length} selected`
                    : 'Select status'}
                </span>
              </summary>
              <div className="mt-2 space-y-2">
                {(filterOptionsQ.data?.statuses ?? []).map((status) => {
                  const checked = draftFilters.status?.includes(status) ?? false;
                  return (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setDraftFilters((prev) => {
                            const current = prev.status ?? [];
                            const next = event.target.checked
                              ? [...current, status]
                              : current.filter((item) => item !== status);
                            return { ...prev, status: next };
                          });
                        }}
                      />
                      <span>{STATUS_LABELS[status] ?? status}</span>
                    </label>
                  );
                })}
              </div>
            </details>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button disabled={disabledApply} onClick={() => setFilters(draftFilters)}>
            Apply Filters
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const reset = defaultFilters(managerBrandId);
              setDraftFilters(reset);
              setFilters(reset);
              setOutletInput('');
              setPromoterInput('');
            }}
          >
            Reset
          </Button>
          {(filters.outlet_id || filters.reported_by) && (
            <div className="text-xs text-slate-500">
              {filters.outlet_id && <>Outlet: {outletNameById.get(filters.outlet_id) ?? '—'} </>}
              {filters.reported_by && (
                <>Promoter: {promoterNameById.get(filters.reported_by) ?? '—'}</>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : summaryQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getAxiosMessage(summaryQ.error)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Total Outlets Visited</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {summaryQ.data?.outlets_visited ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Total Units Sold</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {summaryQ.data?.units_sold ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Total Samples Given</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {summaryQ.data?.samples_given ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Persons Contacted / Tasted</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {summaryQ.data?.persons_contacted ?? 0} / {summaryQ.data?.persons_tasted ?? 0}
            </div>
          </div>
        </div>
      )}

      {gridQ.isLoading ? (
        <Skeleton className="h-[480px] w-full" />
      ) : gridQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
          <h2 className="font-semibold text-red-900">Failed to load grid</h2>
          <p className="mt-1 text-sm text-red-700">{getAxiosMessage(gridQ.error)}</p>
        </div>
      ) : (gridQ.data?.rows.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">No data found</h2>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-max min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as
                        | { isOffer?: boolean; isTotal?: boolean; isGrandTotal?: boolean }
                        | undefined;
                      return (
                        <th
                          key={header.id}
                          className={[
                            'border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700',
                            meta?.isOffer ? 'bg-yellow-100' : '',
                            meta?.isTotal || meta?.isGrandTotal ? 'bg-slate-200' : '',
                          ].join(' ')}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as
                        | { isOffer?: boolean; isTotal?: boolean; isGrandTotal?: boolean }
                        | undefined;
                      return (
                        <td
                          key={cell.id}
                          className={[
                            'border border-slate-200 px-3 py-2 align-top',
                            meta?.isOffer ? 'bg-yellow-50' : '',
                            meta?.isTotal || meta?.isGrandTotal
                              ? 'bg-slate-100 font-semibold'
                              : '',
                          ].join(' ')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {gridQ.data && (
                  <tr className="bg-blue-100 font-semibold">
                    <td className="border border-slate-200 px-3 py-2">Total</td>
                    {gridQ.data.dates.map((date) => (
                      <FragmentTotals
                        key={date}
                        date={date}
                        rows={gridQ.data.rows}
                        productIds={gridQ.data.products.map((product) => product.id)}
                      />
                    ))}
                    <td className="border border-slate-200 px-3 py-2">
                      {toDisplayNumber(gridQ.data.column_totals.grand_total)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOutletId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Outlet Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOutletId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {outletReportsQ.isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : outletReportsQ.isError ? (
              <div className="p-5 text-sm text-red-700">
                {getAxiosMessage(outletReportsQ.error)}
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="text-lg font-semibold text-slate-900">
                    {outletReportsQ.data?.outlet.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Type: {outletReportsQ.data?.outlet.type} · Region:{' '}
                    {outletReportsQ.data?.outlet.region ?? '—'}
                  </div>
                </div>

                {(outletReportsQ.data?.reports ?? []).map((report) => (
                  <div key={report.report_id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {format(new Date(report.report_date), 'dd MMM yyyy')} ·{' '}
                          {report.promoter.full_name ?? 'Unknown promoter'}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Contacted/Tasted: {report.persons_contacted} / {report.persons_tasted}
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                        {STATUS_LABELS[report.status] ?? report.status}
                      </span>
                    </div>

                    {report.feedback_text && (
                      <p className="mt-3 text-sm text-slate-700">
                        <span className="font-medium">Feedback:</span> {report.feedback_text}
                      </p>
                    )}
                    {report.most_asked_question && (
                      <p className="mt-2 text-sm text-slate-700">
                        <span className="font-medium">Most asked question:</span>{' '}
                        {report.most_asked_question}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 text-sm font-semibold text-slate-900">Sale items</div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-left">
                              <th className="px-2 py-1">Product</th>
                              <th className="px-2 py-1">Qty</th>
                              <th className="px-2 py-1">Offer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.sales.map((item) => (
                              <tr key={item.id} className={item.is_offer ? 'bg-yellow-50' : ''}>
                                <td className="border-t border-slate-100 px-2 py-1">
                                  {item.product_name ?? '—'}
                                </td>
                                <td className="border-t border-slate-100 px-2 py-1">
                                  {item.quantity}
                                </td>
                                <td className="border-t border-slate-100 px-2 py-1">
                                  {item.is_offer ? 'Yes' : 'No'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-semibold text-slate-900">Sample items</div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-left">
                              <th className="px-2 py-1">Product</th>
                              <th className="px-2 py-1">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.samples.map((item) => (
                              <tr key={item.id}>
                                <td className="border-t border-slate-100 px-2 py-1">
                                  {item.product_name ?? '—'}
                                </td>
                                <td className="border-t border-slate-100 px-2 py-1">
                                  {item.quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {report.flags.length > 0 && (
                      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <div className="mb-1 inline-flex items-center gap-1 font-semibold">
                          <Info className="h-4 w-4" />
                          Open flags
                        </div>
                        <ul className="space-y-1">
                          {report.flags.map((flag) => (
                            <li key={flag.id}>• {flag.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {(outletReportsQ.data?.reports.length ?? 0) === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    <Users className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                    No reports found for this outlet and date range.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentTotals({
  date,
  rows,
  productIds,
}: {
  date: string;
  rows: PromoterDashboardRow[];
  productIds: string[];
}) {
  const productTotals = productIds.map((productId) =>
    getDateProductTotal(rows, date, productId),
  );
  const palette = getDateSpecialTotal(rows, date, 'palette');
  const gifts = getDateSpecialTotal(rows, date, 'gifts');
  const total =
    productTotals.reduce((sum, value) => sum + value, 0) + palette + gifts;

  return (
    <>
      {productTotals.map((value, index) => (
        <td key={`${date}-${productIds[index]}`} className="border border-slate-200 px-3 py-2">
          {toDisplayNumber(value)}
        </td>
      ))}
      <td className="border border-slate-200 px-3 py-2">{toDisplayNumber(palette)}</td>
      <td className="border border-slate-200 px-3 py-2">{toDisplayNumber(gifts)}</td>
      <td className="border border-slate-200 px-3 py-2 bg-slate-200">
        {toDisplayNumber(total)}
      </td>
    </>
  );
}
