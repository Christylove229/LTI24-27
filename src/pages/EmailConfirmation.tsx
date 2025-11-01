import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Supabase gère automatiquement la confirmation via les paramètres d'URL
        // Nous vérifions juste si la confirmation a réussi
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (type === 'signup' && token) {
          // La confirmation est gérée automatiquement par Supabase
          // Nous affichons juste le message de succès
          setStatus('success');
          setMessage('Votre email a été confirmé avec succès !');
        } else {
          setStatus('error');
          setMessage('Lien de confirmation invalide ou expiré.');
        }
      } catch (error) {
        console.error('Erreur lors de la confirmation:', error);
        setStatus('error');
        setMessage('Une erreur s\'est produite lors de la confirmation.');
      }
    };

    handleConfirmation();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Confirmation en cours...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez patienter pendant que nous confirmons votre email.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Erreur de confirmation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/auth"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à la connexion
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Besoin d'aide ? <Link to="/support" className="text-blue-600 hover:text-blue-500">Contactez-nous</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">LTI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            LTI24-27
          </h1>
        </div>

        {/* Card principale */}
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
          {/* Section succès avec animation */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email confirmé !</h2>
            <p className="text-green-100">{message}</p>
          </div>

          {/* Contenu */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Votre compte est maintenant activé et vous pouvez accéder à toutes les fonctionnalités de la plateforme LTI24-27.
              </p>

              {/* Fonctionnalités */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Apprentissage</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Forum</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="text-2xl mb-2">📁</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Ressources</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Communauté</div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-4">
              <Link
                to="/"
                className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-6 6a1 1 0 001.414 1.414L9 9.414V17a1 1 0 102 0V9.414l4.293 4.293a1 1 0 001.414-1.414l-6-6z" />
                </svg>
                Aller à l'accueil
              </Link>

              <Link
                to="/auth"
                className="w-full inline-flex justify-center items-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-base font-medium rounded-2xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Se connecter
              </Link>
            </div>

            {/* Footer informatif */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sécurisé
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Protégé
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Vérifié
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message de bienvenue */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Bienvenue dans la communauté LTI24-27 ! 🎓
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
