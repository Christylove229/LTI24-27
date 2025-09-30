import { supabase } from '../lib/supabase';
import {
  ForumRoom,
  ForumMessage,
  SendForumMessageData,
  ForumMessageListParams,
} from '../types/forum';
import { uploadMessageAttachment } from './messages';

export const forumService = {
  // Récupérer la Grande Salle globale (elle doit être créée via SQL)
  async getOrCreateGlobalRoom(): Promise<ForumRoom> {
    try {
      const GLOBAL_ROOM_ID = '00000000-0000-0000-0000-000000000001';
      
      // Essayer de récupérer la Grande Salle existante
      const { data: existingRoom, error: fetchError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          description,
          is_public,
          created_by,
          created_at,
          updated_at
        `)
        .eq('id', GLOBAL_ROOM_ID)
        .single();

      if (existingRoom && !fetchError) {
        return existingRoom as ForumRoom;
      }

      // Si elle n'existe pas, erreur (doit être créée via SQL)
      throw new Error('Grande Salle non initialisée. Exécutez le script SQL init_global_room.sql dans Supabase.');
    } catch (error) {
      console.error('Error getting global room:', error);
      throw error;
    }
  },

  // Méthode simplifiée pour lister les salles (maintenant juste la Grande Salle)
  async listRooms(): Promise<ForumRoom[]> {
    try {
      const globalRoom = await this.getOrCreateGlobalRoom();
      return [globalRoom];
    } catch (error) {
      console.error('Error listing forum rooms:', error);
      throw error;
    }
  },

  async listRoomMessages({ room_id, before, limit = 50 }: ForumMessageListParams): Promise<ForumMessage[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_room_messages_with_sender', { p_room_id: room_id });
 
      if (error) throw error;

      let rows = (data || []) as ForumMessage[];
      // Sort ASC then apply before/limit on client
      rows = rows.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      if (before) {
        const cutoff = new Date(before).getTime();
        rows = rows.filter((m: any) => new Date(m.created_at).getTime() < cutoff);
      }
      return rows.slice(Math.max(0, rows.length - limit));
    } catch (error) {
      console.error('Error listing forum messages:', error);
      throw error;
    }
  },

  async sendMessage(messageData: SendForumMessageData): Promise<ForumMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: message, error } = await supabase
        .from('room_messages')
        .insert({
          ...messageData,
          sender_id: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      await supabase
        .from('rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', messageData.room_id);

      // Use RPC instead of dropped view
      const { data: messages } = await supabase
        .rpc('get_room_messages_with_sender', { p_room_id: messageData.room_id });
      const fullMessage = (messages || []).find((m: any) => m.id === message.id);

      return (fullMessage as ForumMessage) || (message as ForumMessage);
    } catch (error) {
      console.error('Error sending forum message:', error);
      throw error;
    }
  },

  async markRoomRead({ room_id, user_id }: { room_id: string; user_id: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', room_id)
        .eq('user_id', user_id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking forum room as read:', error);
      return false;
    }
  },

  async uploadAttachment(file: File, userId: string): Promise<string> {
    const res = await uploadMessageAttachment(file, userId);
    if (!res) throw new Error('Upload failed');
    return res.url;
  },
};