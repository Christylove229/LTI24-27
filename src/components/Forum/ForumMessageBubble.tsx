import React from 'react';
import { ForumMessage } from '../../types/forum';

interface ForumMessageBubbleProps {
  message: ForumMessage;
  isOwn: boolean;
}

export const ForumMessageBubble: React.FC<ForumMessageBubbleProps> = ({ 
  message, 
  isOwn 
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAttachment = () => {
    if (!message.attachment_url) return null;

    if (message.type === 'image') {
      return (
        <div className="mt-2">
          <img 
            src={message.attachment_url} 
            alt={message.attachment_name}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(message.attachment_url, '_blank')}
          />
        </div>
      );
    }

    if (message.type === 'video') {
      return (
        <div className="mt-2">
          <video 
            src={message.attachment_url}
            controls
            className="max-w-xs rounded-lg"
          />
        </div>
      );
    }

    return (
      <div className="mt-2">
        <a
          href={message.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          📄 {message.attachment_name}
        </a>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
        isOwn 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-900 rounded-bl-none'
      }`}>
        {!isOwn && message.sender && (
          <div className="font-medium text-sm mb-1">
            {message.sender.full_name || message.sender.username}
          </div>
        )}
        
        {message.content && (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}
        
        {renderAttachment()}
        
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
};