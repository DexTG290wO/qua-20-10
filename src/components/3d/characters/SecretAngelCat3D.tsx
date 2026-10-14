import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const SecretAngelCat3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Group>(null);
  const wingsRef = useRef<THREE.Group>(null);

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
        groupRef.current.position.y = Math.sin(t * 2) * 0.12 + 0.15;
      }
    }

    if (haloRef.current) {
      haloRef.current.rotation.y = t * 1.5;
    }

    if (wingsRef.current) {
      const flap = Math.sin(t * (isInteracting ? 16 : 4)) * 0.25;
      wingsRef.current.children.forEach((wing, idx) => {
        const side = idx % 2 === 0 ? 1 : -1;
        wing.rotation.y = side * (flap + 0.3);
      });
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.74, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.1} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.6]}
          spacing={0.52}
          size={0.28}
          irisColor="#FFD54F"
          pupilColor="#7A4A00"
          tilt={0.2}
          blinkSeed={14}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.45, -0.1, 0.56]} rotationY={-0.4} color="rgba(255, 179, 0, 0.65)" />
        <KawaiiBlush position={[0.45, -0.1, 0.56]} rotationY={0.4} color="rgba(255, 179, 0, 0.65)" />

        {/* Muzzle */}
        <mesh position={[0, -0.06, 0.7]} scale={[0.2, 0.14, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFDE7" />
        </mesh>
        {/* Golden Nose */}
        <mesh position={[0, -0.02, 0.78]} scale={[0.07, 0.05, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFB300" />
        </mesh>

        {/* Rounded cat ears with inner ear */}
        <group position={[-0.42, 0.6, 0]} rotation={[0, 0, -0.18]}>
          <mesh scale={[0.24, 0.34, 0.14]}>
            <sphereGeometry args={[1, 18, 18]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.02, 0.07]} scale={[0.14, 0.22, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFD0E0" roughness={0.4} />
          </mesh>
        </group>
        <group position={[0.42, 0.6, 0]} rotation={[0, 0, 0.18]}>
          <mesh scale={[0.24, 0.34, 0.14]}>
            <sphereGeometry args={[1, 18, 18]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.02, 0.07]} scale={[0.14, 0.22, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFD0E0" roughness={0.4} />
          </mesh>
        </group>

        {/* Triple Seraph Halo */}
        <group ref={haloRef} position={[0, 0.88, 0]} rotation={[0.2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.38, 0.04, 16, 32]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.8}
              metalness={0.9}
            />
          </mesh>
        </group>
      </group>

      {/* --- BODY & 4 SERAPH WINGS --- */}
      <group position={[0, 0.05, 0]}>
        <mesh castShadow receiveShadow scale={[0.55, 0.62, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>

        {/* 4 Seraph Golden Feather Wings */}
        <group ref={wingsRef} position={[0, 0.2, -0.2]}>
          {/* Upper Left */}
          <mesh position={[-0.48, 0.25, 0]} rotation={[0, 0, -0.3]} scale={[0.6, 0.35, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFE082" emissive="#FFD54F" emissiveIntensity={0.5} />
          </mesh>
          {/* Upper Right */}
          <mesh position={[0.48, 0.25, 0]} rotation={[0, 0, 0.3]} scale={[0.6, 0.35, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFE082" emissive="#FFD54F" emissiveIntensity={0.5} />
          </mesh>
          {/* Lower Left */}
          <mesh position={[-0.42, -0.15, 0]} rotation={[0, 0, -0.6]} scale={[0.48, 0.28, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFCA28" emissiveIntensity={0.4} />
          </mesh>
          {/* Lower Right */}
          <mesh position={[0.42, -0.15, 0]} rotation={[0, 0, 0.6]} scale={[0.48, 0.28, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFCA28" emissiveIntensity={0.4} />
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
      </group>

      {/* Radiant Floor */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.95, 32]} />
        <meshBasicMaterial color="#FFB300" transparent opacity={0.35} />
      </mesh>
    </group>
  );
};
