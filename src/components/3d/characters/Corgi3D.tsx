import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const Corgi3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const buttRef = useRef<THREE.Group>(null);

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
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        groupRef.current.position.y = Math.sin(t * 3) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2.2) * 0.08;
      headRef.current.rotation.x = Math.sin(t * 1.8) * 0.03;
    }

    // Ear perky twitch
    if (earLRef.current && earRRef.current) {
      earLRef.current.rotation.z = Math.sin(t * 4.5) * 0.06 - 0.1;
      earRRef.current.rotation.z = -Math.sin(t * 4.5 + 1.0) * 0.06 + 0.1;
    }

    // Peach butt wobble
    if (buttRef.current) {
      buttRef.current.rotation.y = Math.sin(t * 6) * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0.1]}>
        {/* Head base — radius 0.7, face surface ~z=0.64 */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color="#E59866" roughness={0.4} />
        </mesh>

        {/* White blaze forehead stripe */}
        <mesh position={[0, 0.26, 0.62]} scale={[0.2, 0.44, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.58]}
          spacing={0.54}
          size={0.28}
          irisColor="#5D4037"
          pupilColor="#241610"
          tilt={0.2}
          blinkSeed={2}
        />

        {/* Blush cheeks */}
        <KawaiiBlush position={[-0.46, -0.09, 0.54]} rotationY={-0.38} size={0.24} />
        <KawaiiBlush position={[0.46, -0.09, 0.54]} rotationY={0.38} size={0.24} />

        {/* Corgi white muzzle */}
        <mesh position={[0, -0.15, 0.65]} scale={[0.32, 0.25, 0.22]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        {/* Black nose */}
        <mesh position={[0, -0.06, 0.82]} scale={[0.1, 0.07, 0.06]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#1A1817" roughness={0.3} />
        </mesh>
        {/* Pink tongue */}
        <mesh position={[0, -0.27, 0.8]} rotation={[0.3, 0, 0]} scale={[0.12, 0.16, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF6B8B" roughness={0.3} />
        </mesh>

        {/* Left ear — large sphere-based triangular ear (scale [0.3, 0.5, 0.18]) */}
        <group ref={earLRef} position={[-0.5, 0.55, -0.05]} rotation={[0, 0.12, -0.18]}>
          {/* Outer ear */}
          <mesh scale={[0.3, 0.5, 0.18]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#D35400" roughness={0.4} />
          </mesh>
          {/* Inner ear */}
          <mesh position={[0, 0, 0.04]} scale={[0.2, 0.38, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FADBD8" roughness={0.4} />
          </mesh>
        </group>

        {/* Right ear */}
        <group ref={earRRef} position={[0.5, 0.55, -0.05]} rotation={[0, -0.12, 0.18]}>
          <mesh scale={[0.3, 0.5, 0.18]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#D35400" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.2, 0.38, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FADBD8" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* --- BODY & PEACH BUTT --- */}
      <group position={[0, 0.08, 0]}>
        {/* Elongated loaf body */}
        <mesh castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#E59866" roughness={0.4} />
        </mesh>
        {/* White chest */}
        <mesh position={[0, 0.06, 0.44]} scale={[0.4, 0.4, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>

        {/* Stubby legs — 4 sphere stubs at joint positions */}
        {/* Front-left */}
        <mesh position={[-0.28, -0.44, 0.32]} scale={[0.14, 0.22, 0.14]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E59866" roughness={0.4} />
        </mesh>
        {/* Front-left paw */}
        <mesh position={[-0.28, -0.56, 0.36]} scale={[0.16, 0.1, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        {/* Front-right */}
        <mesh position={[0.28, -0.44, 0.32]} scale={[0.14, 0.22, 0.14]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E59866" roughness={0.4} />
        </mesh>
        {/* Front-right paw */}
        <mesh position={[0.28, -0.56, 0.36]} scale={[0.16, 0.1, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        {/* Back-left */}
        <mesh position={[-0.32, -0.44, -0.3]} scale={[0.14, 0.22, 0.14]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E59866" roughness={0.4} />
        </mesh>
        {/* Back-left paw */}
        <mesh position={[-0.32, -0.56, -0.32]} scale={[0.16, 0.1, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        {/* Back-right */}
        <mesh position={[0.32, -0.44, -0.3]} scale={[0.14, 0.22, 0.14]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E59866" roughness={0.4} />
        </mesh>
        {/* Back-right paw */}
        <mesh position={[0.32, -0.56, -0.32]} scale={[0.16, 0.1, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>

        {/* Peach butt & stubby tail */}
        <group ref={buttRef} position={[0, 0.06, -0.62]}>
          {/* Left cheek of peach butt */}
          <mesh position={[-0.18, 0.02, 0]} scale={[0.35, 0.38, 0.3]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
          {/* Right cheek */}
          <mesh position={[0.18, 0.02, 0]} scale={[0.35, 0.38, 0.3]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
          {/* Stubby tail tuft */}
          <mesh position={[0, 0.22, 0]} scale={[0.12, 0.14, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#E59866" />
          </mesh>
        </group>
      </group>

      {/* Ground shadow — canh đúng mép dưới của bàn chân */}
      <mesh position={[0, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.8, 32]} />
        <meshBasicMaterial color="#3E2723" transparent opacity={0.18} />
      </mesh>
    </group>
  );
};
