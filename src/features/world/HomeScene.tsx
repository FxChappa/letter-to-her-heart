import { useFrame } from '@react-three/fiber';
import { ContactShadows, Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { AmbientLight, Color, DirectionalLight, Group, MathUtils, PointLight, Vector3 } from 'three';
import { avatarConfigs, childNpcConfigs } from '../../config/avatars';
import type { AvatarKey, Profile } from '../../lib/supabase/database.types';
import type { DatePhase } from '../date/dateState';
import { AvatarBody, RemoteAvatar } from './Avatar';
import { dampAngle, getNearbyInteraction, getSeatById, resolveMovement, toCameraRelativeMovement, type WorldInteraction } from './movement';
import { useKeyboardMovement } from './useKeyboardMovement';
import type { MovementInput, PlayerPose, PresencePlayer, RoomMood } from './worldTypes';
import type { ActiveCoupleInteraction } from './coupleState';

function Box({
  position,
  scale,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  );
}

function Cylinder({
  position,
  scale,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <cylinderGeometry args={[1, 1, 1, 28]} />
      <meshStandardMaterial color={color} roughness={0.76} />
    </mesh>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder position={[0, 0.16, 0]} scale={[0.18, 0.32, 0.18]} color="#7d5b42" />
      {[0, 1, 2, 3, 4].map(index => (
        <mesh key={index} position={[Math.sin(index) * 0.13, 0.48 + index * 0.025, Math.cos(index) * 0.13]} rotation={[0.7, index, 0.25]}>
          <sphereGeometry args={[0.17, 10, 8]} />
          <meshStandardMaterial color={index % 2 ? '#557249' : '#375b3f'} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function FloorPlanks() {
  return (
    <group position={[0, 0.012, 0]}>
      {Array.from({ length: 23 }, (_, index) => (
        <Box
          key={index}
          position={[0, 0, -4.3 + index * 0.39]}
          scale={[12.65, 0.008, 0.022]}
          color={index % 4 === 0 ? '#6f452e' : '#9b6843'}
        />
      ))}
    </group>
  );
}

function Lamp({ position, tall = false }: { position: [number, number, number]; tall?: boolean }) {
  const height = tall ? 1.35 : 0.72;
  return (
    <group position={position}>
      <Cylinder position={[0, height * 0.48, 0]} scale={[0.025, height * 0.96, 0.025]} color="#6b4a31" />
      <Cylinder position={[0, height, 0]} scale={[tall ? 0.2 : 0.16, 0.22, tall ? 0.2 : 0.16]} color="#f3dfbc" />
      <pointLight position={[0, height + 0.05, 0]} color="#ffd99b" intensity={tall ? 0.34 : 0.24} distance={3.2} />
    </group>
  );
}

function DiningChair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box position={[0, 0.35, 0]} scale={[0.52, 0.16, 0.5]} color="#6f253f" />
      <Box position={[0, 0.72, -0.2]} scale={[0.52, 0.64, 0.12]} color="#762d48" />
      {[-0.18, 0.18].flatMap(x => [-0.18, 0.18].map(z => (
        <Box key={`${x}-${z}`} position={[x, 0.16, z]} scale={[0.055, 0.32, 0.055]} color="#4d3127" />
      )))}
    </group>
  );
}

function WallArt({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <Box position={[0, 0, 0]} scale={[0.88, 0.72, 0.045]} color="#6c492f" />
      <Box position={[0, 0, -0.03]} scale={[0.76, 0.6, 0.025]} color="#ead8c1" />
      <mesh position={[0.12, -0.04, -0.06]} rotation={[0, 0, 0.62]}>
        <capsuleGeometry args={[0.12, 0.42, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function PlaceSetting({ position, rotation = 0, dateActive = false }: { position: [number, number, number]; rotation?: number; dateActive?: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cylinder position={[0, 0, 0]} scale={[0.23, 0.018, 0.23]} color="#fff8eb" />
      <Cylinder position={[0, 0.023, 0]} scale={[0.13, 0.012, 0.13]} color={dateActive ? '#d6a459' : '#ead9c7'} />
      <Cylinder position={[0.29, 0.06, -0.04]} scale={[0.052, 0.1, 0.052]} color="#d9d4ca" />
      <Cylinder position={[0.29, 0.135, -0.04]} scale={[0.075, 0.055, 0.075]} color="#e7e5df" />
      {[-0.29, -0.255].map((x, index) => (
        <Box key={x} position={[x, 0.025, index * 0.035 - 0.02]} scale={[0.018, 0.018, 0.24]} color="#d9b56f" />
      ))}
      <Box position={[0.25, 0.025, 0.11]} scale={[0.018, 0.018, 0.24]} color="#d9b56f" />
    </group>
  );
}

function LivingChair() {
  return (
    <group position={[-1.32, 0, 2.12]} rotation={[0, -0.16, 0]}>
      <Box position={[0, 0.34, 0]} scale={[0.68, 0.18, 0.68]} color="#ead7c3" />
      <Box position={[0, 0.73, 0.27]} scale={[0.68, 0.72, 0.17]} color="#e5cfb8" rotation={[-0.08, 0, 0]} />
      <Box position={[-0.34, 0.51, 0]} scale={[0.14, 0.42, 0.7]} color="#ddc4aa" />
      <Box position={[0.34, 0.51, 0]} scale={[0.14, 0.42, 0.7]} color="#ddc4aa" />
      <Box position={[0, 0.66, 0.16]} scale={[0.42, 0.34, 0.12]} color="#8a3553" rotation={[-0.1, 0, 0]} />
      {[-0.24, 0.24].map(x => <Box key={x} position={[x, 0.12, 0.18]} scale={[0.06, 0.25, 0.06]} color="#53372b" />)}
    </group>
  );
}

function MediaWall() {
  return (
    <group position={[-6.12, 0, -0.45]} rotation={[0, Math.PI / 2, 0]}>
      <Box position={[0, 0.3, 0]} scale={[2.4, 0.58, 0.42]} color="#71482f" />
      <Box position={[-0.63, 0.31, -0.22]} scale={[0.58, 0.31, 0.04]} color="#8a5d3d" />
      <Box position={[0, 1.18, -0.08]} scale={[2.05, 1.15, 0.1]} color="#1c1b20" />
      <Box position={[0, 1.18, -0.15]} scale={[1.86, 0.96, 0.025]} color="#352c36" />
      <Box position={[0, 0.67, -0.13]} scale={[0.12, 0.28, 0.1]} color="#342822" />
      <Box position={[0, 0.53, -0.12]} scale={[0.62, 0.06, 0.12]} color="#342822" />
      <Cylinder position={[0.77, 0.66, -0.17]} scale={[0.11, 0.25, 0.11]} color="#d4c09e" />
      <mesh position={[0.77, 0.94, -0.17]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#557249" roughness={0.9} /></mesh>
    </group>
  );
}

function KitchenDetails() {
  return (
    <group>
      <Box position={[1.5, 1.04, 3.01]} scale={[0.63, 0.04, 0.34]} color="#27252a" />
      {[[-0.18, -0.08], [0.18, -0.08], [-0.18, 0.12], [0.18, 0.12]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[1.5 + x, 1.08, 3.01 + z]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.09, 0.012, 6, 18]} />
          <meshStandardMaterial color="#6e6660" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <Box position={[1.5, 0.59, 3.18]} scale={[0.66, 0.58, 0.05]} color="#29262a" />
      <Box position={[1.5, 0.59, 3.145]} scale={[0.5, 0.42, 0.025]} color="#554846" />
      <Box position={[0.1, 0.84, 3.14]} scale={[0.025, 0.8, 0.03]} color="#aaa49b" />
      <Box position={[0.28, 0.84, 3.14]} scale={[0.025, 0.8, 0.03]} color="#aaa49b" />
      <Box position={[0.72, 1.205, 2.13]} scale={[0.58, 0.025, 0.3]} color="#868684" />
      <mesh position={[0.72, 1.35, 2.12]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.15, 0.018, 7, 22, Math.PI]} />
        <meshStandardMaterial color="#b8b6ae" metalness={0.72} roughness={0.3} />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => (
        <Box key={index} position={[0.65 + index * 0.96, 1.76, 4.22]} scale={[0.42, 0.03, 0.02]} color="#8b6b4c" />
      ))}
      {[0.18, 1.4, 2.62, 3.84].map(x => (
        <group key={x} position={[x, 2.2, 2.4]}>
          <Cylinder position={[0, 0, 0]} scale={[0.018, 0.72, 0.018]} color="#5c4231" />
          <Cylinder position={[0, -0.38, 0]} scale={[0.16, 0.19, 0.16]} color="#edc980" />
          <pointLight position={[0, -0.42, 0]} intensity={0.22} distance={2.2} color="#ffdca0" />
        </group>
      ))}
    </group>
  );
}

function WindowAndCurtains({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <Box position={[0, 0, 0]} scale={[1.45, 1.25, 0.05]} color="#60422f" />
      <Box position={[0, 0, -0.035]} scale={[1.32, 1.12, 0.025]} color="#bea98f" />
      <Box position={[0, 0.04, -0.06]} scale={[1.22, 1.0, 0.018]} color="#6f7881" />
      <Box position={[0, 0.04, -0.08]} scale={[0.035, 1.0, 0.02]} color="#e7d7c4" />
      <Box position={[0, 0.04, -0.08]} scale={[1.22, 0.035, 0.02]} color="#e7d7c4" />
      {[-0.72, 0.72].map(side => <Box key={side} position={[side, -0.02, -0.12]} scale={[0.28, 1.4, 0.06]} color="#7b284c" rotation={[0, 0, side * 0.04]} />)}
    </group>
  );
}

function FamilyFrame() {
  return (
    <group position={[4.85, 1.68, 4.43]}>
      <Box position={[0, 0, 0]} scale={[1.45, 0.9, 0.05]} color="#62412f" />
      <Box position={[0, 0, -0.035]} scale={[1.32, 0.78, 0.025]} color="#efe0cc" />
      {[-0.38, -0.12, 0.16, 0.4].map((x, index) => (
        <group key={x} position={[x, -0.04 + (index < 2 ? 0 : -0.12), -0.08]}>
          <mesh position={[0, 0.16, 0]}><sphereGeometry args={[index < 2 ? 0.11 : 0.075, 10, 8]} /><meshStandardMaterial color={index % 2 ? '#744028' : '#a9653f'} /></mesh>
          <mesh position={[0, -0.1, 0]}><capsuleGeometry args={[index < 2 ? 0.09 : 0.06, index < 2 ? 0.28 : 0.18, 4, 8]} /><meshStandardMaterial color={index % 2 ? '#7b284c' : '#2e2a2d'} /></mesh>
        </group>
      ))}
    </group>
  );
}

function CandleSet({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <group position={[3.1, 0.49, -2.1]}>
      {[-0.42, 0, 0.42].map((x, index) => (
        <group key={x} position={[x, 0, index === 1 ? 0.05 : 0]}>
          <Cylinder position={[0, 0.16, 0]} scale={[0.045, 0.32 + index * 0.06, 0.045]} color="#fff3dc" />
          <mesh position={[0, 0.36 + index * 0.06, 0]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color="#ffcc79" emissive="#ff9d47" emissiveIntensity={1.4} />
          </mesh>
          <pointLight position={[0, 0.43, 0]} color="#ffc174" intensity={0.35} distance={2.2} />
        </group>
      ))}
      <mesh position={[0, 0.08, 0.34]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshStandardMaterial color="#8d2447" roughness={0.8} />
      </mesh>
    </group>
  );
}

function AcceptedGlow() {
  const groupRef = useRef<Group>(null);
  useFrame((_state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.28;
  });
  return (
    <group ref={groupRef} position={[3.1, 1.4, -2.1]}>
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.9, Math.sin(angle * 2) * 0.12, Math.sin(angle) * 0.9]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#f6d493" emissive="#f6b85f" emissiveIntensity={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}

function HomeLighting({ datePhase, roomMood }: { datePhase: DatePhase; roomMood: RoomMood }) {
  const ambientRef = useRef<AmbientLight>(null);
  const directionalRef = useRef<DirectionalLight>(null);
  const tableRef = useRef<PointLight>(null);
  const normalBackground = useMemo(() => new Color('#241a22'), []);
  const dateBackground = useMemo(() => new Color('#1c1118'), []);
  const normalAmbient = useMemo(() => new Color('#fff1dc'), []);
  const dateAmbient = useMemo(() => new Color('#ffd8a3'), []);
  const normalDirectional = useMemo(() => new Color('#fff4dc'), []);
  const dateDirectional = useMemo(() => new Color('#ffc27a'), []);

  useFrame(({ scene }, delta) => {
    const dateActive = datePhase !== 'normal' || roomMood === 'date';
    const cozy = roomMood === 'cozy';
    const accepted = datePhase === 'accepted';
    const alpha = Math.min(1, delta * 1.25);
    const background = scene.background;
    if (background instanceof Color) background.lerp(dateActive ? dateBackground : normalBackground, alpha);
    if (ambientRef.current) {
      ambientRef.current.intensity = MathUtils.lerp(ambientRef.current.intensity, dateActive ? 0.6 : cozy ? 0.7 : 0.88, alpha);
      ambientRef.current.color.lerp(dateActive ? dateAmbient : normalAmbient, alpha);
    }
    if (directionalRef.current) {
      directionalRef.current.intensity = MathUtils.lerp(directionalRef.current.intensity, dateActive ? 0.92 : cozy ? 1.05 : 1.34, alpha);
      directionalRef.current.color.lerp(dateActive ? dateDirectional : normalDirectional, alpha);
    }
    if (tableRef.current) {
      tableRef.current.intensity = MathUtils.lerp(tableRef.current.intensity, accepted ? 1.2 : 0, alpha);
    }
  });

  return (
    <>
      <color attach="background" args={['#241a22']} />
      <ambientLight ref={ambientRef} intensity={0.82} color="#fff1dc" />
      <hemisphereLight args={['#f8dfbd', '#4f3027', 0.42]} />
      <directionalLight ref={directionalRef} position={[-3, 5, 2]} intensity={1.3} color="#fff4dc" />
      <pointLight position={[-3.6, 1.8, 1.2]} intensity={0.55} distance={4.5} color="#f2c072" />
      <pointLight position={[5.4, 1.7, 1.5]} intensity={datePhase === 'normal' ? 0.38 : 0.98} distance={5} color="#f7bd76" />
      <pointLight ref={tableRef} position={[3.1, 2.6, -2.1]} intensity={0} distance={5.5} color="#f8d79b" />
    </>
  );
}

function ChildNpc({ index }: { index: number }) {
  const config = childNpcConfigs[index];
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    elapsedRef.current += delta;
    const group = groupRef.current;
    if (!group) return;
    const walkingPath = config.style === 'builder' ? Math.sin(elapsedRef.current * 0.28) * 0.34 : 0;
    group.position.x = config.position[0] + walkingPath;
    group.position.z = config.position[2] + (config.style === 'builder' ? Math.cos(elapsedRef.current * 0.28) * 0.14 : 0);
    group.position.y = Math.abs(Math.sin(elapsedRef.current * 1.1 + index)) * 0.008;
    group.rotation.y = config.style === 'builder' ? Math.sin(elapsedRef.current * 0.28) * 0.8 : Math.sin(elapsedRef.current * 0.6 + index) * 0.12;
  });

  return (
    <group ref={groupRef} position={config.position} scale={0.72}>
      <Html position={[0, 1.62, 0]} center sprite distanceFactor={6} zIndexRange={[30, 1]}>
        <span className={`npc-name npc-name--${config.gender}`}>{config.name}</span>
      </Html>
      {config.gender === 'boy' ? (
        <>
          <mesh position={[0, 0.72, 0]} scale={[1.05, 1, 0.9]}><capsuleGeometry args={[0.18, 0.38, 5, 10]} /><meshStandardMaterial color={config.outfit} roughness={0.85} /></mesh>
          <Box position={[0, 0.42, 0]} scale={[0.33, 0.18, 0.26]} color="#3f5c52" />
        </>
      ) : (
        <mesh position={[0, 0.66, 0]}>
          <coneGeometry args={[0.27, 0.7, 16]} />
          <meshStandardMaterial color={config.outfit} roughness={0.85} />
        </mesh>
      )}
      <mesh position={[0, 1.13, 0]} scale={[0.96, 1.05, 0.92]}>
        <sphereGeometry args={[0.18, 14, 12]} />
        <meshStandardMaterial color={config.skin} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.29, -0.025]} scale={[1.05, 0.68, 0.94]}><sphereGeometry args={[0.18, 12, 9]} /><meshStandardMaterial color={config.hair} roughness={0.95} /></mesh>
      {config.gender === 'boy' ? (
        [-0.1, 0, 0.1].map((x, hairIndex) => <mesh key={x} position={[x, 1.39 + hairIndex % 2 * 0.025, -0.01]}><sphereGeometry args={[0.07, 8, 7]} /><meshStandardMaterial color={config.hair} roughness={1} /></mesh>)
      ) : (
        [-0.16, 0.16].map(x => <mesh key={x} position={[x, 1.41, -0.01]}><sphereGeometry args={[0.11, 9, 7]} /><meshStandardMaterial color={config.hair} roughness={1} /></mesh>)
      )}
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * 0.13, 0.25, 0]}><capsuleGeometry args={[0.045, 0.32, 4, 7]} /><meshStandardMaterial color="#4c3340" roughness={0.88} /></mesh>
          <mesh position={[side * 0.21, 0.65, 0.06]} rotation={[0.2, 0, side * -0.35]}><capsuleGeometry args={[0.042, 0.3, 4, 7]} /><meshStandardMaterial color={config.skin} roughness={0.8} /></mesh>
        </group>
      ))}
      {[-0.055, 0.055].map(x => <mesh key={x} position={[x, 1.16, 0.165]}><sphereGeometry args={[0.014, 7, 7]} /><meshStandardMaterial color="#241515" /></mesh>)}
      <mesh position={[0, 1.08, 0.17]} scale={[1, 0.35, 0.45]}><sphereGeometry args={[0.045, 8, 7]} /><meshStandardMaterial color="#8b5145" /></mesh>
      {config.style === 'reader' ? (
        <group position={[0, 0.52, 0.24]} rotation={[-0.65, 0, 0]}>
          <Box position={[-0.1, 0, 0]} scale={[0.18, 0.025, 0.24]} color="#d8b96e" rotation={[0, -0.2, 0]} />
          <Box position={[0.1, 0, 0]} scale={[0.18, 0.025, 0.24]} color="#e6c77c" rotation={[0, 0.2, 0]} />
        </group>
      ) : (
        <group position={[0.28, 0.08, 0.28]}>
          <Box position={[0, 0.07, 0]} scale={[0.14, 0.14, 0.14]} color="#d3ad4f" />
          <Box position={[0.11, 0.2, 0]} scale={[0.12, 0.12, 0.12]} color="#7c3552" />
        </group>
      )}
    </group>
  );
}

function HomeFurniture({ datePhase, roomMood }: { datePhase: DatePhase; roomMood: RoomMood }) {
  const dateActive = datePhase !== 'normal' || roomMood === 'date';
  return (
    <group>
      <Box position={[0, -0.05, 0]} scale={[12.8, 0.1, 9]} color="#9b6843" />
      <FloorPlanks />
      <Box position={[0, 1.28, 4.55]} scale={[12.8, 2.56, 0.16]} color="#ead8c4" />
      <Box position={[-6.45, 1.28, 0]} scale={[0.16, 2.56, 9]} color="#ead8c4" />
      <Box position={[6.45, 1.28, 0]} scale={[0.16, 2.56, 9]} color="#ead8c4" />
      <Box position={[0, 0.44, 4.44]} scale={[12.6, 0.72, 0.025]} color="#dec8b0" />
      {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map(x => <Box key={x} position={[x, 0.44, 4.41]} scale={[0.035, 0.68, 0.03]} color="#c9ad91" />)}
      <Box position={[-6.34, 1.08, -2.85]} scale={[0.08, 2.05, 1.18]} color="#6f253f" />
      <Box position={[-6.27, 1.08, -2.85]} scale={[0.055, 1.75, 0.94]} color="#7e2d45" />
      <Cylinder position={[-6.21, 1.05, -2.42]} scale={[0.045, 0.045, 0.045]} color="#d9ad62" rotation={[0, 0, Math.PI / 2]} />
      <Box position={[-4.85, 0.025, -2.85]} scale={[1.45, 0.03, 0.92]} color="#d8bea0" />
      <Box position={[-5.78, 0.48, -1.45]} scale={[0.38, 0.78, 1.25]} color="#6a422e" />
      <Box position={[-5.72, 0.9, -1.45]} scale={[0.48, 0.08, 1.3]} color="#9a6840" />

      <Box position={[-3.0, 0.18, 1.42]} scale={[2.5, 0.15, 1.7]} color="#6f253f" />
      <Box position={[-3.0, 0.192, 1.42]} scale={[2.26, 0.015, 1.46]} color="#bc9474" />
      <Box position={[-3.2, 0.45, 1.52]} scale={[2.3, 0.55, 0.55]} color="#f2deca" />
      <Box position={[-4.42, 0.45, 2.45]} scale={[0.55, 0.55, 1.3]} color="#f2deca" />
      <Box position={[-1.85, 0.45, 2.35]} scale={[0.7, 0.55, 0.9]} color="#f5e5d4" />
      <Box position={[-3.65, 0.67, 1.2]} scale={[0.48, 0.32, 0.15]} color="#7b284c" rotation={[-0.08, 0, -0.06]} />
      <Box position={[-2.95, 0.67, 1.2]} scale={[0.48, 0.32, 0.15]} color="#b88763" rotation={[-0.08, 0, 0.05]} />
      <Box position={[-2.25, 0.67, 1.2]} scale={[0.48, 0.32, 0.15]} color="#6f253f" rotation={[-0.08, 0, -0.04]} />
      <Box position={[-2.7, 0.36, 0.45]} scale={[1.15, 0.28, 0.55]} color="#5b392b" />
      <Box position={[-2.7, 0.51, 0.45]} scale={[1.05, 0.05, 0.46]} color="#82573b" />
      <Cylinder position={[-2.7, 0.58, 0.45]} scale={[0.16, 0.045, 0.16]} color="#d8b968" />
      <LivingChair />
      <MediaWall />

      <Box position={[-5.45, 0.72, 1.35]} scale={[0.72, 1.44, 0.24]} color="#6b442e" />
      {[-0.45, -0.15, 0.15, 0.45].map((y, shelf) => (
        <Box key={shelf} position={[-5.45, 0.8 + y, 1.18]} scale={[0.62, 0.055, 0.18]} color="#9b6a3f" />
      ))}
      {Array.from({ length: 14 }, (_, index) => (
        <Box key={index} position={[-5.72 + (index % 4) * 0.18, 0.28 + Math.floor(index / 4) * 0.28, 1.02]} scale={[0.07, 0.2, 0.12]} color={index % 3 === 0 ? '#7a2748' : index % 3 === 1 ? '#d7b36a' : '#2f4d44'} />
      ))}

      <Box position={[3.1, 0.025, -2.1]} scale={[3.2, 0.035, 1.85]} color="#d9c2a5" />
      <Box position={[3.1, 0.04, -2.1]} scale={[2.88, 0.012, 1.56]} color="#8b5b4b" />
      <Box position={[3.1, 0.7, -2.1]} scale={[2.35, 0.18, 1.05]} color="#704426" />
      {[-0.92, 0.92].flatMap(x => [-0.36, 0.36].map(z => (
        <Box key={`${x}-${z}`} position={[3.1 + x, 0.34, -2.1 + z]} scale={[0.09, 0.68, 0.09]} color="#4d3127" />
      )))}
      <DiningChair position={[2.15, 0, -1.1]} rotation={Math.PI} />
      <DiningChair position={[4.05, 0, -1.1]} rotation={Math.PI} />
      <DiningChair position={[2.15, 0, -3.1]} />
      <DiningChair position={[4.05, 0, -3.1]} />
      <PlaceSetting position={[2.45, 0.81, -1.8]} rotation={Math.PI} dateActive={dateActive} />
      <PlaceSetting position={[3.75, 0.81, -1.8]} rotation={Math.PI} dateActive={dateActive} />
      <PlaceSetting position={[2.45, 0.81, -2.42]} dateActive={dateActive} />
      <PlaceSetting position={[3.75, 0.81, -2.42]} dateActive={dateActive} />
      <Cylinder position={[3.1, 0.49, -2.1]} scale={[0.28, 0.035, 0.28]} color="#fff5e7" />
      <CandleSet active={dateActive} />
      {dateActive && (
        <group>
          <Cylinder position={[2.55, 0.5, -2.1]} scale={[0.24, 0.025, 0.24]} color="#fff8eb" />
          <Cylinder position={[3.65, 0.5, -2.1]} scale={[0.24, 0.025, 0.24]} color="#fff8eb" />
          <Cylinder position={[3.1, 0.62, -2.4]} scale={[0.06, 0.18, 0.06]} color="#557249" />
          {[-0.12, 0, 0.12].map((x, index) => (
            <mesh key={x} position={[3.1 + x, 0.82 + index * 0.02, -2.4]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color={index === 1 ? '#f3d6bd' : '#8d2447'} roughness={0.76} />
            </mesh>
          ))}
          <group position={[3.1, 0.86, -2.08]}>
            <Cylinder position={[0, 0, 0]} scale={[0.3, 0.035, 0.3]} color="#6f422d" />
            {[-0.13, 0, 0.13].map((x, index) => <mesh key={x} position={[x, 0.08 + index * 0.018, 0]}><sphereGeometry args={[0.09, 10, 8]} /><meshStandardMaterial color={index === 1 ? '#587647' : '#b66b3f'} roughness={0.82} /></mesh>)}
          </group>
        </group>
      )}

      <Box position={[2.7, 0.56, 3.55]} scale={[4.8, 1.12, 0.7]} color="#efe1ce" />
      <Box position={[2.7, 1.18, 3.16]} scale={[4.8, 0.18, 0.95]} color="#f9f0df" />
      <Box position={[0.1, 0.8, 3.55]} scale={[0.55, 1.6, 0.75]} color="#55504b" />
      <Box position={[1.5, 1.02, 3.08]} scale={[0.72, 0.5, 0.08]} color="#3b3433" />
      <Cylinder position={[2.9, 1.03, 3.05]} scale={[0.22, 0.08, 0.22]} color="#9e2f4f" />
      {Array.from({ length: 5 }, (_, index) => (
        <Box key={index} position={[0.65 + index * 0.96, 1.75, 4.38]} scale={[0.82, 0.72, 0.26]} color="#eadbc8" />
      ))}
      <Box position={[0.72, 0.62, 2.15]} scale={[2.65, 1.04, 0.78]} color="#e9dac8" />
      <Box position={[0.72, 1.17, 2.15]} scale={[2.82, 0.12, 0.92]} color="#f5ebdc" />
      <Box position={[0.72, 1.2, 2.14]} scale={[0.72, 0.04, 0.44]} color="#a6aaa7" />
      {[-0.45, 0.45].map(x => <Cylinder key={x} position={[0.72 + x, 0.46, 1.4]} scale={[0.22, 0.46, 0.22]} color="#7b284c" />)}
      <KitchenDetails />

      <Cylinder position={[4.78, 0.04, 1.78]} scale={[1.15, 0.035, 1.15]} color="#dcc5a8" />
      <Box position={[5.85, 0.48, 1.65]} scale={[0.35, 0.82, 1.55]} color="#d8bda0" />
      {Array.from({ length: 7 }, (_, index) => (
        <Box key={index} position={[4.1 + (index % 4) * 0.32, 0.12, 1.5 + Math.floor(index / 4) * 0.28]} scale={[0.16, 0.16, 0.16]} color={index % 2 ? '#c39942' : '#7a2748'} />
      ))}
      <ChildNpc index={0} />
      <ChildNpc index={1} />
      <Plant position={[-5.45, 0, -1.8]} />
      <Plant position={[5.55, 0, 1.35]} />
      <Plant position={[0.0, 0, -3.65]} />
      <Lamp position={[-5.0, 0, 3.6]} tall />
      <Lamp position={[5.65, 0, -3.55]} tall />
      <Lamp position={[-5.78, 0.92, -1.45]} />
      <WallArt position={[3.9, 1.75, 4.42]} color="#7b284c" />
      <WindowAndCurtains position={[-6.34, 1.65, 2.7]} />
      <FamilyFrame />
      <group position={[-6.34, 1.75, 0.05]} rotation={[0, Math.PI / 2, 0]}>
        <Box position={[0, 0, 0]} scale={[0.12, 0.72, 0.055]} color="#9b7448" />
        <Box position={[0, 0.16, -0.01]} scale={[0.48, 0.11, 0.055]} color="#9b7448" />
      </group>

      {dateActive && (
        <mesh position={[3.1, 0.035, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.018, 8, 70]} />
          <meshStandardMaterial color="#f1c36f" emissive="#d79045" emissiveIntensity={0.45} />
        </mesh>
      )}
      {datePhase === 'accepted' && <AcceptedGlow />}
    </group>
  );
}

function LocalPlayer({
  avatarKey,
  cameraYaw,
  mobileInputRef,
  onPoseChange,
  onInteractionChange,
  seatId,
  occupiedSeatIds,
  coupleInteraction,
  onFootstep,
}: {
  avatarKey: AvatarKey;
  cameraYaw: React.MutableRefObject<number>;
  mobileInputRef: React.MutableRefObject<MovementInput>;
  onPoseChange: (pose: PlayerPose) => void;
  onInteractionChange: (interaction: WorldInteraction) => void;
  seatId: string | null;
  occupiedSeatIds: string[];
  coupleInteraction: ActiveCoupleInteraction | null;
  onFootstep: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const keyboardRef = useKeyboardMovement();
  const poseRef = useRef<PlayerPose>({
    position: avatarKey === 'santana' ? [-4.75, 0, -2.85] : [-3.85, 0, -2.05],
    rotation: 0,
    moving: false,
    activity: 'idle',
    seatId: null,
    room: 'home',
  });
  const lastPublishRef = useRef(0);
  const activityRef = useRef<PlayerPose['activity']>('idle');
  const lastInteractionRef = useRef('');
  const previousSeatRef = useRef<string | null>(null);
  const elapsedRef = useRef(0);
  const lastFootstepRef = useRef(0);
  const cameraTarget = useMemo(() => new Vector3(), []);
  const initialPosition = avatarKey === 'santana' ? [-4.75, 0, -2.85] as const : [-3.85, 0, -2.05] as const;

  useFrame(({ camera }, delta) => {
    const frameDelta = Math.min(delta, 0.05);
    elapsedRef.current += frameDelta;
    const keyboard = keyboardRef.current;
    const mobile = mobileInputRef.current;
    const input = {
      x: Math.abs(mobile.x) > 0.02 ? mobile.x : keyboard.x,
      z: Math.abs(mobile.z) > 0.02 ? mobile.z : keyboard.z,
    };

    const yaw = cameraYaw.current;
    const rotatedInput = toCameraRelativeMovement(input, yaw);

    const seat = getSeatById(seatId);
    if (coupleInteraction) {
      const directionX = Math.sin(coupleInteraction.facing);
      const directionZ = Math.cos(coupleInteraction.facing);
      const roleOffset = avatarKey === 'aldane' ? -0.31 : 0.31;
      poseRef.current = {
        ...poseRef.current,
        position: [
          coupleInteraction.anchor[0] + directionX * roleOffset,
          0,
          coupleInteraction.anchor[2] + directionZ * roleOffset,
        ],
        rotation: avatarKey === 'aldane' ? coupleInteraction.facing : coupleInteraction.facing + Math.PI,
        moving: false,
        activity: coupleInteraction.kind,
        seatId: null,
      };
    } else if (seat) {
      poseRef.current = {
        ...poseRef.current,
        position: seat.position,
        rotation: seat.rotation,
        moving: false,
        activity: 'sitting',
        seatId: seat.id,
      };
    } else {
      const previousSeat = getSeatById(previousSeatRef.current);
      if (previousSeat) {
        poseRef.current = { ...poseRef.current, position: previousSeat.exitPosition, seatId: null };
      }
      poseRef.current = resolveMovement(poseRef.current, rotatedInput, frameDelta);
    }
    previousSeatRef.current = seatId;
    activityRef.current = poseRef.current.activity;
    if (poseRef.current.activity === 'walking' && elapsedRef.current - lastFootstepRef.current > 0.42) {
      lastFootstepRef.current = elapsedRef.current;
      onFootstep();
    }
    const group = groupRef.current;
    if (group) {
      group.position.set(...poseRef.current.position);
      const rotationAlpha = 1 - Math.exp(-13 * frameDelta);
      group.rotation.y = dampAngle(group.rotation.y, poseRef.current.rotation, rotationAlpha);
    }

    const [x, , z] = poseRef.current.position;
    const cameraDistance = 5.85;
    const cameraHeight = 4.15;
    const cameraAlpha = 1 - Math.exp(-5.2 * frameDelta);
    camera.position.x = MathUtils.lerp(camera.position.x, x - Math.sin(yaw) * cameraDistance, cameraAlpha);
    camera.position.y = MathUtils.lerp(camera.position.y, cameraHeight, cameraAlpha);
    camera.position.z = MathUtils.lerp(camera.position.z, z - Math.cos(yaw) * cameraDistance, cameraAlpha);
    cameraTarget.set(x, 0.88, z);
    camera.lookAt(cameraTarget);

    const interaction = coupleInteraction ? null : seatId ? { kind: 'seat' as const, seatId } : getNearbyInteraction(poseRef.current, occupiedSeatIds);
    const interactionKey = interaction ? `${interaction.kind}:${interaction.kind === 'seat' ? interaction.seatId : ''}` : '';
    if (interactionKey !== lastInteractionRef.current) {
      lastInteractionRef.current = interactionKey;
      onInteractionChange(interaction);
    }

    if (elapsedRef.current - lastPublishRef.current > 0.095) {
      lastPublishRef.current = elapsedRef.current;
      onPoseChange(poseRef.current);
    }
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      <AvatarBody config={avatarConfigs[avatarKey]} seated={Boolean(seatId)} activityRef={activityRef} />
    </group>
  );
}

export function HomeScene({
  profile,
  datePhase,
  roomMood,
  remotePlayers,
  cameraYaw,
  mobileInputRef,
  onPoseChange,
  onInteractionChange,
  seatId,
  occupiedSeatIds,
  coupleInteraction,
  onFootstep,
}: {
  profile: Profile;
  datePhase: DatePhase;
  roomMood: RoomMood;
  remotePlayers: PresencePlayer[];
  cameraYaw: React.MutableRefObject<number>;
  mobileInputRef: React.MutableRefObject<MovementInput>;
  onPoseChange: (pose: PlayerPose) => void;
  onInteractionChange: (interaction: WorldInteraction) => void;
  seatId: string | null;
  occupiedSeatIds: string[];
  coupleInteraction: ActiveCoupleInteraction | null;
  onFootstep: () => void;
}) {
  return (
    <>
      <HomeLighting datePhase={datePhase} roomMood={roomMood} />

      <HomeFurniture datePhase={datePhase} roomMood={roomMood} />
      <ContactShadows position={[0, 0.025, 0]} opacity={0.28} scale={13} blur={2.4} far={3.2} resolution={256} color="#28161c" />
      <LocalPlayer
        avatarKey={profile.avatar_key}
        cameraYaw={cameraYaw}
        mobileInputRef={mobileInputRef}
        onPoseChange={onPoseChange}
        onInteractionChange={onInteractionChange}
        seatId={seatId}
        occupiedSeatIds={occupiedSeatIds}
        coupleInteraction={coupleInteraction}
        onFootstep={onFootstep}
      />
      {remotePlayers.map(player => (
        <RemoteAvatar key={player.id} config={avatarConfigs[player.role]} pose={player.pose} />
      ))}
    </>
  );
}
