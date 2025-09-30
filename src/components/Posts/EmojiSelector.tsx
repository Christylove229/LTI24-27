import React from 'react';

interface EmojiSelectorProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({ onSelect, onClose }) => {
  const emojis = ['😒', '🤣', '🥰', '👍', '👏', '😭', '😡'];

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
      <div className="flex space-x-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={`Réagir avec ${emoji}`}
          >
            <span className="text-lg">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
