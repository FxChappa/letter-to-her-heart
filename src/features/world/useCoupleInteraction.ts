import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Profile } from '../../lib/supabase/database.types';
import { authorizeRealtime, getSupabaseClient } from '../../lib/supabase/client';
import { loadProfilesByRole } from '../../lib/supabase/profile';
import { activeFromState, applyCoupleStateEvent, initialCoupleState, type CoupleInteractionKind, type CoupleInteractionState, type CoupleRequest } from './coupleState';
import type { PlayerPose, PresencePlayer } from './worldTypes';

type CoupleWireEvent =
  | { type: 'request'; request: CoupleRequest }
  | { type: 'response'; requestId: string; fromId: string; accepted: boolean }
  | { type: 'end'; requestId: string; fromId: string };

const makeRequest = (profile: Profile, localPose: PlayerPose, other: PresencePlayer, kind: CoupleInteractionKind): CoupleRequest => {
  const aldanePose = profile.role === 'aldane' ? localPose : other.pose;
  const santanaPose = profile.role === 'santana' ? localPose : other.pose;
  const dx = santanaPose.position[0] - aldanePose.position[0];
  const dz = santanaPose.position[2] - aldanePose.position[2];
  return {
    requestId: crypto.randomUUID(),
    kind,
    fromId: profile.id,
    fromName: profile.display_name,
    toId: other.id,
    anchor: [
      (localPose.position[0] + other.pose.position[0]) / 2,
      0,
      (localPose.position[2] + other.pose.position[2]) / 2,
    ],
    facing: Math.atan2(dx, dz),
    startedAt: Date.now(),
  };
};

export function useCoupleInteraction(profile: Profile, localPose: PlayerPose, players: PresencePlayer[], demoMode: boolean) {
  const supabase = getSupabaseClient();
  const [state, setState] = useState<CoupleInteractionState>(initialCoupleState);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const other = players.find(player => player.role !== profile.role) ?? null;
  const distance = other ? Math.hypot(localPose.position[0] - other.pose.position[0], localPose.position[2] - other.pose.position[2]) : Infinity;
  const canInvite = Boolean(other && distance < 1.45 && !localPose.seatId && state.phase === 'idle');

  const send = useCallback(async (event: CoupleWireEvent) => {
    if (!channelRef.current) return;
    await channelRef.current.send({ type: 'broadcast', event: 'couple-event', payload: event });
  }, []);

  useEffect(() => {
    if (!supabase || demoMode) return;
    let active = true;
    const channel = supabase.channel('our-little-forever:couple', { config: { private: true, broadcast: { self: false } } });
    channel.on('broadcast', { event: 'couple-event' }, ({ payload }) => {
      void loadProfilesByRole(supabase).then(profiles => {
        const event = payload as CoupleWireEvent;
        const otherProfile = profile.role === 'aldane' ? profiles.santana : profiles.aldane;
        if (!otherProfile) return;
        if (event.type === 'request') {
          if (event.request.fromId !== otherProfile.id || event.request.toId !== profile.id) return;
          setState(current => applyCoupleStateEvent(current, { type: 'request-received', request: event.request }));
        } else if (event.fromId === otherProfile.id) {
          setState(current => applyCoupleStateEvent(current, event.type === 'response'
            ? { type: event.accepted ? 'accepted' : 'declined' }
            : { type: 'ended' }));
        }
      }).catch(() => setError('The private interaction could not verify the other profile.'));
    });
    channelRef.current = channel;
    void authorizeRealtime(supabase)
      .then(() => {
        if (!active) return;
        channel.subscribe(status => {
          if (status === 'SUBSCRIBED') setError(null);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Private interactions are reconnecting.');
        });
      })
      .catch(() => {
        if (active) setError('Private interactions are reconnecting.');
      });
    return () => {
      active = false;
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [demoMode, profile.id, profile.role, supabase]);

  useEffect(() => {
    if (state.phase !== 'active') return;
    const timeout = window.setTimeout(() => {
      const requestId = state.request.requestId;
      setState(current => applyCoupleStateEvent(current, { type: 'ended' }));
      void send({ type: 'end', requestId, fromId: profile.id });
    }, state.request.kind === 'kiss' ? 4200 : 16000);
    return () => window.clearTimeout(timeout);
  }, [profile.id, send, state]);

  const request = useCallback(async (kind: CoupleInteractionKind) => {
    if (!other || !canInvite) return;
    const nextRequest = makeRequest(profile, localPose, other, kind);
    setState(current => applyCoupleStateEvent(current, { type: 'request-sent', request: nextRequest }));
    if (!demoMode) await send({ type: 'request', request: nextRequest });
  }, [canInvite, demoMode, localPose, other, profile, send]);

  const respond = useCallback(async (accepted: boolean) => {
    if (state.phase !== 'incoming' && !(demoMode && state.phase === 'outgoing')) return;
    const request = state.request;
    setState(current => applyCoupleStateEvent(current, { type: accepted ? 'accepted' : 'declined' }));
    if (!demoMode) await send({ type: 'response', requestId: request.requestId, fromId: profile.id, accepted });
  }, [demoMode, profile.id, send, state]);

  const end = useCallback(async () => {
    if (state.phase === 'idle') return;
    const requestId = state.request.requestId;
    setState(current => applyCoupleStateEvent(current, { type: 'ended' }));
    if (!demoMode) await send({ type: 'end', requestId, fromId: profile.id });
  }, [demoMode, profile.id, send, state]);

  const simulateIncoming = useCallback((kind: CoupleInteractionKind) => {
    if (!demoMode || !other || state.phase !== 'idle') return;
    const request = makeRequest({ ...profile, id: other.id, role: other.role, display_name: other.displayName }, other.pose, {
      id: profile.id,
      role: profile.role,
      displayName: profile.display_name,
      pose: localPose,
      onlineAt: new Date().toISOString(),
    }, kind);
    setState(current => applyCoupleStateEvent(current, { type: 'request-received', request }));
  }, [demoMode, localPose, other, profile, state.phase]);

  return useMemo(() => ({
    state,
    active: activeFromState(state),
    error,
    other,
    canInvite,
    request,
    respond,
    end,
    simulateIncoming,
  }), [canInvite, end, error, other, request, respond, simulateIncoming, state]);
}
