import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile, ProfileRole, ProfileRow } from './database.types';

export const isPrivateRole = (role: string | null | undefined): role is ProfileRole =>
  role === 'aldane' || role === 'santana';

export const canUseOwnerControls = (profile: Pick<Profile, 'role'> | null): boolean =>
  profile?.role === 'aldane';

export const getOtherRole = (role: ProfileRole): ProfileRole => role === 'aldane' ? 'santana' : 'aldane';

const asPrivateProfile = (row: ProfileRow): Profile => {
  if (!isPrivateRole(row.role) || !isPrivateRole(row.avatar_key)) {
    throw new Error('This profile does not have a valid private role and avatar.');
  }
  return {
    ...row,
    role: row.role,
    avatar_key: row.avatar_key,
  };
};

export const loadProfile = async (supabase: SupabaseClient<Database>, userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? asPrivateProfile(data) : null;
};

export const loadProfilesByRole = async (supabase: SupabaseClient<Database>): Promise<Record<ProfileRole, Profile | null>> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['aldane', 'santana']);

  if (error) throw error;

  const profiles = (data ?? []).map(asPrivateProfile);
  return {
    aldane: profiles.find(profile => profile.role === 'aldane') ?? null,
    santana: profiles.find(profile => profile.role === 'santana') ?? null,
  };
};
