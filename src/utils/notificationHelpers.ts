import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface CreateNotificationParams {
  user_id: string;
  type: 'message' | 'comment' | 'reaction' | 'mention' | 'event' | 'announcement' | 'learning_question' | 'learning_answer' | 'learning_resource';
  title: string;
  message: string;
  data?: any;
}

/**
 * Crée une nouvelle notification pour un utilisateur
 */
export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {}
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Crée une notification de test pour vérifier le système
 */
export const createTestNotification = async (user_id: string) => {
  const testNotifications = [
    {
      type: 'announcement' as const,
      title: '🔔 Test de notification',
      message: 'Ceci est une notification de test pour vérifier que le système fonctionne correctement.',
      data: { test: true, timestamp: new Date().toISOString() }
    },
    {
      type: 'message' as const,
      title: '💬 Nouveau message',
      message: 'Vous avez reçu un nouveau message privé de test.',
      data: { test: true, sender: 'Système de test' }
    },
    {
      type: 'reaction' as const,
      title: '❤️ Nouvelle réaction',
      message: 'Votre publication a reçu une réaction de test.',
      data: { test: true, reaction: 'heart' }
    }
  ];

  let successCount = 0;

  for (const notification of testNotifications) {
    const success = await createNotification({
      user_id,
      ...notification
    });
    
    if (success) {
      successCount++;
    }
    
    // Délai entre les notifications pour éviter le spam
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (successCount > 0) {
    toast.success(`${successCount} notification(s) de test créée(s) !`);
  } else {
    toast.error('Erreur lors de la création des notifications de test');
  }

  return successCount;
};

/**
 * Notifications spécifiques à l'apprentissage
 */
export const createLearningNotification = {
  newQuestion: async (authorId: string, questionTitle: string, subject: string) => {
    // Notifier les utilisateurs intéressés par cette matière
    try {
      const { data: interestedUsers } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', authorId) // Exclure l'auteur
        .limit(10); // Limiter pour éviter le spam

      if (interestedUsers) {
        const notifications = interestedUsers.map(user => ({
          user_id: user.id,
          type: 'learning_question' as const,
          title: `📚 Nouvelle question en ${subject}`,
          message: `Une nouvelle question a été posée : "${questionTitle}"`,
          data: { subject, questionTitle, authorId }
        }));

        for (const notification of notifications) {
          await createNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error creating learning question notifications:', error);
    }
  },

  newAnswer: async (questionAuthorId: string, answerAuthorId: string, questionTitle: string) => {
    if (questionAuthorId === answerAuthorId) return; // Pas de notification pour sa propre réponse

    await createNotification({
      user_id: questionAuthorId,
      type: 'learning_answer',
      title: '💡 Nouvelle réponse',
      message: `Votre question "${questionTitle}" a reçu une nouvelle réponse !`,
      data: { questionTitle, answerAuthorId }
    });
  },

  newResource: async (authorId: string, resourceTitle: string, subject: string, type: string) => {
    try {
      const { data: interestedUsers } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', authorId)
        .limit(10);

      if (interestedUsers) {
        const typeEmoji = type === 'youtube' ? '🎥' : type === 'pdf' ? '📄' : '🔗';
        
        const notifications = interestedUsers.map(user => ({
          user_id: user.id,
          type: 'learning_resource' as const,
          title: `${typeEmoji} Nouvelle ressource en ${subject}`,
          message: `Une nouvelle ressource a été partagée : "${resourceTitle}"`,
          data: { subject, resourceTitle, type, authorId }
        }));

        for (const notification of notifications) {
          await createNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error creating learning resource notifications:', error);
    }
  }
};

/**
 * Marque toutes les notifications comme lues pour un utilisateur
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
};

/**
 * Supprime les anciennes notifications (plus de 30 jours)
 */
export const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    return false;
  }
};
