import { api } from '@/api/axios';
import { fetchBrands } from '@/api/brands';
import {
  exportPromoterDashboard,
  getPromoterDashboard,
  type PromoterDashboardCell,
  type PromoterDashboardProduct,
} from '@/api/promoterDashboardApi';
import { fetchProducts } from '@/api/products';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { getAxiosMessage } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { AlertTriangle, ChevronDown, ChevronUp, Download, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type DashboardParams = { brand_id: string; date_from?: string; date_to?: string };

const statusDotClass: Record<string, string> = {
  draft: 'bg-slate-400',
  pending_review: 'bg-amber-400',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return format(d, 'dd/MM/yyyy');
}

export function PromoterDashboardPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [brandId, setBrandId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [feedbackSearch, setFeedbackSearch] = useState('');

  const [editingProduct, setEditingProduct] = useState<PromoterDashboardProduct | null>(
    null,
  );
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(productSearch), 300);
    return () => window.clearTimeout(t);
  }, [productSearch]);

  const params: DashboardParams = useMemo(
    () => ({
      brand_id: brandId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [brandId, dateFrom, dateTo],
  );

  const brandsQ = useQuery({
    queryKey: ['brands', 'promoter-dashboard'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const dashboardQ = useQuery({
    queryKey: ['promoter-dashboard', params],
    queryFn: () => getPromoterDashboard(params),
    refetchInterval: 30000,
    enabled: !!brandId,
  });

  const productSearchQ = useQuery({
    queryKey: ['products', 'promoter-dashboard-search', brandId, debouncedSearch],
    queryFn: () =>
      fetchProducts({
        brand_id: brandId,
        search: debouncedSearch,
        limit: 10,
      }),
    enabled: !!brandId && !!editingProduct && debouncedSearch.trim().length > 0,
    staleTime: 20_000,
  });

  const patchMatchMutation = useMutation({
    mutationFn: async (args: { itemId: string; productId: string }) => {
      await api.patch(`/reports/promoter/items/${args.itemId}`, {
        product_id: args.productId,
      });
    },
    onSuccess: async () => {
      await dashboardQ.refetch();
      addToast('success', 'Product matched successfully');
    },
    onError: (error) => {
      addToast('error', getAxiosMessage(error));
    },
  });

  const tableRows = dashboardQ.data?.rows ?? [];
  const dates = dashboardQ.data?.dates ?? [];
  const products = dashboardQ.data?.products ?? [];
  const hasData = tableRows.length > 0;

  const table = useReactTable({
    data: tableRows,
    columns: [{ id: 'outlet_name', accessorFn: (row) => row.outlet_name }],
    getCoreRowModel: getCoreRowModel(),
  });

  const feedbackFiltered = useMemo(() => {
    const q = feedbackSearch.trim().toLowerCase();
    const all = dashboardQ.data?.feedback ?? [];
    if (!q) return all;
    return all.filter((f) => f.outlet_name.toLowerCase().includes(q));
  }, [dashboardQ.data?.feedback, feedbackSearch]);

  const getCell = (row: (typeof tableRows)[number], date: string, key: string) => {
    const raw = row.days[date]?.[key] as PromoterDashboardCell | undefined;
    return raw;
  };

  const openEditor = (product: PromoterDashboardProduct) => {
    setEditingProduct(product);
    setProductSearch(product.label);
    setDebouncedSearch(product.label);
  };

  const unmatchedItemIds = useMemo(() => {
    if (!editingProduct || !dashboardQ.data) return [];
    const ids = new Set<string>();
    for (const row of dashboardQ.data.rows) {
      for (const date of dashboardQ.data.dates) {
        const cell = row.days[date]?.[editingProduct.key] as
          | (PromoterDashboardCell & { item_id?: string | null })
          | undefined;
        if (cell?.item_id) ids.add(cell.item_id);
      }
    }
    return Array.from(ids);
  }, [editingProduct, dashboardQ.data]);

  const onSelectMatchProduct = async (productId: string) => {
    if (unmatchedItemIds.length === 0) {
      addToast('error', 'No item IDs available in this dataset for patching');
      return;
    }
    for (const itemId of unmatchedItemIds) {
      // sequential to avoid overwhelming API if many items
      await patchMatchMutation.mutateAsync({ itemId, productId });
    }
    setEditingProduct(null);
    setProductSearch('');
    setDebouncedSearch('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promoter Dashboard</h1>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Select
            label="Brand"
            value={brandId}
            onValueChange={(value) => setBrandId(value)}
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
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <div className="md:col-span-2 flex items-end">
            <Button
              leftIcon={<Download className="h-4 w-4" />}
              loading={isExporting}
              disabled={!brandId}
              onClick={async () => {
                try {
                  setIsExporting(true);
                  await exportPromoterDashboard(params);
                  addToast('success', 'Export downloaded');
                } catch (error) {
                  addToast('error', getAxiosMessage(error));
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {!brandId ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-700">
          Select a brand to view the promoter dashboard
        </div>
      ) : dashboardQ.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ) : dashboardQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
          <h2 className="font-semibold text-red-900">
            Failed to load dashboard. Please try again.
          </h2>
          <p className="mt-1 text-sm text-red-700">{getAxiosMessage(dashboardQ.error)}</p>
        </div>
      ) : !hasData ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-700">
          No promoter reports found for this period
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[72vh] overflow-auto">
              <table className="w-max min-w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      style={{ width: 200 }}
                      className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left text-xs font-semibold text-slate-800"
                    >
                      Outlet
                    </th>
                    {dates.map((date) => (
                      <th
                        key={date}
                        colSpan={products.length + 1}
                        className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-800"
                      >
                        {formatDate(date)}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left text-xs font-semibold text-slate-800"
                    >
                      Feedback
                    </th>
                  </tr>
                  <tr>
                    {dates.flatMap((date) => [
                      ...products.map((product) => (
                        <th
                          key={`${date}-${product.key}`}
                          className="sticky top-0 z-20 border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-semibold"
                          style={{
                            backgroundColor: product.unmatched
                              ? '#FFE4CC'
                              : product.is_offer
                                ? '#FFFACD'
                                : product.is_gift
                                  ? '#E6F3FF'
                                  : '#FFFFFF',
                          }}
                        >
                          <button
                            type="button"
                            disabled={!product.unmatched}
                            onClick={() => openEditor(product)}
                            className={`inline-flex items-center gap-1 ${
                              product.unmatched
                                ? 'cursor-pointer hover:underline'
                                : 'cursor-default'
                            }`}
                          >
                            {product.unmatched ? '⚠ ' : ''}
                            {product.label}
                          </button>
                        </th>
                      )),
                      <th
                        key={`${date}-total`}
                        className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-2 py-1 text-center text-[11px] font-bold"
                      >
                        Total
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((tRow) => (
                    <tr key={tRow.original.outlet_id} className="text-sm">
                      <td
                        className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-2 py-1"
                        style={{ width: 200 }}
                      >
                        {tRow.original.outlet_name}
                      </td>
                      {dates.flatMap((date) => [
                        ...products.map((product) => {
                          const cell = getCell(tRow.original, date, product.key);
                          const qty = cell?.quantity ?? 0;
                          const status = cell?.status ?? '';
                          return (
                            <td
                              key={`${tRow.original.outlet_id}-${date}-${product.key}`}
                              className="border-b border-r border-slate-100 px-2 py-1 text-center"
                            >
                              {qty > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <span>{qty}</span>
                                  <span
                                    className={`h-2 w-2 rounded-full ${statusDotClass[status] ?? 'bg-slate-300'}`}
                                  />
                                </span>
                              ) : (
                                ''
                              )}
                            </td>
                          );
                        }),
                        <td
                          key={`${tRow.original.outlet_id}-${date}-total`}
                          className="border-b border-r border-slate-100 px-2 py-1 text-center font-bold"
                        >
                          {Number(tRow.original.days[date]?.total ?? 0) || ''}
                        </td>,
                      ])}
                      <td className="border-b border-r border-slate-100 px-2 py-1 text-xs text-slate-700">
                        {(dashboardQ.data?.feedback ?? [])
                          .filter((f) => f.outlet_id === tRow.original.outlet_id)
                          .map((f) => `${formatDate(f.date)} - ${f.reporter_name ?? ''}: ${f.text}`)
                          .join('\n')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td className="sticky left-0 z-10 border-r border-t border-slate-300 bg-slate-100 px-2 py-1">
                      Total
                    </td>
                    {dates.flatMap((date) => [
                      ...products.map((product) => (
                        <td
                          key={`total-${date}-${product.key}`}
                          className="border-r border-t border-slate-300 px-2 py-1 text-center"
                        >
                          {dashboardQ.data?.totals[date]?.[product.key] || ''}
                        </td>
                      )),
                      <td
                        key={`total-${date}-total`}
                        className="border-r border-t border-slate-300 px-2 py-1 text-center font-bold"
                      >
                        {dashboardQ.data?.totals[date]?.total || ''}
                      </td>,
                    ])}
                    <td className="border-r border-t border-slate-300 px-2 py-1" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setFeedbackOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-semibold text-slate-900">Customer Feedback</span>
              {feedbackOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {feedbackOpen && (
              <div className="space-y-3 border-t border-slate-200 p-4">
                <div className="max-w-sm">
                  <Input
                    placeholder="Search by outlet name..."
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                  />
                </div>
                {feedbackFiltered.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No feedback recorded for this period.
                  </p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-auto">
                    {feedbackFiltered.map((entry, idx) => (
                      <div
                        key={`${entry.outlet_id}-${entry.date}-${idx}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.outlet_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatDate(entry.date)} | {entry.reporter_name ?? 'Unknown'}
                        </p>
                        <p className="mt-1 text-sm text-slate-800" dir="auto">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Match unmatched column: {editingProduct.label}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Current raw name: <span className="font-medium">{editingProduct.label}</span>
            </p>
            <p className="text-xs text-slate-500">
              Affected unmatched item IDs found: {unmatchedItemIds.length}
            </p>

            <div className="mt-3 max-h-72 space-y-2 overflow-auto">
              {productSearchQ.isFetching ? (
                <Skeleton className="h-10 w-full" />
              ) : (productSearchQ.data?.data ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No matching products found.</p>
              ) : (
                productSearchQ.data!.data.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={patchMatchMutation.isPending}
                    onClick={() => onSelectMatchProduct(product.id)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <div className="font-medium text-slate-900">{product.canonicalName}</div>
                    <div className="text-xs text-slate-500">{product.id}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

