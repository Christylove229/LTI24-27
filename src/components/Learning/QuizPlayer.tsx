import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { Quiz, QuizQuestion, QuizAnswer } from '../../hooks/useLearning';

interface QuizPlayerProps {
  quiz: Quiz & { quiz_questions: QuizQuestion[] };
  onClose: () => void;
  onSubmit: (answers: QuizAnswer[], timeTaken?: number) => Promise<void>;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onClose, onSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.time_limit ? quiz.time_limit * 60 : null
  );
  const [showResults, setShowResults] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  // Timer pour la limite de temps
  useEffect(() => {
    if (timeLeft === null || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit(true); // Auto-submit quand le temps est écoulé
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quiz.quiz_questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.quiz_questions.length) * 100;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const goToNext = () => {
    if (currentQuestionIndex < quiz.quiz_questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const canProceed = () => {
    const currentAnswer = answers[currentQuestion.id];
    if (!currentAnswer) return false;

    if (currentQuestion.question_type === 'multiple_choice') {
      return currentQuestion.options?.includes(currentAnswer) || false;
    }
    return true;
  };

  const calculateScore = (userAnswers: Record<string, string>): QuizAnswer[] => {
    return quiz.quiz_questions.map(question => {
      const userAnswer = userAnswers[question.id] || '';
      let isCorrect = false;

      if (question.question_type === 'short_answer') {
        // Pour les réponses courtes, comparer en ignorant la casse et les espaces
        isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      } else {
        isCorrect = userAnswer === question.correct_answer;
      }

      return {
        question_id: question.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        points_earned: isCorrect ? question.points : 0
      };
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Êtes-vous sûr de vouloir soumettre votre quiz ?')) return;

    setLoading(true);
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const calculatedAnswers = calculateScore(answers);

      await onSubmit(calculatedAnswers, timeTaken);

      setSubmittedAnswers(calculatedAnswers);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return 'Excellent travail ! 🎉';
    if (percentage >= 60) return 'Bon travail ! 👍';
    return 'Continuez à vous entraîner ! 💪';
  };

  if (showResults) {
    const totalScore = submittedAnswers.reduce((sum, answer) => sum + answer.points_earned, 0);
    const maxScore = quiz.quiz_questions.reduce((sum, question) => sum + question.points, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <TrophyIcon className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Quiz terminé !</h2>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>
              {percentage}%
            </div>
            <p className="text-lg">{getScoreMessage(percentage)}</p>
          </div>

          {/* Résultats détaillés */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Points obtenus</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {maxScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Points maximum</div>
                </div>
              </div>
            </div>

            {/* Détail des questions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Détail des réponses
              </h3>
              {quiz.quiz_questions.map((question, index) => {
                const userAnswer = submittedAnswers.find(a => a.question_id === question.id);
                const isCorrect = userAnswer?.is_correct || false;

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? (
                          <CheckCircleIcon className="h-4 w-4 text-white" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Question {index + 1}: {question.question_text}
                        </h4>

                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Votre réponse:
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded text-sm ${
                              isCorrect
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                            }`}>
                              {userAnswer?.user_answer || 'Non répondu'}
                            </span>
                          </div>

                          {!isCorrect && (
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Réponse correcte:
                              </span>
                              <span className="ml-2 px-2 py-1 rounded text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                {question.correct_answer}
                              </span>
                            </div>
                          )}

                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Explication:
                              </span>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {question.explanation}
                              </p>
                            </div>
                          )}

                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Points: {userAnswer?.points_earned || 0} / {question.points}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bouton fermer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
            >
              Retour aux quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header avec timer et progression */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold">{quiz.title}</h2>
                <p className="text-purple-100 text-sm">
                  Question {currentQuestionIndex + 1} sur {quiz.quiz_questions.length}
                </p>
              </div>
            </div>

            {timeLeft !== null && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-500' : 'bg-white/20'
              }`}>
                <ClockIcon className="h-5 w-5" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Contenu de la question */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {currentQuestion.question_text}
                </h3>

                {/* Points */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <TrophyIcon className="h-4 w-4 mr-1" />
                  <span>{currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Réponses */}
              <div className="space-y-4">
                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.filter(option => option.trim()).map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[currentQuestion.id] === option
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={() => handleAnswerChange(currentQuestion.id, option)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-3 text-gray-900 dark:text-white">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['Vrai', 'Faux'].map((option) => (
                      <label
                        key={option}
                        className={`flex items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[currentQuestion.id] === option.toLowerCase()
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option.toLowerCase()}
                          checked={answers[currentQuestion.id] === option.toLowerCase()}
                          onChange={() => handleAnswerChange(currentQuestion.id, option.toLowerCase())}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-3 text-gray-900 dark:text-white font-semibold">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'short_answer' && (
                  <div>
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Entrez votre réponse ici..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center space-x-2">
              {/* Indicateurs de questions */}
              {quiz.quiz_questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-purple-600'
                      : answers[quiz.quiz_questions[index].id]
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {currentQuestionIndex === quiz.quiz_questions.length - 1 ? (
              <button
                onClick={() => handleSubmit()}
                disabled={!canProceed() || loading}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Soumission...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Terminer le quiz</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Suivant</span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizPlayer;
