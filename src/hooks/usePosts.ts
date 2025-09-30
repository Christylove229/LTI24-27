import { useState, useEffect, useCallback } from 'react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { count: reactionCount } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('target_type', 'post')
            .eq('target_id', post.id);

          return {
            ...post,
            _count: {
              comments: commentCount || 0,
              reactions: reactionCount || 0
            }
          };
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
      const { error } = await supabase
        .from('reactions')
        .upsert({
          user_id: user.id,
          target_type: 'post',
          target_id: postId,
          reaction_type: reactionType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Erreur lors de la réaction');
    }
  }, [user]);

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
    loadMore,
    refresh: () => fetchPosts()
  };
};