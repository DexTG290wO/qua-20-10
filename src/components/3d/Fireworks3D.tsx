import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../utils/audioEngine';

interface Fireworks3DProps {
  active?: boolean;
  reducedMotion?: boolean;
}

/**
 * Pháo hoa 3D cho màn lộ diện reward Secret.
 * Âm thanh được giới hạn tần suất để tránh spam hàng trăm tiếng nổ.
 */
export const Fireworks3D: React.FC<Fireworks3DProps> = ({
  active = true,
  reducedMotion = false,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const particleCount = reducedMotion ? 70 : 170;
  const nextSoundAt = useRef(0.6);
  const burstAge = useRef(0);

  const [positions, velocities, colors, life] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const lf = new Float32Array(particleCount);

    const palette = [
      new THREE.Color('#FFD700'),
      new THREE.Color('#FFE9A8'),
      new THREE.Color('#FF8FB1'),
      new THREE.Color('#FFFFFF'),
      new THREE.Color('#FFC1E3'),
    ];

    const spawn = (i: number) => {
      pos[i * 3 + 0] = 0;
      pos[i * 3 + 1] = 2.7;
      pos[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 2.4 + Math.random() * 4.2;

      vel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      lf[i] = 0.85 + Math.random() * 0.5;
    };

    for (let i = 0; i < particleCount; i++) spawn(i);
    return [pos, vel, col, lf];
  }, [particleCount]);

  useEffect(() => {
    if (active) {
      burstAge.current = 0;
      nextSoundAt.current = 0.35;
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    burstAge.current += delta;
    if (burstAge.current > nextSoundAt.current) {
      audioEngine.playFirework();
      nextSoundAt.current = burstAge.current + 1.4 + Math.random() * 1.1;
    }

    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 0] += velocities[i * 3 + 0] * delta;
      posArr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      posArr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      velocities[i * 3 + 1] -= 3.4 * delta;
      velocities[i * 3 + 0] *= 1 - 0.5 * delta;
      velocities[i * 3 + 2] *= 1 - 0.5 * delta;

      life[i] -= delta * 0.55;
      if (life[i] <= 0) {
        posArr[i * 3 + 0] = (Math.random() - 0.5) * 5;
        posArr[i * 3 + 1] = 2.6 + Math.random() * 2.4;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 5;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 1.9 + Math.random() * 3.8;

        velocities[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities[i * 3 + 2] = Math.cos(phi) * speed;
        life[i] = 0.85 + Math.random() * 0.5;
      }
    }

    posAttr.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = 0.85 + Math.sin(burstAge.current * 4) * 0.12;
    }
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={reducedMotion ? 0.18 : 0.24}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};
