import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useRealtime = (table: string, filter?: string) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channelName = `realtime-${table}${filter ? `-${filter}` : ''}`;
    
    let realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter })
        },
        (payload) => {
          console.log(`Realtime change in ${table}:`, payload);
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, filter, user]);

  return channel;
};

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch initial online users
    const fetchOnlineUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_online', true);

        if (error) throw error;
        setOnlineUsers(data?.map(u => u.id) || []);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();

    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => [...prev, key].filter((v, i, a) => a.indexOf(v) === i));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(id => id !== key));
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return onlineUsers;
};