import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isSigningOut: boolean;
  signUp: (email: string, password: string, fullName: string, promo?: string) => Promise<{ needsConfirmation?: boolean } | void>;
  signIn: (email: string, password: string) => Promise<{ needsConfirmation?: boolean } | void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  clearLoading: () => void;
  adoptProfile: (p: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Get initial session with robust error handling to avoid infinite loading
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // Log but continue to set loading to false
          console.error('Error getting initial session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // fetchProfile will set loading to false in its finally block
          return;
        }
      } catch (e) {
        console.error('Unexpected error during auth init:', e);
      } finally {
        // Ensure we never stay stuck on loading if no session/user
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Ignorer les changements d'authentification pendant la déconnexion
        if (isSigningOut) {
          console.log('Ignoring auth state change during sign out');
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
          // Update online status
          await updateOnlineStatus(true);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Safety timeout: if a user exists but loading stays true too long, release it
  useEffect(() => {
    if (user && loading) {
      const timer = setTimeout(() => {
        console.warn('[Auth] Loading safety timeout reached. Forcing loading=false');
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Update online status when page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user) {
        updateOnlineStatus(!document.hidden);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Update status on beforeunload
    const handleBeforeUnload = () => {
      if (user) {
        updateOnlineStatus(false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[Auth] Fetching profile for userId:', userId);
      // Prefer REST call (robust in this environment)
      if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env missing');
      const token = session?.access_token;
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
      console.log('[Auth] Profile fetch URL:', url);
      const res = await fetch(url, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('[Auth] REST profiles fetch not ok:', res.status);
      }
      const body = await res.json();
      console.log('[Auth] Profile fetch response:', body);
      if (Array.isArray(body) && body.length > 0) {
        console.log('[Auth] Setting profile:', body[0]);
        setProfile(body[0]);
        return;
      }

      console.log('[Auth] No profile found, creating default student profile');

      // If no row, try to upsert via SDK then refetch once via REST
      const email = user?.email || '';
      const { error: insertErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: '',
          promo: '',
          role: 'student',
          is_online: false,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      if (insertErr) {
        console.error('[Auth] Error creating missing profile (REST path):', insertErr);
      } else {
        console.log('[Auth] Created default profile for user');
        const res2 = await fetch(url, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json',
          },
        });
        if (res2.ok) {
          const body2 = await res2.json();
          if (Array.isArray(body2) && body2.length > 0) {
            console.log('[Auth] Setting newly created profile:', body2[0]);
            setProfile(body2[0]);
          }
        }
      }
    } catch (error) {
      console.error('[Auth] Error fetching profile (fatal):', error);
    } finally {
      console.log('[Auth] fetchProfile finished, setting loading=false');
      setLoading(false);
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);

      // Update local profile state
      setProfile(prev => prev ? { ...prev, is_online: isOnline, last_seen: new Date().toISOString() } : null);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, promo?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            promo: promo || '',
          },
          // Supabase gère automatiquement l'envoi d'email de confirmation
          // si activé dans les paramètres d'authentification
        }
      });

      if (error) throw error;

      if (data.user) {
        // Vérifier si l'utilisateur doit confirmer son email
        if (!data.user.email_confirmed_at) {
          // L'utilisateur doit confirmer son email avant de pouvoir se connecter
          toast.success('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
          return { needsConfirmation: true };
        }

        // Si la confirmation est automatique ou déjà faite, créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            promo: promo || '',
          });

        if (profileError) throw profileError;

        toast.success('Compte créé avec succès !');
        return { needsConfirmation: false };
      }
    } catch (error) {
      const err = error as AuthError;
      toast.error(err.message || 'Erreur lors de la création du compte');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Starting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Vérifier si c'est une erreur de confirmation email
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          toast.error('Veuillez d\'abord confirmer votre email en cliquant sur le lien envoyé.');
          return { needsConfirmation: true };
        }
        throw error;
      }

      console.log('[Auth] Sign in successful, user:', data.user?.id, 'email:', data.user?.email);
      toast.success('Connexion réussie !');

      // Redirection vers la page d'accueil après connexion
      setTimeout(() => {
        window.location.href = '/';
      }, 1000); // Petit délai pour laisser le temps au toast de s'afficher
      return { needsConfirmation: false };
    } catch (error) {
      const err = error as AuthError;
      console.error('[Auth] Sign in error:', err);
      toast.error(err.message || 'Erreur lors de la connexion');
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[Auth] signOut function called');
    setIsSigningOut(true);
    try {
      // Essayer de mettre à jour le statut en ligne, mais ne pas échouer si la session est expirée
      try {
        await updateOnlineStatus(false);
        console.log('[Auth] Online status updated to offline');
      } catch (statusError) {
        console.warn('[Auth] Could not update online status during sign out:', statusError);
        // Ne pas throw, continuer avec la déconnexion
      }

      console.log('[Auth] Calling supabase.auth.signOut()');
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Si la session est déjà manquante, considérer ça comme une déconnexion réussie
        if (error.message?.includes('Auth session missing') || error.message?.includes('session_not_found')) {
          console.warn('[Auth] Session was already expired, treating as successful logout');
        } else {
          throw error;
        }
      }

      console.log('[Auth] Sign out successful, clearing local state');
      // Forcer le nettoyage de l'état local même si onAuthStateChange ne se déclenche pas
      setUser(null);
      setProfile(null);
      setSession(null);

      toast.success('Déconnexion réussie');

      // Redirection vers la page d'authentification après un court délai
      setTimeout(() => {
        console.log('[Auth] Redirecting to /auth');
        window.location.href = '/auth';
      }, 500);

    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Même en cas d'erreur, forcer le nettoyage de l'état local
      console.log('[Auth] Force clearing local state due to error');
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.success('Déconnexion réussie');

      // Redirection même en cas d'erreur
      setTimeout(() => {
        console.log('[Auth] Redirecting to /auth after error');
        window.location.href = '/auth';
      }, 500);
    } finally {
      console.log('[Auth] Sign out process finished');
      setIsSigningOut(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  const isAdmin = profile?.role === 'admin';

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user.id);
    } else {
      setLoading(false);
    }
  };

  const clearLoading = () => setLoading(false);

  const adoptProfile = (p: Profile) => {
    setProfile(p);
    setLoading(false);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isSigningOut,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    refreshProfile,
    clearLoading,
    adoptProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};