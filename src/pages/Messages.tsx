// src/pages/Messages.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listThreads, markAllThreadsRead } from '../services/messages';
import { Thread } from '../types/messages';
import ThreadList from '../components/Messages/ThreadList';
import ChatWindow from '../components/Messages/ChatWindow';
import NewConversationModal from '../components/Messages/NewConversationModal';
import { toast } from 'react-hot-toast';

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // État local
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showThreadList, setShowThreadList] = useState(true);

  // Gérer la sélection depuis l'URL
  const threadIdFromUrl = searchParams.get('thread');

  // Vérifier la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobileView(isMobile);
      
      if (isMobile && threadIdFromUrl) {
        // En mobile, masquer la liste si un thread est sélectionné
        setShowThreadList(false);
      } else {
        setShowThreadList(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [threadIdFromUrl]);

  // Charger le thread sélectionné depuis l'URL
  useEffect(() => {
    if (threadIdFromUrl && user) {
      loadSelectedThread(threadIdFromUrl);
    } else {
      setSelectedThread(null);
    }
  }, [threadIdFromUrl, user]);

  // Redirection si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Marquer toutes les conversations comme lues à l'ouverture de la page Messages
  useEffect(() => {
    if (user) {
      markAllThreadsRead(user.id);
    }
  }, [user]);

  // Charger un thread spécifique
  const loadSelectedThread = async (threadId: string) => {
    if (!user) return;

    try {
      const threads = await listThreads({ 
        userId: user.id, 
        limit: 1 
      });
      
      // Trouver le thread dans la liste (normalement on ferait une requête spécifique)
      const thread = threads.find(t => t.id === threadId);
      if (thread) {
        setSelectedThread(thread);
      } else {
        // Thread non trouvé, retirer de l'URL
        setSearchParams({});
        toast.error('Conversation introuvable');
      }
    } catch (error) {
      console.error('Error loading selected thread:', error);
      toast.error('Erreur lors du chargement de la conversation');
    }
  };

  // Sélectionner un thread
  const handleSelectThread = (threadId: string) => {
    setSearchParams({ thread: threadId });
    
    if (isMobileView) {
      setShowThreadList(false);
    }
  };

  // Retour à la liste (mobile)
  const handleBackToList = () => {
    if (isMobileView) {
      setShowThreadList(true);
      setSearchParams({});
    }
  };

  // Nouvelle conversation
  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  // Conversation créée
  const handleConversationCreated = (threadId: string) => {
    setShowNewConversation(false);
    handleSelectThread(threadId);
    toast.success('Conversation créée avec succès');
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection en cours
  }

  return (
    <div className="route-fade-enter h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Liste des conversations */}
      <div className={`
        ${isMobileView 
          ? (showThreadList ? 'flex' : 'hidden') 
          : 'flex'
        } 
        flex-col w-full lg:w-80 xl:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
      `}>
        <ThreadList
          selectedThreadId={threadIdFromUrl}
          onSelect={handleSelectThread}
          onNewThread={handleNewConversation}
          className="h-full"
        />
      </div>

      {/* Fenêtre de chat */}
      <div className={`
        ${isMobileView 
          ? (showThreadList ? 'hidden' : 'flex') 
          : 'flex'
        } 
        flex-1 flex-col bg-white dark:bg-gray-800 overflow-hidden
      `}>
        <ChatWindow
          thread={selectedThread}
          onBack={isMobileView ? handleBackToList : undefined}
        />
      </div>

      {/* Modal nouvelle conversation */}
      {showNewConversation && (
        <NewConversationModal
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}