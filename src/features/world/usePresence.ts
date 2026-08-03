import { useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase/client';
import { getOtherRole } from '../../lib/supabase/profile';
import type { Profile } from '../../lib/supabase/database.types';
import type { PlayerPose, PresencePlayer } from './worldTypes';

type PresenceMeta = PresencePlayer & { presence_ref?: string };

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

    const channel = supabase.channel('our-little-forever:home', {
      config: {
        private: true,
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
          },
          onlineAt: player.onlineAt,
        }));
      setPlayers(nextPlayers);
    };

    channel.on('presence', { event: 'sync' }, syncPresence);
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

    channelRef.current = channel;

    return () => {
      setSubscribed(false);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [demoMode, profile, supabase]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!profile || !channel || !subscribed) return;
    void channel.track({
      id: profile.id,
      role: profile.role,
      displayName: profile.display_name,
      pose,
      onlineAt: new Date().toISOString(),
    } satisfies PresenceMeta);
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
