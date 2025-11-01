import React, { useState } from 'react';
import { XMarkIcon, LinkIcon, DocumentIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useLearningResources, extractYouTubeId } from '../../hooks/useLearning';

interface NewResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const subjects = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Anglais',
  'Français',
  'Histoire',
  'Géographie',
  'Philosophie',
  'SVT',
  'Économie',
  'Informatique',
  'Autre'
];

const resourceTypes = [
  { value: 'youtube', label: 'Vidéo YouTube', icon: VideoCameraIcon, description: 'Lien vers une vidéo YouTube' },
  { value: 'pdf', label: 'Document PDF', icon: DocumentIcon, description: 'Fichier PDF ou lien vers un document' },
  { value: 'link', label: 'Lien externe', icon: LinkIcon, description: 'Lien vers un site web ou une ressource' }
];

const NewResourceModal: React.FC<NewResourceModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    subject: '',
    youtube_url: '',
    file_url: '',
    external_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [youtubePreview, setYoutubePreview] = useState<string | null>(null);
  const { createResource } = useLearningResources();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.type || !formData.subject) {
      return;
    }

    // Validation selon le type
    if (formData.type === 'youtube' && !formData.youtube_url.trim()) {
      return;
    }
    if (formData.type === 'pdf' && !formData.file_url.trim()) {
      return;
    }
    if (formData.type === 'link' && !formData.external_url.trim()) {
      return;
    }

    setLoading(true);
    try {
      await createResource(formData);
      setFormData({
        title: '',
        description: '',
        type: '',
        subject: '',
        youtube_url: '',
        file_url: '',
        external_url: ''
      });
      setYoutubePreview(null);
      onClose();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Preview YouTube si c'est une URL YouTube
    if (field === 'youtube_url' && value) {
      const videoId = extractYouTubeId(value);
      if (videoId) {
        setYoutubePreview(videoId);
      } else {
        setYoutubePreview(null);
      }
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      youtube_url: '',
      file_url: '',
      external_url: ''
    }));
    setYoutubePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Partager une ressource
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de ressource */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Type de ressource *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {resourceTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <type.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Titre et matière */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ex: Cours sur les équations du second degré"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matière *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choisir une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* URL selon le type */}
            {formData.type === 'youtube' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL YouTube *
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {youtubePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Aperçu :</p>
                    <img
                      src={`https://img.youtube.com/vi/${youtubePreview}/hqdefault.jpg`}
                      alt="Aperçu YouTube"
                      className="w-48 h-36 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {formData.type === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL du document *
                </label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => handleChange('file_url', e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {formData.type === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lien externe *
                </label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => handleChange('external_url', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez brièvement cette ressource et ce qu'elle apporte..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Conseils */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 Conseils pour partager une ressource
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Vérifiez que le lien fonctionne</li>
                <li>• Donnez un titre descriptif</li>
                <li>• Expliquez l'utilité de la ressource</li>
                <li>• Respectez les droits d'auteur</li>
              </ul>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.type || !formData.subject}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Partage...' : 'Partager la ressource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewResourceModal;
