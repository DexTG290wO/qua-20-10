import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const OrangeCat3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);

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

    // Idle breathing & bobbing
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
        groupRef.current.position.y = Math.sin(t * 2.5) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 1.2) * 0.1;
      }
    }

    // Head tilt
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2) * 0.06;
      headRef.current.rotation.x = Math.sin(t * 1.5) * 0.04;
    }

    // Tail wagging
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 4) * 0.35 + 0.2;
    }

    // Ear twitching
    if (earLRef.current && earRRef.current) {
      earLRef.current.rotation.z = Math.sin(t * 5) * 0.07 - 0.15;
      earRRef.current.rotation.z = -Math.sin(t * 5 + 0.8) * 0.07 + 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick} position={[0, 0, 0]}>
      {/* --- HEAD GROUP --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Head Base — radius 0.75, face surface at z≈0.75 */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.75, 32, 32]} />
          <meshStandardMaterial color="#FF9E64" roughness={0.4} />
        </mesh>

        {/* Cheek puffs */}
        <mesh position={[-0.46, -0.14, 0.28]} scale={[0.4, 0.35, 0.35]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFB07C" roughness={0.4} />
        </mesh>
        <mesh position={[0.46, -0.14, 0.28]} scale={[0.4, 0.35, 0.35]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFB07C" roughness={0.4} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights, symmetric & blinks */}
        <KawaiiEyes
          position={[0, 0.07, 0.6]}
          spacing={0.52}
          size={0.28}
          irisColor="#2E7D32"
          pupilColor="#12251A"
          tilt={0.18}
          blinkSeed={1}
        />

        {/* Rosy cheeks / blush */}
        <KawaiiBlush position={[-0.49, -0.11, 0.56]} rotationY={-0.38} />
        <KawaiiBlush position={[0.49, -0.11, 0.56]} rotationY={0.38} />

        {/* Snout muzzle */}
        <mesh position={[0, -0.1, 0.69]} scale={[0.22, 0.16, 0.14]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF5EB" roughness={0.4} />
        </mesh>
        {/* Tiny pink nose */}
        <mesh position={[0, -0.05, 0.77]} scale={[0.07, 0.05, 0.05]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF8BA7" roughness={0.3} />
        </mesh>

        {/* Whiskers — left side: 3 thin cylinders */}
        <mesh position={[-0.38, -0.12, 0.62]} rotation={[Math.PI / 2, 0, 0.12]} scale={[0.008, 0.28, 0.008]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color="#D4A880" />
        </mesh>
        <mesh position={[-0.38, -0.16, 0.62]} rotation={[Math.PI / 2, 0, 0]} scale={[0.008, 0.28, 0.008]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color="#D4A880" />
        </mesh>
        <mesh position={[-0.38, -0.2, 0.61]} rotation={[Math.PI / 2, 0, -0.12]} scale={[0.008, 0.28, 0.008]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color="#D4A880" />
        </mesh>
        {/* Whiskers — right side */}
        <mesh position={[0.38, -0.12, 0.62]} rotation={[Math.PI / 2, 0, -0.12]} scale={[0.008, 0.28, 0.008]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color="#D4A880" />
        </mesh>
        <mesh position={[0.38, -0.16, 0.62]} rotation={[Math.PI / 2, 0, 0]} scale={[0.008, 0.28, 0.008]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color="#D4A880" />
        </mesh>
        <mesh position={[0.38, -0.2, 0.61]} rotation={[Math.PI / 2, 0, 0.12]} scale={[0.008, 0.28, 0.008]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color="#D4A880" />
        </mesh>

        {/* Left Ear — cone wrapped in group, tilted 0.25 rad inward */}
        <group ref={earLRef} position={[-0.44, 0.6, 0]} rotation={[0, 0.25, -0.15]}>
          <mesh>
            <coneGeometry args={[0.26, 0.44, 16]} />
            <meshStandardMaterial color="#FF8C42" roughness={0.4} />
          </mesh>
          {/* Inner ear pink */}
          <mesh position={[0, 0, 0.04]} scale={[0.6, 0.62, 0.6]}>
            <coneGeometry args={[0.26, 0.44, 16]} />
            <meshStandardMaterial color="#FFB0C1" roughness={0.4} />
          </mesh>
        </group>

        {/* Right Ear */}
        <group ref={earRRef} position={[0.44, 0.6, 0]} rotation={[0, -0.25, 0.15]}>
          <mesh>
            <coneGeometry args={[0.26, 0.44, 16]} />
            <meshStandardMaterial color="#FF8C42" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.6, 0.62, 0.6]}>
            <coneGeometry args={[0.26, 0.44, 16]} />
            <meshStandardMaterial color="#FFB0C1" roughness={0.4} />
          </mesh>
        </group>

        {/* Forehead tiger stripes */}
        <mesh position={[0, 0.42, 0.62]} scale={[0.1, 0.22, 0.03]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#E66722" />
        </mesh>
        <mesh position={[-0.18, 0.38, 0.58]} scale={[0.08, 0.16, 0.03]} rotation={[-0.3, 0.2, -0.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#E66722" />
        </mesh>
        <mesh position={[0.18, 0.38, 0.58]} scale={[0.08, 0.16, 0.03]} rotation={[-0.3, -0.2, 0.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#E66722" />
        </mesh>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        {/* Main body */}
        <mesh castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FF9E64" roughness={0.4} />
        </mesh>
        {/* White fluffy bib */}
        <mesh position={[0, 0.08, 0.38]} scale={[0.34, 0.45, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.5} />
        </mesh>

        {/* Front paws */}
        <mesh position={[-0.26, -0.45, 0.32]} scale={[0.16, 0.14, 0.24]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.4} />
        </mesh>
        <mesh position={[0.26, -0.45, 0.32]} scale={[0.16, 0.14, 0.24]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.4} />
        </mesh>

        {/* Back haunches */}
        <mesh position={[-0.4, -0.42, -0.1]} scale={[0.22, 0.18, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF9E64" roughness={0.4} />
        </mesh>
        <mesh position={[0.4, -0.42, -0.1]} scale={[0.22, 0.18, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF9E64" roughness={0.4} />
        </mesh>

        {/* Curled tail */}
        <group ref={tailRef} position={[0, -0.2, -0.45]}>
          <mesh rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.65, 16]} />
            <meshStandardMaterial color="#FF9E64" roughness={0.4} />
          </mesh>
          {/* White tail tip */}
          <mesh position={[0, 0.35, 0.05]} scale={[0.08, 0.1, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF8F0" />
          </mesh>
        </group>
      </group>

      {/* Ground shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.75, 32]} />
        <meshBasicMaterial color="#4A2E1A" transparent opacity={0.18} />
      </mesh>
    </group>
  );
};
