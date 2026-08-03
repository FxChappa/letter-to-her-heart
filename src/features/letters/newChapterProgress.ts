import type { Profile } from '../../lib/supabase/database.types';

export const shouldPresentNewChapter = (
  profile: Pick<Profile, 'role' | 'new_chapter_completed_at'>,
): boolean => profile.role === 'santana' && !profile.new_chapter_completed_at;
