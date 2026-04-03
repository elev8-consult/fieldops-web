import { api } from '@/api/axios';
import { normalizeOutlet } from '@/lib/normalize';
import type { Outlet } from '@/types';

export interface OutletListParams {
  region_id?: string;
  is_depot?: boolean;
  search?: string;
}

export async function fetchOutlets(params?: OutletListParams): Promise<Outlet[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/outlets', {
    params,
  });
  return data.map((row) => normalizeOutlet(row));
}

export async function fetchOutlet(id: string): Promise<Outlet> {
  const { data } = await api.get<Record<string, unknown>>(`/outlets/${id}`);
  return normalizeOutlet(data);
}

export async function createOutlet(body: {
  name: string;
  type: Outlet['type'];
  isDepot?: boolean;
  regionId: string;
  address?: string | null;
}): Promise<Outlet> {
  const { data } = await api.post<Record<string, unknown>>('/outlets', body);
  return normalizeOutlet(data);
}

export async function updateOutlet(
  id: string,
  body: Partial<{
    name: string;
    type: Outlet['type'];
    isDepot: boolean;
    regionId: string;
    address: string | null;
    isActive: boolean;
  }>,
): Promise<Outlet> {
  const { data } = await api.patch<Record<string, unknown>>(
    `/outlets/${id}`,
    body,
  );
  return normalizeOutlet(data);
}

export async function deleteOutlet(id: string): Promise<void> {
  await api.delete(`/outlets/${id}`);
}
