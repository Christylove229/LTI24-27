// src/hooks/useRealtimeChannel.ts
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  table: string;
  schema: string;
}

type EventHandler = (payload: RealtimeEvent) => void;

/**
 * Hook pour s'abonner aux événements realtime Supabase
 */
export function useRealtimeChannel(
  channelName: string,
  onEvent: EventHandler,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Créer le channel
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // S'abonner aux événements
    channel
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public' 
        },
        (payload: any) => {
          console.log('Realtime event:', payload);
          onEvent({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema
          });
        }
      )
      .subscribe((status) => {
        console.log(`Channel ${channelName} status:`, status);
      });

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, enabled]);

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
}

/**
 * Hook spécialisé pour les messages d'un thread
 */
export function useThreadMessages(
  threadId: string | null,
  onNewMessage: (message: any) => void,
  onReadReceipt: (receipt: any) => void
) {
  useRealtimeChannel(
    `thread-${threadId}`,
    (payload) => {
      if (payload.table === 'messages' && payload.eventType === 'INSERT') {
        if (payload.new.thread_id === threadId) {
          onNewMessage(payload.new);
        }
      } else if (payload.table === 'message_read_receipts' && payload.eventType === 'INSERT') {
        onReadReceipt(payload.new);
      }
    },
    !!threadId
  );
}

/**
 * Hook pour les mises à jour des threads (nouveau message, etc.)
 */
export function useThreadUpdates(
  userId: string | null,
  onThreadUpdate: (thread: any) => void
) {
  useRealtimeChannel(
    `user-threads-${userId}`,
    (payload) => {
      if (payload.table === 'messages' && payload.eventType === 'INSERT') {
        // Un nouveau message peut affecter la liste des threads
        onThreadUpdate(payload.new);
      } else if (payload.table === 'threads' && payload.eventType === 'UPDATE') {
        onThreadUpdate(payload.new);
      }
    },
    !!userId
  );
}