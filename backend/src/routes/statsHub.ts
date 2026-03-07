/**
 * Stats Hub Routes
 * Public endpoints for the Stats & Live Games section
 * Separate from fantasy — pure baseball intelligence
 */

import { FastifyInstance } from 'fastify';
import {
  getPlayerFullProfile,
  getPlayerSplits,
  getAllMLBTeams,
  getTeamRosterWithStats,
  getTeamSeasonStats,
  getScheduleRange,
  getGameDetail,
  getGamesByDate,
  getStandings,
  getMultipleLeaders,
  getHotColdPlayers,
  getStatLeaders,
  MLB_TEAM_MAP_REVERSE,
} from '../services/mlbApi';

export default async function statsHubRoutes(fastify: FastifyInstance) {

  // ═══════════════════════════════════════════════════════════
  // LIVE SCOREBOARD
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/scoreboard — Today's (or any date's) live scores
  fastify.get('/api/stats/scoreboard', async (request) => {
    const { date } = request.query as any;
    const gameDate = date || new Date().toISOString().split('T')[0];
    const games = await getGamesByDate(gameDate);
    return {
      date: gameDate,
      gamesCount: games.length,
      games,
      timestamp: new Date().toISOString(),
    };
  });

  // GET /api/stats/scoreboard/week — This week's games
  fastify.get('/api/stats/scoreboard/week', async (request) => {
    const { startDate } = request.query as any;
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = new Date(new Date(start).getTime() + 6 * 86400000).toISOString().split('T')[0];
    const games = await getScheduleRange(start, end);
    return { startDate: start, endDate: end, gamesCount: games.length, games };
  });

  // ═══════════════════════════════════════════════════════════
  // GAME DETAIL
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/game/:gamePk — Full game detail (boxscore, linescore, scoring plays)
  fastify.get('/api/stats/game/:gamePk', async (request) => {
    const { gamePk } = request.params as any;
    const detail = await getGameDetail(parseInt(gamePk));
    return detail;
  });

  // ═══════════════════════════════════════════════════════════
  // PLAYER PROFILES
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/player/:mlbId — Full player profile with season/career stats + game log
  fastify.get('/api/stats/player/:mlbId', async (request) => {
    const { mlbId } = request.params as any;
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const profile = await getPlayerFullProfile(parseInt(mlbId), yr);

    // Also get our internal fantasy data if available
    const dbPlayer = await fastify.prisma.player.findUnique({
      where: { mlbId: parseInt(mlbId) },
      include: {
        playerStats: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    return {
      ...profile,
      fantasy: dbPlayer ? {
        projectedPoints: dbPlayer.projectedPoints,
        rosPercentage: dbPlayer.rosPercentage,
        recentFantasyPoints: dbPlayer.playerStats.map(s => ({
          date: s.date,
          gameId: s.gameId,
          points: s.fantasyPoints,
          hitting: { ab: s.ab, h: s.hits, hr: s.hr, rbi: s.rbi, r: s.runs, sb: s.sb, bb: s.bb, so: s.so },
          pitching: { ip: s.ip, so: s.pitcherSO, er: s.pitcherER, w: s.pitcherW, sv: s.pitcherSV, h: s.pitcherH, bb: s.pitcherBB },
        })),
      } : null,
    };
  });

  // GET /api/stats/player/:mlbId/splits — Player splits (vs L/R, home/away)
  fastify.get('/api/stats/player/:mlbId/splits', async (request) => {
    const { mlbId } = request.params as any;
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    return getPlayerSplits(parseInt(mlbId), yr);
  });

  // GET /api/stats/player/:mlbId/gamelog — Player game log
  fastify.get('/api/stats/player/:mlbId/gamelog', async (request) => {
    const { mlbId } = request.params as any;
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const profile = await getPlayerFullProfile(parseInt(mlbId), yr);
    return {
      player: { id: profile.id, fullName: profile.fullName, position: profile.primaryPosition },
      hitting: profile.recentGames.hitting,
      pitching: profile.recentGames.pitching,
    };
  });

  // GET /api/stats/player/compare — Compare 2-4 players side by side
  fastify.get('/api/stats/player/compare', async (request) => {
    const { ids, season } = request.query as any;
    if (!ids) return { error: 'Provide player MLB IDs as comma-separated list: ?ids=660271,592450' };

    const mlbIds = ids.split(',').map((id: string) => parseInt(id.trim())).slice(0, 4);
    const yr = season ? parseInt(season) : new Date().getFullYear();

    const profiles = await Promise.all(
      mlbIds.map((id: number) => getPlayerFullProfile(id, yr).catch(() => null))
    );

    return {
      season: yr,
      players: profiles.filter(Boolean).map((p: any) => ({
        id: p.id,
        fullName: p.fullName,
        position: p.primaryPosition?.abbreviation,
        team: p.currentTeam?.name,
        headshotUrl: p.headshotUrl,
        hitting: p.hitting,
        pitching: p.pitching,
      })),
    };
  });

  // ═══════════════════════════════════════════════════════════
  // LEADERBOARDS
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/leaders — Multiple stat leader categories at once
  fastify.get('/api/stats/leaders', async (request) => {
    const { season, limit } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const lim = limit ? parseInt(limit) : 10;

    const categories = [
      // Hitting
      'homeRuns', 'battingAverage', 'runsBattedIn', 'runs',
      'stolenBases', 'onBasePlusSlugging', 'hits', 'doubles',
      'onBasePercentage', 'sluggingPercentage', 'totalBases',
      // Pitching
      'earnedRunAverage', 'wins', 'strikeouts', 'saves',
      'walksAndHitsPerInningPitched', 'inningsPitched',
    ];

    const leaders = await getMultipleLeaders(categories, yr, lim);
    return { season: yr, leaders };
  });

  // GET /api/stats/leaders/:category — Single category leaderboard
  fastify.get('/api/stats/leaders/:category', async (request) => {
    const { category } = request.params as any;
    const { season, limit } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const lim = limit ? parseInt(limit) : 25;

    const leaders = await getStatLeaders(category, yr, lim);
    return { category, season: yr, leaders };
  });

  // GET /api/stats/trending — Hot and cold players
  fastify.get('/api/stats/trending', async (request) => {
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const trending = await getHotColdPlayers(yr);
    return { season: yr, trending };
  });

  // ═══════════════════════════════════════════════════════════
  // TEAMS
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/teams — All MLB teams
  fastify.get('/api/stats/teams', async (request) => {
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const teams = await getAllMLBTeams(yr);
    return { season: yr, teams };
  });

  // GET /api/stats/teams/:teamId — Team detail with roster
  fastify.get('/api/stats/teams/:teamId', async (request) => {
    const { teamId } = request.params as any;
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();

    // Accept team abbreviation or numeric ID
    let numericId = parseInt(teamId);
    if (isNaN(numericId)) {
      numericId = MLB_TEAM_MAP_REVERSE[teamId.toUpperCase()] || 0;
    }
    if (!numericId) return { error: 'Invalid team ID or abbreviation' };

    const [rosterData, stats] = await Promise.all([
      getTeamRosterWithStats(numericId, yr),
      getTeamSeasonStats(numericId, yr),
    ]);

    return {
      season: yr,
      team: rosterData.team,
      roster: rosterData.roster,
      stats,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // STANDINGS
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/standings — Full MLB standings
  fastify.get('/api/stats/standings', async (request) => {
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const data = await getStandings(yr);

    // Parse into a cleaner format
    const divisions = (data.records || []).map((div: any) => ({
      division: div.division?.name,
      divisionId: div.division?.id,
      league: div.league?.name,
      teams: div.teamRecords?.map((t: any) => ({
        id: t.team.id,
        name: t.team.name,
        wins: t.wins,
        losses: t.losses,
        pct: t.winningPercentage,
        gb: t.gamesBack,
        streak: t.streak?.streakCode,
        last10: `${t.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.wins || 0}-${t.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.losses || 0}`,
        runsScored: t.runsScored,
        runsAllowed: t.runsAllowed,
        runDiff: t.runDifferential,
        home: `${t.records?.splitRecords?.find((r: any) => r.type === 'home')?.wins || 0}-${t.records?.splitRecords?.find((r: any) => r.type === 'home')?.losses || 0}`,
        away: `${t.records?.splitRecords?.find((r: any) => r.type === 'away')?.wins || 0}-${t.records?.splitRecords?.find((r: any) => r.type === 'away')?.losses || 0}`,
      })) || [],
    }));

    return { season: yr, divisions };
  });

  // ═══════════════════════════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/schedule — Games for a date range
  fastify.get('/api/stats/schedule', async (request) => {
    const { startDate, endDate, teamId } = request.query as any;
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    let games = await getScheduleRange(start, end);

    // Filter by team if specified
    if (teamId) {
      const tid = parseInt(teamId) || MLB_TEAM_MAP_REVERSE[teamId.toUpperCase()] || 0;
      if (tid) {
        games = games.filter(g => g.away.id === tid || g.home.id === tid);
      }
    }

    return { startDate: start, endDate: end, gamesCount: games.length, games };
  });

  // ═══════════════════════════════════════════════════════════
  // SEARCH (unified player search from DB + MLB API)
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/search — Search players
  fastify.get('/api/stats/search', async (request) => {
    const { q, position, team, limit } = request.query as any;
    if (!q || q.length < 2) return { players: [] };

    const lim = Math.min(parseInt(limit) || 25, 50);

    const where: any = {
      fullName: { contains: q, mode: 'insensitive' },
    };
    if (position) where.position = position;
    if (team) where.team = team.toUpperCase();

    const players = await fastify.prisma.player.findMany({
      where,
      take: lim,
      orderBy: { gamesPlayed: 'desc' },
      select: {
        id: true,
        mlbId: true,
        fullName: true,
        team: true,
        position: true,
        eligiblePositions: true,
        headshotUrl: true,
        gamesPlayed: true,
        battingAvg: true,
        homeRuns: true,
        rbi: true,
        era: true,
        wins_stat: true,
        saves: true,
        status: true,
      },
    });

    return { query: q, count: players.length, players };
  });
}