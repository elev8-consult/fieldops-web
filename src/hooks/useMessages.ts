import { fetchMessages, type MessageListParams } from '@/api/messages';
import { useQuery } from '@tanstack/react-query';

export const messageKeys = {
  all: ['messages'] as const,
  list: (p: MessageListParams) => ['messages', 'list', p] as const,
};

export function useMessages(filters: MessageListParams) {
  return useQuery({
    queryKey: messageKeys.list(filters),
    queryFn: () => fetchMessages(filters),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
