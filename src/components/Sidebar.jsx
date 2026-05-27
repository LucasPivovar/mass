import React from 'react';
import { NavLink } from 'react-router-dom';
import logoImage from '../assets/image.png';

/* ── Brand Logo ─────────────────────────────────────────────────────────── */
const Logo = ({ size = 36 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.28) + 'px',
    background: 'linear-gradient(135deg, #5EFF00 0%, #3FA800 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 18px rgba(94,255,0,0.35)',
    flexShrink: 0,
  }}>
    <span style={{
      color: '#000',
      fontSize: Math.round(size * 0.5) + 'px',
      fontWeight: '900',
      fontFamily: 'Outfit, sans-serif',
      lineHeight: 1,
      letterSpacing: '-0.05em',
    }}>M</span>
  </div>
);

/* ── Nav Icons ──────────────────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),
  Contacts: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Campaigns: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  ),
  Reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  ClientDashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Financial: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

/* ── Sidebar ────────────────────────────────────────────────────────────── */
const Sidebar = ({ onLogout, isOpen, setIsOpen }) => {
  const menuItems = [
    { path: '/',          label: 'Visão Geral', icon: <Icons.Dashboard /> },
    { path: '/contacts',  label: 'Contatos',    icon: <Icons.Contacts /> },
    { path: '/campaigns', label: 'Campanhas',   icon: <Icons.Campaigns /> },
    { path: '/client-dashboard', label: 'Dash. Cliente', icon: <Icons.ClientDashboard /> },
    { path: '/reports',   label: 'Relatórios',  icon: <Icons.Reports /> },
    { path: '/financial', label: 'Financeiro',  icon: <Icons.Financial /> },
  ];

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`} style={styles.sidebar}>
      {/* Brand header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '14px' }}>
            <img src={logoImage} alt="Logo" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Navigation */}
      <div style={styles.scrollArea}>
        <div style={styles.section}>
          <div style={styles.sectionLabel}>MENU</div>
          <nav style={styles.nav}>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.activeLink : {}),
                })}
              >
                {({ isActive }) => (
                  <>
                    {/* Active left bar */}
                    <div style={{
                      ...styles.activeBar,
                      opacity: isActive ? 1 : 0,
                      background: 'linear-gradient(180deg, #5EFF00, #3FA800)',
                    }} />
                    <span style={{
                      ...styles.icon,
                      color: isActive ? '#5EFF00' : 'rgba(229,229,229,0.4)',
                    }}>
                      {item.icon}
                    </span>
                    <span style={{
                      ...styles.label,
                      color: isActive ? '#E5E5E5' : 'rgba(229,229,229,0.45)',
                      fontWeight: isActive ? '600' : '400',
                    }}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>CONFIGURAÇÕES</div>
          <nav style={styles.nav}>
            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ ...styles.activeBar, opacity: isActive ? 1 : 0, background: 'linear-gradient(180deg, #5EFF00, #3FA800)' }} />
                  <span style={{ ...styles.icon, color: isActive ? '#5EFF00' : 'rgba(229,229,229,0.4)' }}>
                    <Icons.Settings />
                  </span>
                  <span style={{ ...styles.label, color: isActive ? '#E5E5E5' : 'rgba(229,229,229,0.45)', fontWeight: isActive ? '600' : '400' }}>
                    Configurações
                  </span>
                </>
              )}
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Goal Progress */}
      <div style={{ padding: '0 1.5rem 1rem', marginTop: 'auto' }}>
        <div className="card-gradient" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Meta Mensal</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '700' }}>7.230 / 10.000</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '72.3%', height: '100%', background: 'linear-gradient(90deg, #5EFF00, #3FA800)', borderRadius: '3px', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </div>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <button onClick={onLogout} className="btn-logout" style={{ width: '100%', padding: '0.8rem 1rem' }}>
          <Icons.Logout />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    backgroundColor: '#000000',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(94,255,0,0.1)',
    borderRadius: 0,
    boxShadow: '2px 0 24px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    overflow: 'hidden',
  },
  header: {
    padding: '1.75rem 1.5rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    color: '#E5E5E5',
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    fontFamily: 'Outfit, sans-serif',
  },
  divider: {
    height: '1px',
    background: 'rgba(94,255,0,0.07)',
    margin: '0 1.5rem',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 0',
  },
  section: {
    marginBottom: '1.75rem',
  },
  sectionLabel: {
    padding: '0 1.75rem',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'rgba(107,114,128,0.7)',
    letterSpacing: '0.1em',
    marginBottom: '0.5rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.7rem 1.75rem',
    textDecoration: 'none',
    position: 'relative',
    transition: 'background 0.18s ease',
    gap: '0',
  },
  activeLink: {
    backgroundColor: 'rgba(94,255,0,0.06)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '18%',
    height: '64%',
    width: '3px',
    borderTopRightRadius: '3px',
    borderBottomRightRadius: '3px',
    transition: 'opacity 0.18s ease',
    boxShadow: '0 0 8px rgba(94,255,0,0.6)',
  },
  icon: {
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.18s ease',
    flexShrink: 0,
  },
  label: {
    fontSize: '0.875rem',
    transition: 'color 0.18s ease, font-weight 0.18s ease',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(94,255,0,0.1)',
    color: 'rgba(229,229,229,0.5)',
    padding: '5px 8px',
    boxShadow: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.18s',
    minWidth: 'auto',
    margin: 0,
  },
};

export default Sidebar;
