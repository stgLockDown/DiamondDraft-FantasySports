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
  // AL=103, NL=104 — hydrate division & league to get names
  return fetchJSON(`${MLB_API_BASE}/standings?leagueId=103,104&season=${season}&hydrate=division,league`);
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

export const MLB_TEAM_MAP_REVERSE: Record<string, number> = Object.fromEntries(
  Object.entries(MLB_TEAM_MAP).map(([id, abbr]) => [abbr, parseInt(id)])
);

// ─── PLAYER DETAILED PROFILE ──────────────────────────────────

export async function getPlayerFullProfile(playerId: number, season: number = new Date().getFullYear()): Promise<any> {
  const [info, hitting, pitching, gameLogHitting, gameLogPitching] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/people/${playerId}`),
    fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=season,career&season=${season}&group=hitting`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=season,career&season=${season}&group=pitching`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=gameLog&season=${season}&group=hitting`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=gameLog&season=${season}&group=pitching`).catch(() => null),
  ]);

  const person = info.people[0];

  // Parse season and career stats
  const hittingStats: any = {};
  if (hitting?.stats) {
    for (const sg of hitting.stats) {
      if (sg.type.displayName === 'season' && sg.splits?.length) hittingStats.season = sg.splits[0].stat;
      if (sg.type.displayName === 'career' && sg.splits?.length) hittingStats.career = sg.splits[0].stat;
    }
  }

  const pitchingStats: any = {};
  if (pitching?.stats) {
    for (const sg of pitching.stats) {
      if (sg.type.displayName === 'season' && sg.splits?.length) pitchingStats.season = sg.splits[0].stat;
      if (sg.type.displayName === 'career' && sg.splits?.length) pitchingStats.career = sg.splits[0].stat;
    }
  }

  // Parse game logs (last 15 games)
  const recentHittingGames = gameLogHitting?.stats?.[0]?.splits?.slice(-15).reverse() || [];
  const recentPitchingGames = gameLogPitching?.stats?.[0]?.splits?.slice(-15).reverse() || [];

  return {
    id: person.id,
    fullName: person.fullName,
    firstName: person.firstName,
    lastName: person.lastName,
    primaryNumber: person.primaryNumber,
    birthDate: person.birthDate,
    currentAge: person.currentAge,
    height: person.height,
    weight: person.weight,
    active: person.active,
    primaryPosition: person.primaryPosition,
    batSide: person.batSide,
    pitchHand: person.pitchHand,
    currentTeam: person.currentTeam,
    mlbDebutDate: person.mlbDebutDate,
    nickName: person.nickName,
    birthCity: person.birthCity,
    birthStateProvince: person.birthStateProvince,
    birthCountry: person.birthCountry,
    headshotUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${person.id}/headshot/67/current`,
    hitting: hittingStats,
    pitching: pitchingStats,
    recentGames: {
      hitting: recentHittingGames.map((g: any) => ({
        date: g.date,
        opponent: g.opponent?.abbreviation || g.opponent?.name,
        isHome: g.isHome,
        stat: g.stat,
      })),
      pitching: recentPitchingGames.map((g: any) => ({
        date: g.date,
        opponent: g.opponent?.abbreviation || g.opponent?.name,
        isHome: g.isHome,
        stat: g.stat,
      })),
    },
  };
}

// ─── PLAYER SPLITS (vs L/R, home/away, monthly) ──────────────

export async function getPlayerSplits(playerId: number, season: number = new Date().getFullYear()): Promise<any> {
  const [vsPlatoon, homeAway] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=vsPlatoon&season=${season}&group=hitting`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/people/${playerId}/stats?stats=homeAndAway&season=${season}&group=hitting`).catch(() => null),
  ]);

  return {
    vsPlatoon: vsPlatoon?.stats?.[0]?.splits || [],
    homeAway: homeAway?.stats?.[0]?.splits || [],
  };
}

// ─── TEAM ROSTER WITH STATS ───────────────────────────────────

export async function getTeamRosterWithStats(teamId: number, season: number = new Date().getFullYear()): Promise<any> {
  const [teamInfo, roster] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}?season=${season}`),
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}/roster?rosterType=active&season=${season}`),
  ]);

  return {
    team: teamInfo.teams?.[0],
    roster: roster.roster?.map((r: any) => ({
      person: r.person,
      jerseyNumber: r.jerseyNumber,
      position: r.position,
      status: r.status,
    })) || [],
  };
}

// ─── TEAM STATS ───────────────────────────────────────────────

export async function getTeamSeasonStats(teamId: number, season: number = new Date().getFullYear()): Promise<any> {
  const [hitting, pitching, fielding] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}/stats?season=${season}&group=hitting&stats=season`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}/stats?season=${season}&group=pitching&stats=season`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}/stats?season=${season}&group=fielding&stats=season`).catch(() => null),
  ]);

  return {
    hitting: hitting?.stats?.[0]?.splits?.[0]?.stat || null,
    pitching: pitching?.stats?.[0]?.splits?.[0]?.stat || null,
    fielding: fielding?.stats?.[0]?.splits?.[0]?.stat || null,
  };
}

// ─── SCHEDULE WITH SCORES ─────────────────────────────────────

export async function getScheduleRange(startDate: string, endDate: string): Promise<any> {
  const data = await fetchJSON(
    `${MLB_API_BASE}/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=linescore,team`
  );

  // Return dates array structure so frontend can group by date
  const dates = (data.dates || []).map((dateEntry: any) => ({
    date: dateEntry.date,
    totalGames: dateEntry.totalGames || dateEntry.games?.length || 0,
    games: (dateEntry.games || []).map((g: any) => ({
      gamePk: g.gamePk,
      gameDate: g.gameDate,
      officialDate: g.officialDate || dateEntry.date,
      status: g.status || {},
      teams: {
        away: {
          team: {
            id: g.teams.away.team.id,
            name: g.teams.away.team.name,
            abbreviation: g.teams.away.team.abbreviation || g.teams.away.team.teamName,
          },
          score: g.teams.away.score ?? null,
          leagueRecord: g.teams.away.leagueRecord,
        },
        home: {
          team: {
            id: g.teams.home.team.id,
            name: g.teams.home.team.name,
            abbreviation: g.teams.home.team.abbreviation || g.teams.home.team.teamName,
          },
          score: g.teams.home.score ?? null,
          leagueRecord: g.teams.home.leagueRecord,
        },
      },
      linescore: g.linescore ? {
        currentInning: g.linescore.currentInning,
        currentInningOrdinal: g.linescore.currentInningOrdinal,
        inningHalf: g.linescore.inningHalf,
        innings: g.linescore.innings,
      } : null,
      venue: g.venue?.name,
    })),
  }));

  return { dates };
}

// ─── GAME DETAIL (full boxscore + linescore) ──────────────────

export async function getGameDetail(gamePk: number): Promise<any> {
  const [feed, boxscore, linescore] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/game/${gamePk}/feed/live`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/game/${gamePk}/boxscore`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/game/${gamePk}/linescore`).catch(() => null),
  ]);

  // Extract key batting/pitching lines from boxscore
  const extractPlayerStats = (teamPlayers: any) => {
    if (!teamPlayers) return [];
    return Object.values(teamPlayers).map((p: any) => ({
      id: p.person?.id,
      name: p.person?.fullName,
      position: p.position?.abbreviation,
      battingOrder: p.battingOrder,
      batting: p.stats?.batting || null,
      pitching: p.stats?.pitching || null,
    })).filter((p: any) => p.batting || p.pitching);
  };

  return {
    gamePk,
    gameData: feed?.gameData ? {
      status: feed.gameData.status,
      datetime: feed.gameData.datetime,
      teams: {
        away: { id: feed.gameData.teams.away.id, name: feed.gameData.teams.away.name, abbreviation: feed.gameData.teams.away.abbreviation },
        home: { id: feed.gameData.teams.home.id, name: feed.gameData.teams.home.name, abbreviation: feed.gameData.teams.home.abbreviation },
      },
      venue: feed.gameData.venue?.name,
      weather: feed.gameData.weather,
    } : null,
    linescore: linescore ? {
      currentInning: linescore.currentInning,
      inningHalf: linescore.inningHalf,
      innings: linescore.innings,
      teams: linescore.teams,
    } : null,
    boxscore: boxscore ? {
      away: {
        teamStats: boxscore.teams?.away?.teamStats,
        players: extractPlayerStats(boxscore.teams?.away?.players),
        battingOrder: boxscore.teams?.away?.battingOrder,
        pitchers: boxscore.teams?.away?.pitchers,
      },
      home: {
        teamStats: boxscore.teams?.home?.teamStats,
        players: extractPlayerStats(boxscore.teams?.home?.players),
        battingOrder: boxscore.teams?.home?.battingOrder,
        pitchers: boxscore.teams?.home?.pitchers,
      },
    } : null,
    scoringPlays: feed?.liveData?.plays?.scoringPlays?.map((idx: number) => {
      const play = feed.liveData.plays.allPlays[idx];
      return {
        inning: play?.about?.inning,
        halfInning: play?.about?.halfInning,
        description: play?.result?.description,
        awayScore: play?.result?.awayScore,
        homeScore: play?.result?.homeScore,
      };
    }) || [],
  };
}

// ─── HOT/COLD PLAYERS (trending) ──────────────────────────────

export async function getHotColdPlayers(season: number = new Date().getFullYear()): Promise<any> {
  // Get leaders in last 7 days and last 30 days
  const [hr7, avg7, rbi7, k7, era7] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/stats/leaders?leaderCategories=homeRuns&season=${season}&sportId=1&limit=10&statType=statsSingleSeason`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/stats/leaders?leaderCategories=battingAverage&season=${season}&sportId=1&limit=10&statType=statsSingleSeason`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/stats/leaders?leaderCategories=runsBattedIn&season=${season}&sportId=1&limit=10&statType=statsSingleSeason`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/stats/leaders?leaderCategories=strikeouts&season=${season}&sportId=1&limit=10&statType=statsSingleSeason`).catch(() => null),
    fetchJSON(`${MLB_API_BASE}/stats/leaders?leaderCategories=earnedRunAverage&season=${season}&sportId=1&limit=10&statType=statsSingleSeason`).catch(() => null),
  ]);

  return {
    homeRuns: hr7?.leagueLeaders?.[0]?.leaders || [],
    battingAverage: avg7?.leagueLeaders?.[0]?.leaders || [],
    rbi: rbi7?.leagueLeaders?.[0]?.leaders || [],
    strikeouts: k7?.leagueLeaders?.[0]?.leaders || [],
    era: era7?.leagueLeaders?.[0]?.leaders || [],
  };
}

// ─── MULTIPLE STAT LEADER CATEGORIES ──────────────────────────

export async function getMultipleLeaders(
  categories: string[],
  season: number = new Date().getFullYear(),
  limit: number = 10
): Promise<Record<string, any[]>> {
  const results: Record<string, any[]> = {};
  
  // Fetch in parallel batches of 5
  for (let i = 0; i < categories.length; i += 5) {
    const batch = categories.slice(i, i + 5);
    const promises = batch.map(cat =>
      fetchJSON(`${MLB_API_BASE}/stats/leaders?leaderCategories=${cat}&season=${season}&sportId=1&limit=${limit}`)
        .then(data => ({ cat, leaders: data.leagueLeaders?.[0]?.leaders || [] }))
        .catch(() => ({ cat, leaders: [] }))
    );
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      results[r.cat] = r.leaders;
    }
  }

  return results;
}