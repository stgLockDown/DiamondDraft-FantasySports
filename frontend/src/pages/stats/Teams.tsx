import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, MapPin } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

const DIVISIONS: Record<string, string[]> = {
  'AL East': ['NYY', 'BOS', 'TOR', 'BAL', 'TB'],
  'AL Central': ['CLE', 'MIN', 'DET', 'CWS', 'KC'],
  'AL West': ['HOU', 'SEA', 'TEX', 'LAA', 'OAK'],
  'NL East': ['ATL', 'PHI', 'NYM', 'MIA', 'WSH'],
  'NL Central': ['MIL', 'CHC', 'STL', 'PIT', 'CIN'],
  'NL West': ['LAD', 'ARI', 'SD', 'SF', 'COL'],
};

const TEAM_INFO: Record<string, { name: string; city: string; id: number; color: string }> = {
  NYY: { name: 'Yankees', city: 'New York', id: 147, color: '#003087' },
  BOS: { name: 'Red Sox', city: 'Boston', id: 111, color: '#BD3039' },
  TOR: { name: 'Blue Jays', city: 'Toronto', id: 141, color: '#134A8E' },
  BAL: { name: 'Orioles', city: 'Baltimore', id: 110, color: '#DF4601' },
  TB: { name: 'Rays', city: 'Tampa Bay', id: 139, color: '#092C5C' },
  CLE: { name: 'Guardians', city: 'Cleveland', id: 114, color: '#00385D' },
  MIN: { name: 'Twins', city: 'Minnesota', id: 142, color: '#002B5C' },
  DET: { name: 'Tigers', city: 'Detroit', id: 116, color: '#0C2340' },
  CWS: { name: 'White Sox', city: 'Chicago', id: 145, color: '#27251F' },
  KC: { name: 'Royals', city: 'Kansas City', id: 118, color: '#004687' },
  HOU: { name: 'Astros', city: 'Houston', id: 117, color: '#002D62' },
  SEA: { name: 'Mariners', city: 'Seattle', id: 136, color: '#0C2C56' },
  TEX: { name: 'Rangers', city: 'Texas', id: 140, color: '#003278' },
  LAA: { name: 'Angels', city: 'Los Angeles', id: 108, color: '#BA0021' },
  OAK: { name: 'Athletics', city: 'Oakland', id: 133, color: '#003831' },
  ATL: { name: 'Braves', city: 'Atlanta', id: 144, color: '#CE1141' },
  PHI: { name: 'Phillies', city: 'Philadelphia', id: 143, color: '#E81828' },
  NYM: { name: 'Mets', city: 'New York', id: 121, color: '#002D72' },
  MIA: { name: 'Marlins', city: 'Miami', id: 146, color: '#00A3E0' },
  WSH: { name: 'Nationals', city: 'Washington', id: 120, color: '#AB0003' },
  MIL: { name: 'Brewers', city: 'Milwaukee', id: 158, color: '#FFC52F' },
  CHC: { name: 'Cubs', city: 'Chicago', id: 112, color: '#0E3386' },
  STL: { name: 'Cardinals', city: 'St. Louis', id: 138, color: '#C41E3A' },
  PIT: { name: 'Pirates', city: 'Pittsburgh', id: 134, color: '#27251F' },
  CIN: { name: 'Reds', city: 'Cincinnati', id: 113, color: '#C6011F' },
  LAD: { name: 'Dodgers', city: 'Los Angeles', id: 119, color: '#005A9C' },
  ARI: { name: 'D-backs', city: 'Arizona', id: 109, color: '#A71930' },
  SD: { name: 'Padres', city: 'San Diego', id: 135, color: '#2F241D' },
  SF: { name: 'Giants', city: 'San Francisco', id: 137, color: '#FD5A1E' },
  COL: { name: 'Rockies', city: 'Colorado', id: 115, color: '#33006F' },
};

export default function Teams() {
  const [selectedLeague, setSelectedLeague] = useState<'AL' | 'NL'>('AL');

  const divisions = Object.entries(DIVISIONS).filter(([div]) =>
    div.startsWith(selectedLeague)
  );

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* League Toggle */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 24,
          background: 'var(--navy-800)', borderRadius: 'var(--radius-lg)',
          padding: 4, width: 'fit-content',
        }}>
          {(['AL', 'NL'] as const).map(league => (
            <button key={league} onClick={() => setSelectedLeague(league)} style={{
              padding: '8px 24px', borderRadius: 'var(--radius-md)',
              background: selectedLeague === league ? 'var(--green-600)' : 'transparent',
              color: selectedLeague === league ? 'white' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
            }}>
              {league === 'AL' ? 'American League' : 'National League'}
            </button>
          ))}
        </div>

        {/* Divisions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {divisions.map(([divName, teams]) => (
            <div key={divName}>
              <h2 style={{
                fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-400)',
                marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {divName}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {teams.map(abbr => {
                  const team = TEAM_INFO[abbr];
                  if (!team) return null;
                  return (
                    <Link key={abbr} to={`/stats/teams/${team.id}`} style={{
                      textDecoration: 'none', color: 'inherit',
                    }}>
                      <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)', padding: 20,
                        display: 'flex', alignItems: 'center', gap: 16,
                        transition: 'all var(--transition-fast)', cursor: 'pointer',
                        position: 'relative', overflow: 'hidden',
                      }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = team.color;
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${team.color}33`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                      >
                        {/* Team color accent */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                          background: team.color,
                        }} />

                        {/* Team Logo */}
                        <img
                          src={`https://www.mlbstatic.com/team-logos/${team.id}.svg`}
                          alt={team.name}
                          style={{ width: 56, height: 56 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />

                        {/* Team Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--chalk)' }}>
                            {team.city} {team.name}
                          </div>
                          <div style={{
                            fontSize: '0.8rem', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
                          }}>
                            <MapPin size={12} /> {abbr}
                          </div>
                        </div>

                        <ChevronRight size={18} color="var(--text-muted)" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}