import React, { useState, useRef } from 'react';
import { forumService } from '../../services/forum';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ForumMessageInputProps {
  roomId: string;
  onMessageSent: () => void;
}

export const ForumMessageInput: React.FC<ForumMessageInputProps> = ({ 
  roomId, 
  onMessageSent 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) {
      console.log('Cannot send message:', { content: content.trim(), user });
      return;
    }

    try {
      console.log('Sending message:', { room_id: roomId, content: content.trim(), user_id: user.id });
      const result = await forumService.sendMessage({
        room_id: roomId,
        content: content.trim(),
        type: 'text'
      });
      
      console.log('Message sent successfully:', result);
      setContent('');
      onMessageSent();
      toast.success('Message envoyé !');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);
      const attachmentUrl = await forumService.uploadAttachment(file, user.id);

      await forumService.sendMessage({
        room_id: roomId,
        content: file.name,
        type: getFileType(file.type),
        attachment_url: attachmentUrl,
        attachment_name: file.name
      });

      onMessageSent();
      toast.success('Fichier envoyé avec succès');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors de l\'envoi du fichier');
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (mimeType: string): 'image' | 'video' | 'file' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <div className="flex-1">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tapez votre message..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={uploading}
        />
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx"
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
      >
        {uploading ? '...' : '📎'}
      </button>
      
      <button
        type="submit"
        disabled={!content.trim() || uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        Envoyer
      </button>
    </form>
  );
};