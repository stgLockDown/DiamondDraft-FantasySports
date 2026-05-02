/**
 * Per-sport default scoring and roster configurations.
 *
 * These are consumed by the league-creation API and by the scoring
 * engine when no custom rules are supplied. They intentionally stay
 * conservative — users can (and are expected to) customize via the
 * league settings UI.
 */

import type { Sport } from '@prisma/client';

// ─── Roster configs ──────────────────────────────────────────────────
export const ROSTER_CONFIGS: Record<Sport, Record<string, number>> = {
  MLB: {
    C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1, OF: 3, UTIL: 1,
    SP: 5, RP: 2, BN: 5, IL: 2,
  },
  NFL: {
    QB: 1, RB: 2, WR: 2, TE: 1, 'W/R/T': 1, K: 1, DEF: 1, BN: 6, IR: 2,
  },
  NBA: {
    PG: 1, SG: 1, SF: 1, PF: 1, C: 1, G: 1, F: 1, UTIL: 2, BN: 3, IL: 2,
  },
  NHL: {
    C: 2, LW: 2, RW: 2, D: 4, G: 2, UTIL: 1, BN: 4, IR: 2,
  },
};

// Positions that appear in each sport's player pool (used for position filters / validation).
export const POSITIONS: Record<Sport, string[]> = {
  MLB: ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'SP', 'RP'],
  NFL: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'],
  NBA: ['PG', 'SG', 'SF', 'PF', 'C'],
  NHL: ['C', 'LW', 'RW', 'D', 'G'],
};

// ─── Default scoring configs ─────────────────────────────────────────
//
// Shape: flat category → points map. The existing MLB scoring engine
// already understands this, so NFL/NBA/NHL just define their own keys.
export const SCORING_DEFAULTS: Record<Sport, Record<string, number>> = {
  MLB: {
    // hitters
    R: 1, H: 1, '2B': 2, '3B': 3, HR: 4, RBI: 1, BB: 1, SB: 2, SO_hitter: -0.5,
    // pitchers
    IP: 2.25, K: 1, W: 5, SV: 5, HLD: 2, ER: -2, H_allowed: -0.5, BB_allowed: -0.5,
  },
  NFL: {
    // passing
    passYd: 0.04, passTD: 4, INT: -2,
    // rushing
    rushYd: 0.1, rushTD: 6,
    // receiving
    rec: 0.5, recYd: 0.1, recTD: 6,
    // return
    retTD: 6,
    // misc
    fumble_lost: -2, '2pt': 2,
    // kicking
    'FG_0-39': 3, 'FG_40-49': 4, 'FG_50+': 5, XP: 1,
    // defense
    DEF_SACK: 1, DEF_INT: 2, DEF_FR: 2, DEF_TD: 6, DEF_SAFETY: 2, DEF_BLK: 2,
    'DEF_PA_0': 10, 'DEF_PA_1-6': 7, 'DEF_PA_7-13': 4, 'DEF_PA_14-20': 1,
    'DEF_PA_21-27': 0, 'DEF_PA_28-34': -1, 'DEF_PA_35+': -4,
  },
  NBA: {
    PTS: 1, REB: 1.2, AST: 1.5, STL: 3, BLK: 3,
    TOV: -1, FG_MADE: 0, FG_MISS: -0.5, FT_MADE: 0, FT_MISS: -0.5, '3PM': 0.5,
  },
  NHL: {
    G: 6, A: 4, SOG: 0.5, BLK: 1, HIT: 0.5, PIM: -0.5,
    // goalies
    GWIN: 6, SAVE: 0.2, GA: -3, SO: 5,
  },
};

// Leagues with these formats behave differently at scoring time; for now
// they're informational only (the engine still consumes SCORING_DEFAULTS).
export const SUPPORTED_FORMATS: Record<Sport, string[]> = {
  MLB: ['HEAD_TO_HEAD_POINTS', 'ROTO', 'HEAD_TO_HEAD_CATEGORIES', 'POINTS'],
  NFL: ['HEAD_TO_HEAD_POINTS', 'POINTS'],
  NBA: ['HEAD_TO_HEAD_POINTS', 'HEAD_TO_HEAD_CATEGORIES', 'ROTO'],
  NHL: ['HEAD_TO_HEAD_POINTS', 'HEAD_TO_HEAD_CATEGORIES', 'ROTO'],
};

export function defaultRosterConfig(sport: Sport): Record<string, number> {
  return { ...ROSTER_CONFIGS[sport] };
}

export function defaultScoringConfig(sport: Sport): Record<string, number> {
  return { ...SCORING_DEFAULTS[sport] };
}

export function supportedSports(): Sport[] {
  return ['MLB', 'NFL', 'NBA', 'NHL'];
}