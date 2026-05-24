import { fetchBrands } from '@/api/brands';
import {
  promoterDashboardApi,
  type PromoterDashboardParams,
} from '@/api/promoterDashboardApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';
import { getAxiosMessage } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { format, subDays } from 'date-fns';
import { AlertTriangle, Download, MessageSquareText, PackageSearch } from 'lucide-react';
import { useMemo, useState } from 'react';

const POLL_INTERVAL = 30_000;

const PRODUCT_ORDER = [
  'Shampoo ultimate repair',
  'Conditioner ultimate repair',
  'Mask ultimate repair',
  'Serum ultimate repair',
  'Shampoo oil nutritive',
  'Conditioner oil nutritive',
  'Mask oil nutritive',
  'Serum oil nutritive',
  'Shampoo aqua revive',
  'Conditioner aqua revive',
  'Mask aqua revive',
  'Shampoo total repair',
  'Conditioner total repair',
  'Mask total repair',
  'Shampoo split hair miracle',
  'Conditioner split hair miracle',
  'Shampoo supreme length',
  'Offer 20% total repair',
  'Offer 20% ultimate repair',
  'Offer 20% oil nutritive',
  'Offer 20% split hair miracle',
  'Offer 20% aqua revive',
  'Palette',
  'Gifts',
] as const;

const OFFER_COLUMNS = new Set([
  'Offer 20% total repair',
  'Offer 20% ultimate repair',
  'Offer 20% oil nutritive',
  'Offer 20% split hair miracle',
  'Offer 20% aqua revive',
]);

const defaultDateRange = () => ({
  date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  date_to: format(new Date(), 'yyyy-MM-dd'),
});

type PivotRow = {
  outlet_id: string;
  outlet_name: string;
  feedback_text: string;
  values: Record<string, number | null>;
};

const metricKey = (date: string, metric: string) => `${date}__${metric}`;

function renderPivotValue(value: number | null | undefined) {
  if (value == null || value === 0) return '';
  return value;
}

export function PromoterDashboardPage() {
  const { user } = useAuth();
  const addToast = useUiStore((s) => s.addToast);
  const isBrandManager = user?.role === ROLES.BRAND_MANAGER;
  const managerBrandId = isBrandManager ? (user?.brandId ?? '') : '';

  const initialFilters: PromoterDashboardParams = useMemo(
    () => ({
      brand_id: managerBrandId || '',
      ...defaultDateRange(),
    }),
    [managerBrandId],
  );

  const [draftFilters, setDraftFilters] =
    useState<PromoterDashboardParams>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<PromoterDashboardParams>(initialFilters);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const brandsQ = useQuery({
    queryKey: ['brands', 'promoter-dashboard-filters'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const dashboardQ = useQuery({
    queryKey: ['promoter-dashboard-pivot', appliedFilters],
    queryFn: () =>
      promoterDashboardApi.getPromoterDashboard({
        brand_id: appliedFilters.brand_id,
        date_from: appliedFilters.date_from,
        date_to: appliedFilters.date_to,
      }),
    enabled: Boolean(appliedFilters.brand_id),
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  const dashboardData = dashboardQ.data;
  const displayProducts = PRODUCT_ORDER.filter((product) =>
    dashboardData?.products.includes(product),
  );

  const feedbackByOutletName = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of dashboardData?.feedback ?? []) {
      const line = `${entry.date} | ${entry.reporter_name}: ${entry.text}`;
      if (!map.has(entry.outlet_name)) map.set(entry.outlet_name, []);
      map.get(entry.outlet_name)!.push(line);
    }
    return map;
  }, [dashboardData]);

  const tableData: PivotRow[] = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.rows.map((row) => {
      const values: Record<string, number | null> = {};
      for (const date of dashboardData.dates) {
        for (const product of displayProducts) {
          values[metricKey(date, product)] = row.days[date]?.[product] ?? null;
        }
        values[metricKey(date, 'Total')] = row.days[date]?.total ?? null;
      }

      return {
        outlet_id: row.outlet_id,
        outlet_name: row.outlet_name,
        feedback_text: (feedbackByOutletName.get(row.outlet_name) ?? []).join('\n'),
        values,
      };
    });
  }, [dashboardData, displayProducts, feedbackByOutletName]);

  const columns = useMemo<ColumnDef<PivotRow>[]>(
    () => [
      {
        id: 'outlet_name',
        accessorKey: 'outlet_name',
      },
      ...(dashboardData
        ? dashboardData.dates.flatMap((date) => [
            ...displayProducts.map((product) => ({
              id: metricKey(date, product),
              accessorFn: (row: PivotRow) => row.values[metricKey(date, product)],
            })),
            {
              id: metricKey(date, 'Total'),
              accessorFn: (row: PivotRow) => row.values[metricKey(date, 'Total')],
            },
          ])
        : []),
      {
        id: 'feedback_text',
        accessorKey: 'feedback_text',
      },
    ],
    [dashboardData, displayProducts],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const filteredFeedback = useMemo(() => {
    const q = feedbackSearch.trim().toLowerCase();
    if (!q) return dashboardData?.feedback ?? [];
    return (dashboardData?.feedback ?? []).filter((entry) =>
      entry.outlet_name.toLowerCase().includes(q),
    );
  }, [dashboardData?.feedback, feedbackSearch]);

  const noBrandSelected = !appliedFilters.brand_id;
  const hasNoRows = dashboardData != null && dashboardData.rows.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promoter Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Excel-style outlet x day x product promoter pivot with feedback.
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Brand"
            value={draftFilters.brand_id}
            onValueChange={(brand_id) => setDraftFilters({ ...draftFilters, brand_id })}
            disabled={isBrandManager}
          >
            <option value="">Select brand</option>
            {(brandsQ.data ?? []).map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>

          <Input
            label="Date From"
            type="date"
            value={draftFilters.date_from ?? ''}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, date_from: e.target.value })
            }
          />

          <Input
            label="Date To"
            type="date"
            value={draftFilters.date_to ?? ''}
            onChange={(e) => setDraftFilters({ ...draftFilters, date_to: e.target.value })}
          />

          <div className="flex items-end gap-2 xl:col-span-2">
            <Button className="w-full" onClick={() => setAppliedFilters(draftFilters)}>
              Apply
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                const reset = {
                  brand_id: managerBrandId || '',
                  ...defaultDateRange(),
                };
                setDraftFilters(reset);
                setAppliedFilters(reset);
              }}
            >
              Reset
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              loading={exporting}
              leftIcon={<Download className="h-4 w-4" />}
              disabled={noBrandSelected || hasNoRows || dashboardQ.isLoading}
              onClick={async () => {
                try {
                  setExporting(true);
                  await promoterDashboardApi.exportPromoterDashboard({
                    brand_id: appliedFilters.brand_id,
                    date_from: appliedFilters.date_from,
                    date_to: appliedFilters.date_to,
                  });
                  addToast('success', 'Promoter dashboard export downloaded');
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : 'Failed to export promoter dashboard';
                  addToast('error', message);
                } finally {
                  setExporting(false);
                }
              }}
            >
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {noBrandSelected ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            Select a brand to view the promoter dashboard
          </h2>
        </div>
      ) : dashboardQ.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton variant="card" className="h-[460px]" />
        </div>
      ) : dashboardQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
          <h2 className="font-semibold text-red-900">Failed to load promoter dashboard</h2>
          <p className="mt-1 text-sm text-red-700">{getAxiosMessage(dashboardQ.error)}</p>
          <Button className="mt-4" onClick={() => dashboardQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : hasNoRows || !dashboardData ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            No promoter reports found for this filter range.
          </h2>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 pb-2 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              {dashboardQ.isFetching ? (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Updating…</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span>Live</span>
                </>
              )}
            </div>
            <span>
              {dashboardData.brand.name} | {dashboardData.date_range.from} to{' '}
              {dashboardData.date_range.to}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[72vh] overflow-auto">
              <table className="w-max min-w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className="sticky left-0 top-0 z-40 min-w-64 border-b border-r border-slate-300 bg-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-900"
                      rowSpan={2}
                    >
                      Outlet
                    </th>
                    {dashboardData.dates.map((date) => (
                      <th
                        key={date}
                        className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-100 px-2 py-3 text-center text-xs font-semibold text-slate-700"
                        colSpan={displayProducts.length + 1}
                      >
                        {date}
                      </th>
                    ))}
                    <th
                      className="sticky top-0 z-30 min-w-80 border-b border-r border-slate-200 bg-slate-100 px-3 py-3 text-left text-xs font-semibold text-slate-700"
                      rowSpan={2}
                    >
                      Feedback
                    </th>
                  </tr>
                  <tr>
                    {dashboardData.dates.flatMap((date) => [
                      ...displayProducts.map((product) => (
                        <th
                          key={metricKey(date, product)}
                          className={`sticky top-0 z-30 min-w-28 border-b border-r border-slate-200 px-2 py-3 text-center text-xs font-semibold ${
                            OFFER_COLUMNS.has(product)
                              ? 'bg-amber-50 text-amber-800'
                              : product === 'Gifts'
                                ? 'bg-sky-50 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {product}
                        </th>
                      )),
                      <th
                        key={metricKey(date, 'Total')}
                        className="sticky top-0 z-30 min-w-24 border-b border-r border-slate-200 bg-slate-200 px-2 py-3 text-center text-xs font-semibold text-slate-800"
                      >
                        Total
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.original.outlet_id}>
                      <td className="sticky left-0 z-20 min-w-64 border-b border-r border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900">
                        {row.original.outlet_name}
                      </td>
                      {dashboardData.dates.flatMap((date) => [
                        ...displayProducts.map((product) => {
                          const value = row.original.values[metricKey(date, product)];
                          return (
                            <td
                              key={`${row.original.outlet_id}-${metricKey(date, product)}`}
                              className={`min-w-28 border-b border-r border-slate-100 px-2 py-1 text-center text-sm ${
                                OFFER_COLUMNS.has(product)
                                  ? 'bg-amber-50'
                                  : product === 'Gifts'
                                    ? 'bg-sky-50'
                                    : ''
                              }`}
                            >
                              {renderPivotValue(value)}
                            </td>
                          );
                        }),
                        <td
                          key={`${row.original.outlet_id}-${metricKey(date, 'Total')}`}
                          className="min-w-24 border-b border-r border-slate-100 bg-slate-50 px-2 py-1 text-center text-sm font-semibold"
                        >
                          {renderPivotValue(
                            row.original.values[metricKey(date, 'Total')],
                          )}
                        </td>,
                      ])}
                      <td className="min-w-80 border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-700 whitespace-pre-line">
                        {row.original.feedback_text || ''}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-100 font-semibold">
                    <td className="sticky left-0 z-20 border-r border-t border-slate-300 bg-slate-200 px-3 py-2 text-sm">
                      Total
                    </td>
                    {dashboardData.dates.flatMap((date) => [
                      ...displayProducts.map((product) => (
                        <td
                          key={`total-${metricKey(date, product)}`}
                          className={`border-r border-t border-slate-300 px-2 py-2 text-center text-sm ${
                            OFFER_COLUMNS.has(product)
                              ? 'bg-amber-100'
                              : product === 'Gifts'
                                ? 'bg-sky-100'
                                : 'bg-slate-100'
                          }`}
                        >
                          {renderPivotValue(dashboardData.totals[date]?.[product])}
                        </td>
                      )),
                      <td
                        key={`total-${metricKey(date, 'Total')}`}
                        className="border-r border-t border-slate-300 bg-slate-200 px-2 py-2 text-center text-sm font-bold"
                      >
                        {renderPivotValue(dashboardData.totals[date]?.total)}
                      </td>,
                    ])}
                    <td className="border-r border-t border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-600">
                      {dashboardData.feedback.length} feedback entries
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">Feedback Panel</h2>
              </div>
              <div className="w-full max-w-sm">
                <Input
                  placeholder="Search by outlet name..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto">
              {filteredFeedback.length === 0 ? (
                <p className="text-sm text-slate-500">No feedback matches the search.</p>
              ) : (
                filteredFeedback.map((entry, index) => (
                  <div
                    key={`${entry.outlet_name}-${entry.date}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-xs font-semibold text-slate-700">
                      {entry.outlet_name} | {entry.date} | {entry.reporter_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
                      {entry.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

