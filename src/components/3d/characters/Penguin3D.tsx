import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const Penguin3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);

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
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        // Penguin waddling
        groupRef.current.rotation.z = Math.sin(t * 3.8) * 0.08;
        groupRef.current.position.y = Math.abs(Math.sin(t * 3.8)) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2) * 0.04;
    }

    if (wingLRef.current && wingRRef.current) {
      const flap = Math.sin(t * (isInteracting ? 18 : 5)) * 0.3;
      wingLRef.current.rotation.z = flap - 0.25;
      wingRRef.current.rotation.z = -flap + 0.25;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- BODY --- */}
      <group position={[0, 0.2, 0]}>
        {/* Main Black Body */}
        <mesh castShadow receiveShadow scale={[0.55, 0.68, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#212121" roughness={0.3} />
        </mesh>

        {/* White Belly Patch */}
        <mesh position={[0, -0.05, 0.28]} scale={[0.38, 0.5, 0.3]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
        </mesh>

        {/* Black Wings as flat spheres on sides */}
        <group ref={wingLRef} position={[-0.55, 0.1, 0]}>
          <mesh scale={[0.1, 0.42, 0.18]} rotation={[0, 0, -0.2]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#1A1A1A" roughness={0.4} />
          </mesh>
        </group>
        <group ref={wingRRef} position={[0.55, 0.1, 0]}>
          <mesh scale={[0.1, 0.42, 0.18]} rotation={[0, 0, 0.2]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#1A1A1A" roughness={0.4} />
          </mesh>
        </group>

        {/* Orange Webbed Feet */}
        <mesh position={[-0.18, -0.62, 0.18]} scale={[0.18, 0.06, 0.24]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF8F00" />
        </mesh>
        <mesh position={[0.18, -0.62, 0.18]} scale={[0.18, 0.06, 0.24]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF8F00" />
        </mesh>
      </group>

      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.88, 0]}>
        {/* Black head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial color="#212121" roughness={0.3} />
        </mesh>

        {/* White face patch — smaller sphere at front of head */}
        <mesh position={[0, -0.04, 0.32]} scale={[0.6, 0.65, 0.55]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.42]}
          spacing={0.4}
          size={0.22}
          irisColor="#1976D2"
          pupilColor="#081A33"
          tilt={0.15}
          blinkSeed={7}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.36, -0.06, 0.38]} rotationY={-0.4} size={0.22} color="rgba(255, 138, 128, 0.7)" />
        <KawaiiBlush position={[0.36, -0.06, 0.38]} rotationY={0.4} size={0.22} color="rgba(255, 138, 128, 0.7)" />

        {/* Orange Beak — small squished sphere */}
        <mesh position={[0, -0.05, 0.52]} scale={[0.14, 0.09, 0.14]} rotation={[0.15, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF8F00" roughness={0.3} />
        </mesh>
      </group>

      {/* Bowtie decoration — two small pink spheres + center knot */}
      <group position={[0, 0.55, 0.3]} scale={0.22}>
        {/* Left bow lobe */}
        <mesh position={[-0.7, 0, 0]} scale={[0.7, 0.5, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F06292" roughness={0.3} />
        </mesh>
        {/* Right bow lobe */}
        <mesh position={[0.7, 0, 0]} scale={[0.7, 0.5, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F06292" roughness={0.3} />
        </mesh>
        {/* Center knot */}
        <mesh scale={[0.32, 0.32, 0.25]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#C2185B" roughness={0.3} />
        </mesh>
      </group>

      {/* Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.65, 32]} />
        <meshBasicMaterial color="#1A237E" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};
