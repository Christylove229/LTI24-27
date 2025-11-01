// src/hooks/useGroups.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Group, GroupMember, GroupMessage, GroupFile, GroupEvent } from '../types/group';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les groupes de l'utilisateur
  const fetchUserGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .rpc('get_user_groups', { p_user_id: user.id });

      if (fetchError) throw fetchError;
      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setError('Erreur lors du chargement des groupes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Créer un nouveau groupe
  const createGroup = async (groupData: {
    name: string;
    description: string;
    isPublic: boolean;
    bannerFile?: File;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Télécharger la bannière si fournie
      let bannerUrl = null;
      if (groupData.bannerFile) {
        const fileExt = groupData.bannerFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('group-banners')
          .upload(`public/${fileName}`, groupData.bannerFile);

        if (uploadError) throw uploadError;
        bannerUrl = uploadData.path;
      }

      // Créer le groupe
      const { data, error: insertError } = await supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          is_public: groupData.isPublic,
          avatar_url: bannerUrl,
          created_by: user.id,
          creator_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Ajouter le créateur comme propriétaire
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      await fetchUserGroups();

      if (data) {
        return {
          ...data,
          created_by: (data as { created_by?: string | null; creator_id?: string | null }).created_by ??
            (data as { creator_id?: string | null }).creator_id ?? null,
          banner_url: (data as { banner_url?: string | null; avatar_url?: string | null }).banner_url ??
            (data as { avatar_url?: string | null }).avatar_url ?? null,
        };
      }

      return data;
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Erreur lors de la création du groupe');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Rejoindre un groupe
  const joinGroup = async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('group_members')
        .upsert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;

      await fetchUserGroups();
      if (currentGroup?.id === groupId) {
        await fetchGroupMembers(groupId);
      }
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Erreur lors de la tentative de rejoindre le groupe');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Quitter un groupe
  const leaveGroup = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchUserGroups();
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
      }
    } catch (err) {
      console.error('Error leaving group:', err);
      setError('Erreur lors de la tentative de quitter le groupe');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les membres d'un groupe
  const fetchGroupMembers = async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data->>'full_name' as full_name,
            raw_user_meta_data->>'avatar_url' as avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching group members:', err);
      setError('Erreur lors du chargement des membres');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les messages d'un groupe
  const fetchGroupMessages = async (groupId: string, before?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('get_group_messages', {
          p_group_id: groupId,
          p_limit: 50,
          p_before: before || null,
        });

      if (error) throw error;
      
      if (before) {
        // Ajouter les anciens messages
        setMessages(prev => [...(data || []), ...prev]);
      } else {
        // Remplacer les messages
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Error fetching group messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer un message
  const sendMessage = async (groupId: string, content: string, replyTo?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          reply_to: replyTo || null,
        });

      if (error) throw error;

      // Mettre à jour la liste des messages
      await fetchGroupMessages(groupId);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erreur lors de l\'envoi du message');
      throw err;
    }
  };

  // Charger les fichiers d'un groupe
  const fetchGroupFiles = async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('group_files')
        .select(`
          *,
          user:uploaded_by (
            raw_user_meta_data->>'full_name' as full_name,
            raw_user_meta_data->>'avatar_url' as avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching group files:', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setIsLoading(false);
    }
  };

  // Télécharger un fichier
  const uploadFile = async (groupId: string, file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const fileExt = file.name.split('.').pop();
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      
      // Télécharger le fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('group-files')
        .upload(`group-${groupId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Enregistrer la référence dans la base de données
      const { data, error: dbError } = await supabase
        .from('group_files')
        .insert({
          group_id: groupId,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: uploadData.path,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Mettre à jour la liste des fichiers
      await fetchGroupFiles(groupId);
      return data;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Erreur lors du téléchargement du fichier');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les événements d'un groupe
  const fetchGroupEvents = async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('group_events')
        .select(`
          *,
          user:created_by (
            raw_user_meta_data->>'full_name' as full_name,
            raw_user_meta_data->>'avatar_url' as avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching group events:', err);
      setError('Erreur lors du chargement des événements');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un événement
  const createEvent = async (groupId: string, eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isOnline: boolean;
    meetingUrl?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('group_events')
        .insert({
          group_id: groupId,
          created_by: user.id,
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.startTime,
          end_time: eventData.endTime || null,
          location: eventData.location || null,
          is_online: eventData.isOnline,
          meeting_url: eventData.meetingUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la liste des événements
      await fetchGroupEvents(groupId);
      return data;
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Erreur lors de la création de l\'événement');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // S'abonner aux mises à jour en temps réel
  useEffect(() => {
    if (!currentGroup) return;

    // S'abonner aux nouveaux messages
    const messageSubscription = supabase
      .channel('group_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${currentGroup.id}`
        },
        (payload) => {
          setMessages(prev => [payload.new as GroupMessage, ...prev]);
        }
      )
      .subscribe();

    // S'abonner aux nouveaux membres
    const memberSubscription = supabase
      .channel('group_members')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${currentGroup.id}`
        },
        async () => {
          await fetchGroupMembers(currentGroup.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(memberSubscription);
    };
  }, [currentGroup?.id]);

  return {
    // État
    groups,
    currentGroup,
    members,
    messages,
    files,
    events,
    isLoading,
    error,
    
    // Actions
    setCurrentGroup,
    fetchUserGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    fetchGroupMembers,
    fetchGroupMessages,
    sendMessage,
    fetchGroupFiles,
    uploadFile,
    fetchGroupEvents,
    createEvent,
  };
};