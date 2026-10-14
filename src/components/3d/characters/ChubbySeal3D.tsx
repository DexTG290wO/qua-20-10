import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const ChubbySeal3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flipperLRef = useRef<THREE.Group>(null);
  const flipperRRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

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
        groupRef.current.position.y = Math.sin(progress) * 0.8;
        groupRef.current.rotation.y += delta * 6;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        // Seal bobbing
        groupRef.current.position.y = Math.sin(t * 2.5) * 0.04;
        groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.03;
      }
    }

    // Clapping flippers
    if (flipperLRef.current && flipperRRef.current) {
      const clap = Math.sin(t * (isInteracting ? 18 : 6)) * 0.35;
      flipperLRef.current.rotation.y = clap + 0.4;
      flipperRRef.current.rotation.y = -clap - 0.4;
    }

    // Tail flipper waggle
    if (tailRef.current) {
      tailRef.current.rotation.x = Math.sin(t * 4) * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- CHUBBY SEAL BODY — sits on floor, very round --- */}
      <group position={[0, 0.38, 0]}>
        {/* Very round chubby body */}
        <mesh castShadow receiveShadow scale={[0.7, 0.65, 0.6]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#7B9BAF" roughness={0.25} />
        </mesh>
        {/* White belly */}
        <mesh position={[0, -0.12, 0.18]} scale={[0.52, 0.48, 0.42]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#E8F0F5" roughness={0.3} />
        </mesh>

        {/* Large dark sparkly eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.14, 0.5]}
          spacing={0.6}
          size={0.34}
          irisColor="#1A237E"
          pupilColor="#0A0B1A"
          tilt={0.2}
          blinkSeed={6}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.5, -0.02, 0.47]} rotationY={-0.45} color="rgba(255, 128, 171, 0.7)" />
        <KawaiiBlush position={[0.5, -0.02, 0.47]} rotationY={0.45} color="rgba(255, 128, 171, 0.7)" />

        {/* Cute Muzzle */}
        <mesh position={[0, -0.04, 0.6]} scale={[0.22, 0.16, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#D4E4EE" roughness={0.3} />
        </mesh>
        {/* Dark Nose */}
        <mesh position={[0, 0.02, 0.7]} scale={[0.07, 0.05, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#263238" />
        </mesh>

        {/* Left Flipper — flat sphere [0.15, 0.06, 0.35] */}
        <group ref={flipperLRef} position={[-0.72, -0.22, 0.05]}>
          <mesh scale={[0.15, 0.06, 0.35]} rotation={[0.1, 0, -0.25]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#6A8D9F" roughness={0.3} />
          </mesh>
        </group>

        {/* Right Flipper */}
        <group ref={flipperRRef} position={[0.72, -0.22, 0.05]}>
          <mesh scale={[0.15, 0.06, 0.35]} rotation={[0.1, 0, 0.25]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#6A8D9F" roughness={0.3} />
          </mesh>
        </group>

        {/* Rear Tail Flippers */}
        <group ref={tailRef} position={[0, -0.58, -0.56]}>
          <mesh position={[-0.14, 0, 0]} scale={[0.18, 0.05, 0.28]} rotation={[0, -0.3, 0]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#6A8D9F" />
          </mesh>
          <mesh position={[0.14, 0, 0]} scale={[0.18, 0.05, 0.28]} rotation={[0, 0.3, 0]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#6A8D9F" />
          </mesh>
        </group>

        {/* Tiny Star on Head */}
        <group position={[0, 0.62, 0.08]} scale={0.16}>
          <mesh rotation={[0.4, 0, 0]}>
            <coneGeometry args={[1, 0.8, 5]} />
            <meshStandardMaterial color="#FFD54F" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.82, 32]} />
        <meshBasicMaterial color="#37474F" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};
