import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { audioEngine } from '../../utils/audioEngine';
import {
  CARD_COMPACT_DEFAULT,
  CARD_EXPANDED_VIEW,
  getCardReadLayout,
  getCompactCardView,
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
}

const CARD_W = 1.42;
const CARD_H = 1.96;
const CARD_T = 0.045;
const STAND_Y = -1.22;

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

/** Cánh hoa / sao nhỏ bay quanh tấm thiệp (chỉ ở chế độ thu gọn). */
const CardSparkles: React.FC<{ active: boolean }> = ({ active }) => {
  const groupRef = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        angle: (i / 16) * Math.PI * 2,
        radius: 1.25 + Math.random() * 0.5,
        height: (Math.random() - 0.5) * 2.0,
        speed: 0.25 + Math.random() * 0.45,
        size: 0.5 + Math.random() * 0.9,
        color: ['#FFC1CC', '#FFF0F5', '#FFE082', '#FFFFFF', '#FFAAA6'][i % 5],
      })),
    []
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
            opacity={0.9}
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
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);
  const standRef = useRef<THREE.Group>(null);
  const coverPivotRef = useRef<THREE.Group>(null);

  // Tỉ lệ màn hình quyết định vị trí/kích thước thiệp sao cho không tràn mép
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const targetView = mode === 'expanded' ? CARD_EXPANDED_VIEW : getCompactCardView(aspect);

  // Màn hình hẹp: chỉ đọc trang thư nên bìa gấp hẳn ra sau cho gọn khung hình
  const readLayout = useMemo(() => getCardReadLayout(aspect), [aspect]);
  const hingeAngle = readLayout.coverOpenAngle;

  const pageCanvas = useRef<HTMLCanvasElement | null>(null);
  const companionCanvas = useRef<HTMLCanvasElement | null>(null);
  const coverCanvas = useRef<HTMLCanvasElement | null>(null);

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
    if (ctx) drawLetterPage(ctx, data, 0);

    let cancelled = false;
    let portraitImg: HTMLImageElement | null = null;
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

    whenFontsReady().then(() => {
      if (cancelled) return;
      if (ctx) drawLetterPage(ctx, data, revealRef.current);
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
        drawLetterPage(ctx, data, next);
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
    drawLetterPage(ctx, data, chars);
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

  // ── Nhấp nhẹ khi ở chế độ thu gọn (tắt khi mở rộng để dễ đọc) ──
  useFrame((state) => {
    if (mode === 'expanded' || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (floatRef.current) {
      floatRef.current.position.y = Math.sin(t * 1.25) * 0.02;
      floatRef.current.rotation.z = Math.sin(t * 0.9) * 0.006;
    }
  });

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
          <mesh castShadow receiveShadow material={paperMat}>
            <boxGeometry args={[CARD_W, CARD_H, CARD_T]} />
          </mesh>
          {/* Viền vàng mảnh, nhô nhẹ khỏi mặt giấy */}
          <mesh position={[0, 0, CARD_T / 2 + 0.004]}>
            <boxGeometry args={[CARD_W - 0.06, CARD_H - 0.06, 0.005]} />
            <meshStandardMaterial color="#DDBA72" metalness={0.4} roughness={0.4} />
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
            <mesh castShadow receiveShadow material={coverMat}>
              <boxGeometry args={[CARD_W, CARD_H, CARD_T]} />
            </mesh>

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

            {/* Hoa nổi — chỉ ở bốn góc bìa */}
            <TinyFlower position={[-CARD_W / 2 + 0.13, CARD_H / 2 - 0.15, CARD_T / 2 + 0.03]} scale={1.4} petal="#FFFFFF" />
            <TinyFlower position={[CARD_W / 2 - 0.13, CARD_H / 2 - 0.15, CARD_T / 2 + 0.03]} scale={1.2} petal="#F9C4D2" />
            <TinyFlower position={[-CARD_W / 2 + 0.13, -CARD_H / 2 + 0.15, CARD_T / 2 + 0.03]} scale={1.2} petal="#F9C4D2" />
            <TinyFlower position={[CARD_W / 2 - 0.13, -CARD_H / 2 + 0.15, CARD_T / 2 + 0.03]} scale={1.4} petal="#FFFFFF" />

            {/* Con dấu sáp trên bìa */}
            <group position={[0, -CARD_H / 2 + 0.1, CARD_T / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh scale={[0.075, 0.02, 0.075]}>
                <cylinderGeometry args={[1, 1, 1, 24]} />
                <meshStandardMaterial color="#D6526A" roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Gáy vàng */}
        <mesh castShadow>
          <boxGeometry args={[0.035, CARD_H, CARD_T + 0.012]} />
          <meshStandardMaterial color="#D9A94F" metalness={0.5} roughness={0.35} />
        </mesh>

        <CardSparkles active={mode === 'compact'} />

        {/* Ánh sáng phụ rất nhẹ — không chiếu lên mặt chữ (mặt chữ không nhận sáng) */}
        <pointLight
          position={[0, 0.5, 1.1]}
          intensity={mode === 'expanded' ? 0.12 : 0.45}
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
  onToggleOpen: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onExport: () => void;
  onReplay: () => void;
  onSkip: () => void;
  onRestart: () => void;
}

export const GreetingCardOverlay: React.FC<GreetingCardOverlayProps> = ({
  displayName,
  companionName,
  rarityLabel,
  isOpen,
  isExpanded,
  isExporting = false,
  onToggleOpen,
  onExpand,
  onCollapse,
  onExport,
  onReplay,
  onSkip,
  onRestart,
}) => {
  // Nút gọn hơn trên điện thoại để không che thiệp
  const btn =
    'px-2.5 py-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 select-none whitespace-nowrap';

  return (
    <div
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
          ? `Đang đọc thiệp dành cho ${displayName} • bấm "Đóng" để quay lại`
          : `Món quà của ${displayName}: ${companionName} • bấm "Đọc thiệp" để xem rõ hơn`}
      </p>
    </div>
  );
};
