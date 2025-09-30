import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  HandThumbUpIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  HandThumbUpIcon as HandThumbUpIconSolid
} from '@heroicons/react/24/solid';
import { Post } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onReact: (postId: string, reactionType: string) => void;
  onComment: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onReact, onComment, onDelete }) => {
  const { user, profile } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const canDelete = user && (user.id === post.author_id || profile?.role === 'admin');

  const renderMedia = () => {
    if (post.image_url) {
      return (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full h-auto rounded-lg mt-3 max-h-96 object-cover"
        />
      );
    }
    
    if (post.video_url) {
      return (
        <video
          src={post.video_url}
          controls
          className="w-full h-auto rounded-lg mt-3 max-h-96"
        />
      );
    }
    
    if (post.file_url) {
      return (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {post.file_name?.split('.').pop()?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {post.file_name}
            </p>
            <a
              href={post.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Télécharger
            </a>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {post.author?.avatar_url ? (
            <img
              className="h-10 w-10 rounded-full"
              src={post.author.avatar_url}
              alt={post.author.full_name}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {post.author?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {post.author?.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true, 
                locale: fr 
              })}
              {post.author?.promo && ` • ${post.author.promo}`}
            </p>
          </div>
        </div>
        
        {(canDelete || user?.id === post.author_id) && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  {canDelete && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(post.id);
                        setShowActions(false);
                      }}
                      className="block px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
          {post.content}
        </p>
        {renderMedia()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onReact(post.id, 'like')}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <HandThumbUpIcon className="h-5 w-5" />
            <span className="text-sm">
              J'aime {post._count?.reactions ? `(${post._count.reactions})` : ''}
            </span>
          </button>
          
          <button
            onClick={() => onComment(post.id)}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <ChatBubbleOvalLeftIcon className="h-5 w-5" />
            <span className="text-sm">
              Commenter {post._count?.comments ? `(${post._count.comments})` : ''}
            </span>
          </button>
          
          <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <ShareIcon className="h-5 w-5" />
            <span className="text-sm">Partager</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;