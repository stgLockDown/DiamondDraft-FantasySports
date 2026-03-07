/**
 * Data Sync Service
 * Pulls live MLB data and populates the PostgreSQL database
 */

import { PrismaClient } from '@prisma/client';
import {
  getAllMLBPlayers,
  getSeasonStats,
  getGamesByDate,
  getGameBoxscore,
  mapMLBPosition,
  MLB_TEAM_MAP,
} from './mlbApi';
import { calculatePointsFromBoxscore, SCORING_PRESETS } from '../utils/scoring';

const prisma = new PrismaClient();

// ─── SYNC ALL MLB PLAYERS ─────────────────────────────────────

export async function syncAllPlayers(season: number = new Date().getFullYear()): Promise<{ created: number; updated: number }> {
  console.log(`[DataSync] Syncing all MLB players for ${season}...`);
  const players = await getAllMLBPlayers(season);
  let created = 0;
  let updated = 0;

  for (const p of players) {
    const positions = mapMLBPosition(p.primaryPosition.abbreviation);
    const teamAbbr = p.currentTeam ? (MLB_TEAM_MAP[p.currentTeam.id] || 'FA') : 'FA';

    const playerData = {
      firstName: p.firstName,
      lastName: p.lastName,
      fullName: p.fullName,
      team: teamAbbr,
      teamFullName: p.currentTeam?.name || null,
      position: positions[0] || 'UTIL',
      eligiblePositions: positions,
      status: p.active ? 'ACTIVE' as const : 'INACTIVE' as any,
      headshotUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${p.id}/headshot/67/current`,
      bats: p.batSide?.code || 'R',
      throws: p.pitchHand?.code || 'R',
      age: p.currentAge || null,
    };

    try {
      const existing = await prisma.player.findUnique({
        where: { mlbId: p.id },
      });

      if (existing) {
        await prisma.player.update({
          where: { mlbId: p.id },
          data: playerData,
        });
        updated++;
      } else {
        await prisma.player.create({
          data: {
            mlbId: p.id,
            ...playerData,
          },
        });
        created++;
      }
    } catch (err: any) {
      if (!err.message?.includes('Unique constraint')) {
        console.error(`[DataSync] Error syncing player ${p.fullName}: ${err.message}`);
      }
    }
  }

  console.log(`[DataSync] Players synced: ${created} created, ${updated} updated`);
  return { created, updated };
}

// ─── SYNC SEASON STATS (BULK) ─────────────────────────────────

export async function syncSeasonStats(season: number = new Date().getFullYear()): Promise<{ hitting: number; pitching: number }> {
  console.log(`[DataSync] Syncing season stats for ${season}...`);

  // Sync hitting stats
  const hittingSplits = await getSeasonStats('hitting', season, 800);
  let hittingCount = 0;

  for (const split of hittingSplits) {
    const mlbId = split.player?.id;
    if (!mlbId) continue;

    const s = split.stat;
    try {
      await prisma.player.update({
        where: { mlbId },
        data: {
          gamesPlayed: s.gamesPlayed || 0,
          atBats: s.atBats || 0,
          hits: s.hits || 0,
          homeRuns: s.homeRuns || 0,
          rbi: s.rbi || 0,
          stolenBases: s.stolenBases || 0,
          battingAvg: parseFloat(s.avg) || 0,
          obp: parseFloat(s.obp) || 0,
          slg: parseFloat(s.slg) || 0,
          ops: parseFloat(s.ops) || 0,
        },
      });
      hittingCount++;
    } catch {
      // Player not in our DB yet, skip
    }
  }

  // Sync pitching stats
  const pitchingSplits = await getSeasonStats('pitching', season, 500);
  let pitchingCount = 0;

  for (const split of pitchingSplits) {
    const mlbId = split.player?.id;
    if (!mlbId) continue;

    const s = split.stat;
    try {
      await prisma.player.update({
        where: { mlbId },
        data: {
          wins_stat: s.wins || 0,
          losses_stat: s.losses || 0,
          era: parseFloat(s.era) || 0,
          whip: parseFloat(s.whip) || 0,
          strikeouts: s.strikeOuts || 0,
          saves: s.saves || 0,
          inningsPitched: parseFloat(s.inningsPitched) || 0,
          gamesPlayed: s.gamesPlayed || 0,
        },
      });
      pitchingCount++;
    } catch {
      // Player not in our DB yet, skip
    }
  }

  console.log(`[DataSync] Stats synced: ${hittingCount} hitters, ${pitchingCount} pitchers`);
  return { hitting: hittingCount, pitching: pitchingCount };
}

// ─── SYNC GAME BOX SCORES (for daily fantasy scoring) ─────────

export async function syncGameBoxscores(date?: string): Promise<{ players: number }> {
  const gameDate = date || new Date().toISOString().split('T')[0];
  console.log(`[DataSync] Syncing boxscores for ${gameDate}...`);

  const games = await getGamesByDate(gameDate);
  let playerCount = 0;
  const season = new Date(gameDate).getFullYear();
  const defaultPreset = SCORING_PRESETS[0]; // DiamondDraft Standard

  for (const game of games) {
    if (game.status !== 'Final') continue;

    try {
      const boxscore = await getGameBoxscore(game.gamePk);
      const allPlayers = [
        ...Object.values(boxscore.teams?.away?.players || {}),
        ...Object.values(boxscore.teams?.home?.players || {}),
      ] as any[];

      for (const bp of allPlayers) {
        if (!bp.person?.id) continue;
        const mlbId = bp.person.id;

        const player = await prisma.player.findUnique({ where: { mlbId } });
        if (!player) continue;

        const hitting = bp.stats?.batting;
        const pitching = bp.stats?.pitching;

        // Check if we already have stats for this game
        const existing = await prisma.playerStat.findFirst({
          where: {
            playerId: player.id,
            gameId: String(game.gamePk),
          },
        });
        if (existing) continue;

        // Save hitting game stats
        if (hitting && ((hitting.atBats || 0) > 0 || (hitting.runs || 0) > 0 || (hitting.hits || 0) > 0 || (hitting.baseOnBalls || 0) > 0)) {
          const fantasyPts = calculatePointsFromBoxscore(hitting, 'hitting', defaultPreset);

          try {
            await prisma.playerStat.create({
              data: {
                playerId: player.id,
                date: new Date(gameDate),
                season,
                gameId: String(game.gamePk),
                ab: hitting.atBats || 0,
                runs: hitting.runs || 0,
                hits: hitting.hits || 0,
                doubles: hitting.doubles || 0,
                triples: hitting.triples || 0,
                hr: hitting.homeRuns || 0,
                rbi: hitting.rbi || 0,
                sb: hitting.stolenBases || 0,
                cs: hitting.caughtStealing || 0,
                bb: hitting.baseOnBalls || 0,
                so: hitting.strikeOuts || 0,
                hbp: hitting.hitByPitch || 0,
                fantasyPoints: fantasyPts,
              },
            });
            playerCount++;
          } catch {
            // Duplicate, skip
          }
        }

        // Save pitching game stats
        if (pitching && pitching.inningsPitched && pitching.inningsPitched !== '0.0') {
          const fantasyPts = calculatePointsFromBoxscore(pitching, 'pitching', defaultPreset);

          try {
            await prisma.playerStat.create({
              data: {
                playerId: player.id,
                date: new Date(gameDate),
                season,
                gameId: String(game.gamePk),
                ip: parseFloat(pitching.inningsPitched) || 0,
                pitcherH: pitching.hits || 0,
                pitcherR: pitching.runs || 0,
                pitcherER: pitching.earnedRuns || 0,
                pitcherBB: pitching.baseOnBalls || 0,
                pitcherSO: pitching.strikeOuts || 0,
                pitcherW: pitching.wins ? 1 : 0,
                pitcherL: pitching.losses ? 1 : 0,
                pitcherSV: pitching.saves ? 1 : 0,
                pitcherBS: pitching.blownSaves ? 1 : 0,
                pitcherHLD: pitching.holds ? 1 : 0,
                fantasyPoints: fantasyPts,
              },
            });
            playerCount++;
          } catch {
            // Duplicate, skip
          }
        }
      }

      // Rate limit: small delay between games
      await new Promise(r => setTimeout(r, 250));
    } catch (err: any) {
      console.error(`[DataSync] Error syncing boxscore for game ${game.gamePk}: ${err.message}`);
    }
  }

  console.log(`[DataSync] Boxscores synced: ${playerCount} player game stats`);
  return { players: playerCount };
}

// ─── GET LIVE GAME SCORES (for real-time updates) ─────────────

export async function getLiveScores(): Promise<any[]> {
  const games = await getGamesByDate(new Date().toISOString().split('T')[0]);
  return games.map(g => ({
    gamePk: g.gamePk,
    status: g.status,
    detailedState: g.detailedState,
    away: g.awayTeam,
    home: g.homeTeam,
    inning: g.currentInning,
    inningHalf: g.inningHalf,
    isTopInning: g.isTopInning,
  }));
}

// ─── FULL SYNC (run on startup or scheduled) ──────────────────

export async function fullSync(season?: number): Promise<{
  players: { created: number; updated: number };
  stats: { hitting: number; pitching: number };
}> {
  const yr = season || new Date().getFullYear();
  console.log(`\n⚾ [DataSync] Starting full sync for ${yr} season...\n`);

  const t0 = Date.now();

  // Step 1: Sync all players
  const playerResult = await syncAllPlayers(yr);
  console.log(`  ✓ Players: ${playerResult.created} new, ${playerResult.updated} updated`);

  // Step 2: Sync season stats
  const statsResult = await syncSeasonStats(yr);
  console.log(`  ✓ Stats: ${statsResult.hitting} hitters, ${statsResult.pitching} pitchers`);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n⚾ [DataSync] Full sync complete in ${elapsed}s\n`);

  return { players: playerResult, stats: statsResult };
}

export { prisma };