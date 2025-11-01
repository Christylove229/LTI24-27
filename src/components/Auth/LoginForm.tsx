import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      console.log('[LoginForm] Attempting sign in with:', formData.email);
      await signIn(formData.email, formData.password);
    } catch (error) {
      console.error('[LoginForm] Sign in error:', error);
      // Error is handled in the context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">LTI</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Connexion à LTI24-27
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connectez-vous pour rejoindre votre communauté étudiante
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="votre.email@exemple.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-all duration-200`}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
            >
              Pas encore de compte ? S'inscrire
            </button>
          </div>
        </form>

        {/* Message d'information sur la confirmation email */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Confirmation email requise
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Après votre inscription, vous recevrez un email de confirmation.
                  Cliquez sur le lien dans cet email pour activer votre compte avant de pouvoir vous connecter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;