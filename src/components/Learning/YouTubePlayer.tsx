import React, { useState } from 'react';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  thumbnail?: string;
  className?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  title, 
  thumbnail,
  className = "" 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    setShowFullscreen(true);
    setIsPlaying(true);
  };

  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
    setIsPlaying(false);
  };

  return (
    <>
      {/* Player normal */}
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        {!isPlaying ? (
          // Thumbnail avec bouton play
          <div className="relative group cursor-pointer" onClick={handlePlay}>
            <img
              src={thumbnail || defaultThumbnail}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <PlayIcon className="h-8 w-8 text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <h3 className="text-white font-medium text-sm line-clamp-2">{title}</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen();
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg p-2 transition-colors"
              title="Plein écran"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        ) : (
          // Player YouTube intégré
          <div className="relative">
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Modal plein écran */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <div className="relative w-full h-full max-w-6xl max-h-[80vh] mx-4">
            <button
              onClick={handleCloseFullscreen}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <div className="w-full h-full">
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default YouTubePlayer;
