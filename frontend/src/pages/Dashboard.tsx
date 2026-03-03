import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { leagueAPI, playerAPI } from '../services/api';
import {
  Plus, Trophy, Users, ArrowRight, Zap,
  Star, ChevronRight, BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leagueRes, playerRes] = await Promise.all([
        leagueAPI.getMyLeagues().catch(() => ({ data: { leagues: [] } })),
        playerAPI.getTopPerformers({ limit: 10 }).catch(() => ({ data: { players: [] } })),
      ]);
      setLeagues(leagueRes.data.leagues || []);
      setTopPlayers(playerRes.data.players || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }} className="animate-fade-in">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>
          {getGreeting()}, {user?.displayName?.split(' ')[0]} ⚾
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Here's what's happening across your leagues.
        </p>
      </div>

      {/* ─── Quick Actions ───────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
      }} className="animate-slide-up">
        <QuickAction icon={<Plus size={20} />} label="Create League" sublabel="Start a new league"
          onClick={() => navigate('/leagues/create')} color="var(--green-500)" />
        <QuickAction icon={<Users size={20} />} label="Join League" sublabel="Use an invite code"
          onClick={() => navigate('/leagues/join')} color="var(--info)" />
        <QuickAction icon={<Zap size={20} />} label="Mock Draft" sublabel="Practice your strategy"
          onClick={() => navigate('/mock-draft')} color="var(--warning)" />
        <QuickAction icon={<BarChart3 size={20} />} label="Player Rankings" sublabel="Browse all players"
          onClick={() => navigate('/players')} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* ─── My Leagues ──────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>My Leagues</h2>
            <Link to="/leagues" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : leagues.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Trophy size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>No Leagues Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                Create your first league or join one with an invite code.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link to="/leagues/create" className="btn btn-primary btn-sm">Create League</Link>
                <Link to="/leagues/join" className="btn btn-secondary btn-sm">Join League</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leagues.map((league) => (
                <LeagueCard key={league.id} league={league} userId={user?.id} />
              ))}
            </div>
          )}
        </div>

        {/* ─── Sidebar ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Players */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                <Star size={16} style={{ color: 'var(--warning)', marginRight: 6, verticalAlign: -2 }} />
                Top Projected Players
              </h3>
              <Link to="/players" style={{ fontSize: '0.8rem' }}>See All</Link>
            </div>
            <div>
              {topPlayers.slice(0, 8).map((player, i) => (
                <div key={player.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px',
                  borderBottom: i < 7 ? '1px solid rgba(26,45,82,0.3)' : 'none',
                }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                    width: 20, textAlign: 'center',
                  }}>
                    {i + 1}
                  </span>
                  <img src={player.headshotUrl} alt={player.fullName}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy-700)' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {player.team} · <span className={`pos-${player.position?.toLowerCase()}`}>{player.position}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-400)' }}>
                      {player.projectedPoints}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          {user?.tier === 'FREE' && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(29,185,84,0.1), rgba(29,185,84,0.05))',
              border: '1px solid rgba(29,185,84,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Zap size={20} style={{ color: 'var(--green-400)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Upgrade to Pro</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Unlock AI trade analysis, advanced mock drafts, real-time scoring, and unlimited leagues.
              </p>
              <Link to="/pricing" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Go Pro — $49/year <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function QuickAction({ icon, label, sublabel, onClick, color }: {
  icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; color: string;
}) {
  return (
    <button onClick={onClick} className="card" style={{
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      padding: '16px 20px', textAlign: 'left', width: '100%',
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--radius-md)',
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sublabel}</div>
      </div>
    </button>
  );
}

function LeagueCard({ league, userId }: { league: any; userId?: string }) {
  const myTeam = league.teams?.find((t: any) => t.userId === userId);
  const statusColors: Record<string, string> = {
    PRE_DRAFT: 'badge-blue', DRAFTING: 'badge-yellow', IN_SEASON: 'badge-green',
    PLAYOFFS: 'badge-red', COMPLETED: 'badge-gray',
  };

  return (
    <Link to={`/leagues/${league.id}`} className="card" style={{
      display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none',
      color: 'inherit', padding: '16px 20px',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, var(--navy-600), var(--navy-700))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', flexShrink: 0,
      }}>
        🏆
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {league.name}
          </span>
          <span className={`badge ${statusColors[league.status] || 'badge-gray'}`}>
            {league.status?.replace(/_/g, ' ')}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
          <span>{league._count?.teams || league.teams?.length || 0}/{league.maxTeams} teams</span>
          <span>{league.format?.replace(/_/g, ' ')}</span>
          {myTeam && <span>Record: {myTeam.wins}-{myTeam.losses}</span>}
        </div>
      </div>
      <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </Link>
  );
}