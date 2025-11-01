import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import AdminPanel from '../../pages/AdminPanel';

export const AdminGuard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log('[AdminGuard] Component rendering, loading:', loading, 'authenticated:', isAuthenticated);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà authentifié en tant qu'admin
    const checkAdminAuth = () => {
      console.log('[AdminGuard] Checking admin authentication...');
      
      const adminAuth = sessionStorage.getItem('admin_authenticated');
      const loginTime = sessionStorage.getItem('admin_login_time');
      
      console.log('[AdminGuard] adminAuth:', adminAuth, 'loginTime:', loginTime);

      if (adminAuth === 'true' && loginTime) {
        // Vérifier si la session n'est pas expirée (24h)
        const loginTimestamp = parseInt(loginTime);
        const now = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 heures

        console.log('[AdminGuard] Session check:', {
          loginTimestamp,
          now,
          diff: now - loginTimestamp,
          maxDuration: sessionDuration,
          isValid: now - loginTimestamp < sessionDuration
        });

        if (now - loginTimestamp < sessionDuration) {
          console.log('[AdminGuard] Session valid, setting authenticated');
          setIsAuthenticated(true);
        } else {
          // Session expirée, nettoyer
          console.log('[AdminGuard] Session expired, cleaning up');
          sessionStorage.removeItem('admin_authenticated');
          sessionStorage.removeItem('admin_login_time');
          sessionStorage.removeItem('admin_user_id');
        }
      } else {
        console.log('[AdminGuard] No valid session found');
      }

      console.log('[AdminGuard] Setting loading to false');
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_login_time');
    sessionStorage.removeItem('admin_user_id');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminPanel onLogout={handleLogout} />;
};

export default AdminGuard;
