import { api } from '@/api/axios';
import { normalizeBrand } from '@/lib/normalize';
import type { Brand } from '@/types';

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/brands');
  return data.map((row) => normalizeBrand(row));
}

export async function fetchBrand(id: string): Promise<Brand> {
  const { data } = await api.get<Record<string, unknown>>(`/brands/${id}`);
  return normalizeBrand(data);
}

export async function createBrand(body: {
  name: string;
  slug: string;
}): Promise<Brand> {
  const { data } = await api.post<Record<string, unknown>>('/brands', body);
  return normalizeBrand(data);
}

export async function updateBrand(
  id: string,
  body: Partial<{ name: string; slug: string; isActive: boolean }>,
): Promise<Brand> {
  const { data } = await api.patch<Record<string, unknown>>(
    `/brands/${id}`,
    body,
  );
  return normalizeBrand(data);
}

export async function deleteBrand(id: string): Promise<void> {
  await api.delete(`/brands/${id}`);
}
