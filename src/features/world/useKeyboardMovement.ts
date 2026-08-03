import { useEffect, useRef } from 'react';
import type { MovementInput } from './worldTypes';

const movementKeys = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
]);

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches('input, textarea, select');
};

export function useKeyboardMovement() {
  const inputRef = useRef<MovementInput>({ x: 0, z: 0 });
  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    const update = () => {
      const keys = keysRef.current;
      inputRef.current = {
        x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
        z: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0),
      };
    };

    const reset = () => {
      keysRef.current.clear();
      update();
    };

    const down = (event: KeyboardEvent) => {
      if (!movementKeys.has(event.code) || isEditableTarget(event.target)) return;
      event.preventDefault();
      keysRef.current.add(event.code);
      update();
    };
    const up = (event: KeyboardEvent) => {
      if (!movementKeys.has(event.code) || !keysRef.current.has(event.code)) return;
      event.preventDefault();
      keysRef.current.delete(event.code);
      update();
    };

    const visibility = () => {
      if (document.visibilityState !== 'visible') reset();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return inputRef;
}
