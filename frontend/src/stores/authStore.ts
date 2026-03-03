import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  tier: string;
  avatarUrl: string | null;
  teams?: any[];
  ownedLeagues?: any[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (login, password) => {
    const { data } = await authAPI.login({ login, password });
    localStorage.setItem('dd_token', data.token);
    localStorage.setItem('dd_refresh_token', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (regData) => {
    const { data } = await authAPI.register(regData);
    localStorage.setItem('dd_token', data.token);
    localStorage.setItem('dd_refresh_token', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('dd_token');
    localStorage.removeItem('dd_refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('dd_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authAPI.me();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('dd_token');
      localStorage.removeItem('dd_refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));