import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leagues from './pages/Leagues';
import LeagueCreate from './pages/LeagueCreate';
import LeagueDetail from './pages/LeagueDetail';
import Players from './pages/Players';
import DraftRoom from './pages/DraftRoom';
import Pricing from './pages/Pricing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--navy-700)',
          borderTopColor: 'var(--green-500)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
        <Route path="/leagues/create" element={<ProtectedRoute><LeagueCreate /></ProtectedRoute>} />
        <Route path="/leagues/join" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
        <Route path="/leagues/:id" element={<ProtectedRoute><LeagueDetail /></ProtectedRoute>} />
        <Route path="/leagues/:leagueId/draft" element={<ProtectedRoute><DraftRoom /></ProtectedRoute>} />
        <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
        <Route path="/mock-draft" element={<ProtectedRoute><DraftRoom /></ProtectedRoute>} />

        {/* Placeholder routes */}
        <Route path="/teams/:id" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}