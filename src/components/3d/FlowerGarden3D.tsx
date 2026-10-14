import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createGrassTuftGeometry, createPetalGeometry, createThickPetalGeometry } from './ProceduralFlora';

interface FlowerGarden3DProps {
  isOpening?: boolean;
  reducedMotion?: boolean;
}

type FlowerKind = 'daisy' | 'rose' | 'cherry' | 'tulip' | 'lavender';

const LEAF = '#7FBF6B';
const STEM = '#82C58A';

/** Cánh hoa mỏng (daisy, cherry, tulip). */
const petalGeom = createPetalGeometry(0.26, 0.16, 0.05);
/** Cánh hoa dày (rose). */
const thickPetalGeom = createThickPetalGeometry(0.24, 0.19, 0.04);
/** Lá xanh. */
const leafGeom = createPetalGeometry(0.3, 0.15, 0.04);

const Petals: React.FC<{
  count: number;
  radius: number;
  tilt: number;
  length: number;
  width: number;
  color: string;
  thick?: boolean;
}> = ({ count, radius, tilt, length, width, color, thick }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      return (
        <group key={i} rotation={[0, a, 0]}>
          <mesh
            geometry={thick ? thickPetalGeom : petalGeom}
            position={[0, 0, radius]}
            rotation={[Math.PI / 2 - tilt, 0, 0]}
            scale={[width, length, 1]}
            castShadow
          >
            <meshStandardMaterial
              color={color}
              roughness={0.42}
              metalness={0.03}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      );
    })}
  </>
);

const FlowerHead: React.FC<{ kind: FlowerKind; color: string; accent: string }> = ({
  kind,
  color,
  accent,
}) => {
  if (kind === 'daisy') {
    return (
      <group>
        <mesh scale={[0.075, 0.05, 0.075]} castShadow>
          <sphereGeometry args={[1, 14, 14]} />
          <meshStandardMaterial color={accent} roughness={0.35} emissive={accent} emissiveIntensity={0.18} />
        </mesh>
        <Petals count={11} radius={0.075} tilt={0.35} length={1.05} width={0.95} color={color} />
      </group>
    );
  }

  if (kind === 'rose') {
    return (
      <group>
        <Petals count={5} radius={0.045} tilt={0.18} length={0.55} width={0.6} color={color} thick />
        <Petals count={6} radius={0.095} tilt={0.45} length={0.7} width={0.72} color={color} thick />
        <Petals count={9} radius={0.16} tilt={0.78} length={0.8} width={0.75} color={color} thick />
        <mesh scale={[0.05, 0.06, 0.05]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={accent} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  if (kind === 'cherry') {
    return (
      <group>
        <Petals count={5} radius={0.06} tilt={0.28} length={0.75} width={0.85} color={color} />
        <mesh scale={[0.05, 0.04, 0.05]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={accent} roughness={0.35} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.035, 0.055, Math.sin(a) * 0.035]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.1, 4]} />
              <meshStandardMaterial color="#FFE082" emissive="#FFD54F" emissiveIntensity={0.4} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (kind === 'tulip') {
    return (
      <group>
        <Petals count={6} radius={0.032} tilt={0.2} length={0.9} width={0.72} color={color} />
        <mesh scale={[0.032, 0.05, 0.032]} position={[0, 0.06, 0]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={accent} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  // lavender — chùm hoa nhỏ xếp tầng
  return (
    <group>
      {Array.from({ length: 7 }).map((_, i) => {
        const t = i / 6;
        return (
          <mesh
            key={i}
            position={[(i % 2 === 0 ? 0.035 : -0.035) * t, 0.05 + i * 0.062, 0]}
            scale={[0.062 - i * 0.005, 0.05, 0.062 - i * 0.005]}
            castShadow
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

interface FlowerProps {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  kind?: FlowerKind;
  color?: string;
  accent?: string;
  stemHeight?: number;
  /** Hệ số biên độ đung đưa (xa hơn thì nhẹ hơn). */
  sway?: number;
  phase?: number;
  /** Giảm chuyển động: bỏ hẳn đung đưa. */
  calm?: boolean;
  registerRef?: (el: THREE.Group | null) => void;
}

const Flower: React.FC<FlowerProps> = ({
  position,
  scale = 1,
  rotationY = 0,
  kind = 'daisy',
  color = '#FFFDF5',
  accent = '#FFD54F',
  stemHeight = 0.62,
  sway = 1,
  phase = 0,
  calm = false,
  registerRef,
}) => {
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (calm) return;
    const t = state.clock.getElapsedTime();
    if (ref.current) ref.current.rotation.z = Math.sin(t * 1.35 + phase) * 0.05 * sway;
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.1 + phase) * 0.07 * sway;
      headRef.current.rotation.x = Math.sin(t * 1.7 + phase) * 0.045 * sway;
    }
  });

  return (
    <group
      ref={(el) => {
        ref.current = el;
        registerRef?.(el);
      }}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
    >
      <mesh position={[0, stemHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.028, stemHeight, 7]} />
        <meshStandardMaterial color={STEM} roughness={0.6} />
      </mesh>
      <mesh geometry={leafGeom} position={[0.07, stemHeight * 0.42, 0.02]} rotation={[0.2, 0, -0.95]} scale={[1, 0.62, 1]}>
        <meshStandardMaterial color={LEAF} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={leafGeom} position={[-0.07, stemHeight * 0.24, 0.02]} rotation={[0.2, Math.PI, 0.95]} scale={[0.9, 0.56, 1]}>
        <meshStandardMaterial color={LEAF} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <group ref={headRef} position={[0, stemHeight, 0]} rotation={[0.16, 0, 0]}>
        <FlowerHead kind={kind} color={color} accent={accent} />
      </group>
    </group>
  );
};

/** Bụi cây tròn mềm có hoa liti. */
const Bush: React.FC<{ position: [number, number, number]; scale?: number; color?: string }> = ({
  position,
  scale = 1,
  color = '#8FCF7E',
}) => (
  <group position={position} scale={scale}>
    <mesh scale={[1, 0.72, 0.86]} castShadow receiveShadow>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
    <mesh position={[0.45, 0.1, 0.18]} scale={[0.6, 0.5, 0.55]}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshStandardMaterial color="#7CC06B" roughness={0.72} />
    </mesh>
    <mesh position={[-0.42, 0.05, -0.12]} scale={[0.55, 0.46, 0.5]}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshStandardMaterial color="#9BD98A" roughness={0.72} />
    </mesh>
    {/* Hoa nhỏ điểm trên bụi */}
    {[
      [0.3, 0.6, 0.3],
      [-0.35, 0.5, 0.25],
      [0.05, 0.72, -0.2],
    ].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} scale={0.055}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={i % 2 ? '#FFD1DC' : '#FFF3F6'} roughness={0.4} />
      </mesh>
    ))}
  </group>
);

/** Vòm hoa phía sau hộp quà. */
const FloralArch: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[-1.5, 1.15, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.11, 2.3, 12]} />
      <meshStandardMaterial color="#E8DCC8" roughness={0.6} />
    </mesh>
    <mesh position={[1.5, 1.15, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.11, 2.3, 12]} />
      <meshStandardMaterial color="#E8DCC8" roughness={0.6} />
    </mesh>
    <mesh position={[0, 2.3, 0]} rotation={[0, 0, 0]} castShadow>
      <torusGeometry args={[1.5, 0.085, 12, 40, Math.PI]} />
      <meshStandardMaterial color="#EFE3D0" roughness={0.6} />
    </mesh>
    {/* Dây hoa leo quanh vòm */}
    {Array.from({ length: 26 }).map((_, i) => {
      const a = Math.PI * (i / 25);
      return (
        <mesh key={i} position={[Math.cos(a) * 1.5, 2.3 + Math.sin(a) * 1.5, 0]} scale={0.07}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#FFB6C1' : '#FFF0F4'} roughness={0.45} />
        </mesh>
      );
    })}
  </group>
);

export const FlowerGarden3D: React.FC<FlowerGarden3DProps> = ({
  isOpening = false,
  reducedMotion = false,
}) => {
  const bloomRefs = useRef<(THREE.Group | null)[]>([]);
  const fireflyRef = useRef<THREE.Group>(null);
  const grassRef = useRef<THREE.Group>(null);
  const bloom = useRef(0);

  // Cụm hoa: ưu tiên hai bên và phía sau để không che hộp quà / thiệp
  const clusters = useMemo(
    () => [
      // Trung cảnh hai bên
      { pos: [-2.45, 0, -0.55] as [number, number, number], kind: 'rose' as FlowerKind, color: '#FF85A1', s: 1.15, r: 0.4 },
      { pos: [-1.7, 0, -0.9] as [number, number, number], kind: 'daisy' as FlowerKind, color: '#FFFDF5', s: 1.0, r: 1.1 },
      { pos: [2.45, 0, -0.55] as [number, number, number], kind: 'cherry' as FlowerKind, color: '#FFC4D6', s: 1.1, r: -0.4 },
      { pos: [1.75, 0, -0.95] as [number, number, number], kind: 'tulip' as FlowerKind, color: '#FFB0C0', s: 1.0, r: -1.0 },
      // Hàng giữa
      { pos: [-3.0, 0, -1.8] as [number, number, number], kind: 'lavender' as FlowerKind, color: '#C79BE0', s: 1.25, r: 0.6 },
      { pos: [-2.5, 0, -2.1] as [number, number, number], kind: 'daisy' as FlowerKind, color: '#FFF7E8', s: 0.95, r: 0.2 },
      { pos: [2.9, 0, -1.9] as [number, number, number], kind: 'rose' as FlowerKind, color: '#FF9FB6', s: 1.2, r: -0.5 },
      { pos: [2.4, 0, -2.2] as [number, number, number], kind: 'cherry' as FlowerKind, color: '#FFD0DE', s: 1.0, r: 0.3 },
      // Nền xa
      { pos: [-3.9, 0, -3.2] as [number, number, number], kind: 'tulip' as FlowerKind, color: '#F7A8BF', s: 1.25, r: 0.9 },
      { pos: [-2.9, 0, -3.6] as [number, number, number], kind: 'daisy' as FlowerKind, color: '#FFFFFF', s: 1.15, r: 0.5 },
      { pos: [-1.6, 0, -3.9] as [number, number, number], kind: 'rose' as FlowerKind, color: '#FF8CA8', s: 1.3, r: 0.1 },
      { pos: [-0.5, 0, -4.1] as [number, number, number], kind: 'lavender' as FlowerKind, color: '#BE93DA', s: 1.35, r: 0.7 },
      { pos: [0.7, 0, -4.0] as [number, number, number], kind: 'cherry' as FlowerKind, color: '#FFC9DA', s: 1.25, r: -0.6 },
      { pos: [1.9, 0, -3.7] as [number, number, number], kind: 'daisy' as FlowerKind, color: '#FFF9EF', s: 1.15, r: -0.2 },
      { pos: [3.1, 0, -3.3] as [number, number, number], kind: 'rose' as FlowerKind, color: '#FFA9BE', s: 1.3, r: -0.9 },
      { pos: [4.0, 0, -2.6] as [number, number, number], kind: 'tulip' as FlowerKind, color: '#FFBCCC', s: 1.1, r: -1.2 },
      // Gần hộp quà nhưng lùi ra sau (không che tầm nhìn)
      { pos: [-1.15, 0, -1.45] as [number, number, number], kind: 'daisy' as FlowerKind, color: '#FFFFFF', s: 0.8, r: 0.4 },
      { pos: [1.2, 0, -1.5] as [number, number, number], kind: 'cherry' as FlowerKind, color: '#FFD5E1', s: 0.8, r: -0.4 },
    ],
    []
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 20 }).map(() => ({
        base: new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          0.45 + Math.random() * 2.4,
          -1 - Math.random() * 4
        ),
        speed: 0.9 + Math.random() * 1.4,
        color: Math.random() > 0.5 ? '#FFF6C4' : '#FFD6E4',
      })),
    []
  );

  const grassGeom = useMemo(() => createGrassTuftGeometry(6, 0.42), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Hoa "nở" nhẹ khi hộp quà mở
    const target = isOpening ? 1 : 0;
    bloom.current += (target - bloom.current) * Math.min(1, delta * 1.4);
    bloomRefs.current.forEach((el, i) => {
      if (!el) return;
      const pulse = 1 + bloom.current * (0.05 + (reducedMotion ? 0 : Math.sin(t * 2.2 + i) * 0.025));
      el.scale.setScalar(pulse);
    });

    if (fireflyRef.current && !reducedMotion) {
      fireflyRef.current.children.forEach((child, i) => {
        const f = fireflies[i];
        if (!f) return;
        child.position.y = f.base.y + Math.sin(t * f.speed + i) * (isOpening ? 0.55 : 0.22);
        child.position.x = f.base.x + Math.cos(t * f.speed * 0.7 + i) * 0.32;
        child.position.z = f.base.z + Math.sin(t * f.speed * 0.5 + i) * 0.3;
      });
    }

    if (grassRef.current && !reducedMotion) {
      grassRef.current.children.forEach((child, i) => {
        child.rotation.z = Math.sin(t * 1.6 + i * 0.8) * 0.06;
      });
    }
  });

  let refIndex = 0;

  return (
    <group>
      {/* Thảm cỏ */}
      <mesh position={[0, -0.03, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#A9E3B8" roughness={0.82} />
      </mesh>
      <mesh position={[0, -0.02, -1.6]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.1, 48]} />
        <meshStandardMaterial color="#C7EDB9" roughness={0.78} />
      </mesh>
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.95, 40]} />
        <meshStandardMaterial color="#E4F3C8" roughness={0.7} />
      </mesh>

      {/* Cỏ gần camera — thấp, không che thiệp */}
      <group ref={grassRef}>
        {[
          [-2.15, 0, 1.55],
          [-1.35, 0, 2.1],
          [1.4, 0, 1.9],
          [2.25, 0, 1.45],
          [-3.1, 0, 0.8],
          [3.15, 0, 0.85],
        ].map((p, i) => (
          <mesh
            key={i}
            geometry={grassGeom}
            position={p as [number, number, number]}
            rotation={[0, i * 0.7, 0]}
          >
            <meshStandardMaterial color="#8FD480" roughness={0.75} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Vòm hoa + bụi cây phía sau */}
      <FloralArch position={[0, 0, -4.4]} />
      <Bush position={[-4.4, 0.35, -3.4]} scale={1.25} />
      <Bush position={[4.3, 0.32, -3.6]} scale={1.15} color="#86C878" />
      <Bush position={[-5.2, 0.28, -1.8]} scale={0.95} color="#96D687" />
      <Bush position={[5.1, 0.3, -1.6]} scale={1.0} color="#8CCB7C" />

      {/* Các cụm hoa */}
      {clusters.map((c, i) => (
        <Flower
          key={i}
          position={c.pos}
          scale={c.s}
          rotationY={c.r}
          kind={c.kind}
          color={c.color}
          accent={c.kind === 'daisy' ? '#FFCF5C' : c.kind === 'rose' ? '#F7C6D2' : '#FFE082'}
          stemHeight={c.kind === 'lavender' ? 0.86 : 0.62}
          sway={0.6 + (i % 3) * 0.25}
          phase={i * 0.9}
          calm={reducedMotion}
          registerRef={(el) => {
            const idx = refIndex++;
            bloomRefs.current[idx] = el;
          }}
        />
      ))}

      {/* Đèn ma thuật nhỏ */}
      <group ref={fireflyRef}>
        {fireflies.map((f, i) => (
          <mesh key={i} position={[f.base.x, f.base.y, f.base.z]} scale={0.05}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial
              color={f.color}
              emissive={f.color}
              emissiveIntensity={1.4}
              roughness={0.2}
              transparent
              opacity={0.95}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
