/**
 * MLB Stats API Service
 * Fetches live data from statsapi.mlb.com (free, no auth required)
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
  teamName: string;
  league: { id: number; name: string };
  division: { id: number; name: string };
}

interface MLBPlayer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryNumber?: string;
  birthDate: string;
  currentAge: number;
  height: string;
  weight: number;
  active: boolean;
  primaryPosition: { code: string; name: string; abbreviation: string };
  batSide: { code: string; description: string };
  pitchHand: { code: string; description: string };
  currentTeam?: { id: number; name: string };
  mlbDebutDate?: string;
}

interface MLBHittingStats {
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  baseOnBalls: number;
  strikeOuts: number;
  stolenBases: number;
  caughtStealing: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
  plateAppearances: number;
  totalBases: number;
  hitByPitch: number;
  sacFlies: number;
  sacBunts: number;
  groundIntoDoublePlay: number;
  intentionalWalks: number;
  babip: string;
}

interface MLBPitchingStats {
  gamesPlayed: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  era: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  baseOnBalls: number;
  strikeOuts: number;
  whip: string;
  saves: number;
  blownSaves: number;
  holds: number;
  completeGames: number;
  shutouts: number;
  hitBatsmen: number;
  wildPitches: number;
  balks: number;
  strikeoutWalkRatio: string;
  strikeoutsPer9Inn: string;
  walksPer9Inn: string;
  hitsPer9Inn: string;
  battersFaced: number;
  gamesPitched: number;
  gamesFinished: number;
  saveOpportunities: number;
  pickoffs: number;
}

interface MLBGameScore {
  gamePk: number;
  gameDate: string;
  status: string;
  detailedState: string;
  awayTeam: { id: number; name: string; score: number };
  homeTeam: { id: number; name: string; score: number };
  currentInning?: number;
  inningHalf?: string;
  isTopInning?: boolean;
}

async function fetchJSON(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

// ─── TEAMS ────────────────────────────────────────────────────

export async function getAllMLBTeams(season: number = new Date().getFullYear()): Promise<MLBTeam[]> {
  const data = await fetchJSON(`${MLB_API_BASE}/teams?sportId=1&season=${season}`);
  return data.teams.map((t: any) => ({
    id: t.id,
    name: t.name,
    abbreviation: t.abbreviation,
    teamName: t.teamName,
    league: { id: t.league?.id, name: t.league?.name },
    division: { id: t.division?.id, name: t.division?.name },
  }));
}

export async function getTeamRoster(teamId: number, season: number = new Date().getFullYear()): Promise<any[]> {
  const data = await fetchJSON(`${MLB_API_BASE}/teams/${teamId}/roster?season=${season}`);
  return data.roster || [];
}

// ─── PLAYERS ──────────────────────────────────────────────────

export async function getAllMLBPlayers(season: number = new Date().getFullYear()): Promise<MLBPlayer[]> {
  const data = await fetchJSON(`${MLB_API_BASE}/sports/1/players?season=${season}`);
  return data.people.map((p: any) => ({
    id: p.id,
    fullName: p.fullName,
    firstName: p.firstName,
    lastName: p.lastName,
    primaryNumber: p.primaryNumber,
    birthDate: p.birthDate,
    currentAge: p.currentAge,
    height: p.height,
    weight: p.weight,
    active: p.active,
    primaryPosition: {
      code: p.primaryPosition?.code,
      name: p.primaryPosition?.name,
      abbreviation: p.primaryPosition?.abbreviation,
    },
    batSide: { code: p.batSide?.code, description: p.batSide?.description },
    pitchHand: { code: p.pitchHand?.code, description: p.pitchHand?.description },
    currentTeam: p.currentTeam ? { id: p.currentTeam.id, name: p.currentTeam.name } : undefined,
    mlbDebutDate: p.mlbDebutDate,
  }));
}

export async function getPlayerInfo(playerId: number): Promise<MLBPlayer> {
  const data = await fetchJSON(`${MLB_API_BASE}/people/${playerId}`);
  const p = data.people[0];
  return {
    id: p.id,
    fullName: p.fullName,
    firstName: p.firstName,
    lastName: p.lastName,
    primaryNumber: p.primaryNumber,
    birthDate: p.birthDate,
    currentAge: p.currentAge,
    height: p.height,
    weight: p.weight,
    active: p.active,
    primaryPosition: {
      code: p.primaryPosition?.code,
      name: p.primaryPosition?.name,
      abbreviation: p.primaryPosition?.abbreviation,
    },
    batSide: { code: p.batSide?.code, description: p.batSide?.description },
    pitchHand: { code: p.pitchHand?.code, description: p.pitchHand?.description },
    currentTeam: p.currentTeam ? { id: p.currentTeam.id, name: p.currentTeam.name } : undefined,
    mlbDebutDate: p.mlbDebutDate,
  };
}

// ─── PLAYER STATS ─────────────────────────────────────────────

export async function getPlayerHittingStats(playerId: number, season: number = new Date().getFullYear()): Promise<MLBHittingStats | null> {
  try {
    const data = await fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=season&season=${season}&group=hitting`);
    const splits = data.stats?.[0]?.splits;
    if (!splits || splits.length === 0) return null;
    return splits[0].stat as MLBHittingStats;
  } catch {
    return null;
  }
}

export async function getPlayerPitchingStats(playerId: number, season: number = new Date().getFullYear()): Promise<MLBPitchingStats | null> {
  try {
    const data = await fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=season&season=${season}&group=pitching`);
    const splits = data.stats?.[0]?.splits;
    if (!splits || splits.length === 0) return null;
    return splits[0].stat as MLBPitchingStats;
  } catch {
    return null;
  }
}

export async function getPlayerGameLog(playerId: number, season: number, group: 'hitting' | 'pitching' = 'hitting'): Promise<any[]> {
  try {
    const data = await fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=gameLog&season=${season}&group=${group}`);
    const splits = data.stats?.[0]?.splits;
    return splits || [];
  } catch {
    return [];
  }
}

// ─── SCHEDULE & LIVE GAMES ────────────────────────────────────

export async function getTodaysGames(): Promise<MLBGameScore[]> {
  const today = new Date().toISOString().split('T')[0];
  return getGamesByDate(today);
}

export async function getGamesByDate(date: string): Promise<MLBGameScore[]> {
  const data = await fetchJSON(`${MLB_API_BASE}/schedule?sportId=1&date=${date}&hydrate=linescore`);
  if (!data.dates || data.dates.length === 0) return [];

  return data.dates[0].games.map((g: any) => ({
    gamePk: g.gamePk,
    gameDate: g.gameDate,
    status: g.status.abstractGameState,
    detailedState: g.status.detailedState,
    awayTeam: {
      id: g.teams.away.team.id,
      name: g.teams.away.team.name,
      score: g.teams.away.score || 0,
    },
    homeTeam: {
      id: g.teams.home.team.id,
      name: g.teams.home.team.name,
      score: g.teams.home.score || 0,
    },
    currentInning: g.linescore?.currentInning,
    inningHalf: g.linescore?.inningHalf,
    isTopInning: g.linescore?.isTopInning,
  }));
}

export async function getLiveGameFeed(gamePk: number): Promise<any> {
  return fetchJSON(`${MLB_API_BASE}/game/${gamePk}/feed/live`);
}

export async function getGameBoxscore(gamePk: number): Promise<any> {
  return fetchJSON(`${MLB_API_BASE}/game/${gamePk}/boxscore`);
}

// ─── STANDINGS ────────────────────────────────────────────────

export async function getStandings(season: number = new Date().getFullYear()): Promise<any> {
  // AL=103, NL=104
  return fetchJSON(`${MLB_API_BASE}/standings?leagueId=103,104&season=${season}`);
}

// ─── STAT LEADERS ─────────────────────────────────────────────

export async function getStatLeaders(
  category: string,
  season: number = new Date().getFullYear(),
  limit: number = 20
): Promise<any[]> {
  const data = await fetchJSON(
    `${MLB_API_BASE}/stats/leaders?leaderCategories=${category}&season=${season}&sportId=1&limit=${limit}`
  );
  return data.leagueLeaders?.[0]?.leaders || [];
}

// ─── BULK STATS (for syncing all players) ─────────────────────

export async function getSeasonStats(
  group: 'hitting' | 'pitching',
  season: number = new Date().getFullYear(),
  limit: number = 500
): Promise<any[]> {
  const sortStat = group === 'hitting' ? 'plateAppearances' : 'inningsPitched';
  const data = await fetchJSON(
    `${MLB_API_BASE}/stats?stats=season&group=${group}&season=${season}&sportIds=1&limit=${limit}&offset=0&sortStat=${sortStat}&order=desc`
  );
  return data.stats?.[0]?.splits || [];
}

// ─── HELPER: Map MLB position to our system ───────────────────

export function mapMLBPosition(posAbbr: string): string[] {
  const posMap: Record<string, string[]> = {
    'C': ['C'],
    '1B': ['1B'],
    '2B': ['2B'],
    '3B': ['3B'],
    'SS': ['SS'],
    'LF': ['LF', 'OF'],
    'CF': ['CF', 'OF'],
    'RF': ['RF', 'OF'],
    'OF': ['OF', 'LF', 'CF', 'RF'],
    'DH': ['DH', 'UTIL'],
    'SP': ['SP', 'P'],
    'RP': ['RP', 'P'],
    'P': ['P', 'SP', 'RP'],
    'TWP': ['SP', 'DH', 'UTIL'],
  };
  return posMap[posAbbr] || ['UTIL'];
}

// ─── HELPER: Map MLB team ID to abbreviation ─────────────────

export const MLB_TEAM_MAP: Record<number, string> = {
  108: 'LAA', 109: 'ARI', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET', 117: 'HOU',
  118: 'KC', 119: 'LAD', 120: 'WSH', 121: 'NYM', 133: 'OAK',
  134: 'PIT', 135: 'SD', 136: 'SEA', 137: 'SF', 138: 'STL',
  139: 'TB', 140: 'TEX', 141: 'TOR', 142: 'MIN', 143: 'PHI',
  144: 'ATL', 145: 'CHW', 146: 'MIA', 147: 'NYY', 158: 'MIL',
};