import { promoterDashboardApi } from '@/api/promoterDashboard';
import type { PromoterDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useDashboardSummary(filters: PromoterDashboardParams) {
  return useQuery({
    queryKey: ['promoter-summary', filters],
    queryFn: () => promoterDashboardApi.getSummary(filters),
    enabled: Boolean(filters.brand_id),
    staleTime: 60_000,
  });
}
