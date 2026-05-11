import { api } from '@/api/axios';
import type {
  MerchandiserDashboardParams,
  MerchandiserDashboardResponse,
} from '@/types';

export const dashboardApi = {
  getMerchandiserData: (params: MerchandiserDashboardParams) =>
    api
      .get<MerchandiserDashboardResponse>('/dashboard/merchandiser', { params })
      .then((r) => r.data),

  exportMerchandiserExcel: async (params: MerchandiserDashboardParams) => {
    const response = await api.get('/dashboard/merchandiser/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `merchandiser-report-${params.brand_id ?? 'all'}-${Date.now()}.xlsx`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
