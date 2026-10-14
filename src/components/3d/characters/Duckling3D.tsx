import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../../utils/audioEngine';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const Duckling3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);
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
        groupRef.current.position.y = Math.sin(progress) * 0.85;
        groupRef.current.rotation.y += delta * 8;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        // Cute waddling side to side
        groupRef.current.rotation.z = Math.sin(t * 4) * 0.08;
        groupRef.current.position.y = Math.abs(Math.sin(t * 4)) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 2) * 0.15;
      headRef.current.rotation.z = Math.sin(t * 2.5) * 0.05;
    }

    // Wing flapping
    if (wingLRef.current && wingRRef.current) {
      const flap = isInteracting ? Math.sin(t * 20) * 0.6 : Math.sin(t * 6) * 0.25;
      wingLRef.current.rotation.z = flap - 0.2;
      wingRRef.current.rotation.z = -flap + 0.2;
    }

    // Tail puff wiggle
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 5) * 0.12;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.76, 0.05]}>
        {/* Head — yellow, radius 0.65, face surface ~z=0.62 */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshStandardMaterial color="#FFEB3B" roughness={0.35} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.52]}
          spacing={0.52}
          size={0.26}
          irisColor="#1A1817"
          pupilColor="#0C0B0A"
          tilt={0.2}
          blinkSeed={15}
        />

        {/* Blush cheeks */}
        <KawaiiBlush position={[-0.42, -0.1, 0.48]} rotationY={-0.38} size={0.24} color="rgba(255, 143, 163, 0.5)" />
        <KawaiiBlush position={[0.42, -0.1, 0.48]} rotationY={0.38} size={0.24} color="rgba(255, 143, 163, 0.5)" />

        {/* Orange bill — flat squished sphere */}
        <mesh position={[0, -0.14, 0.64]} rotation={[0.08, 0, 0]} scale={[0.26, 0.1, 0.28]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF9800" roughness={0.3} />
        </mesh>
        {/* Lower bill */}
        <mesh position={[0, -0.2, 0.62]} rotation={[-0.15, 0, 0]} scale={[0.22, 0.07, 0.22]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E65100" roughness={0.3} />
        </mesh>

        {/* Eggshell hat */}
        <group position={[0, 0.55, 0]} rotation={[0.1, 0, 0.1]}>
          <mesh scale={[0.45, 0.25, 0.45]}>
            <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        {/* Round yellow body */}
        <mesh castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FDD835" roughness={0.35} />
        </mesh>

        {/* Left wing nubbin */}
        <group ref={wingLRef} position={[-0.52, 0.08, 0]}>
          <mesh scale={[0.12, 0.28, 0.32]} rotation={[0, 0, -0.25]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFEE58" roughness={0.35} />
          </mesh>
          {/* Wing tip tuft */}
          <mesh position={[-0.06, -0.12, 0]} scale={[0.08, 0.12, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF176" roughness={0.35} />
          </mesh>
        </group>

        {/* Right wing nubbin */}
        <group ref={wingRRef} position={[0.52, 0.08, 0]}>
          <mesh scale={[0.12, 0.28, 0.32]} rotation={[0, 0, 0.25]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFEE58" roughness={0.35} />
          </mesh>
          <mesh position={[0.06, -0.12, 0]} scale={[0.08, 0.12, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF176" roughness={0.35} />
          </mesh>
        </group>

        {/* Fluffy tail puff — cluster of small spheres */}
        <group ref={tailRef} position={[0, 0.18, -0.5]}>
          <mesh scale={[0.18, 0.18, 0.18]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF9C4" roughness={0.5} />
          </mesh>
          <mesh position={[-0.1, 0.06, 0.02]} scale={[0.12, 0.12, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
          <mesh position={[0.1, 0.04, 0.02]} scale={[0.12, 0.12, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.12, 0]} scale={[0.1, 0.1, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF9C4" roughness={0.5} />
          </mesh>
        </group>

        {/* Orange webbed feet */}
        <mesh position={[-0.22, -0.46, 0.1]} rotation={[-0.1, 0, 0.05]} scale={[0.18, 0.05, 0.28]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#FF9800" roughness={0.4} />
        </mesh>
        <mesh position={[0.22, -0.46, 0.1]} rotation={[-0.1, 0, -0.05]} scale={[0.18, 0.05, 0.28]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#FF9800" roughness={0.4} />
        </mesh>
      </group>

      {/* Ground shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.65, 32]} />
        <meshBasicMaterial color="#5D4037" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};
