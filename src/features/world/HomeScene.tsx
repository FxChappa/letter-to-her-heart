import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AmbientLight, Color, DirectionalLight, Group, MathUtils, PointLight, Vector3 } from 'three';
import { avatarConfigs, childNpcConfigs } from '../../config/avatars';
import type { AvatarKey, Profile } from '../../lib/supabase/database.types';
import type { DatePhase } from '../date/dateState';
import { AvatarBody, RemoteAvatar } from './Avatar';
import { getNearestDiningChair, getNearbyInteraction, InteractionKind, resolveMovement } from './movement';
import { useKeyboardMovement } from './useKeyboardMovement';
import type { MovementInput, PlayerPose, PresencePlayer } from './worldTypes';

function Box({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} scale={scale}>
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

function CandleSet({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <group position={[3.1, 0.85, -2.1]}>
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

function HomeLighting({ datePhase }: { datePhase: DatePhase }) {
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
    const dateActive = datePhase !== 'normal';
    const accepted = datePhase === 'accepted';
    const alpha = Math.min(1, delta * 1.25);
    const background = scene.background;
    if (background instanceof Color) background.lerp(dateActive ? dateBackground : normalBackground, alpha);
    if (ambientRef.current) {
      ambientRef.current.intensity = MathUtils.lerp(ambientRef.current.intensity, dateActive ? 0.56 : 0.62, alpha);
      ambientRef.current.color.lerp(dateActive ? dateAmbient : normalAmbient, alpha);
    }
    if (directionalRef.current) {
      directionalRef.current.intensity = MathUtils.lerp(directionalRef.current.intensity, dateActive ? 0.94 : 1.15, alpha);
      directionalRef.current.color.lerp(dateActive ? dateDirectional : normalDirectional, alpha);
    }
    if (tableRef.current) {
      tableRef.current.intensity = MathUtils.lerp(tableRef.current.intensity, accepted ? 1.2 : 0, alpha);
    }
  });

  return (
    <>
      <color attach="background" args={['#241a22']} />
      <ambientLight ref={ambientRef} intensity={0.62} color="#fff1dc" />
      <directionalLight ref={directionalRef} position={[-3, 5, 2]} intensity={1.15} color="#fff4dc" />
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
    group.position.x = config.position[0] + Math.sin(elapsedRef.current * 0.75 + index) * 0.12;
    group.rotation.y = Math.sin(elapsedRef.current * 0.8 + index) * 0.35;
  });

  return (
    <group ref={groupRef} position={config.position} scale={0.64}>
      <mesh position={[0, 0.58, 0]}>
        <capsuleGeometry args={[0.17, 0.42, 4, 8]} />
        <meshStandardMaterial color={config.outfit} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={config.skin} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.13, -0.02]}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <meshStandardMaterial color={config.hair} roughness={0.9} />
      </mesh>
    </group>
  );
}

function HomeFurniture({ datePhase }: { datePhase: DatePhase }) {
  const dateActive = datePhase !== 'normal';
  return (
    <group>
      <Box position={[0, -0.05, 0]} scale={[12.8, 0.1, 9]} color="#8a5937" />
      <Box position={[0, 0.75, 4.55]} scale={[12.8, 1.5, 0.16]} color="#ecd9c4" />
      <Box position={[-6.45, 0.75, 0]} scale={[0.16, 1.5, 9]} color="#ecd9c4" />
      <Box position={[6.45, 0.75, 0]} scale={[0.16, 1.5, 9]} color="#ecd9c4" />

      <Box position={[-3.0, 0.18, 1.42]} scale={[2.5, 0.15, 1.7]} color="#6f253f" />
      <Box position={[-3.2, 0.45, 1.52]} scale={[2.3, 0.55, 0.55]} color="#f2deca" />
      <Box position={[-4.42, 0.45, 2.45]} scale={[0.55, 0.55, 1.3]} color="#f2deca" />
      <Box position={[-1.85, 0.45, 2.35]} scale={[0.7, 0.55, 0.9]} color="#f5e5d4" />
      <Box position={[-2.7, 0.36, 0.45]} scale={[1.15, 0.28, 0.55]} color="#5b392b" />

      <Box position={[-5.45, 0.72, 1.35]} scale={[0.72, 1.44, 0.24]} color="#6b442e" />
      {[-0.45, -0.15, 0.15, 0.45].map((y, shelf) => (
        <Box key={shelf} position={[-5.45, 0.8 + y, 1.18]} scale={[0.62, 0.055, 0.18]} color="#9b6a3f" />
      ))}
      {Array.from({ length: 14 }, (_, index) => (
        <Box key={index} position={[-5.72 + (index % 4) * 0.18, 0.28 + Math.floor(index / 4) * 0.28, 1.02]} scale={[0.07, 0.2, 0.12]} color={index % 3 === 0 ? '#7a2748' : index % 3 === 1 ? '#d7b36a' : '#2f4d44'} />
      ))}

      <Box position={[3.1, 0.38, -2.1]} scale={[2.35, 0.18, 1.05]} color="#704426" />
      <Box position={[2.15, 0.35, -1.1]} scale={[0.52, 0.45, 0.52]} color="#6f253f" />
      <Box position={[4.05, 0.35, -1.1]} scale={[0.52, 0.45, 0.52]} color="#6f253f" />
      <Box position={[2.15, 0.35, -3.1]} scale={[0.52, 0.45, 0.52]} color="#6f253f" />
      <Box position={[4.05, 0.35, -3.1]} scale={[0.52, 0.45, 0.52]} color="#6f253f" />
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
        </group>
      )}

      <Box position={[2.7, 0.56, 3.55]} scale={[4.8, 1.12, 0.7]} color="#efe1ce" />
      <Box position={[2.7, 1.18, 3.16]} scale={[4.8, 0.18, 0.95]} color="#f9f0df" />
      <Box position={[0.1, 0.8, 3.55]} scale={[0.55, 1.6, 0.75]} color="#55504b" />
      <Box position={[1.5, 1.02, 3.08]} scale={[0.72, 0.5, 0.08]} color="#3b3433" />
      <Cylinder position={[2.9, 1.03, 3.05]} scale={[0.22, 0.08, 0.22]} color="#9e2f4f" />

      <Cylinder position={[4.78, 0.04, 2.64]} scale={[1.0, 0.035, 1.0]} color="#dcc5a8" />
      {Array.from({ length: 7 }, (_, index) => (
        <Box key={index} position={[4.15 + (index % 4) * 0.32, 0.12, 2.35 + Math.floor(index / 4) * 0.28]} scale={[0.16, 0.16, 0.16]} color={index % 2 ? '#c39942' : '#7a2748'} />
      ))}
      <ChildNpc index={0} />
      <ChildNpc index={1} />
      <Plant position={[-5.45, 0, -1.8]} />
      <Plant position={[5.55, 0, 1.35]} />
      <Plant position={[0.0, 0, -3.65]} />

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
  sitting,
}: {
  avatarKey: AvatarKey;
  cameraYaw: React.MutableRefObject<number>;
  mobileInputRef: React.MutableRefObject<MovementInput>;
  onPoseChange: (pose: PlayerPose) => void;
  onInteractionChange: (interaction: InteractionKind) => void;
  sitting: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const keyboardRef = useKeyboardMovement();
  const poseRef = useRef<PlayerPose>({
    position: avatarKey === 'santana' ? [-4.75, 0, -2.85] : [-3.85, 0, -2.05],
    rotation: 0,
    moving: false,
    activity: 'idle',
    room: 'home',
  });
  const lastPublishRef = useRef(0);
  const lastInteractionRef = useRef<InteractionKind>(null);
  const elapsedRef = useRef(0);
  const cameraTarget = useMemo(() => new Vector3(), []);
  const initialPosition = avatarKey === 'santana' ? [-4.75, 0, -2.85] as const : [-3.85, 0, -2.05] as const;

  useFrame(({ camera }, delta) => {
    elapsedRef.current += delta;
    const keyboard = keyboardRef.current;
    const mobile = mobileInputRef.current;
    const input = {
      x: Math.abs(mobile.x) > 0.02 ? mobile.x : keyboard.x,
      z: Math.abs(mobile.z) > 0.02 ? mobile.z : keyboard.z,
    };

    const yaw = cameraYaw.current;
    const rotatedInput = {
      x: input.x * Math.cos(yaw) + input.z * Math.sin(yaw),
      z: input.z * Math.cos(yaw) - input.x * Math.sin(yaw),
    };

    if (sitting) {
      poseRef.current = {
        ...poseRef.current,
        position: getNearestDiningChair(poseRef.current),
        rotation: Math.PI,
        moving: false,
        activity: 'sitting',
      };
    } else {
      poseRef.current = resolveMovement(poseRef.current, rotatedInput, delta);
    }
    const group = groupRef.current;
    if (group) {
      group.position.set(...poseRef.current.position);
      group.rotation.y = MathUtils.lerp(group.rotation.y, poseRef.current.rotation, Math.min(1, delta * 12));
    }

    const [x, , z] = poseRef.current.position;
    const cameraDistance = 4.8;
    const cameraHeight = 3.2;
    camera.position.x = MathUtils.lerp(camera.position.x, x - Math.sin(yaw) * cameraDistance, delta * 4.8);
    camera.position.y = MathUtils.lerp(camera.position.y, cameraHeight, delta * 4.8);
    camera.position.z = MathUtils.lerp(camera.position.z, z - Math.cos(yaw) * cameraDistance, delta * 4.8);
    cameraTarget.set(x, 1.02, z);
    camera.lookAt(cameraTarget);

    const interaction = sitting ? 'chair' : getNearbyInteraction(poseRef.current);
    if (interaction !== lastInteractionRef.current) {
      lastInteractionRef.current = interaction;
      onInteractionChange(interaction);
    }

    if (elapsedRef.current - lastPublishRef.current > 0.095) {
      lastPublishRef.current = elapsedRef.current;
      onPoseChange(poseRef.current);
    }
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      <AvatarBody config={avatarConfigs[avatarKey]} seated={sitting} />
    </group>
  );
}

export function HomeScene({
  profile,
  datePhase,
  remotePlayers,
  cameraYaw,
  mobileInputRef,
  onPoseChange,
  onInteractionChange,
  sitting,
}: {
  profile: Profile;
  datePhase: DatePhase;
  remotePlayers: PresencePlayer[];
  cameraYaw: React.MutableRefObject<number>;
  mobileInputRef: React.MutableRefObject<MovementInput>;
  onPoseChange: (pose: PlayerPose) => void;
  onInteractionChange: (interaction: InteractionKind) => void;
  sitting: boolean;
}) {
  return (
    <>
      <HomeLighting datePhase={datePhase} />

      <HomeFurniture datePhase={datePhase} />
      <LocalPlayer
        avatarKey={profile.avatar_key}
        cameraYaw={cameraYaw}
        mobileInputRef={mobileInputRef}
        onPoseChange={onPoseChange}
        onInteractionChange={onInteractionChange}
        sitting={sitting}
      />
      {remotePlayers.map(player => (
        <RemoteAvatar key={player.id} config={avatarConfigs[player.role]} pose={player.pose} />
      ))}
    </>
  );
}
