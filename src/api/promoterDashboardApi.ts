import { api } from '@/api/axios';

export interface PromoterDashboardProduct {
  key: string;
  label: string;
  product_id: string | null;
  unmatched: boolean;
  is_offer: boolean;
  is_gift: boolean;
}

export interface PromoterDashboardCell {
  quantity: number;
  status: string;
  parsed_report_id: string;
  item_id?: string | null;
}

export interface PromoterDashboardResponse {
  brand: { id: string; name: string };
  date_range: { from: string | null; to: string | null };
  dates: string[];
  products: PromoterDashboardProduct[];
  rows: Array<{
    outlet_id: string;
    outlet_name: string;
    days: Record<string, Record<string, PromoterDashboardCell | number>>;
  }>;
  totals: Record<string, Record<string, number>>;
  feedback: Array<{
    outlet_name: string;
    outlet_id: string;
    date: string;
    reporter_name: string | null;
    text: string;
  }>;
}

export async function getPromoterDashboard(params: {
  brand_id: string;
  date_from?: string;
  date_to?: string;
}): Promise<PromoterDashboardResponse> {
  const { data } = await api.get<PromoterDashboardResponse>('/dashboard/promoter', {
    params,
  });
  return data;
}

export async function exportPromoterDashboard(params: {
  brand_id: string;
  date_from?: string;
  date_to?: string;
}): Promise<void> {
  const response = await api.get('/dashboard/promoter/export', {
    params,
    responseType: 'blob',
  });
  const header = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = header?.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] ?? 'promoter-dashboard.xlsx';

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

