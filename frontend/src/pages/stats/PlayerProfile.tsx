import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

type Tab = 'overview' | 'splits' | 'gamelog';

export default function PlayerProfile() {
  const { mlbId } = useParams<{ mlbId: string }>();
  const [tab, setTab] = useState<Tab>('overview');

  const { data, isLoading, error } = useQuery({
    queryKey: ['player-profile', mlbId],
    queryFn: () => statsHubAPI.playerProfile(Number(mlbId)),
    enabled: !!mlbId,
  });

  const { data: splitsData } = useQuery({
    queryKey: ['player-splits', mlbId],
    queryFn: () => statsHubAPI.playerSplits(Number(mlbId)),
    enabled: !!mlbId && tab === 'splits',
  });

  const { data: gamelogData } = useQuery({
    queryKey: ['player-gamelog', mlbId],
    queryFn: () => statsHubAPI.playerGamelog(Number(mlbId)),
    enabled: !!mlbId && tab === 'gamelog',
  });

  if (isLoading) return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, border: '3px solid var(--navy-700)',
        borderTopColor: 'var(--green-500)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading player data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data?.data) return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--danger)' }}>Failed to load player data</p>
      <Link to="/stats/players" className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
        ← Back to Search
      </Link>
    </div>
  );

  const player = data.data;
  const info = player.info || {};
  const stats = player.stats || {};
  const isPitcher = ['Pitcher', 'Two-Way Player'].includes(info.primaryPosition?.type || '') ||
    ['P', 'SP', 'RP', 'TWP'].includes(info.primaryPosition?.abbreviation || '');

  const hittingStats = stats.hitting || [];
  const pitchingStats = stats.pitching || [];
  const splits = splitsData?.data?.splits || [];
  const gamelog = gamelogData?.data?.gamelog || [];

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Back */}
        <Link to="/stats/players" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem',
          marginBottom: 20,
        }}>
          <ArrowLeft size={16} /> Back to Search
        </Link>

        {/* Player Header */}
        <div style={{
          display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', padding: 24,
        }}>
          <img
            src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${mlbId}/headshot/silo/current`}
            alt=""
            style={{
              width: 120, height: 120, borderRadius: 'var(--radius-lg)',
              background: 'var(--navy-700)', objectFit: 'cover',
            }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--chalk)', margin: '0 0 8px' }}>
              {info.fullName || `Player ${mlbId}`}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {info.primaryPosition?.abbreviation && (
                <span style={{
                  fontSize: '0.8rem', fontWeight: 700, padding: '3px 10px',
                  borderRadius: 6, background: 'var(--navy-700)',
                  color: isPitcher ? 'var(--blue-400, #60a5fa)' : 'var(--green-400)',
                }}>
                  {info.primaryPosition.abbreviation}
                </span>
              )}
              {info.currentTeam?.name && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {info.currentTeam.name}
                </span>
              )}
              {info.jerseyNumber && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  #{info.jerseyNumber}
                </span>
              )}
            </div>

            {/* Bio Details */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8, fontSize: '0.8rem',
            }}>
              {[
                { label: 'Bats', value: info.batSide?.description },
                { label: 'Throws', value: info.pitchHand?.description },
                { label: 'Height', value: info.height },
                { label: 'Weight', value: info.weight ? `${info.weight} lbs` : null },
                { label: 'Age', value: info.currentAge },
                { label: 'Born', value: info.birthCity ? `${info.birthCity}, ${info.birthStateProvince || info.birthCountry}` : null },
                { label: 'Debut', value: info.mlbDebutDate },
              ].filter(d => d.value).map(d => (
                <div key={d.label}>
                  <span style={{ color: 'var(--text-muted)' }}>{d.label}: </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--navy-800)', borderRadius: 'var(--radius-lg)',
          padding: 4, width: 'fit-content',
        }}>
          {([
            { key: 'overview', label: 'Season Stats', icon: TrendingUp },
            { key: 'splits', label: 'Splits', icon: BarChart3 },
            { key: 'gamelog', label: 'Game Log', icon: Calendar },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: tab === t.key ? 'var(--green-600)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              transition: 'all var(--transition-fast)',
            }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <div>
            {/* Hitting Stats */}
            {hittingStats.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green-400)', marginBottom: 12 }}>
                  Hitting
                </h3>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--navy-800)' }}>
                          {['Season', 'Team', 'G', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB', 'AVG', 'OBP', 'SLG', 'OPS'].map(h => (
                            <th key={h} style={{
                              padding: '8px 10px', textAlign: h === 'Season' || h === 'Team' ? 'left' : 'center',
                              color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem',
                              textTransform: 'uppercase', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hittingStats.map((s: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--navy-800)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--chalk)' }}>{s.season || '-'}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{s.team?.abbreviation || s.team?.name || '-'}</td>
                            {['gamesPlayed', 'atBats', 'runs', 'hits', 'doubles', 'triples', 'homeRuns', 'rbi', 'baseOnBalls', 'strikeOuts', 'stolenBases'].map(k => (
                              <td key={k} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                {s.stat?.[k] ?? '-'}
                              </td>
                            ))}
                            {['avg', 'obp', 'slg', 'ops'].map(k => (
                              <td key={k} style={{
                                padding: '8px 10px', textAlign: 'center', fontWeight: 600,
                                color: k === 'ops' ? 'var(--green-400)' : 'var(--chalk)',
                              }}>
                                {s.stat?.[k] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Pitching Stats */}
            {pitchingStats.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green-400)', marginBottom: 12 }}>
                  Pitching
                </h3>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--navy-800)' }}>
                          {['Season', 'Team', 'W', 'L', 'ERA', 'G', 'GS', 'SV', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'WHIP', 'AVG'].map(h => (
                            <th key={h} style={{
                              padding: '8px 10px', textAlign: h === 'Season' || h === 'Team' ? 'left' : 'center',
                              color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem',
                              textTransform: 'uppercase', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pitchingStats.map((s: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--navy-800)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--chalk)' }}>{s.season || '-'}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{s.team?.abbreviation || s.team?.name || '-'}</td>
                            {['wins', 'losses'].map(k => (
                              <td key={k} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                {s.stat?.[k] ?? '-'}
                              </td>
                            ))}
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--green-400)' }}>
                              {s.stat?.era || '-'}
                            </td>
                            {['gamesPlayed', 'gamesStarted', 'saves', 'inningsPitched', 'hits', 'runs', 'earnedRuns', 'baseOnBalls', 'strikeOuts'].map(k => (
                              <td key={k} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                {s.stat?.[k] ?? '-'}
                              </td>
                            ))}
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--chalk)' }}>
                              {s.stat?.whip || '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                              {s.stat?.avg || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'splits' && (
          <div>
            {splits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Loading splits data...
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}>
                {splits.map((splitGroup: any, gi: number) => (
                  <div key={gi} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '10px 16px', background: 'var(--navy-800)',
                      fontWeight: 700, fontSize: '0.85rem', color: 'var(--green-400)',
                    }}>
                      {splitGroup.splitType || splitGroup.group || `Split ${gi + 1}`}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr>
                            {['Split', isPitcher ? 'ERA' : 'AVG', isPitcher ? 'WHIP' : 'OPS', isPitcher ? 'SO' : 'HR', 'AB'].map(h => (
                              <th key={h} style={{
                                padding: '6px 10px', textAlign: h === 'Split' ? 'left' : 'center',
                                color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem',
                                borderBottom: '1px solid var(--navy-800)',
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(splitGroup.splits || []).map((s: any, si: number) => (
                            <tr key={si} style={{ borderBottom: '1px solid var(--navy-800)' }}>
                              <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {s.split?.description || '-'}
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 700 }}>
                                {isPitcher ? (s.stat?.era || '-') : (s.stat?.avg || '-')}
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                {isPitcher ? (s.stat?.whip || '-') : (s.stat?.ops || '-')}
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                {isPitcher ? (s.stat?.strikeOuts ?? '-') : (s.stat?.homeRuns ?? '-')}
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {s.stat?.atBats ?? s.stat?.inningsPitched ?? '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'gamelog' && (
          <div>
            {gamelog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Loading game log...
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--navy-800)' }}>
                        {isPitcher
                          ? ['Date', 'Opp', 'Dec', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'ERA', 'Pit'].map(h => (
                            <th key={h} style={{
                              padding: '8px 10px', textAlign: h === 'Date' || h === 'Opp' ? 'left' : 'center',
                              color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem',
                              textTransform: 'uppercase', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))
                          : ['Date', 'Opp', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB', 'AVG'].map(h => (
                            <th key={h} style={{
                              padding: '8px 10px', textAlign: h === 'Date' || h === 'Opp' ? 'left' : 'center',
                              color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem',
                              textTransform: 'uppercase', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {gamelog.slice(0, 30).map((g: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--navy-800)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-800)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {g.date || '-'}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--chalk)', fontWeight: 600 }}>
                            {g.isHome ? 'vs' : '@'} {g.opponent?.abbreviation || g.opponent?.name || '-'}
                          </td>
                          {isPitcher ? (
                            <>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: g.stat?.decision === 'W' ? 'var(--green-400)' : g.stat?.decision === 'L' ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {g.stat?.decision || '-'}
                              </td>
                              {['inningsPitched', 'hits', 'runs', 'earnedRuns', 'baseOnBalls', 'strikeOuts'].map(k => (
                                <td key={k} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                  {g.stat?.[k] ?? '-'}
                                </td>
                              ))}
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 600 }}>
                                {g.stat?.era || '-'}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {g.stat?.numberOfPitches ?? '-'}
                              </td>
                            </>
                          ) : (
                            <>
                              {['atBats', 'runs', 'hits', 'doubles', 'triples', 'homeRuns', 'rbi', 'baseOnBalls', 'strikeOuts', 'stolenBases'].map(k => (
                                <td key={k} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                                  {g.stat?.[k] ?? '-'}
                                </td>
                              ))}
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 600 }}>
                                {g.stat?.avg || '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}