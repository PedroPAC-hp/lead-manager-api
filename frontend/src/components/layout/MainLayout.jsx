import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

export default function MainLayout() {
  const { darkMode } = useTheme();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: darkMode ? '#020617' : '#f1f5f9' 
    }}>
      <Sidebar />
      <main style={{ 
        marginLeft: '256px', 
        minHeight: '100vh', 
        padding: '32px' 
      }}>
        <Outlet />
      </main>
    </div>
  );
}