import { FastifyPluginAsync } from 'fastify';
import {
  fetchSportScoreboard,
  fetchSportTeams,
  fetchSportNews,
  fetchSportRoster,
  fetchSportSnapshot,
} from '../services/sportApi';
import { supportedSports, defaultRosterConfig, defaultScoringConfig } from '../utils/sportConfig';

const SUPPORTED = new Set(supportedSports());

/**
 * Multi-sport routes for NFL / NBA / NHL.
 *
 * The existing MLB Stats Hub endpoints (under /api/stats/...) stay
 * baseball-specific. These new routes follow the /api/sports/<sport>/*
 * pattern so the frontend can fetch any sport through a single shape.
 *
 * All endpoints are best-effort proxies to ESPN's public JSON; they
 * never throw into the UI.
 */
const multiSportRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── List supported sports + their default configs ─────────────────
  fastify.get('/api/sports', async () => {
    const sports = supportedSports();
    return {
      sports: sports.map((s) => ({
        sport: s,
        roster: defaultRosterConfig(s),
        scoring: defaultScoringConfig(s),
      })),
    };
  });

  // ─── Per-sport snapshot: scoreboard + teams + news in one call ─────
  fastify.get('/api/sports/:sport/snapshot', async (request, reply) => {
    const { sport } = request.params as { sport: string };
    const s = String(sport || '').toUpperCase();
    if (s === 'MLB') {
      return reply.status(400).send({
        error: 'Use the existing /api/stats endpoints for MLB.',
        code: 'use_mlb_stats_hub',
      });
    }
    if (!SUPPORTED.has(s as any)) return reply.status(404).send({ error: 'Unknown sport' });
    return await fetchSportSnapshot(s as any);
  });

  // ─── Scoreboard ────────────────────────────────────────────────────
  fastify.get('/api/sports/:sport/scoreboard', async (request, reply) => {
    const { sport } = request.params as { sport: string };
    const s = String(sport || '').toUpperCase();
    if (s === 'MLB' || !SUPPORTED.has(s as any)) return reply.status(404).send({ error: 'Unknown sport' });
    return { games: await fetchSportScoreboard(s as any) };
  });

  // ─── Teams ─────────────────────────────────────────────────────────
  fastify.get('/api/sports/:sport/teams', async (request, reply) => {
    const { sport } = request.params as { sport: string };
    const s = String(sport || '').toUpperCase();
    if (s === 'MLB' || !SUPPORTED.has(s as any)) return reply.status(404).send({ error: 'Unknown sport' });
    return { teams: await fetchSportTeams(s as any) };
  });

  // ─── Roster for a single team ──────────────────────────────────────
  fastify.get('/api/sports/:sport/teams/:teamId/roster', async (request, reply) => {
    const { sport, teamId } = request.params as { sport: string; teamId: string };
    const s = String(sport || '').toUpperCase();
    if (s === 'MLB' || !SUPPORTED.has(s as any)) return reply.status(404).send({ error: 'Unknown sport' });
    return { players: await fetchSportRoster(s as any, teamId) };
  });

  // ─── News ──────────────────────────────────────────────────────────
  fastify.get('/api/sports/:sport/news', async (request, reply) => {
    const { sport } = request.params as { sport: string };
    const s = String(sport || '').toUpperCase();
    if (s === 'MLB' || !SUPPORTED.has(s as any)) return reply.status(404).send({ error: 'Unknown sport' });
    return { news: await fetchSportNews(s as any) };
  });
};

export default multiSportRoutes;