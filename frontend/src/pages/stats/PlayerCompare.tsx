import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

export default function PlayerCompare() {
  const [player1Search, setPlayer1Search] = useState('');
  const [player2Search, setPlayer2Search] = useState('');
  const [player1Id, setPlayer1Id] = useState<number | null>(null);
  const [player2Id, setPlayer2Id] = useState<number | null>(null);
  const [search1Active, setSearch1Active] = useState(false);
  const [search2Active, setSearch2Active] = useState(false);
  const [search1Term, setSearch1Term] = useState('');
  const [search2Term, setSearch2Term] = useState('');

  const { data: search1Data } = useQuery({
    queryKey: ['compare-search-1', search1Term],
    queryFn: () => statsHubAPI.search(search1Term),
    enabled: search1Term.length >= 2 && search1Active,
  });

  const { data: search2Data } = useQuery({
    queryKey: ['compare-search-2', search2Term],
    queryFn: () => statsHubAPI.search(search2Term),
    enabled: search2Term.length >= 2 && search2Active,
  });

  const { data: compareData, isLoading: compareLoading } = useQuery({
    queryKey: ['player-compare', player1Id, player2Id],
    queryFn: () => statsHubAPI.playerCompare([player1Id!, player2Id!]),
    enabled: !!player1Id && !!player2Id,
  });

  const players1 = search1Data?.data?.players || [];
  const players2 = search2Data?.data?.players || [];
  const comparison = compareData?.data?.players || [];

  const selectPlayer = (slot: 1 | 2, player: any) => {
    const id = player.mlbId || player.id;
    if (slot === 1) {
      setPlayer1Id(id);
      setPlayer1Search(player.fullName || player.name);
      setSearch1Active(false);
    } else {
      setPlayer2Id(id);
      setPlayer2Search(player.fullName || player.name);
      setSearch2Active(false);
    }
  };

  const clearPlayer = (slot: 1 | 2) => {
    if (slot === 1) { setPlayer1Id(null); setPlayer1Search(''); setSearch1Term(''); }
    else { setPlayer2Id(null); setPlayer2Search(''); setSearch2Term(''); }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Player Selection */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16,
          alignItems: 'start', marginBottom: 32,
        }}>
          {/* Player 1 Selector */}
          <PlayerSelector
            label="Player 1"
            searchValue={player1Search}
            onSearchChange={v => { setPlayer1Search(v); setSearch1Term(v); setSearch1Active(true); }}
            results={search1Active ? players1 : []}
            selectedId={player1Id}
            onSelect={p => selectPlayer(1, p)}
            onClear={() => clearPlayer(1)}
            onFocus={() => setSearch1Active(true)}
            onBlur={() => setTimeout(() => setSearch1Active(false), 200)}
            color="var(--green-400)"
          />

          {/* VS */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingTop: 32,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--navy-700)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)',
            }}>
              VS
            </div>
          </div>

          {/* Player 2 Selector */}
          <PlayerSelector
            label="Player 2"
            searchValue={player2Search}
            onSearchChange={v => { setPlayer2Search(v); setSearch2Term(v); setSearch2Active(true); }}
            results={search2Active ? players2 : []}
            selectedId={player2Id}
            onSelect={p => selectPlayer(2, p)}
            onClear={() => clearPlayer(2)}
            onFocus={() => setSearch2Active(true)}
            onBlur={() => setTimeout(() => setSearch2Active(false), 200)}
            color="var(--blue-400, #60a5fa)"
          />
        </div>

        {/* Comparison Results */}
        {!player1Id || !player2Id ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)',
          }}>
            <TrendingUp size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Compare Two Players
            </h3>
            <p style={{ fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
              Search and select two players above to see a detailed side-by-side comparison
              of their stats, splits, and performance metrics.
            </p>
          </div>
        ) : compareLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--navy-700)',
              borderTopColor: 'var(--green-500)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--text-muted)' }}>Comparing players...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : comparison.length >= 2 ? (
          <ComparisonTable p1={comparison[0]} p2={comparison[1]} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Unable to load comparison data. Try different players.
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerSelector({ label, searchValue, onSearchChange, results, selectedId, onSelect, onClear, onFocus, onBlur, color }: {
  label: string; searchValue: string; onSearchChange: (v: string) => void;
  results: any[]; selectedId: number | null; onSelect: (p: any) => void;
  onClear: () => void; onFocus: () => void; onBlur: () => void; color: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: '0.8rem', fontWeight: 700,
        color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </label>

      {selectedId ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-card)', border: `1px solid ${color}33`,
          borderRadius: 'var(--radius-lg)', padding: '10px 14px',
        }}>
          <img
            src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${selectedId}/headshot/silo/current`}
            alt="" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy-700)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={{ flex: 1, fontWeight: 600, color: 'var(--chalk)' }}>{searchValue}</span>
          <button onClick={onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            padding: 4,
          }}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Search player..."
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              background: 'var(--navy-800)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', color: 'var(--chalk)',
              fontSize: '0.9rem', outline: 'none',
            }}
          />

          {/* Dropdown */}
          {results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              marginTop: 4, background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', maxHeight: 240, overflowY: 'auto',
              zIndex: 50, boxShadow: 'var(--shadow-lg)',
            }}>
              {results.slice(0, 8).map((p: any) => (
                <button key={p.id || p.mlbId}
                  onMouseDown={() => onSelect(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 12px', background: 'transparent', border: 'none',
                    cursor: 'pointer', color: 'var(--chalk)', fontSize: '0.85rem',
                    textAlign: 'left', transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-700)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${p.mlbId || p.id}/headshot/silo/current`}
                    alt="" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy-600)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.fullName || p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {p.position} · {p.team || ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ p1, p2 }: { p1: any; p2: any }) {
  const p1Stats = p1.stats?.hitting?.[0]?.stat || p1.stats?.pitching?.[0]?.stat || {};
  const p2Stats = p2.stats?.hitting?.[0]?.stat || p2.stats?.pitching?.[0]?.stat || {};
  const isPitcher = !p1.stats?.hitting?.length;

  const hittingRows = [
    { label: 'Games', key: 'gamesPlayed', higher: true },
    { label: 'At Bats', key: 'atBats', higher: true },
    { label: 'Runs', key: 'runs', higher: true },
    { label: 'Hits', key: 'hits', higher: true },
    { label: 'Home Runs', key: 'homeRuns', higher: true },
    { label: 'RBI', key: 'rbi', higher: true },
    { label: 'Stolen Bases', key: 'stolenBases', higher: true },
    { label: 'Walks', key: 'baseOnBalls', higher: true },
    { label: 'Strikeouts', key: 'strikeOuts', higher: false },
    { label: 'AVG', key: 'avg', higher: true },
    { label: 'OBP', key: 'obp', higher: true },
    { label: 'SLG', key: 'slg', higher: true },
    { label: 'OPS', key: 'ops', higher: true },
  ];

  const pitchingRows = [
    { label: 'Wins', key: 'wins', higher: true },
    { label: 'Losses', key: 'losses', higher: false },
    { label: 'ERA', key: 'era', higher: false },
    { label: 'Games', key: 'gamesPlayed', higher: true },
    { label: 'Games Started', key: 'gamesStarted', higher: true },
    { label: 'Saves', key: 'saves', higher: true },
    { label: 'Innings Pitched', key: 'inningsPitched', higher: true },
    { label: 'Strikeouts', key: 'strikeOuts', higher: true },
    { label: 'Walks', key: 'baseOnBalls', higher: false },
    { label: 'WHIP', key: 'whip', higher: false },
    { label: 'Opp AVG', key: 'avg', higher: false },
  ];

  const rows = isPitcher ? pitchingRows : hittingRows;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 140px 1fr',
        background: 'var(--navy-800)', padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${p1.info?.id || p1.mlbId}/headshot/silo/current`}
            alt="" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy-600)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--green-400)', fontSize: '1rem' }}>
              {p1.info?.fullName || 'Player 1'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {p1.info?.primaryPosition?.abbreviation} · {p1.info?.currentTeam?.name || ''}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.85rem',
        }}>
          STAT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--blue-400, #60a5fa)', fontSize: '1rem' }}>
              {p2.info?.fullName || 'Player 2'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {p2.info?.primaryPosition?.abbreviation} · {p2.info?.currentTeam?.name || ''}
            </div>
          </div>
          <img
            src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${p2.info?.id || p2.mlbId}/headshot/silo/current`}
            alt="" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy-600)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Stat Rows */}
      {rows.map((row, i) => {
        const v1 = p1Stats[row.key];
        const v2 = p2Stats[row.key];
        const n1 = parseFloat(v1);
        const n2 = parseFloat(v2);
        const p1Better = !isNaN(n1) && !isNaN(n2) && (row.higher ? n1 > n2 : n1 < n2);
        const p2Better = !isNaN(n1) && !isNaN(n2) && (row.higher ? n2 > n1 : n2 < n1);

        return (
          <div key={row.key} style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 1fr',
            padding: '10px 20px', borderBottom: '1px solid var(--navy-800)',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
          }}>
            <div style={{
              fontWeight: p1Better ? 700 : 400, fontSize: '0.95rem',
              color: p1Better ? 'var(--green-400)' : 'var(--chalk)',
            }}>
              {v1 ?? '-'}
              {p1Better && <ArrowRight size={12} style={{ marginLeft: 6, color: 'var(--green-400)' }} />}
            </div>
            <div style={{
              textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--text-muted)', textTransform: 'uppercase',
            }}>
              {row.label}
            </div>
            <div style={{
              textAlign: 'right', fontWeight: p2Better ? 700 : 400, fontSize: '0.95rem',
              color: p2Better ? 'var(--blue-400, #60a5fa)' : 'var(--chalk)',
            }}>
              {p2Better && <ArrowRight size={12} style={{ marginRight: 6, color: 'var(--blue-400, #60a5fa)', transform: 'rotate(180deg)', display: 'inline-block' }} />}
              {v2 ?? '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}