import { useEffect, useRef, useState } from 'react';
import { BookHeart, CircleHelp, Flame, House, Moon, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import type { Profile } from '../../lib/supabase/database.types';
import type { RoomMood } from './worldTypes';

const moodIcons = { home: House, cozy: Moon, date: Flame } as const;

export function SpaceSettings({ profile, roomMood, onMoodChange, onShowControls, onPreviewNewChapter }: {
  profile: Profile;
  roomMood: RoomMood;
  onMoodChange: (mood: RoomMood) => void;
  onShowControls: () => void;
  onPreviewNewChapter: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const audio = useAmbientAudio();

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <div className="space-settings" ref={panelRef}>
      <button type="button" onClick={() => setOpen(value => !value)} aria-label="Open settings" title="Settings">
        <Settings size={16} />
        <span>Settings</span>
      </button>
      {open && (
        <div className="space-settings__panel" role="dialog" aria-label="Our Little Forever settings">
          <header>
            <strong>Settings</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close settings"><X size={16} /></button>
          </header>
          <button
            className="space-settings__row"
            type="button"
            onClick={() => {
              setOpen(false);
              onShowControls();
            }}
          >
            <CircleHelp size={17} />
            <span>How to move</span>
          </button>
          {profile.role === 'aldane' && (
            <button className="space-settings__row" type="button" onClick={() => { setOpen(false); onPreviewNewChapter(); }}>
              <BookHeart size={17} />
              <span>Preview A New Chapter</span>
            </button>
          )}
          <button className="space-settings__row" type="button" onClick={() => audio.playing ? audio.stop() : void audio.start()}>
            {audio.playing ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{audio.playing ? 'Atmosphere on' : 'Atmosphere off'}</span>
          </button>
          <div className="space-settings__mood">
            <span>Room mood</span>
            <div role="group" aria-label="Room and music mood">
              {audio.tracks.filter(track => track.id !== 'date' || profile.role === 'aldane').map(track => {
                const Icon = moodIcons[track.id];
                return (
                  <button key={track.id} type="button" className={roomMood === track.id ? 'is-selected' : ''} aria-pressed={roomMood === track.id} onClick={() => onMoodChange(track.id)} title={track.description}>
                    <Icon size={15} /> {track.name}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="space-settings__volume">
            <span>Atmosphere volume</span>
            <input
              type="range"
              min="0.1"
              max="0.74"
              step="0.01"
              value={audio.volume}
              onChange={event => audio.setVolume(Number(event.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
