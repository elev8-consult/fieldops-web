import {
  approveReview,
  dismissFlag,
  fetchReviewDetail,
  fetchReviewQueue,
  fetchReviewQueueCount,
  rejectReview,
  resolveFlag,
  updateReviewReport,
  type ReviewQueueParams,
} from '@/api/review';
import { reviewKeys } from '@/hooks/reviewKeys';
import { useUiStore } from '@/store/ui.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type { ReviewQueueParams };
export { reviewKeys };

export function useReviewQueue(filters: ReviewQueueParams) {
  return useQuery({
    queryKey: reviewKeys.queue(filters),
    queryFn: () => fetchReviewQueue(filters),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useReviewFlaggedCount(brandId?: string) {
  return useQuery({
    queryKey: ['review', 'flagged-count', brandId ?? 'all'],
    queryFn: () =>
      fetchReviewQueueCount({
        status: 'flagged',
        brand_id: brandId,
      }),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useReviewDetail(id: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.detail(id ?? ''),
    queryFn: () => fetchReviewDetail(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useApproveReport() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => approveReview(id),
    onSuccess: async (_, id) => {
      addToast('success', 'Report approved');
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
      await qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Approve failed'),
  });
}

export function useRejectReport() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => rejectReview(id),
    onSuccess: async (_, id) => {
      addToast('success', 'Report rejected');
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
      await qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Reject failed'),
  });
}

export function useUpdateReviewReport() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateReviewReport>[1];
    }) => updateReviewReport(id, body),
    onSuccess: async (_, { id }) => {
      addToast('success', 'Report updated');
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
      await qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });
}

export function useResolveFlag() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ flagId, reportId }: { flagId: string; reportId: string }) =>
      resolveFlag(flagId).then(() => reportId),
    onSuccess: async (reportId) => {
      addToast('success', 'Flag resolved');
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
      await qc.invalidateQueries({ queryKey: reviewKeys.detail(reportId) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Resolve failed'),
  });
}

export function useDismissFlag() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ flagId, reportId }: { flagId: string; reportId: string }) =>
      dismissFlag(flagId).then(() => reportId),
    onSuccess: async (reportId) => {
      addToast('success', 'Flag dismissed');
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
      await qc.invalidateQueries({ queryKey: reviewKeys.detail(reportId) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Dismiss failed'),
  });
}
