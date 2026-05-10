import {
  fetchUnknownSenders,
  resolveUnknownSender,
} from '@/api/unknownSenders';
import { useUiStore } from '@/store/ui.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useUnknownSenders(resolved?: boolean) {
  return useQuery({
    queryKey: ['unknown-senders', resolved],
    queryFn: () => fetchUnknownSenders(resolved),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnknownSenderUnresolvedCount(enabled = true) {
  return useQuery({
    queryKey: ['unknown-senders-count'],
    queryFn: async () => {
      const rows = await fetchUnknownSenders(false);
      return rows.length;
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useResolveUnknownSender() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, brandId }: { id: string; brandId: string }) =>
      resolveUnknownSender(id, brandId),
    onSuccess: async () => {
      addToast('success', 'Unknown sender resolved');
      await qc.invalidateQueries({ queryKey: ['unknown-senders'] });
      await qc.invalidateQueries({ queryKey: ['unknown-senders-count'] });
    },
    onError: (error: Error) =>
      addToast('error', error.message || 'Failed to resolve unknown sender'),
  });
}
