import type { User } from '@/types';
import { normalizeUser } from '@/lib/normalize';
import { create } from 'zustand';

const TOKEN_KEY = 'fieldops_token';
const USER_KEY = 'fieldops_user';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: readStoredUser(),
  token: readStoredToken(),
  isAuthenticated: Boolean(readStoredToken() && readStoredUser()),
  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
  hasRole: (...roles: string[]) => {
    const u = get().user;
    if (!u) return false;
    return roles.includes(u.role);
  },
}));
