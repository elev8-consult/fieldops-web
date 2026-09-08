import { fetchBrands } from '@/api/brands';
import { fetchOutlets } from '@/api/outlets';
import { fetchUsers } from '@/api/users';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';
import { DashboardFilters, type PromoterDashboardFiltersState } from '@/pages/dashboard/components/DashboardFilters';
import { ExportButton } from '@/pages/dashboard/components/ExportButton';
import { KpiCards } from '@/pages/dashboard/components/KpiCards';
import { OutletDrawer } from '@/pages/dashboard/components/OutletDrawer';
import { PromoterGrid } from '@/pages/dashboard/components/PromoterGrid';
import { useDashboardGrid } from '@/pages/dashboard/hooks/useDashboardGrid';
import { useDashboardSummary } from '@/pages/dashboard/hooks/useDashboardSummary';
import { useOutletReports } from '@/pages/dashboard/hooks/useOutletReports';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

const defaultFilters = (brandId = ''): PromoterDashboardFiltersState => ({
  brand_id: brandId,
  date_from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
  date_to: format(new Date(), 'yyyy-MM-dd'),
  status: ['approved', 'pending_review'],
});

export function PromoterDashboard() {
  const { user } = useAuth();
  const [drawerOutletId, setDrawerOutletId] = useState<string | null>(null);

  const allowed = useMemo(
    () =>
      user != null &&
      [ROLES.SUPER_ADMIN, ROLES.BRAND_MANAGER, ROLES.SUPERVISOR].includes(
        user.role as 'super_admin' | 'brand_manager' | 'supervisor',
      ),
    [user],
  );
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  const managerBrandId = user?.role === ROLES.BRAND_MANAGER ? (user.brandId ?? '') : '';
  const [draft, setDraft] = useState<PromoterDashboardFiltersState>(
    defaultFilters(managerBrandId),
  );
  const [filters, setFilters] = useState<PromoterDashboardFiltersState>(
    defaultFilters(managerBrandId),
  );

  const brandsQ = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  const outletsQ = useQuery({ queryKey: ['outlets'], queryFn: () => fetchOutlets() });
  const promotersQ = useQuery({
    queryKey: ['promoters', draft.brand_id],
    queryFn: () => fetchUsers(draft.brand_id || undefined),
  });

  const summaryQ = useDashboardSummary(filters);
  const gridQ = useDashboardGrid(filters);
  const outletReportsQ = useOutletReports(drawerOutletId, filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promoter Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pivot view by outlet, products, gifts, and totals.
          </p>
        </div>
        <ExportButton
          brandName={brandsQ.data?.find((brand) => brand.id === filters.brand_id)?.name ?? 'Brand'}
          dateFrom={filters.date_from}
          dateTo={filters.date_to}
          grid={gridQ.data}
          summary={summaryQ.data}
        />
      </div>

      <DashboardFilters
        brands={brandsQ.data ?? []}
        outlets={outletsQ.data ?? []}
        promoters={(promotersQ.data ?? []).filter((userItem) => userItem.role === 'promoter')}
        filters={draft}
        isBrandManager={user?.role === ROLES.BRAND_MANAGER}
        onChange={setDraft}
        onApply={() => setFilters(draft)}
        onReset={() => {
          const reset = defaultFilters(managerBrandId);
          setDraft(reset);
          setFilters(reset);
        }}
      />

      {summaryQ.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <KpiCards summary={summaryQ.data} />
      )}

      {gridQ.isLoading && <Skeleton className="h-[480px] w-full" />}
      {gridQ.data && (
        <PromoterGrid
          grid={gridQ.data}
          onOutletClick={(outletId) => setDrawerOutletId(outletId)}
        />
      )}

      <OutletDrawer
        open={drawerOutletId != null}
        data={outletReportsQ.data}
        loading={outletReportsQ.isLoading}
        onClose={() => setDrawerOutletId(null)}
      />
    </div>
  );
}
