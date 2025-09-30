import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useRoomUnreadCount = (roomId: string) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!roomId || !user) return;

    const fetchUnreadCount = async () => {
      try {
        // Récupérer last_read_at pour cette salle
        const { data: memberData } = await supabase
          .from('room_members')
          .select('last_read_at')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();

        const lastReadAt = memberData?.last_read_at || '1970-01-01';

        // Calculer le nombre de messages non lus
        const { data, error } = await supabase
          .from('room_messages')
          .select('id', { count: 'exact' })
          .eq('room_id', roomId)
          .gt('created_at', lastReadAt)
          .neq('sender_id', user.id);

        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
      }
    };

    fetchUnreadCount();

    // S'abonner aux nouveaux messages pour mettre à jour le compteur
    const messageSubscription = supabase
      .channel(`room_unread_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          // Si le message n'est pas de l'utilisateur, incrémenter le compteur
          if (payload.new.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    // S'abonner aux changements de last_read_at pour recalculer
    const readSubscription = supabase
      .channel(`room_unread_read:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_members',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Si last_read_at a été mis à jour, recalculer le compteur
          if (payload.new.last_read_at) {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      readSubscription.unsubscribe();
    };
  }, [roomId, user]);

  const markAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking room as read:', error);
    }
  };

  return { unreadCount, markAsRead };
};
