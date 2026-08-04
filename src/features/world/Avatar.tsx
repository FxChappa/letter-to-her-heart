import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useRef } from 'react';
import { Group, MathUtils } from 'three';
import type { AvatarConfig } from '../../config/avatars';
import { dampAngle } from './movement';
import type { PlayerPose } from './worldTypes';

type AvatarActivity = PlayerPose['activity'];

function Glasses({ color }: { color: string }) {
  return (
    <group position={[0, 1.52, 0.205]}>
      {[-0.082, 0.082].map(x => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.13, 0.012, 0.014]} /><meshStandardMaterial color={color} metalness={0.25} /></mesh>
          <mesh position={[0, -0.045, 0]}><boxGeometry args={[0.13, 0.012, 0.014]} /><meshStandardMaterial color={color} metalness={0.25} /></mesh>
          <mesh position={[-0.059, 0, 0]}><boxGeometry args={[0.012, 0.09, 0.014]} /><meshStandardMaterial color={color} metalness={0.25} /></mesh>
          <mesh position={[0.059, 0, 0]}><boxGeometry args={[0.012, 0.09, 0.014]} /><meshStandardMaterial color={color} metalness={0.25} /></mesh>
        </group>
      ))}
      <mesh><boxGeometry args={[0.035, 0.01, 0.012]} /><meshStandardMaterial color={color} metalness={0.25} /></mesh>
    </group>
  );
}

function Hair({ config }: { config: AvatarConfig }) {
  if (config.key === 'aldane') {
    return (
      <group>
        <mesh position={[0, 1.7, -0.025]} scale={[1.02, 0.62, 0.9]}>
          <sphereGeometry args={[0.22, 14, 10]} />
          <meshStandardMaterial color={config.hair} roughness={0.96} />
        </mesh>
        {[-0.14, -0.05, 0.05, 0.14].map((x, index) => (
          <mesh key={x} position={[x, 1.755 + (index % 2) * 0.012, 0]}>
            <sphereGeometry args={[0.055, 9, 7]} />
            <meshStandardMaterial color={config.hair} roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }

  const curls = [
    [-0.24, 1.6, -0.03], [0.24, 1.6, -0.03], [-0.25, 1.46, -0.04], [0.25, 1.46, -0.04],
    [-0.2, 1.34, -0.06], [0.2, 1.34, -0.06], [-0.15, 1.72, -0.07], [0.15, 1.72, -0.07],
  ] as const;
  const buns = [[-0.16, 1.83, -0.01], [0.16, 1.83, -0.01], [-0.29, 1.72, -0.02], [0.29, 1.72, -0.02]] as const;

  return (
    <group>
      <mesh position={[0, 1.61, -0.1]} scale={[1.05, 1.18, 0.82]}>
        <sphereGeometry args={[0.23, 16, 12]} />
        <meshStandardMaterial color={config.hair} roughness={0.98} />
      </mesh>
      {curls.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.095, 9, 7]} />
          <meshStandardMaterial color={config.hair} roughness={1} />
        </mesh>
      ))}
      {buns.map((position, index) => (
        <mesh key={index} position={position} scale={[1, 0.9, 0.92]}>
          <sphereGeometry args={[0.105, 10, 8]} />
          <meshStandardMaterial color={config.hair} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Face({ config }: { config: AvatarConfig }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]} scale={[0.96, 1.08, 0.9]}>
        <sphereGeometry args={[0.21, 18, 16]} />
        <meshStandardMaterial color={config.skin} roughness={0.72} />
      </mesh>
      <mesh position={[-0.066, 1.53, 0.19]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#211315" /></mesh>
      <mesh position={[0.066, 1.53, 0.19]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#211315" /></mesh>
      <mesh position={[0, 1.48, 0.2]} scale={[0.55, 0.9, 0.45]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={config.skin} roughness={0.7} /></mesh>
      {config.key === 'aldane' && (
        <>
          <mesh position={[0, 1.405, 0.13]} scale={[1.05, 0.62, 0.42]}>
            <sphereGeometry args={[0.17, 14, 10]} />
            <meshStandardMaterial color="#241617" roughness={0.96} />
          </mesh>
          <mesh position={[0, 1.455, 0.196]} scale={[1, 0.4, 0.45]}>
            <sphereGeometry args={[0.085, 12, 8]} />
            <meshStandardMaterial color={config.skin} roughness={0.74} />
          </mesh>
        </>
      )}
      <mesh position={[0, 1.405, 0.205]} scale={[1, 0.35, 0.45]}>
        <sphereGeometry args={[0.052, 10, 8]} />
        <meshStandardMaterial color={config.key === 'santana' ? '#a9625d' : '#694033'} roughness={0.75} />
      </mesh>
      {config.glasses && <Glasses color={config.accent} />}
      <Hair config={config} />
    </group>
  );
}

function Necklace({ config }: { config: AvatarConfig }) {
  const beadColor = config.key === 'aldane' ? '#d8d2c9' : config.accent;
  return (
    <group position={[0, 1.31, 0.206]}>
      {[-0.11, -0.074, -0.038, 0, 0.038, 0.074, 0.11].map((x, index) => (
        <mesh key={x} position={[x, -Math.abs(x) * 0.35, -Math.abs(index - 3) * 0.002]}>
          <sphereGeometry args={[config.key === 'aldane' ? 0.012 : 0.009, 7, 6]} />
          <meshStandardMaterial color={beadColor} metalness={0.62} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -0.035, 0.003]}>
        <octahedronGeometry args={[config.key === 'aldane' ? 0.025 : 0.022, 0]} />
        <meshStandardMaterial color={config.accent} metalness={0.62} roughness={0.28} />
      </mesh>
    </group>
  );
}

function Shoe({ feminine }: { feminine: boolean }) {
  const upper = feminine ? '#f3e8dc' : '#18161a';
  return (
    <group>
      <mesh position={[0, -0.012, 0.025]} scale={[feminine ? 0.15 : 0.17, 0.065, 0.29]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={upper} roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.035, 0.035]} scale={[feminine ? 0.16 : 0.18, 0.025, 0.31]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={feminine ? '#d6af76' : '#eee9e1'} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.008, 0.17]} scale={[feminine ? 0.073 : 0.09, 0.052, 0.085]}>
        <sphereGeometry args={[1, 10, 7]} />
        <meshStandardMaterial color={upper} roughness={0.72} />
      </mesh>
      {!feminine && [-0.035, 0, 0.035].map(z => (
        <mesh key={z} position={[0, 0.036, z + 0.045]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />
          <meshStandardMaterial color="#c5beb6" roughness={0.62} />
        </mesh>
      ))}
      {feminine && <mesh position={[0, 0.018, 0.1]}><torusGeometry args={[0.07, 0.009, 6, 16]} /><meshStandardMaterial color="#d6af76" metalness={0.35} /></mesh>}
    </group>
  );
}

function FlowerBouquet() {
  const flowers = [
    [-0.13, 0.27, 0.01, '#8d2447'],
    [0, 0.34, 0.035, '#f1d4be'],
    [0.14, 0.25, 0, '#a83d5d'],
    [-0.055, 0.19, 0.08, '#f4d59a'],
    [0.075, 0.16, 0.09, '#7b284c'],
  ] as const;

  return (
    <group position={[0, 0.82, 0.47]} rotation={[-0.14, 0, 0]}>
      {[-0.1, -0.04, 0.03, 0.1].map((x, index) => (
        <mesh key={x} position={[x, 0.03 + index * 0.012, 0]} rotation={[0, 0, x * 1.7]}>
          <cylinderGeometry args={[0.012, 0.015, 0.52, 7]} />
          <meshStandardMaterial color="#527044" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.17, 0.34, 10]} />
        <meshStandardMaterial color="#ead7bd" roughness={0.9} />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * 0.14, 0.09, 0.01]} rotation={[0, 0, side * -0.7]} scale={[1, 1.8, 0.6]}>
          <sphereGeometry args={[0.07, 9, 7]} />
          <meshStandardMaterial color="#607c50" roughness={0.94} />
        </mesh>
      ))}
      {flowers.map(([x, y, z, color], flowerIndex) => (
        <group key={`${x}-${y}`} position={[x, y, z]}>
          {Array.from({ length: 6 }, (_, petalIndex) => {
            const angle = petalIndex / 6 * Math.PI * 2;
            return (
              <mesh key={petalIndex} position={[Math.cos(angle) * 0.055, Math.sin(angle) * 0.055, 0]} scale={[1.15, 0.82, 0.55]}>
                <sphereGeometry args={[0.052, 9, 7]} />
                <meshStandardMaterial color={color} roughness={0.82} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, 0.025]}>
            <sphereGeometry args={[0.035, 9, 7]} />
            <meshStandardMaterial color={flowerIndex % 2 ? '#d7a74f' : '#e5bd6a'} roughness={0.72} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.025, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.075, 0.012, 6, 18]} />
        <meshStandardMaterial color="#7b284c" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function AvatarBody({
  config,
  subtle = false,
  seated = false,
  activity = 'idle',
  activityRef,
}: {
  config: AvatarConfig;
  subtle?: boolean;
  seated?: boolean;
  activity?: AvatarActivity;
  activityRef?: MutableRefObject<AvatarActivity>;
}) {
  const scale = config.scale;
  const bodyRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const bouquetRef = useRef<Group>(null);
  const motionRef = useRef(0);

  useFrame(({ clock }, delta) => {
    const currentActivity = activityRef?.current ?? activity;
    const moving = currentActivity === 'walking';
    const kissing = currentActivity === 'kiss';
    const dancing = currentActivity === 'dance';
    const presentingFlowers = currentActivity === 'flowers';
    motionRef.current = MathUtils.lerp(motionRef.current, moving ? 1 : 0, 1 - Math.exp(-9 * Math.min(delta, 0.05)));
    const stride = Math.sin(clock.elapsedTime * 8.4) * 0.58 * motionRef.current;
    const idle = Math.sin(clock.elapsedTime * 1.7) * 0.025;
    const danceStep = Math.sin(clock.elapsedTime * 1.55) * 0.1;
    if (bodyRef.current) {
      const interactionLift = kissing ? (config.key === 'aldane' ? -0.06 : 0.13) : dancing ? Math.abs(Math.sin(clock.elapsedTime * 1.55)) * 0.012 : presentingFlowers ? 0.01 : 0;
      bodyRef.current.position.y = (seated ? 0.13 : 0) + interactionLift + Math.abs(Math.sin(clock.elapsedTime * 8.4)) * 0.018 * motionRef.current + idle * 0.2;
      bodyRef.current.rotation.x = MathUtils.lerp(bodyRef.current.rotation.x, kissing ? 0.03 : 0, 1 - Math.exp(-7 * delta));
      bodyRef.current.rotation.z = dancing ? Math.sin(clock.elapsedTime * 1.55) * 0.055 : 0;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = seated ? -0.25 : dancing ? -1.02 + Math.sin(clock.elapsedTime * 1.55) * 0.08 : kissing ? -0.55 : presentingFlowers ? (config.key === 'aldane' ? -1.08 : -0.82) : stride + idle;
      leftArmRef.current.rotation.z = dancing ? -0.2 : presentingFlowers ? 0.22 : 0;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = seated ? -0.25 : dancing ? -1.02 - Math.sin(clock.elapsedTime * 1.55) * 0.08 : kissing ? -0.55 : presentingFlowers ? (config.key === 'aldane' ? -1.08 : -0.82) : -stride - idle;
      rightArmRef.current.rotation.z = dancing ? 0.2 : presentingFlowers ? -0.22 : 0;
    }
    if (bouquetRef.current) bouquetRef.current.visible = presentingFlowers;
    if (leftLegRef.current) leftLegRef.current.rotation.x = seated ? -Math.PI / 2 : dancing ? danceStep : -stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = seated ? -Math.PI / 2 : dancing ? -danceStep : stride;
  });

  const trousers = subtle ? '#3c2733' : config.outfit;
  const isSantana = config.key === 'santana';

  return (
    <group ref={bodyRef} scale={[scale, scale, scale]}>
      {isSantana ? (
        <>
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.24, 0.34, 0.62, 18]} />
            <meshStandardMaterial color={config.outfit} roughness={0.86} />
          </mesh>
          <mesh position={[0, 1.08, 0]} scale={[1.12, 1, 0.84]}>
            <capsuleGeometry args={[0.24, 0.34, 6, 12]} />
            <meshStandardMaterial color={config.outfit} roughness={0.84} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.98, 0]} scale={[1.2, 1, 0.78]}>
            <cylinderGeometry args={[0.26, 0.215, 0.78, 12]} />
            <meshStandardMaterial color={config.outfit} roughness={0.9} />
          </mesh>
          {[-1, 1].map(side => (
            <mesh key={side} position={[side * 0.275, 1.16, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.075, 0.12, 4, 8]} />
              <meshStandardMaterial color={config.outfit} roughness={0.9} />
            </mesh>
          ))}
        </>
      )}

      <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.075, 0.085, 0.16, 12]} /><meshStandardMaterial color={config.skin} roughness={0.74} /></mesh>
      <Face config={config} />
      <Necklace config={config} />

      {[-1, 1].map(side => (
        <group key={`arm-${side}`} ref={side < 0 ? leftArmRef : rightArmRef} position={[side * (isSantana ? 0.27 : 0.31), 1.12, 0]} rotation={[0, 0, side * (isSantana ? -0.08 : -0.035)]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[isSantana ? 0.06 : 0.07, 0.43, 4, 8]} />
            <meshStandardMaterial color={config.skin} roughness={0.78} />
          </mesh>
          <mesh position={[0, -0.55, 0.015]}><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color={config.skin} roughness={0.78} /></mesh>
        </group>
      ))}

      {[-1, 1].map(side => (
        <group key={`leg-${side}`} ref={side < 0 ? leftLegRef : rightLegRef} position={[side * (isSantana ? 0.115 : 0.13), 0.52, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <capsuleGeometry args={[isSantana ? 0.065 : 0.08, 0.4, 4, 8]} />
            <meshStandardMaterial color={isSantana ? config.skin : trousers} roughness={0.86} />
          </mesh>
          <group position={[0, -0.53, 0.055]}><Shoe feminine={isSantana} /></group>
        </group>
      ))}
      {!isSantana && <group ref={bouquetRef} visible={activity === 'flowers'}><FlowerBouquet /></group>}
    </group>
  );
}

export function RemoteAvatar({ config, pose }: { config: AvatarConfig; pose: PlayerPose }) {
  const groupRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const frameDelta = Math.min(delta, 0.05);
    const alpha = 1 - Math.exp(-9 * frameDelta);
    group.position.x = MathUtils.lerp(group.position.x, pose.position[0], alpha);
    group.position.y = MathUtils.lerp(group.position.y, pose.position[1], alpha);
    group.position.z = MathUtils.lerp(group.position.z, pose.position[2], alpha);
    group.rotation.y = dampAngle(group.rotation.y, pose.rotation, alpha);
  });

  return (
    <group ref={groupRef} position={pose.position} rotation={[0, pose.rotation, 0]}>
      <AvatarBody config={config} subtle seated={pose.activity === 'sitting'} activity={pose.activity} />
      <mesh position={[0, 1.82 * config.scale, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={config.accent} emissive={config.accent} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
