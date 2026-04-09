import api from './axios';
import { User } from '../types';

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('fieldops_token');
    localStorage.removeItem('fieldops_user');
  },
};
