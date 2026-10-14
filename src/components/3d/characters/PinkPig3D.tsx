import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const PinkPig3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
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
        groupRef.current.position.y = Math.sin(t * 2.5) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.05;
      headRef.current.rotation.x = Math.sin(t * 1.3) * 0.03;
    }

    // Ear flop twitch
    if (earLRef.current && earRRef.current) {
      earLRef.current.rotation.z = Math.sin(t * 3.5) * 0.08 - 0.3;
      earRRef.current.rotation.z = -Math.sin(t * 3.5 + 0.6) * 0.08 + 0.3;
    }

    // Curly tail spinning
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 5) * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.8, 0]}>
        {/* Head — radius 0.7, face surface ~z=0.64 */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color="#F8BBD0" roughness={0.35} />
        </mesh>

        {/* Big cheek puffs */}
        <mesh position={[-0.42, -0.14, 0.26]} scale={[0.35, 0.3, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F48FB1" roughness={0.4} />
        </mesh>
        <mesh position={[0.42, -0.14, 0.26]} scale={[0.35, 0.3, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F48FB1" roughness={0.4} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.07, 0.58]}
          spacing={0.52}
          size={0.26}
          irisColor="#37474F"
          pupilColor="#1C2529"
          tilt={0.18}
          blinkSeed={3}
        />

        {/* Blush cheeks */}
        <KawaiiBlush position={[-0.46, -0.1, 0.56]} rotationY={-0.38} color="rgba(255, 64, 129, 0.6)" />
        <KawaiiBlush position={[0.46, -0.1, 0.56]} rotationY={0.38} color="rgba(255, 64, 129, 0.6)" />

        {/* Pig snout — flat sphere instead of box */}
        <group position={[0, -0.12, 0.65]}>
          <mesh scale={[0.26, 0.18, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#F06292" roughness={0.3} />
          </mesh>
          {/* Nostrils */}
          <mesh position={[-0.07, 0, 0.09]} scale={[0.04, 0.055, 0.025]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#C2185B" />
          </mesh>
          <mesh position={[0.07, 0, 0.09]} scale={[0.04, 0.055, 0.025]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#C2185B" />
          </mesh>
        </group>

        {/* Left ear — rounded sphere scaled [0.22, 0.3, 0.12] */}
        <group ref={earLRef} position={[-0.44, 0.56, 0]} rotation={[0.15, 0.1, -0.28]}>
          <mesh scale={[0.22, 0.3, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#F06292" roughness={0.4} />
          </mesh>
          {/* Inner ear */}
          <mesh position={[0, 0, 0.04]} scale={[0.14, 0.2, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FCE4EC" roughness={0.4} />
          </mesh>
        </group>

        {/* Right ear */}
        <group ref={earRRef} position={[0.44, 0.56, 0]} rotation={[0.15, -0.1, 0.28]}>
          <mesh scale={[0.22, 0.3, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#F06292" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]} scale={[0.14, 0.2, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FCE4EC" roughness={0.4} />
          </mesh>
        </group>

        {/* Strawberry beret */}
        <group position={[0.18, 0.62, 0.1]} rotation={[0.2, 0.3, -0.2]}>
          <mesh scale={[0.28, 0.22, 0.28]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#E91E63" roughness={0.3} />
          </mesh>
          {/* Stem */}
          <mesh position={[0, 0.25, 0]} scale={[0.04, 0.1, 0.04]}>
            <cylinderGeometry args={[1, 1, 1, 8]} />
            <meshStandardMaterial color="#4CAF50" />
          </mesh>
        </group>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        {/* Chubby round body */}
        <mesh castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#F8BBD0" roughness={0.35} />
        </mesh>

        {/* Belly highlight */}
        <mesh position={[0, 0.05, 0.42]} scale={[0.32, 0.36, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FCE4EC" roughness={0.4} />
        </mesh>

        {/* Hooves — 4 short cylinder stubs */}
        <mesh position={[-0.26, -0.48, 0.24]} scale={[0.12, 0.14, 0.12]}>
          <cylinderGeometry args={[1, 1.1, 1, 12]} />
          <meshStandardMaterial color="#E91E63" roughness={0.4} />
        </mesh>
        <mesh position={[0.26, -0.48, 0.24]} scale={[0.12, 0.14, 0.12]}>
          <cylinderGeometry args={[1, 1.1, 1, 12]} />
          <meshStandardMaterial color="#E91E63" roughness={0.4} />
        </mesh>
        <mesh position={[-0.3, -0.48, -0.2]} scale={[0.12, 0.14, 0.12]}>
          <cylinderGeometry args={[1, 1.1, 1, 12]} />
          <meshStandardMaterial color="#E91E63" roughness={0.4} />
        </mesh>
        <mesh position={[0.3, -0.48, -0.2]} scale={[0.12, 0.14, 0.12]}>
          <cylinderGeometry args={[1, 1.1, 1, 12]} />
          <meshStandardMaterial color="#E91E63" roughness={0.4} />
        </mesh>

        {/* Curly tail — torus arc bent with rotation */}
        <group ref={tailRef} position={[0, -0.08, -0.52]}>
          <mesh rotation={[0.5, 0, 0]}>
            <torusGeometry args={[0.13, 0.045, 8, 24, Math.PI * 1.5]} />
            <meshStandardMaterial color="#F06292" roughness={0.3} />
          </mesh>
          {/* Tail curl end */}
          <mesh position={[0.13, 0.08, 0.06]} scale={[0.06, 0.06, 0.06]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#EC407A" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Ground shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.72, 32]} />
        <meshBasicMaterial color="#880E4F" transparent opacity={0.14} />
      </mesh>
    </group>
  );
};
