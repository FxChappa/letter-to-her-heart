import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase/client';
import type { DateEvent, DateState } from './dateState';
import { applyDateEvent, canAskNow, canPrepareDate, canRespondToQuestion, initialDateState } from './dateState';
import type { Profile } from '../../lib/supabase/database.types';
import { loadProfilesByRole } from '../../lib/supabase/profile';

type DatePayload = DateEvent & { senderId: string };

export function useDateSequence(profile: Profile | null, demoMode: boolean) {
  const supabase = getSupabaseClient();
  const [state, setState] = useState<DateState>(initialDateState);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!profile || !supabase || demoMode) return;
    let active = true;
    void supabase
      .from('relationship_moments')
      .select('responded_at')
      .eq('moment_type', 'girlfriend_question')
      .eq('response', 'yes')
      .order('responded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active || loadError || !data?.responded_at) return;
        setState({ phase: 'accepted', acceptedAt: data.responded_at });
      });
    return () => {
      active = false;
    };
  }, [demoMode, profile, supabase]);

  useEffect(() => {
    if (!profile || !supabase || demoMode) return;
    const nextChannel = supabase.channel('our-little-forever:date', {
      config: { private: true, broadcast: { self: false } },
    });

    nextChannel.on('broadcast', { event: 'date-event' }, ({ payload }) => {
      void loadProfilesByRole(supabase).then(profiles => {
        const event = payload as DatePayload;
        const fromAldane = event.senderId === profiles.aldane?.id;
        const fromSantana = event.senderId === profiles.santana?.id;
        if ((event.type === 'prepare' || event.type === 'ask') && !fromAldane) return;
        if ((event.type === 'talk_first' || event.type === 'accepted') && !fromSantana) return;
        setState(current => applyDateEvent(current, event));
        if (event.type === 'prepare' && profile.role === 'santana') {
          setNotification('Aldane has prepared something for you. Follow the warm light to the table.');
        }
        if (event.type === 'accepted') setNotification('A new chapter begins.');
      }).catch(() => setError('The date moment could not verify the other profile.'));
    });

    nextChannel.subscribe(status => {
      if (status === 'SUBSCRIBED') setError(null);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError('The date controls are reconnecting. Chat and voice are still available.');
      }
    });
    channelRef.current = nextChannel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(nextChannel);
    };
  }, [demoMode, profile, supabase]);

  const broadcast = useCallback(async (event: DateEvent) => {
    if (!profile) return;
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'date-event',
        payload: { ...event, senderId: profile.id } satisfies DatePayload,
      });
    }
  }, [profile]);

  const applyLocal = useCallback(async (event: DateEvent) => {
    setState(current => applyDateEvent(current, event));
    await broadcast(event);
  }, [broadcast]);

  const prepareDate = useCallback(async () => {
    if (!canPrepareDate(profile?.role)) return;
    setNotification(null);
    await applyLocal({ type: 'prepare' });
  }, [applyLocal, profile]);

  const askNow = useCallback(async () => {
    if (!canAskNow(profile?.role, state.phase)) return;
    await applyLocal({ type: 'ask' });
  }, [applyLocal, profile, state.phase]);

  const respondTalkFirst = useCallback(async () => {
    if (!canRespondToQuestion(profile?.role, state.phase)) return;
    await applyLocal({ type: 'talk_first' });
  }, [applyLocal, profile, state.phase]);

  const respondYes = useCallback(async () => {
    if (!profile || !canRespondToQuestion(profile.role, state.phase)) return;
    const acceptedAt = new Date().toISOString();
    setError(null);

    if (supabase && !demoMode) {
      const profiles = await loadProfilesByRole(supabase);
      const aldane = profiles.aldane;
      if (!aldane) {
        setError('Aldane’s profile has not been linked in Supabase yet.');
        return;
      }

      const { error: insertError } = await supabase.from('relationship_moments').insert({
        moment_type: 'girlfriend_question',
        initiated_by: aldane.id,
        response: 'yes',
        responded_by: profile.id,
        responded_at: acceptedAt,
        metadata: {
          saved_from: 'our-little-forever-v1',
        },
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setNotification('A new chapter begins.');
    await applyLocal({ type: 'accepted', acceptedAt });
  }, [applyLocal, demoMode, profile, state.phase, supabase]);

  return {
    state,
    notification,
    error,
    canPrepare: canPrepareDate(profile?.role),
    canAsk: canAskNow(profile?.role, state.phase),
    canRespond: canRespondToQuestion(profile?.role, state.phase),
    prepareDate,
    askNow,
    respondYes,
    respondTalkFirst,
    clearNotification: () => setNotification(null),
  };
}
