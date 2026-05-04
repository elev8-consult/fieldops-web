import api          from './axios'
import { ParsedReport, PaginatedResponse } from '../types'

export interface ReviewQueueParams {
  brand_id?:    string
  report_type?: string
  status?:      string
  search?:      string
  page?:        number
  limit?:       number
}

export const reviewApi = {
  getQueue: (params?: {
    brand_id?:    string
    report_type?: string
    status?:      string
    search?:      string
    page?:        number
    limit?:       number
  }): Promise<PaginatedResponse<ParsedReport>> =>
    api.get('/review/queue', { params }).then(r => r.data),

  getReport: (id: string): Promise<ParsedReport> =>
    api.get(`/review/${id}`).then(r => r.data),

  update: (id: string, data: Record<string, unknown>): Promise<ParsedReport> =>
    api.patch(`/review/${id}`, data).then(r => r.data),

  approve: (id: string): Promise<ParsedReport> =>
    api.post(`/review/${id}/approve`).then(r => r.data),

  reject: (id: string): Promise<ParsedReport> =>
    api.post(`/review/${id}/reject`).then(r => r.data),

  resolveFlag: (flagId: string) =>
    api.patch(`/review/flags/${flagId}/resolve`).then(r => r.data),

  dismissFlag: (flagId: string) =>
    api.patch(`/review/flags/${flagId}/dismiss`).then(r => r.data),

  acceptMatch: (
    itemId: string,
    body: {
      productId: string;
      rawName: string;
      reportType: 'merchandiser' | 'promoter_sale' | 'promoter_sample';
    },
  ) => api.post(`/review/items/${itemId}/accept-match`, body).then(r => r.data),

  getCount: (brandId?: string): Promise<number> =>
    api.get('/review/count', { params: { brand_id: brandId } }).then(r => r.data),
}
