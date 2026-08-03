import { Canvas } from '@react-three/fiber';
import { Suspense, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Armchair, BookOpen, DoorOpen } from 'lucide-react';
import type { Profile } from '../../lib/supabase/database.types';
import type { DatePhase } from '../date/dateState';
import { TouchJoystick } from './TouchJoystick';
import { HomeScene } from './HomeScene';
import { defaultPose, MovementInput, PlayerPose } from './worldTypes';
import { usePresence } from './usePresence';
import { getSeatById, type WorldInteraction } from './movement';
import { useCoupleInteraction } from './useCoupleInteraction';
import { CoupleInteractionControls } from './CoupleInteractionControls';
import type { RoomMood } from './worldTypes';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';

const canUseWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
};

export function SharedHome({
  profile,
  datePhase,
  roomMood,
  demoMode,
  onOpenMemories,
}: {
  profile: Profile;
  datePhase: DatePhase;
  roomMood: RoomMood;
  demoMode: boolean;
  onOpenMemories: () => void;
}) {
  const webglAvailable = useMemo(() => canUseWebGL(), []);
  const audio = useAmbientAudio();
  const [pose, setPose] = useState<PlayerPose>(defaultPose);
  const [interaction, setInteraction] = useState<WorldInteraction>(null);
  const [seatId, setSeatId] = useState<string | null>(null);
  const presence = usePresence(profile, pose, demoMode);
  const coupleInteraction = useCoupleInteraction(profile, pose, presence.players, demoMode);
  const cameraYaw = useRef(0);
  const mobileInputRef = useRef<MovementInput>({ x: 0, z: 0 });
  const dragRef = useRef<{ pointerId: number | null; x: number }>({ pointerId: null, x: 0 });

  const performInteraction = useCallback(() => {
    if (seatId) {
      setSeatId(null);
      return;
    }
    if (interaction?.kind === 'seat') {
      const occupied = presence.players.some(player => player.pose.seatId === interaction.seatId);
      if (!occupied) setSeatId(interaction.seatId);
      return;
    }
    if (interaction?.kind === 'memories') onOpenMemories();
  }, [interaction, onOpenMemories, presence.players, seatId]);

  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, button, a')) return;
      performInteraction();
    };
    window.addEventListener('keydown', interact);
    return () => window.removeEventListener('keydown', interact);
  }, [performInteraction]);

  useEffect(() => {
    const resetControls = () => {
      dragRef.current = { pointerId: null, x: 0 };
      mobileInputRef.current = { x: 0, z: 0 };
    };
    const resetWhenHidden = () => {
      if (document.visibilityState !== 'visible') resetControls();
    };
    window.addEventListener('blur', resetControls);
    window.addEventListener('orientationchange', resetControls);
    document.addEventListener('visibilitychange', resetWhenHidden);
    return () => {
      window.removeEventListener('blur', resetControls);
      window.removeEventListener('orientationchange', resetControls);
      document.removeEventListener('visibilitychange', resetWhenHidden);
    };
  }, []);

  if (!webglAvailable) {
    return (
      <section className="webgl-fallback">
        <DoorOpen />
        <h2>Your browser cannot open the 3D room right now.</h2>
        <p>Chat and letters still work. Try Safari or Chrome with WebGL enabled.</p>
      </section>
    );
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a, textarea, input, .touch-joystick')) return;
    const touchFirst = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    if (touchFirst && event.clientX < window.innerWidth * 0.42) return;
    if (dragRef.current.pointerId !== null) return;
    event.preventDefault();
    dragRef.current = { pointerId: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - dragRef.current.x;
    dragRef.current.x = event.clientX;
    cameraYaw.current += dx * 0.006;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === event.pointerId) dragRef.current = { pointerId: null, x: 0 };
  };

  return (
    <section
      className="shared-home"
      aria-label="Our Little Forever shared 3D home"
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.15, -5.85], fov: 48 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <HomeScene
            profile={profile}
            datePhase={datePhase}
            roomMood={roomMood}
            remotePlayers={presence.players}
            cameraYaw={cameraYaw}
            mobileInputRef={mobileInputRef}
            onPoseChange={setPose}
            onInteractionChange={setInteraction}
            seatId={seatId}
            occupiedSeatIds={presence.players.map(player => player.pose.seatId).filter((value): value is string => Boolean(value))}
            coupleInteraction={coupleInteraction.active}
            onFootstep={audio.playFootstep}
          />
        </Suspense>
      </Canvas>

      <div className="presence-pill" role="status">{presence.statusText}</div>
      {demoMode && <div className="demo-pill">Demo mode</div>}
      <TouchJoystick inputRef={mobileInputRef} />
      {(interaction || seatId) && !coupleInteraction.active && (
        <button className="interact-button" type="button" onClick={performInteraction}>
          {(seatId || interaction?.kind === 'seat') ? <Armchair size={18} /> : <BookOpen size={18} />}
          {seatId ? 'Stand' : interaction?.kind === 'seat' ? (getSeatById(interaction.seatId)?.label ?? 'Sit') : 'Read letters'}
          <kbd>E</kbd>
        </button>
      )}
      <CoupleInteractionControls interaction={coupleInteraction} demoMode={demoMode} />
    </section>
  );
}
