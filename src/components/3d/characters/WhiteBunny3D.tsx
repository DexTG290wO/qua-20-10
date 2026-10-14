import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const WhiteBunny3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
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

    if (groupRef.current) {
      if (isInteracting) {
        setJumpTime((prev) => prev + delta);
        const progress = Math.min(jumpTime * 3.5, Math.PI);
        groupRef.current.position.y = Math.sin(progress) * 1.1;
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        groupRef.current.position.y = Math.sin(t * 3) * 0.05;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 2) * 0.04;
      headRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
    }

    // Bunny ears flutter
    if (earLRef.current && earRRef.current) {
      earLRef.current.rotation.z = Math.sin(t * 4) * 0.1 - 0.1;
      earRRef.current.rotation.z = -Math.sin(t * 4) * 0.1 + 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* White fluffy head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.58]}
          spacing={0.52}
          size={0.28}
          irisColor="#7B1FA2"
          pupilColor="#2A0A46"
          tilt={0.2}
          blinkSeed={4}
        />

        {/* Rosy Cheeks */}
        <KawaiiBlush position={[-0.45, -0.1, 0.56]} rotationY={-0.4} color="rgba(240, 98, 146, 0.68)" />
        <KawaiiBlush position={[0.45, -0.1, 0.56]} rotationY={0.4} color="rgba(240, 98, 146, 0.68)" />

        {/* Tiny Pink Nose */}
        <mesh position={[0, -0.06, 0.72]} scale={[0.07, 0.06, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF80AB" />
        </mesh>

        {/* Left Long Ear — closer together, taller */}
        <group ref={earLRef} position={[-0.22, 0.75, 0]}>
          <mesh scale={[0.15, 0.75, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.09, 0.55, 0.07]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#F8BBD0" roughness={0.3} />
          </mesh>
        </group>

        {/* Right Long Ear */}
        <group ref={earRRef} position={[0.22, 0.75, 0]}>
          <mesh scale={[0.15, 0.75, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.09, 0.55, 0.07]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#F8BBD0" roughness={0.3} />
          </mesh>
        </group>

        {/* Daisy Flower on Ear */}
        <group position={[0.42, 0.65, 0.2]} rotation={[0.2, 0.2, -0.4]} scale={0.25}>
          {/* Flower Center */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#FFD54F" />
          </mesh>
          {/* Petals */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              rotation={[0, 0, (i * Math.PI * 2) / 5]}
              position={[
                0.35 * Math.cos((i * Math.PI * 2) / 5),
                0.35 * Math.sin((i * Math.PI * 2) / 5),
                0,
              ]}
              scale={[0.22, 0.45, 0.1]}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          ))}
        </group>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        <mesh castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* Front Paws */}
        <mesh position={[-0.2, -0.38, 0.35]} scale={[0.14, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.2, -0.38, 0.35]} scale={[0.14, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Cotton-ball Tail on Back */}
        <mesh position={[0, -0.05, -0.55]} scale={[0.2, 0.2, 0.2]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
        </mesh>
        {/* Extra fluff bumps on tail */}
        <mesh position={[0.06, 0.02, -0.58]} scale={[0.1, 0.1, 0.1]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
        </mesh>
        <mesh position={[-0.06, -0.04, -0.58]} scale={[0.1, 0.1, 0.1]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
        </mesh>
      </group>

      {/* Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.7, 32]} />
        <meshBasicMaterial color="#311B92" transparent opacity={0.12} />
      </mesh>
    </group>
  );
};
