/**
 * Mobile API client.
 *
 * Deliberately mirrors the web /frontend/src/services/api.ts so both
 * codebases speak the same endpoints. The only differences are:
 *   - tokens are stored in expo-secure-store, not localStorage
 *   - the base URL is read from app.json (expo Constants) with an
 *     env-var override for builds pointing at staging / local dev
 */
import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };
export const API_URL = process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'https://diamonddraft.app';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
});

// Attach token on every request.
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('dd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear stored auth so the app falls back to the login screen.
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      await SecureStore.deleteItemAsync('dd_token').catch(() => undefined);
      await SecureStore.deleteItemAsync('dd_refresh_token').catch(() => undefined);
    }
    return Promise.reject(err);
  },
);

// ─── endpoints ──────────────────────────────────────────────────────
export const authAPI = {
  login: (body: { login: string; password: string }) => api.post('/api/auth/login', body),
  register: (body: any) => api.post('/api/auth/register', body),
  me: () => api.get('/api/auth/me'),
};

export const ssoAPI = {
  valorOdds: (token: string) => api.post('/api/auth/sso/valorodds', { token }),
};

export const leagueAPI = {
  myLeagues: () => api.get('/api/leagues'),
  getLeague: (id: string) => api.get(`/api/leagues/${id}`),
};

export const playerAPI = {
  search: (params: any) => api.get('/api/players', { params }),
  getInjuryByMlbId: (mlbId: number) => api.get(`/api/players/mlb/${mlbId}/injury-status`),
  getNewsByMlbId: (mlbId: number) => api.get(`/api/players/mlb/${mlbId}/news`),
};

export const statsAPI = {
  liveScoreboard: () => api.get('/api/stats/scoreboard/today'),
};

export const sportsAPI = {
  list: () => api.get('/api/sports'),
  snapshot: (sport: 'NFL' | 'NBA' | 'NHL') => api.get(`/api/sports/${sport}/snapshot`),
};