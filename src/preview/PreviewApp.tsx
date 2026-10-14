import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { REWARDS } from '../config/rewards';
import { RARITY_CONFIGS } from '../config/rarity';
import type { RarityType } from '../types/rarity';
import {
  CHARACTER_SOURCE_FILES,
  CharacterRenderer,
} from '../components/3d/characters/CharacterRenderer';
import { SoftShadow } from '../components/3d/SoftShadow';

/**
 * ─────────────────────────────────────────────────────────────
 *  Trang xem trước TẤT CẢ model 3D (chỉ khi phát triển).
 *  Xoay bằng cách kéo chuột, lăn chuột để zoom, ← → để đổi model.
 * ─────────────────────────────────────────────────────────────
 */

const PREVIEW_SCALE = 1.55;

/** Camera quay quanh model theo góc kéo chuột. */
const OrbitCamera: React.FC<{ yaw: number; pitch: number; distance: number }> = ({
  yaw,
  pitch,
  distance,
}) => {
  const { camera, size } = useThree();

  useEffect(() => {
    const targetY = 0.85;
    const d = distance * (size.height < 640 ? 1.25 : 1);
    camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * d,
      targetY + Math.sin(pitch) * d,
      Math.cos(yaw) * Math.cos(pitch) * d
    );
    camera.lookAt(0, targetY, 0);
  }, [camera, yaw, pitch, distance, size.height]);

  return null;
};

/** Model đang chọn + tự xoay + đọc kích thước thật (bounding box). */
const ModelStage: React.FC<{
  characterType: string;
  autoRotate: boolean;
  onMetrics: (m: { minY: number; maxY: number; height: number; width: number }) => void;
}> = ({ characterType, autoRotate, onMetrics }) => {
  const spinRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (spinRef.current && autoRotate) {
      spinRef.current.rotation.y += delta * 0.6;
    }
  });

  // Đo model sau khi mount (không phụ thuộc vòng render để luôn có số liệu)
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const g = boxRef.current;
      if (!g || cancelled) return;
      const box = new THREE.Box3().setFromObject(g);
      if (!Number.isFinite(box.min.y) || !Number.isFinite(box.max.y)) return;
      onMetrics({
        minY: box.min.y,
        maxY: box.max.y,
        height: box.max.y - box.min.y,
        width: box.max.x - box.min.x,
      });
    };

    const first = window.setTimeout(measure, 150);
    const second = window.setTimeout(measure, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [characterType, onMetrics]);

  return (
    <group ref={spinRef}>
      <group ref={boxRef}>
        <CharacterRenderer characterType={characterType} scale={PREVIEW_SCALE} interactive />
      </group>
    </group>
  );
};

export const PreviewApp: React.FC = () => {
  const models = useMemo(
    () =>
      (['normal', 'rare', 'epic', 'secret'] as RarityType[]).flatMap((rarity) =>
        REWARDS.filter((r) => r.rarity === rarity)
      ),
    []
  );

  const [index, setIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [yaw, setYaw] = useState(0.5);
  const [pitch, setPitch] = useState(0.22);
  const [distance, setDistance] = useState(4.4);
  const [metrics, setMetrics] = useState({ minY: 0, maxY: 0, height: 0, width: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  const current = models[index];
  const rarity = RARITY_CONFIGS[current.rarity];

  // Phím tắt: ← → đổi model, space bật/tắt tự xoay, R đặt lại góc nhìn
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % models.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + models.length) % models.length);
      if (e.code === 'Space') {
        e.preventDefault();
        setAutoRotate((v) => !v);
      }
      if (e.key === 'r' || e.key === 'R') {
        setYaw(0.5);
        setPitch(0.22);
        setDistance(4.4);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [models.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setYaw((v) => v - dx * 0.008);
    setPitch((v) => Math.max(-0.5, Math.min(1.2, v + dy * 0.006)));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const btn =
    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border';

  return (
    <div className="flex h-screen w-screen font-sans">
      {/* ── Danh sách 15 model ── */}
      <aside className="w-64 shrink-0 h-full overflow-y-auto bg-white/80 backdrop-blur border-r border-pink-200 p-3">
        <h1 className="text-sm font-bold text-rose-800 mb-1">Xem trước model 3D</h1>
        <p className="text-[11px] text-gray-500 mb-3">
          {models.length} nhân vật · kéo chuột để xoay · ← → để đổi
        </p>

        {(['normal', 'rare', 'epic', 'secret'] as RarityType[]).map((group) => (
          <div key={group} className="mb-3">
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: RARITY_CONFIGS[group].badgeBg }}
            >
              {RARITY_CONFIGS[group].vietnameseName}
            </div>
            <div className="flex flex-col gap-1">
              {models.map((m, i) =>
                m.rarity !== group ? null : (
                  <button
                    key={m.id}
                    onClick={() => setIndex(i)}
                    className={`text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                      i === index
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-pink-50 hover:bg-pink-100 text-gray-700'
                    }`}
                  >
                    <span className="text-base leading-none">{m.sparkleEmoji}</span>
                    <span className="truncate">{m.vietnameseName.replace(/\s*\(Secret\)\s*$/i, '')}</span>
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </aside>

      {/* ── Khung xem ── */}
      <main className="relative flex-1 min-w-0">
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={(e) => setDistance((d) => Math.max(2.2, Math.min(9, d + e.deltaY * 0.002)))}
        >
          <Canvas
            shadows="percentage"
            dpr={[1, 2]}
            camera={{ position: [2, 2, 4], fov: 42, near: 0.1, far: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <OrbitCamera yaw={yaw} pitch={pitch} distance={distance} />

            <hemisphereLight intensity={0.6} color="#FFF3F8" groundColor="#C4E8C8" />
            <ambientLight intensity={0.4} color="#FFF0F5" />
            <directionalLight
              position={[4, 8, 5]}
              intensity={1.8}
              color="#FFF8E7"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-left={-4}
              shadow-camera-right={4}
              shadow-camera-top={4}
              shadow-camera-bottom={-4}
            />
            <directionalLight position={[-5, 4, -4]} intensity={0.6} color="#E9D4F5" />
            <directionalLight position={[0.5, 4, -7]} intensity={0.85} color="#FFD9E8" />

            {/* Mặt cỏ để thấy chân có chạm đất không */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[6, 64]} />
              <meshStandardMaterial color="#A9E3B8" roughness={0.82} />
            </mesh>

            <SoftShadow radius={0.9 * PREVIEW_SCALE} opacity={0.32} position={[0, 0.006, 0]} />

            <ModelStage
              characterType={current.characterType}
              autoRotate={autoRotate}
              onMetrics={setMetrics}
            />
          </Canvas>
        </div>

        {/* Thông tin model đang xem */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2">
          <div className="px-3 py-2 rounded-2xl bg-white/90 backdrop-blur border border-pink-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{current.sparkleEmoji}</span>
              <span className="text-sm font-bold text-gray-800">{current.vietnameseName}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full"
                style={{ backgroundColor: rarity.badgeBg }}
              >
                {rarity.vietnameseName}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
              {current.characterType} · {CHARACTER_SOURCE_FILES[current.characterType] ?? '—'}
            </div>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-white/90 backdrop-blur border border-pink-200 shadow-sm text-[11px] font-mono text-gray-600">
            <div>
              chân (minY): <b className={metrics.minY < -0.05 ? 'text-rose-600' : 'text-emerald-600'}>
                {metrics.minY.toFixed(3)}
              </b>
            </div>
            <div>
              đầu (maxY): <b>{metrics.maxY.toFixed(3)}</b> · cao {metrics.height.toFixed(2)} · rộng{' '}
              {metrics.width.toFixed(2)}
            </div>
            <div className="text-gray-400">cỏ ở y = 0 · tự canh chân khi mount</div>
          </div>
        </div>

        {/* Nút điều khiển */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-white/90 backdrop-blur border border-pink-200 shadow-sm">
          <button
            onClick={() => setIndex((i) => (i - 1 + models.length) % models.length)}
            className={`${btn} border-pink-200 bg-pink-50 hover:bg-pink-100 text-rose-700`}
          >
            ← Trước
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % models.length)}
            className={`${btn} border-pink-200 bg-pink-50 hover:bg-pink-100 text-rose-700`}
          >
            Sau →
          </button>
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`${btn} ${
              autoRotate
                ? 'border-rose-300 bg-rose-500 text-white'
                : 'border-pink-200 bg-pink-50 text-rose-700'
            }`}
          >
            {autoRotate ? 'Đang tự xoay' : 'Tự xoay: tắt'}
          </button>
          <button
            onClick={() => setDistance((d) => Math.max(2.2, d - 0.6))}
            className={`${btn} border-pink-200 bg-pink-50 hover:bg-pink-100 text-rose-700`}
          >
            Zoom +
          </button>
          <button
            onClick={() => setDistance((d) => Math.min(9, d + 0.6))}
            className={`${btn} border-pink-200 bg-pink-50 hover:bg-pink-100 text-rose-700`}
          >
            Zoom −
          </button>
          <button
            onClick={() => {
              setYaw(0.5);
              setPitch(0.22);
              setDistance(4.4);
            }}
            className={`${btn} border-pink-200 bg-pink-50 hover:bg-pink-100 text-rose-700`}
          >
            Góc nhìn gốc
          </button>
          <button
            onClick={() => setPitch(0)}
            className={`${btn} border-slate-200 bg-slate-50 hover:bg-slate-100 text-gray-700`}
          >
            Ngang tầm mắt
          </button>
        </div>

        <div className="absolute bottom-3 right-3 text-[11px] text-gray-500 bg-white/80 rounded-xl px-2.5 py-1.5 border border-pink-200">
          Chỉ chạy khi dev · không có trong bản deploy
        </div>
      </main>
    </div>
  );
};
