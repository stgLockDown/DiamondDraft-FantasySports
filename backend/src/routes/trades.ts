import { FastifyPluginAsync } from 'fastify';

const tradeRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── PROPOSE TRADE ────────────────────────────────────────────
  fastify.post('/api/leagues/:leagueId/trades', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { leagueId } = request.params as any;
    const { toTeamId, sendPlayerIds, receivePlayerIds, message } = request.body as any;
    const userId = request.user.userId;

    const fromTeam = await fastify.prisma.team.findFirst({ where: { userId, leagueId } });
    if (!fromTeam) return reply.status(403).send({ error: 'You are not in this league' });

    const toTeam = await fastify.prisma.team.findUnique({ where: { id: toTeamId } });
    if (!toTeam) return reply.status(404).send({ error: 'Target team not found' });

    const league = await fastify.prisma.league.findUnique({ where: { id: leagueId } });
    if (league?.tradeDeadline && new Date() > league.tradeDeadline) {
      return reply.status(400).send({ error: 'Trade deadline has passed' });
    }

    const trade = await fastify.prisma.trade.create({
      data: {
        leagueId,
        fromTeamId: fromTeam.id,
        fromUserId: userId,
        toTeamId,
        toUserId: toTeam.userId,
        message,
        votesRequired: league?.tradeReviewType === 'LEAGUE_VOTE' ? Math.floor((league.maxTeams - 2) / 2) + 1 : 0,
        vetoDeadline: league?.tradeReviewType === 'LEAGUE_VOTE'
          ? new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
          : undefined,
        assets: {
          create: [
            ...sendPlayerIds.map((pid: string) => ({
              playerId: pid,
              fromTeamId: fromTeam.id,
              toTeamId,
            })),
            ...receivePlayerIds.map((pid: string) => ({
              playerId: pid,
              fromTeamId: toTeamId,
              toTeamId: fromTeam.id,
            })),
          ],
        },
      },
      include: {
        assets: { include: { player: true } },
        fromTeam: { include: { user: { select: { displayName: true } } } },
        toTeam: { include: { user: { select: { displayName: true } } } },
      },
    });

    // Create notification
    await fastify.prisma.notification.create({
      data: {
        userId: toTeam.userId,
        type: 'trade_proposal',
        title: 'New Trade Proposal',
        body: `${fromTeam.name} has proposed a trade`,
        data: { tradeId: trade.id, leagueId },
      },
    });

    return reply.status(201).send({ trade });
  });

  // ─── GET LEAGUE TRADES ────────────────────────────────────────
  fastify.get('/api/leagues/:leagueId/trades', { preHandler: [fastify.authenticate] }, async (request) => {
    const { leagueId } = request.params as any;
    const { status } = request.query as any;

    const where: any = { leagueId };
    if (status) where.status = status;

    const trades = await fastify.prisma.trade.findMany({
      where,
      include: {
        assets: { include: { player: { select: { id: true, fullName: true, team: true, position: true, headshotUrl: true } } } },
        fromTeam: { include: { user: { select: { displayName: true, avatarUrl: true } } } },
        toTeam: { include: { user: { select: { displayName: true, avatarUrl: true } } } },
        votes: true,
      },
      orderBy: { proposedAt: 'desc' },
    });
    return { trades };
  });

  // ─── RESPOND TO TRADE ─────────────────────────────────────────
  fastify.post('/api/trades/:id/respond', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { action } = request.body as any; // 'accept' | 'reject'
    const userId = request.user.userId;

    const trade = await fastify.prisma.trade.findUnique({
      where: { id },
      include: { assets: true, league: true },
    });
    if (!trade) return reply.status(404).send({ error: 'Trade not found' });
    if (trade.toUserId !== userId) return reply.status(403).send({ error: 'Only the trade recipient can respond' });
    if (trade.status !== 'PENDING') return reply.status(400).send({ error: 'Trade is no longer pending' });

    if (action === 'reject') {
      await fastify.prisma.trade.update({
        where: { id },
        data: { status: 'REJECTED', respondedAt: new Date() },
      });
      return { success: true, status: 'REJECTED' };
    }

    if (action === 'accept') {
      // If league vote required, set to accepted but wait for veto period
      if (trade.league.tradeReviewType === 'LEAGUE_VOTE') {
        await fastify.prisma.trade.update({
          where: { id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        });
        return { success: true, status: 'ACCEPTED', message: 'Trade accepted. Awaiting veto period.' };
      }

      // Process trade immediately
      await processTrade(fastify, trade);
      return { success: true, status: 'PROCESSED' };
    }

    return reply.status(400).send({ error: 'Invalid action' });
  });

  // ─── VOTE ON TRADE ────────────────────────────────────────────
  fastify.post('/api/trades/:id/vote', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { isVeto } = request.body as any;
    const userId = request.user.userId;

    const trade = await fastify.prisma.trade.findUnique({ where: { id }, include: { votes: true } });
    if (!trade) return reply.status(404).send({ error: 'Trade not found' });
    if (trade.status !== 'ACCEPTED') return reply.status(400).send({ error: 'Trade is not in voting phase' });
    if (trade.fromUserId === userId || trade.toUserId === userId) {
      return reply.status(403).send({ error: 'Trade participants cannot vote' });
    }

    await fastify.prisma.tradeVote.upsert({
      where: { tradeId_userId: { tradeId: id, userId } },
      create: { tradeId: id, userId, isVeto },
      update: { isVeto },
    });

    // Check if enough vetoes
    const vetoCount = await fastify.prisma.tradeVote.count({ where: { tradeId: id, isVeto: true } });
    if (vetoCount >= trade.votesRequired) {
      await fastify.prisma.trade.update({ where: { id }, data: { status: 'VETOED', processedAt: new Date() } });
      return { success: true, status: 'VETOED' };
    }

    return { success: true };
  });

  // ─── CANCEL TRADE ─────────────────────────────────────────────
  fastify.post('/api/trades/:id/cancel', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user.userId;

    const trade = await fastify.prisma.trade.findUnique({ where: { id } });
    if (!trade) return reply.status(404).send({ error: 'Trade not found' });
    if (trade.fromUserId !== userId) return reply.status(403).send({ error: 'Only the proposer can cancel' });
    if (trade.status !== 'PENDING') return reply.status(400).send({ error: 'Trade is no longer pending' });

    await fastify.prisma.trade.update({ where: { id }, data: { status: 'CANCELLED' } });
    return { success: true };
  });

  // ─── COMMISSIONER VETO ────────────────────────────────────────
  fastify.post('/api/trades/:id/commissioner-veto', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user.userId;

    const trade = await fastify.prisma.trade.findUnique({ where: { id }, include: { league: true } });
    if (!trade) return reply.status(404).send({ error: 'Trade not found' });
    if (trade.league.ownerId !== userId) return reply.status(403).send({ error: 'Only the commissioner can veto' });

    await fastify.prisma.trade.update({ where: { id }, data: { status: 'VETOED', processedAt: new Date() } });
    return { success: true };
  });
};

// ─── PROCESS TRADE (move players between rosters) ───────────────
async function processTrade(fastify: any, trade: any) {
  for (const asset of trade.assets) {
    // Remove from source team
    await fastify.prisma.rosterEntry.updateMany({
      where: { teamId: asset.fromTeamId, playerId: asset.playerId, isActive: true },
      data: { isActive: false },
    });

    // Add to destination team
    await fastify.prisma.rosterEntry.create({
      data: {
        teamId: asset.toTeamId,
        playerId: asset.playerId,
        rosterSlot: 'BN',
        acquisitionType: 'trade',
      },
    });
  }

  await fastify.prisma.trade.update({
    where: { id: trade.id },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });

  // Log transaction
  await fastify.prisma.transaction.create({
    data: {
      leagueId: trade.leagueId,
      type: 'TRADE',
      description: `Trade processed between teams`,
      metadata: { tradeId: trade.id },
    },
  });
}

export default tradeRoutes;