import { useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import type { Profile } from '../../lib/supabase/database.types';
import { useVoiceConnection } from './useVoiceConnection';

export function VoiceControls({
  profile,
  demoMode,
  onVoiceActiveChange,
}: {
  profile: Profile;
  demoMode: boolean;
  onVoiceActiveChange: (active: boolean) => void;
}) {
  const voice = useVoiceConnection(profile, demoMode, onVoiceActiveChange);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = voice.remoteStream;
  }, [voice.remoteStream]);

  const statusText = {
    idle: 'Voice is off',
    joining: 'Asking for microphone...',
    waiting: 'Waiting for the other voice',
    connecting: 'Connecting voices...',
    connected: 'Voice connected',
  }[voice.status];

  return (
    <aside className="voice-controls" aria-label="Live voice controls">
      <audio ref={audioRef} autoPlay playsInline />
      <p>{statusText}</p>
      {voice.error && <span role="alert">{voice.error}</span>}
      <div>
        {voice.status === 'idle' ? (
          <button type="button" onClick={() => void voice.joinVoice()}>
            <Phone size={16} />
            Join voice
          </button>
        ) : (
          <>
            <button type="button" onClick={voice.toggleMute}>
              {voice.muted ? <MicOff size={16} /> : <Mic size={16} />}
              {voice.muted ? 'Unmute' : 'Mute'}
            </button>
            <button type="button" onClick={() => void voice.leaveVoice()}>
              <PhoneOff size={16} />
              Leave
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
