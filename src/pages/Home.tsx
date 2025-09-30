import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PostCard from '../components/Posts/PostCard';
import CreatePost from '../components/Posts/CreatePost';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import { useOnlineUsers } from '../hooks/useRealtime';

const Home: React.FC = () => {
  const { posts, loading, hasMore, createPost, deletePost, addReaction, loadMore } = usePosts();
  const { profile } = useAuth();
  const onlineUsers = useOnlineUsers();
  const [showComments, setShowComments] = useState<string | null>(null);

  const handleComment = (postId: string) => {
    setShowComments(showComments === postId ? null : postId);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue, {profile?.full_name?.split(' ')[0]} ! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Découvrez les dernières actualités de votre communauté LTI24-27
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">En ligne maintenant</div>
            <div className="text-2xl font-bold">{onlineUsers.length}</div>
          </div>
        </div>
      </motion.div>

      {/* Create Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CreatePost onSubmit={createPost} />
      </motion.div>

      {/* Posts Feed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PostCard
              post={post}
              onReact={addReaction}
              onComment={handleComment}
              onDelete={deletePost}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : 'Voir plus'}
          </button>
        </div>
      )}

      {posts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune publication pour le moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Soyez le premier à partager quelque chose avec la communauté !
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Home;