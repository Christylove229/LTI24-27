import React, { useState } from 'react';
import {
  XMarkIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  postId,
  postContent
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/posts/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Publication partagée',
          text: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
          url: postUrl
        });
        onClose();
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      name: 'Copier le lien',
      icon: copied ? CheckIcon : ClipboardDocumentIcon,
      action: handleCopyLink,
      color: 'text-blue-600'
    },
    {
      name: 'Partager',
      icon: LinkIcon,
      action: handleShare,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Partager cette publication
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {postContent}
            </p>
          </div>

          <div className="space-y-2">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <option.icon className={`h-5 w-5 ${option.color}`} />
                <span className="text-gray-900 dark:text-white">{option.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
