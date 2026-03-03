import { FastifyPluginAsync } from 'fastify';
import { generateDraftOrder, getAutoPickRecommendation } from '../utils/draft';

const draftRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── CREATE / INITIALIZE DRAFT ────────────────────────────────
  fastify.post('/api/leagues/:leagueId/draft', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { leagueId } = request.params as any;
    const userId = request.user.userId;

    const league = await fastify.prisma.league.findUnique({
      where: { id: leagueId },
      include: { teams: { orderBy: { createdAt: 'asc' } }, draft: true },
    });

    if (!league) return reply.status(404).send({ error: 'League not found' });
    if (league.ownerId !== userId) return reply.status(403).send({ error: 'Only the commissioner can create the draft' });
    if (league.draft) return reply.status(409).send({ error: 'Draft already exists' });
    if (league.teams.length < 2) return reply.status(400).send({ error: 'Need at least 2 teams to draft' });

    const teamIds = league.draftOrder
      ? (league.draftOrder as string[])
      : league.teams.map((t) => t.id);

    const rosterConfig = league.rosterConfig as Record<string, number>;
    const totalRounds = Object.values(rosterConfig).reduce((a, b) => a + b, 0);

    const draftOrder = generateDraftOrder({
      type: league.draftType as any,
      teamIds,
      totalRounds,
    });

    const draft = await fastify.prisma.draft.create({
      data: {
        leagueId,
        type: league.draftType,
        totalRounds,
        pickTimerSeconds: league.pickTimerSeconds,
        picks: {
          create: draftOrder.map((pick) => ({
            round: pick.round,
            pickNumber: pick.pickNumber,
            teamId: pick.teamId,
          })),
        },
      },
      include: {
        picks: {
          include: { team: { select: { id: true, name: true, user: { select: { displayName: true } } } } },
          orderBy: { pickNumber: 'asc' },
        },
      },
    });

    return reply.status(201).send({ draft });
  });

  // ─── GET DRAFT ────────────────────────────────────────────────
  fastify.get('/api/leagues/:leagueId/draft', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { leagueId } = request.params as any;

    const draft = await fastify.prisma.draft.findUnique({
      where: { leagueId },
      include: {
        picks: {
          include: {
            team: { select: { id: true, name: true, user: { select: { id: true, displayName: true } } } },
            player: { select: { id: true, fullName: true, team: true, position: true, headshotUrl: true, projectedPoints: true } },
          },
          orderBy: { pickNumber: 'asc' },
        },
      },
    });

    if (!draft) return reply.status(404).send({ error: 'Draft not found' });

    // Get current pick info
    const currentPick = draft.picks.find((p) => !p.playerId);
    const completedPicks = draft.picks.filter((p) => p.playerId);

    return {
      draft,
      currentPick: currentPick || null,
      completedPicks: completedPicks.length,
      totalPicks: draft.picks.length,
      isComplete: completedPicks.length === draft.picks.length,
    };
  });

  // ─── START DRAFT ──────────────────────────────────────────────
  fastify.post('/api/drafts/:id/start', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user.userId;

    const draft = await fastify.prisma.draft.findUnique({
      where: { id },
      include: { league: true },
    });

    if (!draft) return reply.status(404).send({ error: 'Draft not found' });
    if (draft.league.ownerId !== userId) return reply.status(403).send({ error: 'Only the commissioner can start the draft' });
    if (draft.status !== 'SCHEDULED') return reply.status(400).send({ error: 'Draft has already started' });

    const updated = await fastify.prisma.draft.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        timerExpiresAt: new Date(Date.now() + draft.pickTimerSeconds * 1000),
      },
    });

    await fastify.prisma.league.update({
      where: { id: draft.leagueId },
      data: { status: 'DRAFTING' },
    });

    return { draft: updated };
  });

  // ─── MAKE PICK ────────────────────────────────────────────────
  fastify.post('/api/drafts/:id/pick', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { playerId } = request.body as any;
    const userId = request.user.userId;

    const draft = await fastify.prisma.draft.findUnique({
      where: { id },
      include: {
        picks: { orderBy: { pickNumber: 'asc' } },
        league: { include: { teams: true } },
      },
    });

    if (!draft) return reply.status(404).send({ error: 'Draft not found' });
    if (draft.status !== 'IN_PROGRESS') return reply.status(400).send({ error: 'Draft is not in progress' });

    // Find current pick
    const currentPick = draft.picks.find((p) => !p.playerId);
    if (!currentPick) return reply.status(400).send({ error: 'Draft is complete' });

    // Verify it's this user's turn
    const team = draft.league.teams.find((t) => t.id === currentPick.teamId);
    if (!team || team.userId !== userId) {
      // Check if commissioner is making the pick
      if (draft.league.ownerId !== userId) {
        return reply.status(403).send({ error: 'Not your turn to pick' });
      }
    }

    // Check player isn't already drafted
    const alreadyPicked = draft.picks.find((p) => p.playerId === playerId);
    if (alreadyPicked) return reply.status(409).send({ error: 'Player already drafted' });

    // Make the pick
    const pick = await fastify.prisma.draftPick.update({
      where: { id: currentPick.id },
      data: {
        playerId,
        userId,
        pickedAt: new Date(),
      },
      include: {
        player: { select: { id: true, fullName: true, team: true, position: true, headshotUrl: true } },
        team: { select: { id: true, name: true } },
      },
    });

    // Add player to team roster
    const player = await fastify.prisma.player.findUnique({ where: { id: playerId } });
    if (player) {
      await fastify.prisma.rosterEntry.create({
        data: {
          teamId: currentPick.teamId!,
          playerId,
          rosterSlot: player.position === 'SP' || player.position === 'RP' ? player.position : player.position,
          acquisitionType: 'draft',
        },
      });
    }

    // Log transaction
    await fastify.prisma.transaction.create({
      data: {
        leagueId: draft.leagueId,
        type: 'DRAFT_PICK',
        description: `${pick.team?.name} drafted ${pick.player?.fullName} (Round ${currentPick.round}, Pick ${currentPick.pickNumber})`,
        teamId: currentPick.teamId || undefined,
        playerId,
      },
    });

    // Check if draft is complete
    const nextPick = draft.picks.find((p) => p.pickNumber > currentPick.pickNumber && !p.playerId);
    if (!nextPick) {
      await fastify.prisma.draft.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await fastify.prisma.league.update({
        where: { id: draft.leagueId },
        data: { status: 'IN_SEASON' },
      });
    } else {
      // Reset timer for next pick
      await fastify.prisma.draft.update({
        where: { id },
        data: {
          currentRound: nextPick.round,
          currentPick: nextPick.pickNumber,
          timerExpiresAt: new Date(Date.now() + draft.pickTimerSeconds * 1000),
        },
      });
    }

    return {
      pick,
      nextPick: nextPick ? { pickNumber: nextPick.pickNumber, teamId: nextPick.teamId, round: nextPick.round } : null,
      isComplete: !nextPick,
    };
  });

  // ─── AUTO PICK ────────────────────────────────────────────────
  fastify.post('/api/drafts/:id/auto-pick', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;

    const draft = await fastify.prisma.draft.findUnique({
      where: { id },
      include: {
        picks: { orderBy: { pickNumber: 'asc' } },
        league: { include: { teams: { include: { roster: true } } } },
      },
    });

    if (!draft) return reply.status(404).send({ error: 'Draft not found' });
    if (draft.status !== 'IN_PROGRESS') return reply.status(400).send({ error: 'Draft is not in progress' });

    const currentPick = draft.picks.find((p) => !p.playerId);
    if (!currentPick) return reply.status(400).send({ error: 'Draft is complete' });

    // Get drafted player IDs
    const draftedIds = draft.picks.filter((p) => p.playerId).map((p) => p.playerId!);

    // Get available players
    const availablePlayers = await fastify.prisma.player.findMany({
      where: { id: { notIn: draftedIds }, status: 'ACTIVE' },
      orderBy: { projectedPoints: 'desc' },
      take: 100,
    });

    const team = draft.league.teams.find((t) => t.id === currentPick.teamId);
    const rosterConfig = draft.league.rosterConfig as Record<string, number>;

    const playerId = getAutoPickRecommendation(
      availablePlayers.map((p) => ({ id: p.id, position: p.position, projectedPoints: p.projectedPoints })),
      team?.roster.map((r) => ({ rosterSlot: r.rosterSlot, playerId: r.playerId })) || [],
      rosterConfig
    );

    if (!playerId) return reply.status(500).send({ error: 'No available players' });

    // Make the pick using the same logic
    const pick = await fastify.prisma.draftPick.update({
      where: { id: currentPick.id },
      data: { playerId, isAutoPick: true, pickedAt: new Date() },
      include: {
        player: { select: { id: true, fullName: true, team: true, position: true } },
        team: { select: { id: true, name: true } },
      },
    });

    // Add to roster
    const player = await fastify.prisma.player.findUnique({ where: { id: playerId } });
    if (player) {
      await fastify.prisma.rosterEntry.create({
        data: {
          teamId: currentPick.teamId!,
          playerId,
          rosterSlot: player.position,
          acquisitionType: 'draft',
        },
      });
    }

    return { pick, isAutoPick: true };
  });

  // ─── PAUSE / RESUME DRAFT ────────────────────────────────────
  fastify.post('/api/drafts/:id/pause', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user.userId;

    const draft = await fastify.prisma.draft.findUnique({ where: { id }, include: { league: true } });
    if (!draft) return reply.status(404).send({ error: 'Draft not found' });
    if (draft.league.ownerId !== userId) return reply.status(403).send({ error: 'Only commissioner can pause' });

    const newStatus = draft.status === 'IN_PROGRESS' ? 'PAUSED' : 'IN_PROGRESS';
    const updated = await fastify.prisma.draft.update({
      where: { id },
      data: {
        status: newStatus as any,
        ...(newStatus === 'PAUSED' ? { pausedAt: new Date() } : {}),
        ...(newStatus === 'IN_PROGRESS' ? { timerExpiresAt: new Date(Date.now() + draft.pickTimerSeconds * 1000) } : {}),
      },
    });

    return { draft: updated };
  });

  // ─── MOCK DRAFT ───────────────────────────────────────────────
  fastify.post('/api/mock-drafts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const { settings } = request.body as any;

    const mockDraft = await fastify.prisma.mockDraft.create({
      data: {
        userId,
        settings: settings || {
          teamCount: 12,
          draftType: 'SNAKE',
          scoringType: 'STANDARD_POINTS',
          userPickSlot: 1,
          aiDifficulty: 'average',
        },
      },
    });

    return reply.status(201).send({ mockDraft });
  });

  // ─── GET MY MOCK DRAFTS ──────────────────────────────────────
  fastify.get('/api/mock-drafts', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.user.userId;
    const mocks = await fastify.prisma.mockDraft.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { mockDrafts: mocks };
  });
};

export default draftRoutes;