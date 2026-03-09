import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { ROLES } from './utils/auth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ShlokaPortalManager from './components/ShlokaPortalManager';
import BookManager from './components/BookManager';
import ProtectedRoute from './components/ProtectedRoute';

// Full-screen loading splash shown while verifying stored session
const SessionLoader = () => (
  <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-6">
    <div className="bg-[#D97706] w-16 h-16 rounded-2xl text-white flex items-center justify-center text-3xl shadow-xl">
      ॐ
    </div>
    <Loader2 className="animate-spin text-[#D97706]" size={32} />
    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
      Verifying Session...
    </p>
  </div>
);

export default function App() {
  const [route, setRoute] = React.useState(window.location.hash || '#/login');
  const { user, role, token, loading, login, logout } = useAuth();

  // Keep route state in sync with URL hash
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (hash) => {
    window.location.hash = hash;
    setRoute(hash);
  };

  const handleLogin = async (identifier, password) => {
    await login(identifier, password);
    navigate('#/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('#/login');
  };

  // While checking localStorage / re-verifying token with Strapi
  if (loading) return <SessionLoader />;

  // Not authenticated — always show login
  if (!user || !token) {
    return (
      <div className="min-h-screen font-sans">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  // Authenticated — render route with role protection
  const renderView = () => {
    switch (route) {
      case '#/dashboard':
        return (
          <Dashboard
            user={user}
            role={role}
            onNavigate={navigate}
            onLogout={handleLogout}
            onResetWizard={() => {}}
          />
        );

      case '#/add-entry':
        return (
          <ProtectedRoute
            role={role}
            allowed={[ROLES.ADMIN, ROLES.EDITOR]}
            onBack={() => navigate('#/dashboard')}
          >
            <ShlokaPortalManager onNavigate={navigate} token={token} />
          </ProtectedRoute>
        );

      case '#/edit-list':
        return (
          <ProtectedRoute
            role={role}
            allowed={[ROLES.ADMIN, ROLES.EDITOR, ROLES.READER]}
            onBack={() => navigate('#/dashboard')}
          >
            <BookManager onNavigate={navigate} token={token} role={role} />
          </ProtectedRoute>
        );

      default:
        return (
          <Dashboard
            user={user}
            role={role}
            onNavigate={navigate}
            onLogout={handleLogout}
            onResetWizard={() => {}}
          />
        );
    }
  };

  return <div className="min-h-screen font-sans">{renderView()}</div>;
}
