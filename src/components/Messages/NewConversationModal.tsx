// src/components/Messages/NewConversationModal.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { createThread } from '../../services/messages';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (threadId: string) => void;
}

export default function NewConversationModal({ 
  isOpen, 
  onClose, 
  onConversationCreated 
}: NewConversationModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rechercher des utilisateurs
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        // Rechercher dans la table profiles (ou auth.users selon votre setup)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .neq('id', user?.id) // Exclure l'utilisateur actuel
          .limit(10);

        if (error) {
          console.error('Error searching users:', error);
          return;
        }

        setUsers(data || []);
      } catch (error) {
        console.error('Error in searchUsers:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user?.id]);

  // Ajouter/retirer un utilisateur de la sélection
  const toggleUserSelection = (selectedUser: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  // Créer la conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    if (!user) return;

    setIsCreating(true);
    try {
      const participantIds = [user.id, ...selectedUsers.map(u => u.id)];
      const isGroup = selectedUsers.length > 1;
      
      const threadId = await createThread({
        participantIds,
        title: isGroup ? groupTitle.trim() || undefined : undefined
      });

      if (threadId) {
        onConversationCreated(threadId);
        handleClose();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    } finally {
      setIsCreating(false);
    }
  };

  // Fermer et réinitialiser
  const handleClose = () => {
    setSearchQuery('');
    setUsers([]);
    setSelectedUsers([]);
    setGroupTitle('');
    setIsCreating(false);
    onClose();
  };

  // Obtenir l'avatar d'un utilisateur
  const getUserAvatar = (user: User) => {
    if (user.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={user.full_name || user.email}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
    );
  };

  const isGroup = selectedUsers.length > 1;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* En-tête */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Nouvelle conversation
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Barre de recherche */}
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par email ou nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Utilisateurs sélectionnés */}
                {selectedUsers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sélectionnés ({selectedUsers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((selectedUser) => (
                        <div
                          key={selectedUser.id}
                          className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                        >
                          <div className="w-6 h-6">
                            {selectedUser.avatar_url ? (
                              <img
                                src={selectedUser.avatar_url}
                                alt={selectedUser.full_name || selectedUser.email}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-blue-800 dark:text-blue-200">
                            {selectedUser.full_name || selectedUser.email}
                          </span>
                          <button
                            onClick={() => toggleUserSelection(selectedUser)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Titre du groupe (si plus d'un utilisateur sélectionné) */}
                {isGroup && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du groupe (optionnel)
                    </label>
                    <input
                      type="text"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      placeholder="Entrez un nom pour le groupe"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Résultats de recherche */}
                <div className="mb-6">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : searchQuery.length < 2 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Tapez au moins 2 caractères pour rechercher
                    </p>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Aucun utilisateur trouvé
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {users.map((searchUser) => {
                        const isSelected = selectedUsers.some(u => u.id === searchUser.id);
                        return (
                          <button
                            key={searchUser.id}
                            onClick={() => toggleUserSelection(searchUser)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {getUserAvatar(searchUser)}
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {searchUser.full_name || searchUser.email}
                              </p>
                              {searchUser.full_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {searchUser.email}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    disabled={isCreating}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateConversation}
                    disabled={selectedUsers.length === 0 || isCreating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Création...</span>
                      </div>
                    ) : (
                      `Créer ${isGroup ? 'le groupe' : 'la conversation'}`
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}