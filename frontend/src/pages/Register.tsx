import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Diamond, Eye, EyeOff, Check } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const passwordChecks = [
    { label: 'At least 8 characters', valid: form.password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(form.password) },
    { label: 'Passwords match', valid: form.password === form.confirmPassword && form.confirmPassword.length > 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      await register({ email: form.email, username: form.username, password: form.password, displayName: form.displayName });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-lg)', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--green-500), var(--green-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Diamond size={28} color="var(--navy-950)" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Create Your Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Join the next generation of fantasy baseball
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 20,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="label">Display Name</label>
              <input className="input" type="text" placeholder="Your name"
                value={form.displayName} onChange={(e) => update('displayName', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="label">Username</label>
              <input className="input" type="text" placeholder="Choose a username"
                value={form.username} onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required minLength={3} maxLength={20} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                3-20 characters, letters, numbers, and underscores only
              </div>
            </div>

            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password" value={form.password}
                  onChange={(e) => update('password', e.target.value)} required
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Confirm Password</label>
              <input className="input" type="password" placeholder="Confirm your password"
                value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {passwordChecks.map((check, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                  <Check size={14} style={{ color: check.valid ? 'var(--green-400)' : 'var(--text-muted)' }} />
                  <span style={{ color: check.valid ? 'var(--green-400)' : 'var(--text-muted)' }}>{check.label}</span>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}