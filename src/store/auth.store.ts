import { create }  from 'zustand';
import { User }    from '../types';

const TOKEN_KEY = 'fieldops_token';
const USER_KEY  = 'fieldops_user';

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  setAuth:         (user: User, token: string) => void;
  clearAuth:       () => void;
  hasRole:         (...roles: string[]) => boolean;
}

// Hydrate from localStorage on init
const storedToken = localStorage.getItem(TOKEN_KEY);
const storedUser  = localStorage.getItem(USER_KEY);

let initialUser:  User | null   = null;
let initialToken: string | null = null;

try {
  if (storedToken && storedUser) {
    initialUser  = JSON.parse(storedUser);
    initialToken = storedToken;
  }
} catch {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            initialUser,
  token:           initialToken,
  isAuthenticated: initialToken !== null && initialUser !== null,

  setAuth: (user: User, token: string) => {
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
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
