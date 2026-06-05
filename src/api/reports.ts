import { api } from '@/api/axios';
import {
  normalizeMerchandiserReport,
  normalizePromoterReport,
} from '@/lib/normalize';
import type {
  MerchandiserReport,
  PaginatedResponse,
  PromoterReport,
} from '@/types';

export interface ReportListParams {
  brand_id?: string;
  outlet_id?: string;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function fetchMerchandiserReports(
  params: ReportListParams,
): Promise<PaginatedResponse<MerchandiserReport>> {
  const { data } = await api.get<
    PaginatedResponse<Record<string, unknown>>
  >('/reports/merchandiser', { params });
  return {
    ...data,
    data: data.data.map((row) => normalizeMerchandiserReport(row)),
  };
}

export async function fetchMerchandiserReport(
  id: string,
): Promise<MerchandiserReport> {
  const { data } = await api.get<Record<string, unknown>>(
    `/reports/merchandiser/${id}`,
  );
  return normalizeMerchandiserReport(data);
}

export async function fetchPromoterReports(
  params: ReportListParams,
): Promise<PaginatedResponse<PromoterReport>> {
  const { data } = await api.get<PaginatedResponse<Record<string, unknown>>>(
    '/reports/promoter',
    { params },
  );
  return {
    ...data,
    data: data.data.map((row) => normalizePromoterReport(row)),
  };
}

export async function fetchPromoterReport(id: string): Promise<PromoterReport> {
  const { data } = await api.get<Record<string, unknown>>(
    `/reports/promoter/${id}`,
  );
  return normalizePromoterReport(data);
}

export async function patchMerchandiserReport(
  id: string,
  body: { promoType?: string | null; notes?: string | null },
): Promise<void> {
  await api.patch(`/reports/merchandiser/${id}`, body);
}

export async function patchParsedReport(
  parsedReportId: string,
  body: Record<string, unknown>,
): Promise<void> {
  await api.patch(`/review/${parsedReportId}`, body);
}

export async function patchMerchandiserItem(
  reportId: string,
  itemId: string,
  body: {
    productId?: string | null;
    quantity?: number | null;
    expiryDate?: string | null;
  },
): Promise<void> {
  await api.patch(
    `/reports/merchandiser/${reportId}/items/${itemId}`,
    body,
  );
}

export async function patchPromoterReport(
  id: string,
  body: {
    promoStandPlacement?: string | null;
    personsContacted?: number | null;
    personsTasted?: number | null;
    feedbackText?: string | null;
  },
): Promise<void> {
  await api.patch(`/reports/promoter/${id}`, body);
}

export async function patchPromoterSaleItem(
  reportId: string,
  itemId: string,
  body: {
    productId?: string | null;
    quantity?: number | null;
    promoLabel?: string | null;
    isOffer?: boolean;
  },
): Promise<void> {
  await api.patch(`/reports/promoter/${reportId}/sales/${itemId}`, body);
}

export async function patchPromoterSampleItem(
  reportId: string,
  itemId: string,
  body: {
    productId?: string | null;
    quantity?: number | null;
    availabilityNote?: string | null;
  },
): Promise<void> {
  await api.patch(`/reports/promoter/${reportId}/samples/${itemId}`, body);
}
