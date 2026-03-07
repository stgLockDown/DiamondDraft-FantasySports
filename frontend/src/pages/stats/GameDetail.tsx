import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

export default function GameDetail() {
  const { gamePk } = useParams<{ gamePk: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['game-detail', gamePk],
    queryFn: () => statsHubAPI.gameDetail(Number(gamePk)),
    enabled: !!gamePk,
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, border: '3px solid var(--navy-700)',
        borderTopColor: 'var(--green-500)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading game data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data?.data) return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--danger)' }}>Failed to load game data</p>
      <Link to="/stats" className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
        ← Back to Scoreboard
      </Link>
    </div>
  );

  const game = data.data;
  const linescore = game.linescore || {};
  const boxscore = game.boxscore || {};
  const away = game.gameData?.teams?.away || {};
  const home = game.gameData?.teams?.home || {};
  const status = game.gameData?.status || {};
  const isLive = status.abstractGameState === 'Live';
  const isFinal = status.abstractGameState === 'Final';
  const innings = linescore.innings || [];

  const awayBatters = boxscore.teams?.away?.batters || [];
  const homeBatters = boxscore.teams?.home?.batters || [];
  const awayPitchers = boxscore.teams?.away?.pitchers || [];
  const homePitchers = boxscore.teams?.home?.pitchers || [];
  const allPlayers = boxscore.teams?.away?.players || {};
  const allHomePlayers = boxscore.teams?.home?.players || {};

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Back */}
        <Link to="/stats" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem',
          marginBottom: 20,
        }}>
          <ArrowLeft size={16} /> Back to Scoreboard
        </Link>

        {/* Game Header / Linescore */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24,
        }}>
          {/* Status Bar */}
          <div style={{
            padding: '8px 20px', background: isLive ? 'var(--green-600)' : 'var(--navy-800)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            <span style={{ color: isLive ? 'white' : 'var(--text-muted)' }}>
              {isLive && <Activity size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />}
              {status.detailedState || status.abstractGameState || 'Scheduled'}
            </span>
            {game.gameData?.datetime?.officialDate && (
              <span style={{ color: isLive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                {game.gameData.datetime.officialDate}
              </span>
            )}
          </div>

          {/* Linescore Table */}
          <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, minWidth: 160 }}>Team</th>
                  {innings.map((_: any, i: number) => (
                    <th key={i} style={{
                      padding: '6px 8px', textAlign: 'center', color: 'var(--text-muted)',
                      fontWeight: 600, minWidth: 32,
                    }}>{i + 1}</th>
                  ))}
                  <th style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, borderLeft: '2px solid var(--navy-700)' }}>R</th>
                  <th style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>H</th>
                  <th style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>E</th>
                </tr>
              </thead>
              <tbody>
                {/* Away */}
                <tr style={{ borderTop: '1px solid var(--navy-700)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={`https://www.mlbstatic.com/team-logos/${away.id}.svg`} alt=""
                        style={{ width: 28, height: 28 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--chalk)' }}>
                        {away.abbreviation || away.teamName || 'Away'}
                      </span>
                    </div>
                  </td>
                  {innings.map((inn: any, i: number) => (
                    <td key={i} style={{
                      padding: '8px', textAlign: 'center', color: 'var(--chalk)',
                      fontWeight: (inn.away?.runs || 0) > 0 ? 700 : 400,
                    }}>
                      {inn.away?.runs ?? '-'}
                    </td>
                  ))}
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--chalk)', borderLeft: '2px solid var(--navy-700)' }}>
                    {linescore.teams?.away?.runs ?? '-'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                    {linescore.teams?.away?.hits ?? '-'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                    {linescore.teams?.away?.errors ?? '-'}
                  </td>
                </tr>
                {/* Home */}
                <tr style={{ borderTop: '1px solid var(--navy-700)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={`https://www.mlbstatic.com/team-logos/${home.id}.svg`} alt=""
                        style={{ width: 28, height: 28 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--chalk)' }}>
                        {home.abbreviation || home.teamName || 'Home'}
                      </span>
                    </div>
                  </td>
                  {innings.map((inn: any, i: number) => (
                    <td key={i} style={{
                      padding: '8px', textAlign: 'center', color: 'var(--chalk)',
                      fontWeight: (inn.home?.runs || 0) > 0 ? 700 : 400,
                    }}>
                      {inn.home?.runs ?? '-'}
                    </td>
                  ))}
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--chalk)', borderLeft: '2px solid var(--navy-700)' }}>
                    {linescore.teams?.home?.runs ?? '-'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                    {linescore.teams?.home?.hits ?? '-'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--chalk)' }}>
                    {linescore.teams?.home?.errors ?? '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Boxscore - Batting */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
          <BattingBox
            label={`${away.teamName || 'Away'} Batting`}
            teamId={away.id}
            batterIds={awayBatters}
            players={allPlayers}
          />
          <BattingBox
            label={`${home.teamName || 'Home'} Batting`}
            teamId={home.id}
            batterIds={homeBatters}
            players={allHomePlayers}
          />
        </div>

        {/* Boxscore - Pitching */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <PitchingBox
            label={`${away.teamName || 'Away'} Pitching`}
            teamId={away.id}
            pitcherIds={awayPitchers}
            players={allPlayers}
          />
          <PitchingBox
            label={`${home.teamName || 'Home'} Pitching`}
            teamId={home.id}
            pitcherIds={homePitchers}
            players={allHomePlayers}
          />
        </div>
      </div>
    </div>
  );
}

function BattingBox({ label, teamId, batterIds, players }: {
  label: string; teamId?: number; batterIds: number[]; players: Record<string, any>;
}) {
  const batters = batterIds.map(id => players[`ID${id}`]).filter(Boolean);
  if (batters.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px', background: 'var(--navy-800)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-400)',
      }}>
        {teamId && (
          <img src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`} alt=""
            style={{ width: 20, height: 20 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {label}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              {['Batter', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'LOB', 'AVG'].map(h => (
                <th key={h} style={{
                  padding: '6px 10px', textAlign: h === 'Batter' ? 'left' : 'center',
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem',
                  textTransform: 'uppercase', borderBottom: '1px solid var(--navy-700)',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batters.map((p: any, i: number) => {
              const s = p.stats?.batting || {};
              const name = p.person?.fullName || `Player ${p.person?.id}`;
              const pos = p.position?.abbreviation || '';
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--navy-800)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-800)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                    <Link to={`/stats/players/${p.person?.id}`} style={{
                      color: 'var(--chalk)', textDecoration: 'none', fontWeight: 600,
                    }}>
                      {name}
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 6 }}>{pos}</span>
                  </td>
                  {['atBats', 'runs', 'hits', 'doubles', 'triples', 'homeRuns', 'rbi', 'baseOnBalls', 'strikeOuts', 'leftOnBase'].map(k => (
                    <td key={k} style={{
                      padding: '6px 10px', textAlign: 'center', color: 'var(--chalk)',
                      fontWeight: k === 'homeRuns' && (s[k] || 0) > 0 ? 700 : 400,
                    }}>
                      {s[k] ?? '-'}
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 600 }}>
                    {s.avg || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PitchingBox({ label, teamId, pitcherIds, players }: {
  label: string; teamId?: number; pitcherIds: number[]; players: Record<string, any>;
}) {
  const pitchers = pitcherIds.map(id => players[`ID${id}`]).filter(Boolean);
  if (pitchers.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px', background: 'var(--navy-800)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-400)',
      }}>
        {teamId && (
          <img src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`} alt=""
            style={{ width: 20, height: 20 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {label}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              {['Pitcher', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'ERA', 'Pit'].map(h => (
                <th key={h} style={{
                  padding: '6px 10px', textAlign: h === 'Pitcher' ? 'left' : 'center',
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem',
                  textTransform: 'uppercase', borderBottom: '1px solid var(--navy-700)',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pitchers.map((p: any, i: number) => {
              const s = p.stats?.pitching || {};
              const name = p.person?.fullName || `Player ${p.person?.id}`;
              const note = s.note || '';
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--navy-800)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-800)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                    <Link to={`/stats/players/${p.person?.id}`} style={{
                      color: 'var(--chalk)', textDecoration: 'none', fontWeight: 600,
                    }}>
                      {name}
                    </Link>
                    {note && (
                      <span style={{
                        marginLeft: 6, fontSize: '0.65rem', fontWeight: 700,
                        color: note.includes('W') ? 'var(--green-400)' : note.includes('L') ? 'var(--danger)' : 'var(--text-muted)',
                      }}>
                        ({note})
                      </span>
                    )}
                  </td>
                  {['inningsPitched', 'hits', 'runs', 'earnedRuns', 'baseOnBalls', 'strikeOuts', 'homeRuns'].map(k => (
                    <td key={k} style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--chalk)' }}>
                      {s[k] ?? '-'}
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--green-400)', fontWeight: 600 }}>
                    {s.era || '-'}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {s.numberOfPitches ?? '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}