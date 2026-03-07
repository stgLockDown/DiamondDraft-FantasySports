/**
 * Scheduler Service
 * Runs periodic data sync jobs for live MLB data
 */

import { fullSync, syncSeasonStats, syncGameBoxscores, getLiveScores } from './dataSync';

interface ScheduledJob {
  name: string;
  interval: number; // milliseconds
  handler: () => Promise<void>;
  timer?: ReturnType<typeof setInterval>;
  lastRun?: Date;
  running: boolean;
}

const jobs: Map<string, ScheduledJob> = new Map();

// ─── JOB DEFINITIONS ─────────────────────────────────────────

function registerJobs() {
  // Full player + stats sync: every 6 hours
  jobs.set('full-sync', {
    name: 'Full Player & Stats Sync',
    interval: 6 * 60 * 60 * 1000, // 6 hours
    running: false,
    handler: async () => {
      console.log('[Scheduler] Running full sync...');
      await fullSync();
    },
  });

  // Season stats update: every 30 minutes during game hours
  jobs.set('stats-sync', {
    name: 'Season Stats Sync',
    interval: 30 * 60 * 1000, // 30 minutes
    running: false,
    handler: async () => {
      if (!isDuringGameHours()) return;
      console.log('[Scheduler] Running stats sync...');
      await syncSeasonStats();
    },
  });

  // Boxscore sync: every 15 minutes during game hours
  jobs.set('boxscore-sync', {
    name: 'Game Boxscore Sync',
    interval: 15 * 60 * 1000, // 15 minutes
    running: false,
    handler: async () => {
      if (!isDuringGameHours()) return;
      console.log('[Scheduler] Running boxscore sync...');
      await syncGameBoxscores();
    },
  });
}

// ─── HELPERS ──────────────────────────────────────────────────

function isDuringGameHours(): boolean {
  const now = new Date();
  const etHour = now.getUTCHours() - 4; // Rough ET conversion
  // MLB games typically run from ~12pm to ~1am ET
  return etHour >= 11 || etHour <= 1;
}

// ─── SCHEDULER CONTROL ───────────────────────────────────────

export function startScheduler(): void {
  console.log('[Scheduler] Starting scheduled jobs...');
  registerJobs();

  for (const [key, job] of jobs) {
    job.timer = setInterval(async () => {
      if (job.running) {
        console.log(`[Scheduler] Skipping ${job.name} - still running`);
        return;
      }
      job.running = true;
      try {
        await job.handler();
        job.lastRun = new Date();
      } catch (err: any) {
        console.error(`[Scheduler] Error in ${job.name}: ${err.message}`);
      } finally {
        job.running = false;
      }
    }, job.interval);

    console.log(`  ✓ ${job.name}: every ${job.interval / 60000} minutes`);
  }
}

export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduled jobs...');
  for (const [key, job] of jobs) {
    if (job.timer) {
      clearInterval(job.timer);
      job.timer = undefined;
    }
  }
}

export function getSchedulerStatus(): any[] {
  return Array.from(jobs.entries()).map(([key, job]) => ({
    id: key,
    name: job.name,
    intervalMinutes: job.interval / 60000,
    running: job.running,
    lastRun: job.lastRun?.toISOString() || null,
  }));
}