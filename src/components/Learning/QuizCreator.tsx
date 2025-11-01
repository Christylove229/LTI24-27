import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { QuizQuestion } from '../../hooks/useLearning';

interface QuizCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (quizData: {
    title: string;
    description: string;
    subject: string;
    time_limit?: number;
    questions: Omit<QuizQuestion, 'id' | 'quiz_id' | 'order_index'>[];
  }) => Promise<void>;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ isOpen, onClose, onCreate }) => {
  const [step, setStep] = useState<'info' | 'questions'>('info');
  const [loading, setLoading] = useState(false);

  // Informations du quiz
  const [quizInfo, setQuizInfo] = useState({
    title: '',
    description: '',
    subject: '',
    time_limit: ''
  });

  // Questions du quiz
  const [questions, setQuestions] = useState<Array<{
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options: string[];
    correct_answer: string;
    explanation: string;
    points: number;
  }>>([]);

  // Nouvelle question en cours d'édition
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 10
  });

  const resetForm = () => {
    setStep('info');
    setQuizInfo({ title: '', description: '', subject: '', time_limit: '' });
    setQuestions([]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 10
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) return;

    // Validation selon le type de question
    if (currentQuestion.question_type === 'multiple_choice') {
      if (currentQuestion.options.filter(opt => opt.trim()).length < 2) return;
      if (!currentQuestion.correct_answer.trim()) return;
    } else if (currentQuestion.question_type === 'true_false') {
      if (!['true', 'false'].includes(currentQuestion.correct_answer.toLowerCase())) return;
    } else if (currentQuestion.question_type === 'short_answer') {
      if (!currentQuestion.correct_answer.trim()) return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 10
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!quizInfo.title.trim() || !quizInfo.subject.trim() || questions.length === 0) return;

    setLoading(true);
    try {
      await onCreate({
        title: quizInfo.title.trim(),
        description: quizInfo.description.trim(),
        subject: quizInfo.subject.trim(),
        time_limit: quizInfo.time_limit ? parseInt(quizInfo.time_limit) : undefined,
        questions: questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'multiple_choice' ? q.options.filter(opt => opt.trim()) : undefined,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          points: q.points
        }))
      });
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const subjects = [
    'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Informatique',
    'Français', 'Anglais', 'Histoire', 'Géographie', 'Philosophie',
    'Économie', 'Droit', 'Médecine', 'Architecture', 'Autre'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {step === 'info' ? 'Créer un quiz' : 'Ajouter des questions'}
              </h2>
              <p className="text-purple-100 mt-1">
                {step === 'info'
                  ? 'Configurez les informations générales de votre quiz'
                  : `${questions.length} question${questions.length > 1 ? 's' : ''} ajoutée${questions.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Indicateur de progression */}
          <div className="flex items-center space-x-4 mt-4">
            <div className={`flex items-center space-x-2 ${step === 'info' ? 'text-white' : 'text-purple-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'info' ? 'bg-white text-purple-600' : 'bg-purple-500 text-white'
              }`}>
                1
              </div>
              <span className="font-medium">Informations</span>
            </div>
            <div className="w-8 h-0.5 bg-purple-400"></div>
            <div className={`flex items-center space-x-2 ${step === 'questions' ? 'text-white' : 'text-purple-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'questions' ? 'bg-white text-purple-600' : 'bg-purple-500 text-white'
              }`}>
                2
              </div>
              <span className="font-medium">Questions</span>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'info' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du quiz *
                </label>
                <input
                  type="text"
                  value={quizInfo.title}
                  onChange={(e) => setQuizInfo({ ...quizInfo, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Algèbre linéaire - Chapitre 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={quizInfo.description}
                  onChange={(e) => setQuizInfo({ ...quizInfo, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Décrivez brièvement le contenu du quiz..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Matière *
                  </label>
                  <select
                    value={quizInfo.subject}
                    onChange={(e) => setQuizInfo({ ...quizInfo, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sélectionnez une matière</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Limite de temps (minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quizInfo.time_limit}
                      onChange={(e) => setQuizInfo({ ...quizInfo, time_limit: e.target.value })}
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="15"
                      min="1"
                      max="180"
                    />
                    <ClockIcon className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Laisser vide pour pas de limite</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep('questions')}
                  disabled={!quizInfo.title.trim() || !quizInfo.subject.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Suivant: Ajouter des questions
                </button>
              </div>
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Liste des questions ajoutées */}
              <AnimatePresence>
                {questions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Questions ajoutées ({questions.length})
                    </h3>
                    {questions.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {question.question_text}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {question.question_type === 'multiple_choice' && 'Choix multiples'}
                            {question.question_type === 'true_false' && 'Vrai/Faux'}
                            {question.question_type === 'short_answer' && 'Réponse courte'}
                            {' • '}{question.points} points
                          </p>
                        </div>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulaire d'ajout de question */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Nouvelle question
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={currentQuestion.question_text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Entrez votre question ici..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type de question *
                      </label>
                      <select
                        value={currentQuestion.question_type}
                        onChange={(e) => setCurrentQuestion({
                          ...currentQuestion,
                          question_type: e.target.value as any,
                          correct_answer: '',
                          options: e.target.value === 'true_false' ? ['Vrai', 'Faux'] : ['', '', '', '']
                        })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      >
                        <option value="multiple_choice">Choix multiples</option>
                        <option value="true_false">Vrai/Faux</option>
                        <option value="short_answer">Réponse courte</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 10 })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Options pour choix multiples */}
                  {currentQuestion.question_type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Options de réponse *
                      </label>
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={currentQuestion.correct_answer === option}
                              onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: option })}
                              className="text-purple-600 focus:ring-purple-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateQuestionOption(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Cochez la bonne réponse</p>
                    </div>
                  )}

                  {/* Options pour vrai/faux */}
                  {currentQuestion.question_type === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bonne réponse *
                      </label>
                      <div className="flex space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tf_answer"
                            value="true"
                            checked={currentQuestion.correct_answer.toLowerCase() === 'true'}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2">Vrai</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tf_answer"
                            value="false"
                            checked={currentQuestion.correct_answer.toLowerCase() === 'false'}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2">Faux</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Réponse pour réponse courte */}
                  {currentQuestion.question_type === 'short_answer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Réponse attendue *
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.correct_answer}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        placeholder="Entrez la réponse correcte"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Explication (optionnel)
                    </label>
                    <textarea
                      value={currentQuestion.explanation}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Expliquez pourquoi cette réponse est correcte..."
                    />
                  </div>

                  <button
                    onClick={addQuestion}
                    disabled={!currentQuestion.question_text.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Ajouter cette question</span>
                  </button>
                </div>
              </div>

              {/* Boutons de navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep('info')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={questions.length === 0 || loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Créer le quiz ({questions.length} questions)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuizCreator;
