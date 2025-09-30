-- Script pour sécuriser les vues et ajouter le nettoyage automatique des messages
-- À exécuter dans l'éditeur SQL de Supabase

-- =====================================================
-- 1. SÉCURISATION DES TABLES (Politiques RLS)
-- =====================================================
-- Note: Les vues héritent automatiquement des politiques RLS des tables sous-jacentes

-- Activer RLS sur les tables principales (si pas déjà fait)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR LES SALLES DE FORUM
-- =====================================================

-- Politiques pour la table rooms
DROP POLICY IF EXISTS "Users can read rooms they are members of" ON public.rooms;
CREATE POLICY "Users can read rooms they are members of" ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    -- Grande Salle accessible à tous
    id = '00000000-0000-0000-0000-000000000001'::uuid
    OR
    -- Autres salles seulement si membre
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = rooms.id
      AND rm.user_id = auth.uid()
    )
  );

-- Politiques pour room_members
DROP POLICY IF EXISTS "Users can read room members if they are members" ON public.room_members;
CREATE POLICY "Users can read room members if they are members" ON public.room_members
  FOR SELECT
  TO authenticated
  USING (
    -- Grande Salle accessible à tous
    room_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR
    -- Autres salles seulement si membre
    EXISTS (
      SELECT 1 FROM public.room_members rm2
      WHERE rm2.room_id = room_members.room_id
      AND rm2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own room membership" ON public.room_members;
CREATE POLICY "Users can update their own room membership" ON public.room_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques pour room_messages
DROP POLICY IF EXISTS "Users can read room messages if member" ON public.room_messages;
CREATE POLICY "Users can read room messages if member" ON public.room_messages
  FOR SELECT
  TO authenticated
  USING (
    -- Grande Salle accessible à tous
    room_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR
    -- Autres salles seulement si membre
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_messages.room_id
      AND rm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert room messages if member" ON public.room_messages;
CREATE POLICY "Users can insert room messages if member" ON public.room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      -- Grande Salle accessible à tous
      room_id = '00000000-0000-0000-0000-000000000001'::uuid
      OR
      -- Autres salles seulement si membre
      EXISTS (
        SELECT 1 FROM public.room_members rm
        WHERE rm.room_id = room_messages.room_id
        AND rm.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLITIQUES POUR LES CONVERSATIONS PRIVÉES
-- =====================================================

-- Politiques pour threads
DROP POLICY IF EXISTS "Users can read their threads" ON public.threads;
CREATE POLICY "Users can read their threads" ON public.threads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = threads.id
      AND tp.user_id = auth.uid()
    )
  );

-- Politiques pour thread_participants
DROP POLICY IF EXISTS "Users can read thread participants if they are participants" ON public.thread_participants;
CREATE POLICY "Users can read thread participants if they are participants" ON public.thread_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp2
      WHERE tp2.thread_id = thread_participants.thread_id
      AND tp2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own thread participation" ON public.thread_participants;
CREATE POLICY "Users can update their own thread participation" ON public.thread_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques pour messages
DROP POLICY IF EXISTS "Users can read messages in their threads" ON public.messages;
CREATE POLICY "Users can read messages in their threads" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = messages.thread_id
      AND tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their threads" ON public.messages;
CREATE POLICY "Users can insert messages in their threads" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = messages.thread_id
      AND tp.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR LES PROFILS
-- =====================================================

-- Politiques pour profiles (lecture publique, modification personnelle)
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- 2. NETTOYAGE AUTOMATIQUE DES MESSAGES (1 MOIS)
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

-- =====================================================
-- 3. PROGRAMMATION DU NETTOYAGE AUTOMATIQUE
-- =====================================================

-- Note: Supabase ne supporte pas nativement les CRON jobs PostgreSQL
-- Vous devez utiliser une des solutions suivantes :

-- OPTION A: Edge Function Supabase avec cron (recommandé)
-- Créez une Edge Function qui appelle cette fonction et programmez-la avec GitHub Actions ou Vercel Cron

-- OPTION B: Webhook externe
-- Configurez un service externe (comme GitHub Actions, Vercel Cron, ou Zapier) 
-- pour appeler cette fonction via une API REST

-- OPTION C: Appel manuel périodique
-- Exécutez manuellement cette commande chaque mois :
-- SELECT public.cleanup_old_messages();

-- =====================================================
-- 4. FONCTION UTILITAIRE POUR VÉRIFIER L'ÂGE DES MESSAGES
-- =====================================================

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

-- =====================================================
-- 5. VÉRIFICATION ET TEST
-- =====================================================

-- Vérifier combien de messages seraient supprimés (sans les supprimer)
SELECT * FROM public.preview_cleanup_old_messages();

-- Pour tester le nettoyage (décommentez la ligne suivante)
-- SELECT public.cleanup_old_messages();

-- Rafraîchir le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- Vérification finale : lister les politiques RLS actives
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'view_%'
ORDER BY tablename, policyname;
