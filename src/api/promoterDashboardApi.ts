import { api } from '@/api/axios';

export interface PromoterDashboardParams {
  brand_id: string;
  date_from?: string;
  date_to?: string;
}

export interface PromoterFeedbackEntry {
  outlet_name: string;
  date: string;
  reporter_name: string;
  text: string;
}

export interface PromoterDashboardResponse {
  brand: { id: string; name: string };
  date_range: { from: string; to: string };
  products: string[];
  dates: string[];
  rows: Array<{
    outlet_id: string;
    outlet_name: string;
    days: Record<string, Record<string, number | null>>;
  }>;
  totals: Record<string, Record<string, number>>;
  feedback: PromoterFeedbackEntry[];
}

export const promoterDashboardApi = {
  getPromoterDashboard: (params: PromoterDashboardParams) =>
    api
      .get<PromoterDashboardResponse>('/dashboard/promoter', { params })
      .then((r) => r.data),

  exportPromoterDashboard: async (params: PromoterDashboardParams) => {
    const response = await api.get('/dashboard/promoter/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `promoter-report-${params.brand_id ?? 'all'}-${Date.now()}.xlsx`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

