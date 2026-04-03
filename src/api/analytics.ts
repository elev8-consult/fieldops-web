import { api } from '@/api/axios';
import type {
  AnalyticsSummaryRow,
  FlaggedRate,
  ReportsByDayRow,
  TopFlaggedProductRow,
} from '@/types';

export async function fetchAnalyticsSummary(params: {
  brand_id?: string;
  from?: string;
  to?: string;
}): Promise<AnalyticsSummaryRow[]> {
  const { data } = await api.get<AnalyticsSummaryRow[]>('/analytics/summary', {
    params,
  });
  return data.map((row) => ({
    reportType: row.reportType,
    status: row.status,
    count: typeof row.count === 'string' ? parseInt(row.count, 10) : row.count,
  }));
}

export async function fetchFlaggedRate(params: {
  brand_id?: string;
}): Promise<FlaggedRate> {
  const { data } = await api.get<Record<string, unknown>>(
    '/analytics/flagged-rate',
    { params },
  );
  return {
    flagged:
      typeof data.flagged === 'string'
        ? parseInt(data.flagged, 10)
        : Number(data.flagged),
    total:
      typeof data.total === 'string'
        ? parseInt(data.total, 10)
        : Number(data.total),
    rate:
      typeof data.rate === 'string' ? parseFloat(data.rate) : Number(data.rate),
  };
}

export async function fetchReportsByDay(params: {
  brand_id?: string;
  from?: string;
  to?: string;
}): Promise<ReportsByDayRow[]> {
  const { data } = await api.get<ReportsByDayRow[]>('/analytics/reports-by-day', {
    params,
  });
  return data.map((row) => ({
    day: row.day,
    count: typeof row.count === 'string' ? parseInt(row.count, 10) : row.count,
  }));
}

export async function fetchTopFlaggedProducts(params: {
  brand_id?: string;
  limit?: number;
}): Promise<TopFlaggedProductRow[]> {
  const { data } = await api.get<TopFlaggedProductRow[]>(
    '/analytics/top-flagged-products',
    { params },
  );
  return data.map((row) => ({
    productNameRaw: row.productNameRaw,
    count: typeof row.count === 'string' ? parseInt(row.count, 10) : row.count,
  }));
}
