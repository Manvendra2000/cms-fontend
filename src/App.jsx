import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ShlokaPortalManager from './components/ShlokaPortalManager';
import BookManager from './components/BookManager';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (hash) => { window.location.hash = hash; };

  const renderView = () => {
    if (!user || route === '#/login') {
      return <Login onLogin={(userData) => { setUser(userData); navigate('#/dashboard'); }} />;
    }

    switch (route) {
      case '#/dashboard':
        return <Dashboard onNavigate={navigate} onLogout={() => { setUser(null); navigate('#/login'); }} onResetWizard={() => {}} />;
      case '#/add-entry':
        return <ShlokaPortalManager onNavigate={navigate} />;
      case '#/edit-list':
        return <BookManager onNavigate={navigate} />; 
      default:
        return <Dashboard onNavigate={navigate} onLogout={() => { setUser(null); }} />;
    }
  };

  return <div className="min-h-screen font-sans">{renderView()}</div>;
}