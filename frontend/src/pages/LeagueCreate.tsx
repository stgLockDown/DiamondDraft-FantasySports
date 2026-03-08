import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueAPI } from '../services/api';
import { ArrowLeft, Trophy, Minus, Plus } from 'lucide-react';

const FORMATS = [
  { value: 'HEAD_TO_HEAD_POINTS', label: 'Head-to-Head Points', desc: 'Weekly matchups, total points wins' },
  { value: 'HEAD_TO_HEAD_CATEGORIES', label: 'Head-to-Head Categories', desc: 'Weekly matchups, win each stat category' },
  { value: 'ROTISSERIE', label: 'Rotisserie (Roto)', desc: 'Season-long cumulative stats ranking' },
  { value: 'POINTS_ONLY', label: 'Points Only', desc: 'Total season points, no matchups' },
  { value: 'BEST_BALL', label: 'Best Ball', desc: 'Auto-optimized lineups, no management' },
];

const DRAFT_TYPES = [
  { value: 'SNAKE', label: 'Snake Draft' },
  { value: 'AUCTION', label: 'Auction Draft' },
  { value: 'LINEAR', label: 'Linear Draft' },
  { value: 'THIRD_ROUND_REVERSAL', label: '3rd Round Reversal' },
];

// Roster slot definitions with display info
const ROSTER_SLOTS = [
  { key: 'C', label: 'Catcher', group: 'hitter', min: 0, max: 3 },
  { key: '1B', label: 'First Base', group: 'hitter', min: 0, max: 3 },
  { key: '2B', label: 'Second Base', group: 'hitter', min: 0, max: 3 },
  { key: '3B', label: 'Third Base', group: 'hitter', min: 0, max: 3 },
  { key: 'SS', label: 'Shortstop', group: 'hitter', min: 0, max: 3 },
  { key: 'OF', label: 'Outfield', group: 'hitter', min: 0, max: 6 },
  { key: 'UTIL', label: 'Utility', group: 'hitter', min: 0, max: 4 },
  { key: 'SP', label: 'Starting Pitcher', group: 'pitcher', min: 0, max: 8 },
  { key: 'RP', label: 'Relief Pitcher', group: 'pitcher', min: 0, max: 6 },
  { key: 'P', label: 'Pitcher (any)', group: 'pitcher', min: 0, max: 4 },
  { key: 'BN', label: 'Bench', group: 'bench', min: 0, max: 10 },
  { key: 'IL', label: 'Injured List', group: 'bench', min: 0, max: 5 },
];

const DEFAULT_ROSTER: Record<string, number> = {
  C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1,
  OF: 3, UTIL: 2, SP: 5, RP: 3, P: 0,
  BN: 5, IL: 3,
};

export default function LeagueCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRosterConfig, setShowRosterConfig] = useState(false);
  const [rosterConfig, setRosterConfig] = useState<Record<string, number>>({ ...DEFAULT_ROSTER });
  const [form, setForm] = useState({
    name: '', description: '', teamName: '',
    format: 'HEAD_TO_HEAD_POINTS', maxTeams: 12,
    draftType: 'SNAKE', isPublic: false,
    seasonYear: new Date().getFullYear(),
    leagueType: 'REDRAFT',
  });

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const updateSlot = (key: string, delta: number) => {
    const slot = ROSTER_SLOTS.find(s => s.key === key);
    if (!slot) return;
    const current = rosterConfig[key] || 0;
    const next = Math.max(slot.min, Math.min(slot.max, current + delta));
    setRosterConfig({ ...rosterConfig, [key]: next });
  };

  const totalSlots = Object.values(rosterConfig).reduce((a, b) => a + b, 0);
  const activeSlots = totalSlots - (rosterConfig.BN || 0) - (rosterConfig.IL || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('League name is required'); return; }
    if (totalSlots < 10) { setError('Roster must have at least 10 total slots'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await leagueAPI.createLeague({
        ...form,
        rosterConfig,
        rosterSize: totalSlots,
      });
      navigate(`/leagues/${data.league.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 24px', maxWidth: 700 }}>
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }} className="animate-fade-in">
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-lg)', margin: '0 auto 16px',
          background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trophy size={28} style={{ color: 'var(--green-400)' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Create a League</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Set up your league in under 3 minutes</p>
      </div>

      <div className="card animate-slide-up">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 20,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '0.875rem',
            }}>{error}</div>
          )}

          <div className="form-group">
            <label className="label">League Name *</label>
            <input className="input" placeholder="e.g., Diamond Kings 2026"
              value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="label">Your Team Name</label>
            <input className="input" placeholder="e.g., The Sluggers"
              value={form.teamName} onChange={(e) => update('teamName', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Tell people about your league..."
              value={form.description} onChange={(e) => update('description', e.target.value)}
              style={{ resize: 'vertical', minHeight: 80 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="label">League Format</label>
              <select className="input" value={form.format} onChange={(e) => update('format', e.target.value)}>
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Number of Teams</label>
              <select className="input" value={form.maxTeams} onChange={(e) => update('maxTeams', Number(e.target.value))}>
                {[6, 8, 10, 12, 14, 16, 18, 20, 24].map((n) => (
                  <option key={n} value={n}>{n} teams</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Draft Type</label>
              <select className="input" value={form.draftType} onChange={(e) => update('draftType', e.target.value)}>
                {DRAFT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="label">League Type</label>
              <select className="input" value={form.leagueType} onChange={(e) => update('leagueType', e.target.value)}>
                <option value="REDRAFT">Redraft (yearly)</option>
                <option value="KEEPER">Keeper</option>
                <option value="DYNASTY">Dynasty</option>
              </select>
            </div>
          </div>

          {/* ─── Roster Configuration ─────────────────────────── */}
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <button type="button" onClick={() => setShowRosterConfig(!showRosterConfig)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--navy-700)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              }}>
              <span style={{ flex: 1, textAlign: 'left' }}>
                Roster Configuration
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: '0.8rem' }}>
                  {activeSlots} starters + {(rosterConfig.BN || 0) + (rosterConfig.IL || 0)} bench = {totalSlots} total
                </span>
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {showRosterConfig ? '▲' : '▼'}
              </span>
            </button>

            {showRosterConfig && (
              <div style={{
                marginTop: 8, padding: 20, borderRadius: 'var(--radius-md)',
                background: 'var(--navy-800)', border: '1px solid var(--border-color)',
              }}>
                {/* Hitters */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10,
                  }}>
                    Hitters
                  </div>
                  {ROSTER_SLOTS.filter(s => s.group === 'hitter').map(slot => (
                    <SlotRow key={slot.key} slot={slot} value={rosterConfig[slot.key] || 0}
                      onUpdate={(delta) => updateSlot(slot.key, delta)} />
                  ))}
                </div>

                {/* Pitchers */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10,
                  }}>
                    Pitchers
                  </div>
                  {ROSTER_SLOTS.filter(s => s.group === 'pitcher').map(slot => (
                    <SlotRow key={slot.key} slot={slot} value={rosterConfig[slot.key] || 0}
                      onUpdate={(delta) => updateSlot(slot.key, delta)} />
                  ))}
                </div>

                {/* Bench / IL */}
                <div>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10,
                  }}>
                    Bench & IL
                  </div>
                  {ROSTER_SLOTS.filter(s => s.group === 'bench').map(slot => (
                    <SlotRow key={slot.key} slot={slot} value={rosterConfig[slot.key] || 0}
                      onUpdate={(delta) => updateSlot(slot.key, delta)} />
                  ))}
                </div>

                {/* Summary */}
                <div style={{
                  marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.15)',
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--green-400)' }}>{activeSlots}</strong> active slots +{' '}
                    <strong>{(rosterConfig.BN || 0) + (rosterConfig.IL || 0)}</strong> bench/IL
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--green-400)' }}>
                    {totalSlots} total roster spots
                  </span>
                </div>

                {/* Reset button */}
                <button type="button" onClick={() => setRosterConfig({ ...DEFAULT_ROSTER })}
                  style={{
                    marginTop: 10, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'transparent', border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem',
                  }}>
                  Reset to Default
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              fontSize: '0.9rem', color: 'var(--text-secondary)',
            }}>
              <input type="checkbox" checked={form.isPublic}
                onChange={(e) => update('isPublic', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--green-500)' }} />
              Make this league public (anyone can find and join)
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Creating...' : 'Create League'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Slot Row Component ─────────────────────────────────────
function SlotRow({ slot, value, onUpdate }: {
  slot: { key: string; label: string; min: number; max: number };
  value: number;
  onUpdate: (delta: number) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
      borderBottom: '1px solid rgba(26,45,82,0.2)',
    }}>
      <span style={{ width: 32, fontWeight: 700, fontSize: '0.85rem', color: 'var(--green-400)' }}>
        {slot.key}
      </span>
      <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {slot.label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" onClick={() => onUpdate(-1)} disabled={value <= slot.min}
          style={{
            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)', background: 'var(--navy-700)',
            color: value <= slot.min ? 'var(--navy-600)' : 'var(--text-secondary)',
            cursor: value <= slot.min ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Minus size={12} />
        </button>
        <span style={{
          width: 28, textAlign: 'center', fontWeight: 700, fontSize: '0.95rem',
          fontVariantNumeric: 'tabular-nums',
          color: value > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          {value}
        </span>
        <button type="button" onClick={() => onUpdate(1)} disabled={value >= slot.max}
          style={{
            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)', background: 'var(--navy-700)',
            color: value >= slot.max ? 'var(--navy-600)' : 'var(--text-secondary)',
            cursor: value >= slot.max ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}