import {
  fetchAnalyticsSummary,
  fetchFlaggedRate,
  fetchReportsByDay,
  fetchTopFlaggedProducts,
} from '@/api/analytics';
import { useQuery } from '@tanstack/react-query';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (p: { brand_id?: string; from?: string; to?: string }) =>
    ['analytics', 'summary', p] as const,
  flaggedRate: (brand_id?: string) =>
    ['analytics', 'flagged-rate', brand_id] as const,
  byDay: (p: { brand_id?: string; from?: string; to?: string }) =>
    ['analytics', 'by-day', p] as const,
  topProducts: (p: { brand_id?: string; limit?: number }) =>
    ['analytics', 'top-products', p] as const,
};

export function useAnalyticsSummary(params: {
  brand_id?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.summary(params),
    queryFn: () => fetchAnalyticsSummary(params),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useFlaggedRate(brandId?: string) {
  return useQuery({
    queryKey: analyticsKeys.flaggedRate(brandId),
    queryFn: () => fetchFlaggedRate({ brand_id: brandId }),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useReportsByDay(params: {
  brand_id?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.byDay(params),
    queryFn: () => fetchReportsByDay(params),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useTopFlaggedProducts(params: {
  brand_id?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: analyticsKeys.topProducts(params),
    queryFn: () => fetchTopFlaggedProducts(params),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
