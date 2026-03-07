import { useQuery } from '@tanstack/react-query';
import { statsHubAPI } from '../../services/api';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export default function Standings() {
  const { data, isLoading } = useQuery({
    queryKey: ['standings'],
    queryFn: () => statsHubAPI.standings(),
  });

  const divisions = data?.data?.divisions || [];

  // Group by league
  const al = divisions.filter((d: any) => d.league?.includes('American'));
  const nl = divisions.filter((d: any) => d.league?.includes('National'));

  const DivisionTable = ({ division }: { division: any }) => (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{
        padding: '12px 16px',
        background: 'var(--navy-800)',
        borderBottom: '1px solid var(--navy-700)',
      }}>
        <h3 style={{ color: 'var(--chalk)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
          {division.division || 'Division'}
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--navy-700)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>TEAM</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>W</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>L</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>PCT</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>GB</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>STRK</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>L10</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>HOME</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>AWAY</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>RS</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>RA</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>DIFF</th>
            </tr>
          </thead>
          <tbody>
            {(division.teams || []).map((team: any, idx: number) => {
              const diff = team.runDiff || 0;
              return (
                <tr key={team.id} style={{
                  borderBottom: '1px solid var(--navy-800)',
                  background: idx === 0 ? 'rgba(29,185,84,0.05)' : 'transparent',
                }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={`https://www.mlbstatic.com/team-logos/${team.id}.svg`}
                        alt="" style={{ width: 20, height: 20 }}
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                      />
                      <span style={{ color: 'var(--chalk)', fontWeight: 500, fontSize: '0.9rem' }}>
                        {team.name}
                      </span>
                      {idx === 0 && <Trophy size={12} color="var(--green-400)" />}
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--chalk)', fontWeight: 600 }}>{team.wins}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)' }}>{team.losses}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--chalk)', fontWeight: 500 }}>{team.pct}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)' }}>{team.gb}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{
                      color: team.streak?.startsWith('W') ? 'var(--green-400)' : team.streak?.startsWith('L') ? '#f87171' : 'var(--navy-300)',
                      fontWeight: 500, fontSize: '0.85rem',
                    }}>
                      {team.streak || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)', fontSize: '0.85rem' }}>{team.last10}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)', fontSize: '0.85rem' }}>{team.home}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)', fontSize: '0.85rem' }}>{team.away}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)', fontSize: '0.85rem' }}>{team.runsScored}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--navy-300)', fontSize: '0.85rem' }}>{team.runsAllowed}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem',
                    color: diff > 0 ? 'var(--green-400)' : diff < 0 ? '#f87171' : 'var(--navy-300)',
                  }}>
                    {diff > 0 ? '+' : ''}{diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* American League */}
        <div>
          <h2 style={{ color: 'var(--chalk)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--green-400)' }}>AL</span> American League
          </h2>
          {al.map((div: any, i: number) => <DivisionTable key={i} division={div} />)}
        </div>

        {/* National League */}
        <div>
          <h2 style={{ color: 'var(--chalk)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--green-400)' }}>NL</span> National League
          </h2>
          {nl.map((div: any, i: number) => <DivisionTable key={i} division={div} />)}
        </div>
      </div>
    </div>
  );
}