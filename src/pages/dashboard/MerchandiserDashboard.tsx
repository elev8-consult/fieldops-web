import { fetchBrands } from '@/api/brands';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMerchandiserDashboard } from '@/hooks/useMerchandiserDashboard';
import { ROLES } from '@/lib/constants';
import { getAxiosMessage } from '@/lib/utils';
import { MerchandiserDashboardFilters } from '@/pages/dashboard/components/MerchandiserDashboardFilters';
import { DashboardSummaryCards } from '@/pages/dashboard/components/DashboardSummaryCards';
import { MerchandiserExportButton } from '@/pages/dashboard/components/MerchandiserExportButton';
import { PivotTable } from '@/pages/dashboard/components/PivotTable';
import type { MerchandiserDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { AlertTriangle, BarChart2, PackageSearch } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultDateRange = () => ({
  date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  date_to: format(new Date(), 'yyyy-MM-dd'),
});

export function MerchandiserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBrandManager = user?.role === ROLES.BRAND_MANAGER;
  const managerBrandId = isBrandManager ? (user?.brandId ?? '') : '';

  const initialFilters: MerchandiserDashboardParams = useMemo(
    () => ({
      brand_id: managerBrandId || undefined,
      ...defaultDateRange(),
    }),
    [managerBrandId],
  );

  const [draftFilters, setDraftFilters] =
    useState<MerchandiserDashboardParams>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<MerchandiserDashboardParams>(initialFilters);

  const brandsQ = useQuery({
    queryKey: ['brands', 'dashboard-filters'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const dashboardQ = useMerchandiserDashboard(appliedFilters);
  const dashboardData = dashboardQ.data;
  const lastUpdated = dashboardQ.dataUpdatedAt
    ? new Date(dashboardQ.dataUpdatedAt)
    : null;

  const brands = brandsQ.data ?? [];
  const noBrandSelected = !appliedFilters.brand_id;
  const hasNoRows = dashboardData != null && dashboardData.rows.length === 0;
  let content: ReactNode = null;

  if (noBrandSelected) {
    content = (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <BarChart2 className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          Select a brand to view the merchandiser stock dashboard
        </h2>
      </div>
    );
  } else if (dashboardQ.isLoading) {
    content = (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton variant="card" className="h-[420px]" />
      </div>
    );
  } else if (dashboardQ.isError) {
    content = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <h2 className="font-semibold text-red-900">Failed to load dashboard</h2>
        <p className="mt-1 text-sm text-red-700">{getAxiosMessage(dashboardQ.error)}</p>
        <Button className="mt-4" onClick={() => dashboardQ.refetch()}>
          Retry
        </Button>
      </div>
    );
  } else if (hasNoRows) {
    content = (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <PackageSearch className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          No matched reports found for this brand in the selected date range.
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting the filters or wait for newly processed reports to appear.
        </p>
        <Button className="mt-4" onClick={() => navigate('/review')}>
          Go to Review Queue
        </Button>
      </div>
    );
  } else if (dashboardData) {
    content = (
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
          {lastUpdated && (
            <span>
              Last updated:{' '}
              {lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
        <DashboardSummaryCards summary={dashboardData.summary} />
        <PivotTable data={dashboardData} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Merchandiser Stock Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Excel-style outlet x product stock view from live reports.
          </p>
        </div>
        <MerchandiserExportButton
          params={appliedFilters}
          disabled={noBrandSelected || hasNoRows || dashboardQ.isLoading}
        />
      </div>

      <MerchandiserDashboardFilters
        brands={brands}
        filters={draftFilters}
        isBrandManager={isBrandManager}
        onFiltersChange={setDraftFilters}
        onApply={() => setAppliedFilters(draftFilters)}
        onReset={() => {
          const resetFilters = {
            brand_id: managerBrandId || undefined,
            ...defaultDateRange(),
          };
          setDraftFilters(resetFilters);
          setAppliedFilters(resetFilters);
        }}
      />

      {content}
    </div>
  );
}
