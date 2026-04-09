import api from './axios'
import {
  AnalyticsSummary,
  FlaggedRate,
  ReportsByDay,
  TopFlaggedProduct,
} from '../types'

export const analyticsApi = {
  getSummary: (params?: {
    brand_id?: string
    from?:     string
    to?:       string
  }): Promise<AnalyticsSummary[]> =>
    api.get('/analytics/summary', { params }).then(r => r.data),

  getFlaggedRate: (params?: {
    brand_id?: string
  }): Promise<FlaggedRate> =>
    api.get('/analytics/flagged-rate', { params }).then(r => r.data),

  getReportsByDay: (params?: {
    brand_id?: string
    from?:     string
    to?:       string
  }): Promise<ReportsByDay[]> =>
    api.get('/analytics/reports-by-day', { params }).then(r => r.data),

  getTopFlaggedProducts: (params?: {
    brand_id?: string
    limit?:    number
  }): Promise<TopFlaggedProduct[]> =>
    api.get('/analytics/top-flagged-products', { params }).then(r => r.data),
}
