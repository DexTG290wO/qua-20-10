import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { audioEngine } from '../../utils/audioEngine';
import {
  CAMERA_FOV_DEG,
  CARD_COMPACT_DEFAULT,
  CARD_EXPANDED_VIEW,
  getCardReadLayout,
  getCompactCardView,
  getReadInsets,
  type CardPage,
} from '../../utils/layout';
import {
  CARD_PAGE_HEIGHT,
  CARD_PAGE_WIDTH,
  drawCompanionPage,
  drawCoverPanel,
  drawLetterPage,
  whenFontsReady,
  loadImage,
  type CardTextData,
} from '../../utils/cardRenderer';

// ─────────────────────────────────────────
// 3D Card Mesh — must be rendered INSIDE R3F Canvas
// ─────────────────────────────────────────

export type CardMode = 'compact' | 'expanded';

interface GreetingCard3DProps {
  isOpen: boolean;
  mode: CardMode;
  data: CardTextData;
  onToggleOpen: () => void;
  reducedMotion?: boolean;
  /** Tăng giá trị này để hiện ngay toàn bộ chữ. */
  skipToken?: number;
  /** Tăng giá trị này để chạy lại hiệu ứng gõ chữ. */
  replayToken?: number;
  /** Chiều cao thật của thanh công cụ (px) để chừa chỗ chính xác trên điện thoại. */
  toolbarHeightPx?: number;
}

const CARD_W = 1.42;
const CARD_H = 1.96;
const CARD_T = 0.045;
const CARD_CORNER_R = 0.052; // bán kính bo góc của tấm thiệp
const STAND_Y = -1.22;

/**
 * Tấm thiệp có độ dày thật + bốn góc bo mềm (ExtrudeGeometry của
 * hình chữ nhật bo góc). Nhờ vậy thiệp trông như một vật thể giấy
 * thật thay vì một mặt phẳng dán vào scene.
 */
function createRoundedPanelGeometry(w: number, h: number, t: number, r: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: t,
    bevelEnabled: false,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -t / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Texture bóng mềm phía sau thiệp (một blob gradient dùng lại cho mọi lần vẽ). */
let cachedCardShadowTexture: THREE.CanvasTexture | null = null;
function getCardShadowTexture(): THREE.CanvasTexture | null {
  if (cachedCardShadowTexture) return cachedCardShadowTexture;
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(84, 32, 50, 0.6)');
  g.addColorStop(0.5, 'rgba(84, 32, 50, 0.3)');
  g.addColorStop(0.78, 'rgba(84, 32, 50, 0.1)');
  g.addColorStop(1, 'rgba(84, 32, 50, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedCardShadowTexture = tex;
  return tex;
}

/** Bông hoa 3D nhỏ gắn nổi trên bìa thiệp (chỉ ở bốn góc). */
const TinyFlower: React.FC<{
  position: [number, number, number];
  scale?: number;
  petal?: string;
  core?: string;
}> = ({ position, scale = 1, petal = '#FFFFFF', core = '#FFD97A' }) => (
  <group position={position} scale={scale}>
    {Array.from({ length: 5 }).map((_, i) => {
      const a = (i * Math.PI * 2) / 5;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.035, Math.sin(a) * 0.035, 0]} scale={[0.03, 0.02, 0.014]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color={petal} roughness={0.5} />
        </mesh>
      );
    })}
    <mesh position={[0, 0, 0.012]} scale={0.018}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial color={core} roughness={0.45} />
    </mesh>
  </group>
);

/**
 * Bốn bông hoa nhỏ gắn nổi ở bốn góc bìa thiệp, khẽ đung đưa.
 * Chuyển động rất nhẹ để không làm phiền khi đọc.
 */
const CornerFlowers: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  const ref = useRef<THREE.Group>(null);
  const flowers = useMemo(
    () => [
      { position: [-CARD_W / 2 + 0.13, CARD_H / 2 - 0.15, CARD_T / 2 + 0.03] as [number, number, number], scale: 1.4, petal: '#FFFFFF' },
      { position: [CARD_W / 2 - 0.13, CARD_H / 2 - 0.15, CARD_T / 2 + 0.03] as [number, number, number], scale: 1.2, petal: '#F9C4D2' },
      { position: [-CARD_W / 2 + 0.13, -CARD_H / 2 + 0.15, CARD_T / 2 + 0.03] as [number, number, number], scale: 1.2, petal: '#F9C4D2' },
      { position: [CARD_W / 2 - 0.13, -CARD_H / 2 + 0.15, CARD_T / 2 + 0.03] as [number, number, number], scale: 1.4, petal: '#FFFFFF' },
    ],
    []
  );

  useFrame((state) => {
    const g = ref.current;
    if (!g || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    g.children.forEach((child, i) => {
      const base = (child.userData.baseScale as number) ?? 1;
      child.rotation.z = Math.sin(t * 0.9 + i * 1.6) * 0.08;
      child.scale.setScalar(base * (1 + Math.sin(t * 1.5 + i * 1.1) * 0.035));
    });
  });

  return (
    <group ref={ref}>
      {flowers.map((f, i) => (
        <group key={i} position={f.position} scale={f.scale} userData={{ baseScale: f.scale }}>
          <TinyFlower position={[0, 0, 0]} scale={1} petal={f.petal} />
        </group>
      ))}
    </group>
  );
};

/**
 * Cánh hoa / sao nhỏ bay quanh tấm thiệp.
 * Khi mở rộng để đọc, số lượng và độ sáng đều giảm để chữ luôn là tâm điểm.
 */
const CardSparkles: React.FC<{ active: boolean; count?: number; opacity?: number }> = ({
  active,
  count = 16,
  opacity = 0.9,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        angle: (i / count) * Math.PI * 2,
        radius: 1.25 + Math.random() * 0.5,
        height: (Math.random() - 0.5) * 2.0,
        speed: 0.25 + Math.random() * 0.45,
        size: 0.5 + Math.random() * 0.9,
        color: ['#FFC1CC', '#FFF0F5', '#FFE082', '#FFFFFF', '#FFAAA6'][i % 5],
      })),
    [count]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const it = items[i];
      if (!it) return;
      const a = it.angle + t * it.speed;
      child.position.set(
        Math.cos(a) * it.radius,
        it.height + Math.sin(t * it.speed * 2 + i) * 0.14,
        Math.sin(a) * it.radius * 0.6
      );
      child.rotation.y = a * 1.5;
      child.rotation.z = Math.sin(t + i) * 0.6;
      const s = it.size * (0.7 + Math.sin(t * 2.4 + i) * 0.25);
      child.scale.setScalar(s * 0.075);
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {items.map((it, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={it.color}
            emissive={it.color}
            emissiveIntensity={0.5}
            transparent
            opacity={opacity}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export const GreetingCard3D: React.FC<GreetingCard3DProps> = ({
  isOpen,
  mode,
  data,
  onToggleOpen,
  reducedMotion = false,
  skipToken = 0,
  replayToken = 0,
  toolbarHeightPx = 0,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);
  const standRef = useRef<THREE.Group>(null);
  const coverPivotRef = useRef<THREE.Group>(null);

  // Tỉ lệ màn hình quyết định vị trí/kích thước thiệp sao cho không tràn mép
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const targetView = mode === 'expanded' ? CARD_EXPANDED_VIEW : getCompactCardView(aspect);

  // Màn hình hẹp: chỉ đọc trang thư nên bìa gấp hẳn ra sau cho gọn khung hình.
  // Chiều cao thanh công cụ đo được (px) quyết định phần chừa phía dưới, nên
  // trang thư không bao giờ bị hàng nút che trên điện thoại.
  const readInsets = useMemo(
    () => getReadInsets(size.height, toolbarHeightPx),
    [size.height, toolbarHeightPx]
  );
  const readLayout = useMemo(
    () => getCardReadLayout(aspect, CAMERA_FOV_DEG, readInsets),
    [aspect, readInsets]
  );
  const hingeAngle = readLayout.coverOpenAngle;

  const pageCanvas = useRef<HTMLCanvasElement | null>(null);
  const companionCanvas = useRef<HTMLCanvasElement | null>(null);
  const coverCanvas = useRef<HTMLCanvasElement | null>(null);
  // Ảnh 2D của nhân vật (chụp từ model 3D) — nạp bất đồng bộ rồi vẽ lại trang thư
  const letterPictureRef = useRef<HTMLImageElement | null>(null);

  const [textures, setTextures] = useState<{
    page: THREE.CanvasTexture;
    companion: THREE.CanvasTexture;
    cover: THREE.CanvasTexture;
  } | null>(null);

  const revealRef = useRef(0);
  const firstRun = useRef(true);

  const totalChars = useMemo(() => {
    return (
      data.letter.greeting.length +
      data.letter.body.length +
      data.letter.signature.length +
      (data.letter.postscript?.length ?? 0) +
      20
    );
  }, [data]);

  // ── Canvas textures ───────────────────────────────────────
  useEffect(() => {
    const page = document.createElement('canvas');
    page.width = CARD_PAGE_WIDTH;
    page.height = CARD_PAGE_HEIGHT;
    const comp = document.createElement('canvas');
    comp.width = CARD_PAGE_WIDTH;
    comp.height = CARD_PAGE_HEIGHT;
    const cover = document.createElement('canvas');
    cover.width = CARD_PAGE_WIDTH;
    cover.height = CARD_PAGE_HEIGHT;

    pageCanvas.current = page;
    companionCanvas.current = comp;
    coverCanvas.current = cover;

    const pageTex = new THREE.CanvasTexture(page);
    const compTex = new THREE.CanvasTexture(comp);
    const coverTex = new THREE.CanvasTexture(cover);
    for (const tex of [pageTex, compTex, coverTex]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
    }

    const ctx = page.getContext('2d');
    const compCtx = comp.getContext('2d');
    const coverCtx = cover.getContext('2d');
    if (compCtx) drawCompanionPage(compCtx, data);
    if (coverCtx) drawCoverPanel(coverCtx, data);
    if (ctx) drawLetterPage(ctx, data, 0, null);

    let cancelled = false;
    let portraitImg: HTMLImageElement | null = null;
    letterPictureRef.current = null;
    const redrawCompanion = () => {
      if (cancelled || !compCtx) return;
      drawCompanionPage(compCtx, data, '#FDF1F4', portraitImg);
      compTex.needsUpdate = true;
    };

    if (data.portraitUrl) {
      loadImage(data.portraitUrl).then((img) => {
        portraitImg = img;
        redrawCompanion();
      });
    }

    // Ảnh nhân vật trên trang thư: vẽ lại ngay khi ảnh nạp xong
    if (data.companionImageUrl) {
      loadImage(data.companionImageUrl).then((img) => {
        if (cancelled || !img) return;
        letterPictureRef.current = img;
        if (ctx) {
          drawLetterPage(ctx, data, revealRef.current, img);
          pageTex.needsUpdate = true;
        }
      });
    }

    whenFontsReady().then(() => {
      if (cancelled) return;
      if (ctx) drawLetterPage(ctx, data, revealRef.current, letterPictureRef.current);
      redrawCompanion();
      if (coverCtx) drawCoverPanel(coverCtx, data);
      pageTex.needsUpdate = true;
      coverTex.needsUpdate = true;
    });

    setTextures({ page: pageTex, companion: compTex, cover: coverTex });

    return () => {
      cancelled = true;
      pageTex.dispose();
      compTex.dispose();
      coverTex.dispose();
    };
  }, [data]);

  // ── Chuyển giữa chế độ thu gọn ↔ mở rộng (cùng một nguồn animate) ──
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const view = targetView;
    const entering = firstRun.current && !reducedMotion;

    if (entering) {
      // Lần đầu: thiệp "rơi" nhẹ vào vị trí thu gọn
      root.position.set(view.position[0], view.position[1] + 0.85, view.position[2]);
      root.rotation.set(0, view.rotationY - 0.5, 0);
      root.scale.setScalar(view.scale * 0.8);
    }

    const duration = reducedMotion ? 0.01 : entering ? 1.05 : 0.95;
    const ease = entering ? 'back.out(1.3)' : 'power3.inOut';

    gsap.killTweensOf([root.position, root.rotation, root.scale]);
    gsap.to(root.position, { x: view.position[0], y: view.position[1], z: view.position[2], duration, ease });
    gsap.to(root.rotation, { x: 0, y: view.rotationY, z: 0, duration, ease });
    gsap.to(root.scale, { x: view.scale, y: view.scale, z: view.scale, duration, ease });

    if (standRef.current) {
      gsap.killTweensOf(standRef.current.scale);
      gsap.to(standRef.current.scale, {
        x: mode === 'expanded' ? 0.001 : 1,
        y: mode === 'expanded' ? 0.001 : 1,
        z: mode === 'expanded' ? 0.001 : 1,
        duration: reducedMotion ? 0.01 : 0.5,
        ease: 'power2.inOut',
      });
    }

    firstRun.current = false;
  }, [mode, reducedMotion, targetView.position[0], targetView.position[1], targetView.position[2], targetView.rotationY, targetView.scale]);

  // ── Hinge animation (real 3D rotation around the spine) ───
  useEffect(() => {
    const pivot = coverPivotRef.current;
    if (!pivot) return;

    const target = isOpen ? hingeAngle : 0;
    if (isOpen) audioEngine.playEnvelopeOpen();
    else audioEngine.playBoxShake();

    if (reducedMotion) {
      pivot.rotation.y = target;
      return;
    }

    gsap.killTweensOf(pivot.rotation);
    gsap.to(pivot.rotation, {
      y: target,
      duration: isOpen ? 1.15 : 0.7,
      ease: isOpen ? 'power3.inOut' : 'power2.inOut',
    });
  }, [isOpen, reducedMotion, hingeAngle]);

  // ── Typewriter reveal: từng cụm chữ hiện dần trên mặt thiệp ──
  useEffect(() => {
    if (!isOpen) return;
    if (revealRef.current >= totalChars) return;

    const step = Math.max(6, Math.round(totalChars / 34));
    const id = window.setInterval(() => {
      const next = Math.min(revealRef.current + step, totalChars);
      revealRef.current = next;

      const ctx = pageCanvas.current?.getContext('2d');
      if (ctx) {
        drawLetterPage(ctx, data, next, letterPictureRef.current);
        if (textures) textures.page.needsUpdate = true;
      }
      if (next >= totalChars) window.clearInterval(id);
    }, 95);

    return () => window.clearInterval(id);
  }, [isOpen, data, textures, totalChars]);

  // ── Hiện toàn bộ chữ / gõ lại ─────────────────────────────
  const redrawPage = (chars: number) => {
    revealRef.current = chars;
    const ctx = pageCanvas.current?.getContext('2d');
    if (!ctx) return;
    drawLetterPage(ctx, data, chars, letterPictureRef.current);
    if (textures) textures.page.needsUpdate = true;
  };

  useEffect(() => {
    if (skipToken > 0) redrawPage(totalChars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipToken]);

  useEffect(() => {
    if (replayToken > 0) redrawPage(reducedMotion ? totalChars : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayToken]);

  // ── Nhấp nhẹ khi rảnh (rất nhỏ khi mở rộng để không ảnh hưởng việc đọc) ──
  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (floatRef.current) {
      const expanded = mode === 'expanded';
      floatRef.current.position.y = Math.sin(t * 1.25) * (expanded ? 0.008 : 0.02);
      floatRef.current.rotation.z = Math.sin(t * 0.9) * (expanded ? 0.002 : 0.006);
    }
  });

  const panelGeometry = useMemo(
    () => createRoundedPanelGeometry(CARD_W, CARD_H, CARD_T, CARD_CORNER_R),
    []
  );
  useEffect(() => () => panelGeometry.dispose(), [panelGeometry]);

  const cardShadowTexture = useMemo(() => getCardShadowTexture(), []);

  const paperMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FBF3E4',
        roughness: 1,
        metalness: 0,
      }),
    []
  );
  const coverMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: data.themeColor,
        roughness: 1,
        metalness: 0,
      }),
    [data.themeColor]
  );

  return (
    <group
      ref={rootRef}
      position={CARD_COMPACT_DEFAULT.position}
      rotation={[0, CARD_COMPACT_DEFAULT.rotationY, 0]}
      scale={CARD_COMPACT_DEFAULT.scale}
    >
      {/* ── Giá đỡ nhỏ (ẩn khi mở rộng để chữ luôn là tâm điểm) ── */}
      <group ref={standRef} position={[0, STAND_Y, 0.05]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.48, 0.07, 28]} />
          <meshStandardMaterial color="#E7C8A0" roughness={0.75} metalness={0.05} />
        </mesh>
        <mesh position={[-0.3, 0.13, -0.32]} rotation={[0.32, 0, 0.16]} castShadow>
          <cylinderGeometry args={[0.026, 0.032, 0.22, 12]} />
          <meshStandardMaterial color="#D9B287" roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0.3, 0.13, -0.32]} rotation={[0.32, 0, -0.16]} castShadow>
          <cylinderGeometry args={[0.026, 0.032, 0.22, 12]} />
          <meshStandardMaterial color="#D9B287" roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.2, 0.1]} rotation={[1.25, 0, 0]} castShadow>
          <boxGeometry args={[1.34, 0.08, 0.05]} />
          <meshStandardMaterial color="#D9B287" roughness={0.7} metalness={0.05} />
        </mesh>
      </group>

      <group ref={floatRef} onClick={onToggleOpen}>
        {/* ── TRANG THƯ (bên phải) ── */}
        <group position={[CARD_W / 2, 0, 0]}>
          <mesh geometry={panelGeometry} castShadow receiveShadow material={paperMat} />
          {/* Viền vàng mảnh, nhô nhẹ khỏi mặt giấy (không còn khung đôi dày) */}
          <mesh position={[0, 0, CARD_T / 2 + 0.004]}>
            <boxGeometry args={[CARD_W - 0.078, CARD_H - 0.078, 0.005]} />
            <meshStandardMaterial color="#DFC07C" metalness={0.35} roughness={0.45} />
          </mesh>
          {/* Mặt chữ: vật liệu không nhận sáng để chữ không bao giờ bị cháy sáng */}
          {textures && (
            <mesh position={[0, 0, CARD_T / 2 + 0.008]}>
              <planeGeometry args={[CARD_W - 0.11, CARD_H - 0.11]} />
              <meshBasicMaterial map={textures.page} toneMapped={false} />
            </mesh>
          )}
        </group>

        {/* ── BÌA (xoay quanh gáy thật) ── */}
        <group ref={coverPivotRef}>
          <group position={[CARD_W / 2, 0, 0]}>
            <mesh geometry={panelGeometry} castShadow receiveShadow material={coverMat} />

            {/* Mặt bìa ngoài */}
            {textures && (
              <mesh position={[0, 0, CARD_T / 2 + 0.008]}>
                <planeGeometry args={[CARD_W - 0.06, CARD_H - 0.06]} />
                <meshBasicMaterial map={textures.cover} toneMapped={false} />
              </mesh>
            )}

            {/* Mặt trong của bìa (trang người bạn đồng hành) */}
            <mesh position={[0, 0, -CARD_T / 2 - 0.004]} rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[CARD_W - 0.06, CARD_H - 0.06, 0.005]} />
              <meshStandardMaterial color="#F3E4CE" roughness={0.95} metalness={0} />
            </mesh>
            {textures && (
              <mesh position={[0, 0, -CARD_T / 2 - 0.008]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[CARD_W - 0.11, CARD_H - 0.11]} />
                <meshBasicMaterial map={textures.companion} toneMapped={false} />
              </mesh>
            )}

            {/* Hoa nổi — chỉ ở bốn góc bìa, khẽ đung đưa */}
            <CornerFlowers reducedMotion={reducedMotion} />

            {/* Con dấu sáp trên bìa */}
            <group position={[0, -CARD_H / 2 + 0.1, CARD_T / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh scale={[0.075, 0.02, 0.075]}>
                <cylinderGeometry args={[1, 1, 1, 24]} />
                <meshStandardMaterial color="#D6526A" roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Bóng mềm phía sau thiệp — tách thiệp khỏi nền vườn hoa */}
        {cardShadowTexture && (
          <mesh position={[CARD_W / 2, -0.05, -0.075]} scale={[1, 1, 1]}>
            <planeGeometry args={[CARD_W * 1.5, CARD_H * 1.34]} />
            <meshBasicMaterial
              map={cardShadowTexture}
              transparent
              opacity={mode === 'expanded' ? 0.3 : 0.24}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}

        {/* Gáy vàng */}
        <mesh castShadow>
          <boxGeometry args={[0.035, CARD_H, CARD_T + 0.012]} />
          <meshStandardMaterial color="#D9A94F" metalness={0.5} roughness={0.35} />
        </mesh>

        <CardSparkles
          active
          count={mode === 'expanded' ? 8 : 16}
          opacity={mode === 'expanded' ? 0.45 : 0.9}
        />

        {/* Ánh sáng phụ rất nhẹ — không chiếu lên mặt chữ (mặt chữ không nhận sáng) */}
        <pointLight
          position={[0, 0.5, 1.1]}
          intensity={mode === 'expanded' ? 0.16 : 0.45}
          color="#FFEFE4"
          distance={4}
          decay={1.6}
        />
      </group>
    </group>
  );
};

// ─────────────────────────────────────────
// HTML Overlay toolbar — rendered OUTSIDE the R3F Canvas.
// Kept deliberately small so it never hides the 3D card or the
// reward character behind it.
// ─────────────────────────────────────────
interface GreetingCardOverlayProps {
  displayName: string;
  companionName: string;
  rarityLabel: string;
  isOpen: boolean;
  isExpanded: boolean;
  isExporting?: boolean;
  /** Trang đang xem trên màn hình hẹp. */
  page?: CardPage;
  /** Chỉ hiện nút chuyển trang khi màn hình không đủ rộng cho cả hai trang. */
  showPageToggle?: boolean;
  onTogglePage?: () => void;
  onToggleOpen: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onExport: () => void;
  onReplay: () => void;
  onSkip: () => void;
  onRestart: () => void;
  /** Báo chiều cao thật của thanh công cụ để thiệp 3D chừa đúng chỗ. */
  onToolbarHeightChange?: (px: number) => void;
}

export const GreetingCardOverlay: React.FC<GreetingCardOverlayProps> = ({
  displayName,
  companionName,
  rarityLabel,
  isOpen,
  isExpanded,
  isExporting = false,
  page = 'letter',
  showPageToggle = false,
  onTogglePage,
  onToggleOpen,
  onExpand,
  onCollapse,
  onExport,
  onReplay,
  onSkip,
  onRestart,
  onToolbarHeightChange,
}) => {
  // Nút gọn hơn trên điện thoại để không che thiệp
  const btn =
    'px-2.5 py-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 select-none whitespace-nowrap';

  const barRef = useRef<HTMLDivElement>(null);

  // Hàng nút có thể xuống 2–3 hàng trên điện thoại: đo chiều cao thật
  // (kèm safe-area) để thiệp 3D luôn nằm phía trên thanh công cụ.
  useEffect(() => {
    const el = barRef.current;
    if (!el || !onToolbarHeightChange) return;
    const report = () => onToolbarHeightChange(el.getBoundingClientRect().height);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    window.addEventListener('resize', report);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', report);
    };
  }, [onToolbarHeightChange, isExpanded, showPageToggle]);

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-1.5 px-2 sm:gap-2 sm:p-3 pointer-events-none"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200 shadow-lg shadow-pink-300/20 max-w-full">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 pl-1 pr-2 border-r border-pink-200">
          💌 {displayName}
          <span className="text-[10px] font-medium text-pink-500">· {rarityLabel}</span>
        </span>

        {!isExpanded && (
          <button
            onClick={onExpand}
            className={`${btn} bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm hover:opacity-90`}
          >
            Đọc thiệp 🔍
          </button>
        )}

        {isExpanded && (
          <>
            {showPageToggle && onTogglePage && (
              <button onClick={onTogglePage} className={`${btn} bg-pink-100 hover:bg-pink-200 text-pink-700`}>
                {page === 'portrait' ? 'Xem thư 💌' : 'Xem chân dung 🖼'}
              </button>
            )}
            <button onClick={onSkip} className={`${btn} bg-pink-100 hover:bg-pink-200 text-pink-700`}>
              <span className="sm:hidden">Toàn bộ</span>
              <span className="hidden sm:inline">Hiện toàn bộ</span>
            </button>
            <button onClick={onReplay} className={`${btn} bg-pink-100 hover:bg-pink-200 text-pink-700`}>
              Đọc lại
            </button>
            <button onClick={onToggleOpen} className={`${btn} bg-slate-100 hover:bg-slate-200 text-gray-700`}>
              {isOpen ? (
                <>
                  <span className="sm:hidden">Gấp</span>
                  <span className="hidden sm:inline">Gấp thiệp lại</span>
                </>
              ) : (
                'Mở thiệp'
              )}
            </button>
            <button onClick={onCollapse} className={`${btn} bg-slate-800 hover:bg-slate-700 text-white`}>
              Đóng
            </button>
          </>
        )}

        <button
          onClick={onExport}
          disabled={isExporting}
          className={`${btn} bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm hover:opacity-90 disabled:opacity-60`}
        >
          {isExporting ? (
            'Đang lưu…'
          ) : (
            <>
              <span className="sm:hidden">Lưu 📥</span>
              <span className="hidden sm:inline">Lưu thiệp 📥</span>
            </>
          )}
        </button>
        <button onClick={onRestart} className={`${btn} bg-slate-100 hover:bg-slate-200 text-gray-700`}>
          <span className="sm:hidden">Tên khác</span>
          <span className="hidden sm:inline">Thử tên khác</span>
        </button>
      </div>

      {/* Gợi ý chỉ hiện trên màn hình đủ rộng để không che thiệp trên điện thoại */}
      <p className="pointer-events-none hidden sm:block text-[11px] font-medium text-rose-800/80 drop-shadow-sm text-center px-2">
        {isExpanded
          ? `Đang đọc ${page === 'portrait' ? 'trang chân dung' : 'trang thư'} dành cho ${displayName} • bấm "Đóng" để quay lại`
          : `Món quà của ${displayName}: ${companionName} • bấm "Đọc thiệp" để xem rõ hơn`}
      </p>
    </div>
  );
};
