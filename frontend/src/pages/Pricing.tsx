import { Link } from 'react-router-dom';
import { Check, Star, Shield, Zap } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="container" style={{ padding: '60px 24px', maxWidth: 1100 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }} className="animate-fade-in">
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 12 }}>
          Simple, Fair Pricing
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>
          Start free. Upgrade when you're ready to dominate.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24, marginBottom: 60,
      }} className="animate-slide-up">
        <TierCard
          icon={<Star size={24} />}
          tier="Free" price="$0" period="forever"
          description="Perfect for casual players and trying out the platform."
          features={[
            { text: 'Up to 10-team leagues', included: true },
            { text: 'Snake & auction drafts', included: true },
            { text: 'Standard scoring', included: true },
            { text: 'Basic stats & projections', included: true },
            { text: '2 leagues max', included: true },
            { text: 'Community support', included: true },
            { text: 'AI trade analyzer', included: false },
            { text: 'Advanced mock drafts', included: false },
            { text: 'Real-time push notifications', included: false },
          ]}
          cta="Get Started Free" ctaLink="/register" variant="default"
        />
        <TierCard
          icon={<Zap size={24} />}
          tier="Pro" price="$49" period="/year"
          description="For serious fantasy managers who want every edge."
          features={[
            { text: 'Unlimited leagues', included: true },
            { text: 'All draft types', included: true },
            { text: 'Full custom scoring', included: true },
            { text: 'AI trade analyzer', included: true },
            { text: 'Advanced mock drafts', included: true },
            { text: 'Live real-time scoring', included: true },
            { text: 'Push notifications', included: true },
            { text: 'Priority support', included: true },
            { text: 'League branding', included: false },
          ]}
          cta="Go Pro" ctaLink="/register" variant="highlighted"
        />
        <TierCard
          icon={<Shield size={24} />}
          tier="Commissioner+" price="$99" period="/year"
          description="For league organizers who want the ultimate toolkit."
          features={[
            { text: 'Everything in Pro', included: true },
            { text: 'League branding & themes', included: true },
            { text: 'Prize pool management', included: true },
            { text: 'API data access', included: true },
            { text: 'Advanced analytics dashboard', included: true },
            { text: 'White-label option', included: true },
            { text: 'Dedicated support', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'Priority feature requests', included: true },
          ]}
          cta="Get Commissioner+" ctaLink="/register" variant="default"
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Questions?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Commissioners get Pro free for their first season. Annual billing only.
        </p>
      </div>
    </div>
  );
}

function TierCard({ icon, tier, price, period, description, features, cta, ctaLink, variant }: {
  icon: React.ReactNode; tier: string; price: string; period: string;
  description: string; features: { text: string; included: boolean }[];
  cta: string; ctaLink: string; variant: 'default' | 'highlighted';
}) {
  const isHighlighted = variant === 'highlighted';
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', padding: '32px 28px',
      border: isHighlighted ? '2px solid var(--green-500)' : undefined,
      position: 'relative',
    }}>
      {isHighlighted && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-500)', color: 'var(--navy-950)',
          padding: '5px 18px', borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem', fontWeight: 700,
        }}>Most Popular</div>
      )}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: isHighlighted ? 'var(--green-400)' : 'var(--text-muted)', marginBottom: 12 }}>{icon}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{tier}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: '2.8rem', fontWeight: 900 }}>{price}</span>
          <span style={{ color: 'var(--text-muted)' }}>{period}</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{description}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, marginBottom: 24 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
            <Check size={16} style={{ color: f.included ? 'var(--green-400)' : 'var(--navy-600)', flexShrink: 0 }} />
            <span style={{ color: f.included ? 'var(--text-secondary)' : 'var(--navy-500)' }}>{f.text}</span>
          </div>
        ))}
      </div>
      <Link to={ctaLink} className={`btn ${isHighlighted ? 'btn-primary' : 'btn-secondary'} btn-lg`}
        style={{ width: '100%', justifyContent: 'center' }}>
        {cta}
      </Link>
    </div>
  );
}