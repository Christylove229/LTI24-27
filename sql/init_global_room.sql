-- Script SQL pour initialiser la Grande Salle globale
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la Grande Salle globale si elle n'existe pas
-- Utiliser un UUID fixe pour la Grande Salle globale
INSERT INTO public.rooms (
  id,
  name,
  description,
  is_public,
  created_by,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Grande Salle',
  'Espace de discussion global pour tous les utilisateurs',
  true,
  (SELECT id FROM auth.users LIMIT 1), -- Premier utilisateur comme créateur
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Fonction pour ajouter automatiquement tous les utilisateurs à la Grande Salle
CREATE OR REPLACE FUNCTION public.add_user_to_global_room()
RETURNS TRIGGER AS $$
BEGIN
  -- Ajouter le nouvel utilisateur à la Grande Salle
  INSERT INTO public.room_members (
    room_id,
    user_id,
    role
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NEW.id,
    'member'
  ) ON CONFLICT (room_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger pour ajouter automatiquement les nouveaux utilisateurs à la Grande Salle
DROP TRIGGER IF EXISTS add_user_to_global_room_trigger ON public.profiles;
CREATE TRIGGER add_user_to_global_room_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.add_user_to_global_room();

-- 4. Ajouter tous les utilisateurs existants à la Grande Salle
INSERT INTO public.room_members (
  room_id,
  user_id,
  role
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  id,
  'member'
FROM public.profiles
ON CONFLICT (room_id, user_id) DO NOTHING;

-- 5. Politique RLS pour la Grande Salle (lecture pour tous les utilisateurs authentifiés)
DROP POLICY IF EXISTS "Users can read global room" ON public.rooms;
CREATE POLICY "Users can read global room" ON public.rooms
  FOR SELECT
  TO authenticated
  USING (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- 6. Politique RLS pour les messages de la Grande Salle
DROP POLICY IF EXISTS "Users can read global room messages" ON public.room_messages;
CREATE POLICY "Users can read global room messages" ON public.room_messages
  FOR SELECT
  TO authenticated
  USING (room_id = '00000000-0000-0000-0000-000000000001'::uuid);

DROP POLICY IF EXISTS "Users can insert global room messages" ON public.room_messages;
CREATE POLICY "Users can insert global room messages" ON public.room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (room_id = '00000000-0000-0000-0000-000000000001'::uuid AND sender_id = auth.uid());

-- 7. Politique RLS pour les membres de la Grande Salle
DROP POLICY IF EXISTS "Users can read global room members" ON public.room_members;
CREATE POLICY "Users can read global room members" ON public.room_members
  FOR SELECT
  TO authenticated
  USING (room_id = '00000000-0000-0000-0000-000000000001'::uuid);

DROP POLICY IF EXISTS "Users can update their global room membership" ON public.room_members;
CREATE POLICY "Users can update their global room membership" ON public.room_members
  FOR UPDATE
  TO authenticated
  USING (room_id = '00000000-0000-0000-0000-000000000001'::uuid AND user_id = auth.uid())
  WITH CHECK (room_id = '00000000-0000-0000-0000-000000000001'::uuid AND user_id = auth.uid());

-- 8. Vue simplifiée pour la Grande Salle (optionnel)
CREATE OR REPLACE VIEW public.view_global_room AS
SELECT 
  r.*,
  (
    SELECT COUNT(*)::int
    FROM public.room_members rm
    WHERE rm.room_id = r.id
  ) as member_count,
  (
    SELECT to_json(x.*) FROM (
      SELECT
        m.id,
        m.room_id,
        m.sender_id,
        m.content,
        m.type,
        m.attachment_url,
        m.attachment_name,
        m.created_at,
        json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email,
          'avatar_url', p.avatar_url
        ) as sender
      FROM public.room_messages m
      JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.room_id = r.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) x
  ) as last_message
FROM public.rooms r
WHERE r.id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 9. Rafraîchir le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- Vérification : afficher la Grande Salle créée
SELECT 
  r.id,
  r.name,
  r.description,
  r.is_public,
  COUNT(rm.user_id) as member_count
FROM public.rooms r
LEFT JOIN public.room_members rm ON rm.room_id = r.id
WHERE r.id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY r.id, r.name, r.description, r.is_public;
