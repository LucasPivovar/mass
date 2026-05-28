import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import NewCampaign from './pages/NewCampaign';
import Campaigns from './pages/Campaigns';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Register from './pages/Register';
import Financeiro from './pages/Financeiro';
import ClientDashboard from './pages/ClientDashboard';
import Sidebar from './components/Sidebar';
import Flows from './pages/Flows';
import FlowEditor from './pages/FlowEditor';
import { Toaster } from 'react-hot-toast';
import logoImage from './assets/logo_massflow.png';

// Inner component so useLocation works inside <Router>
function AppRoutes({ token, handleLogin, handleLogout, isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(10, 16, 6, 0.95)',
            color: '#E5E5E5',
            border: '1px solid rgba(94, 255, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          },
          success: { iconTheme: { primary: '#5EFF00', secondary: '#000' } },
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 769px) {
          .mobile-topbar {
            display: none !important;
          }
        }
      `}} />
      {!token ? (
        <Routes key={location.pathname}>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Mobile Header Bar */}
          <header className="mobile-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0.75rem 1rem', height: '56px', boxSizing: 'border-box' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', padding: '8px', position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <img src={logoImage} alt="MassFlow Logo" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
          </header>

          {/* Drawer Backdrop click listener overlay */}
          <div className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

          <div className="app-container">
            <Sidebar onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="main-content">
              <Routes key={location.pathname}>
                <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/contacts" element={<Contacts token={token} />} />
                <Route path="/campaigns" element={<Campaigns token={token} />} />
                <Route path="/new-campaign" element={<NewCampaign token={token} />} />
                <Route path="/client-dashboard" element={<ClientDashboard token={token} />} />
                <Route path="/reports" element={<Reports token={token} />} />
                <Route path="/settings" element={<Settings token={token} />} />
                <Route path="/financial" element={<Financeiro token={token} />} />
                <Route path="/flows" element={<Flows token={token} />} />
                <Route path="/flows/:platform" element={<FlowEditor token={token} setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const hasDisparos = window.location.pathname.startsWith('/disparos');
  const routerBasename = hasDisparos ? '/disparos' : undefined;

  return (
    <Router basename={routerBasename}>
      <AppRoutes
        token={token}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </Router>
  );
}

export default App;
