import api from './axios'
import { WhatsappMessage, PaginatedResponse } from '../types'

export const messagesApi = {
  findAll: (params?: {
    status?:       string
    report_type?:  string
    brand_id?:     string
    sender_phone?: string
    from?:         string
    to?:           string
    page?:         number
    limit?:        number
  }): Promise<PaginatedResponse<WhatsappMessage>> =>
    api.get('/messages', { params }).then(r => r.data),

  findOne: (id: string): Promise<WhatsappMessage> =>
    api.get(`/messages/${id}`).then(r => r.data),
}

export type MessageListParams = Parameters<typeof messagesApi.findAll>[0] extends
  | infer P
  | undefined
  ? P extends object
    ? P
    : never
  : never

export async function fetchMessages(
  params: MessageListParams,
): Promise<PaginatedResponse<WhatsappMessage>> {
  return messagesApi.findAll(params)
}

export async function fetchMessage(id: string): Promise<WhatsappMessage> {
  return messagesApi.findOne(id)
}
