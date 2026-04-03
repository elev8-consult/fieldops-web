import { api } from '@/api/axios';
import { normalizeFlag, normalizeParsedReport } from '@/lib/normalize';
import type { PaginatedResponse, ParsedReport, ReportFlag } from '@/types';

export interface ReviewQueueParams {
  brand_id?: string;
  report_type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function fetchReviewQueue(
  params: ReviewQueueParams,
): Promise<PaginatedResponse<ParsedReport>> {
  const { data } = await api.get<PaginatedResponse<Record<string, unknown>>>(
    '/review/queue',
    { params },
  );
  return {
    ...data,
    data: data.data.map((row) => normalizeParsedReport(row)),
  };
}

export interface ReviewDetailResponse {
  parsedReport: ParsedReport;
  flags: ReportFlag[];
  message: { bodyRaw: string | null; aiExtraction: Record<string, unknown> | null } | null;
}

export async function fetchReviewDetail(id: string): Promise<ReviewDetailResponse> {
  const { data } = await api.get<{
    parsedReport: Record<string, unknown>;
    flags?: Record<string, unknown>[];
    message?: Record<string, unknown> | null;
  }>(`/review/${id}`);

  const parsedReport = normalizeParsedReport(data.parsedReport);
  const flags = (data.flags ?? parsedReport.flags ?? []).map((f) =>
    normalizeFlag(f as Record<string, unknown>),
  );
  parsedReport.flags = flags;

  let message: ReviewDetailResponse['message'] = null;
  if (data.message) {
    const m = data.message;
    message = {
      bodyRaw: m.bodyRaw != null ? String(m.bodyRaw) : null,
      aiExtraction:
        (m.aiExtraction as Record<string, unknown> | null) ?? null,
    };
  }

  return { parsedReport, flags, message };
}

export async function updateReviewReport(
  id: string,
  body: {
    outletId?: string | null;
    reportDate?: string | null;
    locationRaw?: string | null;
    nameRaw?: string | null;
  },
): Promise<ParsedReport> {
  const { data } = await api.patch<Record<string, unknown>>(
    `/review/${id}`,
    body,
  );
  return normalizeParsedReport(data);
}

export async function approveReview(id: string): Promise<void> {
  await api.post(`/review/${id}/approve`);
}

export async function rejectReview(id: string): Promise<void> {
  await api.post(`/review/${id}/reject`);
}

export async function resolveFlag(flagId: string): Promise<void> {
  await api.patch(`/review/flags/${flagId}/resolve`);
}

export async function dismissFlag(flagId: string): Promise<void> {
  await api.patch(`/review/flags/${flagId}/dismiss`);
}

export async function fetchReviewQueueCount(
  params: Pick<ReviewQueueParams, 'brand_id' | 'status'>,
): Promise<number> {
  const { data } = await api.get<PaginatedResponse<Record<string, unknown>>>(
    '/review/queue',
    { params: { ...params, limit: 1, page: 1 } },
  );
  return data.total;
}
