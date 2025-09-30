import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const Profile: React.FC = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    promo: profile?.promo || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!profile) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      await updateProfile({ avatar_url: publicUrl });
      toast.success('Avatar mis à jour avec succès !');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erreur lors du téléversement de l\'avatar');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="relative -mt-16 mb-6">
            <div className="relative inline-block">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <label className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <CameraIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex justify-between items-start mb-6">
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="text-3xl font-bold bg-transparent border-b-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.promo}
                    onChange={(e) => setFormData({ ...formData, promo: e.target.value })}
                    placeholder="Promotion"
                    className="text-lg bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Parlez-nous de vous..."
                    rows={3}
                    className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile.full_name}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                    {profile.promo && `Promotion ${profile.promo}`}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 max-w-2xl">
                    {profile.bio || "Aucune biographie pour le moment."}
                  </p>
                </>
              )}
            </div>

            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Publications
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Commentaires
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {profile.is_online ? 'En ligne' : 'Hors ligne'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Statut
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={signOut}
              className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;