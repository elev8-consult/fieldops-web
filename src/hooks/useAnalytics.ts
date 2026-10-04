import { useQuery }    from '@tanstack/react-query'
import { analyticsApi }from '../api/analytics'

export function useAnalyticsSummary(
  filters?: {
    brand_id?: string
    from?:     string
    to?:       string
  },
  enabled = true,
) {
  return useQuery({
    queryKey:  ['analytics', 'summary', filters],
    queryFn:   () => analyticsApi.getSummary(filters),
    staleTime: 30000,
    enabled,
  })
}

export function useFlaggedRate(brandId?: string, enabled = true) {
  return useQuery({
    queryKey:  ['analytics', 'flagged-rate', brandId],
    queryFn:   () => analyticsApi.getFlaggedRate({ brand_id: brandId }),
    staleTime: 30000,
    enabled,
  })
}

export function useReportsByDay(
  filters?: {
    brand_id?: string
    from?:     string
    to?:       string
  },
  enabled = true,
) {
  return useQuery({
    queryKey:  ['analytics', 'reports-by-day', filters],
    queryFn:   () => analyticsApi.getReportsByDay(filters),
    staleTime: 30000,
    enabled,
  })
}

export function useTopFlaggedProducts(
  brandId?: string,
  limit?: number,
  enabled = true,
) {
  return useQuery({
    queryKey:  ['analytics', 'top-flagged-products', brandId, limit],
    queryFn:   () => analyticsApi.getTopFlaggedProducts({ brand_id: brandId, limit }),
    staleTime: 30000,
    enabled,
  })
}
