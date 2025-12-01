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
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white dark:bg-dark-900 border-r',
        'border-dark-200 dark:border-dark-700 transition-all duration-300 z-50',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-200 dark:border-dark-700">
        <div className={clsx('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 
                          flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-dark-900 dark:text-white">
              Lead Manager
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors',
            collapsed && 'absolute -right-3 top-6 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-md'
          )}
        >
          <ChevronLeft
            className={clsx(
              'w-5 h-5 text-dark-400 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-dark-200 dark:border-dark-700">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2',
            'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800',
            'transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {!collapsed && <span className="font-medium">
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </span>}
        </button>

        {/* User Info & Logout */}
        <div className={clsx(
          'flex items-center gap-3 px-3 py-2',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 
                          flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-dark-400 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-500 
                       hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}