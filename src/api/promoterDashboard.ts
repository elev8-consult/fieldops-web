import { api } from '@/api/axios';
import type {
  PromoterDashboardGridResponse,
  PromoterDashboardParams,
  PromoterDashboardSummaryResponse,
  PromoterOutletReportsResponse,
} from '@/types';

function normalizeParams(params: PromoterDashboardParams) {
  return {
    ...params,
    status: params.status && params.status.length > 0 ? params.status : undefined,
  };
}

export const promoterDashboardApi = {
  getSummary: (params: PromoterDashboardParams) =>
    api
      .get<PromoterDashboardSummaryResponse>('/dashboard/promoter/summary', {
        params: normalizeParams(params),
      })
      .then((response) => response.data),

  getGrid: (params: PromoterDashboardParams) =>
    api
      .get<PromoterDashboardGridResponse>('/dashboard/promoter/grid', {
        params: normalizeParams(params),
      })
      .then((response) => response.data),

  getOutletReports: (outletId: string, params: PromoterDashboardParams) =>
    api
      .get<PromoterOutletReportsResponse>(
        `/dashboard/promoter/outlet/${outletId}/reports`,
        { params: normalizeParams(params) },
      )
      .then((response) => response.data),
};
