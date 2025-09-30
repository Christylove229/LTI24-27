import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  TrashIcon,
  EyeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, Post } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

// Admin secret key verification
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET_KEY || 'admin_secret_2024';

const AdminPanel: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [secretKey, setSecretKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    onlineUsers: 0,
    todayPosts: 0
  });
  const [loading, setLoading] = useState(true);

  // Verify admin access
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Secret key verification
  const verifySecretKey = () => {
    if (secretKey === ADMIN_SECRET) {
      setIsAuthorized(true);
      fetchData();
    } else {
      toast.error('Clé secrète incorrecte');
    }
  };

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
          author:profiles!posts_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Calculate stats
      const onlineUsers = usersData?.filter(user => user.is_online).length || 0;
      const todayPosts = postsData?.filter(post => 
        new Date(post.created_at).toDateString() === new Date().toDateString()
      ).length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalPosts: postsData?.length || 0,
        onlineUsers,
        todayPosts
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) {
      return;
    }

    try {
      await supabase
        .from('profiles')
        .update({ role: 'student' }) // Reset to student instead of suspended
        .eq('id', userId);

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: 'student' } : user
      ));
      toast.success('Utilisateur réinitialisé en tant qu\'étudiant');
    } catch (error) {
      toast.error('Erreur lors de la modification');
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Accès Sécurisé
            </h2>
            <p className="text-gray-400">
              Veuillez entrer la clé secrète d'administration
            </p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Clé secrète d'administration"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && verifySecretKey()}
            />
            <button
              onClick={verifySecretKey}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Vérifier l'accès
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', name: 'Utilisateurs', icon: UsersIcon, count: stats.totalUsers },
    { id: 'posts', name: 'Publications', icon: DocumentTextIcon, count: stats.totalPosts },
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
          <div className="text-right">
            <div className="text-sm text-red-100 mb-1">Session admin</div>
            <div className="text-lg font-semibold">{profile?.full_name}</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
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
                                <button
                                  onClick={() => promoteToAdmin(user.id)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                                  title="Promouvoir admin"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => suspendUser(user.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400"
                                  title="Suspendre"
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