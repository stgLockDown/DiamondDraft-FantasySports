import { FastifyPluginAsync } from 'fastify';

const teamRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── GET TEAM ─────────────────────────────────────────────────
  fastify.get('/api/teams/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const team = await fastify.prisma.team.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        league: { select: { id: true, name: true, format: true, scoringConfig: true, rosterConfig: true } },
        roster: {
          where: { isActive: true },
          include: { player: true },
          orderBy: { rosterSlot: 'asc' },
        },
      },
    });
    if (!team) return reply.status(404).send({ error: 'Team not found' });
    return { team };
  });

  // ─── UPDATE TEAM ──────────────────────────────────────────────
  fastify.patch('/api/teams/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const userId = request.user.userId;

    const team = await fastify.prisma.team.findUnique({ where: { id } });
    if (!team) return reply.status(404).send({ error: 'Team not found' });
    if (team.userId !== userId) return reply.status(403).send({ error: 'Not your team' });

    const updated = await fastify.prisma.team.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.abbreviation && { abbreviation: body.abbreviation }),
        ...(body.logoUrl && { logoUrl: body.logoUrl }),
      },
    });
    return { team: updated };
  });

  // ─── SET LINEUP ───────────────────────────────────────────────
  fastify.post('/api/teams/:id/lineup', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { moves } = request.body as any; // Array of { playerId, newSlot }
    const userId = request.user.userId;

    const team = await fastify.prisma.team.findUnique({ where: { id }, include: { league: true } });
    if (!team) return reply.status(404).send({ error: 'Team not found' });
    if (team.userId !== userId) return reply.status(403).send({ error: 'Not your team' });

    // Process each lineup move
    for (const move of moves) {
      await fastify.prisma.rosterEntry.updateMany({
        where: { teamId: id, playerId: move.playerId },
        data: { rosterSlot: move.newSlot },
      });
    }

    // Log transaction
    await fastify.prisma.transaction.create({
      data: {
        leagueId: team.leagueId,
        type: 'LINEUP_CHANGE',
        description: `${team.name} updated their lineup`,
        teamId: id,
      },
    });

    const roster = await fastify.prisma.rosterEntry.findMany({
      where: { teamId: id, isActive: true },
      include: { player: true },
      orderBy: { rosterSlot: 'asc' },
    });

    return { roster };
  });

  // ─── ADD PLAYER (FREE AGENT) ─────────────────────────────────
  fastify.post('/api/teams/:id/add', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { playerId, rosterSlot, dropPlayerId } = request.body as any;
    const userId = request.user.userId;

    const team = await fastify.prisma.team.findUnique({
      where: { id },
      include: { league: true, roster: { where: { isActive: true } } },
    });
    if (!team) return reply.status(404).send({ error: 'Team not found' });
    if (team.userId !== userId) return reply.status(403).send({ error: 'Not your team' });

    // Check if player is already rostered in this league
    const alreadyRostered = await fastify.prisma.rosterEntry.findFirst({
      where: {
        playerId,
        isActive: true,
        team: { leagueId: team.leagueId },
      },
    });
    if (alreadyRostered) return reply.status(409).send({ error: 'Player is already rostered' });

    // Check roster size
    const rosterConfig = team.league.rosterConfig as Record<string, number>;
    const maxRoster = Object.values(rosterConfig).reduce((a, b) => a + b, 0);
    if (team.roster.length >= maxRoster && !dropPlayerId) {
      return reply.status(400).send({ error: 'Roster is full. You must drop a player.' });
    }

    // Drop player if specified
    if (dropPlayerId) {
      await fastify.prisma.rosterEntry.updateMany({
        where: { teamId: id, playerId: dropPlayerId },
        data: { isActive: false },
      });

      const droppedPlayer = await fastify.prisma.player.findUnique({ where: { id: dropPlayerId } });
      await fastify.prisma.transaction.create({
        data: {
          leagueId: team.leagueId,
          type: 'DROP',
          description: `${team.name} dropped ${droppedPlayer?.fullName}`,
          teamId: id,
          playerId: dropPlayerId,
        },
      });
    }

    // Add player
    await fastify.prisma.rosterEntry.create({
      data: {
        teamId: id,
        playerId,
        rosterSlot: rosterSlot || 'BN',
        acquisitionType: 'free_agent',
      },
    });

    const addedPlayer = await fastify.prisma.player.findUnique({ where: { id: playerId } });
    await fastify.prisma.transaction.create({
      data: {
        leagueId: team.leagueId,
        type: 'FREE_AGENT_ADD',
        description: `${team.name} added ${addedPlayer?.fullName}`,
        teamId: id,
        playerId,
      },
    });

    return { success: true };
  });

  // ─── DROP PLAYER ──────────────────────────────────────────────
  fastify.post('/api/teams/:id/drop', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { playerId } = request.body as any;
    const userId = request.user.userId;

    const team = await fastify.prisma.team.findUnique({ where: { id }, include: { league: true } });
    if (!team) return reply.status(404).send({ error: 'Team not found' });
    if (team.userId !== userId) return reply.status(403).send({ error: 'Not your team' });

    await fastify.prisma.rosterEntry.updateMany({
      where: { teamId: id, playerId },
      data: { isActive: false },
    });

    const player = await fastify.prisma.player.findUnique({ where: { id: playerId } });
    await fastify.prisma.transaction.create({
      data: {
        leagueId: team.leagueId,
        type: 'DROP',
        description: `${team.name} dropped ${player?.fullName}`,
        teamId: id,
        playerId,
      },
    });

    return { success: true };
  });

  // ─── WAIVER CLAIM ─────────────────────────────────────────────
  fastify.post('/api/teams/:id/waiver', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { playerId, bidAmount, dropPlayerId } = request.body as any;
    const userId = request.user.userId;

    const team = await fastify.prisma.team.findUnique({ where: { id }, include: { league: true } });
    if (!team) return reply.status(404).send({ error: 'Team not found' });
    if (team.userId !== userId) return reply.status(403).send({ error: 'Not your team' });

    if (team.league.waiverType === 'FAAB' && bidAmount > team.faabBudget) {
      return reply.status(400).send({ error: 'Insufficient FAAB budget' });
    }

    const claim = await fastify.prisma.waiverClaim.create({
      data: {
        leagueId: team.leagueId,
        userId,
        teamId: id,
        playerId,
        dropPlayerId: dropPlayerId || null,
        bidAmount: bidAmount || 0,
        priority: team.waiverPriority,
      },
    });

    return reply.status(201).send({ claim });
  });
};

export default teamRoutes;