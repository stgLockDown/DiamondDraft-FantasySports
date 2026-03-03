import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MLB_PLAYERS = [
  // ─── TOP HITTERS ──────────────────────────────────────────
  { mlbId: 660271, firstName: 'Shohei', lastName: 'Ohtani', team: 'LAD', teamFullName: 'Los Angeles Dodgers', position: 'UTIL', eligiblePositions: ['UTIL','SP','DH'], bats: 'L', throws: 'R', age: 30, homeRuns: 54, rbi: 130, stolenBases: 59, battingAvg: 0.310, obp: 0.390, slg: 0.646, ops: 1.036, projectedPoints: 850 },
  { mlbId: 665489, firstName: 'Aaron', lastName: 'Judge', team: 'NYY', teamFullName: 'New York Yankees', position: 'OF', eligiblePositions: ['OF','DH'], bats: 'R', throws: 'R', age: 32, homeRuns: 58, rbi: 144, stolenBases: 3, battingAvg: 0.322, obp: 0.425, slg: 0.701, ops: 1.126, projectedPoints: 780 },
  { mlbId: 641355, firstName: 'Mookie', lastName: 'Betts', team: 'LAD', teamFullName: 'Los Angeles Dodgers', position: 'SS', eligiblePositions: ['SS','OF'], bats: 'R', throws: 'R', age: 31, homeRuns: 25, rbi: 82, stolenBases: 14, battingAvg: 0.289, obp: 0.370, slg: 0.520, ops: 0.890, projectedPoints: 680 },
  { mlbId: 660670, firstName: 'Ronald', lastName: 'Acuña Jr.', team: 'ATL', teamFullName: 'Atlanta Braves', position: 'OF', eligiblePositions: ['OF'], bats: 'R', throws: 'R', age: 26, homeRuns: 41, rbi: 106, stolenBases: 73, battingAvg: 0.337, obp: 0.416, slg: 0.596, ops: 1.012, projectedPoints: 820 },
  { mlbId: 665742, firstName: 'Juan', lastName: 'Soto', team: 'NYM', teamFullName: 'New York Mets', position: 'OF', eligiblePositions: ['OF','DH'], bats: 'L', throws: 'L', age: 25, homeRuns: 41, rbi: 109, stolenBases: 7, battingAvg: 0.288, obp: 0.419, slg: 0.569, ops: 0.988, projectedPoints: 740 },
  { mlbId: 592450, firstName: 'Freddie', lastName: 'Freeman', team: 'LAD', teamFullName: 'Los Angeles Dodgers', position: '1B', eligiblePositions: ['1B'], bats: 'L', throws: 'R', age: 34, homeRuns: 22, rbi: 100, stolenBases: 5, battingAvg: 0.282, obp: 0.378, slg: 0.476, ops: 0.854, projectedPoints: 620 },
  { mlbId: 677951, firstName: 'Bobby', lastName: 'Witt Jr.', team: 'KC', teamFullName: 'Kansas City Royals', position: 'SS', eligiblePositions: ['SS'], bats: 'R', throws: 'R', age: 24, homeRuns: 32, rbi: 106, stolenBases: 31, battingAvg: 0.332, obp: 0.389, slg: 0.588, ops: 0.977, projectedPoints: 750 },
  { mlbId: 668939, firstName: 'Trea', lastName: 'Turner', team: 'PHI', teamFullName: 'Philadelphia Phillies', position: 'SS', eligiblePositions: ['SS'], bats: 'R', throws: 'R', age: 31, homeRuns: 21, rbi: 76, stolenBases: 30, battingAvg: 0.295, obp: 0.345, slg: 0.490, ops: 0.835, projectedPoints: 640 },
  { mlbId: 608369, firstName: 'Corey', lastName: 'Seager', team: 'TEX', teamFullName: 'Texas Rangers', position: 'SS', eligiblePositions: ['SS'], bats: 'L', throws: 'R', age: 30, homeRuns: 33, rbi: 96, stolenBases: 2, battingAvg: 0.278, obp: 0.360, slg: 0.540, ops: 0.900, projectedPoints: 650 },
  { mlbId: 666176, firstName: 'Gunnar', lastName: 'Henderson', team: 'BAL', teamFullName: 'Baltimore Orioles', position: 'SS', eligiblePositions: ['SS','3B'], bats: 'L', throws: 'R', age: 23, homeRuns: 37, rbi: 92, stolenBases: 10, battingAvg: 0.281, obp: 0.364, slg: 0.555, ops: 0.919, projectedPoints: 700 },
  { mlbId: 543829, firstName: 'Mike', lastName: 'Trout', team: 'LAA', teamFullName: 'Los Angeles Angels', position: 'OF', eligiblePositions: ['OF'], bats: 'R', throws: 'R', age: 32, homeRuns: 18, rbi: 44, stolenBases: 2, battingAvg: 0.263, obp: 0.370, slg: 0.500, ops: 0.870, projectedPoints: 520 },
  { mlbId: 605141, firstName: 'Manny', lastName: 'Machado', team: 'SD', teamFullName: 'San Diego Padres', position: '3B', eligiblePositions: ['3B','SS'], bats: 'R', throws: 'R', age: 31, homeRuns: 30, rbi: 105, stolenBases: 9, battingAvg: 0.275, obp: 0.340, slg: 0.500, ops: 0.840, projectedPoints: 620 },
  { mlbId: 673357, firstName: 'Elly', lastName: 'De La Cruz', team: 'CIN', teamFullName: 'Cincinnati Reds', position: 'SS', eligiblePositions: ['SS','3B'], bats: 'S', throws: 'R', age: 22, homeRuns: 25, rbi: 76, stolenBases: 67, battingAvg: 0.262, obp: 0.325, slg: 0.480, ops: 0.805, projectedPoints: 710 },
  { mlbId: 596019, firstName: 'Francisco', lastName: 'Lindor', team: 'NYM', teamFullName: 'New York Mets', position: 'SS', eligiblePositions: ['SS'], bats: 'S', throws: 'R', age: 30, homeRuns: 33, rbi: 98, stolenBases: 29, battingAvg: 0.273, obp: 0.344, slg: 0.500, ops: 0.844, projectedPoints: 670 },
  { mlbId: 660644, firstName: 'Yordan', lastName: 'Alvarez', team: 'HOU', teamFullName: 'Houston Astros', position: 'OF', eligiblePositions: ['OF','DH'], bats: 'L', throws: 'R', age: 27, homeRuns: 35, rbi: 97, stolenBases: 1, battingAvg: 0.293, obp: 0.392, slg: 0.583, ops: 0.975, projectedPoints: 690 },
  { mlbId: 663728, firstName: 'Adley', lastName: 'Rutschman', team: 'BAL', teamFullName: 'Baltimore Orioles', position: 'C', eligiblePositions: ['C','DH'], bats: 'S', throws: 'R', age: 26, homeRuns: 23, rbi: 80, stolenBases: 1, battingAvg: 0.275, obp: 0.370, slg: 0.470, ops: 0.840, projectedPoints: 580 },
  { mlbId: 682998, firstName: 'Corbin', lastName: 'Carroll', team: 'ARI', teamFullName: 'Arizona Diamondbacks', position: 'OF', eligiblePositions: ['OF'], bats: 'L', throws: 'L', age: 23, homeRuns: 25, rbi: 76, stolenBases: 54, battingAvg: 0.285, obp: 0.360, slg: 0.510, ops: 0.870, projectedPoints: 680 },
  { mlbId: 571448, firstName: 'Bryce', lastName: 'Harper', team: 'PHI', teamFullName: 'Philadelphia Phillies', position: '1B', eligiblePositions: ['1B','OF','DH'], bats: 'L', throws: 'R', age: 31, homeRuns: 30, rbi: 87, stolenBases: 4, battingAvg: 0.285, obp: 0.398, slg: 0.540, ops: 0.938, projectedPoints: 660 },
  { mlbId: 669257, firstName: 'Julio', lastName: 'Rodríguez', team: 'SEA', teamFullName: 'Seattle Mariners', position: 'OF', eligiblePositions: ['OF'], bats: 'R', throws: 'R', age: 23, homeRuns: 28, rbi: 85, stolenBases: 25, battingAvg: 0.275, obp: 0.340, slg: 0.490, ops: 0.830, projectedPoints: 650 },
  { mlbId: 665487, firstName: 'Matt', lastName: 'Olson', team: 'ATL', teamFullName: 'Atlanta Braves', position: '1B', eligiblePositions: ['1B'], bats: 'L', throws: 'R', age: 30, homeRuns: 44, rbi: 103, stolenBases: 1, battingAvg: 0.248, obp: 0.345, slg: 0.540, ops: 0.885, projectedPoints: 640 },
  { mlbId: 664023, firstName: 'Marcus', lastName: 'Semien', team: 'TEX', teamFullName: 'Texas Rangers', position: '2B', eligiblePositions: ['2B','SS'], bats: 'R', throws: 'R', age: 33, homeRuns: 25, rbi: 82, stolenBases: 14, battingAvg: 0.265, obp: 0.330, slg: 0.460, ops: 0.790, projectedPoints: 580 },
  { mlbId: 672284, firstName: 'Jackson', lastName: 'Chourio', team: 'MIL', teamFullName: 'Milwaukee Brewers', position: 'OF', eligiblePositions: ['OF'], bats: 'R', throws: 'R', age: 20, homeRuns: 22, rbi: 75, stolenBases: 22, battingAvg: 0.278, obp: 0.335, slg: 0.480, ops: 0.815, projectedPoints: 610 },
  { mlbId: 608070, firstName: 'José', lastName: 'Ramírez', team: 'CLE', teamFullName: 'Cleveland Guardians', position: '3B', eligiblePositions: ['3B'], bats: 'S', throws: 'R', age: 31, homeRuns: 29, rbi: 108, stolenBases: 20, battingAvg: 0.279, obp: 0.355, slg: 0.520, ops: 0.875, projectedPoints: 680 },
  { mlbId: 543685, firstName: 'J.T.', lastName: 'Realmuto', team: 'PHI', teamFullName: 'Philadelphia Phillies', position: 'C', eligiblePositions: ['C'], bats: 'R', throws: 'R', age: 33, homeRuns: 18, rbi: 64, stolenBases: 12, battingAvg: 0.260, obp: 0.320, slg: 0.440, ops: 0.760, projectedPoints: 480 },
  { mlbId: 665161, firstName: 'Rafael', lastName: 'Devers', team: 'BOS', teamFullName: 'Boston Red Sox', position: '3B', eligiblePositions: ['3B'], bats: 'L', throws: 'R', age: 27, homeRuns: 33, rbi: 100, stolenBases: 3, battingAvg: 0.272, obp: 0.345, slg: 0.530, ops: 0.875, projectedPoints: 640 },

  // ─── TOP PITCHERS ─────────────────────────────────────────
  { mlbId: 477132, firstName: 'Zack', lastName: 'Wheeler', team: 'PHI', teamFullName: 'Philadelphia Phillies', position: 'SP', eligiblePositions: ['SP'], bats: 'L', throws: 'R', age: 34, wins_stat: 16, losses_stat: 7, era: 2.57, whip: 1.00, strikeouts: 224, saves: 0, inningsPitched: 200, projectedPoints: 720 },
  { mlbId: 594798, firstName: 'Gerrit', lastName: 'Cole', team: 'NYY', teamFullName: 'New York Yankees', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 33, wins_stat: 15, losses_stat: 5, era: 2.63, whip: 0.99, strikeouts: 222, saves: 0, inningsPitched: 195, projectedPoints: 710 },
  { mlbId: 669373, firstName: 'Corbin', lastName: 'Burnes', team: 'ARI', teamFullName: 'Arizona Diamondbacks', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 29, wins_stat: 15, losses_stat: 9, era: 2.92, whip: 1.09, strikeouts: 214, saves: 0, inningsPitched: 199, projectedPoints: 680 },
  { mlbId: 656302, firstName: 'Spencer', lastName: 'Strider', team: 'ATL', teamFullName: 'Atlanta Braves', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 25, wins_stat: 14, losses_stat: 5, era: 3.15, whip: 1.02, strikeouts: 260, saves: 0, inningsPitched: 186, projectedPoints: 700 },
  { mlbId: 675911, firstName: 'Paul', lastName: 'Skenes', team: 'PIT', teamFullName: 'Pittsburgh Pirates', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 22, wins_stat: 11, losses_stat: 3, era: 1.96, whip: 0.92, strikeouts: 170, saves: 0, inningsPitched: 133, projectedPoints: 660 },
  { mlbId: 571578, firstName: 'Chris', lastName: 'Sale', team: 'ATL', teamFullName: 'Atlanta Braves', position: 'SP', eligiblePositions: ['SP'], bats: 'L', throws: 'L', age: 35, wins_stat: 18, losses_stat: 3, era: 2.38, whip: 0.91, strikeouts: 225, saves: 0, inningsPitched: 177, projectedPoints: 730 },
  { mlbId: 543037, firstName: 'Max', lastName: 'Scherzer', team: 'TEX', teamFullName: 'Texas Rangers', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 39, wins_stat: 10, losses_stat: 6, era: 3.20, whip: 1.08, strikeouts: 180, saves: 0, inningsPitched: 160, projectedPoints: 560 },
  { mlbId: 605483, firstName: 'Logan', lastName: 'Webb', team: 'SF', teamFullName: 'San Francisco Giants', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 27, wins_stat: 14, losses_stat: 11, era: 3.25, whip: 1.12, strikeouts: 195, saves: 0, inningsPitched: 216, projectedPoints: 620 },
  { mlbId: 656427, firstName: 'Tarik', lastName: 'Skubal', team: 'DET', teamFullName: 'Detroit Tigers', position: 'SP', eligiblePositions: ['SP'], bats: 'L', throws: 'L', age: 27, wins_stat: 18, losses_stat: 4, era: 2.39, whip: 0.92, strikeouts: 228, saves: 0, inningsPitched: 192, projectedPoints: 740 },
  { mlbId: 621111, firstName: 'Dylan', lastName: 'Cease', team: 'SD', teamFullName: 'San Diego Padres', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 28, wins_stat: 14, losses_stat: 11, era: 3.47, whip: 1.17, strikeouts: 224, saves: 0, inningsPitched: 189, projectedPoints: 600 },
  { mlbId: 608566, firstName: 'Framber', lastName: 'Valdez', team: 'HOU', teamFullName: 'Houston Astros', position: 'SP', eligiblePositions: ['SP'], bats: 'L', throws: 'L', age: 30, wins_stat: 15, losses_stat: 8, era: 3.00, whip: 1.11, strikeouts: 194, saves: 0, inningsPitched: 201, projectedPoints: 630 },
  { mlbId: 657277, firstName: 'Yoshinobu', lastName: 'Yamamoto', team: 'LAD', teamFullName: 'Los Angeles Dodgers', position: 'SP', eligiblePositions: ['SP'], bats: 'R', throws: 'R', age: 25, wins_stat: 12, losses_stat: 6, era: 3.00, whip: 1.05, strikeouts: 175, saves: 0, inningsPitched: 162, projectedPoints: 620 },

  // ─── RELIEF PITCHERS ──────────────────────────────────────
  { mlbId: 622663, firstName: 'Emmanuel', lastName: 'Clase', team: 'CLE', teamFullName: 'Cleveland Guardians', position: 'RP', eligiblePositions: ['RP'], bats: 'R', throws: 'R', age: 26, wins_stat: 4, losses_stat: 4, era: 0.61, whip: 0.73, strikeouts: 74, saves: 47, inningsPitched: 74, projectedPoints: 480 },
  { mlbId: 547973, firstName: 'Josh', lastName: 'Hader', team: 'HOU', teamFullName: 'Houston Astros', position: 'RP', eligiblePositions: ['RP'], bats: 'L', throws: 'L', age: 30, wins_stat: 3, losses_stat: 5, era: 2.80, whip: 1.05, strikeouts: 88, saves: 42, inningsPitched: 61, projectedPoints: 420 },
  { mlbId: 592332, firstName: 'Ryan', lastName: 'Helsley', team: 'STL', teamFullName: 'St. Louis Cardinals', position: 'RP', eligiblePositions: ['RP'], bats: 'R', throws: 'R', age: 29, wins_stat: 4, losses_stat: 5, era: 2.04, whip: 0.88, strikeouts: 95, saves: 49, inningsPitched: 66, projectedPoints: 460 },
  { mlbId: 623149, firstName: 'Devin', lastName: 'Williams', team: 'NYY', teamFullName: 'New York Yankees', position: 'RP', eligiblePositions: ['RP'], bats: 'R', throws: 'R', age: 29, wins_stat: 3, losses_stat: 2, era: 1.25, whip: 0.81, strikeouts: 87, saves: 36, inningsPitched: 58, projectedPoints: 440 },
  { mlbId: 666142, firstName: 'Robert', lastName: 'Suarez', team: 'SD', teamFullName: 'San Diego Padres', position: 'RP', eligiblePositions: ['RP'], bats: 'R', throws: 'R', age: 33, wins_stat: 2, losses_stat: 3, era: 2.60, whip: 0.95, strikeouts: 72, saves: 38, inningsPitched: 55, projectedPoints: 380 },

  // ─── MORE HITTERS (fill out rosters) ──────────────────────
  { mlbId: 670541, firstName: 'Jackson', lastName: 'Merrill', team: 'SD', teamFullName: 'San Diego Padres', position: 'OF', eligiblePositions: ['OF'], bats: 'L', throws: 'L', age: 21, homeRuns: 24, rbi: 90, stolenBases: 6, battingAvg: 0.292, obp: 0.340, slg: 0.500, ops: 0.840, projectedPoints: 590 },
  { mlbId: 677594, firstName: 'James', lastName: 'Wood', team: 'WSH', teamFullName: 'Washington Nationals', position: 'OF', eligiblePositions: ['OF'], bats: 'L', throws: 'R', age: 21, homeRuns: 18, rbi: 62, stolenBases: 15, battingAvg: 0.268, obp: 0.355, slg: 0.460, ops: 0.815, projectedPoints: 530 },
  { mlbId: 672515, firstName: 'Wyatt', lastName: 'Langford', team: 'TEX', teamFullName: 'Texas Rangers', position: 'OF', eligiblePositions: ['OF'], bats: 'R', throws: 'R', age: 23, homeRuns: 20, rbi: 70, stolenBases: 18, battingAvg: 0.260, obp: 0.330, slg: 0.450, ops: 0.780, projectedPoints: 510 },
  { mlbId: 665923, firstName: 'William', lastName: 'Contreras', team: 'MIL', teamFullName: 'Milwaukee Brewers', position: 'C', eligiblePositions: ['C','DH'], bats: 'R', throws: 'R', age: 26, homeRuns: 23, rbi: 78, stolenBases: 2, battingAvg: 0.278, obp: 0.350, slg: 0.480, ops: 0.830, projectedPoints: 540 },
  { mlbId: 666971, firstName: 'Willy', lastName: 'Adames', team: 'SF', teamFullName: 'San Francisco Giants', position: 'SS', eligiblePositions: ['SS'], bats: 'R', throws: 'R', age: 28, homeRuns: 32, rbi: 112, stolenBases: 21, battingAvg: 0.251, obp: 0.331, slg: 0.462, ops: 0.793, projectedPoints: 610 },
  { mlbId: 666969, firstName: 'Ozzie', lastName: 'Albies', team: 'ATL', teamFullName: 'Atlanta Braves', position: '2B', eligiblePositions: ['2B'], bats: 'S', throws: 'R', age: 27, homeRuns: 20, rbi: 65, stolenBases: 12, battingAvg: 0.258, obp: 0.310, slg: 0.440, ops: 0.750, projectedPoints: 500 },
  { mlbId: 650391, firstName: 'Pete', lastName: 'Alonso', team: 'NYM', teamFullName: 'New York Mets', position: '1B', eligiblePositions: ['1B'], bats: 'R', throws: 'R', age: 29, homeRuns: 34, rbi: 88, stolenBases: 2, battingAvg: 0.240, obp: 0.329, slg: 0.459, ops: 0.788, projectedPoints: 560 },
  { mlbId: 672356, firstName: 'CJ', lastName: 'Abrams', team: 'WSH', teamFullName: 'Washington Nationals', position: 'SS', eligiblePositions: ['SS','2B'], bats: 'L', throws: 'R', age: 23, homeRuns: 20, rbi: 65, stolenBases: 31, battingAvg: 0.270, obp: 0.330, slg: 0.460, ops: 0.790, projectedPoints: 590 },
  { mlbId: 543760, firstName: 'Vladimir', lastName: 'Guerrero Jr.', team: 'TOR', teamFullName: 'Toronto Blue Jays', position: '1B', eligiblePositions: ['1B','DH'], bats: 'R', throws: 'R', age: 25, homeRuns: 30, rbi: 95, stolenBases: 2, battingAvg: 0.280, obp: 0.360, slg: 0.510, ops: 0.870, projectedPoints: 620 },
  { mlbId: 666182, firstName: 'Jarren', lastName: 'Duran', team: 'BOS', teamFullName: 'Boston Red Sox', position: 'OF', eligiblePositions: ['OF'], bats: 'L', throws: 'R', age: 27, homeRuns: 21, rbi: 76, stolenBases: 36, battingAvg: 0.285, obp: 0.342, slg: 0.492, ops: 0.834, projectedPoints: 610 },
];

async function seed() {
  console.log('🌱 Seeding DiamondDraft database...\n');

  // Clear existing data
  await prisma.playerNews.deleteMany();
  await prisma.playerStat.deleteMany();
  await prisma.rosterEntry.deleteMany();
  await prisma.draftPick.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.tradeAsset.deleteMany();
  await prisma.tradeVote.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.waiverClaim.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.matchup.deleteMany();
  await prisma.scoringPeriod.deleteMany();
  await prisma.mockDraft.deleteMany();
  await prisma.team.deleteMany();
  await prisma.league.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  // Seed players
  console.log(`⚾ Seeding ${MLB_PLAYERS.length} MLB players...`);
  for (const p of MLB_PLAYERS) {
    await prisma.player.create({
      data: {
        mlbId: p.mlbId,
        firstName: p.firstName,
        lastName: p.lastName,
        fullName: `${p.firstName} ${p.lastName}`,
        team: p.team,
        teamFullName: p.teamFullName,
        position: p.position,
        eligiblePositions: p.eligiblePositions,
        bats: p.bats,
        throws: p.throws,
        age: p.age,
        status: 'ACTIVE',
        homeRuns: p.homeRuns || 0,
        rbi: p.rbi || 0,
        stolenBases: p.stolenBases || 0,
        battingAvg: p.battingAvg || 0,
        obp: p.obp || 0,
        slg: p.slg || 0,
        ops: p.ops || 0,
        wins_stat: p.wins_stat || 0,
        losses_stat: p.losses_stat || 0,
        era: p.era || 0,
        whip: p.whip || 0,
        strikeouts: p.strikeouts || 0,
        saves: p.saves || 0,
        inningsPitched: p.inningsPitched || 0,
        projectedPoints: p.projectedPoints,
        headshotUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${p.mlbId}/headshot/67/current`,
      },
    });
  }

  // Create demo users
  console.log('👤 Creating demo users...');
  const bcrypt = require('bcryptjs');
  const demoHash = await bcrypt.hash('demo1234', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@diamonddraft.com',
      username: 'DemoManager',
      displayName: 'Demo Manager',
      passwordHash: demoHash,
      tier: 'PRO',
    },
  });

  const demoUser2 = await prisma.user.create({
    data: {
      email: 'rival@diamonddraft.com',
      username: 'RivalGM',
      displayName: 'Rival GM',
      passwordHash: demoHash,
      tier: 'FREE',
    },
  });

  // Create demo league
  console.log('🏟️  Creating demo league...');
  const league = await prisma.league.create({
    data: {
      name: 'Diamond Kings 2026',
      description: 'A competitive 12-team H2H points league for the 2026 season.',
      format: 'HEAD_TO_HEAD_POINTS',
      scoringType: 'POINTS',
      maxTeams: 12,
      rosterSize: 25,
      isPublic: true,
      seasonYear: 2026,
      draftType: 'SNAKE',
      pickTimerSeconds: 90,
      rosterConfig: { C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1, OF: 3, UTIL: 1, SP: 5, RP: 2, P: 0, BN: 5, IL: 2, MiLB: 0 },
      scoringConfig: {
        hitting: { runs: 1, rbi: 1, hr: 4, sb: 2, hits: 0.5, doubles: 1, triples: 2, bb: 1, hbp: 1, so: -0.5, cs: -1 },
        pitching: { ip: 3, pitcherSO: 1, pitcherW: 5, pitcherSV: 5, pitcherHLD: 3, pitcherER: -2, pitcherH: -0.5, pitcherBB: -1, pitcherL: -3, pitcherBS: -3 },
      },
      waiverType: 'FAAB',
      waiverBudget: 100,
      lineupChangeFreq: 'DAILY',
      tradeReviewType: 'COMMISSIONER',
      leagueType: 'REDRAFT',
      ownerId: demoUser.id,
    },
  });

  // Create teams
  await prisma.team.create({
    data: { name: 'Diamond Destroyers', userId: demoUser.id, leagueId: league.id, faabBudget: 100, wins: 8, losses: 4, pointsFor: 1245.5 },
  });
  await prisma.team.create({
    data: { name: 'Rival Sluggers', userId: demoUser2.id, leagueId: league.id, faabBudget: 85, wins: 6, losses: 6, pointsFor: 1102.3 },
  });

  console.log('\n✅ Seed complete!');
  console.log(`   ${MLB_PLAYERS.length} players`);
  console.log(`   2 demo users (demo@diamonddraft.com / demo1234)`);
  console.log(`   1 demo league\n`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });