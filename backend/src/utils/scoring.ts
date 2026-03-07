/**
 * DiamondDraft Fantasy Scoring Engine
 * Custom scoring system designed to reward well-rounded players
 * and create exciting, differentiated fantasy experiences.
 */

// ─── SCORING PRESETS ──────────────────────────────────────────

export interface ScoringCategory {
  key: string;
  label: string;
  group: 'hitting' | 'pitching';
  points: number;
  description?: string;
}

export interface ScoringPreset {
  id: string;
  name: string;
  description: string;
  categories: ScoringCategory[];
}

/**
 * DIAMONDDRAFT STANDARD
 * Our flagship scoring system. Balanced, rewarding, and fun.
 * Key differentiators from ESPN/Yahoo:
 * - Rewards walks and OBP skills (not just power)
 * - Bonus points for multi-hit games and complete games
 * - Negative points for caught stealing and GIDP
 * - Quality start bonuses for pitchers
 * - Decimal scoring for partial innings
 */
const DIAMONDDRAFT_STANDARD: ScoringPreset = {
  id: 'dd-standard',
  name: 'DiamondDraft Standard',
  description: 'Our flagship balanced scoring system. Rewards all-around excellence.',
  categories: [
    // ─── HITTING ────────────────────────────────
    { key: 'single', label: 'Single', group: 'hitting', points: 1, description: 'Base hit (1B)' },
    { key: 'double', label: 'Double', group: 'hitting', points: 2, description: 'Two-base hit' },
    { key: 'triple', label: 'Triple', group: 'hitting', points: 3, description: 'Three-base hit' },
    { key: 'homeRun', label: 'Home Run', group: 'hitting', points: 5, description: 'Four-base hit' },
    { key: 'run', label: 'Run Scored', group: 'hitting', points: 1, description: 'Run scored' },
    { key: 'rbi', label: 'RBI', group: 'hitting', points: 1, description: 'Run batted in' },
    { key: 'walk', label: 'Walk', group: 'hitting', points: 1, description: 'Base on balls' },
    { key: 'hitByPitch', label: 'Hit By Pitch', group: 'hitting', points: 1, description: 'Hit by pitch' },
    { key: 'stolenBase', label: 'Stolen Base', group: 'hitting', points: 2, description: 'Stolen base' },
    { key: 'caughtStealing', label: 'Caught Stealing', group: 'hitting', points: -1, description: 'Caught stealing' },
    { key: 'strikeout', label: 'Strikeout (Batter)', group: 'hitting', points: -0.5, description: 'Batter strikeout' },
    { key: 'gidp', label: 'Grounded Into DP', group: 'hitting', points: -1, description: 'Grounded into double play' },
    { key: 'sacFly', label: 'Sacrifice Fly', group: 'hitting', points: 0.5, description: 'Sacrifice fly' },
    { key: 'multiHitBonus', label: '3+ Hit Game Bonus', group: 'hitting', points: 2, description: 'Bonus for 3+ hits in a game' },
    { key: 'cycleBonus', label: 'Cycle Bonus', group: 'hitting', points: 10, description: 'Hit for the cycle' },
    { key: 'grandSlam', label: 'Grand Slam Bonus', group: 'hitting', points: 5, description: 'Grand slam (on top of HR points)' },

    // ─── PITCHING ───────────────────────────────
    { key: 'inningPitched', label: 'Inning Pitched', group: 'pitching', points: 3, description: 'Full inning pitched (decimal: 1 out = 1pt)' },
    { key: 'pitcherStrikeout', label: 'Strikeout (Pitcher)', group: 'pitching', points: 1, description: 'Pitcher strikeout' },
    { key: 'win', label: 'Win', group: 'pitching', points: 5, description: 'Pitcher win' },
    { key: 'loss', label: 'Loss', group: 'pitching', points: -3, description: 'Pitcher loss' },
    { key: 'save', label: 'Save', group: 'pitching', points: 7, description: 'Save' },
    { key: 'hold', label: 'Hold', group: 'pitching', points: 4, description: 'Hold' },
    { key: 'blownSave', label: 'Blown Save', group: 'pitching', points: -4, description: 'Blown save' },
    { key: 'earnedRun', label: 'Earned Run', group: 'pitching', points: -2, description: 'Earned run allowed' },
    { key: 'hitAllowed', label: 'Hit Allowed', group: 'pitching', points: -0.5, description: 'Hit allowed' },
    { key: 'walkAllowed', label: 'Walk Allowed', group: 'pitching', points: -1, description: 'Walk issued' },
    { key: 'hitBatsman', label: 'Hit Batsman', group: 'pitching', points: -1, description: 'Hit batter' },
    { key: 'qualityStart', label: 'Quality Start', group: 'pitching', points: 5, description: '6+ IP, 3 or fewer ER' },
    { key: 'completeGame', label: 'Complete Game', group: 'pitching', points: 5, description: 'Complete game bonus' },
    { key: 'shutout', label: 'Shutout', group: 'pitching', points: 5, description: 'Shutout bonus (on top of CG)' },
    { key: 'noHitter', label: 'No-Hitter', group: 'pitching', points: 15, description: 'No-hitter bonus' },
    { key: 'perfectGame', label: 'Perfect Game', group: 'pitching', points: 25, description: 'Perfect game bonus' },
  ],
};

/**
 * DIAMONDDRAFT SABERMETRIC
 * Advanced analytics-focused scoring.
 * Heavily rewards plate discipline, power efficiency, and run prevention.
 */
const DIAMONDDRAFT_SABERMETRIC: ScoringPreset = {
  id: 'dd-sabermetric',
  name: 'DiamondDraft Sabermetric',
  description: 'Analytics-driven scoring. Rewards plate discipline and efficiency.',
  categories: [
    // ─── HITTING ────────────────────────────────
    { key: 'single', label: 'Single', group: 'hitting', points: 0.75 },
    { key: 'double', label: 'Double', group: 'hitting', points: 1.75 },
    { key: 'triple', label: 'Triple', group: 'hitting', points: 2.75 },
    { key: 'homeRun', label: 'Home Run', group: 'hitting', points: 4 },
    { key: 'run', label: 'Run Scored', group: 'hitting', points: 1.5 },
    { key: 'rbi', label: 'RBI', group: 'hitting', points: 0.75 },
    { key: 'walk', label: 'Walk', group: 'hitting', points: 1.5, description: 'Walks valued highly — plate discipline matters' },
    { key: 'hitByPitch', label: 'Hit By Pitch', group: 'hitting', points: 1.5 },
    { key: 'stolenBase', label: 'Stolen Base', group: 'hitting', points: 3, description: 'High value — speed is an asset' },
    { key: 'caughtStealing', label: 'Caught Stealing', group: 'hitting', points: -2 },
    { key: 'strikeout', label: 'Strikeout (Batter)', group: 'hitting', points: -1, description: 'Strikeouts penalized more' },
    { key: 'gidp', label: 'Grounded Into DP', group: 'hitting', points: -1.5 },
    { key: 'sacFly', label: 'Sacrifice Fly', group: 'hitting', points: 1 },
    { key: 'totalBases', label: 'Total Bases Bonus', group: 'hitting', points: 0.25, description: 'Per total base' },

    // ─── PITCHING ───────────────────────────────
    { key: 'inningPitched', label: 'Inning Pitched', group: 'pitching', points: 3.5 },
    { key: 'pitcherStrikeout', label: 'Strikeout (Pitcher)', group: 'pitching', points: 1.5, description: 'K rate is king' },
    { key: 'win', label: 'Win', group: 'pitching', points: 2, description: 'Wins devalued — not a pitcher skill' },
    { key: 'loss', label: 'Loss', group: 'pitching', points: -1 },
    { key: 'save', label: 'Save', group: 'pitching', points: 5 },
    { key: 'hold', label: 'Hold', group: 'pitching', points: 4 },
    { key: 'blownSave', label: 'Blown Save', group: 'pitching', points: -5 },
    { key: 'earnedRun', label: 'Earned Run', group: 'pitching', points: -2.5 },
    { key: 'hitAllowed', label: 'Hit Allowed', group: 'pitching', points: -0.5 },
    { key: 'walkAllowed', label: 'Walk Allowed', group: 'pitching', points: -1.5, description: 'Walks penalized more — command matters' },
    { key: 'hitBatsman', label: 'Hit Batsman', group: 'pitching', points: -1 },
    { key: 'qualityStart', label: 'Quality Start', group: 'pitching', points: 7, description: 'QS valued over wins' },
    { key: 'completeGame', label: 'Complete Game', group: 'pitching', points: 7 },
    { key: 'shutout', label: 'Shutout', group: 'pitching', points: 7 },
    { key: 'noHitter', label: 'No-Hitter', group: 'pitching', points: 20 },
    { key: 'perfectGame', label: 'Perfect Game', group: 'pitching', points: 30 },
  ],
};

/**
 * DIAMONDDRAFT CLASSIC
 * Simple, traditional scoring for casual leagues.
 * Similar to what you'd find on ESPN but cleaner.
 */
const DIAMONDDRAFT_CLASSIC: ScoringPreset = {
  id: 'dd-classic',
  name: 'DiamondDraft Classic',
  description: 'Simple, traditional scoring. Great for casual leagues.',
  categories: [
    // ─── HITTING ────────────────────────────────
    { key: 'single', label: 'Single', group: 'hitting', points: 1 },
    { key: 'double', label: 'Double', group: 'hitting', points: 2 },
    { key: 'triple', label: 'Triple', group: 'hitting', points: 3 },
    { key: 'homeRun', label: 'Home Run', group: 'hitting', points: 4 },
    { key: 'run', label: 'Run Scored', group: 'hitting', points: 1 },
    { key: 'rbi', label: 'RBI', group: 'hitting', points: 1 },
    { key: 'walk', label: 'Walk', group: 'hitting', points: 0.5 },
    { key: 'stolenBase', label: 'Stolen Base', group: 'hitting', points: 2 },
    { key: 'caughtStealing', label: 'Caught Stealing', group: 'hitting', points: -1 },
    { key: 'strikeout', label: 'Strikeout (Batter)', group: 'hitting', points: -0.5 },

    // ─── PITCHING ───────────────────────────────
    { key: 'inningPitched', label: 'Inning Pitched', group: 'pitching', points: 3 },
    { key: 'pitcherStrikeout', label: 'Strikeout (Pitcher)', group: 'pitching', points: 1 },
    { key: 'win', label: 'Win', group: 'pitching', points: 5 },
    { key: 'loss', label: 'Loss', group: 'pitching', points: -3 },
    { key: 'save', label: 'Save', group: 'pitching', points: 5 },
    { key: 'blownSave', label: 'Blown Save', group: 'pitching', points: -3 },
    { key: 'earnedRun', label: 'Earned Run', group: 'pitching', points: -2 },
    { key: 'hitAllowed', label: 'Hit Allowed', group: 'pitching', points: -0.5 },
    { key: 'walkAllowed', label: 'Walk Allowed', group: 'pitching', points: -0.5 },
    { key: 'qualityStart', label: 'Quality Start', group: 'pitching', points: 3 },
    { key: 'completeGame', label: 'Complete Game', group: 'pitching', points: 3 },
    { key: 'shutout', label: 'Shutout', group: 'pitching', points: 3 },
  ],
};

/**
 * DIAMONDDRAFT ROTO 5x5
 * Standard rotisserie categories
 */
const DIAMONDDRAFT_ROTO: ScoringPreset = {
  id: 'dd-roto',
  name: 'DiamondDraft Roto 5x5',
  description: 'Classic rotisserie with 5 hitting and 5 pitching categories.',
  categories: [
    // Hitting categories (cumulative rank)
    { key: 'battingAvg', label: 'Batting Average', group: 'hitting', points: 0 },
    { key: 'homeRuns', label: 'Home Runs', group: 'hitting', points: 0 },
    { key: 'rbi', label: 'RBI', group: 'hitting', points: 0 },
    { key: 'runs', label: 'Runs', group: 'hitting', points: 0 },
    { key: 'stolenBases', label: 'Stolen Bases', group: 'hitting', points: 0 },
    // Pitching categories (cumulative rank)
    { key: 'era', label: 'ERA', group: 'pitching', points: 0 },
    { key: 'whip', label: 'WHIP', group: 'pitching', points: 0 },
    { key: 'wins', label: 'Wins', group: 'pitching', points: 0 },
    { key: 'strikeouts', label: 'Strikeouts', group: 'pitching', points: 0 },
    { key: 'saves', label: 'Saves', group: 'pitching', points: 0 },
  ],
};

export const SCORING_PRESETS: ScoringPreset[] = [
  DIAMONDDRAFT_STANDARD,
  DIAMONDDRAFT_SABERMETRIC,
  DIAMONDDRAFT_CLASSIC,
  DIAMONDDRAFT_ROTO,
];

// ─── FANTASY POINTS CALCULATOR ────────────────────────────────

export interface GameStats {
  // Hitting
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  walks?: number;
  strikeouts?: number;
  stolenBases?: number;
  caughtStealing?: number;
  hitByPitch?: number;
  sacFlies?: number;
  groundIntoDoublePlay?: number;
  totalBases?: number;

  // Pitching
  inningsPitched?: number;
  pitcherStrikeouts?: number;
  earnedRuns?: number;
  hitsAllowed?: number;
  walksAllowed?: number;
  hitBatsmen?: number;
  win?: boolean;
  loss?: boolean;
  save?: boolean;
  hold?: boolean;
  blownSave?: boolean;
  completeGame?: boolean;
  shutout?: boolean;
  noHitter?: boolean;
  perfectGame?: boolean;
  qualityStart?: boolean;
}

export function calculateFantasyPoints(stats: GameStats, preset: ScoringPreset): number {
  let points = 0;
  const catMap = new Map(preset.categories.map(c => [c.key, c.points]));

  // ─── HITTING ────────────────────────────────
  const singles = (stats.hits || 0) - (stats.doubles || 0) - (stats.triples || 0) - (stats.homeRuns || 0);
  if (singles > 0) points += singles * (catMap.get('single') || 0);
  if (stats.doubles) points += stats.doubles * (catMap.get('double') || 0);
  if (stats.triples) points += stats.triples * (catMap.get('triple') || 0);
  if (stats.homeRuns) points += stats.homeRuns * (catMap.get('homeRun') || 0);
  if (stats.runs) points += stats.runs * (catMap.get('run') || 0);
  if (stats.rbi) points += stats.rbi * (catMap.get('rbi') || 0);
  if (stats.walks) points += stats.walks * (catMap.get('walk') || 0);
  if (stats.hitByPitch) points += stats.hitByPitch * (catMap.get('hitByPitch') || 0);
  if (stats.stolenBases) points += stats.stolenBases * (catMap.get('stolenBase') || 0);
  if (stats.caughtStealing) points += stats.caughtStealing * (catMap.get('caughtStealing') || 0);
  if (stats.strikeouts) points += stats.strikeouts * (catMap.get('strikeout') || 0);
  if (stats.groundIntoDoublePlay) points += stats.groundIntoDoublePlay * (catMap.get('gidp') || 0);
  if (stats.sacFlies) points += stats.sacFlies * (catMap.get('sacFly') || 0);
  if (stats.totalBases) points += stats.totalBases * (catMap.get('totalBases') || 0);

  // Multi-hit bonus
  if ((stats.hits || 0) >= 3 && catMap.has('multiHitBonus')) {
    points += catMap.get('multiHitBonus') || 0;
  }

  // Grand slam bonus (approximation: HR with 3+ RBI beyond the HR itself)
  if ((stats.homeRuns || 0) > 0 && (stats.rbi || 0) >= 4 && catMap.has('grandSlam')) {
    points += catMap.get('grandSlam') || 0;
  }

  // Cycle bonus
  if (singles > 0 && (stats.doubles || 0) > 0 && (stats.triples || 0) > 0 && (stats.homeRuns || 0) > 0 && catMap.has('cycleBonus')) {
    points += catMap.get('cycleBonus') || 0;
  }

  // ─── PITCHING ───────────────────────────────
  if (stats.inningsPitched) {
    // Decimal innings: 6.1 = 6 and 1/3 innings
    const fullInnings = Math.floor(stats.inningsPitched);
    const partialOuts = Math.round((stats.inningsPitched - fullInnings) * 10);
    const totalOuts = fullInnings * 3 + partialOuts;
    const ipPoints = catMap.get('inningPitched') || 0;
    points += (totalOuts / 3) * ipPoints;
  }

  if (stats.pitcherStrikeouts) points += stats.pitcherStrikeouts * (catMap.get('pitcherStrikeout') || 0);
  if (stats.earnedRuns) points += stats.earnedRuns * (catMap.get('earnedRun') || 0);
  if (stats.hitsAllowed) points += stats.hitsAllowed * (catMap.get('hitAllowed') || 0);
  if (stats.walksAllowed) points += stats.walksAllowed * (catMap.get('walkAllowed') || 0);
  if (stats.hitBatsmen) points += stats.hitBatsmen * (catMap.get('hitBatsman') || 0);
  if (stats.win) points += catMap.get('win') || 0;
  if (stats.loss) points += catMap.get('loss') || 0;
  if (stats.save) points += catMap.get('save') || 0;
  if (stats.hold) points += catMap.get('hold') || 0;
  if (stats.blownSave) points += catMap.get('blownSave') || 0;
  if (stats.qualityStart) points += catMap.get('qualityStart') || 0;
  if (stats.completeGame) points += catMap.get('completeGame') || 0;
  if (stats.shutout) points += catMap.get('shutout') || 0;
  if (stats.noHitter) points += catMap.get('noHitter') || 0;
  if (stats.perfectGame) points += catMap.get('perfectGame') || 0;

  return Math.round(points * 100) / 100; // Round to 2 decimal places
}

// ─── CALCULATE POINTS FROM MLB BOXSCORE DATA ──────────────────

export function calculatePointsFromBoxscore(
  boxscoreStats: any,
  type: 'hitting' | 'pitching',
  preset: ScoringPreset = DIAMONDDRAFT_STANDARD
): number {
  const s = boxscoreStats;

  if (type === 'hitting') {
    const gameStats: GameStats = {
      hits: s.hits || 0,
      doubles: s.doubles || 0,
      triples: s.triples || 0,
      homeRuns: s.homeRuns || 0,
      runs: s.runs || 0,
      rbi: s.rbi || 0,
      walks: s.baseOnBalls || s.walks || 0,
      strikeouts: s.strikeOuts || s.strikeouts || 0,
      stolenBases: s.stolenBases || 0,
      caughtStealing: s.caughtStealing || 0,
      hitByPitch: s.hitByPitch || 0,
      sacFlies: s.sacFlies || 0,
      groundIntoDoublePlay: s.groundIntoDoublePlay || 0,
      totalBases: s.totalBases || 0,
    };
    return calculateFantasyPoints(gameStats, preset);
  }

  if (type === 'pitching') {
    const ip = parseFloat(s.inningsPitched) || 0;
    const er = s.earnedRuns || 0;
    const isQS = ip >= 6 && er <= 3;

    const gameStats: GameStats = {
      inningsPitched: ip,
      pitcherStrikeouts: s.strikeOuts || s.strikeouts || 0,
      earnedRuns: er,
      hitsAllowed: s.hits || 0,
      walksAllowed: s.baseOnBalls || s.walks || 0,
      hitBatsmen: s.hitBatsmen || 0,
      win: !!s.win || !!s.wins,
      loss: !!s.loss || !!s.losses,
      save: !!s.save || !!s.saves,
      hold: !!s.hold || !!s.holds,
      blownSave: !!s.blownSave || !!s.blownSaves,
      completeGame: !!s.completeGame || !!s.completeGames,
      shutout: !!s.shutout || !!s.shutouts,
      qualityStart: isQS,
      noHitter: !!s.completeGame && (s.hits || 0) === 0,
      perfectGame: !!s.completeGame && (s.hits || 0) === 0 && (s.baseOnBalls || 0) === 0 && (s.hitBatsmen || 0) === 0,
    };
    return calculateFantasyPoints(gameStats, preset);
  }

  return 0;
}

// ─── ROTO STANDINGS CALCULATOR ────────────────────────────────

export function calculateRotoStandings(
  teams: Array<{ id: string; name: string; stats: Record<string, number> }>,
  categories: string[]
): Array<{ id: string; name: string; totalPoints: number; categoryPoints: Record<string, number> }> {
  const results = teams.map(t => ({
    id: t.id,
    name: t.name,
    totalPoints: 0,
    categoryPoints: {} as Record<string, number>,
  }));

  // Lower-is-better categories
  const lowerIsBetter = new Set(['era', 'whip']);

  for (const cat of categories) {
    const sorted = [...teams].sort((a, b) => {
      const aVal = a.stats[cat] || 0;
      const bVal = b.stats[cat] || 0;
      return lowerIsBetter.has(cat) ? aVal - bVal : bVal - aVal;
    });

    sorted.forEach((team, index) => {
      const pts = teams.length - index;
      const result = results.find(r => r.id === team.id)!;
      result.categoryPoints[cat] = pts;
      result.totalPoints += pts;
    });
  }

  return results.sort((a, b) => b.totalPoints - a.totalPoints);
}

// ─── DEFAULT CONFIGS ──────────────────────────────────────────

export const DEFAULT_ROSTER_CONFIG = {
  C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1,
  OF: 3, UTIL: 2, DH: 0,
  SP: 5, RP: 3, P: 0,
  BN: 5, IL: 3,
};

export const DEFAULT_SCORING_CONFIG = DIAMONDDRAFT_STANDARD;