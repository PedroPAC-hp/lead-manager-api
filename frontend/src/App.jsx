import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Loading from './components/ui/Loading';

// Placeholder pages (vamos criar depois)
const Consultores = () => <div className="text-dark-900 dark:text-white">Página de Consultores - Em breve</div>;
const Produtos = () => <div className="text-dark-900 dark:text-white">Página de Produtos - Em breve</div>;
const UploadPage = () => <div className="text-dark-900 dark:text-white">Página de Upload - Em breve</div>;
const Enviar = () => <div className="text-dark-900 dark:text-white">Página de Enviar - Em breve</div>;
const Historico = () => <div className="text-dark-900 dark:text-white">Página de Histórico - Em breve</div>;

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
        <Loading size="lg" text="Carregando..." />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
        <Loading size="lg" text="Carregando..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="consultores" element={<Consultores />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="enviar" element={<Enviar />} />
        <Route path="historico" element={<Historico />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}