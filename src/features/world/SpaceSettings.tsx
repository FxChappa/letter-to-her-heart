import { useEffect, useRef, useState } from 'react';
import { CircleHelp, Flame, Moon, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';

export function SpaceSettings({ onShowControls }: { onShowControls: () => void }) {
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
          <button className="space-settings__row" type="button" onClick={() => audio.playing ? audio.stop() : void audio.start()}>
            {audio.playing ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{audio.playing ? 'Atmosphere on' : 'Atmosphere off'}</span>
          </button>
          <div className="space-settings__mood">
            <span>Room mood</span>
            <div role="group" aria-label="Room music mood">
              <button type="button" className={audio.mood === 'evening' ? 'is-selected' : ''} aria-pressed={audio.mood === 'evening'} onClick={() => audio.setMood('evening')}>
                <Moon size={15} /> Evening
              </button>
              <button type="button" className={audio.mood === 'date' ? 'is-selected' : ''} aria-pressed={audio.mood === 'date'} onClick={() => audio.setMood('date')}>
                <Flame size={15} /> Date
              </button>
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
