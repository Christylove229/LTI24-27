import React from 'react';
import { ReactionCounts } from '../../utils/reactionUtils';

interface ReactionDisplayProps {
  counts: ReactionCounts;
  totalCount: number;
}

export const ReactionDisplay: React.FC<ReactionDisplayProps> = ({ counts, totalCount }) => {
  if (totalCount === 0) return null;

  const getEmojiForType = (type: keyof ReactionCounts): string => {
    const emojiMap: Record<keyof ReactionCounts, string> = {
      like: '👍',
      love: '🥰',
      laugh: '🤣',
      annoyed: '😒',
      clap: '👏',
      cry: '😭',
      angry: '😡'
    };
    return emojiMap[type];
  };

  const reactionTypes = Object.keys(counts) as Array<keyof ReactionCounts>;
  const activeReactions = reactionTypes.filter(type => counts[type] > 0);

  return (
    <div className="flex items-center space-x-1 mt-2">
      <div className="flex -space-x-1">
        {activeReactions.slice(0, 3).map(type => (
          <span
            key={String(type)}
            className="inline-flex items-center justify-center w-5 h-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs"
            title={`${counts[type]} ${String(type)}`}
          >
            {getEmojiForType(type)}
          </span>
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
        {totalCount}
      </span>
    </div>
  );
};
