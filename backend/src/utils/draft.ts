// ─── DRAFT ENGINE UTILITIES ─────────────────────────────────────

export interface DraftConfig {
  type: 'SNAKE' | 'AUCTION' | 'LINEAR' | 'THIRD_ROUND_REVERSAL' | 'CUSTOM';
  teamIds: string[];
  totalRounds: number;
  customOrder?: string[][]; // For custom draft orders
}

/**
 * Generate the full pick order for a draft
 */
export function generateDraftOrder(config: DraftConfig): Array<{ round: number; pickNumber: number; teamId: string }> {
  const { type, teamIds, totalRounds } = config;
  const picks: Array<{ round: number; pickNumber: number; teamId: string }> = [];
  let pickNumber = 1;

  for (let round = 1; round <= totalRounds; round++) {
    let roundOrder: string[];

    switch (type) {
      case 'SNAKE':
        roundOrder = round % 2 === 1 ? [...teamIds] : [...teamIds].reverse();
        break;

      case 'LINEAR':
        roundOrder = [...teamIds];
        break;

      case 'THIRD_ROUND_REVERSAL':
        if (round <= 2) {
          roundOrder = round % 2 === 1 ? [...teamIds] : [...teamIds].reverse();
        } else if (round === 3) {
          // 3rd round uses same order as 2nd round (reversed)
          roundOrder = [...teamIds].reverse();
        } else {
          // After round 3, resume normal snake from round 3's order
          roundOrder = round % 2 === 0 ? [...teamIds] : [...teamIds].reverse();
        }
        break;

      case 'CUSTOM':
        roundOrder = config.customOrder?.[round - 1] || [...teamIds];
        break;

      case 'AUCTION':
        // Auction doesn't have a fixed pick order, nomination order rotates
        roundOrder = [...teamIds];
        // Rotate based on round
        const rotateBy = (round - 1) % teamIds.length;
        roundOrder = [...roundOrder.slice(rotateBy), ...roundOrder.slice(0, rotateBy)];
        break;

      default:
        roundOrder = [...teamIds];
    }

    for (const teamId of roundOrder) {
      picks.push({ round, pickNumber, teamId });
      pickNumber++;
    }
  }

  return picks;
}

/**
 * Get the next pick in a draft
 */
export function getNextPick(
  picks: Array<{ pickNumber: number; teamId: string; playerId?: string | null }>,
  currentPickNumber: number
): { pickNumber: number; teamId: string } | null {
  const nextPick = picks.find(
    (p) => p.pickNumber > currentPickNumber && !p.playerId
  );
  return nextPick ? { pickNumber: nextPick.pickNumber, teamId: nextPick.teamId } : null;
}

/**
 * Calculate draft round and pick from overall pick number
 */
export function getPickPosition(pickNumber: number, teamsCount: number): { round: number; pickInRound: number } {
  const round = Math.ceil(pickNumber / teamsCount);
  const pickInRound = ((pickNumber - 1) % teamsCount) + 1;
  return { round, pickInRound };
}

/**
 * Auto-pick logic: select best available player based on team needs
 */
export function getAutoPickRecommendation(
  availablePlayers: Array<{ id: string; position: string; projectedPoints: number | null }>,
  teamRoster: Array<{ rosterSlot: string; playerId: string }>,
  rosterConfig: Record<string, number>
): string | null {
  // Calculate roster needs
  const filledSlots: Record<string, number> = {};
  for (const entry of teamRoster) {
    filledSlots[entry.rosterSlot] = (filledSlots[entry.rosterSlot] || 0) + 1;
  }

  const neededPositions: string[] = [];
  for (const [slot, count] of Object.entries(rosterConfig)) {
    if (slot === 'BN' || slot === 'IL' || slot === 'MiLB') continue;
    const filled = filledSlots[slot] || 0;
    if (filled < count) {
      neededPositions.push(slot);
    }
  }

  // Sort available players by projected points
  const sorted = [...availablePlayers].sort(
    (a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0)
  );

  // Try to fill a need first
  if (neededPositions.length > 0) {
    for (const player of sorted) {
      if (neededPositions.includes(player.position)) {
        return player.id;
      }
    }
  }

  // Otherwise, just take best available
  return sorted[0]?.id || null;
}