import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  CalendarDaysIcon,
  TagIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interfaces
interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size?: number;
  mime_type: string;
  width?: number;
  height?: number;
  album: string;
  tags: string[];
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

interface GalleryComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    full_name: string;
  };
}

type ViewMode = 'grid' | 'masonry';
type SortBy = 'recent' | 'popular' | 'oldest';

const Gallery: React.FC = () => {
  const { profile } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [albums, setAlbums] = useState<string[]>([]);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    album: 'Général',
    tags: '',
    is_public: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
    fetchAlbums();
  }, [sortBy, selectedAlbum]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('gallery_images')
        .select(`
          *,
          user:profiles!gallery_images_user_id_fkey(id, full_name)
        `)
        .eq('is_public', true);

      // Album filter
      if (selectedAlbum !== 'all') {
        query = query.eq('album', selectedAlbum);
      }

      // Search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Sort
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'popular':
          // This would need a more complex query to count likes
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data: imagesData, error } = await query.limit(50);

      if (error) throw error;

      // Récupérer les compteurs de likes et commentaires pour chaque image
      const imagesWithStats = await Promise.all(
        (imagesData || []).map(async (image) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase
              .from('gallery_likes')
              .select('id', { count: 'exact' })
              .eq('image_id', image.id),
            supabase
              .from('gallery_comments')
              .select('id', { count: 'exact' })
              .eq('image_id', image.id)
          ]);

          // Vérifier si l'utilisateur actuel a liké cette image
          let userLiked = false;
          if (profile?.id) {
            try {
              const { data, error } = await supabase
                .from('gallery_likes')
                .select('id')
                .eq('image_id', image.id)
                .eq('user_id', profile.id)
                .single();
              userLiked = !error && !!data;
            } catch {
              userLiked = false;
            }
          }

          return {
            ...image,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            is_liked: userLiked
          };
        })
      );

      setImages(imagesWithStats);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Erreur lors du chargement des images');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('album')
        .not('album', 'is', null);

      if (error) throw error;

      const uniqueAlbums = [...new Set(data?.map(item => item.album) || [])];
      setAlbums(uniqueAlbums);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !profile?.id) return;

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // Get image dimensions if it's an image
      let dimensions = null;
      if (file.type.startsWith('image/')) {
        dimensions = await getImageDimensions(file);
      }

      // Create database record
      const { data, error } = await supabase
        .from('gallery_images')
        .insert([{
          title: uploadForm.title || file.name,
          description: uploadForm.description || null,
          image_url: publicUrl,
          thumbnail_url: file.type.startsWith('image/') ? publicUrl : null,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
          album: uploadForm.album,
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : [],
          is_public: uploadForm.is_public,
          user_id: profile.id
        }])
        .select()
        .single();

      if (error) throw error;

      setImages(prev => [data, ...prev]);
      setShowUploadModal(false);
      resetUploadForm();
      toast.success('Image uploadée avec succès');

      // Refresh albums list
      fetchAlbums();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLike = async (imageId: string, currentlyLiked: boolean) => {
    if (!profile?.id) return;

    try {
      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('gallery_likes')
          .delete()
          .eq('image_id', imageId)
          .eq('user_id', profile.id);

        if (error) throw error;

        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, is_liked: false, likes_count: (img.likes_count || 0) - 1 }
            : img
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('gallery_likes')
          .insert([{ image_id: imageId, user_id: profile.id }]);

        if (error) throw error;

        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, is_liked: true, likes_count: (img.likes_count || 0) + 1 }
            : img
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur lors de la gestion du like');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedImage || !profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('gallery_comments')
        .insert([{
          image_id: selectedImage.id,
          user_id: profile.id,
          content: newComment.trim()
        }])
        .select(`
          *,
          user:profiles!gallery_comments_user_id_fkey(id, full_name)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');

      // Update comment count
      setImages(prev => prev.map(img =>
        img.id === selectedImage.id
          ? { ...img, comments_count: (img.comments_count || 0) + 1 }
          : img
      ));

      toast.success('Commentaire ajouté');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const fetchCommentsForImage = async (image: GalleryImage) => {
    try {
      const { data, error } = await supabase
        .from('gallery_comments')
        .select(`
          *,
          user:profiles!gallery_comments_user_id_fkey(id, full_name)
        `)
        .eq('image_id', image.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);

      // Scroll to comments section after comments are loaded
      setTimeout(() => {
        const commentsSection = document.querySelector('[data-comments-section]');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 200);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const openImageModal = async (image: GalleryImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
    await fetchCommentsForImage(image);
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      album: 'Général',
      tags: '',
      is_public: true
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = !searchQuery ||
      image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Chargement de la galerie...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
              <PhotoIcon className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Galerie Multimédia
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Découvrez et partagez les photos et vidéos de la communauté
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-64"
              />
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Album Filter */}
            <select
              value={selectedAlbum}
              onChange={(e) => setSelectedAlbum(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les albums</option>
              {albums.map(album => (
                <option key={album} value={album}>{album}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="popular">Plus populaire</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-l-lg text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`px-3 py-2 rounded-r-lg text-sm font-medium ${
                viewMode === 'masonry'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Mosaïque
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {searchQuery ? 'Aucune image trouvée pour cette recherche' : 'Aucune image dans la galerie'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Ajouter la première image →
            </button>
          </div>
        ) : (
          <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6'}`}>
            {filteredImages.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative cursor-pointer ${viewMode === 'masonry' ? 'break-inside-avoid mb-6' : ''}`}
                onClick={() => openImageModal(image)}
              >
                <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                  {image.mime_type.startsWith('video/') ? (
                    <video
                      src={image.image_url}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <img
                      src={image.thumbnail_url || image.image_url}
                      alt={image.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                      <EyeIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Like and Comment buttons */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(image.id, image.is_liked || false);
                        }}
                        className={`flex items-center space-x-1 bg-black bg-opacity-50 rounded-full px-2 py-1 text-white text-sm transition-colors ${
                          image.is_liked ? 'text-red-400' : 'hover:bg-opacity-70'
                        }`}
                      >
                        {image.is_liked ? (
                          <HeartIconSolid className="h-4 w-4" />
                        ) : (
                          <HeartIcon className="h-4 w-4" />
                        )}
                        <span>{image.likes_count || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                          setShowImageModal(true);
                          setComments([]); // Reset comments
                          // Fetch comments and scroll to them
                          fetchCommentsForImage(image);
                        }}
                        className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-full px-2 py-1 text-white text-sm hover:bg-opacity-70 transition-colors"
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{image.comments_count || 0}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => openImageModal(image)}
                      className="bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-colors"
                      title="Voir en détail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Image info */}
                <div className="mt-2">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {image.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{image.user?.full_name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(image.created_at), { addSuffix: true, locale: fr })}</span>
                  </div>
                  {image.album !== 'Général' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {image.album}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ajouter une image
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fichier *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Titre de l'image"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Album
                  </label>
                  <input
                    type="text"
                    value={uploadForm.album}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, album: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nom de l'album"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Description de l'image"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="vacances, amis, fête"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={uploadForm.is_public}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">
                    Rendre public
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    disabled={uploading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Upload...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        <span>Uploader</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal (Lightbox) */}
      <AnimatePresence>
        {showImageModal && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Image/Video */}
                <div className="flex-1 bg-black flex items-center justify-center">
                  {selectedImage.mime_type.startsWith('video/') ? (
                    <video
                      src={selectedImage.image_url}
                      controls
                      className="max-w-full max-h-[60vh] object-contain"
                    />
                  ) : (
                    <img
                      src={selectedImage.image_url}
                      alt={selectedImage.title}
                      className="max-w-full max-h-[60vh] object-contain"
                    />
                  )}
                </div>

                {/* Details and Comments */}
                <div className="w-full lg:w-96 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {selectedImage.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <UserIcon className="h-4 w-4" />
                        <span>{selectedImage.user?.full_name}</span>
                        <span>•</span>
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(selectedImage.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowImageModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Description */}
                  {selectedImage.description && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {selectedImage.description}
                    </p>
                  )}

                  {/* Tags and Album */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedImage.album !== 'Général' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {selectedImage.album}
                      </span>
                    )}
                    {selectedImage.tags?.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-4 mb-6">
                    <button
                      onClick={() => handleLike(selectedImage.id, selectedImage.is_liked || false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        selectedImage.is_liked
                          ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {selectedImage.is_liked ? (
                        <HeartIconSolid className="h-5 w-5" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                      <span>{selectedImage.likes_count || 0}</span>
                    </button>

                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span>{selectedImage.comments_count || 0} commentaires</span>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4" data-comments-section>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                      Commentaires
                    </h4>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="mb-4">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Ajouter un commentaire..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg disabled:opacity-50 text-sm"
                        >
                          Publier
                        </button>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                          Aucun commentaire
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {comment.user.full_name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;