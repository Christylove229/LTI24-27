import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import Forum from './pages/Forum';
import Resources from './pages/Resources';
import Schedule from './pages/Schedule';
import Announcements from './pages/Announcements';
import Gallery from './pages/Gallery';
import Learning from './pages/Learning';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Get admin route from environment variables
const ADMIN_ROUTE = import.meta.env.VITE_ADMIN_ROUTE || 'hidden-admin-dashboard-xyz789';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path={`/${ADMIN_ROUTE}`} element={<AdminPanel />} />
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/groupes" element={<Groups />} />
            <Route path="/grande-salle" element={<Forum />} />
            <Route path="/ressources" element={<Resources />} />
            <Route path="/planning" element={<Schedule />} />
            <Route path="/annonces" element={<Announcements />} />
            <Route path="/galerie" element={<Gallery />} />
            <Route path="/apprentissage" element={<Learning />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
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