import { useState, useEffect, useCallback } from 'react';
import { supabase, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useMessages = (recipientId?: string, groupId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .order('created_at', { ascending: true });

      if (groupId) {
        query = query.eq('group_id', groupId);
      } else if (recipientId) {
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`);
      } else {
        query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [user, recipientId, groupId]);

  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'text' | 'image' | 'file' | 'audio' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          ...(recipientId && { receiver_id: recipientId }),
          ...(groupId && { group_id: groupId }),
          content,
          message_type: messageType,
          ...(fileUrl && { file_url: fileUrl }),
          ...(fileName && { file_name: fileName })
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
      throw error;
    }
  }, [user, recipientId, groupId]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('receiver_id', user.id);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-${recipientId || groupId || 'all'}`)
      .on('postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'messages' },
         (payload) => {
           fetchMessages(); // Refresh to get full message with relations
         })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, groupId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    refresh: fetchMessages
  };
};

export const useConversations = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(*),
            receiver:profiles!messages_receiver_id_fkey(*)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const convMap = new Map();
        data?.forEach(message => {
          const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          const partner = message.sender_id === user.id ? message.receiver : message.sender;
          
          if (!convMap.has(partnerId)) {
            convMap.set(partnerId, {
              partner,
              lastMessage: message,
              unreadCount: message.receiver_id === user.id && !message.is_read ? 1 : 0
            });
          } else {
            const conv = convMap.get(partnerId);
            if (message.receiver_id === user.id && !message.is_read) {
              conv.unreadCount++;
            }
          }
        });

        setConversations(Array.from(convMap.values()));
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  return { conversations, loading };
};