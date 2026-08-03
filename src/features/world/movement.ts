import type { MovementInput, PlayerPose, VectorTuple } from './worldTypes';

type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const bounds: Rect = { minX: -6, maxX: 6, minZ: -4.2, maxZ: 4.2 };

const obstacles: Rect[] = [
  { minX: -3.8, maxX: -1.4, minZ: 0.7, maxZ: 2.2 },
  { minX: -4.9, maxX: -3.4, minZ: 2.0, maxZ: 3.4 },
  { minX: -0.8, maxX: 1.1, minZ: -0.8, maxZ: 0.8 },
  { minX: 2.1, maxX: 4.2, minZ: -2.9, maxZ: -1.3 },
  { minX: 0.1, maxX: 4.9, minZ: 2.9, maxZ: 4.2 },
  { minX: -5.9, maxX: -4.7, minZ: -4.1, maxZ: -2.6 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const isInsideObstacle = (x: number, z: number) =>
  obstacles.some(obstacle => x >= obstacle.minX && x <= obstacle.maxX && z >= obstacle.minZ && z <= obstacle.maxZ);

export type InteractionKind = 'chair' | 'memories' | null;

const diningChairs: VectorTuple[] = [
  [2.15, 0.18, -1.05],
  [4.05, 0.18, -1.05],
];

const distanceTo = (pose: PlayerPose, target: VectorTuple): number =>
  Math.hypot(pose.position[0] - target[0], pose.position[2] - target[2]);

export const resolveMovement = (pose: PlayerPose, input: MovementInput, deltaSeconds: number): PlayerPose => {
  const length = Math.hypot(input.x, input.z);
  if (length < 0.01) return { ...pose, moving: false, activity: 'idle' };

  const speed = 2.35;
  const nx = input.x / length;
  const nz = input.z / length;
  const current = pose.position;
  let nextX = clamp(current[0] + nx * speed * deltaSeconds, bounds.minX, bounds.maxX);
  let nextZ = clamp(current[2] + nz * speed * deltaSeconds, bounds.minZ, bounds.maxZ);

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
    room: 'home',
  };
};

export const isNearDiningChair = (pose: PlayerPose): boolean => {
  return diningChairs.some(chair => distanceTo(pose, chair) < 1.3);
};

export const getNearestDiningChair = (pose: PlayerPose): VectorTuple =>
  diningChairs.reduce((nearest, chair) => distanceTo(pose, chair) < distanceTo(pose, nearest) ? chair : nearest);

export const getNearbyInteraction = (pose: PlayerPose): InteractionKind => {
  if (isNearDiningChair(pose)) return 'chair';
  if (distanceTo(pose, [-5.45, 0, 1.35]) < 1.25) return 'memories';
  return null;
};
