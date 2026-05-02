import { FastifyPluginAsync } from 'fastify';
import { DEFAULT_ROSTER_CONFIG, DEFAULT_SCORING_CONFIG } from '../utils/scoring';
import { defaultRosterConfig, defaultScoringConfig, supportedSports } from '../utils/sportConfig';

const SUPPORTED_SPORTS = new Set(supportedSports());

const leagueRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── CREATE LEAGUE ────────────────────────────────────────────
  fastify.post('/api/leagues', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = request.body as any;
    const userId = request.user.userId;

    // Free tier: max 2 leagues
    const user = await fastify.prisma.user.findUnique({ where: { id: userId }, include: { ownedLeagues: true } });
    if (user?.tier === 'FREE' && (user.ownedLeagues?.length || 0) >= 2) {
      return reply.status(403).send({ error: 'Free tier limited to 2 leagues. Upgrade to Pro for unlimited.' });
    }

    // Multi-sport: derive sport-appropriate defaults when the client
    // doesn't supply a custom roster / scoring config. MLB keeps its
    // historical defaults exactly to avoid disrupting existing tests.
    const sport = SUPPORTED_SPORTS.has(String(body.sport || 'MLB').toUpperCase() as any)
      ? (String(body.sport || 'MLB').toUpperCase() as any)
      : 'MLB';
    const rosterDefault = sport === 'MLB' ? DEFAULT_ROSTER_CONFIG : defaultRosterConfig(sport);
    const scoringDefault = sport === 'MLB' ? DEFAULT_SCORING_CONFIG : defaultScoringConfig(sport);

    const league = await fastify.prisma.league.create({
      data: {
        name: body.name,
        description: body.description || null,
        sport,
        format: body.format || 'HEAD_TO_HEAD_POINTS',
        scoringType: body.scoringType || 'POINTS',
        maxTeams: body.maxTeams || 12,
        rosterSize: body.rosterSize || 25,
        isPublic: body.isPublic || false,
        seasonYear: body.seasonYear || new Date().getFullYear(),
        draftType: body.draftType || 'SNAKE',
        draftDate: body.draftDate ? new Date(body.draftDate) : null,
        pickTimerSeconds: body.pickTimerSeconds || 90,
        rosterConfig: body.rosterConfig || rosterDefault,
        scoringConfig: body.scoringConfig || scoringDefault,
        waiverType: body.waiverType || 'FAAB',
        waiverBudget: body.waiverBudget || 100,
        lineupChangeFreq: body.lineupChangeFreq || 'DAILY',
        tradeReviewType: body.tradeReviewType || 'COMMISSIONER',
        leagueType: body.leagueType || 'REDRAFT',
        maxKeepers: body.maxKeepers || 0,
        ownerId: userId,
      },
    });

    // Auto-create team for the commissioner
    await fastify.prisma.team.create({
      data: {
        name: body.teamName || `${user?.displayName}'s Team`,
        userId,
        leagueId: league.id,
        faabBudget: league.waiverBudget,
      },
    });

    return reply.status(201).send({ league });
  });

  // ─── GET MY LEAGUES ───────────────────────────────────────────
  fastify.get('/api/leagues', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.user.userId;
    const leagues = await fastify.prisma.league.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { teams: { some: { userId } } },
        ],
      },
      include: {
        teams: { select: { id: true, name: true, userId: true, wins: true, losses: true } },
        owner: { select: { id: true, displayName: true, username: true } },
        _count: { select: { teams: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { leagues };
  });

  // ─── GET PUBLIC LEAGUES ───────────────────────────────────────
  fastify.get('/api/leagues/public', async (request) => {
    const { page = 1, limit = 20 } = request.query as any;
    const leagues = await fastify.prisma.league.findMany({
      where: { isPublic: true, status: 'PRE_DRAFT' },
      include: {
        owner: { select: { displayName: true, username: true } },
        _count: { select: { teams: true } },
      },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { createdAt: 'desc' },
    });
    return { leagues };
  });

  // ─── FIND LEAGUE BY INVITE CODE ─────────────────────────────────
  fastify.get('/api/leagues/find-by-code', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { code } = request.query as any;
    if (!code) return reply.status(400).send({ error: 'Invite code is required' });

    const league = await fastify.prisma.league.findFirst({
      where: { inviteCode: code.trim() },
      include: {
        owner: { select: { displayName: true, username: true } },
        _count: { select: { teams: true } },
      },
    });

    if (!league) return reply.status(404).send({ error: 'No league found with that invite code' });
    return { league };
  });

  // ─── GET LEAGUE BY ID ────────────────────────────────────────
  fastify.get('/api/leagues/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const league = await fastify.prisma.league.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
            roster: { include: { player: true } },
          },
          orderBy: { wins: 'desc' },
        },
        owner: { select: { id: true, displayName: true, username: true } },
        draft: true,
        _count: { select: { teams: true, trades: true, chatMessages: true } },
      },
    });
    if (!league) return reply.status(404).send({ error: 'League not found' });
    return { league };
  });

  // ─── UPDATE LEAGUE SETTINGS ──────────────────────────────────
  fastify.patch('/api/leagues/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const userId = request.user.userId;

    const league = await fastify.prisma.league.findUnique({ where: { id } });
    if (!league) return reply.status(404).send({ error: 'League not found' });
    if (league.ownerId !== userId) return reply.status(403).send({ error: 'Only the commissioner can edit league settings' });

    const updated = await fastify.prisma.league.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.format && { format: body.format }),
        ...(body.scoringType && { scoringType: body.scoringType }),
        ...(body.maxTeams && { maxTeams: body.maxTeams }),
        ...(body.draftType && { draftType: body.draftType }),
        ...(body.draftDate && { draftDate: new Date(body.draftDate) }),
        ...(body.pickTimerSeconds && { pickTimerSeconds: body.pickTimerSeconds }),
        ...(body.rosterConfig && { rosterConfig: body.rosterConfig }),
        ...(body.scoringConfig && { scoringConfig: body.scoringConfig }),
        ...(body.waiverType && { waiverType: body.waiverType }),
        ...(body.waiverBudget !== undefined && { waiverBudget: body.waiverBudget }),
        ...(body.lineupChangeFreq && { lineupChangeFreq: body.lineupChangeFreq }),
        ...(body.tradeReviewType && { tradeReviewType: body.tradeReviewType }),
        ...(body.tradeDeadline && { tradeDeadline: new Date(body.tradeDeadline) }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });
    return { league: updated };
  });

  // ─── JOIN LEAGUE ──────────────────────────────────────────────
  fastify.post('/api/leagues/:id/join', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { teamName, inviteCode } = request.body as any;
    const userId = request.user.userId;

    const league = await fastify.prisma.league.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } } },
    });

    if (!league) return reply.status(404).send({ error: 'League not found' });
    if (league.status !== 'PRE_DRAFT') return reply.status(400).send({ error: 'Cannot join a league that has already drafted' });
    if (league._count.teams >= league.maxTeams) return reply.status(400).send({ error: 'League is full' });

    // Check invite code for private leagues
    if (!league.isPublic && league.inviteCode !== inviteCode) {
      return reply.status(403).send({ error: 'Invalid invite code' });
    }

    // Check if already in league
    const existing = await fastify.prisma.team.findFirst({ where: { userId, leagueId: id } });
    if (existing) return reply.status(409).send({ error: 'You are already in this league' });

    const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
    const team = await fastify.prisma.team.create({
      data: {
        name: teamName || `${user?.displayName}'s Team`,
        userId,
        leagueId: id,
        faabBudget: league.waiverBudget,
        waiverPriority: league._count.teams + 1,
      },
    });

    return reply.status(201).send({ team });
  });

  // ─── LEAVE LEAGUE ────────────────────────────────────────────
  fastify.delete('/api/leagues/:id/leave', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user.userId;

    const league = await fastify.prisma.league.findUnique({ where: { id } });
    if (!league) return reply.status(404).send({ error: 'League not found' });
    if (league.ownerId === userId) return reply.status(400).send({ error: 'Commissioner cannot leave. Transfer ownership first or delete the league.' });
    if (league.status !== 'PRE_DRAFT') return reply.status(400).send({ error: 'Cannot leave after the draft' });

    await fastify.prisma.team.deleteMany({ where: { userId, leagueId: id } });
    return { success: true };
  });

  // ─── DELETE LEAGUE ────────────────────────────────────────────
  fastify.delete('/api/leagues/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user.userId;

    const league = await fastify.prisma.league.findUnique({ where: { id } });
    if (!league) return reply.status(404).send({ error: 'League not found' });
    if (league.ownerId !== userId) return reply.status(403).send({ error: 'Only the commissioner can delete the league' });

    await fastify.prisma.league.delete({ where: { id } });
    return { success: true };
  });

  // ─── GET LEAGUE STANDINGS ─────────────────────────────────────
  fastify.get('/api/leagues/:id/standings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const teams = await fastify.prisma.team.findMany({
      where: { leagueId: id },
      include: {
        user: { select: { displayName: true, username: true, avatarUrl: true } },
      },
      orderBy: [{ wins: 'desc' }, { pointsFor: 'desc' }],
    });
    return { standings: teams };
  });

  // ─── GET LEAGUE TRANSACTIONS ──────────────────────────────────
  fastify.get('/api/leagues/:id/transactions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { page = 1, limit = 50 } = request.query as any;
    const transactions = await fastify.prisma.transaction.findMany({
      where: { leagueId: id },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { createdAt: 'desc' },
    });
    return { transactions };
  });
};

export default leagueRoutes;