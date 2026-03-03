// ─── SCORING ENGINE ─────────────────────────────────────────────
// Supports points, categories, roto, and custom scoring

export interface ScoringCategory {
  key: string;
  label: string;
  type: 'hitting' | 'pitching';
  pointValue: number;
  isNegative?: boolean;
}

// Default scoring presets
export const SCORING_PRESETS = {
  STANDARD_POINTS: {
    name: 'Standard Points',
    hitting: {
      runs: 1, rbi: 1, hr: 4, sb: 2, hits: 0.5, doubles: 1, triples: 2,
      bb: 1, hbp: 1, so: -0.5, cs: -1,
    },
    pitching: {
      ip: 3, pitcherSO: 1, pitcherW: 5, pitcherSV: 5, pitcherHLD: 3,
      pitcherER: -2, pitcherH: -0.5, pitcherBB: -1, pitcherL: -3, pitcherBS: -3,
    },
  },
  ROTO_5X5: {
    name: 'Standard 5x5 Roto',
    hitting: { battingAvg: 'AVG', hr: 'HR', rbi: 'RBI', runs: 'R', sb: 'SB' },
    pitching: { era: 'ERA', whip: 'WHIP', pitcherW: 'W', pitcherSO: 'K', pitcherSV: 'SV' },
  },
  SABERMETRIC: {
    name: 'Sabermetric',
    hitting: {
      runs: 1, hr: 4, rbi: 1, sb: 2, bb: 1, hits: 0.5,
      so: -0.5, cs: -1, doubles: 1.5, triples: 2.5, hbp: 1,
    },
    pitching: {
      ip: 3, pitcherSO: 1.5, pitcherW: 3, pitcherSV: 5, pitcherHLD: 3.5,
      pitcherER: -2.5, pitcherH: -0.5, pitcherBB: -1.5, pitcherL: -2, pitcherBS: -3,
    },
  },
};

export function calculateFantasyPoints(
  stats: Record<string, number>,
  scoringConfig: Record<string, number>
): number {
  let total = 0;
  for (const [key, value] of Object.entries(scoringConfig)) {
    if (stats[key] !== undefined) {
      total += stats[key] * value;
    }
  }
  return Math.round(total * 100) / 100; // Round to 2 decimal places
}

export function calculateRotoStandings(
  teamStats: Array<{ teamId: string; stats: Record<string, number> }>,
  categories: string[]
): Array<{ teamId: string; rotoPoints: number; categoryRanks: Record<string, number> }> {
  const results = teamStats.map((t) => ({
    teamId: t.teamId,
    rotoPoints: 0,
    categoryRanks: {} as Record<string, number>,
  }));

  for (const cat of categories) {
    // Sort teams by this category (higher is better for most, lower for ERA/WHIP)
    const isLowerBetter = ['era', 'whip'].includes(cat.toLowerCase());
    const sorted = [...teamStats].sort((a, b) =>
      isLowerBetter
        ? (a.stats[cat] || 0) - (b.stats[cat] || 0)
        : (b.stats[cat] || 0) - (a.stats[cat] || 0)
    );

    sorted.forEach((team, index) => {
      const rank = index + 1;
      const points = teamStats.length - rank + 1;
      const result = results.find((r) => r.teamId === team.teamId);
      if (result) {
        result.categoryRanks[cat] = rank;
        result.rotoPoints += points;
      }
    });
  }

  return results.sort((a, b) => b.rotoPoints - a.rotoPoints);
}

// Default roster configuration
export const DEFAULT_ROSTER_CONFIG = {
  C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1,
  OF: 3, UTIL: 1, SP: 5, RP: 2, P: 0,
  BN: 5, IL: 2, MiLB: 0,
};

// Default scoring config (standard points)
export const DEFAULT_SCORING_CONFIG = SCORING_PRESETS.STANDARD_POINTS;