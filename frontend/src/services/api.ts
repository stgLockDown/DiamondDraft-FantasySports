import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('dd_refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('dd_token', data.token);
          localStorage.setItem('dd_refresh_token', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('dd_token');
          localStorage.removeItem('dd_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; username: string; password: string; displayName: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { login: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) =>
    api.patch('/api/auth/profile', data),
};

// ─── LEAGUES ────────────────────────────────────────────────
export const leagueAPI = {
  getMyLeagues: () => api.get('/api/leagues'),
  getPublicLeagues: (page = 1) => api.get(`/api/leagues/public?page=${page}`),
  findByCode: (code: string) => api.get(`/api/leagues/find-by-code?code=${encodeURIComponent(code)}`),
  getLeague: (id: string) => api.get(`/api/leagues/${id}`),
  createLeague: (data: any) => api.post('/api/leagues', data),
  updateLeague: (id: string, data: any) => api.patch(`/api/leagues/${id}`, data),
  joinLeague: (id: string, data: { teamName?: string; inviteCode?: string }) =>
    api.post(`/api/leagues/${id}/join`, data),
  leaveLeague: (id: string) => api.delete(`/api/leagues/${id}/leave`),
  deleteLeague: (id: string) => api.delete(`/api/leagues/${id}`),
  getStandings: (id: string) => api.get(`/api/leagues/${id}/standings`),
  getTransactions: (id: string, page = 1) => api.get(`/api/leagues/${id}/transactions?page=${page}`),
  getFreeAgents: (leagueId: string, params: any) =>
    api.get(`/api/leagues/${leagueId}/free-agents`, { params }),
};

// ─── TEAMS ──────────────────────────────────────────────────
export const teamAPI = {
  getTeam: (id: string) => api.get(`/api/teams/${id}`),
  updateTeam: (id: string, data: any) => api.patch(`/api/teams/${id}`, data),
  setLineup: (id: string, moves: any[]) => api.post(`/api/teams/${id}/lineup`, { moves }),
  addPlayer: (id: string, data: any) => api.post(`/api/teams/${id}/add`, data),
  dropPlayer: (id: string, playerId: string) => api.post(`/api/teams/${id}/drop`, { playerId }),
  submitWaiver: (id: string, data: any) => api.post(`/api/teams/${id}/waiver`, data),
};

// ─── PLAYERS ────────────────────────────────────────────────
export const playerAPI = {
  search: (params: any) => api.get('/api/players', { params }),
  getPlayer: (id: string) => api.get(`/api/players/${id}`),
  getStats: (id: string, params?: any) => api.get(`/api/players/${id}/stats`, { params }),
  getNews: (id: string) => api.get(`/api/players/${id}/news`),
  getTopPerformers: (params?: any) => api.get('/api/players/top/performers', { params }),
  // ValorOdds-enriched feeds (by MLB id, the ID the Stats Hub uses)
  getNewsByMlbId: (mlbId: number) => api.get(`/api/players/mlb/${mlbId}/news`),
  getInjuryByMlbId: (mlbId: number) => api.get(`/api/players/mlb/${mlbId}/injury-status`),
};

// ─── SSO (ValorOdds handoff) ──────────────────────────────────────────
export const ssoAPI = {
  valorOdds: (token: string) => api.post('/api/auth/sso/valorodds', { token }),
  entitlement: () => api.get('/api/me/entitlement'),
};

// ─── TRADES ─────────────────────────────────────────────────
export const tradeAPI = {
  propose: (leagueId: string, data: any) => api.post(`/api/leagues/${leagueId}/trades`, data),
  getLeagueTrades: (leagueId: string, status?: string) =>
    api.get(`/api/leagues/${leagueId}/trades`, { params: { status } }),
  respond: (id: string, action: 'accept' | 'reject') =>
    api.post(`/api/trades/${id}/respond`, { action }),
  vote: (id: string, isVeto: boolean) => api.post(`/api/trades/${id}/vote`, { isVeto }),
  cancel: (id: string) => api.post(`/api/trades/${id}/cancel`),
};

// ─── DRAFT ──────────────────────────────────────────────────
export const draftAPI = {
  createDraft: (leagueId: string) => api.post(`/api/leagues/${leagueId}/draft`),
  getDraft: (leagueId: string) => api.get(`/api/leagues/${leagueId}/draft`),
  startDraft: (draftId: string) => api.post(`/api/drafts/${draftId}/start`),
  makePick: (draftId: string, playerId: string) =>
    api.post(`/api/drafts/${draftId}/pick`, { playerId }),
  autoPick: (draftId: string) => api.post(`/api/drafts/${draftId}/auto-pick`),
  pauseDraft: (draftId: string) => api.post(`/api/drafts/${draftId}/pause`),
};

// ─── CHAT ───────────────────────────────────────────────────
export const chatAPI = {
  getMessages: (leagueId: string, before?: string) =>
    api.get(`/api/leagues/${leagueId}/chat`, { params: { before } }),
  sendMessage: (leagueId: string, content: string, type = 'TEXT') =>
    api.post(`/api/leagues/${leagueId}/chat`, { content, type }),
  addReaction: (messageId: string, emoji: string) =>
    api.post(`/api/chat/${messageId}/react`, { emoji }),
  deleteMessage: (messageId: string) => api.delete(`/api/chat/${messageId}`),
};

// ─── NOTIFICATIONS ──────────────────────────────────────────
export const notificationAPI = {
  getAll: (unreadOnly = false) =>
    api.get('/api/notifications', { params: { unreadOnly } }),
  markRead: (ids?: string[]) => api.post('/api/notifications/read', { ids }),
};

// ─── MISC ───────────────────────────────────────────────────
export const miscAPI = {
  health: () => api.get('/api/health'),
  scoringPresets: () => api.get('/api/scoring-presets'),
  mlbTeams: () => api.get('/api/mlb-teams'),
};

// ─── STATS HUB ──────────────────────────────────────────────────
export const statsHubAPI = {
  // Scoreboard
  scoreboard: (date?: string) =>
    api.get('/api/stats/scoreboard', { params: { date } }),
  scoreboardWeek: (startDate?: string) =>
    api.get('/api/stats/scoreboard/week', { params: { startDate } }),

  // Game detail
  gameDetail: (gamePk: number) =>
    api.get(`/api/stats/game/${gamePk}`),

  // Player profiles
  playerProfile: (mlbId: number, season?: number) =>
    api.get(`/api/stats/player/${mlbId}`, { params: { season } }),
  playerSplits: (mlbId: number, season?: number) =>
    api.get(`/api/stats/player/${mlbId}/splits`, { params: { season } }),
  playerGamelog: (mlbId: number, season?: number) =>
    api.get(`/api/stats/player/${mlbId}/gamelog`, { params: { season } }),
  playerCompare: (ids: number[], season?: number) =>
    api.get('/api/stats/player/compare', { params: { ids: ids.join(','), season } }),

  // Leaderboards
  leaders: (season?: number, limit?: number) =>
    api.get('/api/stats/leaders', { params: { season, limit } }),
  leaderCategory: (category: string, season?: number, limit?: number) =>
    api.get(`/api/stats/leaders/${category}`, { params: { season, limit } }),
  trending: (season?: number) =>
    api.get('/api/stats/trending', { params: { season } }),

  // Teams
  teams: (season?: number) =>
    api.get('/api/stats/teams', { params: { season } }),
  teamDetail: (teamId: string | number, season?: number) =>
    api.get(`/api/stats/teams/${teamId}`, { params: { season } }),

  // Standings
  standings: (season?: number) =>
    api.get('/api/stats/standings', { params: { season } }),

  // Schedule
  schedule: (startDate: string, endDate?: string, teamId?: string) =>
    api.get('/api/stats/schedule', { params: { startDate, endDate, teamId } }),

  // All players (for drafts)
  allPlayers: (season?: number, activeOnly?: boolean) =>
    api.get('/api/stats/players/all', { params: { season, activeOnly } }),

  // Search
  search: (q: string, position?: string, team?: string) =>
    api.get('/api/stats/search', { params: { q, position, team } }),
};

export default api;
