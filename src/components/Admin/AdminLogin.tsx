import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log('[AdminLogin] Component rendered');

  // Credentials admin - À configurer selon vos besoins
  const ADMIN_CREDENTIALS = {
    email: '', // Laissez vide pour désactiver les credentials hardcodés
    password: ''
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Vérification des credentials admin hardcodés (si configurés)
      if (ADMIN_CREDENTIALS.email && ADMIN_CREDENTIALS.password && 
          email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // Stocker l'authentification admin dans sessionStorage
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_login_time', Date.now().toString());

        toast.success('Connexion administrateur réussie');
        onLoginSuccess();
        return;
      }

      // Vérification via Supabase (utilisateurs avec rôle admin)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error('Email ou mot de passe incorrect');
        return;
      }

      if (data.user) {
        // Vérifier le rôle dans profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          // Déconnecter immédiatement
          await supabase.auth.signOut();
          toast.error('Accès non autorisé - Droits administrateur requis');
          return;
        }

        // Stocker l'authentification admin
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_login_time', Date.now().toString());
        sessionStorage.setItem('admin_user_id', data.user.id);

        toast.success('Connexion administrateur réussie');
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la connexion admin:', error);
      toast.error('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Accès Administrateur
                </h1>
                <p className="text-red-100 text-sm">
                  Zone sécurisée - Accès restreint
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Veuillez vous identifier pour accéder au panneau d'administration
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email administrateur
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lti24-27.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span>Accéder au panneau admin</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cette zone est surveillée et réservée aux administrateurs autorisés.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
