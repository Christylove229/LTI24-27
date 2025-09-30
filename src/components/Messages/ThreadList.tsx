// src/components/Messages/ThreadList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  UsersIcon,
  UserIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useThreadUpdates } from '../../hooks/useRealtimeChannel';
import { listThreads } from '../../services/messages';
import { Thread } from '../../types/messages';
import { toast } from 'react-hot-toast';

interface ThreadListProps {
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
  onNewThread?: () => void;
  className?: string;
}

export default function ThreadList({ 
  selectedThreadId, 
  onSelect, 
  onNewThread,
  className = '' 
}: ThreadListProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);

  // Charger les conversations
  const loadThreads = useCallback(async (reset = true) => {
    if (!user) return;

    try {
      setLoading(true);
      const newThreads = await listThreads({
        userId: user.id,
        limit: 20,
        offset: reset ? 0 : threads.length,
        search: searchQuery || undefined
      });

      if (reset) {
        setThreads(newThreads);
      } else {
        setThreads(prev => [...prev, ...newThreads]);
      }
      
      setHasMore(newThreads.length === 20);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  }, [user, searchQuery, threads.length]);

  // Charger les threads au montage et quand la recherche change
  useEffect(() => {
    loadThreads();
  }, [user, searchQuery]);

  // Gérer les mises à jour temps réel
  const handleThreadUpdate = useCallback((update: any) => {
    // Si c'est un nouveau message, mettre à jour le thread correspondant
    if (update.thread_id) {
      setThreads(prev => {
        const updated = [...prev];
        const index = updated.findIndex(t => t.id === update.thread_id);
        if (index >= 0) {
          // Marquer pour rechargement ou mettre à jour directement
          loadThreads();
        }
        return updated;
      });
    }
  }, [loadThreads]);

  // S'abonner aux mises à jour
  useThreadUpdates(user?.id || null, handleThreadUpdate);

  // Formater la date du dernier message
  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: fr });
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE', { locale: fr });
    } else {
      return format(date, 'dd/MM', { locale: fr });
    }
  };

  // Obtenir un aperçu du dernier message
  const getLastMessagePreview = (thread: Thread) => {
    if (!thread.last_message) return 'Aucun message';
    
    const message = thread.last_message;
    const isOwn = message.sender_id === user?.id;
    const prefix = isOwn ? 'Vous: ' : '';
    
    switch (message.type) {
      case 'image':
        return `${prefix}📷 Image partagée`;
      case 'video':
        return `${prefix}🎥 Vidéo partagée`;
      case 'file':
        return `${prefix}📎 ${message.attachment_name || 'Fichier partagé'}`;
      default:
        return `${prefix}${message.content}`;
    }
  };

  // Obtenir le titre de la conversation
  const getThreadTitle = (thread: Thread) => {
    if (thread.is_group) {
      return thread.title || 'Groupe';
    }
    if (thread.other_participant) {
      return thread.other_participant.full_name || thread.other_participant.email;
    }
    return 'Conversation';
  };

  // Obtenir l'avatar de la conversation
  const getThreadAvatar = (thread: Thread) => {
    if (thread.is_group) {
      return (
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      );
    }
    
    if (thread.other_participant?.avatar_url) {
      return (
        <img
          src={thread.other_participant.avatar_url}
          alt={getThreadTitle(thread)}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* En-tête avec recherche */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Messages
          </h1>
          {onNewThread && (
            <button
              onClick={onNewThread}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              aria-label="Nouvelle conversation"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Barre de recherche */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading && threads.length === 0 ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <UsersIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </p>
              {!searchQuery && onNewThread && (
                <button
                  onClick={onNewThread}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Commencer une conversation
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {threads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              const hasUnread = (thread.unread_count || 0) > 0;
              
              return (
                <button
                  key={thread.id}
                  onClick={() => onSelect(thread.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {getThreadAvatar(thread)}
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-medium truncate ${
                          hasUnread 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {getThreadTitle(thread)}
                        </h3>
                        {thread.last_message && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                            {formatLastMessageTime(thread.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          hasUnread 
                            ? 'text-gray-600 dark:text-gray-300 font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {getLastMessagePreview(thread)}
                        </p>
                        
                        {/* Badge non lus */}
                        {hasUnread && (
                          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                            {thread.unread_count! > 99 ? '99+' : thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        
        {/* Bouton charger plus */}
        {hasMore && !loading && threads.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => loadThreads(false)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Charger plus de conversations
            </button>
          </div>
        )}
        
        {/* Indicateur de chargement pour "charger plus" */}
        {loading && threads.length > 0 && (
          <div className="p-4 text-center">
            <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}