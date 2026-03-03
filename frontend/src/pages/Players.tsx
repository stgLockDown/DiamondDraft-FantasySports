import { useEffect, useState } from 'react';
import { playerAPI } from '../services/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const POSITIONS = ['All', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP', 'UTIL'];
const MLB_TEAMS = ['All', 'ARI','ATL','BAL','BOS','CHC','CHW','CIN','CLE','COL','DET','HOU','KC','LAA','LAD','MIA','MIL','MIN','NYM','NYY','OAK','PHI','PIT','SD','SF','SEA','STL','TB','TEX','TOR','WSH'];

export default function Players() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('All');
  const [team, setTeam] = useState('All');
  const [sort, setSort] = useState('projectedPoints');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => { loadPlayers(); }, [search, position, team, sort, page]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 30, sort, order: 'desc' };
      if (search) params.search = search;
      if (position !== 'All') params.position = position;
      if (team !== 'All') params.team = team;
      const { data } = await playerAPI.search(params);
      setPlayers(data.players || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadPlayerDetail = async (id: string) => {
    try {
      const { data } = await playerAPI.getPlayer(id);
      setSelectedPlayer(data.player);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Player Rankings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Browse, search, and analyze MLB players</p>
      </div>

      {/* ─── Filters ─────────────────────────────────────────── */}
      <div className="card animate-slide-up" style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '16px 20px',
      }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search players..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" value={position} onChange={(e) => { setPosition(e.target.value); setPage(1); }}
          style={{ width: 'auto', minWidth: 100 }}>
          {POSITIONS.map((p) => <option key={p} value={p}>{p === 'All' ? 'All Positions' : p}</option>)}
        </select>
        <select className="input" value={team} onChange={(e) => { setTeam(e.target.value); setPage(1); }}
          style={{ width: 'auto', minWidth: 100 }}>
          {MLB_TEAMS.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Teams' : t}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}>
          <option value="projectedPoints">Projected Points</option>
          <option value="homeRuns">Home Runs</option>
          <option value="battingAvg">Batting Avg</option>
          <option value="rbi">RBI</option>
          <option value="stolenBases">Stolen Bases</option>
          <option value="era">ERA</option>
          <option value="strikeouts">Strikeouts</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedPlayer ? '1fr 380px' : '1fr', gap: 24 }}>
        {/* ─── Player Table ────────────────────────────────────── */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Player</th><th>Team</th><th>Pos</th>
                <th>HR</th><th>RBI</th><th>SB</th><th>AVG</th><th>OPS</th>
                <th>W</th><th>ERA</th><th>K</th><th>SV</th>
                <th style={{ color: 'var(--green-400)' }}>Proj Pts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={14}><div className="skeleton" style={{ height: 20 }} /></td></tr>
                ))
              ) : players.length === 0 ? (
                <tr><td colSpan={14} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No players found</td></tr>
              ) : players.map((p, i) => (
                <tr key={p.id} onClick={() => loadPlayerDetail(p.id)}
                  style={{ cursor: 'pointer', background: selectedPlayer?.id === p.id ? 'var(--accent-muted)' : undefined }}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{(page - 1) * 30 + i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={p.headshotUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy-700)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span style={{ fontWeight: 600 }}>{p.fullName}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.team}</td>
                  <td><span className={`pos-${p.position?.toLowerCase()}`} style={{ fontWeight: 700 }}>{p.position}</span></td>
                  <td>{p.homeRuns || '-'}</td>
                  <td>{p.rbi || '-'}</td>
                  <td>{p.stolenBases || '-'}</td>
                  <td>{p.battingAvg ? p.battingAvg.toFixed(3) : '-'}</td>
                  <td>{p.ops ? p.ops.toFixed(3) : '-'}</td>
                  <td>{p.wins_stat || '-'}</td>
                  <td>{p.era ? p.era.toFixed(2) : '-'}</td>
                  <td>{p.strikeouts || '-'}</td>
                  <td>{p.saves || '-'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--green-400)' }}>{p.projectedPoints || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Player Detail Sidebar ───────────────────────────── */}
        {selectedPlayer && (
          <div className="card animate-fade-in" style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src={selectedPlayer.headshotUrl} alt={selectedPlayer.fullName}
                style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px', background: 'var(--navy-700)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedPlayer.fullName}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {selectedPlayer.teamFullName} · <span className={`pos-${selectedPlayer.position?.toLowerCase()}`}>{selectedPlayer.position}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                {selectedPlayer.eligiblePositions?.map((pos: string) => (
                  <span key={pos} className="badge badge-gray">{pos}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatBox label="Proj Points" value={selectedPlayer.projectedPoints} highlight />
              <StatBox label="Age" value={selectedPlayer.age} />
              <StatBox label="Bats/Throws" value={`${selectedPlayer.bats}/${selectedPlayer.throws}`} />
              <StatBox label="Status" value={selectedPlayer.status?.replace(/_/g, ' ')} />
            </div>

            {selectedPlayer.position !== 'SP' && selectedPlayer.position !== 'RP' ? (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Hitting Stats</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <StatBox label="HR" value={selectedPlayer.homeRuns} />
                  <StatBox label="RBI" value={selectedPlayer.rbi} />
                  <StatBox label="SB" value={selectedPlayer.stolenBases} />
                  <StatBox label="AVG" value={selectedPlayer.battingAvg?.toFixed(3)} />
                  <StatBox label="OBP" value={selectedPlayer.obp?.toFixed(3)} />
                  <StatBox label="OPS" value={selectedPlayer.ops?.toFixed(3)} />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Pitching Stats</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <StatBox label="W" value={selectedPlayer.wins_stat} />
                  <StatBox label="ERA" value={selectedPlayer.era?.toFixed(2)} />
                  <StatBox label="WHIP" value={selectedPlayer.whip?.toFixed(2)} />
                  <StatBox label="K" value={selectedPlayer.strikeouts} />
                  <StatBox label="SV" value={selectedPlayer.saves} />
                  <StatBox label="IP" value={selectedPlayer.inningsPitched?.toFixed(1)} />
                </div>
              </div>
            )}

            <button onClick={() => setSelectedPlayer(null)} className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              Close
            </button>
          </div>
        )}
      </div>

      {/* ─── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1}
            onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 'var(--radius-sm)',
      background: highlight ? 'var(--accent-muted)' : 'var(--navy-700)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: highlight ? 'var(--green-400)' : 'var(--text-primary)' }}>
        {value ?? '-'}
      </div>
    </div>
  );
}