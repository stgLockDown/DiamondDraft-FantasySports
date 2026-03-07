import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, User } from 'lucide-react';
import { statsHubAPI } from '../../services/api';

const POSITIONS = ['All', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'OF', 'DH', 'SP', 'RP', 'P'];

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [position, setPosition] = useState('All');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['player-search', searchTerm, position],
    queryFn: () => statsHubAPI.search(
      searchTerm,
      position !== 'All' ? position : undefined
    ),
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setSearchTerm(query.trim());
    }
  };

  const players = data?.data?.players || [];

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{
          display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
        }}>
          <div style={{
            flex: 1, minWidth: 250, position: 'relative',
          }}>
            <Search size={18} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search players by name..."
              style={{
                width: '100%', padding: '12px 16px 12px 42px',
                background: 'var(--navy-800)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)', color: 'var(--chalk)',
                fontSize: '0.95rem', outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--green-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <button type="submit" className="btn btn-primary"
            disabled={query.trim().length < 2}
            style={{ padding: '12px 28px' }}>
            Search
          </button>
        </form>

        {/* Position Filter */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap',
        }}>
          <Filter size={16} style={{ color: 'var(--text-muted)', marginTop: 6 }} />
          {POSITIONS.map(pos => (
            <button key={pos} onClick={() => {
              setPosition(pos);
              if (searchTerm) setSearchTerm(searchTerm); // re-trigger
            }} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-sm)',
              background: position === pos ? 'var(--green-600)' : 'var(--navy-800)',
              color: position === pos ? 'white' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: position === pos ? 'var(--green-600)' : 'var(--navy-700)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              transition: 'all var(--transition-fast)',
            }}>
              {pos}
            </button>
          ))}
        </div>

        {/* Results */}
        {!searchTerm ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: 'var(--text-muted)',
          }}>
            <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Search MLB Players
            </h3>
            <p style={{ fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
              Enter a player name to view their profile, stats, splits, and game logs.
              Compare players side-by-side for fantasy decisions.
            </p>
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--navy-700)',
              borderTopColor: 'var(--green-500)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--text-muted)' }}>Searching...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : players.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)',
          }}>
            <User size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
              No players found
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Try a different name or adjust your position filter.
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16,
            }}>
              {players.length} result{players.length !== 1 ? 's' : ''} for "{searchTerm}"
              {isFetching && <span style={{ marginLeft: 8 }}>⟳ Updating...</span>}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 12,
            }}>
              {players.map((player: any) => (
                <PlayerCard key={player.id || player.mlbId} player={player} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: any }) {
  const mlbId = player.mlbId || player.id;
  const isPitcher = ['P', 'SP', 'RP', 'TWP'].includes(player.position);

  return (
    <Link to={`/stats/players/${mlbId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', padding: 16,
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all var(--transition-fast)', cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Headshot */}
        <img
          src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_80,q_auto:best/v1/people/${mlbId}/headshot/silo/current`}
          alt=""
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--navy-700)', objectFit: 'cover',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src = '';
            (e.target as HTMLImageElement).style.background = 'var(--navy-600)';
          }}
        />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '1rem', fontWeight: 700, color: 'var(--chalk)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player.fullName || player.name || `${player.firstName} ${player.lastName}`}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, background: isPitcher ? 'var(--navy-600)' : 'var(--navy-700)',
              color: isPitcher ? 'var(--blue-400, #60a5fa)' : 'var(--green-400)',
            }}>
              {player.position || '-'}
            </span>
            {player.team && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {player.team}
              </span>
            )}
          </div>

          {/* Quick Stats */}
          {player.stats && (
            <div style={{
              display: 'flex', gap: 12, marginTop: 6, fontSize: '0.75rem',
            }}>
              {isPitcher ? (
                <>
                  {player.stats.era != null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      ERA <strong style={{ color: 'var(--chalk)' }}>{player.stats.era}</strong>
                    </span>
                  )}
                  {player.stats.wins != null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      W <strong style={{ color: 'var(--chalk)' }}>{player.stats.wins}</strong>
                    </span>
                  )}
                  {player.stats.strikeOuts != null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      SO <strong style={{ color: 'var(--chalk)' }}>{player.stats.strikeOuts}</strong>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {player.stats.avg != null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      AVG <strong style={{ color: 'var(--chalk)' }}>{player.stats.avg}</strong>
                    </span>
                  )}
                  {player.stats.homeRuns != null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      HR <strong style={{ color: 'var(--chalk)' }}>{player.stats.homeRuns}</strong>
                    </span>
                  )}
                  {player.stats.rbi != null && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      RBI <strong style={{ color: 'var(--chalk)' }}>{player.stats.rbi}</strong>
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <ChevronRight size={18} color="var(--text-muted)" />
      </div>
    </Link>
  );
}