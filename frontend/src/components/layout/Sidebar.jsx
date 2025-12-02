import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Upload,
  Send,
  History,
  LogOut,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/consultores', icon: Users, label: 'Consultores' },
  { path: '/produtos', icon: Package, label: 'Produtos' },
  { path: '/upload', icon: Upload, label: 'Upload' },
  { path: '/enviar', icon: Send, label: 'Enviar Leads' },
  { path: '/historico', icon: History, label: 'Histórico' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const sidebarStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '256px',
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    borderRight: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
  };

  const headerStyle = {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px',
    borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
  };

  const logoStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
  });

  return (
    <aside style={sidebarStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoStyle}>
          <Zap style={{ width: '20px', height: '20px', color: '#ffffff' }} />
        </div>
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: '18px', 
          color: darkMode ? '#ffffff' : '#0f172a' 
        }}>
          Lead Manager
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <item.icon style={{ width: '20px', height: '20px' }} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ 
        padding: '12px', 
        borderTop: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` 
      }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: darkMode ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {darkMode ? (
            <Sun style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
          ) : (
            <Moon style={{ width: '20px', height: '20px' }} />
          )}
          <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        {/* User Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '10px 12px',
          marginTop: '8px' 
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: darkMode ? '#ffffff' : '#0f172a',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.full_name}
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: darkMode ? '#64748b' : '#94a3b8',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: darkMode ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Sair"
          >
            <LogOut style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}