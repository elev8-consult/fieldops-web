import { api } from '@/api/axios';
import type {
  PromoterDashboardFilterOptions,
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
      .get<PromoterDashboardSummaryResponse>('/promoter-dashboard/summary', {
        params: normalizeParams(params),
      })
      .then((response) => response.data),

  getGrid: (params: PromoterDashboardParams) =>
    api
      .get<PromoterDashboardGridResponse>('/promoter-dashboard/grid', {
        params: normalizeParams(params),
      })
      .then((response) => response.data),

  getFilters: (params: PromoterDashboardParams) =>
    api
      .get<PromoterDashboardFilterOptions>('/promoter-dashboard/filters', {
        params: normalizeParams(params),
      })
      .then((response) => response.data),

  getOutletReports: (outletId: string, params: PromoterDashboardParams) =>
    api
      .get<PromoterOutletReportsResponse>(
        `/promoter-dashboard/outlet/${outletId}/reports`,
        { params: normalizeParams(params) },
      )
      .then((response) => response.data),
};
