import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsHubAPI } from '../../services/api';
import { BarChart3, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const HITTING_CATS = [
  { key: 'homeRuns', label: 'Home Runs', short: 'HR' },
  { key: 'battingAverage', label: 'Batting Average', short: 'AVG' },
  { key: 'runsBattedIn', label: 'RBI', short: 'RBI' },
  { key: 'runs', label: 'Runs', short: 'R' },
  { key: 'hits', label: 'Hits', short: 'H' },
  { key: 'stolenBases', label: 'Stolen Bases', short: 'SB' },
  { key: 'onBasePlusSlugging', label: 'OPS', short: 'OPS' },
  { key: 'doubles', label: 'Doubles', short: '2B' },
  { key: 'onBasePercentage', label: 'OBP', short: 'OBP' },
  { key: 'sluggingPercentage', label: 'SLG', short: 'SLG' },
  { key: 'totalBases', label: 'Total Bases', short: 'TB' },
];

const PITCHING_CATS = [
  { key: 'earnedRunAverage', label: 'ERA', short: 'ERA' },
  { key: 'wins', label: 'Wins', short: 'W' },
  { key: 'strikeouts', label: 'Strikeouts', short: 'K' },
  { key: 'saves', label: 'Saves', short: 'SV' },
  { key: 'walksAndHitsPerInningPitched', label: 'WHIP', short: 'WHIP' },
  { key: 'inningsPitched', label: 'Innings Pitched', short: 'IP' },
];

function LeaderCard({ category, leaders, label }: { category: string; leaders: any[]; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const displayLeaders = expanded ? leaders : leaders.slice(0, 5);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px',
        background: 'var(--navy-800)',
        borderBottom: '1px solid var(--navy-700)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h3 style={{ color: 'var(--chalk)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
          {label}
        </h3>
      </div>

      <div>
        {displayLeaders.map((leader: any, idx: number) => (
          <Link
            key={idx}
            to={`/stats/player/${leader.person?.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: '1px solid var(--navy-800)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,185,84,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: idx < 3 ? 'var(--green-500)' : 'var(--navy-700)',
                color: idx < 3 ? 'white' : 'var(--navy-300)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
              }}>
                {leader.rank || idx + 1}
              </span>
              <div>
                <div style={{ color: 'var(--chalk)', fontSize: '0.85rem', fontWeight: 500 }}>
                  {leader.person?.fullName}
                </div>
                <div style={{ color: 'var(--navy-400)', fontSize: '0.75rem' }}>
                  {leader.team?.name}
                </div>
              </div>
            </div>
            <span style={{
              color: 'var(--green-400)', fontWeight: 700, fontSize: '1rem',
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              {leader.value}
            </span>
          </Link>
        ))}
      </div>

      {leaders.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', padding: '8px', background: 'var(--navy-800)',
            border: 'none', color: 'var(--green-400)', fontSize: '0.8rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {expanded ? 'Show Less' : `Show All ${leaders.length}`}
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
        </button>
      )}
    </div>
  );
}

export default function Leaderboards() {
  const [tab, setTab] = useState<'hitting' | 'pitching'>('hitting');

  const { data, isLoading } = useQuery({
    queryKey: ['leaders'],
    queryFn: () => statsHubAPI.leaders(undefined, 15),
  });

  const leaders = data?.data?.leaders || {};
  const categories = tab === 'hitting' ? HITTING_CATS : PITCHING_CATS;

  return (
    <div>
      {/* Tab Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${tab === 'hitting' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('hitting')}
          style={{ fontSize: '0.9rem' }}
        >
          ⚾ Hitting Leaders
        </button>
        <button
          className={`btn ${tab === 'pitching' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('pitching')}
          style={{ fontSize: '0.9rem' }}
        >
          🔥 Pitching Leaders
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {categories.map(cat => (
            <LeaderCard
              key={cat.key}
              category={cat.key}
              label={cat.label}
              leaders={leaders[cat.key] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}