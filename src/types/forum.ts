export interface ForumRoom {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: ForumMember[];
  last_message?: ForumMessage | null;
  unread_count?: number;
}

export interface ForumMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  last_read_at?: string;
  profile?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ForumMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content?: string;
  type: 'text' | 'image' | 'video' | 'file';
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface SendForumMessageData {
  room_id: string;
  content?: string;
  type: 'text' | 'image' | 'video' | 'file';
  attachment_url?: string;
  attachment_name?: string;
}

export interface ForumMessageListParams {
  room_id: string;
  before?: string;
  limit?: number;
}