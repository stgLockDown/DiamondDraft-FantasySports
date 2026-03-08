import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leagueAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Plus, Users, Trophy, ChevronRight, Globe, LogIn, X } from 'lucide-react';

export default function Leagues() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [myLeagues, setMyLeagues] = useState<any[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'public'>('my');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Join modal state
  const [joinModal, setJoinModal] = useState<{ leagueId: string; leagueName: string; isPublic: boolean } | null>(null);
  const [joinTeamName, setJoinTeamName] = useState('');
  const [joinModalCode, setJoinModalCode] = useState('');
  const [joinModalError, setJoinModalError] = useState('');
  const [joinModalLoading, setJoinModalLoading] = useState(false);

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

  // Check if user is already in a league
  const isInLeague = (leagueId: string) => {
    return myLeagues.some(l => l.id === leagueId);
  };

  // Join by invite code — find the league first, then open modal
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoinError('');
    setJoinLoading(true);
    try {
      const res = await leagueAPI.findByCode(joinCode.trim());
      const league = res.data.league;
      if (league) {
        openJoinModal(league.id, league.name, league.isPublic);
        setJoinModalCode(joinCode.trim());
      } else {
        setJoinError('No league found with that invite code');
      }
    } catch {
      setJoinError('No league found with that invite code');
    } finally {
      setJoinLoading(false);
    }
  };

  const openJoinModal = (leagueId: string, leagueName: string, isPublic: boolean) => {
    setJoinModal({ leagueId, leagueName, isPublic });
    setJoinTeamName(user?.displayName ? `${user.displayName}'s Team` : 'My Team');
    setJoinModalError('');
    setJoinModalCode('');
  };

  const handleJoinLeague = async () => {
    if (!joinModal) return;
    setJoinModalError('');
    setJoinModalLoading(true);

    try {
      let leagueId = joinModal.leagueId;

      // If we don't have a league ID (private league via code), look it up
      if (!leagueId && joinModalCode) {
        try {
          const res = await leagueAPI.findByCode(joinModalCode);
          leagueId = res.data.league?.id;
        } catch {
          setJoinModalError('Could not find a league with that invite code.');
          setJoinModalLoading(false);
          return;
        }
        if (!leagueId) {
          setJoinModalError('Could not find a league with that invite code.');
          setJoinModalLoading(false);
          return;
        }
      }

      await leagueAPI.joinLeague(leagueId, {
        teamName: joinTeamName.trim() || undefined,
        inviteCode: joinModalCode || joinCode.trim() || undefined,
      });

      setJoinModal(null);
      setJoinCode('');
      await loadLeagues();
      navigate(`/leagues/${leagueId}`);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to join league';
      setJoinModalError(msg);
    } finally {
      setJoinModalLoading(false);
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
          onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
          style={{ flex: '1 1 200px', maxWidth: 300 }} />
        <button onClick={handleJoinByCode} className="btn btn-secondary btn-sm" disabled={joinLoading}>
          {joinLoading ? 'Finding...' : 'Join'}
        </button>
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
          {leagues.map((league) => {
            const alreadyIn = isInLeague(league.id);
            const isFull = (league._count?.teams || league.teams?.length || 0) >= league.maxTeams;
            const canJoin = tab === 'public' && !alreadyIn && !isFull && league.status === 'PRE_DRAFT';

            return (
              <div key={league.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              }}>
                <Link to={`/leagues/${league.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 16, flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0,
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
                      {alreadyIn && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Joined</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span><Users size={12} style={{ verticalAlign: -1 }} /> {league._count?.teams || league.teams?.length}/{league.maxTeams}</span>
                      <span>{league.format?.replace(/_/g, ' ')}</span>
                      <span>{league.draftType}</span>
                      {league.owner && <span>by {league.owner.displayName}</span>}
                    </div>
                  </div>
                </Link>

                {/* Join / View button */}
                {canJoin ? (
                  <button onClick={(e) => { e.preventDefault(); openJoinModal(league.id, league.name, league.isPublic); }}
                    className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    <LogIn size={14} /> Join
                  </button>
                ) : alreadyIn ? (
                  <Link to={`/leagues/${league.id}`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                    View <ChevronRight size={14} />
                  </Link>
                ) : isFull ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>Full</span>
                ) : (
                  <Link to={`/leagues/${league.id}`} style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                    <ChevronRight size={18} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Join Modal ─────────────────────────────────────────── */}
      {joinModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 24,
        }} onClick={() => setJoinModal(null)}>
          <div className="card animate-slide-up" style={{
            maxWidth: 440, width: '100%', padding: 32, position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setJoinModal(null)} style={{
              position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 6 }}>
              Join League
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              {joinModal.leagueName}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Your Team Name
                </label>
                <input className="input" value={joinTeamName}
                  onChange={e => setJoinTeamName(e.target.value)}
                  placeholder="Enter your team name" />
              </div>

              {!joinModal.isPublic && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Invite Code <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input className="input" value={joinModalCode}
                    onChange={e => setJoinModalCode(e.target.value)}
                    placeholder="Paste the invite code" />
                </div>
              )}

              {joinModalError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: 'var(--danger)', fontSize: '0.85rem',
                }}>
                  {joinModalError}
                </div>
              )}

              <button onClick={handleJoinLeague} className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={joinModalLoading || (!joinModal.isPublic && !joinModalCode.trim())}>
                {joinModalLoading ? 'Joining...' : (
                  <><LogIn size={16} /> Join League</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}