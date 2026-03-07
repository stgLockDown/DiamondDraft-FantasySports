/**
 * Data Sync Routes
 * Admin endpoints for managing MLB data synchronization
 */

import { FastifyInstance } from 'fastify';
import { fullSync, syncAllPlayers, syncSeasonStats, syncGameBoxscores, getLiveScores } from '../services/dataSync';
import { getSchedulerStatus } from '../services/scheduler';
import {
  getAllMLBTeams,
  getTodaysGames,
  getStatLeaders,
  getStandings,
} from '../services/mlbApi';

export default async function syncRoutes(fastify: FastifyInstance) {

  // ─── TRIGGER FULL SYNC ────────────────────────────────────
  fastify.post('/api/sync/full', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    // Only allow admin/commissioner tier users
    if (user.tier !== 'COMMISSIONER_PLUS') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    // Run sync in background
    const season = (request.query as any).season
      ? parseInt((request.query as any).season)
      : new Date().getFullYear();

    // Don't await - run in background
    fullSync(season).catch(err => {
      fastify.log.error(`Full sync failed: ${err.message}`);
    });

    return { message: `Full sync started for ${season} season`, status: 'running' };
  });

  // ─── SYNC PLAYERS ONLY ────────────────────────────────────
  fastify.post('/api/sync/players', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.tier !== 'COMMISSIONER_PLUS') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const season = (request.query as any).season
      ? parseInt((request.query as any).season)
      : new Date().getFullYear();

    syncAllPlayers(season).catch(err => {
      fastify.log.error(`Player sync failed: ${err.message}`);
    });

    return { message: `Player sync started for ${season}`, status: 'running' };
  });

  // ─── SYNC STATS ONLY ─────────────────────────────────────
  fastify.post('/api/sync/stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.tier !== 'COMMISSIONER_PLUS') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const season = (request.query as any).season
      ? parseInt((request.query as any).season)
      : new Date().getFullYear();

    syncSeasonStats(season).catch(err => {
      fastify.log.error(`Stats sync failed: ${err.message}`);
    });

    return { message: `Stats sync started for ${season}`, status: 'running' };
  });

  // ─── SYNC BOXSCORES ──────────────────────────────────────
  fastify.post('/api/sync/boxscores', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.tier !== 'COMMISSIONER_PLUS') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const date = (request.query as any).date || undefined;

    syncGameBoxscores(date).catch(err => {
      fastify.log.error(`Boxscore sync failed: ${err.message}`);
    });

    return { message: `Boxscore sync started${date ? ` for ${date}` : ''}`, status: 'running' };
  });

  // ─── SCHEDULER STATUS ────────────────────────────────────
  fastify.get('/api/sync/status', {
    preHandler: [fastify.authenticate],
  }, async () => {
    const playerCount = await fastify.prisma.player.count();
    const statCount = await fastify.prisma.playerStat.count();

    return {
      database: {
        players: playerCount,
        gameStats: statCount,
      },
      scheduler: getSchedulerStatus(),
    };
  });

  // ─── LIVE SCORES (public) ────────────────────────────────
  fastify.get('/api/live/scores', async () => {
    const scores = await getLiveScores();
    return { games: scores, timestamp: new Date().toISOString() };
  });

  // ─── LIVE MLB TEAMS (public) ─────────────────────────────
  fastify.get('/api/live/teams', async () => {
    const teams = await getAllMLBTeams();
    return { teams };
  });

  // ─── TODAY'S GAMES (public) ──────────────────────────────
  fastify.get('/api/live/games', async (request) => {
    const date = (request.query as any).date || undefined;
    const games = date
      ? await (await import('../services/mlbApi')).getGamesByDate(date)
      : await getTodaysGames();
    return { games, date: date || new Date().toISOString().split('T')[0] };
  });

  // ─── STAT LEADERS (public) ──────────────────────────────
  fastify.get('/api/live/leaders', async (request) => {
    const category = (request.query as any).category || 'homeRuns';
    const season = (request.query as any).season
      ? parseInt((request.query as any).season)
      : new Date().getFullYear();
    const limit = (request.query as any).limit
      ? parseInt((request.query as any).limit)
      : 20;

    const leaders = await getStatLeaders(category, season, limit);
    return { category, season, leaders };
  });

  // ─── MLB STANDINGS (public) ─────────────────────────────
  fastify.get('/api/live/standings', async (request) => {
    const season = (request.query as any).season
      ? parseInt((request.query as any).season)
      : new Date().getFullYear();

    const standings = await getStandings(season);
    return standings;
  });
}