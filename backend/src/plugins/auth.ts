import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string; tier: string };
    user: { userId: string; email: string; tier: string };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.expiresIn },
  });

  // Required auth decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  // Optional auth decorator - doesn't fail if no token
  fastify.decorate('optionalAuth', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      // Silently continue without auth
    }
  });
};

export default fp(authPlugin, { name: 'auth' });