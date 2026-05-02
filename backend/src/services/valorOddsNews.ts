/**
 * ValorOdds news / injury feed proxy.
 *
 * Pulls injury and analyst content from the ValorOdds API and massages it
 * into a shape the DiamondDraft frontend can render directly.
 *
 * All methods here are best-effort: if VALORODDS_API_URL is unset, the
 * network call fails, or the response shape is unexpected, we return an
 * empty result rather than bubbling an error up to the UI.
 */

import { config } from '../config';

interface PlayerRef {
  mlbId: number | null;
  fullName: string;
  team: string | null;
  position: string | null;
}

export interface ValorOddsNewsItem {
  title: string;
  body: string;
  source: string;
  publishedAt: string; // ISO
  severity?: 'info' | 'watch' | 'warning' | 'out';
  url?: string;
}

export interface ValorOddsInjuryStatus {
  status: string; // e.g. "Day-to-day", "10-Day IL", "Out", "Questionable"
  description: string;
  reportedAt: string; // ISO
  expectedReturn?: string;
}

function baseUrl(): string | null {
  const u = config.valorOdds.apiUrl;
  if (!u) return null;
  return u.replace(/\/$/, '');
}

async function fetchJson(url: string, timeoutMs = 4000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeSeverity(s?: string): ValorOddsNewsItem['severity'] {
  if (!s) return 'info';
  const v = String(s).toLowerCase();
  if (v.includes('out') || v.includes('il') || v.includes('injured list')) return 'out';
  if (v.includes('question') || v.includes('game-time')) return 'warning';
  if (v.includes('day-to-day') || v.includes('day to day')) return 'watch';
  return 'info';
}

/**
 * Fetch news items about a player from ValorOdds.
 * Falls back gracefully when the upstream is unreachable.
 */
export async function fetchValorOddsPlayerNews(player: PlayerRef): Promise<ValorOddsNewsItem[]> {
  const base = baseUrl();
  if (!base) return [];

  // Two lookup strategies: by MLB ID (preferred) and by name/team.
  const tries: string[] = [];
  if (player.mlbId) tries.push(`${base}/api/public/players/mlb/${player.mlbId}/news`);
  if (player.fullName) {
    const q = new URLSearchParams({
      name: player.fullName,
      ...(player.team ? { team: player.team } : {}),
    });
    tries.push(`${base}/api/public/players/search-news?${q.toString()}`);
  }

  for (const url of tries) {
    try {
      const data = await fetchJson(url);
      const items: any[] = Array.isArray(data) ? data : data.news || data.items || [];
      if (!items.length) continue;
      return items.slice(0, 20).map((n) => ({
        title: String(n.title || n.headline || 'Update'),
        body: String(n.body || n.summary || n.description || ''),
        source: String(n.source || 'ValorOdds'),
        publishedAt: new Date(n.publishedAt || n.date || Date.now()).toISOString(),
        severity: normalizeSeverity(n.severity || n.status),
        url: n.url || undefined,
      }));
    } catch {
      continue;
    }
  }
  return [];
}

/**
 * Fetch the current injury status for a player from ValorOdds.
 * Returns null when unavailable.
 */
export async function fetchValorOddsInjuryStatus(
  player: PlayerRef,
): Promise<ValorOddsInjuryStatus | null> {
  const base = baseUrl();
  if (!base) return null;

  const tries: string[] = [];
  if (player.mlbId) tries.push(`${base}/api/public/players/mlb/${player.mlbId}/injury`);
  if (player.fullName) {
    const q = new URLSearchParams({
      name: player.fullName,
      ...(player.team ? { team: player.team } : {}),
    });
    tries.push(`${base}/api/public/players/injury?${q.toString()}`);
  }

  for (const url of tries) {
    try {
      const data = await fetchJson(url);
      if (!data || !data.status) continue;
      return {
        status: String(data.status),
        description: String(data.description || data.note || ''),
        reportedAt: new Date(data.reportedAt || data.date || Date.now()).toISOString(),
        expectedReturn: data.expectedReturn || undefined,
      };
    } catch {
      continue;
    }
  }
  return null;
}