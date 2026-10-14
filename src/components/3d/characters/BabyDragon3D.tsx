import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const BabyDragon3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const bodyMeshRef = useRef<THREE.Mesh>(null);

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
        groupRef.current.position.y = Math.sin(progress) * 0.95;
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        groupRef.current.position.y = Math.sin(t * 2.8) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.08;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2) * 0.06;
      headRef.current.rotation.x = Math.sin(t * 1.4) * 0.03;
    }

    // Wing flutter — sphere-based ellipsoids flap on Y axis
    if (wingLRef.current && wingRRef.current) {
      const flap = Math.sin(t * (isInteracting ? 18 : 6)) * 0.35;
      wingLRef.current.rotation.y = flap + 0.25;
      wingRRef.current.rotation.y = -(flap + 0.25);
    }

    // Tail wag
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 4) * 0.28;
    }

    // Subtle body emissive pulse
    if (bodyMeshRef.current) {
      const mat = bodyMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.08 + Math.sin(t * 2.5) * 0.04;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD & HORNS --- */}
      <group ref={headRef} position={[0, 0.85, 0.05]}>
        {/* Round lavender head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#CE93D8" roughness={0.35} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.07, 0.58]}
          spacing={0.54}
          size={0.28}
          irisColor="#4A148C"
          pupilColor="#210A3D"
          tilt={0.18}
          blinkSeed={10}
        />

        {/* Blush cheeks */}
        <KawaiiBlush position={[-0.46, -0.09, 0.56]} rotationY={-0.38} size={0.24} color="rgba(206, 147, 216, 0.7)" />
        <KawaiiBlush position={[0.46, -0.09, 0.56]} rotationY={0.38} size={0.24} color="rgba(206, 147, 216, 0.7)" />

        {/* Dragon snout */}
        <mesh position={[0, -0.12, 0.68]} scale={[0.28, 0.18, 0.22]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E1BEE7" roughness={0.35} />
        </mesh>

        {/* Tiny nostrils — sphere bumps */}
        <mesh position={[-0.075, -0.05, 0.855]} scale={[0.035, 0.028, 0.028]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color="#7B1FA2" roughness={0.5} />
        </mesh>
        <mesh position={[0.075, -0.05, 0.855]} scale={[0.035, 0.028, 0.028]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color="#7B1FA2" roughness={0.5} />
        </mesh>

        {/* Golden horns — cylinder geometry, emissive gold */}
        <mesh position={[-0.32, 0.62, -0.04]} rotation={[-0.18, 0, -0.28]} scale={[0.1, 0.32, 0.1]}>
          <cylinderGeometry args={[0.4, 1, 1, 12]} />
          <meshStandardMaterial
            color="#FFD54F"
            emissive="#FFB300"
            emissiveIntensity={0.55}
            metalness={0.7}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0.32, 0.62, -0.04]} rotation={[-0.18, 0, 0.28]} scale={[0.1, 0.32, 0.1]}>
          <cylinderGeometry args={[0.4, 1, 1, 12]} />
          <meshStandardMaterial
            color="#FFD54F"
            emissive="#FFB300"
            emissiveIntensity={0.55}
            metalness={0.7}
            roughness={0.18}
          />
        </mesh>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        {/* Main body sphere [0.55, 0.6, 0.52] */}
        <mesh ref={bodyMeshRef} castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#CE93D8"
            roughness={0.35}
            emissive="#9C27B0"
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* Cream belly plates */}
        <mesh position={[0, 0.02, 0.38]} scale={[0.36, 0.48, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF9C4" roughness={0.4} />
        </mesh>

        {/* Left Wing — flat ellipsoid sphere [0.5, 0.35, 0.06] */}
        <mesh ref={wingLRef} position={[-0.5, 0.18, -0.14]} rotation={[0.1, 0.25, -0.2]} scale={[0.5, 0.35, 0.06]}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color="#BA68C8"
            emissive="#7B1FA2"
            emissiveIntensity={0.22}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Right Wing — flat ellipsoid sphere [0.5, 0.35, 0.06] */}
        <mesh ref={wingRRef} position={[0.5, 0.18, -0.14]} rotation={[0.1, -0.25, 0.2]} scale={[0.5, 0.35, 0.06]}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color="#BA68C8"
            emissive="#7B1FA2"
            emissiveIntensity={0.22}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Paws */}
        <mesh position={[-0.22, -0.42, 0.28]} scale={[0.14, 0.13, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E1BEE7" />
        </mesh>
        <mesh position={[0.22, -0.42, 0.28]} scale={[0.14, 0.13, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E1BEE7" />
        </mesh>

        {/* Tail with star tip */}
        <group ref={tailRef} position={[0.08, -0.18, -0.5]}>
          {/* Tail base segment */}
          <mesh rotation={[0.4, 0.2, 0.15]} scale={[0.1, 0.42, 0.1]}>
            <cylinderGeometry args={[0.6, 1, 1, 12]} />
            <meshStandardMaterial color="#CE93D8" />
          </mesh>
          {/* Star tip */}
          <mesh position={[0.06, 0.32, 0.18]} scale={[0.16, 0.16, 0.09]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#FFEB3B"
              emissive="#FFD700"
              emissiveIntensity={1.0}
              metalness={0.3}
            />
          </mesh>
        </group>
      </group>

      {/* Ground shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.72, 32]} />
        <meshBasicMaterial color="#4A148C" transparent opacity={0.16} />
      </mesh>
    </group>
  );
};
