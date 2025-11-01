import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase, Resource } from '../lib/supabase';

interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const Resources: React.FC = () => {
  const { user, profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [categories] = useState<ResourceCategory[]>([
    { id: 'cours', name: 'Cours', icon: '📚', color: 'bg-blue-100 text-blue-800' },
    { id: 'exercices', name: 'Exercices', icon: '✏️', color: 'bg-green-100 text-green-800' },
    { id: 'projets', name: 'Projets', icon: '🚀', color: 'bg-purple-100 text-purple-800' },
    { id: 'examens', name: 'Examens', icon: '📝', color: 'bg-red-100 text-red-800' },
    { id: 'autres', name: 'Autres', icon: '📎', color: 'bg-gray-100 text-gray-800' }
  ]);
  const [semesters] = useState<string[]>(['S1', 'S2', 'S3', 'S4', 'S5', 'S6']);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subject: 'cours',
    semester: 'S1',
    file: null as File | null
  });

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, selectedSemester, searchQuery]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          uploader:profiles!resources_uploader_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
        toast.error('Erreur lors du chargement des ressources');
        return;
      }

      // Debug: vérifier les données
      console.log('Resources loaded:', data);

      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Erreur lors du chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.subject === selectedCategory);
    }

    // Filter by semester
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(resource => resource.semester === selectedSemester);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.uploader?.full_name?.toLowerCase().includes(query)
      );
    }

    setFilteredResources(filtered);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadForm(prev => ({ ...prev, file, title: file.name }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadForm(prev => ({ ...prev, file, title: file.name }));
    }
  };

  const uploadFile = async () => {
    if (!uploadForm.file || !user) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, uploadForm.file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Erreur lors de l\'upload du fichier');
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // Save resource metadata to database
      const { data, error: dbError } = await supabase
        .from('resources')
        .insert({
          title: uploadForm.title,
          description: uploadForm.description || '',
          file_url: publicUrl,
          file_name: uploadForm.file.name,
          file_size: uploadForm.file.size,
          file_type: fileExt || 'unknown',
          subject: uploadForm.subject,
          semester: uploadForm.semester || '',
          uploader_id: user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving resource:', dbError);
        toast.error('Erreur lors de la sauvegarde de la ressource');
        return;
      }

      // Add to local state
      setResources(prev => [data, ...prev]);
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        subject: 'cours',
        semester: 'S1',
        file: null
      });

      toast.success('Ressource uploadée avec succès !');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const downloadResource = async (resource: Resource) => {
    try {
      toast.success(`Téléchargement de "${resource.title}" démarré...`);

      // Open the file in a new tab/window
      window.open(resource.file_url, '_blank');

      // Increment download count
      await supabase
        .from('resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id);

      // Update local state
      setResources(prev =>
        prev.map(r =>
          r.id === resource.id
            ? { ...r, download_count: r.download_count + 1 }
            : r
        )
      );

    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    const typeIcons: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      zip: '📦',
      rar: '📦',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️'
    };
    return typeIcons[fileType] || '📄';
  };

  const canUpload = profile?.role === 'admin' || profile?.role === 'teacher';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📚 Bibliothèque de Ressources
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Partagez et accédez à tous les documents pédagogiques
            </p>
          </div>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Ajouter une ressource</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une ressource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tous les semestres</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement des ressources...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const category = categories.find(cat => cat.id === resource.subject);
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(resource.file_type)}</span>
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${category?.color}`}>
                        {category?.icon} {category?.name}
                      </span>
                      {resource.semester && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 ml-2">
                          {resource.semester}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadResource(resource)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Télécharger"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setPreviewResource(resource);
                      }}
                      className="text-gray-400 hover:text-green-500 transition-colors"
                      title="Prévisualiser"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {resource.title}
                </h3>

                {resource.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>{resource.file_size ? formatFileSize(resource.file_size) : 'Taille inconnue'}</span>
                    <span>{resource.file_type.toUpperCase()}</span>
                  </div>
                  <span>{resource.download_count} téléchargements</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Par {resource.uploader?.full_name || resource.uploader?.email || 'Utilisateur inconnu'}</span>
                    <span>{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true, locale: fr })}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredResources.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune ressource trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedCategory !== 'all' || selectedSemester !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Soyez le premier à partager une ressource !'
              }
            </p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Ajouter une ressource
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadForm.file ? (
                    <div className="flex items-center justify-center space-x-3">
                      <PaperClipIcon className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {uploadForm.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadForm.file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Glissez-déposez votre fichier ici, ou{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                          parcourez
                        </button>
                      </p>
                      <p className="text-xs text-gray-500">
                        Formats acceptés : PDF, DOC, XLS, PPT, ZIP, Images (max 10MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom de la ressource *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Titre du document"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Description du contenu..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={uploadForm.subject}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Semestre *
                    </label>
                    <select
                      value={uploadForm.semester}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={uploadFile}
                    disabled={!uploadForm.file || !uploadForm.title || uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Upload...
                      </>
                    ) : (
                      'Uploader le fichier'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Aperçu: {previewResource.title}
                </h2>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {previewResource.file_type === 'pdf' ? (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Aperçu PDF non disponible
                    </p>
                    <p className="text-sm text-gray-500">
                      Cliquez sur "Télécharger" pour ouvrir le fichier PDF
                    </p>
                  </div>
                ) : previewResource.file_type.match(/(jpg|jpeg|png|gif)/) ? (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <img
                      src={previewResource.file_url}
                      alt={previewResource.title}
                      className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
                      onError={(e) => {
                        console.log('Image preview failed for:', previewResource.file_url);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden">
                      <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Aperçu image non disponible
                      </p>
                      <p className="text-xs text-gray-500">
                        URL: {previewResource.file_url}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Aperçu non disponible pour ce type de fichier
                    </p>
                    <p className="text-sm text-gray-500">
                      Cliquez sur "Télécharger" pour ouvrir le fichier
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Taille: {previewResource.file_size ? formatFileSize(previewResource.file_size) : 'Inconnue'}</p>
                    <p>Type: {previewResource.file_type.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => {
                      downloadResource(previewResource);
                      setPreviewResource(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span>Télécharger</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default Resources;