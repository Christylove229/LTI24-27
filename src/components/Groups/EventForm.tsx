// src/components/Groups/EventForm.tsx
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isOnline: boolean;
    meetingUrl?: string;
  }) => Promise<void>;
  initialData?: {
    title: string;
    description: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isOnline: boolean;
    meetingUrl?: string;
  };
}

const EventForm = ({ isOpen, onClose, onSubmit, initialData }: EventFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    location: initialData?.location || '',
    isOnline: initialData?.isOnline || false,
    meetingUrl: initialData?.meetingUrl || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        location: formData.location || undefined,
        isOnline: formData.isOnline,
        meetingUrl: formData.isOnline ? formData.meetingUrl : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={onClose}
          open={isOpen}
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              aria-hidden="true"
            />

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  {initialData ? 'Modifier l\'événement' : 'Nouvel événement'}
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
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Titre *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Date et heure de début *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        id="startTime"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Date et heure de fin (optionnel)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        min={formData.startTime}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="isOnline"
                    name="isOnline"
                    type="checkbox"
                    checked={formData.isOnline}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isOnline"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Événement en ligne
                  </label>
                </div>

                {formData.isOnline ? (
                  <div>
                    <label
                      htmlFor="meetingUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Lien de la réunion *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="meetingUrl"
                        name="meetingUrl"
                        required={formData.isOnline}
                        value={formData.meetingUrl}
                        onChange={handleChange}
                        placeholder="https://meet.google.com/..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Lieu (optionnel)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Adresse ou lieu de l'événement"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}

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
                    disabled={!formData.title || !formData.startTime || isSubmitting}
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default EventForm;