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
    const result = await getScheduleRange(start, end);
    return { startDate: start, endDate: end, dates: result.dates || [] };
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
    let fantasy = null;
    try {
      const dbPlayer = await fastify.prisma.player.findUnique({
        where: { mlbId: parseInt(mlbId) },
        include: {
          playerStats: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
      });
      if (dbPlayer) {
        fantasy = {
          projectedPoints: dbPlayer.projectedPoints,
          rosPercentage: dbPlayer.rosPercentage,
          recentFantasyPoints: dbPlayer.playerStats.map(s => ({
            date: s.date,
            gameId: s.gameId,
            points: s.fantasyPoints,
            hitting: { ab: s.ab, h: s.hits, hr: s.hr, rbi: s.rbi, r: s.runs, sb: s.sb, bb: s.bb, so: s.so },
            pitching: { ip: s.ip, so: s.pitcherSO, er: s.pitcherER, w: s.pitcherW, sv: s.pitcherSV, h: s.pitcherH, bb: s.pitcherBB },
          })),
        };
      }
    } catch (_) { /* DB not available, that's fine */ }

    // Restructure for frontend: { info, stats, gamelog, fantasy }
    const hittingArr = [];
    if (profile.hitting?.season) hittingArr.push({ season: yr, team: profile.currentTeam, stat: profile.hitting.season });
    if (profile.hitting?.career) hittingArr.push({ season: 'Career', team: null, stat: profile.hitting.career });

    const pitchingArr = [];
    if (profile.pitching?.season) pitchingArr.push({ season: yr, team: profile.currentTeam, stat: profile.pitching.season });
    if (profile.pitching?.career) pitchingArr.push({ season: 'Career', team: null, stat: profile.pitching.career });

    return {
      info: {
        id: profile.id,
        fullName: profile.fullName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        primaryPosition: profile.primaryPosition,
        currentTeam: profile.currentTeam,
        jerseyNumber: profile.primaryNumber,
        batSide: profile.batSide,
        pitchHand: profile.pitchHand,
        height: profile.height,
        weight: profile.weight,
        currentAge: profile.currentAge,
        birthDate: profile.birthDate,
        birthCity: profile.birthCity,
        birthStateProvince: profile.birthStateProvince,
        birthCountry: profile.birthCountry,
        mlbDebutDate: profile.mlbDebutDate,
        headshotUrl: profile.headshotUrl,
      },
      stats: {
        hitting: hittingArr,
        pitching: pitchingArr,
      },
      gamelog: {
        hitting: profile.recentGames?.hitting || [],
        pitching: profile.recentGames?.pitching || [],
      },
      fantasy,
    };
  });

  // GET /api/stats/player/:mlbId/splits — Player splits (vs L/R, home/away)
  fastify.get('/api/stats/player/:mlbId/splits', async (request) => {
    const { mlbId } = request.params as any;
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const raw = await getPlayerSplits(parseInt(mlbId), yr);

    // Restructure into array of split groups for frontend
    const splits: any[] = [];
    if (raw.vsPlatoon?.length) {
      splits.push({
        splitType: 'vs Left/Right',
        group: 'vsPlatoon',
        splits: raw.vsPlatoon.map((s: any) => ({
          split: { description: s.split?.description || 'Unknown' },
          stat: s.stat,
        })),
      });
    }
    if (raw.homeAway?.length) {
      splits.push({
        splitType: 'Home/Away',
        group: 'homeAway',
        splits: raw.homeAway.map((s: any) => ({
          split: { description: s.split?.description || 'Unknown' },
          stat: s.stat,
        })),
      });
    }

    return { splits };
  });

  // GET /api/stats/player/:mlbId/gamelog — Player game log
  fastify.get('/api/stats/player/:mlbId/gamelog', async (request) => {
    const { mlbId } = request.params as any;
    const { season } = request.query as any;
    const yr = season ? parseInt(season) : new Date().getFullYear();
    const profile = await getPlayerFullProfile(parseInt(mlbId), yr);
    return {
      player: { id: profile.id, fullName: profile.fullName, position: profile.primaryPosition },
      gamelog: [
        ...(profile.recentGames?.hitting || []),
        ...(profile.recentGames?.pitching || []),
      ],
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
      players: profiles.filter(Boolean).map((p: any) => {
        const hittingArr = [];
        if (p.hitting?.season) hittingArr.push({ season: yr, team: p.currentTeam, stat: p.hitting.season });
        if (p.hitting?.career) hittingArr.push({ season: 'Career', team: p.currentTeam, stat: p.hitting.career });

        const pitchingArr = [];
        if (p.pitching?.season) pitchingArr.push({ season: yr, team: p.currentTeam, stat: p.pitching.season });
        if (p.pitching?.career) pitchingArr.push({ season: 'Career', team: p.currentTeam, stat: p.pitching.career });

        return {
          mlbId: p.id,
          info: {
            id: p.id,
            fullName: p.fullName,
            primaryPosition: p.primaryPosition,
            currentTeam: p.currentTeam,
            headshotUrl: p.headshotUrl,
          },
          stats: {
            hitting: hittingArr,
            pitching: pitchingArr,
          },
        };
      }),
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

  // GET /api/stats/teams/:teamId — Team detail with roster and stats
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

    const teamInfo = rosterData.team || {};

    // Flatten roster for frontend: each player gets { mlbId, fullName, position, jerseyNumber, stats }
    // Try to get player stats from our DB first
    let dbPlayers: Record<number, any> = {};
    try {
      const mlbIds = (rosterData.roster || []).map((r: any) => r.person?.id).filter(Boolean);
      if (mlbIds.length > 0) {
        const found = await fastify.prisma.player.findMany({
          where: { mlbId: { in: mlbIds } },
          select: {
            mlbId: true, battingAvg: true, homeRuns: true, rbi: true, ops: true,
            era: true, whip: true, wins_stat: true, losses_stat: true, strikeouts: true, saves: true,
            gamesPlayed: true, stolenBases: true,
          },
        });
        for (const p of found) {
          dbPlayers[p.mlbId] = p;
        }
      }
    } catch (_) { /* DB not available */ }

    const roster = (rosterData.roster || []).map((r: any) => {
      const mlbId = r.person?.id;
      const dbP = dbPlayers[mlbId];
      return {
        mlbId,
        id: mlbId,
        fullName: r.person?.fullName,
        position: r.position?.abbreviation || r.position?.name || 'Unknown',
        jerseyNumber: r.jerseyNumber,
        batSide: r.person?.batSide?.code,
        throwHand: r.person?.pitchHand?.code,
        status: r.status?.description,
        stats: dbP ? {
          avg: dbP.battingAvg ? dbP.battingAvg.toFixed(3) : null,
          homeRuns: dbP.homeRuns,
          rbi: dbP.rbi,
          ops: dbP.ops ? dbP.ops.toFixed(3) : null,
          era: dbP.era ? dbP.era.toFixed(2) : null,
          whip: dbP.whip ? dbP.whip.toFixed(2) : null,
          wins: dbP.wins_stat,
          losses: dbP.losses_stat,
          strikeOuts: dbP.strikeouts,
          saves: dbP.saves,
          gamesPlayed: dbP.gamesPlayed,
          stolenBases: dbP.stolenBases,
        } : null,
      };
    });

    return {
      season: yr,
      name: teamInfo.name,
      teamName: teamInfo.teamName,
      abbreviation: teamInfo.abbreviation,
      venue: teamInfo.venue?.name,
      record: teamInfo.record ? {
        wins: teamInfo.record.wins,
        losses: teamInfo.record.losses,
        pct: teamInfo.record.winningPercentage,
      } : null,
      roster,
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

    const result = await getScheduleRange(start, end);
    let dates = result.dates || [];

    // Filter by team if specified
    if (teamId) {
      const tid = parseInt(teamId) || MLB_TEAM_MAP_REVERSE[teamId.toUpperCase()] || 0;
      if (tid) {
        dates = dates.map((d: any) => ({
          ...d,
          games: d.games.filter((g: any) =>
            g.teams?.away?.team?.id === tid || g.teams?.home?.team?.id === tid
          ),
        })).filter((d: any) => d.games.length > 0);
      }
    }

    return { startDate: start, endDate: end, dates };
  });

  // ═══════════════════════════════════════════════════════════
  // SEARCH (unified player search from DB + MLB API)
  // ═══════════════════════════════════════════════════════════

  // GET /api/stats/search — Search players (DB first, fallback to MLB API)
  fastify.get('/api/stats/search', async (request) => {
    const { q, position, team, limit } = request.query as any;
    if (!q || q.length < 2) return { players: [] };

    const lim = Math.min(parseInt(limit) || 25, 50);

    // Try DB first
    try {
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

      if (players.length > 0) {
        return {
          query: q,
          count: players.length,
          players: players.map(p => ({
            ...p,
            stats: {
              avg: p.battingAvg ? p.battingAvg.toFixed(3) : null,
              homeRuns: p.homeRuns,
              rbi: p.rbi,
              era: p.era ? p.era.toFixed(2) : null,
              wins: p.wins_stat,
              saves: p.saves,
            },
          })),
        };
      }
    } catch (_) { /* DB not available */ }

    // Fallback: search via MLB API
    try {
      const searchUrl = `https://lookup-service-prod.mlb.com/json/named.search_player_all.bam?sport_code='mlb'&active_sw='Y'&name_part='${encodeURIComponent(q)}%25'`;
      const resp = await fetch(searchUrl);
      const data: any = await resp.json();
      const rows = data?.search_player_all?.queryResults?.row;
      if (!rows) return { query: q, count: 0, players: [] };

      const results = Array.isArray(rows) ? rows : [rows];
      const filtered = position
        ? results.filter((r: any) => r.position?.toUpperCase() === position.toUpperCase())
        : results;

      return {
        query: q,
        count: filtered.length,
        players: filtered.slice(0, lim).map((r: any) => ({
          mlbId: parseInt(r.player_id),
          fullName: `${r.name_first} ${r.name_last}`,
          team: r.team_abbrev,
          position: r.position,
          headshotUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${r.player_id}/headshot/silo/current`,
          stats: null,
        })),
      };
    } catch (_) {
      return { query: q, count: 0, players: [] };
    }
  });
}