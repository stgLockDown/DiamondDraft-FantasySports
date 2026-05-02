/**
 * Multi-sport data adapter.
 *
 * Wraps ESPN's public JSON endpoints for NFL / NBA / NHL using the same
 * shape we already use for MLB. All methods are best-effort: on network
 * failure or parse error they return empty arrays rather than throwing,
 * because the Stats Hub / Live Scores UIs should degrade gracefully.
 *
 * NOTE: this file intentionally does NOT depend on prisma. It's a thin
 * fetch layer. The seed script and sync workers call it, massage the
 * results, and write rows.
 */

import type { Sport } from '@prisma/client';

const ESPN_BASE: Record<Exclude<Sport, 'MLB'>, string> = {
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
  NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl',
};

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ─── Scoreboard ──────────────────────────────────────────────────────
export interface SportGame {
  externalId: string;
  sport: Sport;
  startsAt: string; // ISO
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'unknown';
  home: { abbr: string; name: string; score: number | null };
  away: { abbr: string; name: string; score: number | null };
  period?: number;
  clock?: string;
}

function normalizeStatus(espn: string | undefined): SportGame['status'] {
  const v = String(espn || '').toLowerCase();
  if (v.includes('final')) return 'final';
  if (v.includes('progress') || v.includes('in ')) return 'in_progress';
  if (v.includes('postponed') || v.includes('cancel')) return 'postponed';
  if (v.includes('scheduled') || v.includes('pre')) return 'scheduled';
  return 'unknown';
}

export async function fetchSportScoreboard(sport: Exclude<Sport, 'MLB'>): Promise<SportGame[]> {
  try {
    const data = await fetchJson(`${ESPN_BASE[sport]}/scoreboard`);
    const events: any[] = data?.events || [];
    return events.map((ev) => {
      const comp = ev.competitions?.[0] || {};
      const competitors: any[] = comp.competitors || [];
      const home = competitors.find((c) => c.homeAway === 'home') || competitors[0] || {};
      const away = competitors.find((c) => c.homeAway === 'away') || competitors[1] || {};
      const teamOf = (c: any) => ({
        abbr: c?.team?.abbreviation || '',
        name: c?.team?.displayName || c?.team?.name || '',
        score: c?.score != null ? Number(c.score) : null,
      });
      return {
        externalId: String(ev.id || comp.id || ''),
        sport,
        startsAt: ev.date || comp.date || new Date().toISOString(),
        status: normalizeStatus(comp.status?.type?.name || ev.status?.type?.name),
        home: teamOf(home),
        away: teamOf(away),
        period: comp.status?.period,
        clock: comp.status?.displayClock,
      } satisfies SportGame;
    });
  } catch {
    return [];
  }
}

// ─── Teams ───────────────────────────────────────────────────────────
export interface SportTeam {
  sport: Sport;
  externalId: string;
  abbr: string;
  name: string;
  location: string;
  conference?: string;
  division?: string;
}

export async function fetchSportTeams(sport: Exclude<Sport, 'MLB'>): Promise<SportTeam[]> {
  try {
    const data = await fetchJson(`${ESPN_BASE[sport]}/teams`);
    const teams: any[] = data?.sports?.[0]?.leagues?.[0]?.teams || [];
    return teams.map((t) => {
      const tm = t.team || {};
      return {
        sport,
        externalId: String(tm.id),
        abbr: tm.abbreviation || '',
        name: tm.displayName || tm.name || '',
        location: tm.location || '',
      } satisfies SportTeam;
    });
  } catch {
    return [];
  }
}

// ─── Roster (per team) ───────────────────────────────────────────────
export interface SportPlayer {
  sport: Sport;
  externalId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  team: string;
  teamFullName: string;
  position: string;
  eligiblePositions: string[];
  age?: number;
  headshotUrl?: string;
}

export async function fetchSportRoster(
  sport: Exclude<Sport, 'MLB'>,
  teamId: string,
): Promise<SportPlayer[]> {
  try {
    const data = await fetchJson(`${ESPN_BASE[sport]}/teams/${teamId}/roster`);
    const athletes: any[] = Array.isArray(data?.athletes)
      ? data.athletes.flatMap((g: any) => g.items || [g]) // NFL uses grouped athletes
      : [];
    const teamAbbr = data?.team?.abbreviation || '';
    const teamName = data?.team?.displayName || data?.team?.name || '';
    return athletes.map((a) => {
      const pos =
        a.position?.abbreviation || a.position?.name || (sport === 'NHL' ? 'SKATER' : 'UNKNOWN');
      return {
        sport,
        externalId: String(a.id),
        firstName: a.firstName || (a.displayName || '').split(' ')[0] || '',
        lastName: a.lastName || (a.displayName || '').split(' ').slice(1).join(' ') || '',
        fullName: a.fullName || a.displayName || '',
        team: teamAbbr,
        teamFullName: teamName,
        position: String(pos).toUpperCase(),
        eligiblePositions: [String(pos).toUpperCase()],
        age: a.age != null ? Number(a.age) : undefined,
        headshotUrl: a.headshot?.href || undefined,
      } satisfies SportPlayer;
    });
  } catch {
    return [];
  }
}

// ─── News / injuries ─────────────────────────────────────────────────
export interface SportNewsItem {
  sport: Sport;
  title: string;
  body: string;
  publishedAt: string;
  url?: string;
}

export async function fetchSportNews(sport: Exclude<Sport, 'MLB'>): Promise<SportNewsItem[]> {
  try {
    const data = await fetchJson(`${ESPN_BASE[sport]}/news`);
    const articles: any[] = data?.articles || [];
    return articles.slice(0, 50).map((a) => ({
      sport,
      title: a.headline || a.title || 'Update',
      body: a.description || a.story || '',
      publishedAt: a.published || new Date().toISOString(),
      url: a.links?.web?.href || undefined,
    }));
  } catch {
    return [];
  }
}

// ─── Convenience: everything in one call for a sport ─────────────────
export async function fetchSportSnapshot(sport: Exclude<Sport, 'MLB'>) {
  const [scoreboard, teams, news] = await Promise.all([
    fetchSportScoreboard(sport),
    fetchSportTeams(sport),
    fetchSportNews(sport),
  ]);
  return { sport, scoreboard, teams, news };
}