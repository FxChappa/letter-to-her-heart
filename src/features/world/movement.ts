import type { MovementInput, PlayerPose, VectorTuple } from './worldTypes';

type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const bounds: Rect = { minX: -6, maxX: 6, minZ: -4.2, maxZ: 4.2 };

const obstacles: Rect[] = [
  { minX: -4.65, maxX: -1.6, minZ: 1.0, maxZ: 2.15 },
  { minX: -4.85, maxX: -4.0, minZ: 1.7, maxZ: 3.15 },
  { minX: -3.4, maxX: -2.0, minZ: 0.05, maxZ: 0.85 },
  { minX: -5.95, maxX: -5.4, minZ: -2.15, maxZ: -0.75 },
  { minX: 1.65, maxX: 4.55, minZ: -2.85, maxZ: -1.35 },
  { minX: 0.05, maxX: 5.2, minZ: 3.0, maxZ: 4.2 },
  { minX: -0.8, maxX: 2.25, minZ: 1.6, maxZ: 2.7 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const isInsideObstacle = (x: number, z: number) =>
  obstacles.some(obstacle => x >= obstacle.minX && x <= obstacle.maxX && z >= obstacle.minZ && z <= obstacle.maxZ);

export const normalizeMovementInput = (input: MovementInput): MovementInput => {
  const length = Math.hypot(input.x, input.z);
  if (length <= 1) return input;
  return { x: input.x / length, z: input.z / length };
};

export const toCameraRelativeMovement = (input: MovementInput, cameraYaw: number): MovementInput => {
  const normalized = normalizeMovementInput(input);
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);

  return {
    x: normalized.z * sin - normalized.x * cos,
    z: normalized.z * cos + normalized.x * sin,
  };
};

export const dampAngle = (current: number, target: number, smoothing: number): number => {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * smoothing;
};

export type SeatTarget = {
  id: string;
  label: string;
  position: VectorTuple;
  exitPosition: VectorTuple;
  rotation: number;
};

export type WorldInteraction =
  | { kind: 'seat'; seatId: string }
  | { kind: 'memories' }
  | null;

export const seatTargets: SeatTarget[] = [
  { id: 'sofa-left', label: 'Sit on the sofa', position: [-3.66, 0.18, 1.38], exitPosition: [-3.66, 0, 0.68], rotation: Math.PI },
  { id: 'sofa-center', label: 'Sit on the sofa', position: [-2.96, 0.18, 1.38], exitPosition: [-2.96, 0, 0.68], rotation: Math.PI },
  { id: 'sofa-right', label: 'Sit on the sofa', position: [-2.26, 0.18, 1.38], exitPosition: [-2.26, 0, 0.68], rotation: Math.PI },
  { id: 'living-chair', label: 'Sit in the chair', position: [-1.32, 0.18, 2.12], exitPosition: [-1.32, 0, 1.35], rotation: Math.PI },
  { id: 'dining-aldane', label: 'Sit at the table', position: [2.15, 0.18, -1.05], exitPosition: [2.15, 0, -0.52], rotation: Math.PI },
  { id: 'dining-santana', label: 'Sit at the table', position: [4.05, 0.18, -1.05], exitPosition: [4.05, 0, -0.52], rotation: Math.PI },
  { id: 'dining-south-left', label: 'Sit at the table', position: [2.15, 0.18, -3.15], exitPosition: [2.15, 0, -3.72], rotation: 0 },
  { id: 'dining-south-right', label: 'Sit at the table', position: [4.05, 0.18, -3.15], exitPosition: [4.05, 0, -3.72], rotation: 0 },
];

const distanceTo = (pose: PlayerPose, target: VectorTuple): number =>
  Math.hypot(pose.position[0] - target[0], pose.position[2] - target[2]);

export const resolveMovement = (pose: PlayerPose, input: MovementInput, deltaSeconds: number): PlayerPose => {
  const length = Math.hypot(input.x, input.z);
  if (length < 0.01) return { ...pose, moving: false, activity: 'idle' };

  const speed = 2.35;
  const nx = input.x / length;
  const nz = input.z / length;
  const intensity = Math.min(1, length);
  const current = pose.position;
  let nextX = clamp(current[0] + nx * speed * intensity * deltaSeconds, bounds.minX, bounds.maxX);
  let nextZ = clamp(current[2] + nz * speed * intensity * deltaSeconds, bounds.minZ, bounds.maxZ);

  if (isInsideObstacle(nextX, nextZ)) {
    if (!isInsideObstacle(nextX, current[2])) {
      nextZ = current[2];
    } else if (!isInsideObstacle(current[0], nextZ)) {
      nextX = current[0];
    } else {
      nextX = current[0];
      nextZ = current[2];
    }
  }

  const rotation = Math.atan2(nx, nz);
  return {
    position: [nextX, current[1], nextZ] as VectorTuple,
    rotation,
    moving: true,
    activity: 'walking',
    seatId: null,
    room: 'home',
  };
};

export const getSeatById = (seatId: string | null): SeatTarget | null =>
  seatTargets.find(seat => seat.id === seatId) ?? null;

export const getNearbyInteraction = (pose: PlayerPose, occupiedSeatIds: string[] = []): WorldInteraction => {
  const nearbySeat = seatTargets
    .filter(seat => !occupiedSeatIds.includes(seat.id))
    .map(seat => ({ seat, distance: distanceTo(pose, seat.position) }))
    .filter(candidate => candidate.distance < 1.05)
    .sort((a, b) => a.distance - b.distance)[0]?.seat;
  if (nearbySeat) return { kind: 'seat', seatId: nearbySeat.id };
  if (distanceTo(pose, [-5.45, 0, 1.35]) < 1.25) return { kind: 'memories' };
  return null;
};
