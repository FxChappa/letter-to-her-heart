import { PointerEvent, useRef, useState } from 'react';
import type { MovementInput } from './worldTypes';

export function TouchJoystick({ inputRef }: { inputRef: React.MutableRefObject<MovementInput> }) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.min(44, Math.hypot(rawX, rawY));
    const angle = Math.atan2(rawY, rawX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    setKnob({ x, y });
    inputRef.current = { x: x / 44, z: y / 44 };
  };

  const release = () => {
    setKnob({ x: 0, y: 0 });
    inputRef.current = { x: 0, z: 0 };
  };

  return (
    <div
      ref={baseRef}
      className="touch-joystick"
      onPointerDown={event => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      aria-label="Move avatar"
      role="application"
    >
      <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
