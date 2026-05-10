import { promoterDashboardApi } from '@/api/promoterDashboard';
import type { PromoterDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useOutletReports(outletId: string | null, filters: PromoterDashboardParams) {
  return useQuery({
    queryKey: ['promoter-outlet-reports', outletId, filters],
    queryFn: () => promoterDashboardApi.getOutletReports(outletId ?? '', filters),
    enabled: Boolean(outletId && filters.brand_id),
    staleTime: 30_000,
  });
}
