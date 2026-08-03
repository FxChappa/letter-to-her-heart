import type { RoomMood } from '../features/world/worldTypes';

export type AmbientTrack = {
  id: RoomMood;
  name: string;
  description: string;
  filterFrequency: number;
  intervalMs: number;
  progressions: number[][];
};

export const ambientTracks: AmbientTrack[] = [
  {
    id: 'home',
    name: 'Homecoming',
    description: 'Warm, clear and gentle',
    filterFrequency: 860,
    intervalMs: 9200,
    progressions: [[146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 246.94], [110, 146.83, 174.61, 220], [123.47, 146.83, 185, 220]],
  },
  {
    id: 'cozy',
    name: 'Quiet Evening',
    description: 'Softer lamps and slower chords',
    filterFrequency: 710,
    intervalMs: 10400,
    progressions: [[130.81, 164.81, 220, 261.63], [116.54, 146.83, 196, 233.08], [123.47, 155.56, 185, 220], [110, 146.83, 174.61, 207.65]],
  },
  {
    id: 'date',
    name: 'Candlelight',
    description: 'A quiet romantic arrangement',
    filterFrequency: 620,
    intervalMs: 11200,
    progressions: [[130.81, 164.81, 196, 246.94], [116.54, 146.83, 174.61, 220], [123.47, 155.56, 185, 233.08], [110, 138.59, 164.81, 220]],
  },
];

export const getAmbientTrack = (id: RoomMood): AmbientTrack =>
  ambientTracks.find(track => track.id === id) ?? ambientTracks[0];
