import { Link } from 'react-router-dom';
import {
  Diamond, Zap, Trophy, BarChart3, MessageCircle,
  ArrowRight, Check, Star, Shield, Smartphone
} from 'lucide-react';

export default function Landing() {
  return (
    <div>
      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: '100px 0 80px', textAlign: 'center',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="animate-fade-in" style={{ marginBottom: 16 }}>
            <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
              <Star size={12} /> Now in Beta — Season 2026
            </span>
          </div>

          <h1 className="animate-slide-up" style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900, lineHeight: 1.05, marginBottom: 24,
            maxWidth: 800, margin: '0 auto 24px',
          }}>
            Where Champions Are Built{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--green-400), var(--green-300))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Before Opening Day
            </span>
          </h1>

          <p className="animate-slide-up" style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)',
            maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7,
          }}>
            The next-generation fantasy baseball platform with real-time scoring,
            the best draft room in the game, and deep league customization.
            Built by fans, for fans.
          </p>

          <div className="animate-slide-up" style={{
            display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <Link to="/register" className="btn btn-primary btn-xl">
              Create Your League <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-xl">
              Sign In
            </Link>
          </div>

          <div style={{
            marginTop: 48, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
          }}>
            <MiniStat icon={<Diamond size={16} />} label="Free to Play" />
            <MiniStat icon={<Zap size={16} />} label="Live MLB Data" />
            <MiniStat icon={<Trophy size={16} />} label="Real-Time Scoring" />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
              Everything You Need to Dominate
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>
              Built from the ground up to fix every frustration with ESPN, Yahoo, and Fantrax.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            <FeatureCard
              icon={<Diamond size={24} />}
              title="Best-in-Class Draft Room"
              description="Real-time WebSocket-powered draft with zero lag. Snake, auction, linear, and custom draft types. In-draft chat, auto-pick queues, and color-coded draft boards."
              badge="Flagship"
            />
            <FeatureCard
              icon={<Zap size={24} />}
              title="True Real-Time Scoring"
              description="Scores update as plays happen — not every 5 minutes. Live play-by-play, animated stat tickers, and push notifications when your players go off."
              badge="Real-Time"
            />
            <FeatureCard
              icon={<BarChart3 size={24} />}
              title="Deep Customization"
              description="50+ scoring categories, decimal scoring, custom formulas. Roto, H2H, points, best ball. Keeper and dynasty leagues with full minor league rosters."
              badge="Flexible"
            />
            <FeatureCard
              icon={<MessageCircle size={24} />}
              title="Social & Community"
              description="Built-in league chat with GIFs and reactions. Trash talk boards, automated recaps, power rankings, and an end-of-season trophy room."
              badge="Social"
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="AI Trade Analyzer"
              description="Get instant AI-powered analysis on any trade. See fairness scores, category impact, and rest-of-season projections before you accept."
              badge="AI-Powered"
            />
            <FeatureCard
              icon={<Smartphone size={24} />}
              title="Mobile-First Design"
              description="Every feature works flawlessly on your phone. Draft from anywhere, set lineups on the go, and never miss a waiver wire pickup."
              badge="Mobile"
            />
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ────────────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
              See How We Compare
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              DiamondDraft combines the best of every platform with none of the pain points.
            </p>
          </div>

          <div className="table-wrapper" style={{ maxWidth: 900, margin: '0 auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th style={{ textAlign: 'center' }}>ESPN</th>
                  <th style={{ textAlign: 'center' }}>Yahoo</th>
                  <th style={{ textAlign: 'center' }}>Fantrax</th>
                  <th style={{ textAlign: 'center', color: 'var(--green-400)' }}>⚾ DiamondDraft</th>
                </tr>
              </thead>
              <tbody>
                <CompRow feature="Custom Scoring" espn="Limited" yahoo="Limited" fantrax="✓" dd="✓ Advanced" />
                <CompRow feature="Real-Time Scoring" espn="~5 min" yahoo="~5 min" fantrax="~1 min" dd="✓ Instant" />
                <CompRow feature="AI Trade Analyzer" espn="Basic" yahoo="Basic" fantrax="✗" dd="✓ AI-Powered" />
                <CompRow feature="In-App League Chat" espn="✗" yahoo="✗" fantrax="✗" dd="✓ Full" />
                <CompRow feature="Mock Draft (Custom)" espn="✗" yahoo="✗" fantrax="Limited" dd="✓ Advanced" />
                <CompRow feature="Mobile App Quality" espn="Fair" yahoo="Good" fantrax="Poor" dd="✓ Native" />
                <CompRow feature="Dynasty/Keeper" espn="Limited" yahoo="Limited" fantrax="✓" dd="✓ Advanced" />
                <CompRow feature="Free Tier" espn="✓" yahoo="✓" fantrax="Limited" dd="✓ Generous" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
              Simple, Fair Pricing
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Start free. Upgrade when you're ready to go pro.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24, maxWidth: 1000, margin: '0 auto',
          }}>
            <PricingCard
              tier="Free"
              price="$0"
              period="/forever"
              features={[
                'Up to 10-team leagues',
                'Snake & auction drafts',
                'Standard scoring',
                'Basic stats & projections',
                '2 leagues max',
                'Community support',
              ]}
              cta="Get Started"
              ctaLink="/register"
            />
            <PricingCard
              tier="Pro"
              price="$49"
              period="/year"
              features={[
                'Unlimited leagues',
                'All draft types',
                'Custom scoring (all)',
                'AI trade analyzer',
                'Advanced mock drafts',
                'Live real-time scoring',
                'Priority support',
              ]}
              cta="Go Pro"
              ctaLink="/register"
              highlighted
            />
            <PricingCard
              tier="Commissioner+"
              price="$99"
              period="/year"
              features={[
                'Everything in Pro',
                'League branding/themes',
                'Prize pool management',
                'API data access',
                'Advanced analytics dashboard',
                'White-label option',
                'Dedicated support',
              ]}
              cta="Get Commissioner+"
              ctaLink="/register"
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '100px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 900, marginBottom: 20,
          }}>
            Ready to Build Your Championship Team?
          </h2>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '1.1rem',
            maxWidth: 500, margin: '0 auto 32px',
          }}>
            Start your league today — it's free, fast, and built for real fans.
          </p>
          <Link to="/register" className="btn btn-primary btn-xl">
            Create Your Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function MiniStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--green-400)' }}>{icon}</span> {label}
    </div>
  );
}

function FeatureCard({ icon, title, description, badge }: {
  icon: React.ReactNode; title: string; description: string; badge: string;
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--green-400)',
        }}>
          {icon}
        </div>
        <span className="badge badge-green">{badge}</span>
      </div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}

function CompRow({ feature, espn, yahoo, fantrax, dd }: {
  feature: string; espn: string; yahoo: string; fantrax: string; dd: string;
}) {
  const cellStyle = (val: string) => ({
    textAlign: 'center' as const,
    color: val.startsWith('✓') ? 'var(--green-400)' : val === '✗' ? 'var(--text-muted)' : 'var(--text-secondary)',
    fontWeight: val.startsWith('✓') ? 600 : 400,
  });
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{feature}</td>
      <td style={cellStyle(espn)}>{espn}</td>
      <td style={cellStyle(yahoo)}>{yahoo}</td>
      <td style={cellStyle(fantrax)}>{fantrax}</td>
      <td style={{ ...cellStyle(dd), color: 'var(--green-400)', fontWeight: 700 }}>{dd}</td>
    </tr>
  );
}

function PricingCard({ tier, price, period, features, cta, ctaLink, highlighted }: {
  tier: string; price: string; period: string; features: string[];
  cta: string; ctaLink: string; highlighted?: boolean;
}) {
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', gap: 24,
      border: highlighted ? '2px solid var(--green-500)' : undefined,
      position: 'relative',
    }}>
      {highlighted && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-500)', color: 'var(--navy-950)',
          padding: '4px 16px', borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem', fontWeight: 700,
        }}>
          Most Popular
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{tier}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{price}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{period}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
            <Check size={16} style={{ color: 'var(--green-400)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
          </div>
        ))}
      </div>
      <Link to={ctaLink} className={`btn ${highlighted ? 'btn-primary' : 'btn-secondary'}`}
        style={{ width: '100%', justifyContent: 'center' }}>
        {cta}
      </Link>
    </div>
  );
}