import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueAPI } from '../services/api';
import { ArrowLeft, Trophy } from 'lucide-react';

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

export default function LeagueCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', teamName: '',
    format: 'HEAD_TO_HEAD_POINTS', maxTeams: 12,
    draftType: 'SNAKE', isPublic: false,
    seasonYear: new Date().getFullYear(),
    leagueType: 'REDRAFT',
  });

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('League name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await leagueAPI.createLeague(form);
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