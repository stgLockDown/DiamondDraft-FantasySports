import { FastifyPluginAsync } from 'fastify';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── GET LEAGUE CHAT MESSAGES ─────────────────────────────────
  fastify.get('/api/leagues/:leagueId/chat', { preHandler: [fastify.authenticate] }, async (request) => {
    const { leagueId } = request.params as any;
    const { before, limit = 50 } = request.query as any;

    const where: any = { leagueId };
    if (before) where.createdAt = { lt: new Date(before) };

    const messages = await fastify.prisma.chatMessage.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    return { messages: messages.reverse() };
  });

  // ─── SEND CHAT MESSAGE ───────────────────────────────────────
  fastify.post('/api/leagues/:leagueId/chat', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { leagueId } = request.params as any;
    const { content, type = 'TEXT' } = request.body as any;
    const userId = request.user.userId;

    // Verify user is in this league
    const team = await fastify.prisma.team.findFirst({ where: { userId, leagueId } });
    const league = await fastify.prisma.league.findUnique({ where: { id: leagueId } });
    if (!team && league?.ownerId !== userId) {
      return reply.status(403).send({ error: 'You are not in this league' });
    }

    if (!content || content.trim().length === 0) {
      return reply.status(400).send({ error: 'Message cannot be empty' });
    }

    const message = await fastify.prisma.chatMessage.create({
      data: {
        leagueId,
        userId,
        content: content.trim(),
        type,
      },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    });

    return reply.status(201).send({ message });
  });

  // ─── ADD REACTION ─────────────────────────────────────────────
  fastify.post('/api/chat/:messageId/react', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { messageId } = request.params as any;
    const { emoji } = request.body as any;
    const userId = request.user.userId;

    const message = await fastify.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) return reply.status(404).send({ error: 'Message not found' });

    const reactions = (message.reactions as Record<string, string[]>) || {};
    if (!reactions[emoji]) reactions[emoji] = [];

    const userIndex = reactions[emoji].indexOf(userId);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(userId);
    }

    const updated = await fastify.prisma.chatMessage.update({
      where: { id: messageId },
      data: { reactions },
    });

    return { message: updated };
  });

  // ─── DELETE MESSAGE ───────────────────────────────────────────
  fastify.delete('/api/chat/:messageId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { messageId } = request.params as any;
    const userId = request.user.userId;

    const message = await fastify.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { league: true },
    });
    if (!message) return reply.status(404).send({ error: 'Message not found' });
    if (message.userId !== userId && message.league.ownerId !== userId) {
      return reply.status(403).send({ error: 'Cannot delete this message' });
    }

    await fastify.prisma.chatMessage.delete({ where: { id: messageId } });
    return { success: true };
  });

  // ─── GET NOTIFICATIONS ───────────────────────────────────────
  fastify.get('/api/notifications', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.user.userId;
    const { unreadOnly } = request.query as any;

    const where: any = { userId };
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await fastify.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await fastify.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  });

  // ─── MARK NOTIFICATIONS READ ──────────────────────────────────
  fastify.post('/api/notifications/read', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.user.userId;
    const { ids } = request.body as any; // Optional array of specific IDs

    if (ids && ids.length > 0) {
      await fastify.prisma.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { isRead: true },
      });
    } else {
      await fastify.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return { success: true };
  });
};

export default chatRoutes;