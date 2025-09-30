// src/components/Messages/MessageBubble.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DocumentIcon, ArrowDownTrayIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Message } from '../../types/messages';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
}

export default function MessageBubble({ message, isOwn, showSender = true }: MessageBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Formater la date
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: fr });
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE HH:mm', { locale: fr });
    } else {
      return format(date, 'dd/MM HH:mm', { locale: fr });
    }
  };

  // Extraire le nom du fichier depuis l'URL
  const getFileName = (url: string, fallbackName?: string) => {
    if (fallbackName) return fallbackName;
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || 'fichier';
    } catch {
      return 'fichier';
    }
  };

  // Télécharger un fichier
  const downloadFile = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendu du contenu selon le type
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        if (!message.attachment_url) return null;
        return (
          <div className="relative max-w-sm">
            {!imageLoaded && !imageError && (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Chargement...</span>
              </div>
            )}
            {imageError ? (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Image non disponible</span>
              </div>
            ) : (
              <img
                src={message.attachment_url}
                alt={message.attachment_name || "Image partagée"}
                className={`rounded-lg max-w-full h-auto transition-opacity ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onClick={() => window.open(message.attachment_url, '_blank')}
                style={{ cursor: 'pointer', maxHeight: '300px' }}
              />
            )}
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        if (!message.attachment_url) return null;
        return (
          <div className="relative max-w-sm">
            <video
              src={message.attachment_url}
              controls
              className="rounded-lg max-w-full h-auto"
              style={{ maxHeight: '300px' }}
              preload="metadata"
            >
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <PlayIcon className="w-12 h-12 text-gray-500 dark:text-gray-400" />
              </div>
            </video>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        if (!message.attachment_url) return null;
        const fileName = getFileName(message.attachment_url, message.attachment_name);
        return (
          <div className="max-w-xs">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <DocumentIcon className="w-8 h-8 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fichier joint
                </p>
              </div>
              <button
                onClick={() => downloadFile(message.attachment_url!, fileName)}
                className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                aria-label="Télécharger le fichier"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
            </div>
            {message.content && message.content !== fileName && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs sm:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Nom de l'expéditeur */}
        {showSender && !isOwn && message.sender && (
          <div className="mb-1 px-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {message.sender.full_name || message.sender.email}
            </span>
          </div>
        )}
        
        {/* Bulle de message */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
          }`}
        >
          {renderContent()}
        </div>
        
        {/* Horodatage */}
        <div className={`mt-1 px-1 text-xs text-gray-500 dark:text-gray-400 ${
          isOwn ? 'text-right' : 'text-left'
        }`}>
          {formatMessageTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}