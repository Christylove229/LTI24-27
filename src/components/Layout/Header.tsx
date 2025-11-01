import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  EnvelopeIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import MobileMenu from './MobileMenu';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import { getUnreadCount } from '../../services/messages';
import { supabase } from '../../lib/supabase';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Charger le nombre de messages non lus et s'abonner aux nouveaux messages
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let intervalId: number | undefined;

    const refresh = async () => {
      if (!profile?.id) return;
      const count = await getUnreadCount(profile.id);
      setUnreadCount(count);
    };

    refresh();
    // Poll léger toutes les 30s pour fiabilité
    intervalId = window.setInterval(refresh, 30000);

    // Realtime: réagir aux nouveaux messages et aux updates de last_read_at
    channel = supabase
      .channel('header-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        refresh();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'thread_participants' }, () => {
        refresh();
      })
      .subscribe();

    // Nettoyage
    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 right-0 left-0 md:left-56 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Logo for mobile */}
            <div className="md:hidden flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LTI</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">24-27</span>
              </Link>
            </div>

            {/* Search bar */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
              </button>

              {/* Messages avec badge non lus */}
              <Link
                to="/messages"
                className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Messages"
                title="Messages"
              >
                <EnvelopeIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 min-w-[18px] h-5 text-[11px] font-semibold leading-none rounded-full bg-red-600 text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationDropdown />

              {/* Profile dropdown */}
              <div className="relative group">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={profile.avatar_url}
                      alt={profile.full_name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {profile?.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {profile?.full_name?.split(' ')[0]}
                  </span>
                </Link>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Mon profil
                    </Link>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Header] Sign out button clicked');
                        try {
                          await signOut();
                        } catch (error) {
                          console.error('[Header] Error during sign out:', error);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />
      )}
    </>
  );
};

export default Header;