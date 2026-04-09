import { useQuery }    from '@tanstack/react-query'
import { analyticsApi }from '../api/analytics'

export function useAnalyticsSummary(filters?: {
  brand_id?: string
  from?:     string
  to?:       string
}) {
  return useQuery({
    queryKey:  ['analytics', 'summary', filters],
    queryFn:   () => analyticsApi.getSummary(filters),
    staleTime: 30000,
  })
}

export function useFlaggedRate(brandId?: string) {
  return useQuery({
    queryKey:  ['analytics', 'flagged-rate', brandId],
    queryFn:   () => analyticsApi.getFlaggedRate({ brand_id: brandId }),
    staleTime: 30000,
  })
}

export function useReportsByDay(filters?: {
  brand_id?: string
  from?:     string
  to?:       string
}) {
  return useQuery({
    queryKey:  ['analytics', 'reports-by-day', filters],
    queryFn:   () => analyticsApi.getReportsByDay(filters),
    staleTime: 30000,
  })
}

export function useTopFlaggedProducts(brandId?: string, limit?: number) {
  return useQuery({
    queryKey:  ['analytics', 'top-flagged-products', brandId, limit],
    queryFn:   () => analyticsApi.getTopFlaggedProducts({ brand_id: brandId, limit }),
    staleTime: 30000,
  })
}
