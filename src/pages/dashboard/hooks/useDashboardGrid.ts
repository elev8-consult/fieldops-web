import { promoterDashboardApi } from '@/api/promoterDashboard';
import type { PromoterDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useDashboardGrid(filters: PromoterDashboardParams) {
  return useQuery({
    queryKey: ['promoter-grid', filters],
    queryFn: () => promoterDashboardApi.getGrid(filters),
    enabled: Boolean(filters.brand_id),
    staleTime: 60_000,
  });
}
