import { dashboardApi } from '@/api/dashboard';
import type { MerchandiserDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useMerchandiserDashboard(params: MerchandiserDashboardParams) {
  return useQuery({
    queryKey: ['merchandiser-dashboard', params],
    queryFn: () => dashboardApi.getMerchandiserData(params),
    enabled: Boolean(params.brandId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
