import { useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { authorizeRealtime, getSupabaseClient } from '../../lib/supabase/client';
import { getOtherRole } from '../../lib/supabase/profile';
import type { Profile } from '../../lib/supabase/database.types';
import type { PlayerPose, PresencePlayer } from './worldTypes';

type PresenceMeta = PresencePlayer & { presence_ref?: string };
type PoseBroadcast = Pick<PresencePlayer, 'id' | 'role' | 'displayName' | 'pose' | 'onlineAt'>;

const makeDemoRemote = (profile: Profile): PresencePlayer => {
  const otherRole = getOtherRole(profile.role);
  return {
    id: `demo-${otherRole}`,
    role: otherRole,
    displayName: otherRole === 'aldane' ? 'Aldane' : 'Santana',
    pose: {
      position: [profile.role === 'aldane' ? -1.5 : 1.8, 0, 0.6],
      rotation: Math.PI,
      moving: false,
      activity: 'idle',
      seatId: null,
      room: 'home',
    },
    onlineAt: new Date().toISOString(),
  };
};

export function usePresence(profile: Profile | null, pose: PlayerPose, demoMode: boolean) {
  const supabase = getSupabaseClient();
  const [players, setPlayers] = useState<PresencePlayer[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initialPoseRef = useRef(pose);

  useEffect(() => {
    if (!profile) return;

    if (!supabase || demoMode) {
      const interval = window.setInterval(() => {
        setPlayers([{
          ...makeDemoRemote(profile),
          pose: {
            ...makeDemoRemote(profile).pose,
            position: [
              (profile.role === 'aldane' ? -1.5 : 1.8) + Math.sin(Date.now() / 1600) * 0.65,
              0,
              0.6 + Math.cos(Date.now() / 1900) * 0.55,
            ],
            moving: true,
            activity: 'walking',
          },
        }]);
      }, 180);
      return () => window.clearInterval(interval);
    }

    let active = true;
    const channel = supabase.channel('our-little-forever:home', {
      config: {
        private: true,
        broadcast: { self: false },
        presence: { key: profile.id },
      },
    });

    const syncPresence = () => {
      const presenceState = channel.presenceState<PresenceMeta>();
      const nextPlayers = Object.values(presenceState)
        .flat()
        .filter(player => player.id !== profile.id)
        .map(player => ({
          id: player.id,
          role: player.role,
          displayName: player.displayName,
          pose: {
            ...player.pose,
            activity: player.pose.activity ?? (player.pose.moving ? 'walking' : 'idle'),
            seatId: player.pose.seatId ?? null,
          },
          onlineAt: player.onlineAt,
        }));
      setPlayers(nextPlayers);
    };

    channel.on('presence', { event: 'sync' }, syncPresence);
    channel.on('broadcast', { event: 'pose' }, ({ payload }) => {
      const remote = payload as PoseBroadcast;
      if (remote.id === profile.id || (remote.role !== 'aldane' && remote.role !== 'santana')) return;
      setPlayers(current => current.map(player => player.id === remote.id
        ? {
            ...player,
            pose: {
              ...remote.pose,
              activity: remote.pose.activity ?? (remote.pose.moving ? 'walking' : 'idle'),
              seatId: remote.pose.seatId ?? null,
            },
            onlineAt: remote.onlineAt,
          }
        : player));
    });
    channelRef.current = channel;
    void authorizeRealtime(supabase)
      .then(() => {
        if (!active) return;
        channel.subscribe(status => {
          if (status === 'SUBSCRIBED') {
            setSubscribed(true);
            setConnectionIssue(false);
            void channel.track({
              id: profile.id,
              role: profile.role,
              displayName: profile.display_name,
              pose: initialPoseRef.current,
              onlineAt: new Date().toISOString(),
            } satisfies PresenceMeta);
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setSubscribed(false);
            setConnectionIssue(true);
          }
        });
      })
      .catch(() => {
        if (active) setConnectionIssue(true);
      });

    return () => {
      active = false;
      setSubscribed(false);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [demoMode, profile, supabase]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!profile || !channel || !subscribed) return;
    void channel.send({
      type: 'broadcast',
      event: 'pose',
      payload: {
        id: profile.id,
        role: profile.role,
        displayName: profile.display_name,
        pose,
        onlineAt: new Date().toISOString(),
      } satisfies PoseBroadcast,
    });
  }, [pose, profile, subscribed]);

  const statusText = useMemo(() => {
    if (!profile) return 'Waiting for our space';
    if (connectionIssue) return 'Reconnecting to our space...';
    const otherRole = getOtherRole(profile.role);
    const otherPresent = players.some(player => player.role === otherRole);
    if (otherPresent) return otherRole === 'aldane' ? 'Aldane is here' : 'Santana is here';
    return otherRole === 'aldane' ? 'Waiting for Aldane' : 'Waiting for Santana';
  }, [connectionIssue, players, profile]);

  return { players, statusText };
}
