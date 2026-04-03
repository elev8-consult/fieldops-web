import {
  fetchMerchandiserReport,
  fetchMerchandiserReports,
  fetchPromoterReport,
  fetchPromoterReports,
  patchMerchandiserItem,
  patchMerchandiserReport,
  patchPromoterReport,
  patchPromoterSaleItem,
  patchPromoterSampleItem,
  type ReportListParams,
} from '@/api/reports';
import { reviewKeys } from '@/hooks/reviewKeys';
import { useUiStore } from '@/store/ui.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const reportKeys = {
  all: ['reports'] as const,
  merchandiser: (p: ReportListParams) =>
    ['reports', 'merchandiser', p] as const,
  merchandiserOne: (id: string) => ['reports', 'merchandiser', id] as const,
  promoter: (p: ReportListParams) => ['reports', 'promoter', p] as const,
  promoterOne: (id: string) => ['reports', 'promoter', id] as const,
};

export function useMerchandiserReports(filters: ReportListParams) {
  return useQuery({
    queryKey: reportKeys.merchandiser(filters),
    queryFn: () => fetchMerchandiserReports(filters),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useMerchandiserReport(id: string | undefined) {
  return useQuery({
    queryKey: reportKeys.merchandiserOne(id ?? ''),
    queryFn: () => fetchMerchandiserReport(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function usePromoterReports(filters: ReportListParams) {
  return useQuery({
    queryKey: reportKeys.promoter(filters),
    queryFn: () => fetchPromoterReports(filters),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function usePromoterReport(id: string | undefined) {
  return useQuery({
    queryKey: reportKeys.promoterOne(id ?? ''),
    queryFn: () => fetchPromoterReport(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function usePatchMerchandiserReport() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchMerchandiserReport>[1];
    }) => patchMerchandiserReport(id, body),
    onSuccess: async (_, { id }) => {
      addToast('success', 'Report saved');
      await qc.invalidateQueries({ queryKey: reportKeys.merchandiserOne(id) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Save failed'),
  });
}

export function usePatchMerchandiserItem() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      reportId,
      itemId,
      body,
    }: {
      reportId: string;
      itemId: string;
      body: Parameters<typeof patchMerchandiserItem>[2];
    }) => patchMerchandiserItem(reportId, itemId, body),
    onSuccess: async (_, { reportId }) => {
      addToast('success', 'Item updated');
      await qc.invalidateQueries({
        queryKey: reportKeys.merchandiserOne(reportId),
      });
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });
}

export function usePatchPromoterReport() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchPromoterReport>[1];
    }) => patchPromoterReport(id, body),
    onSuccess: async (_, { id }) => {
      addToast('success', 'Report saved');
      await qc.invalidateQueries({ queryKey: reportKeys.promoterOne(id) });
    },
    onError: (e: Error) => addToast('error', e.message || 'Save failed'),
  });
}

export function usePatchPromoterSaleItem() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      reportId,
      itemId,
      body,
    }: {
      reportId: string;
      itemId: string;
      body: Parameters<typeof patchPromoterSaleItem>[2];
    }) => patchPromoterSaleItem(reportId, itemId, body),
    onSuccess: async (_, { reportId }) => {
      addToast('success', 'Sale line updated');
      await qc.invalidateQueries({ queryKey: reportKeys.promoterOne(reportId) });
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });
}

export function usePatchPromoterSampleItem() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      reportId,
      itemId,
      body,
    }: {
      reportId: string;
      itemId: string;
      body: Parameters<typeof patchPromoterSampleItem>[2];
    }) => patchPromoterSampleItem(reportId, itemId, body),
    onSuccess: async (_, { reportId }) => {
      addToast('success', 'Sample line updated');
      await qc.invalidateQueries({ queryKey: reportKeys.promoterOne(reportId) });
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });
}
