import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, promo?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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
      async (event, session) => {
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
      // Prefer REST call (robust in this environment)
      if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env missing');
      const token = session?.access_token;
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('REST profiles fetch not ok:', res.status);
      }
      const body = await res.json();
      if (Array.isArray(body) && body.length > 0) {
        setProfile(body[0]);
        return;
      }

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
        console.error('Error creating missing profile (REST path):', insertErr);
      } else {
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
            setProfile(body2[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile (fatal):', error);
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
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
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
      }
    } catch (error) {
      const err = error as AuthError;
      toast.error(err.message || 'Erreur lors de la création du compte');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Connexion réussie !');
    } catch (error) {
      const err = error as AuthError;
      toast.error(err.message || 'Erreur lors de la connexion');
    }
  };

  const signOut = async () => {
    try {
      await updateOnlineStatus(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erreur lors de la déconnexion');
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