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
import { useReviewQueue } from '@/hooks/useReview';
import { formatRelative } from '@/lib/utils';
import type { ParsedReport } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { endOfDay, startOfDay, subDays } from 'date-fns';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const brandId =
    user?.role === 'brand_manager' ? user.brandId ?? undefined : undefined;

  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  const from14 = subDays(new Date(), 14).toISOString();

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
  const topProdQ = useTopFlaggedProducts({ brand_id: brandId, limit: 10 });
  const recentFlaggedQ = useReviewQueue({
    status: 'flagged',
    brand_id: brandId,
    page: 1,
    limit: 5,
  });

  const ratioM = useMemo(() => {
    const rows = summaryAllQ.data ?? [];
    let m = 0;
    let p = 0;
    for (const r of rows) {
      if (r.reportType === 'merchandiser') m += r.count;
      if (r.reportType === 'promoter') p += r.count;
    }
    const t = m + p;
    return t ? m / t : 0.5;
  }, [summaryAllQ.data]);

  const linePoints: ReportDayPoint[] = useMemo(() => {
    return (byDayQ.data ?? []).map((row) => {
      const m = Math.round(row.count * ratioM);
      return {
        day: row.day,
        merchandiser: m,
        promoter: Math.max(0, row.count - m),
      };
    });
  }, [byDayQ.data, ratioM]);

  const totalToday = useMemo(() => {
    return (summaryQ.data ?? []).reduce((a, r) => a + r.count, 0);
  }, [summaryQ.data]);

  const flaggedToday = useMemo(() => {
    return (summaryQ.data ?? [])
      .filter((r) => r.status === 'flagged')
      .reduce((a, r) => a + r.count, 0);
  }, [summaryQ.data]);

  const approvedToday = useMemo(() => {
    return (summaryQ.data ?? [])
      .filter((r) => r.status === 'approved')
      .reduce((a, r) => a + r.count, 0);
  }, [summaryQ.data]);

  const statusSlices = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of summaryAllQ.data ?? []) {
      map.set(r.status, (map.get(r.status) ?? 0) + r.count);
    }
    return [...map.entries()].map(([status, count]) => ({ status, count }));
  }, [summaryAllQ.data]);

  const accuracy = useMemo(() => {
    const fr = flaggedQ.data;
    if (!fr || fr.total === 0) return 100;
    return Math.round((1 - fr.rate) * 100);
  }, [flaggedQ.data]);

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
            {flaggedToday || flaggedQ.data?.flagged || 0}
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
            data={topProdQ.data ?? []}
            loading={topProdQ.isLoading}
          />
        </Card>
      </div>
    </div>
  );
}
