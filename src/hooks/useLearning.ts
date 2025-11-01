import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface LearningQuestion {
  id: string;
  title: string;
  content: string;
  subject: string;
  author_id: string;
  author_name: string;
  likes_count: number;
  answers_count: number;
  is_resolved: boolean;
  is_liked: boolean;
  created_at: string;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'youtube' | 'link' | 'document';
  subject: string;
  author_id: string;
  author_name: string;
  file_url?: string;
  youtube_url?: string;
  youtube_video_id?: string;
  external_url?: string;
  downloads_count: number;
  rating: number;
  ratings_count: number;
  user_rating?: number;
  created_at: string;
}

export interface LearningAnswer {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  content: string;
  is_accepted: boolean;
  likes_count: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  author_id: string;
  author_name: string;
  questions_count: number;
  total_attempts: number;
  average_score: number;
  time_limit?: number; // en minutes
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[]; // pour multiple_choice
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  user_name: string;
  score: number;
  max_score: number;
  answers: QuizAnswer[];
  started_at: string;
  completed_at?: string;
  time_taken?: number; // en secondes
}

export interface QuizAnswer {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
}

export interface QuizScore {
  user_id: string;
  user_name: string;
  total_score: number;
  average_score: number;
  attempts_count: number;
  best_score: number;
  last_attempt: string;
}

export const useLearningQuestions = () => {
  const [questions, setQuestions] = useState<LearningQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      const { data, error } = await supabase
        .from('learning_questions')
        .select(`
          *,
          profiles!learning_questions_author_id_fkey(full_name),
          learning_question_likes!left(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const questionsWithLikes = data?.map(question => ({
        ...question,
        author_name: question.profiles?.full_name || 'Utilisateur',
        is_liked: question.learning_question_likes?.some((like: any) => like.user_id === userId) || false
      })) || [];

      setQuestions(questionsWithLikes);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Erreur lors du chargement des questions');
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async (questionData: {
    title: string;
    content: string;
    subject: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('learning_questions')
        .insert({
          ...questionData,
          author_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Question publiée avec succès !');
      // Optimistic: prepend while realtime will also refresh
      setQuestions(prev => [
        {
          ...(data as any),
          author_name: 'Vous',
          is_liked: false,
        } as any,
        ...prev,
      ]);
      fetchQuestions(); // Recharger les questions
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Erreur lors de la publication de la question');
      throw error;
    }
  };

  const toggleLike = async (questionId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      if (question.is_liked) {
        // Unlike
        const { error } = await supabase
          .from('learning_question_likes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('learning_question_likes')
          .insert({
            question_id: questionId,
            user_id: user.user.id
          });

        if (error) throw error;
      }

      // Mettre à jour l'état local
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              is_liked: !q.is_liked,
              likes_count: q.is_liked ? q.likes_count - 1 : q.likes_count + 1
            }
          : q
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur lors du like');
    }
  };

  useEffect(() => {
    fetchQuestions();

    // Realtime: refresh on new/updated/deleted questions
    const channel = supabase
      .channel('learning_questions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_questions' }, () => {
        // Simple approach: refetch to preserve computed fields (author_name, is_liked)
        fetchQuestions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    questions,
    loading,
    fetchQuestions,
    createQuestion,
    toggleLike
  };
};

export const useLearningResources = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      const { data, error } = await supabase
        .from('learning_resources')
        .select(`
          *,
          profiles!learning_resources_author_id_fkey(full_name),
          learning_resource_ratings!left(rating, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const resourcesWithRatings = data?.map(resource => ({
        ...resource,
        author_name: resource.profiles?.full_name || 'Utilisateur',
        user_rating: resource.learning_resource_ratings?.find((rating: any) => rating.user_id === userId)?.rating
      })) || [];

      setResources(resourcesWithRatings);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Erreur lors du chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (resourceData: {
    title: string;
    description: string;
    type: string;
    subject: string;
    youtube_url?: string;
    file_url?: string;
    external_url?: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('learning_resources')
        .insert({
          ...resourceData,
          author_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Ressource partagée avec succès !');
      fetchResources(); // Recharger les ressources
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Erreur lors du partage de la ressource');
      throw error;
    }
  };

  const rateResource = async (resourceId: string, rating: number) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('learning_resource_ratings')
        .upsert({
          resource_id: resourceId,
          user_id: user.user.id,
          rating
        });

      if (error) throw error;

      toast.success('Note enregistrée !');
      fetchResources(); // Recharger pour mettre à jour les moyennes
    } catch (error) {
      console.error('Error rating resource:', error);
      toast.error('Erreur lors de la notation');
    }
  };

  const incrementDownload = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('learning_resources')
        .update({ downloads_count: supabase.sql`downloads_count + 1` })
        .eq('id', resourceId);

      if (error) throw error;

      // Mettre à jour l'état local
      setResources(prev => prev.map(r => 
        r.id === resourceId 
          ? { ...r, downloads_count: r.downloads_count + 1 }
          : r
      ));
    } catch (error) {
      console.error('Error incrementing download:', error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return {
    resources,
    loading,
    fetchResources,
    createResource,
    rateResource,
    incrementDownload
  };
};

export const useLearningAnswers = (questionId: string) => {
  const [answers, setAnswers] = useState<LearningAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnswers = async () => {
    if (!questionId) return;

    try {
      const { data, error } = await supabase
        .from('learning_answers')
        .select(`
          *,
          profiles!learning_answers_author_id_fkey(full_name)
        `)
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const answersWithAuthors = data?.map(answer => ({
        ...answer,
        author_name: answer.profiles?.full_name || 'Utilisateur'
      })) || [];

      setAnswers(answersWithAuthors);
    } catch (error) {
      console.error('Error fetching answers:', error);
      toast.error('Erreur lors du chargement des réponses');
    } finally {
      setLoading(false);
    }
  };

  const createAnswer = async (content: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('learning_answers')
        .insert({
          question_id: questionId,
          author_id: user.user.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Réponse publiée !');
      fetchAnswers(); // Recharger les réponses
      return data;
    } catch (error) {
      console.error('Error creating answer:', error);
      toast.error('Erreur lors de la publication de la réponse');
      throw error;
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [questionId]);

  return {
    answers,
    loading,
    fetchAnswers,
    createAnswer
  };
};

// Hook pour gérer les quiz
export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Récupérer tous les quiz
  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          profiles!quizzes_author_id_fkey(full_name),
          quiz_questions(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const quizzesWithStats = data?.map(quiz => ({
        ...quiz,
        author_name: quiz.profiles?.full_name || 'Utilisateur',
        questions_count: quiz.quiz_questions?.[0]?.count || 0,
        // TODO: Calculer total_attempts et average_score depuis quiz_attempts
        total_attempts: 0,
        average_score: 0
      })) || [];

      setQuizzes(quizzesWithStats);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Erreur lors du chargement des quiz');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau quiz
  const createQuiz = async (quizData: {
    title: string;
    description: string;
    subject: string;
    time_limit?: number;
    questions: Omit<QuizQuestion, 'id' | 'quiz_id' | 'order_index'>[];
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      // Créer le quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          subject: quizData.subject,
          author_id: user.user.id,
          time_limit: quizData.time_limit,
          is_active: true
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Créer les questions
      if (quizData.questions.length > 0) {
        const questionsToInsert = quizData.questions.map((question, index) => ({
          quiz_id: quiz.id,
          question_text: question.question_text,
          question_type: question.question_type,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          points: question.points,
          order_index: index
        }));

        const { error: questionsError } = await supabase
          .from('quiz_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      toast.success('Quiz créé avec succès !');
      fetchQuizzes(); // Recharger la liste
      return quiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Erreur lors de la création du quiz');
      throw error;
    }
  };

  // Récupérer un quiz avec ses questions
  const getQuizWithQuestions = async (quizId: string) => {
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          profiles!quizzes_author_id_fkey(full_name),
          quiz_questions(*)
        `)
        .eq('id', quizId)
        .eq('is_active', true)
        .single();

      if (quizError) throw quizError;

      return {
        ...quiz,
        author_name: quiz.profiles?.full_name || 'Utilisateur',
        quiz_questions: quiz.quiz_questions?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Erreur lors du chargement du quiz');
      throw error;
    }
  };

  // Commencer une tentative de quiz
  const startQuizAttempt = async (quizId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.user.id,
          started_at: new Date().toISOString(),
          answers: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      toast.error('Erreur lors du démarrage du quiz');
      throw error;
    }
  };

  // Soumettre les réponses d'un quiz
  const submitQuizAttempt = async (attemptId: string, answers: QuizAnswer[], timeTaken?: number) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      // Calculer le score
      const totalPoints = answers.reduce((sum, answer) => sum + answer.points_earned, 0);
      const maxPoints = answers.length * 10; // Supposons 10 points max par question

      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({
          score: totalPoints,
          max_score: maxPoints,
          answers: answers,
          completed_at: new Date().toISOString(),
          time_taken: timeTaken
        })
        .eq('id', attemptId)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Quiz terminé ! Score: ${totalPoints}/${maxPoints}`);
      return data;
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      toast.error('Erreur lors de la soumission du quiz');
      throw error;
    }
  };

  // Récupérer les scores d'un utilisateur
  const getUserQuizScores = async (userId?: string) => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('Utilisateur non trouvé');

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes(title, subject),
          profiles!quiz_attempts_user_id_fkey(full_name)
        `)
        .eq('user_id', targetUserId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return data?.map(attempt => ({
        ...attempt,
        user_name: attempt.profiles?.full_name || 'Utilisateur',
        quiz_title: attempt.quizzes?.title || 'Quiz inconnu',
        quiz_subject: attempt.quizzes?.subject || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching user scores:', error);
      toast.error('Erreur lors du chargement des scores');
      throw error;
    }
  };

  // Supprimer un quiz (seulement l'auteur)
  const deleteQuiz = async (quizId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', quizId)
        .eq('author_id', user.user.id);

      if (error) throw error;

      toast.success('Quiz supprimé avec succès');
      fetchQuizzes(); // Recharger la liste
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Erreur lors de la suppression du quiz');
      throw error;
    }
  };

  return {
    quizzes,
    loading,
    fetchQuizzes,
    createQuiz,
    getQuizWithQuestions,
    startQuizAttempt,
    submitQuizAttempt,
    getUserQuizScores,
    deleteQuiz
  };
};

// Utilitaire pour extraire l'ID YouTube d'une URL
export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

// Utilitaire pour générer l'URL d'embed YouTube
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// Utilitaire pour générer l'URL de thumbnail YouTube
export const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};
