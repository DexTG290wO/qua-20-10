import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const SecretDestinyPup3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [jumpTime, setJumpTime] = useState(0);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!interactive) return;
    setIsInteracting(true);
    setJumpTime(0);
    audioEngine.playWinSecret();
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      if (isInteracting) {
        setJumpTime((prev) => prev + delta);
        const progress = Math.min(jumpTime * 3.5, Math.PI);
        groupRef.current.position.y = Math.sin(progress) * 1.2;
        groupRef.current.rotation.y += delta * 8;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        groupRef.current.position.y = Math.sin(t * 2.2) * 0.1 + 0.12;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2) * 0.08;
    }

    if (orbitRef.current) {
      orbitRef.current.rotation.y = t * 1.2;
      orbitRef.current.rotation.x = Math.sin(t * 0.8) * 0.2;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* Cosmic Orbiting Planetary Rings */}
      <group ref={orbitRef} position={[0, 0.5, 0]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.2, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFB300"
            emissiveIntensity={0.8}
            metalness={0.9}
          />
        </mesh>
        <mesh position={[1.2, 0, 0]} scale={[0.1, 0.1, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF9C4" emissive="#FFD54F" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Golden Cream Head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#FFF8E1" roughness={0.25} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.58]}
          spacing={0.52}
          size={0.28}
          irisColor="#FFA000"
          pupilColor="#6B3B00"
          tilt={0.2}
          blinkSeed={13}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.45, -0.1, 0.56]} rotationY={-0.4} color="rgba(255, 179, 0, 0.65)" />
        <KawaiiBlush position={[0.45, -0.1, 0.56]} rotationY={0.4} color="rgba(255, 179, 0, 0.65)" />

        {/* White Muzzle */}
        <mesh position={[0, -0.12, 0.65]} scale={[0.28, 0.2, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* Golden Nose */}
        <mesh position={[0, -0.05, 0.8]} scale={[0.08, 0.06, 0.05]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF8F00" />
        </mesh>

        {/* Golden Floppy Pup Ears */}
        <mesh position={[-0.52, 0.45, 0]} rotation={[0, 0, -0.4]} scale={[0.2, 0.45, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFE082" />
        </mesh>
        <mesh position={[0.52, 0.45, 0]} rotation={[0, 0, 0.4]} scale={[0.2, 0.45, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFE082" />
        </mesh>
      </group>

      {/* --- BODY & STELLAR COLLAR --- */}
      <group position={[0, 0.05, 0]}>
        <mesh castShadow receiveShadow scale={[0.56, 0.62, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FFF8E1" roughness={0.25} />
        </mesh>

        {/* Golden Star Collar */}
        <mesh position={[0, 0.35, 0]} scale={[0.48, 0.08, 0.48]}>
          <torusGeometry args={[1, 0.18, 16, 32]} />
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
            emissive="#FFD700"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Paws */}
        <mesh position={[-0.22, -0.42, 0.28]} scale={[0.15, 0.15, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.22, -0.42, 0.28]} scale={[0.15, 0.15, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Wagging Golden Tail */}
        <mesh position={[0, -0.15, -0.52]} rotation={[0.4, 0, 0]} scale={[0.08, 0.35, 0.08]}>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#FFE082" />
        </mesh>
      </group>

      {/* Radiant Floor */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.95, 32]} />
        <meshBasicMaterial color="#FFCA28" transparent opacity={0.35} />
      </mesh>
    </group>
  );
};
