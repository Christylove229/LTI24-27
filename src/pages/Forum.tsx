import React, { useState, useEffect } from 'react';
import { ForumChatWindow } from '../components/Forum/ForumChatWindow';
import { ForumRoom } from '../types/forum';
import { forumService } from '../services/forum';
import { useAuth } from '../contexts/AuthContext';

// ID de la Grande Salle globale (UUID fixe)
const GLOBAL_ROOM_ID = '00000000-0000-0000-0000-000000000001';

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const [globalRoom, setGlobalRoom] = useState<ForumRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGlobalRoom();
  }, [user]);

  const loadGlobalRoom = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer ou créer la Grande Salle globale
      const room = await forumService.getOrCreateGlobalRoom();
      setGlobalRoom(room);
      
      // Marquer comme lue
      if (room) {
        await forumService.markRoomRead({ room_id: room.id, user_id: user.id });
      }
    } catch (error) {
      console.error('Error loading global room:', error);
      setError('Erreur lors du chargement de la Grande Salle');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la Grande Salle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadGlobalRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!globalRoom) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Grande Salle non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* En-tête de la Grande Salle */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Grande Salle</h1>
            <p className="text-sm text-gray-500">Espace de discussion global pour tous les utilisateurs</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">En ligne</span>
          </div>
        </div>
      </div>

      {/* Fenêtre de chat */}
      <div className="flex-1">
        <ForumChatWindow room={globalRoom} />
      </div>
    </div>
  );
};

export default Forum;