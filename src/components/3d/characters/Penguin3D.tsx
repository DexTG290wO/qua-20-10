import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

// ── Bảng màu "tuxedo" ────────────────────────────────────────
const FEATHER_DARK = '#232A3D'; // đen ngả xanh cho bộ vest
const FEATHER_DARK_2 = '#1A2031'; // mảng tối hơn (cánh, mào)
const SHIRT = '#FBF6EF'; // áo sơ mi trắng ngà
const BEAK = '#FF9A2E';
const BEAK_DEEP = '#E06E00';
const FOOT = '#FF8F1F';
const BOW = '#F26C99';
const BOW_DEEP = '#C7305F';

/** Chi tiết áo sơ mi: dải cổ trắng + ve áo + khuy. */
const ShirtFront: React.FC = () => (
  <group position={[0, -0.02, 0.3]}>
    {/* Cổ áo trắng */}
    <mesh position={[0, 0.3, 0.06]} rotation={[0.35, 0, 0]} scale={[0.3, 0.12, 0.26]}>
      <torusGeometry args={[1, 0.34, 12, 28]} />
      <meshPhysicalMaterial color={SHIRT} roughness={0.55} clearcoat={0.25} />
    </mesh>

    {/* Hai ve áo chéo nhau */}
    <mesh position={[-0.13, 0.16, 0.12]} rotation={[0.15, 0.18, 0.55]} scale={[0.07, 0.24, 0.04]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial color={FEATHER_DARK_2} roughness={0.35} clearcoat={0.5} />
    </mesh>
    <mesh position={[0.13, 0.16, 0.12]} rotation={[0.15, -0.18, -0.55]} scale={[0.07, 0.24, 0.04]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial color={FEATHER_DARK_2} roughness={0.35} clearcoat={0.5} />
    </mesh>

    {/* Khuy áo nhỏ */}
    {[0.02, -0.16, -0.34].map((y, i) => (
      <mesh key={i} position={[0, y, 0.19]} scale={0.024}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshPhysicalMaterial color={i === 0 ? '#FFFFFF' : '#E4DACB'} roughness={0.3} clearcoat={0.6} />
      </mesh>
    ))}
  </group>
);

/** Nơ hồng pastel: hai cánh nơ, nút giữa và dải quấn quanh cổ. */
const PinkBowtie: React.FC = () => (
  <group position={[0, 0.62, 0.34]} scale={0.3}>
    {/* Dải quấn quanh cổ */}
    <mesh rotation={[0.25, 0, 0]} scale={[0.115, 0.085, 0.1]}>
      <torusGeometry args={[1, 0.3, 12, 26]} />
      <meshPhysicalMaterial color={FEATHER_DARK_2} roughness={0.4} clearcoat={0.4} />
    </mesh>

    {/* Cánh nơ trái/phải — hơi khum cho có độ phồng */}
    <mesh position={[-0.62, 0.02, 0]} rotation={[0, 0.25, 0.12]} scale={[0.62, 0.44, 0.3]}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshPhysicalMaterial color={BOW} roughness={0.32} clearcoat={0.55} clearcoatRoughness={0.3} />
    </mesh>
    <mesh position={[0.62, 0.02, 0]} rotation={[0, -0.25, -0.12]} scale={[0.62, 0.44, 0.3]}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshPhysicalMaterial color={BOW} roughness={0.32} clearcoat={0.55} clearcoatRoughness={0.3} />
    </mesh>

    {/* Vân gấp trên cánh nơ */}
    <mesh position={[-0.55, 0.02, 0.12]} rotation={[0, 0.25, 0.5]} scale={[0.3, 0.06, 0.16]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshPhysicalMaterial color={BOW_DEEP} roughness={0.4} />
    </mesh>
    <mesh position={[0.55, 0.02, 0.12]} rotation={[0, -0.25, -0.5]} scale={[0.3, 0.06, 0.16]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshPhysicalMaterial color={BOW_DEEP} roughness={0.4} />
    </mesh>

    {/* Nút giữa */}
    <mesh scale={[0.26, 0.3, 0.24]}>
      <sphereGeometry args={[1, 18, 18]} />
      <meshPhysicalMaterial color={BOW_DEEP} roughness={0.28} clearcoat={0.6} />
    </mesh>
  </group>
);

/** Cánh chèo: dài, thuôn, hơi cong ra sau và có viền sáng. */
const Flipper: React.FC<{ side: 1 | -1 }> = ({ side }) => (
  <group position={[side * 0.53, 0.16, -0.02]} rotation={[0.08, side * 0.22, side * -0.18]}>
    {/* Thân cánh */}
    <mesh castShadow scale={[0.13, 0.46, 0.22]}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshPhysicalMaterial color={FEATHER_DARK_2} roughness={0.34} clearcoat={0.45} />
    </mesh>
    {/* Chóp cánh thon */}
    <mesh position={[0, -0.34, 0.01]} scale={[0.085, 0.2, 0.14]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial color={FEATHER_DARK} roughness={0.38} clearcoat={0.45} />
    </mesh>
    {/* Viền sáng mép ngoài cho cánh tách khỏi thân */}
    <mesh position={[side * 0.055, 0.02, 0]} scale={[0.02, 0.4, 0.19]}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshPhysicalMaterial color="#3C4560" roughness={0.4} />
    </mesh>
  </group>
);

/** Bàn chân có màng: đế dẹt + ba ngón. */
const WebbedFoot: React.FC<{ side: 1 | -1 }> = ({ side }) => (
  <group position={[side * 0.19, -0.44, 0.16]} rotation={[0, side * -0.28, 0]}>
    {/* Đế chân */}
    <mesh castShadow scale={[0.17, 0.045, 0.22]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial color={FOOT} roughness={0.42} clearcoat={0.3} />
    </mesh>
    {/* Ba ngón xoè ra trước */}
    {[-1, 0, 1].map((k) => (
      <mesh
        key={k}
        position={[k * 0.075, -0.005, 0.17]}
        rotation={[0, k * 0.3, 0]}
        scale={[0.045, 0.03, 0.1]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshPhysicalMaterial color={k === 0 ? FOOT : BEAK_DEEP} roughness={0.45} />
      </mesh>
    ))}
  </group>
);

export const Penguin3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bowRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [jumpTime, setJumpTime] = useState(0);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!interactive) return;
    setIsInteracting(true);
    setJumpTime(0);
    audioEngine.playClick();
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      if (isInteracting) {
        setJumpTime((prev) => prev + delta);
        const progress = Math.min(jumpTime * 3.5, Math.PI);
        groupRef.current.position.y = Math.sin(progress) * 0.85;
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        // Dáng đi lạch bạch: lắc người + nhún nhẹ
        groupRef.current.rotation.z = Math.sin(t * 3.4) * 0.075;
        groupRef.current.position.y = Math.abs(Math.sin(t * 3.4)) * 0.035;
      }
    }

    // Cúi chào lịch thiệp theo chu kỳ (đúng chất "quý tộc nhỏ lịch thiệp")
    if (bowRef.current) {
      const cycle = 9.5; // giây
      const bowWindow = 1.8;
      const local = t % cycle;
      const raw = local > cycle - bowWindow ? (local - (cycle - bowWindow)) / bowWindow : 0;
      const bow = raw > 0 ? Math.sin(raw * Math.PI) : 0;
      bowRef.current.rotation.x = bow * 0.34;
      bowRef.current.position.y = -bow * 0.02;
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2) * 0.035;
      headRef.current.rotation.y = Math.sin(t * 0.9) * 0.06;
    }

    if (wingLRef.current && wingRRef.current) {
      const flap = Math.sin(t * (isInteracting ? 18 : 4.6)) * 0.3;
      wingLRef.current.rotation.z = flap - 0.22;
      wingRRef.current.rotation.z = -flap + 0.22;
      // Khi cúi chào thì hai cánh khẽ đưa ra trước
      const flourish = bowRef.current ? bowRef.current.rotation.x : 0;
      wingLRef.current.rotation.x = flourish * 0.7;
      wingRRef.current.rotation.x = flourish * 0.7;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* Bàn chân để ngoài nhóm cúi chào — thân cúi nhưng chân vẫn đứng yên */}
      <WebbedFoot side={-1} />
      <WebbedFoot side={1} />

      {/* Nhóm cúi chào: thân trên xoay quanh hông */}
      <group ref={bowRef}>
        {/* ── THÂN (dáng quả lê) ── */}
        <group position={[0, 0.22, 0]}>
          {/* Thân chính */}
          <mesh castShadow receiveShadow scale={[0.56, 0.64, 0.54]}>
            <sphereGeometry args={[1, 40, 40]} />
            <meshPhysicalMaterial
              color={FEATHER_DARK}
              roughness={0.28}
              metalness={0.06}
              clearcoat={0.5}
              clearcoatRoughness={0.32}
            />
          </mesh>
          {/* Phần hông nở ra cho dáng quả lê */}
          <mesh position={[0, -0.34, 0]} scale={[0.5, 0.34, 0.48]} castShadow>
            <sphereGeometry args={[1, 28, 28]} />
            <meshPhysicalMaterial
              color={FEATHER_DARK}
              roughness={0.3}
              clearcoat={0.5}
              clearcoatRoughness={0.32}
            />
          </mesh>

          {/* Bụng trắng (áo sơ mi) */}
          <mesh position={[0, -0.04, 0.26]} scale={[0.4, 0.52, 0.3]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshPhysicalMaterial color={SHIRT} roughness={0.5} clearcoat={0.3} />
          </mesh>
          <mesh position={[0, -0.38, 0.2]} scale={[0.32, 0.24, 0.24]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial color={SHIRT} roughness={0.5} clearcoat={0.3} />
          </mesh>

          <ShirtFront />

          {/* Cánh chèo */}
          <group ref={wingLRef}>
            <Flipper side={-1} />
          </group>
          <group ref={wingRRef}>
            <Flipper side={1} />
          </group>

          {/* Đuôi nhỏ phía sau */}
          <mesh position={[0, -0.36, -0.42]} rotation={[-0.9, 0, 0]} scale={[0.16, 0.07, 0.26]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshPhysicalMaterial color={FEATHER_DARK_2} roughness={0.4} clearcoat={0.4} />
          </mesh>

          <PinkBowtie />
        </group>

        {/* ── ĐẦU ── */}
        <group ref={headRef} position={[0, 0.92, 0]}>
          <mesh castShadow receiveShadow scale={[1, 0.97, 0.98]}>
            <sphereGeometry args={[0.53, 40, 40]} />
            <meshPhysicalMaterial
              color={FEATHER_DARK}
              roughness={0.26}
              metalness={0.06}
              clearcoat={0.55}
              clearcoatRoughness={0.3}
            />
          </mesh>

          {/* Mảng mặt trắng */}
          <mesh position={[0, -0.03, 0.3]} scale={[0.62, 0.66, 0.56]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshPhysicalMaterial color={SHIRT} roughness={0.48} clearcoat={0.3} />
          </mesh>

          {/* Mào lông nhỏ trên đỉnh đầu cho đáng yêu */}
          {[
            { x: -0.07, y: 0.47, z: -0.02, rot: -0.55, s: 1 },
            { x: 0.02, y: 0.5, z: -0.05, rot: -0.72, s: 1.12 },
            { x: 0.1, y: 0.46, z: -0.01, rot: -0.5, s: 0.92 },
          ].map((f, i) => (
            <mesh
              key={i}
              position={[f.x, f.y, f.z]}
              rotation={[f.rot, 0, f.x * 3]}
              scale={[0.05 * f.s, 0.15 * f.s, 0.04 * f.s]}
            >
              <sphereGeometry args={[1, 14, 14]} />
              <meshPhysicalMaterial color={FEATHER_DARK_2} roughness={0.35} clearcoat={0.4} />
            </mesh>
          ))}

          {/* Mắt kawaii: sclera + iris xanh + pupil + 2 đốm sáng, có nháy mắt */}
          <KawaiiEyes
            position={[0, 0.07, 0.44]}
            spacing={0.42}
            size={0.25}
            irisColor="#2E8BE6"
            pupilColor="#071A33"
            highlightColor="#FFFFFF"
            tilt={0.16}
            blinkSeed={7}
          />

          {/* Má ửng hồng */}
          <KawaiiBlush
            position={[-0.38, -0.06, 0.4]}
            rotationY={-0.42}
            size={0.24}
            color="rgba(255, 138, 128, 0.68)"
          />
          <KawaiiBlush
            position={[0.38, -0.06, 0.4]}
            rotationY={0.42}
            size={0.24}
            color="rgba(255, 138, 128, 0.68)"
          />

          {/* Mỏ: phần trên + phần dưới + vệt sáng */}
          <mesh position={[0, -0.05, 0.5]} rotation={[Math.PI / 2 - 0.22, 0, 0]} scale={[0.4, 1, 0.5]}>
            <coneGeometry args={[0.13, 0.3, 16]} />
            <meshPhysicalMaterial color={BEAK} roughness={0.3} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, -0.11, 0.46]} rotation={[Math.PI / 2 - 0.36, 0, 0]} scale={[0.34, 0.7, 0.34]}>
            <coneGeometry args={[0.1, 0.24, 14]} />
            <meshPhysicalMaterial color={BEAK_DEEP} roughness={0.34} clearcoat={0.4} />
          </mesh>
          <mesh position={[-0.03, -0.028, 0.56]} scale={[0.024, 0.024, 0.05]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color="#FFE0B2" />
          </mesh>
        </group>
      </group>

      {/* Vòng bóng mềm (trong game vòng này nằm dưới thảm cỏ nên không thấy) */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.62, 32]} />
        <meshBasicMaterial color="#1A237E" transparent opacity={0.12} />
      </mesh>
    </group>
  );
};
