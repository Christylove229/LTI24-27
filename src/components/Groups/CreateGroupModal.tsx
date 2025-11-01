// src/components/Groups/CreateGroupModal.tsx
import { useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupData: {
    name: string;
    description: string;
    isPublic: boolean;
    bannerFile?: File;
  }) => Promise<void>;
}

const CreateGroupModal = ({ isOpen, onClose, onCreate }: CreateGroupModalProps) => {

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La taille maximale du fichier est de 5MB');
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    setBannerFile(file);
    
    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        bannerFile: bannerFile || undefined,
      });
      resetForm();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsPublic(true);
    setBannerPreview(null);
    setBannerFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Créer un groupe
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                {/* Aperçu de la bannière */}
                <div
                  className={`relative h-32 rounded-lg border-2 border-dashed ${
                    bannerPreview
                      ? 'border-transparent'
                      : 'border-gray-300 dark:border-gray-600'
                  } flex items-center justify-center cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Aperçu de la bannière"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <span className="mt-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        Cliquez pour ajouter une bannière
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF jusqu'à 5MB
                      </span>
                    </div>
                  )}
                </div>

                {/* Nom du groupe */}
                <div>
                  <label
                    htmlFor="group-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Nom du groupe *
                  </label>
                  <input
                    type="text"
                    id="group-name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="group-description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="group-description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                  />
                </div>

                {/* Visibilité */}
                <div className="flex items-center">
                  <input
                    id="group-visibility"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label
                    htmlFor="group-visibility"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Groupe public
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPublic
                    ? 'Tout le monde peut voir le groupe et ses membres, mais seuls les membres peuvent publier.'
                    : 'Seuls les membres peuvent voir le groupe et ses publications.'}
                </p>

                {/* Boutons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    disabled={!name.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Création...' : 'Créer le groupe'}
                  </button>
                </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CreateGroupModal;