import { FastifyPluginAsync } from 'fastify';

const playerRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── SEARCH PLAYERS ───────────────────────────────────────────
  fastify.get('/api/players', async (request) => {
    const {
      search, position, team, status, sort = 'projectedPoints',
      order = 'desc', page = 1, limit = 50, leagueId,
    } = request.query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { team: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (position) where.position = position;
    if (team) where.team = team;
    if (status) where.status = status;

    const players = await fastify.prisma.player.findMany({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { [sort]: order },
    });

    const total = await fastify.prisma.player.count({ where });

    // If leagueId provided, mark which players are rostered
    let rosteredPlayerIds: string[] = [];
    if (leagueId) {
      const rostered = await fastify.prisma.rosterEntry.findMany({
        where: { team: { leagueId }, isActive: true },
        select: { playerId: true },
      });
      rosteredPlayerIds = rostered.map((r) => r.playerId);
    }

    const playersWithAvailability = players.map((p) => ({
      ...p,
      isRostered: rosteredPlayerIds.includes(p.id),
    }));

    return {
      players: playersWithAvailability,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  });

  // ─── GET PLAYER BY ID ────────────────────────────────────────
  fastify.get('/api/players/:id', async (request, reply) => {
    const { id } = request.params as any;
    const player = await fastify.prisma.player.findUnique({
      where: { id },
      include: {
        playerStats: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        newsItems: {
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!player) return reply.status(404).send({ error: 'Player not found' });
    return { player };
  });

  // ─── GET PLAYER STATS ────────────────────────────────────────
  fastify.get('/api/players/:id/stats', async (request, reply) => {
    const { id } = request.params as any;
    const { season, startDate, endDate } = request.query as any;

    const where: any = { playerId: id };
    if (season) where.season = Number(season);
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

    const stats = await fastify.prisma.playerStat.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Calculate aggregates
    const totals = stats.reduce(
      (acc, s) => ({
        gamesPlayed: acc.gamesPlayed + 1,
        ab: acc.ab + s.ab,
        runs: acc.runs + s.runs,
        hits: acc.hits + s.hits,
        doubles: acc.doubles + s.doubles,
        triples: acc.triples + s.triples,
        hr: acc.hr + s.hr,
        rbi: acc.rbi + s.rbi,
        sb: acc.sb + s.sb,
        cs: acc.cs + s.cs,
        bb: acc.bb + s.bb,
        so: acc.so + s.so,
        ip: acc.ip + s.ip,
        pitcherSO: acc.pitcherSO + s.pitcherSO,
        pitcherW: acc.pitcherW + s.pitcherW,
        pitcherL: acc.pitcherL + s.pitcherL,
        pitcherSV: acc.pitcherSV + s.pitcherSV,
        pitcherER: acc.pitcherER + s.pitcherER,
        fantasyPoints: acc.fantasyPoints + s.fantasyPoints,
      }),
      {
        gamesPlayed: 0, ab: 0, runs: 0, hits: 0, doubles: 0, triples: 0,
        hr: 0, rbi: 0, sb: 0, cs: 0, bb: 0, so: 0,
        ip: 0, pitcherSO: 0, pitcherW: 0, pitcherL: 0, pitcherSV: 0, pitcherER: 0,
        fantasyPoints: 0,
      }
    );

    return { stats, totals };
  });

  // ─── GET PLAYER NEWS ──────────────────────────────────────────
  fastify.get('/api/players/:id/news', async (request) => {
    const { id } = request.params as any;

    const local = await fastify.prisma.playerNews.findMany({
      where: { playerId: id },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    // Try to enrich with ValorOdds feed (injury reports, analyst notes).
    // Never fail the request if the upstream is down or unconfigured.
    let valorOdds: any[] = [];
    try {
      const { fetchValorOddsPlayerNews } = await import('../services/valorOddsNews');
      const player = await fastify.prisma.player.findUnique({
        where: { id },
        select: { mlbId: true, fullName: true, team: true, position: true },
      });
      if (player) {
        valorOdds = await fetchValorOddsPlayerNews(player);
      }
    } catch {
      valorOdds = [];
    }

    return { news: local, valorOdds };
  });

  // BY-MLB-ID lookups (used by the Stats Hub PlayerProfile page) ------
  fastify.get('/api/players/mlb/:mlbId/news', async (request) => {
    const { mlbId } = request.params as any;
    try {
      const player = await fastify.prisma.player.findFirst({
        where: { mlbId: Number(mlbId) },
        select: { id: true, mlbId: true, fullName: true, team: true, position: true },
      });
      const local = player
        ? await fastify.prisma.playerNews.findMany({
            where: { playerId: player.id },
            orderBy: { publishedAt: 'desc' },
            take: 20,
          })
        : [];
      let valorOdds: any[] = [];
      try {
        const { fetchValorOddsPlayerNews } = await import('../services/valorOddsNews');
        valorOdds = await fetchValorOddsPlayerNews(
          player || { mlbId: Number(mlbId), fullName: '', team: null, position: null },
        );
      } catch {
        valorOdds = [];
      }
      return { news: local, valorOdds };
    } catch {
      return { news: [], valorOdds: [] };
    }
  });

  fastify.get('/api/players/mlb/:mlbId/injury-status', async (request) => {
    const { mlbId } = request.params as any;
    try {
      const player = await fastify.prisma.player.findFirst({
        where: { mlbId: Number(mlbId) },
        select: { mlbId: true, fullName: true, team: true, position: true },
      });
      const { fetchValorOddsInjuryStatus } = await import('../services/valorOddsNews');
      const status = await fetchValorOddsInjuryStatus(
        player || { mlbId: Number(mlbId), fullName: '', team: null, position: null },
      );
      return status ? { ...status, source: 'valorodds' } : { status: null, source: null };
    } catch {
      return { status: null, source: null };
    }
  });

  fastify.get('/api/players/:id/injury-status', async (request) => {
    const { id } = request.params as any;
    try {
      const player = await fastify.prisma.player.findUnique({
        where: { id },
        select: { mlbId: true, fullName: true, team: true, position: true },
      });
      if (!player) return { status: null, source: null };
      const { fetchValorOddsInjuryStatus } = await import('../services/valorOddsNews');
      const status = await fetchValorOddsInjuryStatus(player);
      return status ? { ...status, source: 'valorodds' } : { status: null, source: null };
    } catch {
      return { status: null, source: null };
    }
  });

  // ─── TOP PERFORMERS ──────────────────────────────────────────
  fastify.get('/api/players/top/performers', async (request) => {
    const { position, limit = 20 } = request.query as any;
    const where: any = {};
    if (position) where.position = position;

    const players = await fastify.prisma.player.findMany({
      where,
      orderBy: { projectedPoints: 'desc' },
      take: Number(limit),
      select: {
        id: true, fullName: true, team: true, position: true,
        headshotUrl: true, projectedPoints: true,
        homeRuns: true, rbi: true, stolenBases: true, battingAvg: true,
        era: true, whip: true, strikeouts: true, saves: true, wins_stat: true,
      },
    });
    return { players };
  });

  // ─── FREE AGENTS ──────────────────────────────────────────────
  fastify.get('/api/leagues/:leagueId/free-agents', { preHandler: [fastify.authenticate] }, async (request) => {
    const { leagueId } = request.params as any;
    const { search, position, sort = 'projectedPoints', order = 'desc', page = 1, limit = 50 } = request.query as any;

    // Get all rostered player IDs in this league
    const rostered = await fastify.prisma.rosterEntry.findMany({
      where: { team: { leagueId }, isActive: true },
      select: { playerId: true },
    });
    const rosteredIds = rostered.map((r) => r.playerId);

    const where: any = {
      id: { notIn: rosteredIds },
      status: { in: ['ACTIVE', 'INJURED_LIST'] },
    };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { team: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (position) where.position = position;

    const players = await fastify.prisma.player.findMany({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { [sort]: order },
    });

    const total = await fastify.prisma.player.count({ where });

    return {
      players,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };
  });
};

export default playerRoutes;