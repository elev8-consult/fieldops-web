import { api } from '@/api/axios';
import { normalizeUser } from '@/lib/normalize';
import type { User } from '@/types';

export async function fetchUsers(brand_id?: string): Promise<User[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/users', {
    params: brand_id ? { brand_id } : undefined,
  });
  return data.map((row) => normalizeUser(row));
}

export async function fetchUser(id: string): Promise<User> {
  const { data } = await api.get<Record<string, unknown>>(`/users/${id}`);
  return normalizeUser(data);
}

export async function createUser(body: {
  fullName: string;
  whatsappPhone?: string;
  /** Optional for mobile (OTP) users. */
  email?: string;
  /** Optional for mobile (OTP) users. */
  password?: string;
  role: User['role'];
  brandId?: string | null;
  outletIds?: string[];
}): Promise<User> {
  const { data } = await api.post<Record<string, unknown>>('/users', body);
  return normalizeUser(data);
}

export async function updateUser(
  id: string,
  body: Partial<{
    fullName: string;
    whatsappPhone: string | null;
    email: string;
    password: string;
    role: User['role'];
    brandId: string | null;
    isActive: boolean;
    outletIds: string[];
  }>,
): Promise<User> {
  const { data } = await api.patch<Record<string, unknown>>(
    `/users/${id}`,
    body,
  );
  return normalizeUser(data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

/** Outlet ids a mobile user is assigned to. */
export async function fetchUserOutlets(id: string): Promise<string[]> {
  const { data } = await api.get<string[]>(`/users/${id}/outlets`);
  return data ?? [];
}
