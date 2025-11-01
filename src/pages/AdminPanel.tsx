import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { supabase, Profile, Post } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  post_id: string;
  parent_comment_id?: string;
  author?: {
    full_name: string;
  };
}

interface Reaction {
  id: string;
  reaction_type: string;
  created_at: string;
  user_id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  user: {
    full_name: string;
  };
}

interface AdminPanelProps {
  onLogout?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalReactions: 0,
    onlineUsers: 0,
    todayPosts: 0
  });

  // Vérification de sécurité : seul un admin peut accéder à ce composant
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              Seuls les administrateurs peuvent consulter le panneau d'administration.
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          author_id,
          post_id,
          parent_comment_id,
          author:profiles(id, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      // Fetch reactions
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select(`
          id,
          reaction_type,
          created_at,
          user_id,
          target_type,
          target_id,
          user:profiles(id, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (reactionsError) throw reactionsError;
      setReactions(reactionsData || []);

      // Calculate stats
      const onlineUsers = usersData?.filter(user => user.is_online).length || 0;
      const todayPosts = postsData?.filter(post =>
        new Date(post.created_at).toDateString() === new Date().toDateString()
      ).length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalPosts: postsData?.length || 0,
        totalComments: commentsData?.length || 0,
        totalReactions: reactionsData?.length || 0,
        onlineUsers,
        todayPosts
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const resetUserRole = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser cet utilisateur au rôle étudiant ?')) {
      return;
    }

    try {
      await supabase
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', userId);

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, role: 'student' } : user
      ));
      toast.success('Utilisateur réinitialisé en tant qu\'étudiant');
    } catch (error) {
      console.error('Error resetting user role:', error);
      toast.error('Erreur lors de la réinitialisation du rôle');
    }
  };

  const deletePost = async (postId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      return;
    }

    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Publication supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setStats(prev => ({ ...prev, totalComments: prev.totalComments - 1 }));
      toast.success('Commentaire supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression du commentaire');
    }
  };

  const deleteReaction = async (reactionId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réaction ?')) {
      return;
    }

    try {
      await supabase
        .from('reactions')
        .delete()
        .eq('id', reactionId);

      setReactions(prev => prev.filter(reaction => reaction.id !== reactionId));
      setStats(prev => ({ ...prev, totalReactions: prev.totalReactions - 1 }));
      toast.success('Réaction supprimée');
    } catch (error) {
      console.error('Error deleting reaction:', error);
      toast.error('Erreur lors de la suppression de la réaction');
    }
  };

  const promoteToTeacher = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir promouvoir cet utilisateur en tant qu\'enseignant ?')) {
      return;
    }

    try {
      await supabase
        .from('profiles')
        .update({ role: 'teacher' })
        .eq('id', userId);

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, role: 'teacher' } : user
      ));
      toast.success('Utilisateur promu enseignant');
    } catch (error) {
      console.error('Error promoting user to teacher:', error);
      toast.error('Erreur lors de la promotion');
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir promouvoir cet utilisateur en tant qu\'administrateur ?')) {
      return;
    }

    try {
      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, role: 'admin' } : user
      ));
      toast.success('Utilisateur promu administrateur');
    } catch (error) {
      toast.error('Erreur lors de la promotion');
    }
  };

  const tabs = [
    { id: 'users', name: 'Utilisateurs', icon: UsersIcon, count: stats.totalUsers },
    { id: 'posts', name: 'Publications', icon: DocumentTextIcon, count: stats.totalPosts },
    { id: 'comments', name: 'Commentaires', icon: ChatBubbleLeftRightIcon, count: stats.totalComments },
    { id: 'reactions', name: 'Réactions', icon: HeartIcon, count: stats.totalReactions },
    { id: 'stats', name: 'Statistiques', icon: ChartBarIcon }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="bg-red-600 rounded-lg shadow-lg text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ⚠️ Panneau d'Administration
            </h1>
            <p className="text-red-100">
              Interface de gestion sécurisée - Accès administrateur uniquement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-red-100 mb-1">Session admin</div>
              <div className="text-lg font-semibold">{profile?.full_name}</div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Utilisateurs Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Publications
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Commentaires
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalComments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Réactions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalReactions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                En ligne
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.onlineUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Posts Aujourd'hui
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.todayPosts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Gestion des Utilisateurs
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'teacher' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' :
                             user.role === 'teacher' ? 'Enseignant' : 'Étudiant'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${
                              user.is_online ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user.is_online ? 'En ligne' : 'Hors ligne'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {user.role !== 'admin' && (
                              <>
                                {user.role === 'student' && (
                                  <button
                                    onClick={() => promoteToTeacher(user.id)}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400"
                                    title="Promouvoir enseignant"
                                  >
                                    👨‍🏫
                                  </button>
                                )}
                                <button
                                  onClick={() => promoteToAdmin(user.id)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                                  title="Promouvoir admin"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => resetUserRole(user.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400"
                                  title="Réinitialiser au rôle étudiant"
                                >
                                  <ExclamationTriangleIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Gestion des Publications
              </h3>

              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.author?.full_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2 truncate">
                          {post.content}
                        </p>
                        {post.image_url && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            📷 Contient une image
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 p-2"
                        title="Supprimer la publication"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Gestion des Commentaires
              </h3>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Aucun commentaire trouvé
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.author?.full_name || 'Utilisateur inconnu'}
                            </span>
                            {comment.parent_comment_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Réponse
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {comment.content}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Post ID: {comment.post_id}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 p-2"
                          title="Supprimer le commentaire"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'reactions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Gestion des Réactions
              </h3>

              <div className="space-y-4">
                {reactions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Aucune réaction trouvée
                  </p>
                ) : (
                  reactions.map((reaction) => (
                    <div key={reaction.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {reaction.user?.full_name || 'Utilisateur inconnu'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            reaction.reaction_type === 'like' ? 'bg-blue-100 text-blue-800' :
                            reaction.reaction_type === 'love' ? 'bg-red-100 text-red-800' :
                            reaction.reaction_type === 'laugh' ? 'bg-yellow-100 text-yellow-800' :
                            reaction.reaction_type === 'angry' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reaction.reaction_type === 'like' ? '👍' :
                             reaction.reaction_type === 'love' ? '❤️' :
                             reaction.reaction_type === 'laugh' ? '😂' :
                             reaction.reaction_type === 'angry' ? '😡' :
                             reaction.reaction_type}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(reaction.created_at), { addSuffix: true, locale: fr })}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {reaction.target_type === 'post' ? 'Publication' : 'Commentaire'} • ID: {reaction.target_id}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteReaction(reaction.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 p-2"
                          title="Supprimer la réaction"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Statistiques Détaillées
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Répartition des Rôles
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Étudiants</span>
                      <span className="text-sm font-medium">
                        {users.filter(u => u.role === 'student').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enseignants</span>
                      <span className="text-sm font-medium">
                        {users.filter(u => u.role === 'teacher').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Administrateurs</span>
                      <span className="text-sm font-medium">
                        {users.filter(u => u.role === 'admin').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Activité Récente
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Posts cette semaine</span>
                      <span className="text-sm font-medium">
                        {posts.filter(p =>
                          new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Nouveaux utilisateurs (7j)</span>
                      <span className="text-sm font-medium">
                        {users.filter(u =>
                          new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
