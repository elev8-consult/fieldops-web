import { api } from '@/api/axios';
import { normalizeMessage } from '@/lib/normalize';
import type { PaginatedResponse, WhatsappMessage } from '@/types';

export interface MessageListParams {
  status?: string;
  report_type?: string;
  brand_id?: string;
  sender_phone?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function fetchMessages(
  params: MessageListParams,
): Promise<PaginatedResponse<WhatsappMessage>> {
  const { data } = await api.get<PaginatedResponse<Record<string, unknown>>>(
    '/messages',
    { params },
  );
  return {
    ...data,
    data: data.data.map((row) => normalizeMessage(row)),
  };
}

export async function fetchMessage(id: string): Promise<WhatsappMessage> {
  const { data } = await api.get<Record<string, unknown>>(`/messages/${id}`);
  return normalizeMessage(data);
}
