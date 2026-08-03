import { Canvas } from '@react-three/fiber';
import { Suspense, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Armchair, BookOpen, DoorOpen } from 'lucide-react';
import type { Profile } from '../../lib/supabase/database.types';
import type { DatePhase } from '../date/dateState';
import { TouchJoystick } from './TouchJoystick';
import { HomeScene } from './HomeScene';
import { defaultPose, MovementInput, PlayerPose } from './worldTypes';
import { usePresence } from './usePresence';
import type { InteractionKind } from './movement';

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
  demoMode,
  onOpenMemories,
}: {
  profile: Profile;
  datePhase: DatePhase;
  demoMode: boolean;
  onOpenMemories: () => void;
}) {
  const webglAvailable = useMemo(() => canUseWebGL(), []);
  const [pose, setPose] = useState<PlayerPose>(defaultPose);
  const [interaction, setInteraction] = useState<InteractionKind>(null);
  const [sitting, setSitting] = useState(false);
  const presence = usePresence(profile, pose, demoMode);
  const cameraYaw = useRef(0);
  const mobileInputRef = useRef<MovementInput>({ x: 0, z: 0 });
  const dragRef = useRef<{ pointerId: number | null; x: number }>({ pointerId: null, x: 0 });

  const performInteraction = useCallback(() => {
    if (interaction === 'chair') {
      setSitting(value => !value);
      return;
    }
    if (interaction === 'memories') onOpenMemories();
  }, [interaction, onOpenMemories]);

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
            remotePlayers={presence.players}
            cameraYaw={cameraYaw}
            mobileInputRef={mobileInputRef}
            onPoseChange={setPose}
            onInteractionChange={setInteraction}
            sitting={sitting}
          />
        </Suspense>
      </Canvas>

      <div className="presence-pill" role="status">{presence.statusText}</div>
      {demoMode && <div className="demo-pill">Demo mode</div>}
      <TouchJoystick inputRef={mobileInputRef} />
      {interaction && (
        <button className="interact-button" type="button" onClick={performInteraction}>
          {interaction === 'chair' ? <Armchair size={18} /> : <BookOpen size={18} />}
          {interaction === 'chair' ? (sitting ? 'Stand' : 'Sit') : 'Open memories'}
          <kbd>E</kbd>
        </button>
      )}
    </section>
  );
}
