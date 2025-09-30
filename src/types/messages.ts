// src/types/messages.ts
export interface Thread {
    id: string;
    is_group: boolean;
    title?: string;
    created_at: string;
    updated_at: string;
    // Relations calculées
    participants?: ThreadParticipant[];
    last_message?: Message;
    unread_count?: number;
    other_participant?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    };
  }
  
  export interface ThreadParticipant {
    id: string;
    thread_id: string;
    user_id: string;
    last_read_at?: string;
    created_at: string;
    // Relations
    user?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    };
  }
  
  export interface Message {
    id: string;
    thread_id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'file';
    attachment_url?: string;
    attachment_name?: string;
    created_at: string;
    // Relations
    sender?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    };
    read_receipts?: MessageReadReceipt[];
  }
  
  export interface MessageReadReceipt {
    id: string;
    message_id: string;
    user_id: string;
    read_at: string;
  }
  
  export interface SendMessageData {
    threadId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'file';
    attachmentUrl?: string;
    attachmentName?: string;
  }
  
  export interface CreateThreadData {
    participantIds: string[];
    title?: string;
  }
  
  export interface MessageListParams {
    threadId: string;
    limit?: number;
    before?: string; // cursor pour pagination
  }
  
  export interface ThreadListParams {
    userId: string;
    limit?: number;
    offset?: number;
    search?: string;
  }