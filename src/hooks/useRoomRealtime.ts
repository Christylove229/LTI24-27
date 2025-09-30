import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ForumMessage } from '../types/forum';

interface UseRoomMessagesParams {
  roomId: string;
  onMessageInsert: (message: ForumMessage) => void;
  onReadReceiptInsert?: (data: any) => void;
}

interface UseRoomUpdatesParams {
  onRoomUpdated: (roomId: string) => void;
}
export const useRoomMessages = ({ 
  roomId, 
  onMessageInsert,
  onReadReceiptInsert 
}: UseRoomMessagesParams) => {
  useEffect(() => {
    if (!roomId) return;

    // S'abonner aux nouveaux messages
    const messageSubscription = supabase
      .channel(`room_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Récupérer le message complet avec les infos de l'expéditeur via RPC
          const { data: messages } = await supabase
            .rpc('get_room_messages_with_sender', { p_room_id: roomId });
          const fullMessage = (messages || []).find((m: any) => m.id === payload.new.id);

          if (fullMessage) {
            onMessageInsert(fullMessage);
          }
        }
      )
      .subscribe();

    // S'abonner aux reçus de lecture si fourni
    if (onReadReceiptInsert) {
      const readReceiptSubscription = supabase
        .channel(`room_read_receipts:${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'room_message_read_receipts'
          },
          (payload) => {
            onReadReceiptInsert(payload.new);
          }
        )
        .subscribe();

      return () => {
        messageSubscription.unsubscribe();
        readReceiptSubscription.unsubscribe();
      };
    }

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [roomId, onMessageInsert, onReadReceiptInsert]);
};

export const useRoomUpdates = ({ onRoomUpdated }: UseRoomUpdatesParams) => {
  useEffect(() => {
    const subscription = supabase
      .channel('rooms_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms'
        },
        (payload) => {
          onRoomUpdated(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onRoomUpdated]);
};