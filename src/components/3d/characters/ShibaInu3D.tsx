import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const ShibaInu3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
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
        groupRef.current.position.y = Math.sin(progress) * 0.9;
        groupRef.current.rotation.y += delta * 7;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        groupRef.current.position.y = Math.sin(t * 2.8) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 2) * 0.07;
      headRef.current.rotation.x = Math.sin(t * 1.5) * 0.03;
    }

    // Curled tail waggle
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(t * 6) * 0.25;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.85, 0.08]}>
        {/* Head — warm orange-cream */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#E07B39" roughness={0.4} />
        </mesh>

        {/* White Urajiro face markings */}
        <mesh position={[-0.3, -0.12, 0.48]} scale={[0.38, 0.35, 0.28]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.4} />
        </mesh>
        <mesh position={[0.3, -0.12, 0.48]} scale={[0.38, 0.35, 0.28]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.4} />
        </mesh>

        {/* White eyebrow dots */}
        <mesh position={[-0.22, 0.28, 0.62]} scale={[0.07, 0.07, 0.03]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.22, 0.28, 0.62]} scale={[0.07, 0.07, 0.03]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights (happy squint) */}
        <KawaiiEyes
          position={[0, 0.06, 0.58]}
          spacing={0.52}
          size={0.26}
          irisColor="#4E342E"
          pupilColor="#20150F"
          tilt={0.2}
          blinkSeed={5}
        />

        {/* Blushes */}
        <KawaiiBlush position={[-0.45, -0.08, 0.56]} rotationY={-0.4} size={0.24} color="rgba(255, 112, 67, 0.62)" />
        <KawaiiBlush position={[0.45, -0.08, 0.56]} rotationY={0.4} size={0.24} color="rgba(255, 112, 67, 0.62)" />

        {/* Prominent Muzzle */}
        <mesh position={[0, -0.12, 0.62]} scale={[0.38, 0.28, 0.3]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.4} />
        </mesh>
        {/* Black Nose */}
        <mesh position={[0, -0.05, 0.86]} scale={[0.09, 0.06, 0.05]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#1A1817" />
        </mesh>

        {/* Soft Rounded Ears — flattened spheres, slightly outward tilt */}
        <group position={[-0.44, 0.6, -0.05]} rotation={[0, 0.1, -0.2]}>
          <mesh scale={[0.28, 0.35, 0.18]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#D35400" roughness={0.4} />
          </mesh>
          {/* Inner lighter ear */}
          <mesh position={[0, 0.02, 0.08]} scale={[0.18, 0.22, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF0E6" roughness={0.4} />
          </mesh>
        </group>
        <group position={[0.44, 0.6, -0.05]} rotation={[0, -0.1, 0.2]}>
          <mesh scale={[0.28, 0.35, 0.18]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color="#D35400" roughness={0.4} />
          </mesh>
          {/* Inner lighter ear */}
          <mesh position={[0, 0.02, 0.08]} scale={[0.18, 0.22, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFF0E6" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* --- BODY & SCARF --- */}
      <group position={[0, 0.05, 0]}>
        {/* Body — orange-cream */}
        <mesh castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#E07B39" roughness={0.4} />
        </mesh>
        {/* White chest bib */}
        <mesh position={[0, 0.08, 0.38]} scale={[0.35, 0.42, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.4} />
        </mesh>

        {/* Green scarf */}
        <mesh position={[0, 0.38, 0.08]} scale={[0.52, 0.12, 0.52]}>
          <torusGeometry args={[1, 0.22, 16, 32]} />
          <meshStandardMaterial color="#4CAF50" roughness={0.4} />
        </mesh>

        {/* Paws */}
        <mesh position={[-0.24, -0.42, 0.28]} scale={[0.15, 0.16, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" />
        </mesh>
        <mesh position={[0.24, -0.42, 0.28]} scale={[0.15, 0.16, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#FFF8F0" />
        </mesh>

        {/* Curled Shiba Tail */}
        <group ref={tailRef} position={[0, 0.05, -0.52]}>
          <mesh rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.18, 0.07, 12, 24, Math.PI * 1.6]} />
            <meshStandardMaterial color="#E07B39" />
          </mesh>
          {/* White tail tip */}
          <mesh position={[0.15, 0.1, 0]} scale={[0.08, 0.08, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      </group>

      {/* Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.72, 32]} />
        <meshBasicMaterial color="#3E2723" transparent opacity={0.16} />
      </mesh>
    </group>
  );
};
