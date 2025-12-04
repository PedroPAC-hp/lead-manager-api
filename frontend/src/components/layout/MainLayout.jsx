import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const { darkMode } = useTheme();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: darkMode ? '#0f172a' : '#f1f5f9' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '240px', padding: '24px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}