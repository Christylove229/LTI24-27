import React, { useState, useEffect, useRef } from 'react';
import { ForumRoom, ForumMessage } from '../../types/forum';
import { forumService } from '../../services/forum';
import { useAuth } from '../../contexts/AuthContext';
import { useRoomMessages } from '../../hooks/useRoomRealtime';
import { ForumMessageBubble } from './ForumMessageBubble';
import { ForumMessageInput } from './ForumMessageInput';
import toast from 'react-hot-toast';

interface ForumChatWindowProps {
  room: ForumRoom;
  onMessageSent?: (message: ForumMessage) => void;
}

export const ForumChatWindow: React.FC<ForumChatWindowProps> = ({ room, onMessageSent }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (before?: string) => {
    try {
      const newMessages = await forumService.listRoomMessages({
        room_id: room.id,
        before,
        limit: 50
      });

      if (newMessages.length === 0) {
        setHasMore(false);
        return;
      }

      setMessages(prev => before ? [...newMessages, ...prev] : newMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: ForumMessage) => {
    setMessages(prev => [...prev, message]);
    // Marquer comme lu
    if (user && message.sender_id !== user.id) {
      forumService.markRoomRead({ room_id: room.id, user_id: user.id });
    }
  };

  useRoomMessages({
    roomId: room.id,
    onMessageInsert: handleNewMessage
  });

  useEffect(() => {
    if (room.id) {
      setLoading(true);
      setMessages([]);
      setHasMore(true);
      loadMessages();
      
      // Marquer la salle comme lue à l'ouverture
      if (user) {
        forumService.markRoomRead({ room_id: room.id, user_id: user.id });
      }
    }
  }, [room.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageSent = (message: ForumMessage) => {
    setMessages(prev => [...prev, message]);
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLoadMore = () => {
    if (messages.length > 0 && hasMore) {
      const oldestMessage = messages[0];
      loadMessages(oldestMessage.created_at);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Charger plus de messages
            </button>
          </div>
        )}

        {messages.map((message) => (
          <ForumMessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input d'envoi de message */}
      <div className="border-t border-gray-200 p-4">
        <ForumMessageInput
          roomId={room.id}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
};