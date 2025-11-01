import React, { useState } from 'react';
import { useLearningAnswers } from '../../hooks/useLearning';

interface AnswerFormProps {
  questionId: string;
  onPosted?: () => void;
}

const AnswerForm: React.FC<AnswerFormProps> = ({ questionId, onPosted }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { createAnswer } = useLearningAnswers(questionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await createAnswer(content.trim());
      setContent('');
      onPosted?.();
    } catch (_) {
      // handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez votre réponse..."
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        required
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || content.trim().length < 2}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publication...' : 'Publier la réponse'}
        </button>
      </div>
    </form>
  );
};

export default AnswerForm;
