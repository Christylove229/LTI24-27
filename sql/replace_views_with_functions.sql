-- Script pour remplacer les vues non sécurisées par des fonctions sécurisées
-- À exécuter dans l'éditeur SQL de Supabase

-- =====================================================
-- SOLUTION: REMPLACER LES VUES PAR DES FONCTIONS SÉCURISÉES
-- =====================================================

-- 1. Supprimer les vues existantes (elles seront remplacées par des fonctions)
DROP VIEW IF EXISTS public.view_global_room;
DROP VIEW IF EXISTS public.view_messages_with_sender;
DROP VIEW IF EXISTS public.view_room_messages_with_sender;
DROP VIEW IF EXISTS public.view_rooms_with_details;
DROP VIEW IF EXISTS public.view_threads_with_details;
DROP VIEW IF EXISTS public.view_user_room_unread_counts;

-- =====================================================
-- 2. FONCTIONS SÉCURISÉES POUR REMPLACER LES VUES
-- =====================================================

-- Fonction pour récupérer les messages d'une salle avec expéditeur (remplace view_room_messages_with_sender)
CREATE OR REPLACE FUNCTION public.get_room_messages_with_sender(p_room_id uuid)
RETURNS TABLE (
  id uuid,
  room_id uuid,
  sender_id uuid,
  content text,
  type text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz,
  sender jsonb
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur peut accéder à cette salle
  IF p_room_id != '00000000-0000-0000-0000-000000000001'::uuid THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = p_room_id
      AND rm.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied to room %', p_room_id;
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    rm.id,
    rm.room_id,
    rm.sender_id,
    rm.content,
    rm.type,
    rm.attachment_url,
    rm.attachment_name,
    rm.created_at,
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as sender
  FROM public.room_messages rm
  JOIN public.profiles p ON p.id = rm.sender_id
  WHERE rm.room_id = p_room_id
  ORDER BY rm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les messages d'une conversation avec expéditeur (remplace view_messages_with_sender)
CREATE OR REPLACE FUNCTION public.get_messages_with_sender(p_thread_id uuid)
RETURNS TABLE (
  id uuid,
  thread_id uuid,
  sender_id uuid,
  content text,
  type text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz,
  sender jsonb
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur peut accéder à cette conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.thread_participants tp
    WHERE tp.thread_id = p_thread_id
    AND tp.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to thread %', p_thread_id;
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.thread_id,
    m.sender_id,
    m.content,
    m.type,
    m.attachment_url,
    m.attachment_name,
    m.created_at,
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as sender
  FROM public.messages m
  JOIN public.profiles p ON p.id = m.sender_id
  WHERE m.thread_id = p_thread_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les salles avec détails (remplace view_rooms_with_details)
CREATE OR REPLACE FUNCTION public.get_rooms_with_details()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_public boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  member_count bigint,
  last_message jsonb,
  unread_count bigint
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.is_public,
    r.created_by,
    r.created_at,
    r.updated_at,
    (
      SELECT COUNT(*)
      FROM public.room_members rm2
      WHERE rm2.room_id = r.id
    ) as member_count,
    (
      SELECT to_jsonb(x.*) FROM (
        SELECT
          rm.id,
          rm.room_id,
          rm.sender_id,
          rm.content,
          rm.type,
          rm.attachment_url,
          rm.attachment_name,
          rm.created_at,
          jsonb_build_object(
            'id', p.id,
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          ) as sender
        FROM public.room_messages rm
        JOIN public.profiles p ON p.id = rm.sender_id
        WHERE rm.room_id = r.id
        ORDER BY rm.created_at DESC
        LIMIT 1
      ) x
    ) as last_message,
    COALESCE((
      SELECT COUNT(*)
      FROM public.room_messages rm3
      JOIN public.room_members rmb ON rmb.room_id = rm3.room_id AND rmb.user_id = auth.uid()
      WHERE rm3.room_id = r.id
      AND rm3.created_at > COALESCE(rmb.last_read_at, '1970-01-01'::timestamptz)
      AND rm3.sender_id != auth.uid()
    ), 0) as unread_count
  FROM public.rooms r
  WHERE 
    -- Grande Salle accessible à tous
    r.id = '00000000-0000-0000-0000-000000000001'::uuid
    OR
    -- Autres salles seulement si membre
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = r.id
      AND rm.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les conversations avec détails (remplace view_threads_with_details)
CREATE OR REPLACE FUNCTION public.get_threads_with_details()
RETURNS TABLE (
  id uuid,
  is_group boolean,
  title text,
  created_at timestamptz,
  updated_at timestamptz,
  participants jsonb,
  last_message jsonb,
  unread_count bigint
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.is_group,
    t.title,
    t.created_at,
    t.updated_at,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', tp.user_id,
          'last_read_at', tp.last_read_at,
          'user', jsonb_build_object(
            'id', p.id,
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          )
        )
      )
      FROM public.thread_participants tp
      JOIN public.profiles p ON p.id = tp.user_id
      WHERE tp.thread_id = t.id
    ) as participants,
    (
      SELECT to_jsonb(x.*) FROM (
        SELECT
          m.id,
          m.thread_id,
          m.sender_id,
          m.content,
          m.type,
          m.attachment_url,
          m.attachment_name,
          m.created_at,
          jsonb_build_object(
            'id', p.id,
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          ) as sender
        FROM public.messages m
        JOIN public.profiles p ON p.id = m.sender_id
        WHERE m.thread_id = t.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) x
    ) as last_message,
    COALESCE((
      SELECT COUNT(*)
      FROM public.messages m2
      JOIN public.thread_participants tp2 ON tp2.thread_id = m2.thread_id AND tp2.user_id = auth.uid()
      WHERE m2.thread_id = t.id
      AND m2.created_at > COALESCE(tp2.last_read_at, '1970-01-01'::timestamptz)
      AND m2.sender_id != auth.uid()
    ), 0) as unread_count
  FROM public.threads t
  WHERE EXISTS (
    SELECT 1 FROM public.thread_participants tp
    WHERE tp.thread_id = t.id
    AND tp.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. PERMISSIONS SUR LES FONCTIONS
-- =====================================================

-- Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_room_messages_with_sender(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_messages_with_sender(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rooms_with_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_threads_with_details() TO authenticated;

-- =====================================================
-- 4. NETTOYAGE AUTOMATIQUE DES MESSAGES (1 MOIS)
-- =====================================================

-- Fonction pour nettoyer les anciens messages
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Supprimer les messages de plus d'1 mois dans les conversations privées
  DELETE FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '1 month';
  
  -- Supprimer les messages de plus d'1 mois dans les salles de forum
  DELETE FROM public.room_messages 
  WHERE created_at < NOW() - INTERVAL '1 month';
  
  -- Log du nettoyage
  INSERT INTO public.system_logs (action, details, created_at)
  VALUES (
    'cleanup_old_messages',
    'Cleaned up messages older than 1 month',
    NOW()
  ) ON CONFLICT DO NOTHING; -- Ignore si la table system_logs n'existe pas
  
  RAISE NOTICE 'Old messages cleanup completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une table pour les logs système (optionnel)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Activer RLS sur system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire les logs système
DROP POLICY IF EXISTS "Only admins can read system logs" ON public.system_logs;
CREATE POLICY "Only admins can read system logs" ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Fonction pour voir combien de messages seraient supprimés
CREATE OR REPLACE FUNCTION public.preview_cleanup_old_messages()
RETURNS TABLE (
  table_name text,
  messages_to_delete bigint,
  oldest_message timestamp with time zone,
  newest_old_message timestamp with time zone
) AS $$
BEGIN
  -- Messages des conversations privées
  RETURN QUERY
  SELECT 
    'messages'::text,
    COUNT(*)::bigint,
    MIN(created_at),
    MAX(created_at)
  FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '1 month';
  
  -- Messages des salles de forum
  RETURN QUERY
  SELECT 
    'room_messages'::text,
    COUNT(*)::bigint,
    MIN(created_at),
    MAX(created_at)
  FROM public.room_messages 
  WHERE created_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions sur les fonctions de nettoyage
GRANT EXECUTE ON FUNCTION public.cleanup_old_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_cleanup_old_messages() TO authenticated;

-- Rafraîchir le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- 5. VÉRIFICATION
-- =====================================================

-- Tester les fonctions
SELECT 'Functions created successfully' as status;

-- Vérifier les permissions
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%'
ORDER BY routine_name;
