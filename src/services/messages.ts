// src/services/messages.ts
import { supabase } from '../lib/supabase';
import { 
  Thread, 
  Message, 
  SendMessageData, 
  CreateThreadData, 
  MessageListParams,
  ThreadListParams 
} from '../types/messages';
import toast from 'react-hot-toast';

/**
 * Récupère la liste des conversations de l'utilisateur
 */
export async function listThreads({ 
  userId,
  limit = 20, 
  offset = 0, 
  search 
}: ThreadListParams): Promise<Thread[]> {
  try {
    // Remplace la vue supprimée par la fonction RPC sécurisée
    const { data, error } = await supabase.rpc('get_threads_with_details');

    if (error) {
      console.error('Error fetching threads:', error);
      toast.error('Erreur lors du chargement des conversations');
      return [];
    }

    // Tri et pagination côté client pour rester compatible avec RPC
    let rows = (data || []) as any[];

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((t) => (t.title || '').toLowerCase().includes(s));
    }

    rows = rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const paged = rows.slice(offset, offset + limit);

    // Harmoniser la forme attendue par le code appelant
    const processed: Thread[] = paged.map((thread: any) => {
      let otherParticipant = undefined;
      if (!thread.is_group && Array.isArray(thread.participants)) {
        const other = thread.participants.find((p: any) => p.user_id !== userId);
        otherParticipant = other?.user;
      }

      return {
        id: thread.id,
        is_group: thread.is_group,
        title: thread.title,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        participants: thread.participants,
        last_message: thread.last_message || null,
        other_participant: otherParticipant,
        unread_count: thread.unread_count ?? 0,
      } as Thread;
    });

    return processed;
  } catch (error) {
    console.error('Error in listThreads:', error);
    toast.error('Erreur lors du chargement des conversations');
    return [];
  }
}

export async function listThreadMessages({ 
  threadId, 
  limit = 30, 
  before 
}: MessageListParams): Promise<Message[]> {
  try {
    // Utilise la fonction RPC sécurisée (remplace la vue)
    const { data, error } = await supabase
      .rpc('get_messages_with_sender', { p_thread_id: threadId });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erreur lors du chargement des messages');
      return [];
    }

    let messages = (data || []) as Message[];

    // Tri croissant et pagination côté client
    messages = messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (before) {
      const cutoff = new Date(before).getTime();
      messages = messages.filter((m: any) => new Date(m.created_at).getTime() < cutoff);
    }

    return messages.slice(Math.max(0, messages.length - limit));
  } catch (error) {
    console.error('Error in listThreadMessages:', error);
    toast.error('Erreur lors du chargement des messages');
    return [];
  }
}

/**
 * Crée une nouvelle conversation
 */
export async function createThread({ 
  participantIds, 
  title 
}: CreateThreadData): Promise<string | null> {
  try {
    const isGroup = participantIds.length > 2;
    
    // Vérifier si une conversation 1-1 existe déjà
    if (!isGroup) {
      const { data: existingThreads } = await supabase
        .from('thread_participants')
        .select('thread_id')
        .in('user_id', participantIds);
      
      if (existingThreads && existingThreads.length > 0) {
        // Vérifier si il y a un thread avec exactement ces 2 participants
        for (const threadData of existingThreads) {
          const { data: participants } = await supabase
            .from('thread_participants')
            .select('user_id')
            .eq('thread_id', threadData.thread_id);
          
          if (participants && participants.length === 2) {
            const participantUserIds = participants.map(p => p.user_id).sort();
            const targetUserIds = [...participantIds].sort();
            
            if (JSON.stringify(participantUserIds) === JSON.stringify(targetUserIds)) {
              return threadData.thread_id;
            }
          }
        }
      }
    }

    // Créer le thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert({
        is_group: isGroup,
        title: isGroup ? title : null
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error('Error creating thread:', threadError);
      toast.error('Erreur lors de la création de la conversation');
      return null;
    }

    // Ajouter les participants
    const participantInserts = participantIds.map(userId => ({
      thread_id: thread.id,
      user_id: userId
    }));

    const { error: participantsError } = await supabase
      .from('thread_participants')
      .insert(participantInserts);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      toast.error('Erreur lors de l\'ajout des participants');
      return null;
    }

    toast.success('Conversation créée avec succès');
    return thread.id;
  } catch (error) {
    console.error('Error in createThread:', error);
    toast.error('Erreur lors de la création de la conversation');
    return null;
  }
}

/**
 * Envoie un message
 */
export async function sendMessage(data: SendMessageData): Promise<Message | null> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        thread_id: data.threadId,
        sender_id: data.senderId,
        content: data.content,
        type: data.type || 'text',
        attachment_url: data.attachmentUrl,
        attachment_name: data.attachmentName
      })
      .select('*')
      .single();

    if (error || !message) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
      return null;
    }

    // Recharger via la fonction RPC pour inclure le sender
    const { data: enrichedList } = await supabase
      .rpc('get_messages_with_sender', { p_thread_id: data.threadId });
    const enriched = (enrichedList || []).find((m: any) => m.id === (message as any).id);

    return (enriched as unknown as Message) || (message as unknown as Message);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    toast.error('Erreur lors de l\'envoi du message');
    return null;
  }
}

/**
 * Marque une conversation comme lue
 */
export async function markThreadRead({ 
  threadId, 
  userId 
}: { 
  threadId: string; 
  userId: string; 
}): Promise<boolean> {
  try {
    // Mettre à jour last_read_at dans thread_participants
    const { error: participantError } = await supabase
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (participantError) {
      console.error('Error updating thread participant:', participantError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markThreadRead:', error);
    return false;
  }
}

/**
 * Marque toutes les conversations comme lues pour l'utilisateur
 */
export async function markAllThreadsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking all threads read:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error in markAllThreadsRead:', e);
    return false;
  }
}

/**
 * Récupère le nombre total de messages non lus pour un utilisateur
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    // Utilise la fonction RPC pour récupérer les threads puis calcule côté client
    const { data: threads, error: threadsErr } = await supabase
      .rpc('get_threads_with_details');

    if (threadsErr || !Array.isArray(threads)) return 0;

    const count = (threads as any[]).reduce((acc: number, t: any) => {
      const me = (t.participants || []).find((p: any) => p.user_id === userId);
      const lastCreated = t?.last_message?.created_at ? new Date(t.last_message.created_at).getTime() : 0;
      const lastRead = me?.last_read_at ? new Date(me.last_read_at).getTime() : 0;
      const lastFromOther = t?.last_message?.sender?.id && t.last_message.sender.id !== userId;
      return acc + (lastFromOther && lastCreated > lastRead ? 1 : 0);
    }, 0);
    return count;
  } catch (e) {
    console.error('Error in getUnreadCount:', e);
    return 0;
  }
}

/**
 * Upload d'un fichier vers Supabase Storage
 */
export async function uploadMessageAttachment(
  file: File, 
  userId: string
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      toast.error('Erreur lors de l\'upload du fichier');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error in uploadMessageAttachment:', error);
    toast.error('Erreur lors de l\'upload du fichier');
    return null;
  }
}