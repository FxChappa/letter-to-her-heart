import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { MovementInput } from './worldTypes';

const joystickRadius = 44;
const deadZone = 0.14;

export function TouchJoystick({ inputRef }: { inputRef: React.MutableRefObject<MovementInput> }) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.min(joystickRadius, Math.hypot(rawX, rawY));
    const angle = Math.atan2(rawY, rawX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    setKnob({ x, y });
    const normalizedX = x / joystickRadius;
    const normalizedZ = -y / joystickRadius;
    const intensity = Math.hypot(normalizedX, normalizedZ);
    inputRef.current = intensity < deadZone
      ? { x: 0, z: 0 }
      : { x: normalizedX, z: normalizedZ };
  };

  const release = useCallback(() => {
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0 });
    inputRef.current = { x: 0, z: 0 };
  }, [inputRef]);

  useEffect(() => {
    const resetWhenHidden = () => {
      if (document.visibilityState !== 'visible') release();
    };
    window.addEventListener('blur', release);
    window.addEventListener('orientationchange', release);
    document.addEventListener('visibilitychange', resetWhenHidden);
    return () => {
      window.removeEventListener('blur', release);
      window.removeEventListener('orientationchange', release);
      document.removeEventListener('visibilitychange', resetWhenHidden);
    };
  }, [release]);

  return (
    <div
      ref={baseRef}
      className="touch-joystick"
      onPointerDown={event => {
        if (pointerIdRef.current !== null) return;
        event.preventDefault();
        pointerIdRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={event => {
        if (pointerIdRef.current === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.preventDefault();
          updateFromPointer(event);
        }
      }}
      onPointerUp={event => {
        if (pointerIdRef.current === event.pointerId) release();
      }}
      onPointerCancel={event => {
        if (pointerIdRef.current === event.pointerId) release();
      }}
      onLostPointerCapture={event => {
        if (pointerIdRef.current === event.pointerId) release();
      }}
      aria-label="Move avatar"
      role="application"
    >
      <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
