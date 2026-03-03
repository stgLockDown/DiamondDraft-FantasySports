import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { leagueAPI, chatAPI } from '../services/api';
import {
  Settings, Users, Trophy, MessageCircle, ArrowLeftRight,
  BarChart3, Copy, Check, Send
} from 'lucide-react';

type Tab = 'overview' | 'standings' | 'roster' | 'chat' | 'trades' | 'settings';

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (id) loadLeague();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && id) loadChat();
  }, [activeTab, id]);

  const loadLeague = async () => {
    try {
      const { data } = await leagueAPI.getLeague(id!);
      setLeague(data.league);
    } catch { navigate('/leagues'); }
    finally { setLoading(false); }
  };

  const loadChat = async () => {
    try {
      const { data } = await chatAPI.getMessages(id!);
      setChatMessages(data.messages || []);
    } catch (e) { console.error(e); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !id) return;
    try {
      const { data } = await chatAPI.sendMessage(id, chatInput.trim());
      setChatMessages([...chatMessages, data.message]);
      setChatInput('');
    } catch (e) { console.error(e); }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(league?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="skeleton" style={{ height: 200, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 400 }} />
    </div>
  );

  if (!league) return null;

  const isCommissioner = league.ownerId === user?.id;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'standings', label: 'Standings', icon: <Trophy size={16} /> },
    { key: 'roster', label: 'Rosters', icon: <Users size={16} /> },
    { key: 'chat', label: 'Chat', icon: <MessageCircle size={16} /> },
    { key: 'trades', label: 'Trades', icon: <ArrowLeftRight size={16} /> },
    ...(isCommissioner ? [{ key: 'settings' as Tab, label: 'Settings', icon: <Settings size={16} /> }] : []),
  ];

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      {/* ─── League Header ───────────────────────────────────── */}
      <div className="card animate-fade-in" style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, marginBottom: 24,
        background: 'linear-gradient(135deg, var(--navy-800), var(--navy-900))',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--green-500), var(--navy-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        }}>🏆</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{league.name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span className={`badge ${league.status === 'IN_SEASON' ? 'badge-green' : league.status === 'PRE_DRAFT' ? 'badge-blue' : 'badge-gray'}`}>
              {league.status?.replace(/_/g, ' ')}
            </span>
            <span>{league.teams?.length}/{league.maxTeams} teams</span>
            <span>{league.format?.replace(/_/g, ' ')}</span>
            <span>{league.draftType} draft</span>
            <span>{league.seasonYear}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={copyInvite} className="btn btn-secondary btn-sm">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Invite Code'}
          </button>
          {league.status === 'PRE_DRAFT' && isCommissioner && (
            <Link to={`/leagues/${id}/draft`} className="btn btn-primary btn-sm">
              Start Draft
            </Link>
          )}
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto',
        borderBottom: '1px solid var(--border-color)', paddingBottom: 0,
      }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: 'none', background: 'transparent',
              color: activeTab === tab.key ? 'var(--green-400)' : 'var(--text-muted)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid var(--green-500)' : '2px solid transparent',
              transition: 'all var(--transition-fast)', whiteSpace: 'nowrap',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─────────────────────────────────────── */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* League Info */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>League Info</h3>
              <InfoRow label="Commissioner" value={league.owner?.displayName} />
              <InfoRow label="Format" value={league.format?.replace(/_/g, ' ')} />
              <InfoRow label="Scoring" value={league.scoringType} />
              <InfoRow label="Draft Type" value={league.draftType} />
              <InfoRow label="Waivers" value={league.waiverType} />
              <InfoRow label="Lineup Changes" value={league.lineupChangeFreq} />
              <InfoRow label="Trade Review" value={league.tradeReviewType} />
              <InfoRow label="League Type" value={league.leagueType} />
              {league.description && (
                <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {league.description}
                </p>
              )}
            </div>

            {/* Teams */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Teams</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {league.teams?.map((team: any) => (
                  <Link key={team.id} to={`/teams/${team.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                    borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit',
                    background: team.userId === user?.id ? 'var(--accent-muted)' : 'transparent',
                    transition: 'background var(--transition-fast)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--navy-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {team.user?.displayName?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{team.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.user?.displayName}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {team.wins}-{team.losses}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th><th>Team</th><th>Manager</th><th>W</th><th>L</th><th>PF</th><th>PA</th>
                </tr>
              </thead>
              <tbody>
                {league.teams?.sort((a: any, b: any) => b.wins - a.wins || b.pointsFor - a.pointsFor)
                  .map((team: any, i: number) => (
                    <tr key={team.id}>
                      <td style={{ fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <Link to={`/teams/${team.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {team.name}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{team.user?.displayName}</td>
                      <td style={{ fontWeight: 600 }}>{team.wins}</td>
                      <td>{team.losses}</td>
                      <td style={{ color: 'var(--green-400)' }}>{team.pointsFor?.toFixed(1)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{team.pointsAgainst?.toFixed(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', height: 500, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <MessageCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : chatMessages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex', gap: 10,
                  flexDirection: msg.userId === user?.id ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: msg.userId === user?.id ? 'var(--green-500)' : 'var(--navy-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: msg.userId === user?.id ? 'var(--navy-950)' : 'var(--text-primary)',
                  }}>
                    {msg.user?.displayName?.charAt(0)}
                  </div>
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {msg.user?.displayName}
                    </div>
                    <div style={{
                      padding: '8px 14px', borderRadius: 'var(--radius-md)',
                      background: msg.userId === user?.id ? 'var(--green-500)' : 'var(--navy-700)',
                      color: msg.userId === user?.id ? 'var(--navy-950)' : 'var(--text-primary)',
                      fontSize: '0.9rem', lineHeight: 1.4,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '12px 16px', borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: 8,
            }}>
              <input className="input" placeholder="Type a message..."
                value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                style={{ flex: 1 }} />
              <button onClick={sendChat} className="btn btn-primary btn-sm">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
            {league.teams?.map((team: any) => (
              <div key={team.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{team.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.user?.displayName}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {team.roster?.length || 0} players
                  </span>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {team.roster?.length > 0 ? team.roster.map((entry: any) => (
                    <div key={entry.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                      borderBottom: '1px solid rgba(26,45,82,0.3)', fontSize: '0.85rem',
                    }}>
                      <span className={`pos-${entry.rosterSlot?.toLowerCase()}`}
                        style={{ width: 28, fontWeight: 700, fontSize: '0.75rem' }}>
                        {entry.rosterSlot}
                      </span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{entry.player?.fullName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {entry.player?.team}
                      </span>
                    </div>
                  )) : (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No players rostered yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <ArrowLeftRight size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: 8 }}>Trade Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No trades have been proposed yet. Visit a team page to propose a trade.
            </p>
          </div>
        )}

        {activeTab === 'settings' && isCommissioner && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>League Settings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
              As commissioner, you can modify league settings here.
            </p>
            <div style={{
              padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--navy-700)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Invite Code</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--green-400)' }}>
                  {league.inviteCode}
                </code>
                <button onClick={copyInvite} className="btn btn-ghost btn-sm">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <button className="btn btn-danger btn-sm">Delete League</button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: '1px solid rgba(26,45,82,0.3)', fontSize: '0.875rem',
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value?.replace(/_/g, ' ')}</span>
    </div>
  );
}