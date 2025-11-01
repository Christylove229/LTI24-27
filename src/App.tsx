import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Forum from './pages/Forum';
import Resources from './pages/Resources';
import Schedule from './pages/Schedule';
import Gallery from './pages/Gallery';
import Learning from './pages/Learning';
import Profile from './pages/Profile';
import AdminGuard from './components/Admin/AdminGuard';
import EmailConfirmation from './pages/EmailConfirmation';
import Groups from './pages/Groups';

const ADMIN_ROUTE = import.meta.env.VITE_ADMIN_ROUTE || 'admin';

const AppContent: React.FC = () => {
  const { user, loading, isSigningOut } = useAuth();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  // Redirection après connexion réussie (une seule fois)
  // Cette logique ne s'exécute que si l'utilisateur est déjà connecté au chargement de l'app
  // ET qu'on n'est pas en train de se déconnecter
  useEffect(() => {
    if (user && !loading && !isSigningOut && !hasRedirectedRef.current) {
      const currentPath = window.location.pathname;
      // Ne rediriger que si on est sur une route publique et que l'utilisateur vient de se connecter
      if (currentPath === '/auth' || currentPath === '/ressources' || currentPath === `/${ADMIN_ROUTE}`) {
        hasRedirectedRef.current = true;
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, isSigningOut, navigate]);

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/confirm" element={<EmailConfirmation />} />
      <Route path={`/${ADMIN_ROUTE}`} element={<AdminGuard />} />
      <Route path="/ressources" element={
        <Layout>
          <Resources />
        </Layout>
      } />

      {/* Routes protégées - seulement si connecté */}
      {user ? (
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<Groups />} />
              <Route path="/grande-salle" element={<Forum />} />
              <Route path="/planning" element={<Schedule />} />
              <Route path="/galerie" element={<Gallery />} />
              <Route path="/apprentissage" element={<Learning />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      ) : (
        /* Redirection vers auth pour toutes les autres routes */
        <Route path="*" element={<Navigate to="/auth" replace />} />
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <AppContent />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;