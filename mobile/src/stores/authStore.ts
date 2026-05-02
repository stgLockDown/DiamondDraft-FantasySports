import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  tier: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setSession: (user: User, token: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (login, password) => {
    const { data } = await authAPI.login({ login, password });
    await SecureStore.setItemAsync('dd_token', data.token);
    await SecureStore.setItemAsync('dd_refresh_token', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (regData) => {
    const { data } = await authAPI.register(regData);
    await SecureStore.setItemAsync('dd_token', data.token);
    await SecureStore.setItemAsync('dd_refresh_token', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('dd_token').catch(() => undefined);
    await SecureStore.deleteItemAsync('dd_refresh_token').catch(() => undefined);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('dd_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authAPI.me();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('dd_token').catch(() => undefined);
      await SecureStore.deleteItemAsync('dd_refresh_token').catch(() => undefined);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setSession: async (user, token, refreshToken) => {
    await SecureStore.setItemAsync('dd_token', token);
    await SecureStore.setItemAsync('dd_refresh_token', refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },
}));