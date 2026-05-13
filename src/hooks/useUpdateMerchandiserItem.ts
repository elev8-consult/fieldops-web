import { dashboardApi } from '@/api/dashboard';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateMerchandiserItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      dashboardApi.updateItemQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandiser-dashboard'] });
    },
  });
}
