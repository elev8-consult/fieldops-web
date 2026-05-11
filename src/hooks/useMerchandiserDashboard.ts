import { dashboardApi } from '@/api/dashboard';
import type { MerchandiserDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';

const POLL_INTERVAL = 30_000;

export function useMerchandiserDashboard(params: MerchandiserDashboardParams) {
  return useQuery({
    queryKey: ['merchandiser-dashboard', params],
    queryFn: () => dashboardApi.getMerchandiserData(params),
    enabled: Boolean(params.brand_id),
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}
