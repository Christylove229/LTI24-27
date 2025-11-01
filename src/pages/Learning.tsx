import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  QuestionMarkCircleIcon, 
  BookOpenIcon,
  TrophyIcon,
  PlusIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useLearningQuestions, useLearningResources, useQuizzes } from '../hooks/useLearning';
import AnswerForm from '../components/Learning/AnswerForm';
import NewQuestionModal from '../components/Learning/NewQuestionModal';
import NewResourceModal from '../components/Learning/NewResourceModal';
import YouTubePlayer from '../components/Learning/YouTubePlayer';
import QuizCard from '../components/Learning/QuizCard';
import QuizCreator from '../components/Learning/QuizCreator';
import QuizPlayer from '../components/Learning/QuizPlayer';

const Learning: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'resources' | 'quiz'>('questions');
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [showNewResource, setShowNewResource] = useState(false);
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  
  // Hooks pour les données Supabase
  const { questions, loading: questionsLoading, toggleLike, fetchQuestions } = useLearningQuestions();
  const { resources, loading: resourcesLoading, rateResource, incrementDownload } = useLearningResources();
  const { quizzes, loading: quizzesLoading, fetchQuizzes, createQuiz, getQuizWithQuestions, submitQuizAttempt, deleteQuiz } = useQuizzes();

  const handleDownload = async (resourceId: string, url: string) => {
    await incrementDownload(resourceId);
    window.open(url, '_blank');
  };

  const handleRate = async (resourceId: string, rating: number) => {
    await rateResource(resourceId, rating);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'youtube':
        return '🎥';
      case 'video':
        return '🎥';
      case 'link':
        return '🔗';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Espace d'Apprentissage
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Entraidez-vous, partagez vos connaissances et progressez ensemble
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {questions?.length || 0}
              </div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {resources?.length || 0}
              </div>
              <div className="text-xs text-gray-500">Ressources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {quizzes?.length || 0}
              </div>
              <div className="text-xs text-gray-500">Quiz</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <QuestionMarkCircleIcon className="h-5 w-5" />
                <span>Questions d'entraide</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpenIcon className="h-5 w-5" />
                <span>Ressources partagées</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quiz'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrophyIcon className="h-5 w-5" />
                <span>Quiz collaboratifs</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Questions récentes
                </h2>
                <button
                  onClick={() => setShowNewQuestion(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Poser une question</span>
                </button>
              </div>

              {/* Nouvelle question form - Supprimé car remplacé par le modal */}

              {/* Questions list */}
              {questionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions?.map((question) => (
                    <div key={question.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-medium rounded-full">
                              {question.subject}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              par {question.author_name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(question.created_at)}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {question.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {question.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleLike(question.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            {question.is_liked ? (
                              <HeartSolidIcon className="h-5 w-5 text-red-500" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                            <span className="text-sm">{question.likes_count}</span>
                          </button>
                          <div className="flex items-center space-x-1 text-gray-500">
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            <span className="text-sm">{question.answers_count} réponses</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setReplyFor(replyFor === question.id ? null : question.id)}
                          className="px-4 py-2 text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                        >
                          Répondre
                        </button>
                      </div>
                      {replyFor === question.id && (
                        <AnswerForm 
                          questionId={question.id}
                          onPosted={async () => {
                            setReplyFor(null);
                            await fetchQuestions();
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {questions?.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Aucune question pour le moment.</p>
                      <button
                        onClick={() => setShowNewQuestion(true)}
                        className="mt-2 text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Soyez le premier à poser une question !
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ressources partagées
                </h2>
                <button 
                  onClick={() => setShowNewResource(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Partager une ressource</span>
                </button>
              </div>

              {resourcesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources?.map((resource) => (
                    <div key={resource.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {/* Contenu vidéo YouTube */}
                      {resource.type === 'youtube' && resource.youtube_video_id && (
                        <div className="aspect-video">
                          <YouTubePlayer
                            videoId={resource.youtube_video_id}
                            title={resource.title}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      
                      {/* Contenu pour autres types */}
                      {resource.type !== 'youtube' && (
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-2xl">{getTypeIcon(resource.type)}</div>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                              {resource.subject}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        {/* Header pour YouTube */}
                        {resource.type === 'youtube' && (
                          <div className="flex items-start justify-between mb-3">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                              {resource.subject}
                            </span>
                          </div>
                        )}

                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {resource.title}
                        </h3>
                        {resource.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {resource.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Par {resource.author_name}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                              {resource.downloads_count}
                            </span>
                            <div className="flex items-center space-x-1">
                              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                              <span>{resource.rating?.toFixed(1) || '0.0'}</span>
                              <span>({resource.ratings_count})</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Rating stars */}
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRate(resource.id, star)}
                                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                                >
                                  <StarIcon 
                                    className={`h-4 w-4 ${
                                      (resource.user_rating || 0) >= star 
                                        ? 'text-yellow-400 fill-current' 
                                        : ''
                                    }`} 
                                  />
                                </button>
                              ))}
                            </div>
                            
                            <button 
                              onClick={() => {
                                const url = resource.youtube_url || resource.file_url || resource.external_url;
                                if (url) handleDownload(resource.id, url);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              {resource.type === 'youtube' ? 'Voir' : 'Télécharger'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {resources?.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Aucune ressource pour le moment.</p>
                      <button
                        onClick={() => setShowNewResource(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Partagez la première ressource !
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quiz collaboratifs
                </h2>
                <button
                  onClick={() => setShowNewQuiz(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Créer un quiz</span>
                </button>
              </div>

              {/* Statistiques des quiz */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white text-center">
                  <div className="text-2xl font-bold">{quizzes?.length || 0}</div>
                  <div className="text-sm opacity-90">Quiz disponibles</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-lg text-white text-center">
                  <div className="text-2xl font-bold">
                    {quizzes?.reduce((sum, quiz) => sum + quiz.total_attempts, 0) || 0}
                  </div>
                  <div className="text-sm opacity-90">Tentatives totales</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-lg text-white text-center">
                  <div className="text-2xl font-bold">
                    {quizzes?.length > 0
                      ? Math.round(quizzes.reduce((sum, quiz) => sum + quiz.average_score, 0) / quizzes.length)
                      : 0}%
                  </div>
                  <div className="text-sm opacity-90">Score moyen</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-lg text-white text-center">
                  <div className="text-2xl font-bold">
                    {quizzes?.reduce((sum, quiz) => sum + quiz.questions_count, 0) || 0}
                  </div>
                  <div className="text-sm opacity-90">Questions totales</div>
                </div>
              </div>

              {/* Liste des quiz */}
              {quizzesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes?.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onStart={async (quizId) => {
                        try {
                          const quizData = await getQuizWithQuestions(quizId);
                          setSelectedQuiz(quizData);
                        } catch (error) {
                          console.error('Erreur lors du chargement du quiz:', error);
                        }
                      }}
                      onDelete={async (quizId) => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
                          try {
                            await deleteQuiz(quizId);
                          } catch (error) {
                            console.error('Erreur lors de la suppression:', error);
                          }
                        }
                      }}
                      canDelete={true} // TODO: Vérifier si l'utilisateur est l'auteur
                    />
                  ))}
                  {quizzes?.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrophyIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        Aucun quiz disponible
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Soyez le premier à créer un quiz pour aider vos camarades !
                      </p>
                      <button
                        onClick={() => setShowNewQuiz(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                      >
                        Créer le premier quiz
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewQuestionModal 
        isOpen={showNewQuestion} 
        onClose={() => setShowNewQuestion(false)} 
      />
      <NewResourceModal 
        isOpen={showNewResource} 
        onClose={() => setShowNewResource(false)} 
      />
      <QuizCreator
        isOpen={showNewQuiz}
        onClose={() => setShowNewQuiz(false)}
        onCreate={async (quizData) => {
          await createQuiz(quizData);
          fetchQuizzes(); // Recharger la liste des quiz
        }}
      />
      {selectedQuiz && (
        <QuizPlayer
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
          onSubmit={async (answers, timeTaken) => {
            await submitQuizAttempt(selectedQuiz.id, answers, timeTaken);
            setSelectedQuiz(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default Learning;