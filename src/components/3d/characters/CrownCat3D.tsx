import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KawaiiEyes, KawaiiBlush } from './KawaiiParts';
import { audioEngine } from '../../../utils/audioEngine';

interface CharacterProps {
  scale?: number;
  interactive?: boolean;
}

export const CrownCat3D: React.FC<CharacterProps> = ({ scale = 1, interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const crownRef = useRef<THREE.Group>(null);
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
        groupRef.current.position.y = Math.sin(progress) * 0.9;
        groupRef.current.rotation.y += delta * 6;
        if (progress >= Math.PI) {
          setIsInteracting(false);
          groupRef.current.position.y = 0;
          groupRef.current.rotation.y = 0;
        }
      } else {
        // Proud upright bob — minimal, regal
        groupRef.current.position.y = Math.sin(t * 2.2) * 0.04;
      }
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.5) * 0.04;
      // Slight proud chin-up
      headRef.current.rotation.x = -0.05 + Math.sin(t * 1.2) * 0.02;
    }

    // Crown gentle rotate + glimmer
    if (crownRef.current) {
      crownRef.current.rotation.y = Math.sin(t * 1.8) * 0.12;
    }

    // Tail sway
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3.5) * 0.32;
    }

    // Subtle body emissive pulse
    if (bodyMeshRef.current) {
      const mat = bodyMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.06 + Math.sin(t * 2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={scale} onClick={handleClick}>
      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 0.88, 0]}>
        {/* Round purple cat head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial color="#B39DDB" roughness={0.35} />
        </mesh>

        {/* Eyes — true 3D sclera / iris / pupil / highlights */}
        <KawaiiEyes
          position={[0, 0.07, 0.58]}
          spacing={0.54}
          size={0.28}
          irisColor="#4A148C"
          pupilColor="#1A0440"
          tilt={0.18}
          blinkSeed={11}
        />

        {/* Blush cheeks */}
        <KawaiiBlush position={[-0.46, -0.09, 0.56]} rotationY={-0.38} size={0.24} color="rgba(179, 157, 219, 0.7)" />
        <KawaiiBlush position={[0.46, -0.09, 0.56]} rotationY={0.38} size={0.24} color="rgba(179, 157, 219, 0.7)" />

        {/* Muzzle */}
        <mesh position={[0, -0.08, 0.68]} scale={[0.2, 0.14, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#EDE7F6" />
        </mesh>
        {/* Pink nose */}
        <mesh position={[0, -0.04, 0.77]} scale={[0.07, 0.05, 0.04]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#E91E63" />
        </mesh>

        {/* Cat ears — sphere-based rounded (not cone) */}
        {/* Left ear outer */}
        <mesh position={[-0.44, 0.62, 0]} rotation={[0, 0, -0.18]} scale={[0.22, 0.36, 0.14]}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial color="#9575CD" roughness={0.4} />
        </mesh>
        {/* Left ear inner pink */}
        <mesh position={[-0.44, 0.63, 0.05]} rotation={[0, 0, -0.18]} scale={[0.12, 0.22, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F48FB1" roughness={0.5} />
        </mesh>

        {/* Right ear outer */}
        <mesh position={[0.44, 0.62, 0]} rotation={[0, 0, 0.18]} scale={[0.22, 0.36, 0.14]}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial color="#9575CD" roughness={0.4} />
        </mesh>
        {/* Right ear inner pink */}
        <mesh position={[0.44, 0.63, 0.05]} rotation={[0, 0, 0.18]} scale={[0.12, 0.22, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#F48FB1" roughness={0.5} />
        </mesh>

        {/* Ornate Golden Crown */}
        <group ref={crownRef} position={[0, 0.74, 0]} scale={0.28}>
          {/* Crown base band */}
          <mesh>
            <cylinderGeometry args={[1.05, 0.95, 0.38, 16]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFB300"
              emissiveIntensity={0.45}
              metalness={0.85}
              roughness={0.15}
            />
          </mesh>
          {/* Crown spikes — cylinders, golden emissive */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            const isTall = i === 0 || i === 2 || i === 4;
            return (
              <group key={i} position={[0.95 * Math.sin(angle), 0.38, 0.95 * Math.cos(angle)]}>
                <mesh scale={[0.22, isTall ? 0.6 : 0.42, 0.22]}>
                  <cylinderGeometry args={[0.3, 0.7, 1, 8]} />
                  <meshStandardMaterial
                    color="#FFD700"
                    emissive="#FFC107"
                    emissiveIntensity={0.55}
                    metalness={0.9}
                    roughness={0.1}
                  />
                </mesh>
                {/* Gem atop each spike */}
                <mesh position={[0, isTall ? 0.35 : 0.25, 0]} scale={[0.12, 0.12, 0.12]}>
                  <sphereGeometry args={[1, 10, 10]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? '#D50000' : '#AA00FF'}
                    roughness={0.08}
                    metalness={0.2}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* --- BODY --- */}
      <group position={[0, 0.05, 0]}>
        {/* Main body [0.55, 0.6, 0.52] — sitting upright */}
        <mesh ref={bodyMeshRef} castShadow receiveShadow scale={[0.55, 0.6, 0.52]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#B39DDB"
            roughness={0.35}
            emissive="#7E57C2"
            emissiveIntensity={0.06}
          />
        </mesh>

        {/* Royal purple cape — flat sphere behind body */}
        <mesh position={[0, 0.02, -0.32]} rotation={[0.18, 0, 0]} scale={[0.65, 0.68, 0.18]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#4527A0" roughness={0.45} />
        </mesh>

        {/* White ermine collar */}
        <mesh position={[0, 0.38, 0.04]} scale={[0.52, 0.12, 0.52]}>
          <torusGeometry args={[1, 0.22, 12, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
        </mesh>

        {/* Paws — sitting posture */}
        <mesh position={[-0.22, -0.42, 0.28]} scale={[0.15, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#EDE7F6" />
        </mesh>
        <mesh position={[0.22, -0.42, 0.28]} scale={[0.15, 0.14, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#EDE7F6" />
        </mesh>

        {/* Tail — curved beside body */}
        <group ref={tailRef} position={[0.32, -0.18, -0.38]}>
          <mesh rotation={[0.35, 0.3, 0.6]} scale={[0.09, 0.44, 0.09]}>
            <cylinderGeometry args={[0.8, 1, 1, 12]} />
            <meshStandardMaterial color="#B39DDB" />
          </mesh>
          {/* Tail puff tip */}
          <mesh position={[0.14, 0.28, 0.1]} scale={[0.12, 0.12, 0.12]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#EDE7F6" roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* Ground shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.72, 32]} />
        <meshBasicMaterial color="#311B92" transparent opacity={0.16} />
      </mesh>
    </group>
  );
};
