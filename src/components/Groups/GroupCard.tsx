// src/components/Groups/GroupCard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group } from '../../types/group';
import { UserGroupIcon, UsersIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Fonction utilitaire pour formater la date
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} an${interval > 1 ? 's' : ''}`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} mois`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} jour${interval > 1 ? 's' : ''}`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} heure${interval > 1 ? 's' : ''}`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''}`;
  
  return 'quelques secondes';
}

interface GroupCardProps {
  group: Group;
}

const GroupCard = ({ group }: GroupCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group.id}`);
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500">
        {group.banner_url && (
          <img
            src={group.banner_url}
            alt={`Bannière de ${group.name}`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-xl font-bold text-white">{group.name}</h3>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            group.is_public 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {group.is_public ? 'Public' : 'Privé'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
          {group.description || 'Aucune description fournie.'}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-4 w-4" />
            <span>{group.member_count || 0} membres</span>
          </div>
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            <span>{group.message_count || 0} messages</span>
          </div>
        </div>
        
        {group.last_message_at && (
          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>Actif il y a {formatTimeAgo(group.last_message_at)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GroupCard;