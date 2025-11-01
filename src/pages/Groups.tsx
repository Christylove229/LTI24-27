// src/pages/Groups.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateGroupModal from '../components/Groups/CreateGroupModal';
import { motion } from 'framer-motion';
import { useGroups } from '../hooks/useGroups';
import GroupList from '../components/Groups/GroupList';
import GroupDetail from '../components/Groups/GroupDetail';
import EventForm from '../components/Groups/EventForm';

const Groups = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  const {
    groups,
    currentGroup,
    setCurrentGroup,
    fetchUserGroups,
    createGroup,
    createEvent,
  } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les groupes de l'utilisateur
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        await fetchUserGroups();
        
        // Si un ID de groupe est fourni dans l'URL, charger les détails du groupe
        if (groupId) {
          const group = groups.find(g => g.id === groupId);
          if (group) {
            setCurrentGroup(group);
          } else {
            // Rediriger vers la liste des groupes si le groupe n'existe pas
            navigate('/groups', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [groupId, groups.length]);

  const handleCreateGroup = async (groupData: {
    name: string;
    description: string;
    isPublic: boolean;
    bannerFile?: File;
  }) => {
    try {
      await createGroup(groupData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isOnline: boolean;
    meetingUrl?: string;
  }) => {
    if (!currentGroup) return;

    try {
      await createEvent(currentGroup.id, eventData);
      setShowEventModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {groupId && currentGroup ? (
          <>
            <GroupDetail 
              group={currentGroup} 
              onCreateEvent={() => setShowEventModal(true)}
            />
            
            <EventForm
              isOpen={showEventModal}
              onClose={() => setShowEventModal(false)}
              onSubmit={handleCreateEvent}
            />
          </>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                Groupes de Discussion
              </h1>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
                Créez et rejoignez des groupes thématiques pour collaborer avec vos camarades.
              </p>
            </div>

            <GroupList onCreateGroup={() => setShowCreateModal(true)} />
            
            <CreateGroupModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateGroup}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Groups;