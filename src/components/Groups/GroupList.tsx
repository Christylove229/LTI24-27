// src/components/Groups/GroupList.tsx
import { useState, useEffect, useCallback } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { PlusIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';
import GroupCard from './GroupCard';

interface GroupListProps {
  onCreateGroup?: () => void;
}

const GroupList = ({ onCreateGroup }: GroupListProps) => {
  const { groups, isLoading, fetchUserGroups, createGroup } = useGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const usesInternalModal = !onCreateGroup;

  const handleOpenCreateModal = useCallback(() => {
    if (onCreateGroup) {
      onCreateGroup();
    } else {
      setShowCreateModal(true);
    }
  }, [onCreateGroup]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && groups.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un groupe..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Créer un groupe
        </button>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Aucun groupe trouvé
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? 'Aucun groupe ne correspond à votre recherche.'
              : 'Rejoignez un groupe existant ou créez-en un nouveau pour commencer.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Créer un groupe
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {usesInternalModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (groupData) => {
            try {
              await createGroup(groupData);
              await fetchUserGroups();
              setShowCreateModal(false);
            } catch (error) {
              console.error('Error creating group:', error);
            }
          }}
        />
      )}
    </div>
  );
};

export default GroupList;