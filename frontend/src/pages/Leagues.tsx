import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leagueAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Plus, Users, Trophy, ChevronRight, Globe } from 'lucide-react';

export default function Leagues() {
  useAuthStore();
  const navigate = useNavigate();
  const [myLeagues, setMyLeagues] = useState<any[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'public'>('my');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => { loadLeagues(); }, []);

  const loadLeagues = async () => {
    try {
      const [myRes, pubRes] = await Promise.all([
        leagueAPI.getMyLeagues(),
        leagueAPI.getPublicLeagues(),
      ]);
      setMyLeagues(myRes.data.leagues || []);
      setPublicLeagues(pubRes.data.leagues || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoinError('');
    try {
      // Find league by invite code — try joining with the code
      await leagueAPI.getMyLeagues();
      // For now, navigate to join page
      navigate(`/leagues/join?code=${joinCode}`);
    } catch (e: any) {
      setJoinError('Invalid invite code');
    }
  };

  const leagues = tab === 'my' ? myLeagues : publicLeagues;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Leagues</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your leagues or find new ones to join</p>
        </div>
        <Link to="/leagues/create" className="btn btn-primary">
          <Plus size={16} /> Create League
        </Link>
      </div>

      {/* Join by code */}
      <div className="card" style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '14px 20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Join with invite code:</span>
        <input className="input" placeholder="Paste invite code..." value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          style={{ flex: '1 1 200px', maxWidth: 300 }} />
        <button onClick={handleJoinByCode} className="btn btn-secondary btn-sm">Join</button>
        {joinError && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{joinError}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setTab('my')} style={{
          padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.9rem',
          color: tab === 'my' ? 'var(--green-400)' : 'var(--text-muted)',
          borderBottom: tab === 'my' ? '2px solid var(--green-500)' : '2px solid transparent',
        }}>
          <Trophy size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
          My Leagues ({myLeagues.length})
        </button>
        <button onClick={() => setTab('public')} style={{
          padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.9rem',
          color: tab === 'public' ? 'var(--green-400)' : 'var(--text-muted)',
          borderBottom: tab === 'public' ? '2px solid var(--green-500)' : '2px solid transparent',
        }}>
          <Globe size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
          Public Leagues
        </button>
      </div>

      {/* League List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : leagues.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Trophy size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: 8 }}>
            {tab === 'my' ? 'No Leagues Yet' : 'No Public Leagues Available'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            {tab === 'my' ? 'Create your first league or join one!' : 'Check back later for open leagues.'}
          </p>
          {tab === 'my' && (
            <Link to="/leagues/create" className="btn btn-primary">Create League</Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leagues.map((league) => (
            <Link key={league.id} to={`/leagues/${league.id}`} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit', padding: '16px 20px',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--navy-600), var(--navy-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
              }}>🏆</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{league.name}</span>
                  <span className={`badge ${league.status === 'IN_SEASON' ? 'badge-green' : league.status === 'PRE_DRAFT' ? 'badge-blue' : 'badge-gray'}`}>
                    {league.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                  <span><Users size={12} style={{ verticalAlign: -1 }} /> {league._count?.teams || league.teams?.length}/{league.maxTeams}</span>
                  <span>{league.format?.replace(/_/g, ' ')}</span>
                  <span>{league.draftType}</span>
                  {league.owner && <span>by {league.owner.displayName}</span>}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}