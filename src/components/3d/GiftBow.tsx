import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * ─────────────────────────────────────────────────────────────
 *  Ruy băng & nơ cho hộp quà.
 *
 *  - `RibbonBands`: hai dải ruy băng bọc quanh hộp theo hai trục,
 *    bám sát bề mặt hộp (không lơ lửng, không xuyên qua hộp).
 *  - `GiftBow`: nơ đối xứng gồm 2 vòng, 1 nút giữa và 2 đuôi ruy băng
 *    có độ dày thật (ExtrudeGeometry), kèm chuyển động phụ khi hộp rung.
 * ─────────────────────────────────────────────────────────────
 */

const RIBBON_COLOR = '#F2CE7A';
const RIBBON_DEEP = '#D9A94F';
const RIBBON_HIGHLIGHT = '#FFF3C6';

/** Đuôi nơ: dải ruy băng cong nhẹ, đầu chữ V, có độ dày thật. */
export function createRibbonTailGeometry(
  length = 0.4,
  width = 0.09,
  thickness = 0.016,
  curl = 0.11
): THREE.BufferGeometry {
  const half = width / 2;
  const segments = 14;

  const center: THREE.Vector2[] = [];
  const tangents: THREE.Vector2[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Đường tâm hơi cong hình chữ S
    const x = Math.sin(t * Math.PI * 0.85) * curl + t * 0.03;
    const y = -t * length;
    center.push(new THREE.Vector2(x, y));

    const dt = 0.001;
    const t2 = Math.min(1, t + dt);
    const x2 = Math.sin(t2 * Math.PI * 0.85) * curl + t2 * 0.03;
    const y2 = -t2 * length;
    tangents.push(new THREE.Vector2(x2 - x, y2 - y).normalize());
  }

  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const n = new THREE.Vector2(-tangents[i].y, tangents[i].x);
    left.push(new THREE.Vector2(center[i].x + n.x * half, center[i].y + n.y * half));
    right.push(new THREE.Vector2(center[i].x - n.x * half, center[i].y - n.y * half));
  }

  const shape = new THREE.Shape();
  shape.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i++) shape.lineTo(left[i].x, left[i].y);

  // Đầu chữ V ở cuối dải
  const tailTip = left[left.length - 1];
  const tailTipR = right[right.length - 1];
  shape.lineTo((tailTip.x + tailTipR.x) / 2, tailTip.y + width * 0.5);
  for (let i = right.length - 1; i >= 0; i--) shape.lineTo(right[i].x, right[i].y);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize: thickness * 0.5,
    bevelThickness: thickness * 0.4,
    bevelSegments: 2,
    curveSegments: 4,
  });
  // Gốc toạ độ đặt ở đầu dải (sát nút nơ) để xoay quanh nút
  geom.translate(0, 0, -thickness / 2);
  return geom;
}

/**
 * Bố cục hình học của hai dải ruy băng (hàm thuần — dùng cho cả
 * component lẫn kiểm thử, đảm bảo ruy băng luôn bám sát mặt hộp).
 */
export interface RibbonBandLayout {
  /** Dải A: chạy dọc trục Z, ôm sát bốn mặt hộp. */
  bandA: { size: [number, number, number] };
  /** Dải B: chạy dọc trục X, nằm TRÊN dải A (đúng như dây buộc chéo). */
  bandB: { size: [number, number, number] };
  /** Chiều cao dải B (nhô lên trên dải A). */
  liftedHeight: number;
  /** Toạ độ Y của vệt satin trên mặt nắp (dải B). */
  topHighlightY: number;
  /** Toạ độ Y của vệt satin hai bên (nằm trên mặt dải A). */
  sideHighlightY: number;
  /** Toạ độ Z của vệt satin mặt trước. */
  frontHighlightZ: number;
  /** Độ dài mỗi đoạn vệt satin hai bên dải A. */
  sideSegmentWidth: number;
  /** Độ dày vệt satin. */
  highlightThickness: number;
}

export function getRibbonBandLayout(
  size: [number, number, number],
  bandWidth = 0.22,
  proud = 0.018,
  highlightThickness = 0.007
): RibbonBandLayout {
  const [w, h, d] = size;
  const liftedHeight = h + proud * 2 + 0.014;
  return {
    bandA: { size: [bandWidth, h + proud * 2, d + proud * 2] },
    bandB: { size: [w + proud * 2, liftedHeight, bandWidth] },
    liftedHeight,
    topHighlightY: liftedHeight / 2 + highlightThickness / 2,
    sideHighlightY: h / 2 + proud + highlightThickness / 2,
    frontHighlightZ: d / 2 + proud + 0.004,
    sideSegmentWidth: Math.max(0.04, w / 2 + proud - bandWidth / 2),
    highlightThickness,
  };
}

/**
 * Hai dải ruy băng bọc quanh thân/nắp hộp.
 * Band A chạy trước–sau, band B chạy phải–trái và nằm TRÊN band A
 * đúng như dây ruy băng thật buộc chéo nhau trên nắp hộp.
 */
export const RibbonBands: React.FC<{
  size: [number, number, number];
  y?: number;
  bandWidth?: number;
  proud?: number;
  color?: string;
  deepColor?: string;
  highlightColor?: string;
}> = ({
  size,
  y = 0,
  bandWidth = 0.22,
  proud = 0.018,
  color = RIBBON_COLOR,
  deepColor = RIBBON_DEEP,
  highlightColor = RIBBON_HIGHLIGHT,
}) => {
  const [, h] = size;
  const layout = getRibbonBandLayout(size, bandWidth, proud);
  const highlightThickness = 0.007;

  return (
    <group position={[0, y, 0]}>
      {/* Band A — chạy dọc trục Z (mặt trước ↔ mặt sau) */}
      <mesh castShadow>
        <boxGeometry args={layout.bandA.size} />
        <meshStandardMaterial color={deepColor} metalness={0.52} roughness={0.3} />
      </mesh>

      {/* Band B — chạy dọc trục X, nằm trên band A */}
      <mesh castShadow>
        <boxGeometry args={layout.bandB.size} />
        <meshStandardMaterial color={color} metalness={0.52} roughness={0.3} />
      </mesh>

      {/* Vệt satin trên mặt nắp: band B */}
      <mesh position={[0, layout.topHighlightY, 0]}>
        <boxGeometry args={[layout.bandB.size[0], highlightThickness, bandWidth * 0.4]} />
        <meshStandardMaterial color={highlightColor} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Vệt satin trên mặt nắp: hai bên band A */}
      <mesh position={[-(bandWidth / 2 + layout.sideSegmentWidth / 2), layout.sideHighlightY, 0]}>
        <boxGeometry args={[layout.sideSegmentWidth, highlightThickness, bandWidth * 0.4]} />
        <meshStandardMaterial color={highlightColor} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[bandWidth / 2 + layout.sideSegmentWidth / 2, layout.sideHighlightY, 0]}>
        <boxGeometry args={[layout.sideSegmentWidth, highlightThickness, bandWidth * 0.4]} />
        <meshStandardMaterial color={highlightColor} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Vệt sáng dọc mặt trước của band A */}
      <mesh position={[0, 0, layout.frontHighlightZ]}>
        <boxGeometry args={[bandWidth * 0.35, h * 0.75, 0.005]} />
        <meshStandardMaterial color={highlightColor} metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
};

/**
 * Nơ đối xứng: 2 vòng + nút giữa + 2 đuôi, có "độ nhún" theo chuyển
 * động của hộp (follow-through) nhờ theo dõi vận tốc xoay của nhóm cha.
 */
export const GiftBow: React.FC<{
  bowRef?: React.RefObject<THREE.Group | null>;
  scale?: number;
  reducedMotion?: boolean;
  color?: string;
  deepColor?: string;
}> = ({ bowRef, scale = 0.92, reducedMotion = false, color = RIBBON_COLOR, deepColor = RIBBON_DEEP }) => {
  const innerRef = useRef<THREE.Group>(null);
  const master = bowRef ?? innerRef;

  const loopL = useRef<THREE.Group>(null);
  const loopR = useRef<THREE.Group>(null);
  const tailLOuter = useRef<THREE.Group>(null);
  const tailROuter = useRef<THREE.Group>(null);
  const tailLInner = useRef<THREE.Group>(null);
  const tailRInner = useRef<THREE.Group>(null);

  const tailGeom = useMemo(() => createRibbonTailGeometry(0.4, 0.09, 0.016, 0.1), []);
  const tailGeomMirror = useMemo(() => createRibbonTailGeometry(0.34, 0.085, 0.015, -0.08), []);

  const prevRotation = useRef({ x: 0, z: 0 });
  const lag = useRef(0);

  const BASE_FAN = 0.7;
  const BASE_FLAT = -Math.PI / 2 + 0.06;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const parent = master.current;

    // Vận tốc xoay của nhóm cha → độ trễ của nơ (secondary motion)
    let targetLag = 0;
    if (parent) {
      const dz = parent.rotation.z - prevRotation.current.z;
      const dx = parent.rotation.x - prevRotation.current.x;
      prevRotation.current.z = parent.rotation.z;
      prevRotation.current.x = parent.rotation.x;
      if (!reducedMotion) {
        const velocity = (dz + dx) / Math.max(delta, 1 / 120);
        targetLag = THREE.MathUtils.clamp(-velocity * 0.035, -0.4, 0.4);
      }
    }
    lag.current = THREE.MathUtils.lerp(lag.current, targetLag, Math.min(1, delta * 10));

    const breathe = reducedMotion ? 0 : Math.sin(t * 2.1) * 0.022;
    const sway = reducedMotion ? 0 : Math.sin(t * 1.5) * 0.06;
    const flutter = reducedMotion ? 0 : Math.sin(t * 2.4) * 0.05;

    if (loopL.current) {
      loopL.current.rotation.z = 0.3 + lag.current * 0.9;
      loopL.current.rotation.y = -0.26 - lag.current * 0.25;
      loopL.current.scale.setScalar(1 + breathe);
    }
    if (loopR.current) {
      loopR.current.rotation.z = -0.3 + lag.current * 0.9;
      loopR.current.rotation.y = 0.26 + lag.current * 0.25;
      loopR.current.scale.setScalar(1 + breathe);
    }

    // Đuôi: xoay ngang để quạt ra hai bên, độ võng chỉnh ở nhóm trong
    if (tailLOuter.current) tailLOuter.current.rotation.y = BASE_FAN + sway + lag.current * 0.3;
    if (tailROuter.current) tailROuter.current.rotation.y = -BASE_FAN - sway + lag.current * 0.3;
    if (tailLInner.current) tailLInner.current.rotation.x = BASE_FLAT + flutter + lag.current * 0.25;
    if (tailRInner.current) tailRInner.current.rotation.x = BASE_FLAT - flutter + lag.current * 0.25;
  });

  return (
    <group ref={master} scale={scale}>
      {/* Nút giữa */}
      <mesh castShadow scale={[0.082, 0.062, 0.06]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.26} />
      </mesh>
      {/* Dải quấn quanh nút */}
      <mesh scale={[0.024, 0.07, 0.066]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={deepColor} metalness={0.6} roughness={0.24} />
      </mesh>

      {/* Vòng trái */}
      <group ref={loopL} position={[-0.14, 0.045, 0.005]} rotation={[0, -0.26, 0.3]}>
        <mesh castShadow scale={[1.18, 1, 0.62]}>
          <torusGeometry args={[0.145, 0.05, 18, 44]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.28} />
        </mesh>
        <mesh scale={[1.02, 0.86, 0.42]} position={[0, 0, 0.012]}>
          <torusGeometry args={[0.145, 0.038, 14, 40]} />
          <meshStandardMaterial color={deepColor} metalness={0.45} roughness={0.4} />
        </mesh>
      </group>

      {/* Vòng phải */}
      <group ref={loopR} position={[0.14, 0.045, 0.005]} rotation={[0, 0.26, -0.3]}>
        <mesh castShadow scale={[1.18, 1, 0.62]}>
          <torusGeometry args={[0.145, 0.05, 18, 44]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.28} />
        </mesh>
        <mesh scale={[1.02, 0.86, 0.42]} position={[0, 0, 0.012]}>
          <torusGeometry args={[0.145, 0.038, 14, 40]} />
          <meshStandardMaterial color={deepColor} metalness={0.45} roughness={0.4} />
        </mesh>
      </group>

      {/* Đuôi trái — quạt sang trái, nằm trên mặt nắp */}
      <group ref={tailLOuter} position={[-0.02, -0.02, 0.02]} rotation={[0, BASE_FAN, 0]}>
        <group ref={tailLInner} rotation={[BASE_FLAT, 0, 0]}>
          <mesh geometry={tailGeom} castShadow>
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.32} />
          </mesh>
        </group>
      </group>

      {/* Đuôi phải */}
      <group ref={tailROuter} position={[0.02, -0.02, 0.02]} rotation={[0, -BASE_FAN, 0]}>
        <group ref={tailRInner} rotation={[BASE_FLAT, 0, 0]}>
          <mesh geometry={tailGeomMirror} castShadow>
            <meshStandardMaterial color={deepColor} metalness={0.5} roughness={0.34} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
