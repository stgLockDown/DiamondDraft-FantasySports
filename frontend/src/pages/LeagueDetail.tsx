import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { leagueAPI, chatAPI } from '../services/api';
import {
  Settings, Users, Trophy, MessageCircle, ArrowLeftRight,
  BarChart3, Copy, Check, Send, LogIn, X, UserPlus, Minus, Plus, Save
} from 'lucide-react';

type Tab = 'overview' | 'standings' | 'roster' | 'chat' | 'trades' | 'settings';

// Default roster slot order for display
const SLOT_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'UTIL', 'SP', 'RP', 'P', 'BN', 'IL', 'MiLB'];
const SLOT_LABELS: Record<string, string> = {
  C: 'Catcher', '1B': 'First Base', '2B': 'Second Base', '3B': 'Third Base',
  SS: 'Shortstop', OF: 'Outfield', UTIL: 'Utility', SP: 'Starting Pitcher',
  RP: 'Relief Pitcher', P: 'Pitcher', BN: 'Bench', IL: 'Injured List', MiLB: 'Minor League',
};

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

  // Join modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTeamName, setJoinTeamName] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

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

  const handleJoinLeague = async () => {
    if (!id) return;
    setJoinError('');
    setJoinLoading(true);
    try {
      await leagueAPI.joinLeague(id, {
        teamName: joinTeamName.trim() || undefined,
        inviteCode: joinInviteCode.trim() || undefined,
      });
      setShowJoinModal(false);
      await loadLeague(); // Refresh to show updated membership
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to join league';
      setJoinError(msg);
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="skeleton" style={{ height: 200, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 400 }} />
    </div>
  );

  if (!league) return null;

  const isCommissioner = league.ownerId === user?.id;
  const isMember = league.teams?.some((t: any) => t.userId === user?.id);
  const isFull = (league._count?.teams || league.teams?.length || 0) >= league.maxTeams;
  const canJoin = !isMember && !isFull && league.status === 'PRE_DRAFT';

  // Build roster config slots
  const rosterConfig: Record<string, number> = league.rosterConfig || {};

  // Build ordered slot list from rosterConfig
  const buildSlotList = (): { slot: string; index: number }[] => {
    const slots: { slot: string; index: number }[] = [];
    const orderedKeys = SLOT_ORDER.filter(k => (rosterConfig[k] || 0) > 0);
    // Also include any keys in rosterConfig not in SLOT_ORDER
    Object.keys(rosterConfig).forEach(k => {
      if (!SLOT_ORDER.includes(k) && rosterConfig[k] > 0) orderedKeys.push(k);
    });
    orderedKeys.forEach(key => {
      const count = rosterConfig[key] || 0;
      for (let i = 0; i < count; i++) {
        slots.push({ slot: key, index: i });
      }
    });
    return slots;
  };

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
          {isMember && (
            <button onClick={copyInvite} className="btn btn-secondary btn-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Invite Code'}
            </button>
          )}
          {canJoin && (
            <button onClick={() => {
              setJoinTeamName(user?.displayName ? `${user.displayName}'s Team` : 'My Team');
              setJoinInviteCode('');
              setJoinError('');
              setShowJoinModal(true);
            }} className="btn btn-primary btn-sm">
              <UserPlus size={14} /> Join League
            </button>
          )}
          {isFull && !isMember && (
            <span className="badge badge-gray" style={{ padding: '6px 12px' }}>League Full</span>
          )}
          {league.status === 'PRE_DRAFT' && isCommissioner && (
            <Link to={`/leagues/${id}/draft`} className="btn btn-primary btn-sm">
              Start Draft
            </Link>
          )}
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────── */}
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

            {/* Roster Configuration */}
            {Object.keys(rosterConfig).length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Roster Slots</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {SLOT_ORDER.filter(s => (rosterConfig[s] || 0) > 0).map(slot => (
                    <div key={slot} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                      borderBottom: '1px solid rgba(26,45,82,0.3)', fontSize: '0.85rem',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)', marginRight: 8 }}>{slot}</strong>
                        {SLOT_LABELS[slot] || slot}
                      </span>
                      <span style={{ fontWeight: 600 }}>×{rosterConfig[slot]}</span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                    fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-400)',
                  }}>
                    <span>Total Roster Size</span>
                    <span>{Object.values(rosterConfig).reduce((a: number, b: any) => a + (Number(b) || 0), 0)}</span>
                  </div>
                </div>
              </div>
            )}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
            {league.teams?.map((team: any) => {
              const slotList = buildSlotList();
              const rosterEntries: any[] = team.roster || [];

              // Map roster entries to slots
              const slotAssignments = slotList.map(({ slot, index }) => {
                // Find all roster entries for this slot type
                const entriesForSlot = rosterEntries.filter((e: any) => e.rosterSlot === slot);
                const entry = entriesForSlot[index] || null;
                return { slot, entry };
              });

              // Find any roster entries not matching a config slot (overflow)
              const assignedIds = new Set(slotAssignments.filter(s => s.entry).map(s => s.entry.id));
              const unassigned = rosterEntries.filter((e: any) => !assignedIds.has(e.id));

              const filledCount = rosterEntries.length;
              const totalSlots = slotList.length;

              return (
                <div key={team.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Team header */}
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{team.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.user?.displayName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 600,
                        color: filledCount >= totalSlots ? 'var(--green-400)' : 'var(--warning)',
                      }}>
                        {filledCount}/{totalSlots} slots filled
                      </span>
                    </div>
                  </div>

                  {/* Slot-based roster */}
                  <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                    {slotAssignments.map(({ slot, entry }, idx) => {
                      const isHitter = ['C', '1B', '2B', '3B', 'SS', 'OF', 'UTIL'].includes(slot);
                      const isBench = ['BN', 'IL', 'MiLB'].includes(slot);
                      const isPitcher = ['SP', 'RP', 'P'].includes(slot);

                      // Section dividers
                      const prevSlot = idx > 0 ? slotAssignments[idx - 1].slot : null;
                      const showDivider = idx === 0 ||
                        (isHitter && !['C', '1B', '2B', '3B', 'SS', 'OF', 'UTIL'].includes(prevSlot || '')) ||
                        (isPitcher && !['SP', 'RP', 'P'].includes(prevSlot || '')) ||
                        (isBench && !['BN', 'IL', 'MiLB'].includes(prevSlot || ''));

                      const sectionLabel = isHitter ? 'Hitters' : isPitcher ? 'Pitchers' : isBench ? 'Bench / IL' : '';

                      return (
                        <div key={`${slot}-${idx}`}>
                          {showDivider && sectionLabel && (
                            <div style={{
                              padding: '6px 16px', fontSize: '0.7rem', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                              color: 'var(--text-muted)', background: 'rgba(26,45,82,0.3)',
                              borderBottom: '1px solid rgba(26,45,82,0.3)',
                            }}>
                              {sectionLabel}
                            </div>
                          )}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px',
                            borderBottom: '1px solid rgba(26,45,82,0.2)', fontSize: '0.85rem',
                            background: entry ? 'transparent' : 'rgba(26,45,82,0.08)',
                          }}>
                            <span style={{
                              width: 32, fontWeight: 700, fontSize: '0.75rem', textAlign: 'center',
                              color: entry ? 'var(--green-400)' : 'var(--text-muted)',
                            }}>
                              {slot}
                            </span>
                            {entry ? (
                              <>
                                <span style={{ flex: 1, fontWeight: 500 }}>{entry.player?.fullName}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  {entry.player?.position} · {entry.player?.team}
                                </span>
                              </>
                            ) : (
                              <span style={{ flex: 1, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                Empty
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Show unassigned players (if any don't match config slots) */}
                    {unassigned.length > 0 && (
                      <>
                        <div style={{
                          padding: '6px 16px', fontSize: '0.7rem', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: 'var(--warning)', background: 'rgba(26,45,82,0.3)',
                          borderBottom: '1px solid rgba(26,45,82,0.3)',
                        }}>
                          Unassigned
                        </div>
                        {unassigned.map((entry: any) => (
                          <div key={entry.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px',
                            borderBottom: '1px solid rgba(26,45,82,0.2)', fontSize: '0.85rem',
                          }}>
                            <span style={{ width: 32, fontWeight: 700, fontSize: '0.75rem', textAlign: 'center', color: 'var(--warning)' }}>
                              {entry.rosterSlot || '?'}
                            </span>
                            <span style={{ flex: 1, fontWeight: 500 }}>{entry.player?.fullName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {entry.player?.position} · {entry.player?.team}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Empty state when no config and no roster */}
                    {slotList.length === 0 && rosterEntries.length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No players rostered yet
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
          <SettingsTab league={league} copyInvite={copyInvite} copied={copied} onUpdate={loadLeague} />
        )}
      </div>

      {/* ─── Join Modal ─────────────────────────────────────── */}
      {showJoinModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 24,
        }} onClick={() => setShowJoinModal(false)}>
          <div className="card animate-slide-up" style={{
            maxWidth: 440, width: '100%', padding: 32, position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowJoinModal(false)} style={{
              position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 6 }}>
              Join {league.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              {league.teams?.length}/{league.maxTeams} teams · {league.format?.replace(/_/g, ' ')}
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

              {!league.isPublic && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Invite Code <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input className="input" value={joinInviteCode}
                    onChange={e => setJoinInviteCode(e.target.value)}
                    placeholder="Paste the invite code" />
                </div>
              )}

              {joinError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: 'var(--danger)', fontSize: '0.85rem',
                }}>
                  {joinError}
                </div>
              )}

              <button onClick={handleJoinLeague} className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={joinLoading || (!league.isPublic && !joinInviteCode.trim())}>
                {joinLoading ? 'Joining...' : (
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

// ─── Roster Slot Definitions ────────────────────────────────
const SETTINGS_SLOTS = [
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

function SettingsTab({ league, copyInvite, copied, onUpdate }: {
  league: any; copyInvite: () => void; copied: boolean; onUpdate: () => void;
}) {
  const [editRoster, setEditRoster] = useState<Record<string, number> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const currentConfig: Record<string, number> = editRoster || league.rosterConfig || {};

  const updateSlot = (key: string, delta: number) => {
    const slot = SETTINGS_SLOTS.find(s => s.key === key);
    if (!slot) return;
    const cfg = { ...(editRoster || league.rosterConfig || {}) };
    const current = cfg[key] || 0;
    cfg[key] = Math.max(slot.min, Math.min(slot.max, current + delta));
    setEditRoster(cfg);
    setSaveMsg('');
  };

  const totalSlots = Object.values(currentConfig).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
  const benchSlots = (currentConfig.BN || 0) + (currentConfig.IL || 0);
  const activeSlots = totalSlots - benchSlots;

  const saveRosterConfig = async () => {
    if (!editRoster) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await leagueAPI.updateLeague(league.id, { rosterConfig: editRoster, rosterSize: totalSlots });
      setSaveMsg('Roster configuration saved!');
      setEditRoster(null);
      onUpdate();
    } catch (e: any) {
      setSaveMsg(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Invite Code */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>League Settings</h3>
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

      {/* Roster Configuration */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Roster Configuration</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {activeSlots} starters + {benchSlots} bench = {totalSlots} total
          </span>
        </div>

        {/* Hitters */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8,
          }}>Hitters</div>
          {SETTINGS_SLOTS.filter(s => s.group === 'hitter').map(slot => (
            <SettingsSlotRow key={slot.key} slot={slot} value={currentConfig[slot.key] || 0}
              onUpdate={(delta) => updateSlot(slot.key, delta)} />
          ))}
        </div>

        {/* Pitchers */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8,
          }}>Pitchers</div>
          {SETTINGS_SLOTS.filter(s => s.group === 'pitcher').map(slot => (
            <SettingsSlotRow key={slot.key} slot={slot} value={currentConfig[slot.key] || 0}
              onUpdate={(delta) => updateSlot(slot.key, delta)} />
          ))}
        </div>

        {/* Bench */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8,
          }}>Bench & IL</div>
          {SETTINGS_SLOTS.filter(s => s.group === 'bench').map(slot => (
            <SettingsSlotRow key={slot.key} slot={slot} value={currentConfig[slot.key] || 0}
              onUpdate={(delta) => updateSlot(slot.key, delta)} />
          ))}
        </div>

        {/* Save */}
        {editRoster && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={saveRosterConfig} className="btn btn-primary btn-sm" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Roster Config'}
            </button>
            <button onClick={() => { setEditRoster(null); setSaveMsg(''); }} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        )}
        {saveMsg && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: saveMsg.includes('saved') ? 'rgba(29,185,84,0.1)' : 'rgba(239,68,68,0.1)',
            color: saveMsg.includes('saved') ? 'var(--green-400)' : 'var(--danger)',
            fontSize: '0.85rem',
          }}>
            {saveMsg}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsSlotRow({ slot, value, onUpdate }: {
  slot: { key: string; label: string; min: number; max: number };
  value: number;
  onUpdate: (delta: number) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0',
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