import type { ProfileRole } from '../../lib/supabase/database.types';

export type DatePhase = 'normal' | 'prepared' | 'question' | 'accepted';

export type DateState = {
  phase: DatePhase;
  acceptedAt: string | null;
};

export type DateEvent =
  | { type: 'prepare' }
  | { type: 'ask' }
  | { type: 'talk_first' }
  | { type: 'accepted'; acceptedAt: string }
  | { type: 'reset' };

export const initialDateState: DateState = {
  phase: 'normal',
  acceptedAt: null,
};

export const canPrepareDate = (role: ProfileRole | null | undefined): boolean => role === 'aldane';
export const canAskNow = (role: ProfileRole | null | undefined, phase: DatePhase): boolean => role === 'aldane' && phase === 'prepared';
export const canRespondToQuestion = (role: ProfileRole | null | undefined, phase: DatePhase): boolean => role === 'santana' && phase === 'question';

export const applyDateEvent = (state: DateState, event: DateEvent): DateState => {
  if (event.type === 'reset') return initialDateState;
  if (event.type === 'prepare') return { ...state, phase: 'prepared' };
  if (event.type === 'ask') return { ...state, phase: 'question' };
  if (event.type === 'talk_first') return { ...state, phase: 'prepared' };
  return { phase: 'accepted', acceptedAt: event.acceptedAt };
};
