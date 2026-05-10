import { api } from '@/api/axios';
import { normalizeUnknownSender } from '@/lib/normalize';
import type { UnknownSender } from '@/types';

export async function fetchUnknownSenders(
  resolved?: boolean,
): Promise<UnknownSender[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/unknown-senders', {
    params:
      resolved == null
        ? undefined
        : {
            resolved: String(resolved),
          },
  });
  return data.map((row) => normalizeUnknownSender(row));
}

export async function fetchUnknownSender(id: string): Promise<UnknownSender> {
  const { data } = await api.get<Record<string, unknown>>(`/unknown-senders/${id}`);
  return normalizeUnknownSender(data);
}

export async function resolveUnknownSender(
  id: string,
  brandId: string,
): Promise<UnknownSender> {
  const { data } = await api.patch<Record<string, unknown>>(
    `/unknown-senders/${id}/resolve`,
    { brand_id: brandId },
  );
  return normalizeUnknownSender(data);
}
