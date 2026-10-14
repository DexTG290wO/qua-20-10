import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * ─────────────────────────────────────────────────────────────
 *  Bóng đổ mềm (contact shadow).
 *
 *  Thay cho các vòng ring cứng, một tấm phẳng có gradient toả tròn
 *  cho cảm giác nhân vật/hộp quà thật sự đứng trên thảm cỏ. Dùng
 *  chung một texture cho mọi đối tượng nên rất nhẹ.
 * ─────────────────────────────────────────────────────────────
 */

let cachedShadowTexture: THREE.CanvasTexture | null = null;

function getShadowTexture(): THREE.CanvasTexture | null {
  if (cachedShadowTexture) return cachedShadowTexture;
  if (typeof document === 'undefined') return null;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  // Lõi đậm (nơi tiếp xúc) rồi tan dần ra mép
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.32, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(0.62, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cachedShadowTexture = texture;
  return texture;
}

export interface SoftShadowProps {
  /** Bán kính vùng bóng (world units). */
  radius?: number;
  /** Độ đậm — để thấp (0.2–0.35) cho tự nhiên. */
  opacity?: number;
  /** Vị trí tâm bóng. */
  position?: [number, number, number];
  /** Màu bóng (mặc định nâu xanh của cỏ). */
  color?: string;
  /** Kéo dài theo một trục để hợp với thân dài (ví dụ Corgi, hải cẩu). */
  scale?: [number, number];
}

export const SoftShadow: React.FC<SoftShadowProps> = ({
  radius = 1,
  opacity = 0.3,
  position = [0, 0.008, 0],
  color = '#33503E',
  scale = [1, 1],
}) => {
  const texture = useMemo(() => getShadowTexture(), []);
  if (!texture) return null;

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[scale[0], scale[1], 1]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
};
