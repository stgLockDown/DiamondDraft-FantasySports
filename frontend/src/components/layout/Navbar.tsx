import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  Menu, X, ChevronDown, LogOut, User, Settings, Trophy,
  Bell, Diamond, Zap
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10, 22, 40, 0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, gap: 24,
      }}>
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', color: 'var(--text-primary)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--green-500), var(--green-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Diamond size={20} color="var(--navy-950)" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.25rem',
            fontWeight: 800, letterSpacing: '-0.02em',
          }}>
            Diamond<span style={{ color: 'var(--green-400)' }}>Draft</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flex: 1, justifyContent: 'center',
        }} className="desktop-nav">
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/leagues">My Leagues</NavLink>
              <NavLink to="/players">Players</NavLink>
              <NavLink to="/mock-draft">Mock Draft</NavLink>
            </>
          )}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <>
              <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }}
                onClick={() => navigate('/notifications')}>
                <Bell size={18} />
                <span style={{
                  position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                  borderRadius: '50%', background: 'var(--danger)',
                }} />
              </button>

              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen(!profileOpen)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 'var(--radius-md)',
                  background: profileOpen ? 'var(--navy-700)' : 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer', color: 'var(--text-primary)',
                  transition: 'all var(--transition-fast)',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--green-500), var(--navy-500))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700,
                  }}>
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }} className="desktop-nav">
                    {user?.displayName}
                  </span>
                  <ChevronDown size={14} style={{
                    transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform var(--transition-fast)',
                  }} />
                </button>

                {profileOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    width: 220, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden', zIndex: 200,
                  }} className="animate-fade-in">
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                      <span className={`badge ${user?.tier === 'PRO' ? 'badge-green' : user?.tier === 'COMMISSIONER_PLUS' ? 'badge-yellow' : 'badge-gray'}`}
                        style={{ marginTop: 6 }}>
                        {user?.tier === 'COMMISSIONER_PLUS' ? 'Commissioner+' : user?.tier}
                      </span>
                    </div>
                    <DropdownItem icon={<User size={16} />} label="Profile" onClick={() => { navigate('/profile'); setProfileOpen(false); }} />
                    <DropdownItem icon={<Trophy size={16} />} label="My Leagues" onClick={() => { navigate('/leagues'); setProfileOpen(false); }} />
                    <DropdownItem icon={<Zap size={16} />} label="Upgrade to Pro" onClick={() => { navigate('/pricing'); setProfileOpen(false); }} />
                    <DropdownItem icon={<Settings size={16} />} label="Settings" onClick={() => { navigate('/settings'); setProfileOpen(false); }} />
                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                      <DropdownItem icon={<LogOut size={16} />} label="Sign Out" onClick={handleLogout} danger />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button className="btn btn-ghost btn-sm mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }} className="animate-fade-in">
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <MobileNavLink to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
              <MobileNavLink to="/leagues" onClick={() => setMobileOpen(false)}>My Leagues</MobileNavLink>
              <MobileNavLink to="/players" onClick={() => setMobileOpen(false)}>Players</MobileNavLink>
              <MobileNavLink to="/mock-draft" onClick={() => setMobileOpen(false)}>Mock Draft</MobileNavLink>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const isActive = window.location.pathname.startsWith(to);
  return (
    <Link to={to} style={{
      padding: '6px 14px', borderRadius: 'var(--radius-md)',
      fontSize: '0.875rem', fontWeight: 500,
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      background: isActive ? 'var(--navy-700)' : 'transparent',
      transition: 'all var(--transition-fast)',
      textDecoration: 'none',
    }}>
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} style={{
      padding: '10px 12px', borderRadius: 'var(--radius-md)',
      fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)',
      textDecoration: 'none',
    }}>
      {children}
    </Link>
  );
}

function DropdownItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '10px 16px', background: 'transparent', border: 'none',
      color: danger ? 'var(--danger)' : 'var(--text-secondary)',
      fontSize: '0.875rem', cursor: 'pointer',
      transition: 'all var(--transition-fast)',
    }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--navy-700)'; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
    >
      {icon} {label}
    </button>
  );
}