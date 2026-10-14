import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import type { GamePhase } from '../../types/game';
import type { ItemReward } from '../../types/reward';
import type { RarityType } from '../../types/rarity';
import { RARITY_CONFIGS } from '../../config/rarity';
import type { CardTextData } from '../../utils/cardRenderer';
import { getCardReadCamera, getCardStageCamera, getCharacterPosition, getCharacterScale, getSceneCamera } from '../../utils/layout';
import { GiftBox3D } from './GiftBox3D';
import { CharacterRenderer } from './characters/CharacterRenderer';
import { SoftShadow } from './SoftShadow';
import { FloatingParticles } from './FloatingParticles';
import { Fireworks3D } from './Fireworks3D';
import { FlowerGarden3D } from './FlowerGarden3D';
import { GreetingCard3D, type CardMode } from './GreetingCard3D';

/** Tín hiệu va chạm để camera rung theo (hộp quà rơi / mở nắp). */
export interface ImpactSignal {
  time: number;
  power: number;
}

interface SceneContainerProps {
  phase: GamePhase;
  wonItem: ItemReward | null;
  cardData: CardTextData | null;
  onLanded?: () => void;
  onBoxClick?: (count: number) => void;
  onBoxOpened?: () => void;
  isCardOpen?: boolean;
  cardMode?: CardMode;
  onToggleCard?: () => void;
  skipToken?: number;
  replayToken?: number;
  reducedMotion?: boolean;
}

/**
 * Sân khấu lộ diện phần thưởng: nhân vật bật lên với hiệu ứng
 * tương ứng bậc độ hiếm (thường/hiếm/sử thi/huyền bí).
 */
const RewardReveal: React.FC<{
  rarity: RarityType;
  position: [number, number, number];
  reducedMotion: boolean;
  children: React.ReactNode;
}> = ({ rarity, position, reducedMotion, children }) => {
  const groupRef = React.useRef<THREE.Group>(null);
  const ringRef = React.useRef<THREE.Mesh>(null);
  const pillarRef = React.useRef<THREE.Mesh>(null);
  const lightRef = React.useRef<THREE.PointLight>(null);
  const readyRef = React.useRef(false);
  const config = RARITY_CONFIGS[rarity];
  const isGrand = rarity === 'epic' || rarity === 'secret';

  // Nhịp "thở" nhẹ sau khi xuất hiện xong — giúp nhân vật sống động hơn
  useFrame((state) => {
    const g = groupRef.current;
    if (!g || !readyRef.current || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    const breathe = Math.sin(t * 2.1) * 0.022;
    g.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5);
    g.rotation.y = Math.sin(t * 0.6) * 0.05;
  });

  // Hiệu ứng xuất hiện (chỉ chạy khi nhân vật mới được trao)
  React.useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    if (reducedMotion) {
      readyRef.current = true;
      return;
    }
    readyRef.current = false;
    const tl = gsap.timeline({ onComplete: () => (readyRef.current = true) });
    tl.fromTo(g.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 1.15, ease: 'elastic.out(1, 0.55)' });
    tl.fromTo(g.rotation, { y: -1.6 }, { y: 0, duration: 1.0, ease: 'power3.out' }, 0);
    tl.fromTo(g.position, { y: -1.1 }, { y: position[1], duration: 0.95, ease: 'back.out(1.5)' }, 0);
    if (lightRef.current) {
      tl.fromTo(lightRef.current, { intensity: 0 }, { intensity: isGrand ? 14 : 6, duration: 0.5, yoyo: true, repeat: 1 }, 0);
    }
    if (ringRef.current) {
      tl.fromTo(ringRef.current.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 1.05, ease: 'power3.out' }, 0);
      tl.fromTo(
        ringRef.current.material as THREE.MeshBasicMaterial,
        { opacity: 0.85 },
        { opacity: 0, duration: 1.3 },
        0.1
      );
    }
    if (pillarRef.current) {
      tl.fromTo(pillarRef.current.scale, { x: 0.1, y: 0.1, z: 0.1 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'power3.out' }, 0);
      tl.fromTo(
        pillarRef.current.material as THREE.MeshBasicMaterial,
        { opacity: 0.55 },
        { opacity: 0.12, duration: 1.4 },
        0.2
      );
    }
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, isGrand]);

  // Trượt sang vị trí mới khi mở thiệp (không chạy lại hiệu ứng lộ diện)
  React.useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    gsap.to(g.position, {
      x: position[0],
      z: position[2],
      duration: reducedMotion ? 0.01 : 1.1,
      ease: 'power3.inOut',
    });
  }, [position, reducedMotion]);

  return (
    <group ref={groupRef} position={position}>
      <pointLight ref={lightRef} position={[0, 1.4, 1.2]} color={config.color} intensity={isGrand ? 6 : 2.5} distance={9} />
      {/* Bóng mềm giúp nhân vật "đứng" trên cỏ thay vì lơ lửng */}
      <SoftShadow radius={1.15} opacity={0.32} position={[0, 0.006, 0]} />
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1}>
        <ringGeometry args={[0.85, 1.15, 44]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {isGrand && (
        <mesh ref={pillarRef} position={[0, 1.9, 0]}>
          <cylinderGeometry args={[0.9, 1.25, 3.8, 28, 1, true]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      {children}
    </group>
  );
};

/** Camera nhìn theo giai đoạn + rung nhẹ khi hộp quà rơi/mở (cảm giác va chạm). */
const CameraRig: React.FC<{
  phase: GamePhase;
  cardMode: CardMode;
  impactRef: React.RefObject<ImpactSignal>;
}> = ({ phase, cardMode, impactRef }) => {
  const { size } = useThree();
  const target = React.useMemo(() => new THREE.Vector3(), []);
  const look = React.useMemo(() => new THREE.Vector3(), []);
  const basePos = React.useRef(new THREE.Vector3());
  const initialized = React.useRef(false);

  useFrame((state) => {
    const aspect = size.width / Math.max(1, size.height);
    const camera = state.camera;

    if (!initialized.current) {
      basePos.current.copy(camera.position);
      initialized.current = true;
    }

    let smoothing = 0.045;

    // Chế độ ĐỌC THIỆP: camera đưa thẳng góc về tấm thiệp, khoảng cách
    // được tính để toàn bộ thiệp luôn nằm trong khung hình (mọi tỉ lệ màn hình)
    if (phase === 'letter_reading' && cardMode === 'expanded') {
      const view = getCardReadCamera(aspect);
      target.set(view.position[0], view.position[1], view.position[2]);
      look.set(view.lookAt[0], view.lookAt[1], view.lookAt[2]);
      smoothing = 0.075;
    } else {
      const scene =
        phase === 'letter_reading' ? getCardStageCamera(aspect) : getSceneCamera(phase, aspect);
      target.set(scene.position[0], scene.position[1], scene.position[2]);
      look.set(scene.lookAt[0], scene.lookAt[1], scene.lookAt[2]);
    }

    basePos.current.lerp(target, smoothing);
    camera.position.copy(basePos.current);

    // Rung camera theo tín hiệu va chạm (tắt dần trong ~0.6s)
    const impact = impactRef.current;
    let roll = 0;
    if (impact && impact.time >= 0) {
      const elapsed = state.clock.getElapsedTime() - impact.time;
      if (elapsed >= 0 && elapsed < 0.6) {
        const decay = 1 - elapsed / 0.6;
        const amp = impact.power * 0.075 * decay * decay;
        const f = elapsed * 46;
        camera.position.x += Math.sin(f * 1.7) * amp;
        camera.position.y += Math.sin(f * 2.3) * amp * 0.75;
        camera.position.z += Math.sin(f * 3.1) * amp * 0.4;
        roll = Math.sin(f * 1.3) * amp * 0.28;
      }
    }

    camera.lookAt(look);
    if (roll !== 0) camera.rotation.z += roll;
  });

  return null;
};

export const SceneContainer: React.FC<SceneContainerProps> = ({
  phase,
  wonItem,
  cardData,
  onLanded,
  onBoxClick,
  onBoxOpened,
  isCardOpen = false,
  cardMode = 'compact',
  onToggleCard,
  skipToken = 0,
  replayToken = 0,
  reducedMotion = false,
}) => {
  const showCharacter =
    (phase === 'reward_stage' || phase === 'secret_reveal' || phase === 'letter_reading') &&
    wonItem !== null;
  const showFireworks =
    phase === 'secret_reveal' || (wonItem?.rarity === 'secret' && phase === 'reward_stage');
  const showCard = phase === 'letter_reading' && cardData !== null;

  const isReading = phase === 'letter_reading' && cardMode === 'expanded';
  const characterPosition = getCharacterPosition(phase, cardMode === 'expanded');
  const characterScale = getCharacterScale(phase, cardMode === 'expanded');

  // Tín hiệu va chạm dùng chung giữa hộp quà và camera (cùng một đồng hồ R3F)
  const impactRef = React.useRef<ImpactSignal>({ time: -1, power: 0 });

  // Hộp quà trôi sang một bên để nhường sân khấu cho nhân vật / tấm thiệp
  const docked =
    phase === 'roulette' ||
    phase === 'secret_reveal' ||
    phase === 'reward_stage' ||
    phase === 'letter_reading';

  const burstParticles = showFireworks || phase === 'box_opening';

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        camera={{ position: [0, 4, 8], fov: 45, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
      >
        <CameraRig phase={phase} cardMode={cardMode} impactRef={impactRef} />

        {/* Sương mù tạo chiều sâu cho khu vườn */}
        <fog attach="fog" args={['#FFE7F0', 11, 27]} />

        {/* Ánh sáng studio mềm mại + đèn viền cho khối 3D nổi hơn */}
        <hemisphereLight intensity={0.55} color="#FFF3F8" groundColor="#C4E8C8" />
        <ambientLight intensity={0.34} color="#FFF0F5" />
        <directionalLight
          position={[5.5, 9, 5]}
          intensity={1.85}
          color="#FFF8E7"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0006}
        />
        <directionalLight position={[-6, 5, -4]} intensity={0.55} color="#E9D4F5" />
        {/* Đèn viền phía sau: tách nhân vật khỏi nền, viền hồng nhẹ */}
        <directionalLight position={[0.5, 4.2, -7.5]} intensity={0.85} color="#FFD9E8" />
        <pointLight position={[0, 1.4, 4]} intensity={0.3} color="#FFD9E4" />

        {/* Khu vườn hoa */}
        <FlowerGarden3D isOpening={docked} reducedMotion={reducedMotion} />

        {/* Cánh hoa & ngôi sao bay — giảm bớt khi đang đọc thiệp */}
        <FloatingParticles
          count={isReading ? 14 : reducedMotion ? 18 : 46}
          burst={burstParticles}
          reducedMotion={reducedMotion}
        />

        {/* Pháo hoa 3D khi trúng Secret */}
        <Fireworks3D active={showFireworks} reducedMotion={reducedMotion} />

        {/* Hộp quà */}
        <GiftBox3D
          onLanded={onLanded}
          onBoxClick={onBoxClick}
          onOpened={onBoxOpened}
          disabled={phase !== 'box_idle'}
          docked={docked}
          reducedMotion={reducedMotion}
          impactRef={impactRef}
        />

        {/* Nhân vật trúng thưởng — đứng cạnh thiệp, không che chữ */}
        {showCharacter && wonItem && (
          <RewardReveal
            key={wonItem.id}
            rarity={wonItem.rarity}
            position={characterPosition}
            reducedMotion={reducedMotion}
          >
            <CharacterRenderer
              characterType={wonItem.characterType}
              scale={characterScale}
              interactive={phase === 'reward_stage'}
            />
          </RewardReveal>
        )}

        {/* Tấm thiệp chúc mừng 3D */}
        {showCard && (
          <GreetingCard3D
            isOpen={isCardOpen}
            mode={cardMode}
            data={cardData}
            onToggleOpen={onToggleCard ?? (() => {})}
            reducedMotion={reducedMotion}
            skipToken={skipToken}
            replayToken={replayToken}
          />
        )}
      </Canvas>
    </div>
  );
};
