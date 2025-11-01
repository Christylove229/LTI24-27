import React from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, TrophyIcon, ClockIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import { Quiz } from '../../hooks/useLearning';

interface QuizCardProps {
  quiz: Quiz;
  onStart: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  canDelete?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart, onDelete, canDelete = false }) => {
  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return 'Pas de limite';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const getDifficultyColor = (questionsCount: number) => {
    if (questionsCount <= 5) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (questionsCount <= 10) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const getDifficultyLabel = (questionsCount: number) => {
    if (questionsCount <= 5) return 'Facile';
    if (questionsCount <= 10) return 'Moyen';
    return 'Difficile';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1 line-clamp-2">{quiz.title}</h3>
            <p className="text-purple-100 text-sm line-clamp-2">{quiz.description}</p>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete?.(quiz.id)}
              className="ml-2 p-1 text-purple-200 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Supprimer le quiz"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4">
        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {quiz.author_name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatTimeLimit(quiz.time_limit)}
            </span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {quiz.questions_count}
            </div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {quiz.total_attempts}
            </div>
            <div className="text-xs text-gray-500">Tentatives</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {quiz.average_score.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Moyenne</div>
          </div>
        </div>

        {/* Badge de difficulté */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.questions_count)}`}>
            {getDifficultyLabel(quiz.questions_count)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {quiz.subject}
          </span>
        </div>

        {/* Bouton d'action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStart(quiz.id)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <PlayIcon className="h-5 w-5" />
          <span>Commencer le quiz</span>
        </motion.button>

        {/* Date de création */}
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Créé le {new Date(quiz.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Indicateur de succès si score élevé */}
      {quiz.average_score >= 80 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-white text-sm font-medium">
            <TrophySolidIcon className="h-4 w-4" />
            <span>Quiz populaire !</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default QuizCard;
