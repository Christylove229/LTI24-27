// src/components/Groups/GroupDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { Group, GroupMember, GroupMessage, GroupFile, GroupEvent } from '../../types/group';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  PencilIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckIcon,
  MapPinIcon,
  GlobeAltIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';

interface GroupDetailProps {
  group: Group;
}

const GroupDetail = ({ group }: GroupDetailProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const {
    currentGroup,
    members,
    messages,
    files,
    events,
    isLoading,
    fetchGroupMembers,
    fetchGroupMessages,
    sendMessage,
    uploadFile,
    joinGroup,
    leaveGroup,
  } = useGroups();

  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'files' | 'events'>('chat');
  const [message, setMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [filePreview, setFilePreview] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (group) {
      fetchGroupMembers(group.id);
      fetchGroupMessages(group.id);
      // Vérifier si l'utilisateur est membre
      const member = members.find(m => m.user_id === currentUser?.id);
      setIsMember(!!member);
      setIsOwner(member?.role === 'owner');
    }
  }, [group?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !fileToUpload) return;

    try {
      let fileUrl: string | null = null;

      if (fileToUpload) {
        // Uploader le fichier
        const uploadedFile = await uploadFile(group.id, fileToUpload);
        if (uploadedFile) {
          fileUrl = uploadedFile.file_url;
        }
      }

      const contentParts = [message.trim()];
      if (fileUrl) {
        contentParts.push(fileUrl);
      }
      const composedMessage = contentParts.filter(Boolean).join('\n');

      if (!composedMessage) {
        return;
      }

      // Envoyer le message
      await sendMessage(group.id, composedMessage);

      // Réinitialiser le formulaire
      setMessage('');
      setFileToUpload(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('La taille maximale du fichier est de 10MB');
      return;
    }

    setFileToUpload(file);
  };

  const handleJoinGroup = async () => {
    try {
      await joinGroup(group.id);
      setIsMember(true);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;
    
    try {
      await leaveGroup(group.id);
      setIsMember(false);
      navigate('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const openFilePreview = (file: GroupFile) => {
    setFilePreview({
      url: file.file_url,
      name: file.file_name,
    });
    setShowFilePreview(true);
  };

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Chargement du groupe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du groupe */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500">
          {group.banner_url && (
            <img
              src={group.banner_url}
              alt={`Bannière de ${group.name}`}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="flex items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{group.name}</h1>
                <p className="text-purple-100 mt-1">
                  {group.member_count || 0} membre{group.member_count !== 1 ? 's' : ''} •{' '}
                  {group.is_public ? 'Groupe public' : 'Groupe privé'}
                </p>
              </div>
              
              <div className="flex space-x-3">
                {!isMember ? (
                  <button
                    onClick={handleJoinGroup}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Rejoindre
                  </button>
                ) : (
                  <div className="relative group">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        {isOwner && (
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => navigate(`/groups/${group.id}/edit`)}
                          >
                            <PencilIcon className="inline-block h-4 w-4 mr-2" />
                            Modifier le groupe
                          </button>
                        )}
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={handleLeaveGroup}
                        >
                          <ArrowRightOnRectangleIcon className="inline-block h-4 w-4 mr-2" />
                          Quitter le groupe
                        </button>
                        {isOwner && (
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.')) {
                                // Implémenter la suppression du groupe
                              }
                            }}
                          >
                            <TrashIcon className="inline-block h-4 w-4 mr-2" />
                            Supprimer le groupe
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/groups')}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 focus:outline-none"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">{group.description}</p>
          
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'chat'
                    ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Discussion</span>
              </button>
              
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'members'
                    ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <UserGroupIcon className="h-5 w-5" />
                <span>Membres</span>
                <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                  {group.member_count || 0}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'files'
                    ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Fichiers</span>
              </button>
              
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'events'
                    ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <CalendarIcon className="h-5 w-5" />
                <span>Événements</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu de l'onglet sélectionné */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-28rem)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12" />
                  <h3 className="mt-2 text-sm font-medium">Aucun message</h3>
                  <p className="mt-1 text-sm">Soyez le premier à envoyer un message !</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex space-x-3 group">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={msg.user?.avatar_url || '/default-avatar.png'}
                        alt={msg.user?.full_name || 'Utilisateur inconnu'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {msg.user?.full_name || 'Utilisateur inconnu'}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(msg.created_at), { 
                            addSuffix: true,
                            locale: fr 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Formulaire d'envoi de message */}
            {isMember ? (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <form onSubmit={handleSendMessage} className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        className="block w-full rounded-lg border-0 py-3 px-4 pr-20 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Écrire un message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <PaperClipIcon className="h-5 w-5" />
                          <span className="sr-only">Joindre un fichier</span>
                        </button>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    {fileToUpload && (
                      <div className="mt-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          <PaperClipIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {fileToUpload.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFileToUpload(null)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim() && !fileToUpload}
                    className="inline-flex items-center justify-center rounded-lg px-4 py-3 bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                    <span className="sr-only">Envoyer</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Vous devez être membre du groupe pour participer à la discussion.
                </p>
                <button
                  onClick={handleJoinGroup}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Rejoindre le groupe
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  <UserGroupIcon className="mx-auto h-12 w-12" />
                  <h3 className="mt-2 text-sm font-medium">Aucun membre</h3>
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={member.user?.avatar_url || '/default-avatar.png'}
                      alt={member.user?.full_name || 'Membre inconnu'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.user?.full_name || 'Membre inconnu'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </p>
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            {member.role !== 'admin' && (
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => {
                                  // Implémenter la promotion en admin
                                }}
                              >
                                Promouvoir admin
                              </button>
                            )}
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer ${member.user?.full_name || 'ce membre'} du groupe ?`)) {
                                  // Implémenter la suppression du membre
                                }
                              }}
                            >
                              Supprimer du groupe
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'files' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Fichiers partagés</h3>
              {isMember && (
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer">
                  <PaperClipIcon className="-ml-1 mr-2 h-5 w-5" />
                  Ajouter un fichier
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="mx-auto h-12 w-12" />
                <h3 className="mt-2 text-sm font-medium">Aucun fichier partagé</h3>
                <p className="mt-1 text-sm">
                  {isMember
                    ? 'Partagez des fichiers avec les membres du groupe'
                    : 'Aucun fichier n\'a été partagé dans ce groupe'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                        Nom
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Ajouté par
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Date d'ajout
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="truncate max-w-xs">{file.file_name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {file.user?.full_name || 'Inconnu'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {formatDistanceToNow(new Date(file.created_at), { 
                            addSuffix: true,
                            locale: fr 
                          })}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => window.open(file.file_url, '_blank')}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              Télécharger
                            </button>
                            {isOwner && (
                              <button
                                onClick={() => {
                                  if (confirm('Supprimer ce fichier ?')) {
                                    // Implémenter la suppression du fichier
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Événements à venir</h3>
              {isMember && (
                <button
                  onClick={() => {
                    // Implémenter la création d'événement
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Nouvel événement
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CalendarIcon className="mx-auto h-12 w-12" />
                <h3 className="mt-2 text-sm font-medium">Aucun événement à venir</h3>
                <p className="mt-1 text-sm">
                  {isMember
                    ? 'Créez un événement pour organiser une réunion ou une activité'
                    : 'Aucun événement n\'a été planifié pour le moment'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="group relative flex items-center space-x-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(event.start_time).toLocaleDateString('fr-FR', { day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.start_time).toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>
                            {new Date(event.start_time).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {event.end_time && (
                              <>
                                {' - '}
                                {new Date(event.end_time).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </>
                            )}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.is_online && event.meeting_url && (
                          <div className="flex items-center space-x-2 mt-1">
                            <GlobeAltIcon className="h-4 w-4" />
                            <a
                              href={event.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              Rejoindre la réunion
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // Implémenter la participation à l'événement
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <CheckIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                        Participer
                      </button>
                      
                      {isOwner && (
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                          </button>
                          <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => {
                                  // Implémenter l'édition de l'événement
                                }}
                              >
                                Modifier
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => {
                                  if (confirm('Supprimer cet événement ?')) {
                                    // Implémenter la suppression de l'événement
                                  }
                                }}
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Aperçu du fichier */}
      {showFilePreview && filePreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowFilePreview(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => setShowFilePreview(false)}
                >
                  <span className="sr-only">Fermer</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    {filePreview.name}
                  </h3>
                  <div className="mt-4">
                    {filePreview.url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                      <img
                        src={filePreview.url}
                        alt={filePreview.name}
                        className="max-w-full max-h-[70vh] mx-auto"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <DocumentTextIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <a
                  href={filePreview.url}
                  download
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Télécharger
                </a>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowFilePreview(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;