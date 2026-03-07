import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Trophy, Users, TrendingUp, Search, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/stats', label: 'Live Scores', icon: Activity, exact: true },
  { path: '/stats/standings', label: 'Standings', icon: Trophy },
  { path: '/stats/leaders', label: 'Leaderboards', icon: BarChart3 },
  { path: '/stats/teams', label: 'Teams', icon: Users },
  { path: '/stats/schedule', label: 'Schedule', icon: Calendar },
  { path: '/stats/players', label: 'Player Search', icon: Search },
  { path: '/stats/compare', label: 'Compare', icon: TrendingUp },
];

export default function StatsHub() {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      {/* Stats Hub Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)',
        borderBottom: '1px solid var(--navy-700)',
        padding: '20px 0 0',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Activity size={28} color="var(--green-400)" />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--chalk)', margin: 0 }}>
                Stats & Live Games
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--navy-300)', margin: 0 }}>
                Real-time MLB data • Powered by MLB Stats API
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav style={{
            display: 'flex', gap: 2, overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px',
                    fontSize: '0.85rem', fontWeight: 500,
                    color: isActive ? 'var(--green-400)' : 'var(--navy-300)',
                    textDecoration: 'none',
                    borderBottom: isActive ? '2px solid var(--green-400)' : '2px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="container" style={{ padding: '24px 16px' }}>
        <Outlet />
      </div>
    </div>
  );
}