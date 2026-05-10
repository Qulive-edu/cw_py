import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navItems = [
    { path: '/', label: '📁 Аккаунты', icon: '📁' },
    { path: '/emails', label: '📧 Письма', icon: '📧' },
    { path: '/compose', label: '✉️ Написать', icon: '✉️' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated) {
    return <Outlet />; // Показываем Login без Layout
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            ☰
          </button>
          <h1 className="app-title">📮 Mail Client</h1>
        </div>
        
        <div className="header-right">
          {user && <span className="user-name">👤 {user.username}</span>}
          <button onClick={handleLogout} className="btn-logout">
            Выйти
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar Navigation */}
        <aside className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="nav-menu">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="sidebar-footer">
            <small>v1.0.0</small>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="app-main">
          <div style={{ padding: '20px', background: '#ffeb3b' }}>
            🟡 Layout rendered
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}