import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Diamond, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: doLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await doLogin(login, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Sign in to manage your leagues and teams
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
              <label className="label">Email or Username</label>
              <input className="input" type="text" placeholder="you@example.com"
                value={login} onChange={(e) => setLogin(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', fontWeight: 400 }}>Forgot?</Link>
              </label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
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

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 20, padding: '12px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-muted)', fontSize: '0.8rem', textAlign: 'center',
          }}>
            <strong style={{ color: 'var(--green-400)' }}>Demo:</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>demo@diamonddraft.com / demo1234</span>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}