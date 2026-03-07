import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: () => statsHubAPI.teamDetail(teamId!),
    enabled: !!teamId,
  });

  if (isLoading) return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, border: '3px solid var(--navy-700)',
        borderTopColor: 'var(--green-500)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading team data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data?.data) return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--danger)' }}>Failed to load team data</p>
      <Link to="/stats/teams" className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
        ← Back to Teams
      </Link>
    </div>
  );

  const team = data.data;
  const roster = team.roster || [];
  const stats = team.stats || {};

  const hitters = roster.filter((p: any) => p.position !== 'P' && p.position !== 'TWP');
  const pitchers = roster.filter((p: any) => p.position === 'P' || p.position === 'TWP');

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Back Link */}
        <Link to="/stats/teams" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem',
          marginBottom: 20,
        }}>
          <ArrowLeft size={16} /> Back to Teams
        </Link>

        {/* Team Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', padding: 24,
        }}>
          <img
            src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`}
            alt={team.name || 'Team'}
            style={{ width: 80, height: 80 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--chalk)', margin: 0 }}>
              {team.name || `Team ${teamId}`}
            </h1>
            {team.record && (
              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {team.record.wins}-{team.record.losses}
                {team.record.pct && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                    ({team.record.pct})
                  </span>
                )}
              </div>
            )}
            {team.venue && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {team.venue}
              </div>
            )}
          </div>
        </div>

        {/* Team Stats Summary */}
        {stats.hitting && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-400)',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <TrendingUp size={18} /> Team Statistics
            </h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 12,
            }}>
              {[
                { label: 'AVG', value: stats.hitting.avg },
                { label: 'OBP', value: stats.hitting.obp },
                { label: 'SLG', value: stats.hitting.slg },
                { label: 'OPS', value: stats.hitting.ops },
                { label: 'HR', value: stats.hitting.homeRuns },
                { label: 'RBI', value: stats.hitting.rbi },
                { label: 'R', value: stats.hitting.runs },
                { label: 'SB', value: stats.hitting.stolenBases },
              ].filter(s => s.value != null).map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--navy-800)', borderRadius: 'var(--radius-md)',
                  padding: '12px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--chalk)', marginTop: 4 }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roster - Hitters */}
        {hitters.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-400)',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Users size={18} /> Position Players ({hitters.length})
            </h2>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--navy-800)', borderBottom: '1px solid var(--border-color)' }}>
                      {['Player', 'POS', '#', 'B/T', 'AVG', 'HR', 'RBI', 'OPS'].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px', textAlign: h === 'Player' ? 'left' : 'center',
                          color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem',
                          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hitters.map((player: any, i: number) => (
                      <tr key={player.id || i} style={{
                        borderBottom: '1px solid var(--navy-800)',
                        transition: 'background var(--transition-fast)',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-800)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <Link to={`/stats/players/${player.mlbId || player.id}`} style={{
                            color: 'var(--chalk)', textDecoration: 'none', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <img
                              src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${player.mlbId || player.id}/headshot/silo/current`}
                              alt=""
                              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy-700)' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {player.fullName || player.name || `${player.firstName} ${player.lastName}`}
                          </Link>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {player.position}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {player.jerseyNumber || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {player.batSide || '-'}/{player.throwHand || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)', fontWeight: 600 }}>
                          {player.stats?.avg || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                          {player.stats?.homeRuns ?? '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                          {player.stats?.rbi ?? '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 600 }}>
                          {player.stats?.ops || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roster - Pitchers */}
        {pitchers.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-400)',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Users size={18} /> Pitchers ({pitchers.length})
            </h2>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--navy-800)', borderBottom: '1px solid var(--border-color)' }}>
                      {['Player', '#', 'B/T', 'W', 'L', 'ERA', 'WHIP', 'SO'].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px', textAlign: h === 'Player' ? 'left' : 'center',
                          color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem',
                          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pitchers.map((player: any, i: number) => (
                      <tr key={player.id || i} style={{
                        borderBottom: '1px solid var(--navy-800)',
                        transition: 'background var(--transition-fast)',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-800)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <Link to={`/stats/players/${player.mlbId || player.id}`} style={{
                            color: 'var(--chalk)', textDecoration: 'none', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <img
                              src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${player.mlbId || player.id}/headshot/silo/current`}
                              alt=""
                              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy-700)' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {player.fullName || player.name || `${player.firstName} ${player.lastName}`}
                          </Link>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {player.jerseyNumber || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {player.batSide || '-'}/{player.throwHand || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                          {player.stats?.wins ?? '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                          {player.stats?.losses ?? '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 600 }}>
                          {player.stats?.era || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                          {player.stats?.whip || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                          {player.stats?.strikeOuts ?? '-'}
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
    </div>
  );
}