import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { draftAPI, playerAPI, statsHubAPI } from '../services/api';
import wsService from '../services/websocket';
import {
  Clock, Search, Send, Play, Zap,
  Check, X, MessageCircle
} from 'lucide-react';

export default function DraftRoom() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<any>(null);
  const [currentPick, setCurrentPick] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [timer, setTimer] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [pickQueue, setPickQueue] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (leagueId) {
      loadDraft();
      loadPlayers();
      // Connect WebSocket
      wsService.connect(leagueId, 'draft');
      wsService.on('draft_pick_made', handleWsPick);
      wsService.on('chat_message', handleWsChat);
    }
    return () => {
      wsService.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [leagueId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadDraft = async () => {
    try {
      const { data } = await draftAPI.getDraft(leagueId!);
      setDraft(data.draft);
      setCurrentPick(data.currentPick);
      if (data.draft?.status === 'IN_PROGRESS' && data.draft?.timerExpiresAt) {
        startTimer(new Date(data.draft.timerExpiresAt));
      }
    } catch { /* draft may not exist yet */ }
    finally { setLoading(false); }
  };

  const loadPlayers = async () => {
    try {
      // Try loading all MLB players from Stats Hub API first
      const { data } = await statsHubAPI.allPlayers();
      if (data.players?.length > 0) {
        setPlayers(data.players);
        return;
      }
    } catch { /* Stats Hub not available, fall back to DB */ }

    try {
      // Fallback: load from DB with higher limit
      const { data } = await playerAPI.search({ limit: 1500, sort: 'projectedPoints', order: 'desc' });
      setPlayers(data.players || []);
    } catch (e) { console.error(e); }
  };

  const handleWsPick = (_data: any) => {
    loadDraft(); // Reload draft state
    loadPlayers();
  };

  const handleWsChat = (data: any) => {
    if (data.message) setChatMessages((prev) => [...prev, data.message]);
  };

  const startTimer = (expiresAt: Date) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimer(remaining);
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);
  };

  const handleStartDraft = async () => {
    if (!draft) {
      try {
        const { data } = await draftAPI.createDraft(leagueId!);
        setDraft(data.draft);
      } catch (e: any) { alert(e.response?.data?.error || 'Failed to create draft'); return; }
    }
    try {
      await draftAPI.startDraft(draft?.id || (await draftAPI.getDraft(leagueId!)).data.draft.id);
      loadDraft();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed to start draft'); }
  };

  const handleMakePick = async (playerId: string) => {
    if (!draft) return;
    try {
      await draftAPI.makePick(draft.id, playerId);
      wsService.sendDraftPick(draft.id, playerId);
      loadDraft();
      loadPlayers();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed to make pick'); }
  };

  const handleAutoPick = async () => {
    if (!draft) return;
    try {
      await draftAPI.autoPick(draft.id);
      loadDraft();
      loadPlayers();
    } catch (e: any) { alert(e.response?.data?.error || 'Auto-pick failed'); }
  };

  const toggleQueue = (playerId: string) => {
    setPickQueue((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    wsService.sendChat(chatInput.trim());
    setChatInput('');
  };

  // Filter players — handle both DB (id) and Stats Hub (mlbId) formats
  const draftedPlayerIds = new Set(draft?.picks?.filter((p: any) => p.playerId).map((p: any) => p.playerId) || []);
  const availablePlayers = players.filter((p: any) => {
    const pid = p.id || p.mlbId;
    if (draftedPlayerIds.has(pid) || draftedPlayerIds.has(String(pid))) return false;
    if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (posFilter !== 'All' && p.position !== posFilter) return false;
    return true;
  });

  const isMyPick = currentPick?.team?.user?.id === user?.id;
  const completedPicks = draft?.picks?.filter((p: any) => p.playerId) || [];

  if (loading) return (
    <div className="container" style={{ padding: 40 }}>
      <div className="skeleton" style={{ height: 600 }} />
    </div>
  );

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ─── Draft Header ────────────────────────────────────── */}
      <div style={{
        padding: '12px 24px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>⚾ Draft Room</h2>
          <span className={`badge ${draft?.status === 'IN_PROGRESS' ? 'badge-green' : draft?.status === 'COMPLETED' ? 'badge-gray' : 'badge-blue'}`}>
            {draft?.status?.replace(/_/g, ' ') || 'NOT STARTED'}
          </span>
          {draft?.status === 'IN_PROGRESS' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: timer <= 10 ? 'var(--danger)' : 'var(--warning)' }} />
              <span style={{
                fontSize: '1.2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color: timer <= 10 ? 'var(--danger)' : timer <= 30 ? 'var(--warning)' : 'var(--text-primary)',
              }}>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!draft || draft.status === 'SCHEDULED' ? (
            <button onClick={handleStartDraft} className="btn btn-primary btn-sm">
              <Play size={14} /> Start Draft
            </button>
          ) : draft.status === 'IN_PROGRESS' && (
            <>
              {isMyPick && (
                <button onClick={handleAutoPick} className="btn btn-secondary btn-sm">
                  <Zap size={14} /> Auto Pick
                </button>
              )}
              <button onClick={() => setShowChat(!showChat)} className="btn btn-ghost btn-sm">
                <MessageCircle size={14} /> Chat
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Current Pick Banner ─────────────────────────────── */}
      {draft?.status === 'IN_PROGRESS' && currentPick && (
        <div style={{
          padding: '10px 24px',
          background: isMyPick ? 'rgba(29,185,84,0.15)' : 'var(--navy-800)',
          borderBottom: isMyPick ? '2px solid var(--green-500)' : '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          animation: isMyPick ? 'pulse-glow 2s infinite' : 'none',
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isMyPick ? 'var(--green-400)' : 'var(--text-secondary)' }}>
            {isMyPick ? '🎯 YOUR PICK!' : `On the clock:`}
          </span>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>
            Round {currentPick.round}, Pick {currentPick.pickNumber}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>—</span>
          <span style={{ fontWeight: 600 }}>{currentPick.team?.name}</span>
        </div>
      )}

      {/* ─── Main Content ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ─── Draft Board (left) ──────────────────────────────── */}
        <div style={{ width: 320, borderRight: '1px solid var(--border-color)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Draft Board — {completedPicks.length}/{draft?.picks?.length || 0} picks
          </div>
          <div>
            {completedPicks.map((pick: any) => (
              <div key={pick.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                borderBottom: '1px solid rgba(26,45,82,0.3)',
                background: pick.isAutoPick ? 'rgba(245,158,11,0.05)' : 'transparent',
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', width: 30 }}>
                  {pick.round}.{((pick.pickNumber - 1) % (draft?.league?.maxTeams || 12)) + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pick.player?.fullName || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {pick.team?.name} {pick.isAutoPick && '(auto)'}
                  </div>
                </div>
                <span className={`pos-${pick.player?.position?.toLowerCase()}`} style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  {pick.player?.position}
                </span>
              </div>
            ))}
            {completedPicks.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No picks made yet
              </div>
            )}
          </div>
        </div>

        {/* ─── Available Players (center) ──────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search & Filters */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Search players..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 32, padding: '6px 10px 6px 32px', fontSize: '0.85rem' }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['All', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP'].map((pos) => (
                <button key={pos} onClick={() => setPosFilter(pos)}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
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
                  <th style={{ width: 40 }}></th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>Pts</th>
                  <th>Key Stats</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {availablePlayers.slice(0, 500).map((p: any) => (
                  <tr key={p.id || p.mlbId} style={{
                    background: pickQueue.includes(p.id || p.mlbId) ? 'rgba(59,130,246,0.1)' : undefined,
                  }}>
                    <td>
                      <button onClick={() => toggleQueue(p.id || p.mlbId)} style={{
                        width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border-light)',
                        background: pickQueue.includes(p.id || p.mlbId) ? 'var(--info)' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {pickQueue.includes(p.id || p.mlbId) && <Check size={12} color="white" />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={p.headshotUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--navy-700)' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.fullName}</span>
                      </div>
                    </td>
                    <td><span className={`pos-${p.position?.toLowerCase()}`} style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.position}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.team}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green-400)', fontSize: '0.85rem' }}>{p.projectedPoints}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {p.position === 'SP' || p.position === 'RP'
                        ? `${p.pitching?.wins ?? p.wins_stat ?? 0}W ${p.pitching?.era ?? (p.era != null ? p.era.toFixed(2) : '-')}ERA ${p.pitching?.strikeOuts ?? p.strikeouts ?? 0}K`
                        : `${p.hitting?.homeRuns ?? p.homeRuns ?? 0}HR ${p.hitting?.rbi ?? p.rbi ?? 0}RBI ${p.hitting?.stolenBases ?? p.stolenBases ?? 0}SB ${p.hitting?.avg ?? (p.battingAvg != null ? '.' + (p.battingAvg * 1000).toFixed(0) : '-')}`
                      }
                    </td>
                    <td>
                      {isMyPick && draft?.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleMakePick(p.id || p.mlbId)} className="btn btn-primary btn-sm"
                          style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                          Draft
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Chat Panel (right) ──────────────────────────────── */}
        {showChat && (
          <div style={{
            width: 300, borderLeft: '1px solid var(--border-color)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Draft Chat</span>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--green-400)' }}>{msg.user?.displayName || 'User'}: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 6 }}>
              <input className="input" placeholder="Chat..." value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }} />
              <button onClick={sendChat} className="btn btn-primary btn-sm" style={{ padding: '6px 10px' }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Draft Complete Overlay ───────────────────────────── */}
      {draft?.status === 'COMPLETED' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card animate-slide-up" style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Draft Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              All picks are in. Time to manage your roster and dominate the season.
            </p>
            <button onClick={() => navigate(`/leagues/${leagueId}`)} className="btn btn-primary">
              Go to League
            </button>
          </div>
        </div>
      )}
    </div>
  );
}