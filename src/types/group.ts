// src/types/group.ts
export interface Group {
    id: string;
    name: string;
    description: string;
    banner_url: string | null;
    is_public: boolean;
    max_members: number;
    created_at: string;
    updated_at: string;
    created_by: string;
    member_count?: number;
    message_count?: number;
    last_message_at?: string | null;
    role?: string;
    joined_at?: string;
  }
  
  export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    joined_at: string;
    last_seen: string | null;
    user?: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string | null;
    };
  }
  
  export interface GroupMessage {
    id: string;
    group_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    reply_to: string | null;
    is_pinned: boolean;
    user?: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string | null;
    };
    reply_count?: number;
  }
  
  export interface GroupFile {
    id: string;
    group_id: string;
    uploaded_by: string;
    file_name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
    user?: {
      full_name: string;
      avatar_url: string | null;
    };
  }
  
  export interface GroupEvent {
    id: string;
    group_id: string;
    created_by: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string | null;
    location: string | null;
    is_online: boolean;
    meeting_url: string | null;
    created_at: string;
    updated_at: string;
    user?: {
      full_name: string;
      avatar_url: string | null;
    };
  }