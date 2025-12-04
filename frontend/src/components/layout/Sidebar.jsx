import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Package, Upload, Send, History, Settings, LogOut, Sun, Moon, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/consultores', icon: Users, label: 'Consultores' },
    { path: '/produtos', icon: Package, label: 'Produtos' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/enviar', icon: Send, label: 'Enviar Leads' },
    { path: '/historico', icon: History, label: 'Histórico' },
  ];

  const sidebarStyle = {
    width: '240px',
    height: '100vh',
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    borderRight: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 50,
  };

  const linkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    margin: '2px 8px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    color: isActive ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    transition: 'all 0.15s ease',
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
  };

  return (
    <aside style={sidebarStyle}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send style={{ width: '16px', height: '16px', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Lead Manager</h1>
            <p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: darkMode ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 20px', margin: '0 0 8px 0' }}>Menu</p>
        {menuItems.map(item => (
          <NavLink key={item.path} to={item.path} style={({ isActive }) => linkStyle(isActive)}>
            <item.icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <p style={{ fontSize: '10px', fontWeight: '600', color: darkMode ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 20px', margin: '20px 0 8px 0' }}>Sistema</p>
        <NavLink to="/configuracoes" style={({ isActive }) => linkStyle(isActive)}>
          <Settings style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>Configurações</span>
        </NavLink>
      </nav>

      {/* Theme Toggle */}
      <div style={{ padding: '8px', borderTop: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` }}>
        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 14px', borderRadius: '8px', border: 'none', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', cursor: 'pointer' }}>
          {darkMode ? <Sun style={{ width: '18px', height: '18px' }} /> : <Moon style={{ width: '18px', height: '18px' }} />}
          <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>

      {/* User */}
      <div style={{ padding: '12px', borderTop: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, position: 'relative' }}>
        <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: showUserMenu ? (darkMode ? '#1e293b' : '#f1f5f9') : 'transparent', cursor: 'pointer' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
            <p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Admin</p>
          </div>
          <ChevronDown style={{ width: '14px', height: '14px', color: darkMode ? '#64748b' : '#94a3b8', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
        </button>

        {showUserMenu && (
          <div style={{ position: 'absolute', bottom: '100%', left: '12px', right: '12px', marginBottom: '8px', backgroundColor: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 100 }}>
            <button onClick={() => { navigate('/perfil'); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <User style={{ width: '16px', height: '16px' }} />Meu Perfil
            </button>
            <button onClick={() => { navigate('/configuracoes'); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <Settings style={{ width: '16px', height: '16px' }} />Configurações
            </button>
            <div style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
              <button onClick={() => { logout(); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}>
                <LogOut style={{ width: '16px', height: '16px' }} />Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}