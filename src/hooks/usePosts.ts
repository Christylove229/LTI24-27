import { useState, useEffect, useCallback } from 'react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Fonction utilitaire pour obtenir l'emoji de réaction
const getReactionEmoji = (reactionType: string): string => {
  const emojiMap: { [key: string]: string } = {
    like: '👍',
    love: '❤️',
    wow: '😮',
    laugh: '😂',
    sad: '😢',
    angry: '😠'
  };
  return emojiMap[reactionType] || '👍';
};

export const usePosts = (limit = 10) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async (offset = 0, replace = true) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get comment counts separately
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          try {
            const { count: commentCount, error: commentError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            if (commentError) {
              console.error('Error fetching comment count:', commentError);
            }

            const { count: reactionCount, error: reactionError } = await supabase
              .from('reactions')
              .select('*', { count: 'exact', head: true })
              .eq('target_type', 'post')
              .eq('target_id', post.id);

            if (reactionError) {
              console.error('Error fetching reaction count:', reactionError);
            }

            return {
              ...post,
              _count: {
                comments: commentCount || 0,
                reactions: reactionCount || 0
              }
            };
          } catch (error) {
            console.error('Error in count fetching:', error);
            return {
              ...post,
              _count: {
                comments: 0,
                reactions: 0
              }
            };
          }
        })
      );

      if (replace) {
        setPosts(postsWithCounts);
      } else {
        setPosts(prev => [...prev, ...postsWithCounts]);
      }

      setHasMore(postsWithCounts.length === limit);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erreur lors du chargement des publications');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const createPost = useCallback(async (content: string, type: 'text' | 'image' | 'video' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content,
          type,
          ...(type === 'image' && { image_url: fileUrl }),
          ...(type === 'video' && { video_url: fileUrl }),
          ...(type === 'file' && { file_url: fileUrl, file_name: fileName })
        })
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      const postWithCounts = {
        ...data,
        _count: {
          comments: 0,
          reactions: 0
        }
      };

      setPosts(prev => [postWithCounts, ...prev]);
      toast.success('Publication créée avec succès !');
      return postWithCounts;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Erreur lors de la création de la publication');
      throw error;
    }
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Publication supprimée');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [user]);

  const addReaction = useCallback(async (postId: string, reactionType: string) => {
    if (!user) return;

    try {
      // Vérifier si l'utilisateur a déjà une réaction sur ce post
      const { data: existingReaction, error: fetchError } = await supabase
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_type', 'post')
        .eq('target_id', postId)
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single()

      if (fetchError) {
        console.error('Error fetching existing reaction:', fetchError);
        throw fetchError;
      }

      if (existingReaction) {
        // Si la réaction est la même, la supprimer (toggle)
        if (existingReaction.reaction_type === reactionType) {
          const { error: deleteError } = await supabase
            .from('reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (deleteError) throw deleteError;
          toast.success('Réaction supprimée');
        } else {
          // Sinon, changer le type de réaction
          const { error: updateError } = await supabase
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);

          if (updateError) throw updateError;
          toast.success('Réaction mise à jour');
        }
      } else {
        // Ajouter une nouvelle réaction
        const { error: insertError } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            target_type: 'post',
            target_id: postId,
            reaction_type: reactionType
          });

        if (insertError) throw insertError;
        toast.success('Réaction ajoutée');
        
        // Créer une notification pour l'auteur du post (si ce n'est pas soi-même)
        const post = posts.find(p => p.id === postId);
        if (post && post.author_id !== user.id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: post.author_id,
                type: 'reaction',
                title: 'Nouvelle réaction',
                message: `${user.email} a réagi à votre publication avec ${getReactionEmoji(reactionType)}`,
                data: {
                  post_id: postId,
                  reaction_type: reactionType,
                  reactor_id: user.id,
                  reactor_name: user.email
                }
              });
          } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Ne pas faire échouer la réaction si la notification échoue
          }
        }
      }

      // Rafraîchir les posts pour mettre à jour les compteurs
      fetchPosts();
    } catch (error) {
      console.error('Error managing reaction:', error);
      toast.error('Erreur lors de la réaction');
    }
  }, [user, fetchPosts]);

  const addComment = useCallback(async (postId: string, content: string, parentCommentId?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          author_id: user.id,
          post_id: postId,
          content,
          ...(parentCommentId && { parent_comment_id: parentCommentId })
        })
        .select(`
          *,
          author:profiles!comments_author_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Créer une notification pour l'auteur du post (si ce n'est pas soi-même)
      const post = posts.find(p => p.id === postId);
      if (post && post.author_id !== user.id) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.author_id,
              type: 'comment',
              title: 'Nouveau commentaire',
              message: `${user.email} a commenté votre publication : "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
              data: {
                post_id: postId,
                comment_id: data.id,
                commenter_id: user.id,
                commenter_name: user.email,
                comment_content: content
              }
            });
        } catch (notificationError) {
          console.error('Error creating comment notification:', notificationError);
          // Ne pas faire échouer le commentaire si la notification échoue
        }
      }

      // Rafraîchir les posts pour mettre à jour les compteurs
      fetchPosts();
      toast.success(parentCommentId ? 'Réponse ajoutée' : 'Commentaire ajouté');
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
      throw error;
    }
  }, [user, fetchPosts]);

  const getComments = useCallback(async (postId: string) => {
    try {
      // Utiliser une requête simple au lieu de la fonction RPC
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          parent_comment_id,
          author:profiles!comments_author_id_fkey(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organiser les commentaires en structure imbriquée côté client
      const commentsMap = new Map<string, any>();
      const topLevelComments: any[] = [];

      // D'abord, créer une map de tous les commentaires avec comptage des réponses
      data?.forEach((comment: any) => {
        commentsMap.set(comment.id, {
          ...comment,
          author_username: comment.author?.full_name || 'Utilisateur anonyme',
          author_avatar_url: comment.author?.avatar_url,
          replies: [],
          replies_count: 0
        });
      });

      // Compter les réponses pour chaque commentaire
      data?.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies_count += 1;
            parent.replies.push(commentsMap.get(comment.id));
          }
        }
      });

      // Collecter les commentaires de niveau supérieur
      data?.forEach((comment: any) => {
        if (!comment.parent_comment_id) {
          topLevelComments.push(commentsMap.get(comment.id));
        }
      });

      return topLevelComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user.id); // Sécurité : seulement son propre commentaire

      if (error) throw error;

      // Rafraîchir les posts pour mettre à jour les compteurs
      fetchPosts();
      toast.success('Commentaire supprimé');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erreur lors de la suppression du commentaire');
    }
  }, [user, fetchPosts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(posts.length, false);
    }
  }, [posts.length, loading, hasMore, fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
         { event: 'INSERT', schema: 'public', table: 'posts' },
         (payload) => {
           // Don't add our own posts (already added optimistically)
           if (payload.new.author_id !== user.id) {
             fetchPosts(); // Refresh to get full post with relations
           }
         })
      .on('postgres_changes',
         { event: 'DELETE', schema: 'public', table: 'posts' },
         (payload) => {
           setPosts(prev => prev.filter(post => post.id !== payload.old.id));
         })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPosts]);

  return {
    posts,
    loading,
    hasMore,
    createPost,
    deletePost,
    addReaction,
    addComment,
    getComments,
    deleteComment,
    loadMore,
    refresh: () => fetchPosts()
  };
};