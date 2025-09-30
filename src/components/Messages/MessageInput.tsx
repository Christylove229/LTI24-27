// src/components/Messages/MessageInput.tsx
import React, { useState, useRef } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface MessageInputProps {
  onSend: (content: string, type?: 'text' | 'image' | 'video' | 'file', file?: File) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    
    // Reset height to calculate new height
    textarea.style.height = 'auto';
    // Set new height based on scroll height, with min and max
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 120);
    textarea.style.height = `${newHeight}px`;
  };

  // Détecter le type de fichier
  const getFileType = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier ne peut pas dépasser 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Supprimer le fichier sélectionné
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Envoyer le message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isUploading) return;
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !selectedFile) return;

    setIsUploading(true);
    
    try {
      if (selectedFile) {
        const fileType = getFileType(selectedFile);
        await onSend(trimmedMessage || selectedFile.name, fileType, selectedFile);
      } else {
        await onSend(trimmedMessage);
      }
      
      // Reset form
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsUploading(false);
    }
  };

  // Gérer Enter pour envoyer (Shift+Enter pour nouvelle ligne)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = (message.trim() || selectedFile) && !disabled && !isUploading;

  return (
    <div className="border-t bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
      {/* Fichier sélectionné */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex-shrink-0">
              {selectedFile.type.startsWith('image/') ? (
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">IMG</span>
                </div>
              ) : selectedFile.type.startsWith('video/') ? (
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">VID</span>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">FILE</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeSelectedFile}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Supprimer le fichier"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Zone de saisie */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              disabled={disabled || isUploading}
              className="block w-full resize-none rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              rows={1}
            />
            
            {/* Bouton d'attachement dans le textarea */}
            <div className="absolute right-2 bottom-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                className="hidden"
                disabled={disabled || isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Joindre un fichier"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Bouton d'envoi */}
        <button
          type="submit"
          disabled={!canSend}
          className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
          aria-label="Envoyer le message"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Indication des formats acceptés */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Formats supportés: Images, vidéos, PDF, documents (max 10MB) • Enter pour envoyer, Shift+Enter pour nouvelle ligne
      </div>
    </div>
  );
}