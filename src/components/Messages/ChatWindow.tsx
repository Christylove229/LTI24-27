// src/components/Messages/ChatWindow.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeftIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useThreadMessages } from '../../hooks/useRealtimeChannel';
import { listThreadMessages, sendMessage, markThreadRead, uploadMessageAttachment } from '../../services/messages';
import { Thread, Message } from '../../types/messages';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { toast } from 'react-hot-toast';

interface ChatWindowProps {
  thread: Thread | null;
  onBack?: () => void;
}

export default function ChatWindow({ thread, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Charger les messages
  const loadMessages = useCallback(async (threadId: string, before?: string) => {
    if (!threadId) return;
    
    setLoading(true);
    try {
      const newMessages = await listThreadMessages({ 
        threadId, 
        limit: 30,
        before 
      });
      
      if (before) {
        // Pagination - ajouter au début
        setMessages(prev => [...newMessages, ...prev]);
        setHasMore(newMessages.length === 30);
      } else {
        // Premier chargement - remplacer
        setMessages(newMessages);
        setHasMore(newMessages.length === 30);
        // Scroll vers le bas après le chargement initial
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!thread || !hasMore || loading || messages.length === 0) return;
    
    const oldestMessage = messages[0];
    if (oldestMessage) {
      await loadMessages(thread.id, oldestMessage.created_at);
    }
  }, [thread, hasMore, loading, messages, loadMessages]);

  // Scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Vérifier si on est en bas
  const checkIfAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px de tolérance
      setIsAtBottom(atBottom);
    }
  }, []);

  // Gérer le scroll
  const handleScroll = useCallback(() => {
    checkIfAtBottom();
    
    // Détecter le scroll vers le haut pour charger plus de messages
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      loadMoreMessages();
    }
  }, [checkIfAtBottom, hasMore, loading, loadMoreMessages]);

  // Marquer comme lu quand on arrive en bas
  useEffect(() => {
    if (isAtBottom && thread && user) {
      markThreadRead({ threadId: thread.id, userId: user.id });
    }
  }, [isAtBottom, thread, user]);

  // Charger les messages quand le thread change
  useEffect(() => {
    if (thread) {
      setMessages([]);
      setHasMore(true);
      loadMessages(thread.id);
    }
  }, [thread, loadMessages]);

  // Gérer les nouveaux messages en temps réel
  const handleNewMessage = useCallback((newMessage: any) => {
    // Vérifier que le message appartient à ce thread
    if (!thread || newMessage.thread_id !== thread.id) return;
    
    setMessages(prev => {
      // Éviter les doublons
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) return prev;
      
      return [...prev, newMessage];
    });
    
    // Scroll vers le bas si on était déjà en bas ou si c'est notre message
    if (isAtBottom || newMessage.sender_id === user?.id) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [thread, isAtBottom, user]);

  // S'abonner aux événements temps réel
  useThreadMessages(
    thread?.id || null,
    handleNewMessage,
    (receipt) => {
      console.log('Read receipt:', receipt);
    }
  );

  // Envoyer un message
  const handleSendMessage = async (
    content: string, 
    type: 'text' | 'image' | 'video' | 'file' = 'text', 
    file?: File
  ) => {
    if (!thread || !user) return;

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    // Upload du fichier si présent
    if (file) {
      const uploadResult = await uploadMessageAttachment(file, user.id);
      if (!uploadResult) {
        toast.error('Erreur lors de l\'upload du fichier');
        return;
      }
      attachmentUrl = uploadResult.url;
      attachmentName = file.name;
    }

    // Optimistic UI - ajouter le message temporairement
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      thread_id: thread.id,
      sender_id: user.id,
      content,
      type,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url
      }
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      // Envoyer le message
      const sentMessage = await sendMessage({
        threadId: thread.id,
        senderId: user.id,
        content,
        type,
        attachmentUrl,
        attachmentName
      });

      if (sentMessage) {
        // Remplacer le message temporaire par le vrai
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? sentMessage : msg
          )
        );
      } else {
        // Supprimer le message temporaire en cas d'erreur
        setMessages(prev => 
          prev.filter(msg => msg.id !== tempMessage.id)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Supprimer le message temporaire
      setMessages(prev => 
        prev.filter(msg => msg.id !== tempMessage.id)
      );
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Sélectionnez une conversation pour commencer
          </p>
        </div>
      </div>
    );
  }

  // Déterminer le titre de la conversation
  const getThreadTitle = () => {
    if (thread.is_group) {
      return thread.title || 'Groupe';
    }
    if (thread.other_participant) {
      return thread.other_participant.full_name || thread.other_participant.email;
    }
    return 'Conversation';
  };

  return (
    <div className="flex-1 flex flex-col h-full max-h-screen">
      {/* En-tête */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Retour"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getThreadTitle()}
              </h2>
              {thread.is_group && thread.participants && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {thread.participants.length} participants
                </p>
              )}
            </div>
          </div>
          
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Options"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Liste des messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        {/* Indicateur de chargement en haut */}
        {loading && hasMore && messages.length > 0 && (
          <div className="text-center py-4">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showSender = !prevMessage || 
              prevMessage.sender_id !== message.sender_id ||
              new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 5 * 60 * 1000; // 5 minutes
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                showSender={showSender}
              />
            );
          })}
        </div>

        {/* Référence pour le scroll automatique */}
        <div ref={messagesEndRef} />
      </div>

      {/* Champ de saisie */}
      <div className="flex-shrink-0">
        <MessageInput
          onSend={handleSendMessage}
          disabled={!user}
        />
      </div>
    </div>
  );
}