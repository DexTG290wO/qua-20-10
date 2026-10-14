import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const AngelCat3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Group>(null);
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
        groupRef.current.position.y = Math.sin(progress) * 1.1;
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        // Floating gracefully
        groupRef.current.position.y = Math.sin(t * 2) * 0.1 + 0.1;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 2) * 0.04;
      headRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
    }

    // Halo spinning & floating
    if (haloRef.current) {
      haloRef.current.position.y = 1.72 + Math.sin(t * 3) * 0.05;
      haloRef.current.rotation.y = t * 1.5;
    }

    // Angel Wings flapping
    if (wingLRef.current && wingRRef.current) {
      const flap = Math.sin(t * (isInteracting ? 16 : 4)) * 0.35;
      wingLRef.current.rotation.y = flap + 0.3;
      wingRRef.current.rotation.y = -flap - 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Soft white cat head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.06, 0.58]}
          spacing={0.52}
          size={0.28}
          irisColor="#EC407A"
          pupilColor="#5A0A2C"
          tilt={0.2}
          blinkSeed={9}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.45, -0.1, 0.56]} rotationY={-0.4} color="rgba(255, 64, 129, 0.62)" />
        <KawaiiBlush position={[0.45, -0.1, 0.56]} rotationY={0.4} color="rgba(255, 64, 129, 0.62)" />

        {/* Muzzle */}
        <mesh position={[0, -0.08, 0.68]} scale={[0.2, 0.14, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF0F5" />
        </mesh>
        {/* Pink nose */}
        <mesh position={[0, -0.04, 0.77]} scale={[0.07, 0.05, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FF4081" />
        </mesh>

        {/* Soft Cat Ears — flattened spheres, NOT cones */}
        <group position={[-0.44, 0.58, 0]} rotation={[0, 0, -0.18]}>
          {/* White outer ear */}
          <mesh scale={[0.22, 0.28, 0.15]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          {/* Pink inner ear */}
          <mesh position={[0, 0.02, 0.08]} scale={[0.13, 0.18, 0.09]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFB6C1" roughness={0.3} />
          </mesh>
        </group>
        <group position={[0.44, 0.58, 0]} rotation={[0, 0, 0.18]}>
          {/* White outer ear */}
          <mesh scale={[0.22, 0.28, 0.15]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          {/* Pink inner ear */}
          <mesh position={[0, 0.02, 0.08]} scale={[0.13, 0.18, 0.09]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFB6C1" roughness={0.3} />
          </mesh>
        </group>

        {/* Golden Halo — attached to head group, controlled via haloRef */}
        <group ref={haloRef} position={[0, 0.87, 0]} rotation={[0.2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.4, 0.045, 16, 32]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.7}
              metalness={0.85}
              roughness={0.15}
            />
          </mesh>
        </group>
      </group>

      {/* --- BODY & WINGS --- */}
      <group position={[0, 0.05, 0]}>
        <mesh castShadow receiveShadow scale={[0.52, 0.62, 0.5]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
        </mesh>

        {/* Large flat ellipsoid Left Wing [0.6, 0.45, 0.08] */}
        <group ref={wingLRef} position={[-0.48, 0.22, -0.2]}>
          <mesh rotation={[0.1, 0, -0.3]} scale={[0.6, 0.45, 0.08]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFF9C4"
              emissiveIntensity={0.35}
              roughness={0.15}
            />
          </mesh>
          {/* Secondary feather layer */}
          <mesh rotation={[0.05, 0, -0.5]} position={[0, -0.05, 0]} scale={[0.4, 0.3, 0.06]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#FAFAFA"
              emissive="#FFF9C4"
              emissiveIntensity={0.2}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Large flat ellipsoid Right Wing [0.6, 0.45, 0.08] */}
        <group ref={wingRRef} position={[0.48, 0.22, -0.2]}>
          <mesh rotation={[0.1, 0, 0.3]} scale={[0.6, 0.45, 0.08]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFF9C4"
              emissiveIntensity={0.35}
              roughness={0.15}
            />
          </mesh>
          {/* Secondary feather layer */}
          <mesh rotation={[0.05, 0, 0.5]} position={[0, -0.05, 0]} scale={[0.4, 0.3, 0.06]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#FAFAFA"
              emissive="#FFF9C4"
              emissiveIntensity={0.2}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Paws */}
        <mesh position={[-0.22, -0.42, 0.3]} scale={[0.15, 0.15, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.22, -0.42, 0.3]} scale={[0.15, 0.15, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Floating Tail */}
        <mesh position={[0, -0.15, -0.5]} rotation={[0.5, 0, 0]} scale={[0.07, 0.4, 0.07]}>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* Ground Glow Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.75, 32]} />
        <meshBasicMaterial color="#FF80AB" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};
