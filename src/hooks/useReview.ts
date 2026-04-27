import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewApi } from '../api/review'

export function useReviewQueue(filters?: {
  brand_id?:    string
  report_type?: string
  status?:      string
  page?:        number
  limit?:       number
}) {
  return useQuery({
    queryKey:       ['review', 'queue', filters],
    queryFn:        () => reviewApi.getQueue(filters),
    staleTime:      15000,
    refetchInterval: 60000,
  })
}

export function useReviewFlaggedCount(brandId?: string) {
  return useQuery({
    queryKey:  ['review', 'count', brandId],
    queryFn:   () => reviewApi.getCount(brandId),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useReviewDetail(id: string | undefined) {
  return useQuery({
    queryKey:  ['review', 'detail', id],
    queryFn:   () => reviewApi.getReport(id!),
    enabled:   !!id && id !== 'undefined' && id !== 'null',
    staleTime: 30000,
    retry:     1,
  })
}

export function useApproveReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reviewApi.approve(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['review'] })
    },
  })
}

export function useRejectReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reviewApi.reject(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['review'] })
    },
  })
}

export function useUpdateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      reviewApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['review', 'detail', id] })
    },
  })
}

export function useResolveFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (flagId: string) => reviewApi.resolveFlag(flagId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['review'] })
    },
  })
}

export function useDismissFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (flagId: string) => reviewApi.dismissFlag(flagId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['review'] })
    },
  })
}

export function useAcceptProductMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      productId,
      rawName,
      reportType,
    }: {
      itemId: string
      productId: string
      rawName: string
      reportType: 'merchandiser' | 'promoter_sale' | 'promoter_sample'
    }) =>
      reviewApi.acceptMatch(itemId, { productId, rawName, reportType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review'] })
    },
  })
}
