import { api } from '@/api/axios';
import { normalizeUser } from '@/lib/normalize';
import type { User } from '@/types';

export async function loginApi(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const { data } = await api.post<{
    access_token: string;
    user: Record<string, unknown>;
  }>('/auth/login', { email, password });
  return {
    token: data.access_token,
    user: normalizeUser(data.user),
  };
}
