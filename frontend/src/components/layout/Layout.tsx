import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '32px 0',
        background: 'var(--bg-secondary)',
      }}>
        <div className="container" style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem' }}>⚾</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
              Diamond<span style={{ color: 'var(--green-400)' }}>Draft</span>
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © 2026 DiamondDraft. Where champions are built before Opening Day.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{
      fontSize: '0.8rem', color: 'var(--text-muted)',
      textDecoration: 'none', transition: 'color var(--transition-fast)',
    }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-muted)'; }}
    >
      {children}
    </a>
  );
}