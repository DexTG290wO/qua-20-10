import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createFourPointStarGeometry, createPetalGeometry } from '../ProceduralFlora';

/**
 * ─────────────────────────────────────────────────────────────
 *  Phụ kiện 3D dùng chung cho các nhân vật bậc Sử Thi / Huyền Bí.
 *  Tất cả đều là hình học thật (không dùng ảnh) và dùng lại cùng
 *  một số geometry để nhẹ máy.
 * ─────────────────────────────────────────────────────────────
 */

const featherGeom = createPetalGeometry(1, 0.52, 0.07);
const starGeom = createFourPointStarGeometry(1, 0.34);

/** Cánh lông vũ nhiều lớp (thiên thần). */
export const FeatherWing: React.FC<{
  side: 1 | -1;
  rows?: number;
  span?: number;
  featherLength?: number;
  featherWidth?: number;
  color?: string;
  tipColor?: string;
  glow?: number;
}> = ({
  side,
  rows = 3,
  span = 0.6,
  featherLength = 0.3,
  featherWidth = 0.1,
  color = '#FFFFFF',
  tipColor = '#FFF3D6',
  glow = 0.1,
}) => {
  const feathers = useMemo(() => {
    const list: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
      scale: [number, number, number];
      color: string;
    }> = [];

    for (let row = 0; row < rows; row++) {
      const count = 5 + row;
      const rowShrink = 1 - row * 0.17;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1); // 0 = gần thân, 1 = đầu cánh
        const theta = 0.1 + t * 1.25; // góc toả so với phương thẳng đứng
        const R = 0.12 + t * span * 0.6 + row * 0.055;
        const dirX = -Math.sin(theta) * side;
        const dirY = Math.cos(theta);
        // Lông ở giữa dài nhất, hai đầu ngắn dần cho mềm dáng
        const len = featherLength * rowShrink * (0.62 + 0.6 * Math.sin(Math.PI * (0.22 + t * 0.78)));

        list.push({
          pos: [
            side * 0.3 + dirX * R * 0.55,
            0.34 + dirY * R - t * 0.18 - row * 0.05,
            -0.05 - row * 0.045 - t * 0.05,
          ],
          rot: [0.14 + t * 0.12, side * (-0.22 - t * 0.18), side * theta * 0.95],
          scale: [featherWidth * (1 - t * 0.22), len, 1],
          color: row === rows - 1 && t > 0.55 ? tipColor : color,
        });
      }
    }
    return list;
  }, [side, rows, span, featherLength, featherWidth, color, tipColor]);

  return (
    <group>
      {feathers.map((f, i) => (
        <mesh key={i} geometry={featherGeom} position={f.pos} rotation={f.rot} scale={f.scale}>
          <meshStandardMaterial
            color={f.color}
            emissive={tipColor}
            emissiveIntensity={glow}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Cánh rồng có màng da + gân xương. */
export const DragonWing: React.FC<{
  side: 1 | -1;
  scale?: number;
  color?: string;
  membrane?: string;
  glow?: number;
}> = ({ side, scale = 1, color = '#B07CD8', membrane = '#E6C8F7', glow = 0.18 }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.3, 0.52, 0.92, 0.66); // mép trước
    s.quadraticCurveTo(0.8, 0.34, 0.64, 0.44); // vết lõm 1
    s.quadraticCurveTo(0.52, 0.14, 0.36, 0.28); // vết lõm 2
    s.quadraticCurveTo(0.22, 0.04, 0.08, 0.16); // vết lõm 3
    s.quadraticCurveTo(0.03, 0.06, 0, 0);
    s.closePath();
    return s;
  }, []);

  const extrude = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.012,
        bevelSegments: 2,
        curveSegments: 6,
      }),
    [shape]
  );

  const struts: Array<[number, number, number]> = [
    [0.3, 0.5, 0.72],
    [0.52, 0.24, 0.5],
    [0.74, 0.1, 0.42],
  ];

  return (
    <group scale={[side * scale, scale, scale]}>
      <mesh geometry={extrude} castShadow rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color={membrane}
          emissive={color}
          emissiveIntensity={glow}
          roughness={0.45}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Gân xương trên mép trước */}
      <mesh position={[0.46, 0.34, 0.02]} rotation={[0, 0, -0.95]} scale={[0.028, 0.52, 0.028]}>
        <cylinderGeometry args={[1, 0.7, 1, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {struts.map((s, i) => (
        <mesh
          key={i}
          position={[s[0] * 0.5, s[1] * 0.62, 0.02]}
          rotation={[0, 0, -Math.atan2(s[0], s[1])]}
          scale={[0.016, Math.hypot(s[0], s[1]) * 0.95, 0.016]}
        >
          <cylinderGeometry args={[1, 0.8, 1, 6]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
};

/** Trái tim 3D có khối dày + phát sáng (gấu bông ôm tim). */
export const HeartGem: React.FC<{
  scale?: number;
  color?: string;
  glow?: number;
  pulse?: boolean;
}> = ({ scale = 1, color = '#FF3D6E', glow = 1.1, pulse = true }) => {
  const ref = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.52);
    s.bezierCurveTo(-0.95, 0.06, -0.52, 0.8, 0, 0.3);
    s.bezierCurveTo(0.52, 0.8, 0.95, 0.06, 0, -0.52);
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.34,
      bevelEnabled: true,
      bevelSize: 0.07,
      bevelThickness: 0.07,
      bevelSegments: 3,
      curveSegments: 10,
    });
  }, []);

  useFrame((state) => {
    if (!ref.current || !pulse) return;
    const t = state.clock.getElapsedTime();
    const beat = 1 + Math.sin(t * 4.4) * 0.045 + (Math.sin(t * 8.8) > 0.92 ? 0.05 : 0);
    ref.current.scale.setScalar(beat);
  });

  return (
    <group ref={ref} scale={scale}>
      <mesh geometry={geometry} position={[0, 0, -0.17]} castShadow>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glow * 0.5}
          roughness={0.22}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Đốm sáng như viên ngọc */}
      <mesh position={[-0.16, 0.1, 0.12]} scale={0.07}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

/** Vòng quỹ đạo nghiêng + hành tinh nhỏ (vũ trụ / định mệnh). */
export const OrbitSystem: React.FC<{
  radius?: number;
  tilt?: number;
  color?: string;
  speed?: number;
  showPlanet?: boolean;
}> = ({ radius = 0.9, tilt = 0.5, color = '#FFD54F', speed = 0.8, showPlanet = true }) => {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });

  return (
    <group rotation={[tilt, 0, 0.18]}>
      <group ref={ref}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.014, 10, 72]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        {showPlanet && (
          <mesh position={[radius, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 18, 18]} />
            <meshPhysicalMaterial
              color="#FFF3C4"
              emissive={color}
              emissiveIntensity={0.6}
              roughness={0.25}
              clearcoat={0.6}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

/** Vương miện hoàng gia: vành + 5 mũi + đá quý + mũ nhung. */
export const RoyalCrown: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <group scale={scale}>
    {/* Mũ nhung bên trong */}
    <mesh position={[0, 0.16, 0]} scale={[0.86, 0.3, 0.86]}>
      <sphereGeometry args={[1, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <meshPhysicalMaterial color="#7B1FA2" roughness={0.75} />
    </mesh>

    {/* Vành vàng */}
    <mesh castShadow>
      <cylinderGeometry args={[1, 1.04, 0.34, 24]} />
      <meshPhysicalMaterial
        color="#FFD25A"
        metalness={0.92}
        roughness={0.16}
        clearcoat={0.6}
        emissive="#8A5B00"
        emissiveIntensity={0.12}
      />
    </mesh>
    {/* Viền nổi hai mép vành */}
    {[0.17, -0.17].map((y, i) => (
      <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.01, 0.03, 10, 32]} />
        <meshPhysicalMaterial color="#FFF0B8" metalness={0.9} roughness={0.2} />
      </mesh>
    ))}

    {/* 5 mũi nhọn + đá quý */}
    {Array.from({ length: 5 }).map((_, i) => {
      const a = (i / 5) * Math.PI * 2;
      const tall = i % 2 === 0;
      return (
        <group key={i} position={[Math.sin(a) * 0.92, 0.16, Math.cos(a) * 0.92]}>
          <mesh position={[0, tall ? 0.28 : 0.2, 0]} scale={[0.26, tall ? 0.42 : 0.3, 0.26]}>
            <coneGeometry args={[1, 1, 6]} />
            <meshPhysicalMaterial color="#FFD25A" metalness={0.92} roughness={0.14} />
          </mesh>
          <mesh position={[0, tall ? 0.5 : 0.36, 0]} scale={0.1}>
            <octahedronGeometry args={[1, 0]} />
            <meshPhysicalMaterial
              color={i % 2 === 0 ? '#E53935' : '#7C4DFF'}
              emissive={i % 2 === 0 ? '#E53935' : '#7C4DFF'}
              emissiveIntensity={0.35}
              roughness={0.08}
              metalness={0.2}
            />
          </mesh>
        </group>
      );
    })}
  </group>
);

/** Áo choàng hoàng gia có viền lông trắng. */
export const RoyalCape: React.FC<{ color?: string; trim?: string; scale?: number }> = ({
  color = '#4527A0',
  trim = '#FFFFFF',
  scale = 1,
}) => (
  <group scale={scale}>
    {/* Thân áo choàng (khum theo lưng) */}
    <mesh position={[0, -0.05, -0.34]} rotation={[0.16, 0, 0]} scale={[0.68, 0.72, 0.2]} castShadow>
      <sphereGeometry args={[1, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
      <meshPhysicalMaterial color={color} roughness={0.72} side={THREE.DoubleSide} />
    </mesh>
    {/* Viền lông ở gấu áo */}
    <mesh position={[0, -0.66, -0.28]} rotation={[0.3, 0, 0]} scale={[0.7, 0.1, 0.22]}>
      <torusGeometry args={[1, 0.26, 12, 30, Math.PI]} />
      <meshPhysicalMaterial color={trim} roughness={0.85} />
    </mesh>
    {/* Cổ lông trắng */}
    <mesh position={[0, 0.36, -0.02]} scale={[0.5, 0.12, 0.5]}>
      <torusGeometry args={[1, 0.34, 12, 28]} />
      <meshPhysicalMaterial color={trim} roughness={0.85} />
    </mesh>
  </group>
);

/** Trăng lưỡi liềm pha lê (Thỏ Ánh Trăng). */
export const CrescentMoon: React.FC<{ radius?: number; color?: string; glow?: number }> = ({
  radius = 0.34,
  color = '#FFD54F',
  glow = 1.2,
}) => (
  <group>
    <mesh rotation={[0, 0, Math.PI * 0.35]}>
      <torusGeometry args={[radius, radius * 0.2, 14, 48, Math.PI * 1.45]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glow}
        metalness={0.7}
        roughness={0.12}
        clearcoat={0.8}
      />
    </mesh>
    <mesh rotation={[0, 0, Math.PI * 0.35]} scale={0.94}>
      <torusGeometry args={[radius, radius * 0.09, 12, 40, Math.PI * 1.3]} />
      <meshBasicMaterial color="#FFFBEA" />
    </mesh>
  </group>
);

/** Viên pha lê hình sao 4 cánh phát sáng. */
export const StarCrystal: React.FC<{ size?: number; color?: string; spin?: number }> = ({
  size = 0.16,
  color = '#FFF176',
  spin = 0.8,
}) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * spin;
      ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 1.4) * 0.18;
    }
  });

  return (
    <group ref={ref} scale={size}>
      <mesh geometry={starGeom}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          roughness={0.1}
          clearcoat={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh scale={0.32}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

/** Vòng hào quang phát sáng. */
export const HaloRing: React.FC<{
  radius?: number;
  tube?: number;
  color?: string;
  tilt?: [number, number, number];
  glow?: number;
}> = ({ radius = 0.42, tube = 0.04, color = '#FFD700', tilt = [0.2, 0, 0], glow = 0.9 }) => (
  <mesh rotation={tilt}>
    <torusGeometry args={[radius, tube, 14, 40]} />
    <meshPhysicalMaterial
      color={color}
      emissive={color}
      emissiveIntensity={glow}
      metalness={0.9}
      roughness={0.12}
    />
  </mesh>
);

/** Các ký tự cổ đang xoay quanh nhân vật (thiên thần tối thượng). */
export const RuneRing: React.FC<{
  radius?: number;
  count?: number;
  y?: number;
  color?: string;
  speed?: number;
}> = ({ radius = 0.95, count = 8, y = 0, color = '#FFE082', speed = 0.5 }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });

  return (
    <group ref={ref} position={[0, y, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * radius, Math.sin(a * 2) * 0.06, Math.sin(a) * radius]}
            rotation={[0, -a, Math.sin(a * 3) * 0.4]}
            scale={0.07}
          >
            <boxGeometry args={[1, 1, 0.18]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Vòng sao lấp lánh quanh chân (bụi sao). */
export const StardustRing: React.FC<{ radius?: number; count?: number; color?: string }> = ({
  radius = 0.85,
  count = 14,
  color = '#FFF3C4',
}) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    g.rotation.y += delta * 0.25;
    g.children.forEach((c, i) => {
      const s = 0.5 + Math.sin(t * 2.4 + i) * 0.5;
      c.scale.setScalar(0.03 + s * 0.035);
    });
  });

  return (
    <group ref={ref} position={[0, 0.04, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} geometry={starGeom} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[-Math.PI / 2, 0, a]}>
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
        );
      })}
    </group>
  );
};
