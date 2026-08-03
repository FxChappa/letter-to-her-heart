import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ambientTracks, getAmbientTrack } from '../../config/music';
import type { AmbientTrack } from '../../config/music';
import type { RoomMood } from '../world/worldTypes';

type AmbientAudioContextValue = {
  playing: boolean;
  volume: number;
  voiceDucked: boolean;
  mood: RoomMood;
  start: () => Promise<boolean>;
  stop: () => void;
  setVolume: (volume: number) => void;
  setVoiceDucked: (active: boolean) => void;
  setMood: (mood: RoomMood) => void;
  playFootstep: () => void;
  tracks: AmbientTrack[];
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);
const volumeStorageKey = 'our-little-forever-atmosphere-volume';
const moodStorageKey = 'our-little-forever-atmosphere-track';

const clampVolume = (value: number) => Math.max(0.1, Math.min(0.74, value));

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const startingRef = useRef<Promise<boolean> | null>(null);
  const savedVolume = Number(localStorage.getItem(volumeStorageKey));
  const savedMood = localStorage.getItem(moodStorageKey) as RoomMood | null;
  const initialVolume = Number.isFinite(savedVolume) && savedVolume > 0 ? clampVolume(savedVolume) : 0.52;
  const initialMood: RoomMood = savedMood === 'home' || savedMood === 'cozy' || savedMood === 'date' ? savedMood : 'home';
  const volumeRef = useRef(initialVolume);
  const voiceDuckedRef = useRef(false);
  const moodRef = useRef<RoomMood>(initialMood);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [voiceDucked, setVoiceDuckedState] = useState(false);
  const [mood, setMoodState] = useState<RoomMood>(initialMood);

  const targetVolume = useCallback(() => volumeRef.current * (voiceDuckedRef.current ? 0.28 : 1), []);

  const applyVolume = useCallback((seconds = 0.18) => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.linearRampToValueAtTime(targetVolume(), context.currentTime + seconds);
  }, [targetVolume]);

  const scheduleChord = useCallback((context: AudioContext, destination: AudioNode, index: number) => {
    const track = getAmbientTrack(moodRef.current);
    const dateMood = track.id === 'date';
    const chord = track.progressions[index % track.progressions.length];
    const now = context.currentTime;

    chord.forEach((frequency, noteIndex) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = noteIndex === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency / (noteIndex === 0 ? 2 : 1), now);
      oscillator.detune.setValueAtTime((noteIndex - 1.5) * 2.2, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(track.filterFrequency + noteIndex * 80, now);
      filter.Q.value = 0.35;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(noteIndex === 0 ? (dateMood ? 0.105 : 0.09) : (dateMood ? 0.029 : 0.034), now + 2.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 11.8);
      oscillator.connect(filter).connect(gain).connect(destination);
      oscillator.start(now);
      oscillator.stop(now + 12);
    });

    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(chord[2] * 2, now + 1.5);
    shimmerGain.gain.setValueAtTime(0.0001, now + 1.5);
    shimmerGain.gain.exponentialRampToValueAtTime(0.014, now + 2.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);
    shimmer.connect(shimmerGain).connect(destination);
    shimmer.start(now + 1.5);
    shimmer.stop(now + 6);
  }, []);

  const stop = useCallback(() => {
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    schedulerRef.current = null;
    startingRef.current = null;
    const context = contextRef.current;
    const master = masterRef.current;
    if (context && master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
      window.setTimeout(() => void context.close(), 800);
    } else if (context) {
      void context.close();
    }
    contextRef.current = null;
    masterRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (contextRef.current?.state === 'running' && schedulerRef.current !== null) {
      setPlaying(true);
      return true;
    }
    if (startingRef.current) return startingRef.current;

    const attempt = (async () => {
      const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return false;

      const context = new AudioContextClass();
      try {
        await context.resume();
      } catch {
        void context.close();
        return false;
      }

      if (context.state !== 'running') {
        void context.close();
        return false;
      }

      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const warmFilter = context.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.value = 1350;
      warmFilter.Q.value = 0.3;
      compressor.threshold.value = -24;
      compressor.knee.value = 20;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.1;
      compressor.release.value = 0.75;
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.connect(warmFilter).connect(compressor).connect(context.destination);
      master.gain.exponentialRampToValueAtTime(targetVolume(), context.currentTime + 1.6);

      let chordIndex = 0;
      scheduleChord(context, master, chordIndex++);
      schedulerRef.current = window.setInterval(() => scheduleChord(context, master, chordIndex++), getAmbientTrack(moodRef.current).intervalMs);
      contextRef.current = context;
      masterRef.current = master;
      setPlaying(true);
      return true;
    })();

    startingRef.current = attempt;
    const result = await attempt;
    startingRef.current = null;
    return result;
  }, [scheduleChord, targetVolume]);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = clampVolume(nextVolume);
    volumeRef.current = safeVolume;
    setVolumeState(safeVolume);
    localStorage.setItem(volumeStorageKey, String(safeVolume));
    applyVolume();
  }, [applyVolume]);

  const setVoiceDucked = useCallback((active: boolean) => {
    voiceDuckedRef.current = active;
    setVoiceDuckedState(active);
    applyVolume(0.28);
  }, [applyVolume]);

  const setMood = useCallback((nextMood: RoomMood) => {
    if (moodRef.current === nextMood) return;
    moodRef.current = nextMood;
    setMoodState(nextMood);
    localStorage.setItem(moodStorageKey, nextMood);
    if (playing) {
      stop();
      window.setTimeout(() => void start(), 820);
    }
  }, [playing, start, stop]);

  const playFootstep = useCallback(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master || context.state !== 'running') return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(78 + Math.random() * 12, now);
    filter.type = 'lowpass';
    filter.frequency.value = 190;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(voiceDuckedRef.current ? 0.006 : 0.013, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    oscillator.connect(filter).connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const value = useMemo<AmbientAudioContextValue>(() => ({
    playing,
    volume,
    voiceDucked,
    mood,
    start,
    stop,
    setVolume,
    setVoiceDucked,
    setMood,
    playFootstep,
    tracks: ambientTracks,
  }), [playing, volume, voiceDucked, mood, start, stop, setVolume, setVoiceDucked, setMood, playFootstep]);

  return <AmbientAudioContext.Provider value={value}>{children}</AmbientAudioContext.Provider>;
}

export const useAmbientAudio = (): AmbientAudioContextValue => {
  const context = useContext(AmbientAudioContext);
  if (!context) throw new Error('useAmbientAudio must be used within AmbientAudioProvider');
  return context;
};
