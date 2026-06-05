import { fetchBrands } from '@/api/brands';
import { fetchOutlets } from '@/api/outlets';
import {
  patchMerchandiserReport,
  patchParsedReport,
} from '@/api/reports';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { reportKeys, useMerchandiserReport } from '@/hooks/useReports';
import {
  FLAG_CODE_LABELS,
  ROLES,
} from '@/lib/constants';
import {
  cn,
  formatConfidence,
  formatDate,
  getAxiosMessage,
} from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Package,
  Save,
  User,
  Warehouse,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Match type badge ────────────────────────────────────────────────────────

function MatchTypeBadge({ matchType }: { matchType: string | null }) {
  const cfg =
    matchType === 'exact'
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
      : matchType === 'alias'
        ? 'bg-blue-100 text-blue-700 ring-blue-200'
        : matchType === 'fuzzy' || matchType === 'fuzzy_confirmed'
          ? 'bg-amber-100 text-amber-700 ring-amber-200'
          : 'bg-red-100 text-red-600 ring-red-200';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        cfg,
      )}
    >
      {matchType ?? 'unmatched'}
    </span>
  );
}

// ─── Field row (read-only display) ──────────────────────────────────────────

function ReadOnlyField({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          'text-sm font-medium',
          missing ? 'text-amber-600' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MerchandiserReportDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const q = useMerchandiserReport(id);
  const report = q.data;
  const pr = report?.parsedReport;

  const canEdit =
    user?.role === ROLES.SUPER_ADMIN ||
    user?.role === ROLES.BRAND_MANAGER ||
    user?.role === ROLES.REVIEWER;
  const canEditBrand = user?.role === ROLES.SUPER_ADMIN;

  // ── Dropdown data ──────────────────────────────────────────────────────────

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    enabled: canEditBrand,
    staleTime: 60_000,
  });

  const outletsQ = useQuery({
    queryKey: ['outlets', 'merch-detail'],
    queryFn: () => fetchOutlets(),
    enabled: canEdit,
    staleTime: 60_000,
  });

  // ── Editable state ─────────────────────────────────────────────────────────

  const [brandId, setBrandId] = useState('');
  const [outletId, setOutletId] = useState('');
  const [isDepot, setIsDepot] = useState(false);
  const [promoType, setPromoType] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize once per report ID; reset on successful save via ref
  const initedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (report && report.id !== initedIdRef.current) {
      initedIdRef.current = report.id;
      setBrandId(pr?.brandId ?? '');
      setOutletId(pr?.outletId ?? '');
      setIsDepot(pr?.isDepotReport ?? false);
      setPromoType(report.promoType ?? '');
      setNotes(report.notes ?? '');
    }
  }, [report]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dirty tracking ─────────────────────────────────────────────────────────

  const hasChanges = useMemo(() => {
    if (!report || !pr) return false;
    const brandChanged =
      canEditBrand && brandId !== '' && brandId !== (pr.brandId ?? '');
    return (
      brandChanged ||
      outletId !== (pr.outletId ?? '') ||
      isDepot !== (pr.isDepotReport ?? false) ||
      promoType !== (report.promoType ?? '') ||
      notes !== (report.notes ?? '')
    );
  }, [report, pr, brandId, outletId, isDepot, promoType, notes, canEditBrand]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!report || !pr) return;
    setSaving(true);
    try {
      const calls: Promise<void>[] = [];
      const parsedPatch: Record<string, unknown> = {};

      if (canEditBrand && brandId && brandId !== (pr.brandId ?? '')) {
        parsedPatch.brandId = brandId;
      }
      if (outletId !== (pr.outletId ?? '')) {
        parsedPatch.outletId = outletId || null;
      }
      if (isDepot !== (pr.isDepotReport ?? false)) {
        parsedPatch.isDepotReport = isDepot;
      }
      if (Object.keys(parsedPatch).length > 0) {
        calls.push(patchParsedReport(pr.id, parsedPatch));
      }

      const reportPatch: { promoType?: string | null; notes?: string | null } = {};
      if (promoType !== (report.promoType ?? '')) {
        reportPatch.promoType = promoType || null;
      }
      if (notes !== (report.notes ?? '')) {
        reportPatch.notes = notes || null;
      }
      if (Object.keys(reportPatch).length > 0) {
        calls.push(patchMerchandiserReport(report.id, reportPatch));
      }

      await Promise.all(calls);
      addToast('success', 'Report saved');
      // Allow re-init from refreshed data
      initedIdRef.current = null;
      await qc.invalidateQueries({
        queryKey: reportKeys.merchandiserOne(id!),
      });
    } catch (e) {
      addToast('error', getAxiosMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Item sorting ───────────────────────────────────────────────────────────

  const [sortKey] = useState<'product' | 'quantity'>('product');
  const [sortDir] = useState<'asc' | 'desc'>('asc');

  const sortedItems = useMemo(() => {
    const items = [...(report?.items ?? [])];
    items.sort((a, b) => {
      const av =
        sortKey === 'product' ? (a.productNameRaw ?? '') : (a.quantity ?? -1);
      const bv =
        sortKey === 'product' ? (b.productNameRaw ?? '') : (b.quantity ?? -1);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [report?.items, sortKey, sortDir]);

  const unmatchedCount = useMemo(
    () => (report?.items ?? []).filter((i) => !i.isProductMatched).length,
    [report?.items],
  );

  // ── Loading / error states ─────────────────────────────────────────────────

  if (q.isLoading || !id) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Skeleton variant="card" className="lg:col-span-2" />
          <Skeleton variant="card" />
        </div>
        <Skeleton variant="card" />
      </div>
    );
  }

  if (q.isError || !report || !pr) {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="font-semibold">Failed to load report</p>
        </div>
        <p className="text-sm text-red-700">{getAxiosMessage(q.error)}</p>
        <Link
          to="/reports/merchandiser"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to list
        </Link>
      </div>
    );
  }

  const openFlags = (pr.flags ?? []).filter((f) => f.status === 'open');
  const resolvedBrandName =
    brandsQ.data?.find((b) => b.id === brandId)?.name ??
    pr.brand?.name;
  const resolvedOutletName =
    outletsQ.data?.find((o) => o.id === outletId)?.name ??
    pr.outlet?.name;

  const brandMissing = !brandId;
  const outletMissing = !outletId;

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <Link
        to="/reports/merchandiser"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Merchandiser Reports
      </Link>

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Merchandiser Report
            </h1>
            <Badge status={pr.status} />
            {openFlags.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                <AlertTriangle className="h-3 w-3" />
                {openFlags.length} open {openFlags.length === 1 ? 'flag' : 'flags'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(pr.reportDate ?? pr.createdAt)}
            {pr.nameRaw ? ` · Sent by ${pr.nameRaw}` : ''}
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm font-medium text-amber-600">
                Unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        )}
      </div>

      {/* ── Missing-field alerts ── */}
      {(brandMissing || outletMissing) && (
        <div className="space-y-2">
          {brandMissing && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Brand not assigned.</strong>{' '}
                {canEditBrand
                  ? 'Select a brand below to fix this report.'
                  : 'Contact an administrator to assign a brand.'}
              </span>
            </div>
          )}
          {outletMissing && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Outlet not assigned.</strong>{' '}
                {canEdit
                  ? 'Select an outlet below to fix this report.'
                  : 'Contact an administrator to assign an outlet.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Main grid: Details + Stats ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Details card (editable) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Report Details</h2>
            {canEdit && (
              <p className="mt-0.5 text-xs text-slate-400">
                Brand, outlet, and depot can be edited below.
              </p>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Brand */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Brand
                  {brandMissing && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </label>
                {canEditBrand ? (
                  <div className="relative">
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className={cn(
                        'w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2',
                        brandMissing
                          ? 'border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-300'
                          : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-500',
                      )}
                    >
                      <option value="">— Not assigned —</option>
                      {(brandsQ.data ?? []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm',
                      brandMissing
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-900',
                    )}
                  >
                    {resolvedBrandName ?? (
                      <span className="font-medium text-amber-600">
                        Not assigned
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Outlet */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                  Outlet
                  {outletMissing && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </label>
                {canEdit ? (
                  <div className="relative">
                    <select
                      value={outletId}
                      onChange={(e) => setOutletId(e.target.value)}
                      className={cn(
                        'w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2',
                        outletMissing
                          ? 'border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-300'
                          : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-500',
                      )}
                    >
                      <option value="">— Not assigned —</option>
                      {(outletsQ.data ?? []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm',
                      outletMissing
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-900',
                    )}
                  >
                    {resolvedOutletName ?? (
                      <span className="font-medium text-amber-600">
                        Not assigned
                      </span>
                    )}
                  </div>
                )}
                {pr.locationRaw && (
                  <p className="mt-1 truncate text-xs text-slate-400">
                    Raw: &ldquo;{pr.locationRaw}&rdquo;
                  </p>
                )}
              </div>

              {/* Depot toggle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Depot Report
                </label>
                {canEdit ? (
                  <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 text-sm">
                    <button
                      type="button"
                      onClick={() => setIsDepot(false)}
                      className={cn(
                        'px-5 py-2 font-medium transition-colors',
                        !isDepot
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDepot(true)}
                      className={cn(
                        'border-l border-slate-200 px-5 py-2 font-medium transition-colors',
                        isDepot
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      Yes
                    </button>
                  </div>
                ) : (
                  <Badge status={isDepot ? 'flagged' : 'draft'}>
                    {isDepot ? 'Yes' : 'No'}
                  </Badge>
                )}
              </div>

              {/* Promo type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Promo Type
                </label>
                {canEdit ? (
                  <input
                    type="text"
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    placeholder="e.g. listing"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <ReadOnlyField label="" value={promoType || '—'} />
                )}
              </div>

              {/* Sender (read-only) */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Sender
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {pr.nameRaw ?? '—'}
                </div>
              </div>

              {/* Date (read-only) */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Report Date
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {formatDate(pr.reportDate ?? pr.createdAt)}
                </div>
              </div>

              {/* Notes */}
              {(canEdit || notes) && (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  {canEdit ? (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Internal notes…"
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
                      {notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Summary
            </h3>
            <dl className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Package className="h-4 w-4" />
                  Total items
                </dt>
                <dd className="font-semibold text-slate-900">
                  {report.items.length}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Matched
                </dt>
                <dd className="font-semibold text-emerald-700">
                  {report.items.length - unmatchedCount}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="flex items-center gap-2 text-slate-500">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Unmatched
                </dt>
                <dd
                  className={cn(
                    'font-semibold',
                    unmatchedCount > 0 ? 'text-red-600' : 'text-slate-400',
                  )}
                >
                  {unmatchedCount}
                </dd>
              </div>

              <div className="my-1 border-t border-slate-100" />

              <div className="flex items-center justify-between text-sm">
                <dt className="text-slate-500">Confidence</dt>
                <dd className="font-semibold text-slate-900">
                  {formatConfidence(pr.confidence)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge status={pr.status} />
                </dd>
              </div>
              {openFlags.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-slate-500">Open flags</dt>
                  <dd className="font-semibold text-amber-600">
                    {openFlags.length}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* ── Stock Items table ── */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Stock Items</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {report.items.length} items ·{' '}
              {unmatchedCount > 0 ? (
                <span className="text-amber-600 font-medium">
                  {unmatchedCount} unmatched
                </span>
              ) : (
                <span className="text-emerald-600">all matched</span>
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="py-3 pl-6 pr-4">Product (raw)</th>
                <th className="px-4 py-3">Catalog name</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Match type</th>
                <th className="px-4 py-3 pr-6">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    No items recorded in this report.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition-colors hover:bg-slate-50',
                      !item.isProductMatched && 'bg-amber-50/50',
                    )}
                  >
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'h-2 w-2 shrink-0 rounded-full',
                            item.isProductMatched
                              ? 'bg-emerald-400'
                              : 'bg-amber-400',
                          )}
                        />
                        <span className="font-medium text-slate-900">
                          {item.productNameRaw ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {item.product?.canonicalName ??
                        (item.isProductMatched ? (
                          <span className="text-xs italic text-slate-400">
                            matched
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500">—</span>
                        ))}
                    </td>
                    <td className="px-4 py-3.5 pr-4 text-right font-semibold text-slate-900">
                      {item.quantity ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{formatDate(item.expiryDate)}</div>
                      {item.expiryRaw &&
                        item.expiryRaw !== item.expiryDate && (
                          <div className="text-xs text-slate-400">
                            {item.expiryRaw}
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-3.5">
                      <MatchTypeBadge matchType={item.matchType} />
                    </td>
                    <td className="px-4 py-3.5 pr-6 text-slate-600">
                      {item.matchConfidence != null
                        ? `${Math.round(Number(item.matchConfidence) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Batch details (if any items have batches) */}
        {sortedItems.some((item) => (item.batches?.length ?? 0) > 0) && (
          <div className="space-y-3 border-t border-slate-100 px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-700">
              Batch Details
            </h3>
            {sortedItems
              .filter((item) => (item.batches?.length ?? 0) > 0)
              .map((item) => (
                <div
                  key={`${item.id}-batches`}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.productNameRaw}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(item.batches ?? []).map((batch, idx) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <span className="text-xs text-slate-400">
                          Batch #{idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">
                          {batch.quantity ?? '—'} ·{' '}
                          {formatDate(batch.expiryDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Flags ── */}
      {(pr.flags?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Flags</h2>
            {openFlags.length > 0 && (
              <span className="text-xs font-medium text-amber-600">
                {openFlags.length} open
              </span>
            )}
          </div>
          <ul className="divide-y divide-slate-100">
            {(pr.flags ?? []).map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-start justify-between gap-3 px-6 py-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-1 h-2 w-2 shrink-0 rounded-full',
                      f.status === 'open'
                        ? 'bg-amber-400'
                        : 'bg-slate-300',
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {FLAG_CODE_LABELS[f.flagCode] ?? f.flagCode}
                    </p>
                    {f.message && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {f.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      f.severity === 'error'
                        ? 'text-red-600'
                        : f.severity === 'warning'
                          ? 'text-amber-600'
                          : 'text-slate-400',
                    )}
                  >
                    {f.severity}
                  </span>
                  <Badge status={f.status}>{f.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
