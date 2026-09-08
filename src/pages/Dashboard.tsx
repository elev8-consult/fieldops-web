import type { ReportDayPoint } from '@/components/charts/ReportsByDayChart';
import { ReportsByDayChart } from '@/components/charts/ReportsByDayChart';
import { StatusDistributionChart } from '@/components/charts/StatusDistributionChart';
import { TopFlaggedProductsChart } from '@/components/charts/TopFlaggedProductsChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import {
  useAnalyticsSummary,
  useFlaggedRate,
  useReportsByDay,
  useTopFlaggedProducts,
} from '@/hooks/useAnalytics';
import { useMerchandiserDashboard } from '@/hooks/useMerchandiserDashboard';
import { useReviewQueue } from '@/hooks/useReview';
import { fetchBrand } from '@/api/brands';
import { DashboardSummaryCards } from '@/pages/dashboard/components/DashboardSummaryCards';
import { formatRelative } from '@/lib/utils';
import type { ParsedReport } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FlagTriangleRight,
  Store,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBrandManager = user?.role === 'brand_manager';
  const brandId = isBrandManager ? user.brandId ?? undefined : undefined;

  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  const from14 = subDays(new Date(), 14).toISOString();
  const from30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const todayShort = format(new Date(), 'yyyy-MM-dd');

  const brandQ = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => fetchBrand(brandId as string),
    enabled: Boolean(brandId),
    staleTime: 5 * 60_000,
  });

  const coverageQ = useMerchandiserDashboard({
    brand_id: brandId,
    date_from: from30,
    date_to: todayShort,
  });

  const summaryQ = useAnalyticsSummary({
    brand_id: brandId,
    from: todayStart,
    to: todayEnd,
  });
  const summaryAllQ = useAnalyticsSummary({ brand_id: brandId });
  const flaggedQ = useFlaggedRate(brandId);
  const byDayQ = useReportsByDay({
    brand_id: brandId,
    from: from14,
    to: todayEnd,
  });
  const topProdQ = useTopFlaggedProducts(brandId, 10);
  const recentFlaggedQ = useReviewQueue({
    status: 'flagged',
    brand_id: brandId,
    page: 1,
    limit: 5,
  });

  const summaryResponse = summaryQ.data as unknown;
  const summary = Array.isArray(summaryResponse)
    ? (summaryResponse as Array<{ status: string; count: number }>)
    : [];

  const summaryAllResponse = summaryAllQ.data as unknown;
  const summaryAll = Array.isArray(summaryAllResponse)
    ? (summaryAllResponse as Array<{ status: string; count: number }>)
    : [];

  const byDayResponse = byDayQ.data as unknown;
  const byDay = Array.isArray(byDayResponse)
    ? (byDayResponse as Array<Record<string, unknown>>)
    : [];

  const topFlaggedResponse = topProdQ.data as unknown;
  const topFlagged = Array.isArray(topFlaggedResponse)
    ? (topFlaggedResponse as Array<{ product_name_raw: string; count: number }>)
    : [];

  const linePoints: ReportDayPoint[] = useMemo(() => {
    const map = new Map<string, { merchandiser: number; promoter: number }>();

    for (const r of byDay) {
      const day = String(r['day']);
      const rt = String(r['reportType'] ?? r['report_type'] ?? '');
      const rawCount = r['count'];
      const count =
        typeof rawCount === 'number'
          ? rawCount
          : parseInt(String(rawCount), 10) || 0;
      const cur = map.get(day) ?? { merchandiser: 0, promoter: 0 };
      if (rt === 'merchandiser') cur.merchandiser += count;
      if (rt === 'promoter') cur.promoter += count;
      map.set(day, cur);
    }

    return [...map.entries()].map(([day, v]) => ({
      day,
      merchandiser: v.merchandiser,
      promoter: v.promoter,
    }));
  }, [byDay]);

  const topProductRows = useMemo(() => {
    return topFlagged.map((r) => ({
      productNameRaw: r.product_name_raw,
      count: r.count,
    }));
  }, [topFlagged]);

  const totalToday = useMemo(() => {
    return summary.reduce((a, r) => a + r.count, 0);
  }, [summary]);

  const flaggedToday = useMemo(() => {
    return summary
      .filter((r) => r.status === 'flagged')
      .reduce((a, r) => a + r.count, 0);
  }, [summary]);

  const approvedToday = useMemo(() => {
    return summary
      .filter((r) => r.status === 'approved')
      .reduce((a, r) => a + r.count, 0);
  }, [summary]);

  const statusSlices = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of summaryAll) {
      map.set(r.status, (map.get(r.status) ?? 0) + r.count);
    }
    return [...map.entries()].map(([status, count]) => ({ status, count }));
  }, [summaryAll]);

  const accuracy = useMemo(() => {
    const fr = flaggedQ.data;
    if (!fr) return 100;
    const rate = parseFloat(fr.rate);
    if (!Number.isFinite(rate)) return 100;
    return Math.max(0, Math.min(100, Math.round(100 - rate * 100)));
  }, [flaggedQ.data]);

  const outletsNeedingAttention = useMemo(() => {
    const rows = coverageQ.data?.rows ?? [];
    return rows
      .filter((r) => r.has_flags || r.pending_review)
      .slice(0, 5);
  }, [coverageQ.data]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const loading =
    summaryQ.isLoading ||
    flaggedQ.isLoading ||
    byDayQ.isLoading ||
    topProdQ.isLoading ||
    recentFlaggedQ.isLoading;

  if (
    summaryQ.isError ||
    flaggedQ.isError ||
    byDayQ.isError ||
    topProdQ.isError ||
    recentFlaggedQ.isError
  ) {
    const err =
      summaryQ.error ?? flaggedQ.error ?? byDayQ.error ?? topProdQ.error;
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-900">Something went wrong</h2>
            <p className="mt-1 text-sm text-red-700">
              {err instanceof Error ? err.message : 'Unknown error'}
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                summaryQ.refetch();
                flaggedQ.refetch();
                byDayQ.refetch();
                topProdQ.refetch();
                recentFlaggedQ.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !summaryQ.data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          {greet}, {firstName}
          {isBrandManager && brandQ.data?.name ? (
            <>
              {' — '}
              <span className="font-semibold text-slate-900">
                {brandQ.data.name}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => {}}
          className="rounded-xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900">
            {totalToday}
          </div>
          <p className="text-sm text-slate-500">reports processed today</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/review')}
          className="rounded-xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900">
            {flaggedToday ||
              (flaggedQ.data?.flagged ? parseInt(flaggedQ.data.flagged, 10) : 0)}
          </div>
          <p className="text-sm text-slate-500">need review</p>
        </button>
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900">
            {approvedToday}
          </div>
          <p className="text-sm text-slate-500">approved today</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Zap className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900">
            {accuracy}%
          </div>
          <p className="text-sm text-slate-500">auto-parsed rate</p>
        </div>
      </div>

      {isBrandManager && brandId ? (
        <Card
          title="Store Coverage"
          subtitle="Last 30 days"
          action={
            <Link
              to="/dashboard/merchandiser"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Full pivot
            </Link>
          }
          padding
        >
          {coverageQ.isLoading && !coverageQ.data ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : coverageQ.data ? (
            <div className="space-y-6">
              <DashboardSummaryCards summary={coverageQ.data.summary} />

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FlagTriangleRight className="h-4 w-4 text-amber-500" />
                  Outlets needing attention
                </div>
                {outletsNeedingAttention.length === 0 ? (
                  <EmptyState title="All outlets are clear — nothing flagged or pending" />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {outletsNeedingAttention.map((row) => (
                      <li key={row.outlet_id}>
                        <Link
                          to="/review"
                          className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                              <Store className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {row.outlet_name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {row.region_name ?? (row.is_depot ? 'Depot' : '—')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {row.pending_review && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Pending review
                              </span>
                            )}
                            {row.has_flags && (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                Flagged
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <EmptyState title="No coverage data yet" />
          )}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Reports Over Time"
          className="lg:col-span-2"
          padding
        >
          <ReportsByDayChart
            data={linePoints}
            loading={byDayQ.isLoading}
          />
        </Card>
        <Card title="Report Status" padding>
          <StatusDistributionChart
            data={statusSlices}
            loading={summaryAllQ.isLoading}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Needs Review"
          action={
            <Link
              to="/review"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          }
          padding
        >
          {!recentFlaggedQ.data?.data.length ? (
            <EmptyState title="No flagged reports" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentFlaggedQ.data.data.map((r: ParsedReport) => (
                <li key={r.id}>
                  <Link
                    to={`/review/${r.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {r.nameRaw ?? r.locationRaw ?? 'Report'}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge reportType={r.reportType} />
                        <span className="text-xs text-slate-400">
                          {r.locationRaw ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      {formatRelative(r.createdAt)}
                      <ChevronRight className="h-4 w-4 text-indigo-500" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title="Unrecognized Products"
          subtitle="Products not matched to catalog"
          padding
        >
          <TopFlaggedProductsChart
            data={topProductRows}
            loading={topProdQ.isLoading}
          />
        </Card>
      </div>
    </div>
  );
}
