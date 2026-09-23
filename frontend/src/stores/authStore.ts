import { create } from 'zustand';
import api, { getCsrfToken } from '@/lib/axios';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  isAdmin: () => {
    const user = get().user;
    return user?.role === 'admin';
  },

  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    await get().fetchUser();
  },

  register: async (data) => {
    const response = await api.post('/register', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    await get().fetchUser();
  },

  logout: async () => {
    await api.post('/logout');
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/user');
      const userData = response.data.data ? response.data.data : response.data;
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
