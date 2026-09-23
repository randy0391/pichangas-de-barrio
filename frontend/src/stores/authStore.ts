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
    await getCsrfToken();
    await api.post('/login', credentials);
    await get().fetchUser();
  },

  register: async (data) => {
    await getCsrfToken();
    await api.post('/register', data);
    await get().fetchUser();
  },

  logout: async () => {
    await api.post('/logout');
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
