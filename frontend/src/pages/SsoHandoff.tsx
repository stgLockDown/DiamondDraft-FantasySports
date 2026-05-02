import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ssoAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

/**
 * Landing page for cross-product handoff from ValorOdds.
 * URL: /sso?token=<handoff jwt>&redirect=/dashboard
 *
 * 1. Read the token from the query string.
 * 2. Exchange it for a DiamondDraft JWT via POST /api/auth/sso/valorodds.
 * 3. Store the DD token and hydrate the auth store.
 * 4. Redirect to the requested path (default /dashboard).
 */
export default function SsoHandoff() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    const redirect = params.get('redirect') || '/dashboard';

    if (!token) {
      setError('Missing SSO token.');
      return;
    }

    (async () => {
      try {
        const { data } = await ssoAPI.valorOdds(token);
        localStorage.setItem('dd_token', data.token);
        localStorage.setItem('dd_refresh_token', data.refreshToken);
        setUser(data.user);
        // Hard redirect so react-query caches are clean and axios picks up the new Authorization header.
        window.location.replace(redirect);
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.code ||
          err?.message ||
          'Sign-in failed. Please try again from ValorOdds.';
        setError(String(msg));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh',
      flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
    }}>
      {!error ? (
        <>
          <div style={{
            width: 48, height: 48, border: '3px solid var(--navy-700)',
            borderTopColor: 'var(--green-500)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Signing you in from ValorOdds&hellip;
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : (
        <>
          <h2 style={{ color: 'var(--danger, #ef4444)' }}>Sign-in failed</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 420 }}>{error}</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Go to login
          </button>
        </>
      )}
    </div>
  );
}