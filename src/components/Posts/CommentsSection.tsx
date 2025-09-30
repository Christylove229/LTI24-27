import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { usePosts } from '../../hooks/usePosts';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_username: string;
  author_avatar_url?: string;
  parent_comment_id?: string;
  replies_count: number;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  isOpen: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, isOpen }) => {
  const { user } = useAuth();
  const { getComments, addComment } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await addComment(postId, newComment.trim());
      setNewComment('');
      await fetchComments(); // Rafraîchir pour voir le nouveau commentaire
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await addComment(postId, replyContent.trim(), parentCommentId);
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments(); // Rafraîchir pour voir la nouvelle réponse
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''}`}>
      <div className="flex space-x-3">
        {comment.author_avatar_url ? (
          <img
            className="h-8 w-8 rounded-full"
            src={comment.author_avatar_url}
            alt={comment.author_username}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {comment.author_username?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.author_username}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: fr
              })}
            </p>
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Répondre
              </button>
            )}
            {comment.replies_count > 0 && !isReply && (
              <button
                onClick={() => {
                  // Toggle pour afficher/masquer les réponses
                  const updatedComments = comments.map(c =>
                    c.id === comment.id ? { ...c, showReplies: !c.showReplies } : c
                  );
                  setComments(updatedComments);
                }}
                className="text-xs text-gray-500 hover:text-gray-600 dark:text-gray-400"
              >
                {comment.replies_count} réponse{comment.replies_count > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Formulaire de réponse */}
          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3 flex space-x-3">
              {user?.user_metadata?.avatar_url ? (
                <img
                  className="h-6 w-6 rounded-full"
                  src={user.user_metadata.avatar_url}
                  alt="Your avatar"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Répondre à ${comment.author_username}...`}
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Répondre
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-600"
              >
                Annuler
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Afficher les réponses si elles existent */}
      {comment.replies && comment.replies.length > 0 && (!isReply || (comment as any).showReplies !== false) && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Liste des commentaires */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucun commentaire pour le moment
          </p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>

      {/* Formulaire d'ajout de commentaire */}
      {user && (
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          {user.user_metadata?.avatar_url ? (
            <img
              className="h-8 w-8 rounded-full"
              src={user.user_metadata.avatar_url}
              alt="Your avatar"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '...' : 'Publier'}
          </button>
        </form>
      )}
    </div>
  );
};
