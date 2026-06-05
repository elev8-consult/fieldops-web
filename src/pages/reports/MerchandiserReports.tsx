import { fetchBrands } from '@/api/brands';
import { fetchOutlets } from '@/api/outlets';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMerchandiserReports } from '@/hooks/useReports';
import { ROLES } from '@/lib/constants';
import { cn, formatConfidence, formatDate, getAxiosMessage } from '@/lib/utils';
import type { MerchandiserReport } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  MapPin,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Missing field badge ───────────────────────────────────────────────────────

function MissingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      Not assigned
    </span>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active)
    return <span className="text-slate-300 group-hover:text-slate-400">↕</span>;
  return (
    <span className="font-bold text-indigo-600">
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MerchandiserReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBm = user?.role === ROLES.BRAND_MANAGER;

  const [page, setPage] = useState(1);
  const limit = 20;
  const [brandId, setBrandId] = useState(
    isBm && user?.brandId ? user.brandId : '',
  );
  const [outletId, setOutletId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Dropdown data ──────────────────────────────────────────────────────────

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    enabled: user?.role === ROLES.SUPER_ADMIN,
    staleTime: 60_000,
  });

  const outletsQ = useQuery({
    queryKey: ['outlets', 'reports-filters'],
    queryFn: () => fetchOutlets(),
    staleTime: 60_000,
  });

  // ── Query ──────────────────────────────────────────────────────────────────

  const effectiveBrand =
    isBm ? user?.brandId ?? undefined : brandId || undefined;

  const q = useMerchandiserReports({
    page,
    limit,
    brand_id: effectiveBrand,
    outlet_id: outletId || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
  });

  // ── Filter helpers ─────────────────────────────────────────────────────────

  const hasActiveFilters = Boolean(
    (!isBm && brandId) || outletId || from || to || status,
  );

  const clearFilters = () => {
    if (!isBm) setBrandId('');
    setOutletId('');
    setFrom('');
    setTo('');
    setStatus('');
    setPage(1);
  };

  // ── Client-side sort ───────────────────────────────────────────────────────

  const rows = q.data?.data ?? [];
  const total = q.data?.total ?? 0;

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let av: string = '';
      let bv: string = '';
      if (sortKey === 'date') {
        av = a.parsedReport.reportDate ?? a.parsedReport.createdAt;
        bv = b.parsedReport.reportDate ?? b.parsedReport.createdAt;
      } else if (sortKey === 'sender') {
        av = a.parsedReport.nameRaw ?? '';
        bv = b.parsedReport.nameRaw ?? '';
      } else if (sortKey === 'brand') {
        av = a.parsedReport.brand?.name ?? '';
        bv = b.parsedReport.brand?.name ?? '';
      } else if (sortKey === 'outlet') {
        av = a.parsedReport.outlet?.name ?? '';
        bv = b.parsedReport.outlet?.name ?? '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Page-level summary counts ──────────────────────────────────────────────

  const summary = useMemo(() => {
    const missingBrand = rows.filter((r) => !r.parsedReport.brandId).length;
    const missingOutlet = rows.filter((r) => !r.parsedReport.outletId).length;
    const flagged = rows.filter(
      (r) => r.parsedReport.status === 'flagged',
    ).length;
    return { missingBrand, missingOutlet, flagged };
  }, [rows]);

  // ── Loading / error ────────────────────────────────────────────────────────

  if (q.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h2 className="font-semibold">Failed to load reports</h2>
        </div>
        <p className="text-sm text-red-700">{getAxiosMessage(q.error)}</p>
        <Button onClick={() => q.refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Merchandiser Reports
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-slate-500">
            {total.toLocaleString()}{' '}
            {total === 1 ? 'report' : 'reports'}
            {hasActiveFilters && (
              <span className="ml-1 text-slate-400">· filtered</span>
            )}
          </span>
          {summary.flagged > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {summary.flagged} flagged on this page
            </span>
          )}
          {summary.missingBrand > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Building2 className="h-3.5 w-3.5" />
              {summary.missingBrand} missing brand
            </span>
          )}
          {summary.missingOutlet > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <MapPin className="h-3.5 w-3.5" />
              {summary.missingOutlet} missing outlet
            </span>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {user?.role === ROLES.SUPER_ADMIN && (
            <div className="min-w-[160px]">
              <Select
                label="Brand"
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All brands</option>
                {(brandsQ.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="min-w-[180px]">
            <Select
              label="Outlet"
              value={outletId}
              onChange={(e) => {
                setOutletId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All outlets</option>
              {(outletsQ.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-[140px]">
            <Input
              label="From"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="w-[140px]">
            <Input
              label="To"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="min-w-[160px]">
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="flagged">Flagged</option>
              <option value="pending_review">Pending review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mb-px flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-[7px] text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table / empty ── */}
      {sorted.length === 0 ? (
        <EmptyState
          title="No reports found"
          subtitle={
            hasActiveFilters
              ? 'Try adjusting your filters.'
              : 'No merchandiser reports yet.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                {/* ── Headers ── */}
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {/* Date */}
                    <th
                      className="group cursor-pointer select-none py-3 pl-6 pr-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('date')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Date{' '}
                        <SortIcon
                          active={sortKey === 'date'}
                          dir={sortDir}
                        />
                      </span>
                    </th>

                    {/* Sender */}
                    <th
                      className="group cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('sender')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Sender{' '}
                        <SortIcon
                          active={sortKey === 'sender'}
                          dir={sortDir}
                        />
                      </span>
                    </th>

                    {/* Brand */}
                    <th
                      className="group cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('brand')}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Brand{' '}
                        <SortIcon
                          active={sortKey === 'brand'}
                          dir={sortDir}
                        />
                      </span>
                    </th>

                    {/* Outlet */}
                    <th
                      className="group cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('outlet')}
                    >
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Outlet{' '}
                        <SortIcon
                          active={sortKey === 'outlet'}
                          dir={sortDir}
                        />
                      </span>
                    </th>

                    {/* Status */}
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    {/* Confidence */}
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Conf.
                    </th>

                    {/* Chevron placeholder */}
                    <th className="py-3 pl-2 pr-6" />
                  </tr>
                </thead>

                {/* ── Rows ── */}
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((row: MerchandiserReport) => {
                    const pr = row.parsedReport;
                    const brandMissing = !pr.brandId;
                    const outletMissing = !pr.outletId;
                    const needsAttention = brandMissing || outletMissing;

                    return (
                      <tr
                        key={row.id}
                        onClick={() =>
                          navigate(`/reports/merchandiser/${row.id}`)
                        }
                        className={cn(
                          'group cursor-pointer transition-colors',
                          needsAttention
                            ? '[box-shadow:inset_3px_0_0_#fbbf24] bg-amber-50/40 hover:bg-amber-50'
                            : 'hover:bg-slate-50',
                        )}
                      >
                        {/* Date */}
                        <td className="py-3.5 pl-6 pr-4 font-medium text-slate-900">
                          {formatDate(pr.reportDate ?? pr.createdAt)}
                        </td>

                        {/* Sender */}
                        <td className="px-4 py-3.5 text-slate-600">
                          {pr.nameRaw ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Brand */}
                        <td className="px-4 py-3.5">
                          {brandMissing ? (
                            <MissingBadge />
                          ) : (
                            <span className="text-slate-700">
                              {pr.brand?.name ??
                                pr.brandId?.slice(0, 8) + '…'}
                            </span>
                          )}
                        </td>

                        {/* Outlet */}
                        <td className="px-4 py-3.5">
                          {outletMissing ? (
                            <div className="space-y-1">
                              <MissingBadge />
                              {pr.locationRaw && (
                                <p className="max-w-[200px] truncate text-xs text-slate-400">
                                  &ldquo;{pr.locationRaw}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-700">
                                {pr.outlet?.name ??
                                  pr.outletId?.slice(0, 8) + '…'}
                              </span>
                              {pr.locationRaw &&
                                pr.locationRaw !== pr.outlet?.name && (
                                  <p className="max-w-[200px] truncate text-xs text-slate-400">
                                    {pr.locationRaw}
                                  </p>
                                )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge status={pr.status} />
                        </td>

                        {/* Confidence */}
                        <td className="px-4 py-3.5 text-slate-600">
                          {formatConfidence(pr.confidence)}
                        </td>

                        {/* Chevron */}
                        <td className="py-3.5 pl-2 pr-6 text-slate-300 transition-colors group-hover:text-slate-400">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
