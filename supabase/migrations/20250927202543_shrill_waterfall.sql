/*
  # Create LTI24-27 Core Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with status and preferences
    - `posts` - Publications with rich content support
    - `comments` - Hierarchical comment system
    - `reactions` - Emoji reactions for posts and comments
    - `messages` - Private messaging system
    - `groups` - Discussion groups with member management
    - `group_members` - Group membership relation
    - `resources` - File sharing and resource library
    - `events` - Calendar events and schedule management
    - `announcements` - Official announcements system
    - `notifications` - Real-time notification system
    - `media` - Gallery and media management
    - `votes` - Forum voting system

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user access control
    - Admin-only policies for management functions

  3. Features
    - Real-time subscriptions for messaging and notifications
    - File upload support with metadata
    - Hierarchical comment threading
    - User status tracking (online/offline)
    - Rich content support (text, images, videos, files)
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile extension table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  promo text DEFAULT '',
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table for main feed
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  video_url text,
  file_url text,
  file_name text,
  type text DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'file', 'poll')),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments system
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reactions system
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'wow', 'laugh', 'sad', 'angry')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- Private messaging
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio')),
  file_url text,
  file_name text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Discussion groups
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  avatar_url text,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group memberships
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Resource library
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  subject text DEFAULT '',
  semester text DEFAULT '',
  uploader_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Events and schedule
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  event_type text DEFAULT 'class' CHECK (event_type IN ('class', 'exam', 'project', 'meeting', 'social')),
  location text DEFAULT '',
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Official announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('message', 'comment', 'reaction', 'mention', 'event', 'announcement')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Media gallery
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  description text DEFAULT '',
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  thumbnail_url text,
  uploader_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Voting system for forum
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by authenticated users" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all posts" ON posts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by authenticated users" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for reactions
CREATE POLICY "Reactions are viewable by authenticated users" ON reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own reactions" ON reactions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT TO authenticated USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id OR 
  (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()))
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for groups
CREATE POLICY "Public groups are viewable by everyone" ON groups FOR SELECT USING (is_public = true OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Group creators and admins can update groups" ON groups FOR UPDATE TO authenticated USING (
  auth.uid() = creator_id OR 
  EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- RLS Policies for group_members
CREATE POLICY "Group members are viewable by group members" ON group_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND is_public = true)
);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for resources
CREATE POLICY "Resources are viewable by authenticated users" ON resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload resources" ON resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update their own resources" ON resources FOR UPDATE TO authenticated USING (auth.uid() = uploader_id);

-- RLS Policies for events
CREATE POLICY "Public events are viewable by authenticated users" ON events FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "Users can create events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own events" ON events FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- RLS Policies for announcements
CREATE POLICY "Announcements are viewable by authenticated users" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers and admins can create announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
CREATE POLICY "Authors can update their announcements" ON announcements FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for media
CREATE POLICY "Public media are viewable by authenticated users" ON media FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = uploader_id);
CREATE POLICY "Users can upload media" ON media FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update their own media" ON media FOR UPDATE TO authenticated USING (auth.uid() = uploader_id);

-- RLS Policies for votes
CREATE POLICY "Votes are viewable by authenticated users" ON votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own votes" ON votes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);

-- Create functions for real-time features
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();