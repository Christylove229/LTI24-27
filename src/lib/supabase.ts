import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide clear guidance in console to configure env vars
  console.error('[Supabase] Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  promo?: string;
  role: 'student' | 'teacher' | 'admin';
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  type: 'text' | 'image' | 'video' | 'file' | 'poll';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
  comments?: Comment[];
  reactions?: Reaction[];
  _count?: {
    comments: number;
    reactions: number;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  user_id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  reaction_type: 'like' | 'love' | 'wow' | 'laugh' | 'sad' | 'angry';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  group_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'audio';
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  creator_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  members?: GroupMember[];
  _count?: {
    members: number;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  user?: Profile;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  subject: string;
  semester: string;
  uploader_id: string;
  download_count: number;
  created_at: string;
  uploader?: Profile;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: 'class' | 'exam' | 'project' | 'meeting' | 'social';
  location: string;
  creator_id: string;
  is_public: boolean;
  created_at: string;
  creator?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  expires_at?: string;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'comment' | 'reaction' | 'mention' | 'event' | 'announcement';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface Media {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url?: string;
  uploader_id: string;
  is_public: boolean;
  created_at: string;
  uploader?: Profile;
}

export interface Vote {
  id: string;
  user_id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}