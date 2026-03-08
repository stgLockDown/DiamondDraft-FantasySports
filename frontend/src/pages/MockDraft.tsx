import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Search, Play, RotateCcw, ChevronDown,
  ChevronUp, Trophy, User, Settings, Minus, Plus
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface MockPlayer {
  mlbId: number;
  fullName: string;
  team: string;
  position: string;
  headshotUrl: string;
  projectedPoints: number;
  stats: {
    avg?: string | null;
    homeRuns?: number | null;
    rbi?: number | null;
    era?: string | null;
    wins?: number | null;
    saves?: number | null;
    stolenBases?: number | null;
    strikeOuts?: number | null;
  } | null;
}

interface RosterSlotEntry {
  slot: string;
  player: MockPlayer | null;
}

interface DraftPick {
  round: number;
  pick: number;
  overall: number;
  teamIndex: number;
  teamName: string;
  player: MockPlayer | null;
}

interface DraftTeam {
  name: string;
  isUser: boolean;
  roster: RosterSlotEntry[];
}

// ─── Roster Slot Config ─────────────────────────────────────
const SLOT_DEFS = [
  { key: 'C', label: 'Catcher', group: 'hitter', min: 0, max: 3 },
  { key: '1B', label: 'First Base', group: 'hitter', min: 0, max: 3 },
  { key: '2B', label: 'Second Base', group: 'hitter', min: 0, max: 3 },
  { key: '3B', label: 'Third Base', group: 'hitter', min: 0, max: 3 },
  { key: 'SS', label: 'Shortstop', group: 'hitter', min: 0, max: 3 },
  { key: 'OF', label: 'Outfield', group: 'hitter', min: 0, max: 6 },
  { key: 'UTIL', label: 'Utility', group: 'hitter', min: 0, max: 4 },
  { key: 'SP', label: 'Starting Pitcher', group: 'pitcher', min: 0, max: 8 },
  { key: 'RP', label: 'Relief Pitcher', group: 'pitcher', min: 0, max: 6 },
  { key: 'BN', label: 'Bench', group: 'bench', min: 0, max: 10 },
  { key: 'IL', label: 'Injured List', group: 'bench', min: 0, max: 5 },
];

const DEFAULT_ROSTER_CONFIG: Record<string, number> = {
  C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1,
  OF: 3, UTIL: 2, SP: 5, RP: 3, BN: 5, IL: 0,
};

const SLOT_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'UTIL', 'SP', 'RP', 'BN', 'IL'];

// ─── AI Team Names ──────────────────────────────────────────
const AI_TEAM_NAMES = [
  'Moonshot Mashers', 'Ace Hunters', 'Diamond Dawgs', 'Clutch City',
  'The Closers', 'Barrel Brigade', 'Spin Rate Kings', 'Launch Angle FC',
  'Stolen Base Bandits', 'Bullpen Mafia', 'WAR Machine',
];

// ─── Helpers ────────────────────────────────────────────────

/** Build an empty roster from config */
function buildEmptyRoster(config: Record<string, number>): RosterSlotEntry[] {
  const roster: RosterSlotEntry[] = [];
  for (const key of SLOT_ORDER) {
    const count = config[key] || 0;
    for (let i = 0; i < count; i++) {
      roster.push({ slot: key, player: null });
    }
  }
  return roster;
}

/** Check which position slot a player can fill */
function getEligibleSlots(position: string): string[] {
  const hitterPositions = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH'];
  const pitcherPositions = ['SP', 'RP'];

  const slots: string[] = [];

  // Direct position match
  if (['C', '1B', '2B', '3B', 'SS', 'OF', 'DH'].includes(position)) {
    if (position === 'DH') {
      slots.push('UTIL');
    } else {
      slots.push(position);
    }
    slots.push('UTIL'); // All hitters can go to UTIL
  } else if (position === 'SP') {
    slots.push('SP');
  } else if (position === 'RP') {
    slots.push('RP');
  }

  // Bench is always eligible
  slots.push('BN');

  // Deduplicate
  return [...new Set(slots)];
}

/** Assign a player to the best available slot in a roster */
function assignToRoster(roster: RosterSlotEntry[], player: MockPlayer): RosterSlotEntry[] {
  const eligible = getEligibleSlots(player.position);
  const newRoster = [...roster];

  // Try to fill position slots first (not BN)
  for (const slotKey of eligible) {
    if (slotKey === 'BN') continue;
    const idx = newRoster.findIndex(s => s.slot === slotKey && s.player === null);
    if (idx !== -1) {
      newRoster[idx] = { ...newRoster[idx], player };
      return newRoster;
    }
  }

  // Fall back to bench
  const bnIdx = newRoster.findIndex(s => s.slot === 'BN' && s.player === null);
  if (bnIdx !== -1) {
    newRoster[bnIdx] = { ...newRoster[bnIdx], player };
    return newRoster;
  }

  // If no slot available, just append (shouldn't happen with proper round count)
  newRoster.push({ slot: 'BN', player });
  return newRoster;
}

/** Count filled slots for a position */
function countFilled(roster: RosterSlotEntry[], slot: string): number {
  return roster.filter(s => s.slot === slot && s.player !== null).length;
}

/** Count total slots for a position */
function countTotal(roster: RosterSlotEntry[], slot: string): number {
  return roster.filter(s => s.slot === slot).length;
}

/** Check if a position need is unfilled */
function hasOpenSlot(roster: RosterSlotEntry[], slotKey: string): boolean {
  return roster.some(s => s.slot === slotKey && s.player === null);
}

// ─── Component ──────────────────────────────────────────────
export default function MockDraft() {
  const navigate = useNavigate();

  // Setup state
  const [setupMode, setSetupMode] = useState(true);
  const [numTeams, setNumTeams] = useState(10);
  const [pickTime, setPickTime] = useState(30);
  const [userTeamName, setUserTeamName] = useState('My Team');
  const [userPickPosition, setUserPickPosition] = useState(1);
  const [rosterConfig, setRosterConfig] = useState<Record<string, number>>({ ...DEFAULT_ROSTER_CONFIG });
  const [showRosterSetup, setShowRosterSetup] = useState(false);

  // Draft state
  const [players, setPlayers] = useState<MockPlayer[]>([]);
  const [teams, setTeams] = useState<DraftTeam[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [draftStatus, setDraftStatus] = useState<'setup' | 'loading' | 'active' | 'paused' | 'complete'>('setup');
  const [timer, setTimer] = useState(0);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [showBoard, setShowBoard] = useState(true);
  const [, setLoadingPlayers] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const draftedIds = useRef<Set<number>>(new Set());

  // Computed
  const totalSlots = Object.values(rosterConfig).reduce((a, b) => a + b, 0);
  const numRounds = totalSlots;
  const activeSlots = totalSlots - (rosterConfig.BN || 0) - (rosterConfig.IL || 0);

  const updateSlot = (key: string, delta: number) => {
    const slot = SLOT_DEFS.find(s => s.key === key);
    if (!slot) return;
    const current = rosterConfig[key] || 0;
    const next = Math.max(slot.min, Math.min(slot.max, current + delta));
    setRosterConfig({ ...rosterConfig, [key]: next });
  };

  // ─── Load Players from MLB API ────────────────────────────
  const loadPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/stats/players/all`);
      const data = await res.json();
      const allPlayers: MockPlayer[] = (data.players || []).map((p: any) => ({
        mlbId: p.mlbId,
        fullName: p.fullName,
        team: p.team,
        position: p.position,
        headshotUrl: p.headshotUrl,
        projectedPoints: p.projectedPoints,
        stats: p.hitting ? {
          avg: p.hitting.avg || null,
          homeRuns: p.hitting.homeRuns ? parseInt(p.hitting.homeRuns) : null,
          rbi: p.hitting.rbi ? parseInt(p.hitting.rbi) : null,
          stolenBases: p.hitting.stolenBases ? parseInt(p.hitting.stolenBases) : null,
        } : p.pitching ? {
          era: p.pitching.era || null,
          wins: p.pitching.wins ? parseInt(p.pitching.wins) : null,
          saves: p.pitching.saves ? parseInt(p.pitching.saves) : null,
          strikeOuts: p.pitching.strikeOuts ? parseInt(p.pitching.strikeOuts) : null,
        } : null,
      }));

      setPlayers(allPlayers);
      return allPlayers;
    } catch (e) {
      console.error('Failed to load players:', e);
      return [];
    } finally {
      setLoadingPlayers(false);
    }
  };

  // ─── Start Draft ──────────────────────────────────────────
  const startDraft = async () => {
    setDraftStatus('loading');

    const loadedPlayers = await loadPlayers();
    if (loadedPlayers.length === 0) {
      alert('Failed to load player data. Please try again.');
      setDraftStatus('setup');
      return;
    }

    // Create teams with slot-based rosters
    const shuffledNames = [...AI_TEAM_NAMES].sort(() => Math.random() - 0.5);
    const newTeams: DraftTeam[] = [];
    for (let i = 0; i < numTeams; i++) {
      if (i === userPickPosition - 1) {
        newTeams.push({ name: userTeamName || 'My Team', isUser: true, roster: buildEmptyRoster(rosterConfig) });
      } else {
        const aiIdx = i > userPickPosition - 1 ? i - 1 : i;
        newTeams.push({ name: shuffledNames[aiIdx % shuffledNames.length], isUser: false, roster: buildEmptyRoster(rosterConfig) });
      }
    }

    // Generate pick order (snake draft)
    const newPicks: DraftPick[] = [];
    let overall = 1;
    for (let round = 1; round <= numRounds; round++) {
      const order = round % 2 === 1
        ? Array.from({ length: numTeams }, (_, i) => i)
        : Array.from({ length: numTeams }, (_, i) => numTeams - 1 - i);

      for (const teamIdx of order) {
        newPicks.push({
          round,
          pick: order.indexOf(teamIdx) + 1,
          overall,
          teamIndex: teamIdx,
          teamName: newTeams[teamIdx].name,
          player: null,
        });
        overall++;
      }
    }

    setTeams(newTeams);
    setPicks(newPicks);
    setCurrentPickIndex(0);
    draftedIds.current = new Set();
    setDraftStatus('active');
    setSetupMode(false);
  };

  // ─── AI Pick Logic ────────────────────────────────────────
  const makeAIPick = useCallback(() => {
    setPicks(prev => {
      const current = prev[currentPickIndex];
      if (!current || current.player) return prev;

      const team = teams[current.teamIndex];
      if (!team || team.isUser) return prev;

      const available = players.filter(p => !draftedIds.current.has(p.mlbId));
      if (available.length === 0) return prev;

      let pick: MockPlayer | null = null;

      // Position-aware AI: 50% chance to fill a needed position slot
      if (Math.random() < 0.5) {
        // Find unfilled position slots (not BN/IL)
        const neededSlots = SLOT_ORDER.filter(s =>
          s !== 'BN' && s !== 'IL' && hasOpenSlot(team.roster, s)
        );

        if (neededSlots.length > 0) {
          // Pick a random needed slot and find best player for it
          const targetSlot = neededSlots[Math.floor(Math.random() * neededSlots.length)];
          const candidates = available.filter(p => {
            const eligible = getEligibleSlots(p.position);
            return eligible.includes(targetSlot);
          });
          if (candidates.length > 0) {
            // Pick from top 3 candidates
            const topN = candidates.slice(0, Math.min(3, candidates.length));
            pick = topN[Math.floor(Math.random() * topN.length)];
          }
        }
      }

      if (!pick) {
        // Best available with slight randomness
        const topN = available.slice(0, Math.min(3, available.length));
        pick = topN[Math.floor(Math.random() * topN.length)];
      }

      draftedIds.current.add(pick.mlbId);

      // Assign to roster slot
      setTeams(prevTeams => {
        const updated = [...prevTeams];
        updated[current.teamIndex] = {
          ...updated[current.teamIndex],
          roster: assignToRoster(updated[current.teamIndex].roster, pick!),
        };
        return updated;
      });

      const newPicks = [...prev];
      newPicks[currentPickIndex] = { ...current, player: pick };

      setCurrentPickIndex(ci => ci + 1);
      return newPicks;
    });
  }, [currentPickIndex, players, teams]);

  // ─── User Pick ────────────────────────────────────────────
  const makeUserPick = (player: MockPlayer) => {
    const current = picks[currentPickIndex];
    if (!current || !teams[current.teamIndex]?.isUser) return;

    draftedIds.current.add(player.mlbId);

    setTeams(prev => {
      const updated = [...prev];
      updated[current.teamIndex] = {
        ...updated[current.teamIndex],
        roster: assignToRoster(updated[current.teamIndex].roster, player),
      };
      return updated;
    });

    setPicks(prev => {
      const newPicks = [...prev];
      newPicks[currentPickIndex] = { ...current, player };
      return newPicks;
    });

    setCurrentPickIndex(ci => ci + 1);
  };

  // ─── Timer & AI automation ────────────────────────────────
  useEffect(() => {
    if (draftStatus !== 'active') return;
    if (currentPickIndex >= picks.length) {
      setDraftStatus('complete');
      return;
    }

    const current = picks[currentPickIndex];
    if (!current) return;

    if (teams[current.teamIndex]?.isUser) {
      setTimer(pickTime);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            autoPickForUser();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
      const delay = 500 + Math.random() * 1500;
      aiTimeoutRef.current = setTimeout(() => {
        makeAIPick();
      }, delay);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [draftStatus, currentPickIndex, picks, teams, pickTime, makeAIPick]);

  const autoPickForUser = () => {
    const available = players.filter(p => !draftedIds.current.has(p.mlbId));
    if (available.length > 0) {
      makeUserPick(available[0]);
    }
  };

  // ─── Reset Draft ──────────────────────────────────────────
  const resetDraft = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setDraftStatus('setup');
    setSetupMode(true);
    setPicks([]);
    setTeams([]);
    setCurrentPickIndex(0);
    draftedIds.current = new Set();
    setTimer(0);
  };

  // ─── Derived state ────────────────────────────────────────
  const currentPick = picks[currentPickIndex] || null;
  const isUserPick = currentPick ? teams[currentPick.teamIndex]?.isUser : false;
  const completedPicks = picks.filter(p => p.player !== null);

  const availablePlayers = players.filter(p => {
    if (draftedIds.current.has(p.mlbId)) return false;
    if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (posFilter !== 'All' && p.position !== posFilter) return false;
    return true;
  });

  const userTeam = teams.find(t => t.isUser);

  // ─── SETUP SCREEN ────────────────────────────────────────
  if (setupMode) {
    return (
      <div className="container" style={{ padding: '40px 24px', maxWidth: 700 }}>
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
            ⚾ Mock Draft
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Practice your draft strategy against AI opponents using real MLB player data.
          </p>
        </div>

        <div className="card animate-slide-up" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <Settings size={20} style={{ color: 'var(--green-400)' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Draft Settings</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Your Team Name
              </label>
              <input className="input" value={userTeamName}
                onChange={e => setUserTeamName(e.target.value)}
                placeholder="My Team" />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Number of Teams
              </label>
              <select className="input" value={numTeams} onChange={e => setNumTeams(Number(e.target.value))}>
                {[8, 10, 12, 14, 16].map(n => (
                  <option key={n} value={n}>{n} Teams</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Draft Position
              </label>
              <select className="input" value={userPickPosition} onChange={e => setUserPickPosition(Number(e.target.value))}>
                {Array.from({ length: numTeams }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Pick #{i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Pick Timer
              </label>
              <select className="input" value={pickTime} onChange={e => setPickTime(Number(e.target.value))}>
                {[15, 30, 45, 60, 90, 120].map(n => (
                  <option key={n} value={n}>{n} seconds</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Draft Type
              </label>
              <select className="input" disabled>
                <option>Snake Draft</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Rounds (from roster)
              </label>
              <div className="input" style={{
                display: 'flex', alignItems: 'center', background: 'var(--navy-700)',
                color: 'var(--green-400)', fontWeight: 700,
              }}>
                {numRounds} rounds ({activeSlots} starters + {totalSlots - activeSlots} bench)
              </div>
            </div>
          </div>

          {/* ─── Roster Configuration ─────────────────────── */}
          <div style={{ marginTop: 24 }}>
            <button type="button" onClick={() => setShowRosterSetup(!showRosterSetup)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--navy-700)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              }}>
              <span style={{ flex: 1, textAlign: 'left' }}>
                Roster Slots
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: '0.8rem' }}>
                  {activeSlots} starters + {totalSlots - activeSlots} bench = {totalSlots} total
                </span>
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {showRosterSetup ? '▲' : '▼'}
              </span>
            </button>

            {showRosterSetup && (
              <div style={{
                marginTop: 8, padding: 20, borderRadius: 'var(--radius-md)',
                background: 'var(--navy-800)', border: '1px solid var(--border-color)',
              }}>
                {/* Hitters */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Hitters
                  </div>
                  {SLOT_DEFS.filter(s => s.group === 'hitter').map(slot => (
                    <SetupSlotRow key={slot.key} slot={slot} value={rosterConfig[slot.key] || 0}
                      onUpdate={(d) => updateSlot(slot.key, d)} />
                  ))}
                </div>
                {/* Pitchers */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Pitchers
                  </div>
                  {SLOT_DEFS.filter(s => s.group === 'pitcher').map(slot => (
                    <SetupSlotRow key={slot.key} slot={slot} value={rosterConfig[slot.key] || 0}
                      onUpdate={(d) => updateSlot(slot.key, d)} />
                  ))}
                </div>
                {/* Bench */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Bench & IL
                  </div>
                  {SLOT_DEFS.filter(s => s.group === 'bench').map(slot => (
                    <SetupSlotRow key={slot.key} slot={slot} value={rosterConfig[slot.key] || 0}
                      onUpdate={(d) => updateSlot(slot.key, d)} />
                  ))}
                </div>

                <button type="button" onClick={() => setRosterConfig({ ...DEFAULT_ROSTER_CONFIG })}
                  style={{
                    marginTop: 12, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'transparent', border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem',
                  }}>
                  Reset to Default
                </button>
              </div>
            )}
          </div>

          <div style={{
            marginTop: 24, padding: '16px 20px', borderRadius: 'var(--radius-md)',
            background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.15)',
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--green-400)' }}>Snake Draft:</strong> Pick order reverses each round.
              You'll draft <strong>{numRounds} players</strong> to fill your roster slots against {numTeams - 1} AI opponents.
              AI teams use position-aware drafting for realistic simulation.
            </div>
          </div>

          <button onClick={startDraft} className="btn btn-primary"
            style={{ width: '100%', marginTop: 24, padding: '14px', fontSize: '1rem', justifyContent: 'center' }}
            disabled={draftStatus === 'loading' || totalSlots < 5}>
            {draftStatus === 'loading' ? (
              <>Loading Players...</>
            ) : (
              <><Play size={18} /> Start Mock Draft</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── DRAFT COMPLETE SCREEN ────────────────────────────────
  if (draftStatus === 'complete') {
    return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>Draft Complete!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Here's your final roster from the mock draft.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={resetDraft} className="btn btn-primary">
              <RotateCcw size={16} /> Draft Again
            </button>
            <button onClick={() => navigate('/stats')} className="btn btn-secondary">
              Stats Hub
            </button>
          </div>
        </div>

        {/* All Teams Results — slot-based */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {teams.map((team, idx) => {
            const filled = team.roster.filter(s => s.player !== null).length;
            return (
              <div key={idx} className="card" style={{
                padding: 0, overflow: 'hidden',
                border: team.isUser ? '2px solid var(--green-500)' : undefined,
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: team.isUser ? 'rgba(29,185,84,0.1)' : 'var(--bg-secondary)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {team.isUser ? <Trophy size={16} style={{ color: 'var(--green-400)' }} /> : <User size={14} style={{ color: 'var(--text-muted)' }} />}
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: filled >= totalSlots ? 'var(--green-400)' : 'var(--text-muted)' }}>
                    {filled}/{totalSlots} {team.isUser && <span className="badge badge-green" style={{ marginLeft: 4 }}>You</span>}
                  </span>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <RosterSlotView roster={team.roster} compact />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── ACTIVE DRAFT SCREEN ──────────────────────────────────
  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ─── Draft Header ─────────────────────────────────── */}
      <div style={{
        padding: '10px 20px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>⚾ Mock Draft</h2>
          <span className="badge badge-green">LIVE</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Pick {currentPickIndex + 1} of {picks.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isUserPick && timer > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} style={{ color: timer <= 10 ? 'var(--danger)' : 'var(--warning)' }} />
              <span style={{
                fontSize: '1.1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color: timer <= 10 ? 'var(--danger)' : timer <= 15 ? 'var(--warning)' : 'var(--text-primary)',
              }}>
                {timer}s
              </span>
            </div>
          )}
          <button onClick={resetDraft} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* ─── Current Pick Banner ──────────────────────────── */}
      {currentPick && (
        <div style={{
          padding: '8px 20px',
          background: isUserPick ? 'rgba(29,185,84,0.15)' : 'var(--navy-800)',
          borderBottom: isUserPick ? '2px solid var(--green-500)' : '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: '0.85rem',
        }}>
          <span style={{ fontWeight: 700, color: isUserPick ? 'var(--green-400)' : 'var(--text-muted)' }}>
            {isUserPick ? '🎯 YOUR PICK!' : 'On the clock:'}
          </span>
          <span style={{ fontWeight: 800 }}>
            Rd {currentPick.round}, Pick {currentPick.pick}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <span style={{ fontWeight: 600 }}>{currentPick.teamName}</span>
          {!isUserPick && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(AI picking...)</span>
          )}
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ─── Draft Board (left) ─────────────────────────── */}
        {showBoard && (
          <div style={{ width: 300, borderRight: '1px solid var(--border-color)', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Draft Board — {completedPicks.length}/{picks.length}
              </span>
              <button onClick={() => setShowBoard(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <ChevronDown size={14} />
              </button>
            </div>
            <div>
              {completedPicks.slice().reverse().map((pick) => (
                <div key={pick.overall} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                  borderBottom: '1px solid rgba(26,45,82,0.2)',
                  background: teams[pick.teamIndex]?.isUser ? 'rgba(29,185,84,0.05)' : 'transparent',
                }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', width: 28 }}>
                    {pick.round}.{pick.pick}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pick.player?.fullName}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {pick.teamName} {teams[pick.teamIndex]?.isUser ? '⭐' : ''}
                    </div>
                  </div>
                  <span className={`pos-${pick.player?.position?.toLowerCase()}`} style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                    {pick.player?.position}
                  </span>
                </div>
              ))}
              {completedPicks.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Waiting for first pick...
                </div>
              )}
            </div>
          </div>
        )}

        {!showBoard && (
          <button onClick={() => setShowBoard(true)} style={{
            position: 'absolute', left: 0, top: '50%', zIndex: 10,
            background: 'var(--navy-700)', border: '1px solid var(--border-color)',
            borderLeft: 'none', borderRadius: '0 8px 8px 0',
            padding: '8px 4px', cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <ChevronUp size={14} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        )}

        {/* ─── Available Players (center) ─────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search & Filters */}
          <div style={{
            padding: '8px 14px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <div style={{ position: 'relative', flex: '1 1 180px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Search players..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32, padding: '6px 10px 6px 32px', fontSize: '0.82rem' }} />
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {['All', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP', 'DH'].map(pos => (
                <button key={pos} onClick={() => setPosFilter(pos)}
                  style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: 'none',
                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                    background: posFilter === pos ? 'var(--green-500)' : 'var(--navy-700)',
                    color: posFilter === pos ? 'var(--navy-950)' : 'var(--text-secondary)',
                  }}>
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Player List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>Key Stats</th>
                  <th>Proj</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {availablePlayers.slice(0, 500).map((p, i) => (
                  <tr key={p.mlbId}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={p.headshotUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--navy-700)' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{p.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`pos-${p.position?.toLowerCase()}`} style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                        {p.position}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.team}</td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {p.stats ? (
                        p.stats.era != null
                          ? `${p.stats.wins ?? 0}W ${p.stats.era}ERA ${p.stats.strikeOuts ?? 0}K${p.stats.saves ? ` ${p.stats.saves}SV` : ''}`
                          : `${p.stats.avg ?? '-'}AVG ${p.stats.homeRuns ?? 0}HR ${p.stats.rbi ?? 0}RBI ${p.stats.stolenBases ?? 0}SB`
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--green-400)', fontSize: '0.82rem' }}>
                      {p.projectedPoints}
                    </td>
                    <td>
                      {isUserPick && (
                        <button onClick={() => makeUserPick(p)} className="btn btn-primary btn-sm"
                          style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                          Draft
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {availablePlayers.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                No players match your search.
              </div>
            )}
          </div>
        </div>

        {/* ─── Your Roster (right) — Slot-based ──────────── */}
        <div style={{ width: 300, borderLeft: '1px solid var(--border-color)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--border-color)',
            fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Trophy size={14} style={{ color: 'var(--green-400)' }} />
            Your Roster — {userTeam?.roster.filter(s => s.player).length || 0}/{numRounds}
          </div>
          {userTeam ? (
            <RosterSlotView roster={userTeam.roster} />
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Your picks will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Roster Slot View Component ─────────────────────────────
function RosterSlotView({ roster, compact }: { roster: RosterSlotEntry[]; compact?: boolean }) {
  // Group by section
  const hitterSlots = ['C', '1B', '2B', '3B', 'SS', 'OF', 'UTIL'];
  const pitcherSlots = ['SP', 'RP', 'P'];
  const benchSlots = ['BN', 'IL', 'MiLB'];

  const sections = [
    { label: 'Hitters', entries: roster.filter(s => hitterSlots.includes(s.slot)) },
    { label: 'Pitchers', entries: roster.filter(s => pitcherSlots.includes(s.slot)) },
    { label: 'Bench', entries: roster.filter(s => benchSlots.includes(s.slot)) },
  ].filter(s => s.entries.length > 0);

  return (
    <div>
      {sections.map(section => (
        <div key={section.label}>
          <div style={{
            padding: compact ? '4px 14px' : '6px 14px',
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-muted)',
            background: 'rgba(26,45,82,0.3)', borderBottom: '1px solid rgba(26,45,82,0.3)',
          }}>
            {section.label}
          </div>
          {section.entries.map((entry, i) => (
            <div key={`${entry.slot}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: compact ? '5px 14px' : '7px 14px',
              borderBottom: '1px solid rgba(26,45,82,0.2)',
              background: entry.player ? 'transparent' : 'rgba(26,45,82,0.06)',
            }}>
              <span style={{
                width: 28, fontWeight: 700, fontSize: '0.72rem', textAlign: 'center',
                color: entry.player ? 'var(--green-400)' : 'var(--text-muted)',
              }}>
                {entry.slot}
              </span>
              {entry.player ? (
                <>
                  {!compact && (
                    <img src={entry.player.headshotUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--navy-700)' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: compact ? '0.75rem' : '0.78rem', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {entry.player.fullName}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {entry.player.team} · {entry.player.position}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-400)' }}>
                    {entry.player.projectedPoints}
                  </span>
                </>
              ) : (
                <span style={{ flex: 1, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                  Empty
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Setup Slot Row ─────────────────────────────────────────
function SetupSlotRow({ slot, value, onUpdate }: {
  slot: { key: string; label: string; min: number; max: number };
  value: number;
  onUpdate: (delta: number) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0',
      borderBottom: '1px solid rgba(26,45,82,0.2)',
    }}>
      <span style={{ width: 30, fontWeight: 700, fontSize: '0.82rem', color: 'var(--green-400)' }}>
        {slot.key}
      </span>
      <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {slot.label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <button type="button" onClick={() => onUpdate(-1)} disabled={value <= slot.min}
          style={{
            width: 24, height: 24, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)', background: 'var(--navy-700)',
            color: value <= slot.min ? 'var(--navy-600)' : 'var(--text-secondary)',
            cursor: value <= slot.min ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Minus size={11} />
        </button>
        <span style={{
          width: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.9rem',
          fontVariantNumeric: 'tabular-nums',
          color: value > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          {value}
        </span>
        <button type="button" onClick={() => onUpdate(1)} disabled={value >= slot.max}
          style={{
            width: 24, height: 24, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)', background: 'var(--navy-700)',
            color: value >= slot.max ? 'var(--navy-600)' : 'var(--text-secondary)',
            cursor: value >= slot.max ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}