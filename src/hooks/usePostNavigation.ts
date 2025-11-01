import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook pour gérer la navigation vers une publication spécifique
 * Utilisé quand on clique sur une notification pour aller à la publication
 */
export const usePostNavigation = () => {
  const location = useLocation();

  useEffect(() => {
    // Vérifier si l'URL contient un paramètre post
    const urlParams = new URLSearchParams(location.search);
    const postId = urlParams.get('post');

    if (postId) {
      // Attendre que la page soit chargée puis scroller vers la publication
      setTimeout(() => {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Ajouter un effet de surbrillance temporaire
          postElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            postElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);

      // Nettoyer l'URL après navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);
};
