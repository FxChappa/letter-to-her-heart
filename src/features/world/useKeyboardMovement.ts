import { useEffect, useRef } from 'react';
import type { MovementInput } from './worldTypes';

export function useKeyboardMovement() {
  const inputRef = useRef<MovementInput>({ x: 0, z: 0 });
  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    const update = () => {
      const keys = keysRef.current;
      inputRef.current = {
        x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
        z: (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0),
      };
    };

    const down = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      update();
    };
    const up = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
      update();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return inputRef;
}
