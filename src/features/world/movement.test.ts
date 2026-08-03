import { describe, expect, it } from 'vitest';
import { isNearDiningChair, resolveMovement } from './movement';
import type { PlayerPose } from './worldTypes';

const pose: PlayerPose = {
  position: [0, 0, 0],
  rotation: 0,
  moving: false,
  activity: 'idle',
  room: 'home',
};

describe('avatar movement', () => {
  it('moves the avatar from keyboard or joystick input', () => {
    const next = resolveMovement(pose, { x: 1, z: 0 }, 1);
    expect(next.position[0]).toBeGreaterThan(0);
    expect(next.moving).toBe(true);
    expect(next.activity).toBe('walking');
  });

  it('does not mark the avatar moving without input', () => {
    const next = resolveMovement(pose, { x: 0, z: 0 }, 1);
    expect(next.moving).toBe(false);
    expect(next.activity).toBe('idle');
  });

  it('detects dining chair interaction range', () => {
    expect(isNearDiningChair({ ...pose, position: [2.15, 0, -1.05] })).toBe(true);
    expect(isNearDiningChair({ ...pose, position: [-5, 0, 4] })).toBe(false);
  });
});
