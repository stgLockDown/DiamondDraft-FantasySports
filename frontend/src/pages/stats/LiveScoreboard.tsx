import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsHubAPI } from '../../services/api';
import { ChevronLeft, ChevronRight, Radio, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

function GameCard({ game }: { game: any }) {
  const isLive = game.status === 'Live' || game.status === 'In Progress';
  const isFinal = game.status === 'Final';
  const isScheduled = !isLive && !isFinal;

  const gameTime = new Date(game.gameDate).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  return (
    <Link to={`/stats/game/${game.gamePk}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        padding: 0, overflow: 'hidden', cursor: 'pointer',
        border: isLive ? '1px solid var(--green-500)' : '1px solid var(--navy-700)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        {/* Status Bar */}
        <div style={{
          padding: '6px 12px',
          background: isLive ? 'rgba(29,185,84,0.15)' : isFinal ? 'var(--navy-800)' : 'var(--navy-850)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--navy-700)',
        }}>
          {isLive ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-400)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Radio size={12} style={{ animation: 'pulse-glow 1.5s infinite' }} />
              {game.detailedState || `${game.inningHalf === 'Top' ? '▲' : '▼'} ${game.currentInning}`}
            </span>
          ) : isFinal ? (
            <span style={{ color: 'var(--navy-400)', fontSize: '0.75rem', fontWeight: 600 }}>FINAL</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--navy-400)', fontSize: '0.75rem' }}>
              <Clock size={11} /> {gameTime}
            </span>
          )}
        </div>

        {/* Teams */}
        <div style={{ padding: '12px' }}>
          {/* Away Team */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src={`https://www.mlbstatic.com/team-logos/${game.awayTeam.id}.svg`}
                alt="" style={{ width: 24, height: 24 }}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
              <span style={{
                color: 'var(--chalk)', fontWeight: 600, fontSize: '0.95rem',
              }}>
                {game.awayTeam.name}
              </span>
            </div>
            <span style={{
              color: 'var(--chalk)', fontWeight: 700, fontSize: '1.25rem',
              minWidth: 28, textAlign: 'right',
              opacity: isScheduled ? 0.3 : 1,
            }}>
              {isScheduled ? '-' : game.awayTeam.score}
            </span>
          </div>

          {/* Home Team */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src={`https://www.mlbstatic.com/team-logos/${game.homeTeam.id}.svg`}
                alt="" style={{ width: 24, height: 24 }}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
              <span style={{
                color: 'var(--chalk)', fontWeight: 600, fontSize: '0.95rem',
              }}>
                {game.homeTeam.name}
              </span>
            </div>
            <span style={{
              color: 'var(--chalk)', fontWeight: 700, fontSize: '1.25rem',
              minWidth: 28, textAlign: 'right',
              opacity: isScheduled ? 0.3 : 1,
            }}>
              {isScheduled ? '-' : game.homeTeam.score}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LiveScoreboard() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['scoreboard', date],
    queryFn: () => statsHubAPI.scoreboard(date),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const games = data?.data?.games || [];
  const liveGames = games.filter((g: any) => g.status === 'Live' || g.status === 'In Progress');

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  const formatDate = (d: string) => {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div>
      {/* Date Picker */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <button className="btn btn-ghost" onClick={() => changeDate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={18} /> Previous
        </button>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--chalk)', fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
            {isToday ? "Today's Games" : formatDate(date)}
          </h2>
          {liveGames.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--green-400)', fontSize: '0.8rem', fontWeight: 500, marginTop: 4,
            }}>
              <Radio size={10} style={{ animation: 'pulse-glow 1.5s infinite' }} />
              {liveGames.length} game{liveGames.length > 1 ? 's' : ''} in progress
            </span>
          )}
          {!isToday && (
            <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
              style={{
                display: 'block', margin: '6px auto 0', background: 'none', border: 'none',
                color: 'var(--green-400)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline',
              }}>
              Jump to Today
            </button>
          )}
        </div>

        <button className="btn btn-ghost" onClick={() => changeDate(1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--navy-400)',
        }}>
          <Calendar size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No games scheduled for this date</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {games.map((game: any) => (
            <GameCard key={game.gamePk} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}