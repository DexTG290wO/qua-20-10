import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createBlushTexture } from './CommonMaterials';

// ─────────────────────────────────────────────────────────────
// KawaiiEyes — properly modeled 3D anime eyes.
//
// Each eye is built from real geometry (sclera dome + iris + pupil
// + two specular highlights) so both eyes always share the same
// depth, orientation and gaze direction. Because it is genuine
// geometry it is correctly occluded by the head and by other scene
// objects (no `depthTest={false}` tricks, no flat decals floating
// outside the head mesh).
// ─────────────────────────────────────────────────────────────
export interface KawaiiEyesProps {
  /** Eye-pair anchor, relative to the head group. */
  position?: [number, number, number];
  /** Horizontal distance between the two pupils. */
  spacing?: number;
  /** Eye diameter (roughly matches the old decal size). */
  size?: number;
  irisColor?: string;
  pupilColor?: string;
  highlightColor?: string;
  /** Slight outward yaw so the eyes follow the head curvature. */
  tilt?: number;
  /** Idle blinking. */
  blink?: boolean;
  /** Small constant gaze offset, in eye-radius units. */
  gaze?: [number, number];
  /** De-sync blinking between instances. */
  blinkSeed?: number;
}

const SingleEye: React.FC<{
  size: number;
  irisColor: string;
  pupilColor: string;
  highlightColor: string;
  gaze: [number, number];
}> = ({ size, irisColor, pupilColor, highlightColor, gaze }) => {
  const r = size * 0.5;
  const [gx, gy] = gaze;

  return (
    <>
      {/* Sclera — a soft white dome */}
      <mesh scale={[1, 1.03, 0.82]}>
        <sphereGeometry args={[r, 20, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.16} metalness={0.04} />
      </mesh>

      {/* Iris */}
      <mesh
        position={[gx * r * 0.35, gy * r * 0.35, r * 0.58]}
        scale={[1, 1, 0.55]}
      >
        <sphereGeometry args={[r * 0.74, 18, 18]} />
        <meshStandardMaterial color={irisColor} roughness={0.28} />
      </mesh>

      {/* Pupil */}
      <mesh
        position={[gx * r * 0.5, gy * r * 0.5, r * 0.78]}
        scale={[1, 1, 0.5]}
      >
        <sphereGeometry args={[r * 0.44, 16, 16]} />
        <meshStandardMaterial color={pupilColor} roughness={0.22} />
      </mesh>

      {/* Primary highlight (upper-left) */}
      <mesh position={[-r * 0.26, r * 0.34, r * 0.86]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[r * 0.26, 12, 12]} />
        <meshBasicMaterial color={highlightColor} />
      </mesh>

      {/* Secondary twinkle (lower-right) */}
      <mesh position={[r * 0.26, -r * 0.3, r * 0.84]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[r * 0.13, 10, 10]} />
        <meshBasicMaterial color={highlightColor} />
      </mesh>
    </>
  );
};

export const KawaiiEyes: React.FC<KawaiiEyesProps> = ({
  position = [0, 0.06, 0.62],
  spacing = 0.52,
  size = 0.26,
  irisColor = '#4A3B32',
  pupilColor = '#1B1815',
  highlightColor = '#FFFFFF',
  tilt = 0.2,
  blink = true,
  gaze = [0, 0],
  blinkSeed = 0,
}) => {
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);

  const nextBlink = useRef(2.4 + blinkSeed * 0.7 + Math.random() * 2.5);
  const blinkPhase = useRef(0);

  useFrame((_, delta) => {
    if (!blink) return;
    const groups = [eyeL.current, eyeR.current];

    if (blinkPhase.current > 0) {
      blinkPhase.current += delta;
      if (blinkPhase.current >= 0.38) {
        blinkPhase.current = 0;
        nextBlink.current = 2.4 + Math.random() * 4.2;
      }
    } else {
      nextBlink.current -= delta;
      if (nextBlink.current <= 0) blinkPhase.current = 0.0001;
    }

    let sy = 1;
    if (blinkPhase.current > 0) {
      const p = Math.min(blinkPhase.current / 0.38, 1);
      sy = Math.max(0.12, Math.abs(Math.cos(p * Math.PI)));
    }
    for (const g of groups) {
      if (g) g.scale.y = sy;
    }
  });

  return (
    <group position={position}>
      <group ref={eyeL} position={[-spacing / 2, 0, 0]} rotation={[0, -tilt, 0]}>
        <SingleEye
          size={size}
          irisColor={irisColor}
          pupilColor={pupilColor}
          highlightColor={highlightColor}
          gaze={gaze}
        />
      </group>
      <group ref={eyeR} position={[spacing / 2, 0, 0]} rotation={[0, tilt, 0]}>
        <SingleEye
          size={size}
          irisColor={irisColor}
          pupilColor={pupilColor}
          highlightColor={highlightColor}
          gaze={gaze}
        />
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// KawaiiBlush — soft pastel cheek glow.
// ─────────────────────────────────────────────────────────────
export const KawaiiBlush: React.FC<{
  position: [number, number, number];
  size?: number;
  rotationY?: number;
  opacity?: number;
  color?: string;
}> = ({ position, size = 0.26, rotationY = 0, opacity = 0.8, color = 'rgba(255, 130, 160, 0.65)' }) => {
  const tex = React.useMemo(() => createBlushTexture(color), [color]);
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} renderOrder={2}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={opacity}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};
