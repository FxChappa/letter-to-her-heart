import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, supabaseEnv } from '../../lib/supabase/client';
import type { Profile, ProfileRole } from '../../lib/supabase/database.types';
import { loadProfile } from '../../lib/supabase/profile';

type AuthMode = 'supabase' | 'demo' | 'unconfigured';

type AuthContextValue = {
  mode: AuthMode;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  continueDemo: (role: ProfileRole) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const demoProfileKey = 'our-little-forever-demo-profile';

const makeDemoProfile = (role: ProfileRole): Profile => ({
  id: `demo-${role}`,
  display_name: role === 'aldane' ? 'Aldane' : 'Santana',
  role,
  avatar_key: role,
  controls_tutorial_complete: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const readDemoProfile = (): Profile | null => {
  try {
    const raw = localStorage.getItem(demoProfileKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    return parsed.role === 'aldane' || parsed.role === 'santana' ? parsed : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(Boolean(supabase));
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => supabaseEnv.demoMode ? readDemoProfile() : null);
  const [configurationError, setConfigurationError] = useState<string | null>(supabaseEnv.error);
  const mode: AuthMode = supabase ? 'supabase' : supabaseEnv.demoMode ? 'demo' : 'unconfigured';

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    const hydrate = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        try {
          const nextProfile = await loadProfile(supabase, data.session.user.id);
          if (!active) return;
          setProfile(nextProfile);
          setConfigurationError(nextProfile ? null : 'This account exists, but it is not linked to Aldane or Santana yet. Add a row for this user in the Supabase profiles table.');
        } catch (error) {
          if (!active) return;
          setProfile(null);
          setConfigurationError(error instanceof Error ? error.message : 'Unable to load the private profile.');
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    void hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        return;
      }
      void loadProfile(supabase, nextSession.user.id)
        .then(nextProfile => {
          setProfile(nextProfile);
          setConfigurationError(nextProfile ? null : 'This signed-in user needs a profile role before entering Our Little Forever.');
        })
        .catch(error => setConfigurationError(error instanceof Error ? error.message : 'Unable to load the private profile.'));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(configurationError ?? 'Supabase is not configured yet.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, [configurationError, supabase]);

  const continueDemo = useCallback((role: ProfileRole) => {
    if (!supabaseEnv.demoMode) return;
    const nextProfile = makeDemoProfile(role);
    localStorage.setItem(demoProfileKey, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setConfigurationError(null);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(demoProfileKey);
    setSession(null);
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    mode,
    loading,
    session,
    user,
    profile,
    configurationError,
    signIn,
    continueDemo,
    signOut,
  }), [mode, loading, session, user, profile, configurationError, signIn, continueDemo, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
