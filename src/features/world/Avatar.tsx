import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group, MathUtils } from 'three';
import type { AvatarConfig } from '../../config/avatars';
import type { PlayerPose } from './worldTypes';

export function AvatarBody({ config, subtle = false, seated = false }: { config: AvatarConfig; subtle?: boolean; seated?: boolean }) {
  const scale = config.scale;
  return (
    <group scale={[scale, scale, scale]} position={seated ? [0, 0.18, 0] : [0, 0, 0]}>
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[0.22, 0.62, 5, 10]} />
        <meshStandardMaterial color={config.outfit} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <sphereGeometry args={[0.19, 16, 16]} />
        <meshStandardMaterial color={config.skin} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.34, -0.02]}>
        <sphereGeometry args={[config.key === 'santana' ? 0.22 : 0.19, 14, 14]} />
        <meshStandardMaterial color={config.hair} roughness={0.9} />
      </mesh>
      {config.key === 'santana' && (
        <>
          <mesh position={[-0.13, 1.43, -0.02]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={config.hair} roughness={0.9} />
          </mesh>
          <mesh position={[0.13, 1.43, -0.02]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={config.hair} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.29, 0.18]}>
            <boxGeometry args={[0.34, 0.035, 0.02]} />
            <meshStandardMaterial color={config.accent} roughness={0.42} />
          </mesh>
          <mesh position={[-0.09, 1.29, 0.2]}>
            <torusGeometry args={[0.055, 0.006, 8, 16]} />
            <meshStandardMaterial color={config.accent} roughness={0.36} />
          </mesh>
          <mesh position={[0.09, 1.29, 0.2]}>
            <torusGeometry args={[0.055, 0.006, 8, 16]} />
            <meshStandardMaterial color={config.accent} roughness={0.36} />
          </mesh>
        </>
      )}
      <mesh position={[-0.19, 0.56, 0]}>
        <capsuleGeometry args={[0.06, 0.48, 4, 8]} />
        <meshStandardMaterial color={config.skin} roughness={0.78} />
      </mesh>
      <mesh position={[0.19, 0.56, 0]}>
        <capsuleGeometry args={[0.06, 0.48, 4, 8]} />
        <meshStandardMaterial color={config.skin} roughness={0.78} />
      </mesh>
      <mesh position={seated ? [-0.09, 0.28, 0.18] : [-0.09, 0.1, 0]} rotation={seated ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        <capsuleGeometry args={[0.065, 0.43, 4, 8]} />
        <meshStandardMaterial color={subtle ? '#4f2c39' : config.outfit} roughness={0.82} />
      </mesh>
      <mesh position={seated ? [0.09, 0.28, 0.18] : [0.09, 0.1, 0]} rotation={seated ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        <capsuleGeometry args={[0.065, 0.43, 4, 8]} />
        <meshStandardMaterial color={subtle ? '#4f2c39' : config.outfit} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.18, 0.185]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#241515" />
      </mesh>
    </group>
  );
}

export function RemoteAvatar({ config, pose }: { config: AvatarConfig; pose: PlayerPose }) {
  const groupRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const alpha = Math.min(1, delta * 7.5);
    group.position.x = MathUtils.lerp(group.position.x, pose.position[0], alpha);
    group.position.y = MathUtils.lerp(group.position.y, pose.position[1], alpha);
    group.position.z = MathUtils.lerp(group.position.z, pose.position[2], alpha);
    group.rotation.y = MathUtils.lerp(group.rotation.y, pose.rotation, alpha);
  });

  return (
    <group ref={groupRef} position={pose.position} rotation={[0, pose.rotation, 0]}>
      <AvatarBody config={config} subtle seated={pose.activity === 'sitting'} />
      <mesh position={[0, 1.82 * config.scale, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={config.accent} emissive={config.accent} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
