import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterRenderer } from './characters/CharacterRenderer';
import { SoftShadow } from './SoftShadow';

/**
 * ─────────────────────────────────────────────────────────────
 *  Chụp nhân vật 3D thành ẢNH 2D để in vào trang thư.
 *
 *  Cách hoạt động: một Canvas phụ (nằm ngoài màn hình, nền trong suốt)
 *  dựng đúng model nhân vật, tự đo bao lồi rồi canh camera vừa khung,
 *  sau đó gọi `toDataURL()` và báo ảnh lên cho App. Chụp xong thì
 *  component được gỡ để trả lại WebGL context.
 *
 *  Nhờ vậy trang thư luôn có hình nhân vật (2D), còn trong scene 3D
 *  nhân vật không còn đứng cạnh thiệp nữa.
 * ─────────────────────────────────────────────────────────────
 */

/** Kích thước ảnh chụp (px) — tỉ lệ dọc vừa với khung ảnh trên thiệp. */
export const CHARACTER_SNAPSHOT_WIDTH = 640;
export const CHARACTER_SNAPSHOT_HEIGHT = 760;

/** Góc nhìn hơi nghiêng cho ảnh có chiều sâu như ảnh chụp lưu niệm. */
const SNAP_YAW = 0.42;
const SNAP_PITCH = 0.19;
/** Hệ số chừa mép quanh nhân vật trong ảnh. */
const SNAP_PADDING = 1.22;

const SNAP_SCALE = 1.5;
/** Thời điểm chụp: model tự canh chân xong (xem CharacterRenderer). */
const SNAP_ATTEMPTS_MS = [1500, 2400];

const SnapshotTaker: React.FC<{
  characterType: string;
  onCapture: (dataUrl: string) => void;
}> = ({ characterType, onCapture }) => {
  const { gl, camera } = useThree();
  // Chỉ đo MODEL (không tính đĩa bóng mềm bên dưới) để ảnh không bị thu nhỏ.
  const modelRef = useRef<THREE.Group>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;

    /** Canh camera vừa bao lồi của model. Trả về false nếu chưa đo được. */
    const frame = (): boolean => {
      const model = modelRef.current;
      if (!model || doneRef.current) return false;

      const box = new THREE.Box3().setFromObject(model);
      if (box.isEmpty() || !Number.isFinite(box.min.y) || !Number.isFinite(box.max.y)) {
        return false;
      }

      const center = box.getCenter(new THREE.Vector3());
      const dims = box.getSize(new THREE.Vector3());
      const persp = camera as THREE.PerspectiveCamera;
      const tanHalfFov = Math.tan((persp.fov * Math.PI) / 180 / 2);
      const aspect = Math.max(0.2, persp.aspect);

      const distanceForHeight = dims.y / 2 / tanHalfFov;
      const distanceForWidth = dims.x / 2 / (tanHalfFov * aspect);
      const distance = Math.max(distanceForHeight, distanceForWidth) * SNAP_PADDING;

      const dir = new THREE.Vector3(
        Math.sin(SNAP_YAW),
        SNAP_PITCH,
        Math.cos(SNAP_YAW)
      ).normalize();
      persp.position.copy(center).addScaledVector(dir, distance);
      persp.lookAt(center);
      persp.updateMatrixWorld(true);
      return true;
    };

    const shoot = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      try {
        // Nền trong suốt: khung ảnh trên thiệp tự vẽ nền gradient phía sau.
        onCapture(gl.domElement.toDataURL('image/png'));
      } catch {
        // Bỏ qua — trang thư sẽ dùng hình hoa dự phòng (xem cardRenderer.ts)
      }
    };

    const timers = SNAP_ATTEMPTS_MS.map((delay) =>
      window.setTimeout(() => {
        if (!frame()) return;
        // Chờ 1 frame vẽ xong với camera mới rồi mới chụp
        window.setTimeout(shoot, 220);
      }, delay)
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [characterType, gl, camera, onCapture]);

  return (
    <group>
      <group ref={modelRef}>
        <CharacterRenderer characterType={characterType} scale={SNAP_SCALE} interactive={false} />
      </group>
      <SoftShadow radius={0.8} opacity={0.26} position={[0, 0.006, 0]} />
    </group>
  );
};

export const CharacterSnapshot: React.FC<{
  characterType: string;
  onCapture: (dataUrl: string) => void;
}> = ({ characterType, onCapture }) => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      left: -10000,
      top: 0,
      width: CHARACTER_SNAPSHOT_WIDTH,
      height: CHARACTER_SNAPSHOT_HEIGHT,
      pointerEvents: 'none',
      opacity: 0,
    }}
  >
    <Canvas
      dpr={1}
      shadows
      camera={{ position: [2.2, 1.7, 4.2], fov: 40, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <hemisphereLight intensity={0.6} color="#FFF3F8" groundColor="#C4E8C8" />
      <ambientLight intensity={0.4} color="#FFF0F5" />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.8}
        color="#FFF8E7"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 4, -4]} intensity={0.6} color="#E9D4F5" />
      <directionalLight position={[0.5, 4, -7]} intensity={0.85} color="#FFD9E8" />

      <SnapshotTaker characterType={characterType} onCapture={onCapture} />
    </Canvas>
  </div>
);
