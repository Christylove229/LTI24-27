import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLearningQuestions } from '../../hooks/useLearning';

interface NewQuestionModalProps {
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

const NewQuestionModal: React.FC<NewQuestionModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: ''
  });
  const [loading, setLoading] = useState(false);
  const { createQuestion } = useLearningQuestions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.subject) {
      return;
    }

    setLoading(true);
    try {
      await createQuestion(formData);
      setFormData({ title: '', content: '', subject: '' });
      onClose();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Poser une nouvelle question
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre de votre question *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Comment résoudre une équation du second degré ?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Matière */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Matière *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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

            {/* Contenu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description détaillée *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Décrivez votre question en détail. Plus vous donnez d'informations, plus il sera facile de vous aider..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Minimum 20 caractères
              </p>
            </div>

            {/* Conseils */}
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-teal-800 dark:text-teal-200 mb-2">
                💡 Conseils pour une bonne question
              </h4>
              <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-1">
                <li>• Soyez précis dans votre titre</li>
                <li>• Expliquez ce que vous avez déjà essayé</li>
                <li>• Donnez du contexte (niveau, cours...)</li>
                <li>• Restez respectueux et poli</li>
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
                disabled={loading || !formData.title.trim() || !formData.content.trim() || !formData.subject || formData.content.length < 20}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Publication...' : 'Publier la question'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewQuestionModal;
