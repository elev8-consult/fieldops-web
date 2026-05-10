import { promoterDashboardApi } from '@/api/promoterDashboard';
import type { PromoterDashboardParams } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function usePromoterDashboardGrid(params: PromoterDashboardParams) {
  return useQuery({
    queryKey: ['promoter-dashboard-grid', params],
    queryFn: () => promoterDashboardApi.getGrid(params),
    enabled: Boolean(params.brand_id),
    staleTime: 60_000,
  });
}

export function usePromoterDashboardSummary(params: PromoterDashboardParams) {
  return useQuery({
    queryKey: ['promoter-dashboard-summary', params],
    queryFn: () => promoterDashboardApi.getSummary(params),
    enabled: Boolean(params.brand_id),
    staleTime: 60_000,
  });
}

export function usePromoterDashboardFilters(params: PromoterDashboardParams) {
  return useQuery({
    queryKey: ['promoter-dashboard-filters', params.brand_id, params.date_from, params.date_to],
    queryFn: () => promoterDashboardApi.getFilters(params),
    enabled: Boolean(params.brand_id),
    staleTime: 60_000,
  });
}

export function usePromoterOutletReports(
  outletId: string | null,
  params: PromoterDashboardParams,
) {
  return useQuery({
    queryKey: ['promoter-dashboard-outlet-reports', outletId, params],
    queryFn: () => promoterDashboardApi.getOutletReports(outletId ?? '', params),
    enabled: Boolean(outletId && params.brand_id),
    staleTime: 30_000,
  });
}
