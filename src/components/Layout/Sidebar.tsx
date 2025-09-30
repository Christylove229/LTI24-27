import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  SpeakerWaveIcon,
  PhotoIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Accueil', href: '/', icon: HomeIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Groupes', href: '/groupes', icon: UserGroupIcon },
  { name: 'Grande Salle', href: '/grande-salle', icon: SpeakerWaveIcon },
  { name: 'Ressources', href: '/ressources', icon: BookOpenIcon },
  { name: 'Planning', href: '/planning', icon: CalendarDaysIcon },
  { name: 'Annonces', href: '/annonces', icon: SpeakerWaveIcon },
  { name: 'Galerie', href: '/galerie', icon: PhotoIcon },
  { name: 'Apprentissage', href: '/apprentissage', icon: AcademicCapIcon },
];

const Sidebar: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 z-50">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LTI</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">24-27</span>
            </Link>
          </div>
          
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
                  group flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors duration-200
                `}
                end={item.href === '/'}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <item.icon
                      className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'} mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <Link to="/profile" className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                {profile?.avatar_url ? (
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={profile.avatar_url}
                    alt={profile.full_name}
                  />
                ) : (
                  <div className="inline-block h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                  {profile?.promo}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;