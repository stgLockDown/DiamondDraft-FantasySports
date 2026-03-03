import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── REGISTER ───────────────────────────────────────────────
  fastify.post('/api/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'username', 'password', 'displayName'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 20 },
          password: { type: 'string', minLength: 8 },
          displayName: { type: 'string', minLength: 1, maxLength: 50 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, username, password, displayName } = request.body as any;

    // Check existing
    const existing = await fastify.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return reply.status(409).send({ error: `This ${field} is already taken` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await fastify.prisma.user.create({
      data: { email, username, displayName, passwordHash },
      select: { id: true, email: true, username: true, displayName: true, tier: true, avatarUrl: true, createdAt: true },
    });

    const token = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier });
    const refreshToken = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier }, { expiresIn: '30d' });

    return reply.status(201).send({ user, token, refreshToken });
  });

  // ─── LOGIN ──────────────────────────────────────────────────
  fastify.post('/api/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['login', 'password'],
        properties: {
          login: { type: 'string' }, // email or username
          password: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { login, password } = request.body as any;

    const user = await fastify.prisma.user.findFirst({
      where: { OR: [{ email: login }, { username: login }] },
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Update last login
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier });
    const refreshToken = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier }, { expiresIn: '30d' });

    return {
      user: {
        id: user.id, email: user.email, username: user.username,
        displayName: user.displayName, tier: user.tier, avatarUrl: user.avatarUrl,
      },
      token,
      refreshToken,
    };
  });

  // ─── REFRESH TOKEN ──────────────────────────────────────────
  fastify.post('/api/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as any;
    if (!refreshToken) return reply.status(400).send({ error: 'Refresh token required' });

    try {
      const decoded = fastify.jwt.verify<{ userId: string; email: string; tier: string }>(refreshToken);
      const user = await fastify.prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return reply.status(401).send({ error: 'User not found' });

      const token = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier });
      const newRefreshToken = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier }, { expiresIn: '30d' });

      return { token, refreshToken: newRefreshToken };
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // ─── GET CURRENT USER ───────────────────────────────────────
  fastify.get('/api/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true, email: true, username: true, displayName: true,
        tier: true, avatarUrl: true, createdAt: true,
        teams: { select: { id: true, name: true, leagueId: true, league: { select: { name: true } } } },
        ownedLeagues: { select: { id: true, name: true, status: true } },
      },
    });
    if (!user) return { error: 'User not found' };
    return { user };
  });

  // ─── UPDATE PROFILE ─────────────────────────────────────────
  fastify.patch('/api/auth/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { displayName, avatarUrl } = request.body as any;
    const user = await fastify.prisma.user.update({
      where: { id: request.user.userId },
      data: {
        ...(displayName && { displayName }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: { id: true, email: true, username: true, displayName: true, tier: true, avatarUrl: true },
    });
    return { user };
  });
};

export default authRoutes;