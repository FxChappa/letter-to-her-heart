import { describe, expect, it } from 'vitest';
import { getNearbyInteraction, resolveMovement, toCameraRelativeMovement } from './movement';
import type { PlayerPose } from './worldTypes';

const pose: PlayerPose = {
  position: [0, 0, 0],
  rotation: 0,
  moving: false,
  activity: 'idle',
  seatId: null,
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

  it('detects reusable seating and respects occupied seats', () => {
    expect(getNearbyInteraction({ ...pose, position: [2.15, 0, -1.05] })).toEqual({ kind: 'seat', seatId: 'dining-aldane' });
    expect(getNearbyInteraction({ ...pose, position: [2.15, 0, -1.05] }, ['dining-aldane'])).toBeNull();
    expect(getNearbyInteraction({ ...pose, position: [-3.66, 0, 1.38] })).toEqual({ kind: 'seat', seatId: 'sofa-left' });
  });

  it.each([
    { yaw: 0, forward: [0, 1], right: [-1, 0] },
    { yaw: Math.PI / 2, forward: [1, 0], right: [0, 1] },
    { yaw: Math.PI, forward: [0, -1], right: [1, 0] },
    { yaw: Math.PI * 1.5, forward: [-1, 0], right: [0, -1] },
  ])('keeps controls camera-relative at yaw $yaw', ({ yaw, forward, right }) => {
    const worldForward = toCameraRelativeMovement({ x: 0, z: 1 }, yaw);
    const worldRight = toCameraRelativeMovement({ x: 1, z: 0 }, yaw);
    expect(worldForward.x).toBeCloseTo(forward[0], 5);
    expect(worldForward.z).toBeCloseTo(forward[1], 5);
    expect(worldRight.x).toBeCloseTo(right[0], 5);
    expect(worldRight.z).toBeCloseTo(right[1], 5);
  });

  it('normalizes diagonal movement to prevent a speed boost', () => {
    const movement = toCameraRelativeMovement({ x: 1, z: 1 }, 0);
    expect(Math.hypot(movement.x, movement.z)).toBeCloseTo(1, 5);
  });

  it('keeps travel distance stable across frame rates', () => {
    const start = { ...pose, position: [-5, 0, -1] as [number, number, number] };
    const oneFrame = resolveMovement(start, { x: 0, z: 1 }, 1);
    let manyFrames = start;
    for (let frame = 0; frame < 60; frame += 1) {
      manyFrames = resolveMovement(manyFrames, { x: 0, z: 1 }, 1 / 60);
    }
    expect(manyFrames.position[2]).toBeCloseTo(oneFrame.position[2], 5);
  });
});
