import type { ProfileRole } from '../../lib/supabase/database.types';

export type RoomMood = 'home' | 'cozy' | 'date';

export type VectorTuple = [number, number, number];

export type PlayerPose = {
  position: VectorTuple;
  rotation: number;
  moving: boolean;
  activity: 'idle' | 'walking' | 'sitting' | 'kiss' | 'dance';
  seatId: string | null;
  room: 'home';
};

export type PresencePlayer = {
  id: string;
  role: ProfileRole;
  displayName: string;
  pose: PlayerPose;
  onlineAt: string;
};

export type MovementInput = {
  x: number;
  z: number;
};

export const defaultPose: PlayerPose = {
  position: [-4.6, 0, -2.6],
  rotation: 0,
  moving: false,
  activity: 'idle',
  seatId: null,
  room: 'home',
};
