import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const TeddyBear3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const heartRef = useRef<THREE.Group>(null);

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
        groupRef.current.position.y = Math.sin(progress) * 0.9;
        groupRef.current.rotation.y += delta * 6;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        groupRef.current.position.y = Math.sin(t * 2.5) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.05;
    }

    // Beating Heart pulse
    if (heartRef.current) {
      const beat = 1 + Math.sin(t * 5) * 0.08 + (Math.sin(t * 10) > 0.8 ? 0.06 : 0);
      heartRef.current.scale.set(beat * 0.35, beat * 0.35, beat * 0.35);
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Warm brown head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#C8956C" roughness={0.6} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.58]}
          spacing={0.52}
          size={0.28}
          irisColor="#5D4037"
          pupilColor="#241410"
          tilt={0.2}
          blinkSeed={8}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.45, -0.1, 0.56]} rotationY={-0.4} color="rgba(255, 64, 129, 0.6)" />
        <KawaiiBlush position={[0.45, -0.1, 0.56]} rotationY={0.4} color="rgba(255, 64, 129, 0.6)" />

        {/* Snout */}
        <mesh position={[0, -0.1, 0.65]} scale={[0.26, 0.2, 0.16]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF5EB" roughness={0.5} />
        </mesh>
        {/* Soft Brown Nose */}
        <mesh position={[0, -0.04, 0.78]} scale={[0.08, 0.06, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>

        {/* Round Teddy Ears — scale [0.25, 0.22, 0.18] at top of head */}
        <group position={[-0.52, 0.56, 0]}>
          <mesh scale={[0.25, 0.22, 0.18]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#B07850" roughness={0.6} />
          </mesh>
          {/* Inner pink ear */}
          <mesh position={[0, 0, 0.1]} scale={[0.16, 0.14, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFD0B5" roughness={0.5} />
          </mesh>
        </group>
        <group position={[0.52, 0.56, 0]}>
          <mesh scale={[0.25, 0.22, 0.18]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#B07850" roughness={0.6} />
          </mesh>
          {/* Inner pink ear */}
          <mesh position={[0, 0, 0.1]} scale={[0.16, 0.14, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFD0B5" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        {/* Round tummy body */}
        <mesh castShadow receiveShadow scale={[0.58, 0.64, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#C8956C" roughness={0.6} />
        </mesh>
        {/* Lighter tummy */}
        <mesh position={[0, 0.04, 0.35]} scale={[0.36, 0.42, 0.22]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F0D5BD" roughness={0.5} />
        </mesh>

        {/* Beating Glowing Heart held in arms */}
        <group ref={heartRef} position={[0, 0.12, 0.45]}>
          {/* Heart: two spheres side by side */}
          <mesh position={[-0.35, 0.2, 0]} scale={[0.45, 0.45, 0.35]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#FF1744"
              emissive="#FF4081"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0.35, 0.2, 0]} scale={[0.45, 0.45, 0.35]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#FF1744"
              emissive="#FF4081"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          {/* Triangular bottom */}
          <mesh position={[0, -0.25, 0]} rotation={[0, 0, Math.PI]} scale={[0.65, 0.7, 0.35]}>
            <coneGeometry args={[1, 1, 16]} />
            <meshStandardMaterial
              color="#FF1744"
              emissive="#FF4081"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Paws hugging the heart */}
        <mesh position={[-0.38, 0.1, 0.38]} rotation={[0, 0.4, 0]} scale={[0.16, 0.16, 0.32]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#C8956C" roughness={0.6} />
        </mesh>
        <mesh position={[0.38, 0.1, 0.38]} rotation={[0, -0.4, 0]} scale={[0.16, 0.16, 0.32]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#C8956C" roughness={0.6} />
        </mesh>

        {/* Feet */}
        <mesh position={[-0.32, -0.45, 0.2]} scale={[0.2, 0.16, 0.28]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#B07850" roughness={0.6} />
        </mesh>
        <mesh position={[0.32, -0.45, 0.2]} scale={[0.2, 0.16, 0.28]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#B07850" roughness={0.6} />
        </mesh>
      </group>

      {/* Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.75, 32]} />
        <meshBasicMaterial color="#4A148C" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};
