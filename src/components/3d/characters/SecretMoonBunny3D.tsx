import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const SecretMoonBunny3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const moonRingRef = useRef<THREE.Group>(null);
  const wandRef = useRef<THREE.Group>(null);

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
        // Celestial floating levitation
        groupRef.current.position.y = Math.sin(t * 2) * 0.12 + 0.15;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.6) * 0.05;
      headRef.current.rotation.x = Math.sin(t * 1.8) * 0.04;
    }

    // Bunny ears flutter
    if (earLRef.current && earRRef.current) {
      earLRef.current.rotation.z = Math.sin(t * 3.5) * 0.1 - 0.2;
      earRRef.current.rotation.z = -Math.sin(t * 3.5) * 0.1 + 0.2;
    }

    // Floating Celestial Crescent Moon Ring
    if (moonRingRef.current) {
      moonRingRef.current.rotation.z = t * 0.5;
      moonRingRef.current.rotation.y = Math.sin(t) * 0.2;
    }

    // Star wand gentle sway
    if (wandRef.current) {
      wandRef.current.rotation.z = Math.sin(t * 2.5) * 0.15 + 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- FLOATING CELESTIAL MOON RING IN BACKGROUND --- */}
      <group ref={moonRingRef} position={[0, 0.6, -0.4]}>
        {/* Crescent Moon Arch */}
        <mesh>
          <torusGeometry args={[1.15, 0.08, 16, 64, Math.PI * 1.4]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFE082"
            emissiveIntensity={0.8}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Orbiting Crystal Stars */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[
              1.15 * Math.cos((i * Math.PI) / 2),
              1.15 * Math.sin((i * Math.PI) / 2),
              0,
            ]}
            scale={[0.1, 0.1, 0.1]}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#FFF9C4"
              emissive="#FFD700"
              emissiveIntensity={1}
            />
          </mesh>
        ))}
      </group>

      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Pure Pearl White Head with subtle gold sheen */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.74, 32, 32]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.2}
            metalness={0.15}
          />
        </mesh>

        {/* Eyes (Golden Amber with Twinkle Stars) — true 3D */}
        <KawaiiEyes
          position={[0, 0.06, 0.6]}
          spacing={0.52}
          size={0.28}
          irisColor="#FFD54F"
          pupilColor="#7A4A00"
          highlightColor="#FFFFFF"
          tilt={0.2}
          blinkSeed={12}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.45, -0.1, 0.56]} rotationY={-0.4} color="rgba(255, 171, 0, 0.65)" />
        <KawaiiBlush position={[0.45, -0.1, 0.56]} rotationY={0.4} color="rgba(255, 171, 0, 0.65)" />

        {/* Muzzle */}
        <mesh position={[0, -0.06, 0.72]} scale={[0.18, 0.14, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFDE7" />
        </mesh>
        {/* Golden Nose */}
        <mesh position={[0, -0.02, 0.8]} scale={[0.07, 0.05, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFB300" />
        </mesh>

        {/* Forehead Crescent Moon Symbol */}
        <mesh position={[0, 0.38, 0.65]} scale={[0.1, 0.1, 0.03]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[1, 0.3, 8, 24, Math.PI * 1.5]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.8}
            metalness={0.9}
          />
        </mesh>

        {/* Left Ear */}
        <group ref={earLRef} position={[-0.28, 0.76, 0]}>
          <mesh scale={[0.18, 0.72, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.11, 0.52, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#FFE082"
              emissive="#FFE082"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>

        {/* Right Ear */}
        <group ref={earRRef} position={[0.28, 0.76, 0]}>
          <mesh scale={[0.18, 0.72, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.11, 0.52, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#FFE082"
              emissive="#FFE082"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      </group>

      {/* --- BODY & WAND --- */}
      <group position={[0, 0.05, 0]}>
        <mesh castShadow receiveShadow scale={[0.55, 0.62, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
        </mesh>

        {/* Gold Pearl Ribbon around neck */}
        <mesh position={[0, 0.35, 0]} scale={[0.48, 0.08, 0.48]}>
          <torusGeometry args={[1, 0.15, 16, 32]} />
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.8}
            roughness={0.2}
            emissive="#FFD700"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Star Wand held in paw */}
        <group ref={wandRef} position={[0.42, 0.15, 0.35]}>
          {/* Shaft */}
          <mesh scale={[0.03, 0.65, 0.03]}>
            <cylinderGeometry args={[1, 1, 1, 16]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
          {/* Shining Star Head */}
          <mesh position={[0, 0.35, 0]} scale={[0.16, 0.16, 0.08]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#FFF176"
              emissive="#FFD700"
              emissiveIntensity={0.9}
            />
          </mesh>
        </group>

        {/* Paws */}
        <mesh position={[-0.2, -0.38, 0.32]} scale={[0.14, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.2, -0.38, 0.32]} scale={[0.14, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Fluffy Golden Powder Tail */}
        <mesh position={[0, -0.2, -0.55]} scale={[0.22, 0.22, 0.22]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF9C4" roughness={0.4} />
        </mesh>
      </group>

      {/* Secret Radiant Magic Circle Floor */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.95, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#FFECB3" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};
