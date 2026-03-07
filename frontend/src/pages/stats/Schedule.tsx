import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function Schedule() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return d;
  });

  const startDate = formatDate(weekStart);
  const endDate = formatDate(addDays(weekStart, 6));

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', startDate, endDate],
    queryFn: () => statsHubAPI.schedule(startDate, endDate),
    staleTime: 60000,
  });

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
  };

  // Group games by date
  const gamesByDate = useMemo(() => {
    if (!data?.data?.dates) return {};
    const grouped: Record<string, any[]> = {};
    for (const dateObj of data.data.dates) {
      grouped[dateObj.date] = dateObj.games || [];
    }
    // Fill in empty days
    for (let i = 0; i < 7; i++) {
      const d = formatDate(addDays(weekStart, i));
      if (!grouped[d]) grouped[d] = [];
    }
    return grouped;
  }, [data, weekStart]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const headerMonth = `${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  const todayStr = formatDate(new Date());

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Week Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--chalk)', margin: 0 }}>
            <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {headerMonth}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prevWeek} className="btn btn-ghost btn-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goToday} className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}>
              Today
            </button>
            <button onClick={nextWeek} className="btn btn-ghost btn-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Week Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--navy-700)',
              borderTopColor: 'var(--green-500)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading schedule...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8,
          }}>
            {/* Day Headers */}
            {Array.from({ length: 7 }).map((_, i) => {
              const d = addDays(weekStart, i);
              const dateStr = formatDate(d);
              const isToday = dateStr === todayStr;
              return (
                <div key={`header-${i}`} style={{
                  textAlign: 'center', padding: '8px 4px',
                  borderBottom: '2px solid',
                  borderColor: isToday ? 'var(--green-500)' : 'var(--navy-700)',
                }}>
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {dayNames[i]}
                  </div>
                  <div style={{
                    fontSize: '1.3rem', fontWeight: 700,
                    color: isToday ? 'var(--green-400)' : 'var(--chalk)',
                    marginTop: 2,
                  }}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Day Columns with Games */}
            {Array.from({ length: 7 }).map((_, i) => {
              const d = addDays(weekStart, i);
              const dateStr = formatDate(d);
              const games = gamesByDate[dateStr] || [];
              const isToday = dateStr === todayStr;

              return (
                <div key={`col-${i}`} style={{
                  minHeight: 120, padding: 6,
                  background: isToday ? 'rgba(0, 230, 118, 0.03)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                }}>
                  {games.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '20px 4px',
                      color: 'var(--text-muted)', fontSize: '0.75rem',
                    }}>
                      No games
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {games.map((game: any) => (
                        <ScheduleGameCard key={game.gamePk} game={game} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile: List View */}
        <div className="schedule-mobile" style={{ display: 'none' }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = addDays(weekStart, i);
            const dateStr = formatDate(d);
            const games = gamesByDate[dateStr] || [];
            const isToday = dateStr === todayStr;

            return (
              <div key={`mobile-${i}`} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: '0.9rem', fontWeight: 700, marginBottom: 8,
                  color: isToday ? 'var(--green-400)' : 'var(--chalk)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {dayNames[d.getDay()]} {d.getMonth() + 1}/{d.getDate()}
                  {isToday && (
                    <span style={{
                      fontSize: '0.65rem', background: 'var(--green-600)',
                      color: 'white', padding: '2px 6px', borderRadius: 4,
                    }}>TODAY</span>
                  )}
                </div>
                {games.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '8px 0' }}>
                    No games scheduled
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {games.map((game: any) => (
                      <ScheduleGameCard key={game.gamePk} game={game} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .schedule-mobile { display: block !important; }
            .schedule-mobile + style { display: none; }
          }
          @media (max-width: 768px) {
            .container > div:nth-child(3) { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

function ScheduleGameCard({ game }: { game: any }) {
  const away = game.teams?.away;
  const home = game.teams?.home;
  const status = game.status?.detailedState || game.status?.abstractGameState || '';
  const isLive = status === 'In Progress' || status === 'Live';
  const isFinal = status.includes('Final');
  const gameTime = game.gameDate
    ? new Date(game.gameDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <Link to={`/stats/game/${game.gamePk}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)', padding: '8px 10px',
        fontSize: '0.75rem', transition: 'all var(--transition-fast)',
        borderLeft: isLive ? '3px solid var(--green-500)' : '3px solid transparent',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--navy-600)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
      >
        {/* Away */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img
              src={`https://www.mlbstatic.com/team-logos/${away?.team?.id}.svg`}
              alt="" style={{ width: 16, height: 16 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ fontWeight: 600, color: 'var(--chalk)' }}>
              {away?.team?.abbreviation || away?.team?.name?.slice(0, 3)?.toUpperCase() || 'AWY'}
            </span>
          </div>
          {(isLive || isFinal) && (
            <span style={{ fontWeight: 700, color: 'var(--chalk)' }}>
              {away?.score ?? ''}
            </span>
          )}
        </div>

        {/* Home */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img
              src={`https://www.mlbstatic.com/team-logos/${home?.team?.id}.svg`}
              alt="" style={{ width: 16, height: 16 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ fontWeight: 600, color: 'var(--chalk)' }}>
              {home?.team?.abbreviation || home?.team?.name?.slice(0, 3)?.toUpperCase() || 'HME'}
            </span>
          </div>
          {(isLive || isFinal) && (
            <span style={{ fontWeight: 700, color: 'var(--chalk)' }}>
              {home?.score ?? ''}
            </span>
          )}
        </div>

        {/* Status */}
        <div style={{
          fontSize: '0.65rem', textAlign: 'center',
          color: isLive ? 'var(--green-400)' : isFinal ? 'var(--text-muted)' : 'var(--text-secondary)',
          fontWeight: isLive ? 700 : 400,
        }}>
          {isLive ? `🔴 ${game.linescore?.currentInningOrdinal || 'Live'}` :
            isFinal ? 'Final' : gameTime}
        </div>
      </div>
    </Link>
  );
}