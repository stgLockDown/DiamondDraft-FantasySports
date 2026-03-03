import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import formbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import leagueRoutes from './routes/leagues';
import teamRoutes from './routes/teams';
import playerRoutes from './routes/players';
import tradeRoutes from './routes/trades';
import draftRoutes from './routes/draft';
import chatRoutes from './routes/chat';
import { setupWebSocket } from './websocket/handler';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  });

  // ─── PLUGINS ────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: config.nodeEnv === 'production'
      ? config.cors.origin
      : true,
    credentials: true,
  });

  await fastify.register(formbody);
  await fastify.register(websocket);
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // ─── API ROUTES ─────────────────────────────────────────────
  await fastify.register(authRoutes);
  await fastify.register(leagueRoutes);
  await fastify.register(teamRoutes);
  await fastify.register(playerRoutes);
  await fastify.register(tradeRoutes);
  await fastify.register(draftRoutes);
  await fastify.register(chatRoutes);

  // ─── WEBSOCKET ──────────────────────────────────────────────
  setupWebSocket(fastify);

  // ─── HEALTH CHECK ───────────────────────────────────────────
  fastify.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  }));

  // ─── SCORING PRESETS ────────────────────────────────────────
  fastify.get('/api/scoring-presets', async () => {
    const { SCORING_PRESETS } = await import('./utils/scoring');
    return { presets: SCORING_PRESETS };
  });

  // ─── MLB TEAMS REFERENCE ───────────────────────────────────
  fastify.get('/api/mlb-teams', async () => ({
    teams: [
      { abbr: 'ARI', name: 'Arizona Diamondbacks', league: 'NL', division: 'West' },
      { abbr: 'ATL', name: 'Atlanta Braves', league: 'NL', division: 'East' },
      { abbr: 'BAL', name: 'Baltimore Orioles', league: 'AL', division: 'East' },
      { abbr: 'BOS', name: 'Boston Red Sox', league: 'AL', division: 'East' },
      { abbr: 'CHC', name: 'Chicago Cubs', league: 'NL', division: 'Central' },
      { abbr: 'CHW', name: 'Chicago White Sox', league: 'AL', division: 'Central' },
      { abbr: 'CIN', name: 'Cincinnati Reds', league: 'NL', division: 'Central' },
      { abbr: 'CLE', name: 'Cleveland Guardians', league: 'AL', division: 'Central' },
      { abbr: 'COL', name: 'Colorado Rockies', league: 'NL', division: 'West' },
      { abbr: 'DET', name: 'Detroit Tigers', league: 'AL', division: 'Central' },
      { abbr: 'HOU', name: 'Houston Astros', league: 'AL', division: 'West' },
      { abbr: 'KC', name: 'Kansas City Royals', league: 'AL', division: 'Central' },
      { abbr: 'LAA', name: 'Los Angeles Angels', league: 'AL', division: 'West' },
      { abbr: 'LAD', name: 'Los Angeles Dodgers', league: 'NL', division: 'West' },
      { abbr: 'MIA', name: 'Miami Marlins', league: 'NL', division: 'East' },
      { abbr: 'MIL', name: 'Milwaukee Brewers', league: 'NL', division: 'Central' },
      { abbr: 'MIN', name: 'Minnesota Twins', league: 'AL', division: 'Central' },
      { abbr: 'NYM', name: 'New York Mets', league: 'NL', division: 'East' },
      { abbr: 'NYY', name: 'New York Yankees', league: 'AL', division: 'East' },
      { abbr: 'OAK', name: 'Oakland Athletics', league: 'AL', division: 'West' },
      { abbr: 'PHI', name: 'Philadelphia Phillies', league: 'NL', division: 'East' },
      { abbr: 'PIT', name: 'Pittsburgh Pirates', league: 'NL', division: 'Central' },
      { abbr: 'SD', name: 'San Diego Padres', league: 'NL', division: 'West' },
      { abbr: 'SF', name: 'San Francisco Giants', league: 'NL', division: 'West' },
      { abbr: 'SEA', name: 'Seattle Mariners', league: 'AL', division: 'West' },
      { abbr: 'STL', name: 'St. Louis Cardinals', league: 'NL', division: 'Central' },
      { abbr: 'TB', name: 'Tampa Bay Rays', league: 'AL', division: 'East' },
      { abbr: 'TEX', name: 'Texas Rangers', league: 'AL', division: 'West' },
      { abbr: 'TOR', name: 'Toronto Blue Jays', league: 'AL', division: 'East' },
      { abbr: 'WSH', name: 'Washington Nationals', league: 'NL', division: 'East' },
    ],
  }));

  // ─── SERVE FRONTEND (Production) ───────────────────────────
  if (config.nodeEnv === 'production') {
    const clientPath = path.join(__dirname, '..', 'public');
    await fastify.register(fastifyStatic, {
      root: clientPath,
      prefix: '/',
      wildcard: false,
    });

    // SPA fallback: serve index.html for all non-API routes
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return fastify;
}

// ─── START SERVER ─────────────────────────────────────────────
async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: config.port, host: config.host });
    console.log(`\n⚾ DiamondDraft API running at http://${config.host}:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Health: http://localhost:${config.port}/api/health\n`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export { buildServer };