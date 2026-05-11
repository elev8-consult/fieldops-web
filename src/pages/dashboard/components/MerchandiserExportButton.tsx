import { dashboardApi } from '@/api/dashboard';
import { Button } from '@/components/ui/Button';
import { useUiStore } from '@/store/ui.store';
import type { MerchandiserDashboardParams } from '@/types';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface MerchandiserExportButtonProps {
  params: MerchandiserDashboardParams;
  disabled?: boolean;
}

export function MerchandiserExportButton({
  params,
  disabled,
}: MerchandiserExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const addToast = useUiStore((s) => s.addToast);

  return (
    <Button
      variant="secondary"
      loading={loading}
      disabled={disabled || !params.brand_id}
      leftIcon={<Download className="h-4 w-4" />}
      onClick={async () => {
        try {
          setLoading(true);
          await dashboardApi.exportMerchandiserExcel(params);
          addToast('success', 'Excel export downloaded');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to export dashboard';
          addToast('error', message);
        } finally {
          setLoading(false);
        }
      }}
    >
      Export Excel
    </Button>
  );
}
