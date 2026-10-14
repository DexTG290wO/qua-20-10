import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createFourPointStarGeometry, createPetalGeometry } from './ProceduralFlora';

interface FloatingParticlesProps {
  /** Số lượng cánh hoa ở chế độ bình thường. */
  count?: number;
  /** Tăng mật độ trong lúc mở quà / lộ Secret. */
  burst?: boolean;
  reducedMotion?: boolean;
}

const MAX_PETALS = 130;
const MAX_STARS = 54;

const PETAL_COLORS = ['#FFC1CC', '#FFB0C0', '#FFAAA6', '#F8BBD0', '#FFF2F5', '#FFDCC4'];
const STAR_COLORS = ['#FFF3C4', '#FFE082', '#FFFDE7', '#FFD1DC', '#FFF9C4'];

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 46,
  burst = false,
  reducedMotion = false,
}) => {
  const petalsRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Group>(null);
  const densityRef = useRef(0);

  const petalGeom = useMemo(() => createPetalGeometry(0.3, 0.19, 0.06), []);
  const starGeom = useMemo(() => createFourPointStarGeometry(0.11, 0.032), []);

  // ── Cánh hoa: bay lả tả theo gió, có chiều sâu trước/sau camera ──
  const petals = useMemo(() => {
    return Array.from({ length: MAX_PETALS }).map((_, i) => {
      const nearCamera = i % 9 === 0;
      return {
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          Math.random() * 9 + 0.8,
          nearCamera ? 2.6 + Math.random() * 2 : -6 + Math.random() * 9
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 1.4
        ),
        fallSpeed: 0.34 + Math.random() * 0.5,
        swayFreq: 0.9 + Math.random() * 1.3,
        swayAmp: 0.34 + Math.random() * 0.5,
        scale: nearCamera ? 1.9 + Math.random() * 0.9 : 0.75 + Math.random() * 0.75,
        opacity: nearCamera ? 0.42 : 0.95,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      };
    });
  }, []);

  // ── Sao: hiện ra, lấp lánh vài giây rồi tan biến ──
  const stars = useMemo(() => {
    return Array.from({ length: MAX_STARS }).map(() => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        0.6 + Math.random() * 6.5,
        (Math.random() - 0.5) * 11
      ),
      floatSpeed: 0.25 + Math.random() * 0.45,
      twinkleSpeed: 1.8 + Math.random() * 2.6,
      cycle: 2.4 + Math.random() * 4.2,
      offset: Math.random() * 6,
      scale: 0.7 + Math.random() * 0.8,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Mật độ tăng/giảm mượt mà thay vì bật/tắt đột ngột
    const targetDensity = burst ? 1 : 0;
    densityRef.current = THREE.MathUtils.lerp(
      densityRef.current,
      targetDensity,
      Math.min(1, delta * 1.6)
    );

    const petalVisible = Math.round(
      count + densityRef.current * (MAX_PETALS * 0.72 - count)
    );
    const starVisible = Math.round(
      Math.floor(count * 0.4) + densityRef.current * (MAX_STARS * 0.7 - Math.floor(count * 0.4))
    );

    const wind = Math.sin(t * 0.19) * 0.55 + Math.sin(t * 0.53) * 0.22;

    if (petalsRef.current) {
      petalsRef.current.children.forEach((child, i) => {
        const p = petals[i];
        if (!p) return;
        child.visible = i < petalVisible;
        if (!child.visible) return;

        if (!reducedMotion) {
          child.position.y -= p.fallSpeed * delta;
          child.position.x +=
            (Math.sin(t * p.swayFreq + i * 0.7) * p.swayAmp + wind * 0.35) * delta;
          child.position.z += Math.cos(t * p.swayFreq * 0.8 + i) * p.swayAmp * 0.4 * delta;

          child.rotation.x += p.rotSpeed.x * delta;
          child.rotation.y += p.rotSpeed.y * delta;
          child.rotation.z += p.rotSpeed.z * delta;
        }

        if (child.position.y < -0.6) {
          child.position.y = 8.5 + Math.random() * 2.5;
          child.position.x = (Math.random() - 0.5) * 16;
          child.position.z = (Math.random() - 0.5) * 11;
        }
      });
    }

    if (starsRef.current) {
      starsRef.current.children.forEach((child, i) => {
        const s = stars[i];
        if (!s) return;
        child.visible = i < starVisible;
        if (!child.visible) return;

        // Chu kỳ: 0 → sáng dần → tan biến
        const cyclePos = ((t + s.offset) % s.cycle) / s.cycle;
        const fade = Math.sin(Math.PI * cyclePos);
        const twinkle = 0.75 + Math.sin(t * s.twinkleSpeed + i) * 0.35;
        child.scale.setScalar(s.scale * Math.max(0.001, fade) * twinkle);

        const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (material) material.opacity = Math.max(0, fade * 0.95);

        if (!reducedMotion) {
          child.position.y += Math.sin(t * s.floatSpeed + i) * 0.004;
          child.rotation.y += delta * 1.1;
          child.rotation.z = Math.sin(t * 0.7 + i) * 0.35;
        }
      });
    }
  });

  return (
    <group>
      {/* CÁNH HOA 3D */}
      <group ref={petalsRef}>
        {petals.map((p, i) => (
          <mesh
            key={`petal-${i}`}
            geometry={petalGeom}
            position={[p.pos.x, p.pos.y, p.pos.z]}
            scale={p.scale}
          >
            <meshStandardMaterial
              color={p.color}
              roughness={0.45}
              metalness={0.04}
              side={THREE.DoubleSide}
              transparent
              opacity={p.opacity}
            />
          </mesh>
        ))}
      </group>

      {/* NGÔI SAO 4 CÁNH LẤP LÁNH */}
      <group ref={starsRef}>
        {stars.map((s, i) => (
          <mesh
            key={`star-${i}`}
            geometry={starGeom}
            position={[s.pos.x, s.pos.y, s.pos.z]}
            scale={s.scale}
          >
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={1.1}
              roughness={0.15}
              metalness={0.3}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
