import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { audioEngine } from '../../utils/audioEngine';
import { createFourPointStarGeometry, createPetalGeometry } from './ProceduralFlora';
import { GiftBow, RibbonBands } from './GiftBow';
import { SoftShadow } from './SoftShadow';
import type { ImpactSignal } from './SceneContainer';

interface GiftBox3DProps {
  onLanded?: () => void;
  onBoxClick?: (clickCount: number) => void;
  onOpened?: () => void;
  /** Khoá tương tác khi animation quan trọng đang chạy. */
  disabled?: boolean;
  /** Hộp quà trôi nhẹ sang bên để nhường sân khấu cho nhân vật / tấm thiệp. */
  docked?: boolean;
  reducedMotion?: boolean;
  /** Nhận tín hiệu va chạm để camera rung theo. */
  impactRef?: React.RefObject<ImpactSignal>;
}

const TOTAL_CLICKS = 4;

// ─────────────────────────────────────────────────────────────
//  Hoa giấy + sao bay ra từ trong hộp quà
// ─────────────────────────────────────────────────────────────
const MagicBurst: React.FC<{ power: number; reducedMotion?: boolean }> = ({
  power,
  reducedMotion = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const isBig = power >= TOTAL_CLICKS;
  const count = reducedMotion ? 14 : isBig ? 90 : 14 + power * 7;

  const petalGeom = useMemo(() => createPetalGeometry(0.24, 0.15, 0.06), []);
  const starGeom = useMemo(() => createFourPointStarGeometry(1, 0.3), []);

  // Hạt bay theo đường xoáy ốc: mỗi hạt có góc, bán kính và vận tốc riêng.
  // Khi mở hộp, một nửa số hạt vào "sóng 2" trễ hơn để hiệu ứng dày và có nhịp.
  const parts = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const isStar = i % 4 === 3;
        const delay = isBig && i % 2 === 1 ? 0.22 + Math.random() * 0.12 : 0;
        return {
          isStar,
          delay,
          angle: Math.random() * Math.PI * 2,
          radius: 0.05 + Math.random() * 0.08,
          radialSpeed: (isStar ? 1.25 : 0.6) * (0.7 + Math.random() * 0.9) * (isBig ? 1.55 : 1),
          angSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 2.4),
          y: 0.62 + Math.random() * 0.22,
          vy: 1.5 + Math.random() * (isBig ? 3.7 : 1.6),
          gravity: 4.4,
          spin: new THREE.Vector3(
            (Math.random() - 0.5) * 7,
            (Math.random() - 0.5) * 7,
            (Math.random() - 0.5) * 7
          ),
          twinkle: 2.5 + Math.random() * 3,
          scale: (isStar ? 0.11 : 0.6) * (0.7 + Math.random() * 0.7),
          color: isStar
            ? ['#FFF3C4', '#FFE082', '#FFFDE7', '#FFD1DC'][i % 4]
            : ['#FFC1CC', '#FFAAA6', '#FFF0F5', '#FFE0E9', '#FFD7B5'][i % 5],
        };
      }),
    [count, isBig]
  );

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;
    const group = groupRef.current;
    if (!group) return;

    meshRefs.current.forEach((mesh, i) => {
      const p = parts[i];
      if (!mesh) return;

      const local = t - p.delay;
      if (local <= 0) {
        mesh.visible = false;
        return;
      }

      // Bay xoáy ốc: bán kính tăng dần, góc quay chậm lại khi ra xa
      p.radius += p.radialSpeed * delta;
      p.angle += p.angSpeed * delta * (1 - Math.min(0.85, p.radius / 3.2));
      p.vy -= p.gravity * delta;
      p.y += p.vy * delta;

      mesh.visible = true;
      mesh.position.set(Math.cos(p.angle) * p.radius, p.y, Math.sin(p.angle) * p.radius);
      mesh.rotation.x += p.spin.x * delta;
      mesh.rotation.y += p.spin.y * delta;
      mesh.rotation.z += p.spin.z * delta;

      // Tan dần rồi mất hẳn; sao thì nhấp nháy
      const life = 1 - Math.max(0, (local - 1.0) / 1.6);
      const twinkle = p.isStar ? 0.75 + Math.sin(local * p.twinkle + i) * 0.35 : 1;
      mesh.scale.setScalar(Math.max(0.001, p.scale * life * twinkle));
    });

    // Ẩn nhóm sau khi hạt tàn để tiết kiệm draw call
    if (t > 3.4) group.visible = false;
  });

  return (
    <group ref={groupRef} position={[0, 0.75, 0]}>
      {parts.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshRefs.current[i] = m;
          }}
          geometry={p.isStar ? starGeom : petalGeom}
          scale={p.scale}
        >
          <meshStandardMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={p.isStar ? 1.0 : 0.25}
            roughness={0.35}
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
//  Sao lấp lánh bay lên liên tục từ miệng hộp sau khi đã mở
// ─────────────────────────────────────────────────────────────
const BoxSparkles: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const starGeom = useMemo(() => createFourPointStarGeometry(1, 0.3), []);

  const items = useMemo(() => {
    const total = reducedMotion ? 6 : 14;
    return Array.from({ length: total }).map((_, i) => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.12 + Math.random() * 0.42,
      speed: 0.5 + Math.random() * 0.45,
      rise: 0.85 + Math.random() * 1.05,
      size: 0.055 + Math.random() * 0.07,
      phase: (i / total) * 3.2,
      color: ['#FFF3C4', '#FFE082', '#FFFFFF', '#FFD1DC'][i % 4],
    }));
  }, [reducedMotion]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    group.children.forEach((child, i) => {
      const it = items[i];
      if (!it) return;
      const local = (t * it.speed + it.phase) % 3.2;
      const fadeIn = Math.min(1, local / 0.45);
      const fadeOut = local > 2.2 ? Math.max(0, 1 - (local - 2.2) / 1.0) : 1;
      const life = fadeIn * fadeOut;

      const a = it.angle + local * 0.85;
      child.position.set(
        Math.cos(a) * it.radius,
        0.86 + local * it.rise * 0.55,
        Math.sin(a) * it.radius
      );
      child.rotation.y = a * 1.4;
      child.rotation.z = Math.sin(t + i) * 0.5;
      child.scale.setScalar(
        it.size * life * (0.85 + Math.sin(t * 3 + i) * 0.2)
      );
    });
  });

  return (
    <group ref={groupRef}>
      {items.map((it, i) => (
        <mesh key={i} geometry={starGeom} scale={it.size}>
          <meshStandardMaterial
            color={it.color}
            emissive={it.color}
            emissiveIntensity={1.15}
            transparent
            opacity={0.92}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
export const GiftBox3D: React.FC<GiftBox3DProps> = ({
  onLanded,
  onBoxClick,
  onOpened,
  disabled = false,
  docked = false,
  reducedMotion = false,
  impactRef,
}) => {
  const dockRef = useRef<THREE.Group>(null);
  const fallRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);
  const lidPivotRef = useRef<THREE.Group>(null);
  const lidSecondaryRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const bowRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const magicCircleRef = useRef<THREE.Group>(null);

  // Va chạm chờ phát ra ở frame kế tiếp (để dùng chung đồng hồ với camera)
  const pendingImpact = useRef(0);
  const magicLevel = useRef(0);
  const [isOpened, setIsOpened] = useState(false);

  const phaseRef = useRef<'falling' | 'idle' | 'opening' | 'opened'>('falling');
  const clicksRef = useRef(0);
  const busyRef = useRef(false);
  const openedRef = useRef(false);

  const [burst, setBurst] = useState<{ power: number; key: number } | null>(null);

  // Các timeline đang chạy — huỷ khi unmount để tránh rò rỉ
  const timelines = useRef<gsap.core.Timeline[]>([]);
  const track = (tl: gsap.core.Timeline) => {
    timelines.current.push(tl);
    return tl;
  };
  useEffect(() => {
    const list = timelines.current;
    return () => {
      list.forEach((tl) => tl.kill());
      list.length = 0;
    };
  }, []);

  // ── 1. Hộp quà rơi xuống, nảy nhẹ rồi đáp xuống vườn ────────
  useEffect(() => {
    const fall = fallRef.current;
    if (!fall) return;

    if (reducedMotion) {
      fall.position.y = 0;
      phaseRef.current = 'idle';
      onLanded?.();
      return;
    }

    const tl = track(gsap.timeline());
    tl.fromTo(fall.position, { y: 17 }, { y: 0, duration: 1.35, ease: 'bounce.out' });
    tl.fromTo(
      fall.scale,
      { x: 1.14, y: 0.88, z: 1.14 },
      { x: 1, y: 1, z: 1, duration: 0.85, ease: 'elastic.out(1, 0.45)' },
      '<0.1'
    );
    tl.fromTo(fall.rotation, { y: -1.1 }, { y: 0, duration: 1.5, ease: 'power2.out' }, '<');

    // Vòng sáng ma thuật + sóng xung kích khi chạm đất
    tl.fromTo(
      shadowRef.current!.scale,
      { x: 0.4, y: 0.4, z: 0.4 },
      { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.out' },
      0.5
    );
    tl.fromTo(
      ringRef.current!.scale,
      { x: 0.5, y: 0.5, z: 0.5 },
      { x: 5.2, y: 5.2, z: 5.2, duration: 1.15, ease: 'power3.out' },
      0.5
    );
    tl.fromTo(
      (ringRef.current!.material as THREE.MeshBasicMaterial),
      { opacity: 0.9 },
      { opacity: 0, duration: 1.15, ease: 'power2.out' },
      0.5
    );
    tl.call(
      () => {
        audioEngine.playBoxDrop();
        setBurst({ power: 1, key: Date.now() });
        pendingImpact.current = 0.6;
      },
      undefined,
      0.52
    );

    // Chốt trạng thái "đã đáp" đúng lúc hộp quà dừng hẳn
    tl.call(
      () => {
        phaseRef.current = 'idle';
        onLanded?.();
      },
      undefined,
      1.36
    );

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // ── 2. Trôi nhẹ sang một bên khi nhường sân khấu ───────────
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const target = docked
      ? { x: 2.95, y: 0, z: -0.7, s: 0.72 }
      : { x: 0, y: 0, z: 0, s: 1 };
    const dur = reducedMotion ? 0.01 : 1.3;
    gsap.killTweensOf([dock.position, dock.scale]);
    gsap.to(dock.position, { x: target.x, y: target.y, z: target.z, duration: dur, ease: 'power3.inOut' });
    gsap.to(dock.scale, { x: target.s, y: target.s, z: target.s, duration: dur, ease: 'power3.inOut' });
  }, [docked, reducedMotion]);

  // ── 3. Nhấp vào hộp quà: mỗi lần một phản ứng mạnh dần ─────
  const playClickResponse = (n: number) => {
    const fall = fallRef.current;
    const bow = bowRef.current;
    const lid = lidSecondaryRef.current;
    const light = coreLightRef.current;
    if (!fall) return;

    busyRef.current = true;
    const intensity = 0.6 + n * 0.5;
    pendingImpact.current = 0.2 + n * 0.12;

    // Timeline chính: ngắn gọn (~0.4s) để người dùng có thể nhấp tiếp tự nhiên
    const tl = track(gsap.timeline({ onComplete: () => (busyRef.current = false) }));
    tl.to(fall.rotation, { z: 0.085 * intensity, duration: 0.07, ease: 'power2.out' })
      .to(fall.rotation, { z: -0.05 * intensity, duration: 0.08, yoyo: true, repeat: 2, ease: 'sine.inOut' })
      .to(fall.rotation, { z: 0, duration: 0.17, ease: 'power2.out' });
    tl.to(fall.position, { y: 0.07 * intensity, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out' }, 0);

    if (bow) {
      tl.to(bow.rotation, { z: 0.34 * intensity, duration: 0.09, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 0);
      tl.to(bow.position, { y: bow.position.y + 0.05 * intensity, duration: 0.1, yoyo: true, repeat: 1 }, 0);
    }
    // Biên độ phụ của nắp — nắp nảy theo thân hộp (secondary motion)
    if (lid) {
      tl.to(lid.rotation, { x: -0.05 * intensity, duration: 0.11, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 0.02);
    }
    if (bodyRef.current) {
      const mats = bodyRef.current.children
        .map((c) => (c as THREE.Mesh).material)
        .filter((m): m is THREE.MeshStandardMaterial => Boolean(m && 'emissiveIntensity' in m));
      // Tween qua đối tượng trung gian rồi áp vào material (GSAP không tween trực tiếp material 3D)
      const proxy = { v: mats.length > 0 ? mats[0].emissiveIntensity : 0 };
      tl.to(
        proxy,
        {
          v: 0.12 * n,
          duration: 0.28,
          ease: 'power2.out',
          onUpdate: () => {
            for (const m of mats) m.emissiveIntensity = proxy.v;
          },
        },
        0
      );
    }

    // Ánh sáng bùng lên độc lập (không kéo dài khoá tương tác)
    if (light) {
      gsap.to(light, {
        intensity: n >= 3 ? 3.6 : 1.8 * n,
        duration: 0.22,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(light, { intensity: n >= 3 ? 1.6 : 0, duration: 0.4 });
        },
      });
    }

    setBurst({ power: n, key: Date.now() });
  };

  // ── 4. Mở nắp: nắp xoay quanh bản lề thật ở cạnh sau ───────
  const playOpeningSequence = () => {
    const fall = fallRef.current;
    const lid = lidPivotRef.current;
    const bow = bowRef.current;
    const light = coreLightRef.current;
    if (!fall || !lid) return;

    phaseRef.current = 'opening';
    audioEngine.playBoxOpen();
    pendingImpact.current = 1.35;
    setBurst({ power: TOTAL_CLICKS, key: Date.now() });

    const tl = track(
      gsap.timeline({
        onComplete: () => {
          phaseRef.current = 'opened';
          openedRef.current = true;
          setIsOpened(true);
          onOpened?.();
        },
      })
    );

    // Lấy đà: hơi lún xuống rồi bật lên
    tl.to(fall.position, { y: -0.14, duration: 0.32, ease: 'power2.in' });
    tl.to(fall.scale, { x: 1.1, y: 0.9, z: 1.1, duration: 0.32, ease: 'power2.in' }, '<');
    tl.to(fall.position, { y: 0.42, duration: 0.85, ease: 'power2.out' });
    tl.to(fall.scale, { x: 1, y: 1, z: 1, duration: 0.85, ease: 'elastic.out(1, 0.5)' }, '<');
    tl.to(fall.rotation, { y: 0.42, duration: 1.6, ease: 'power2.inOut' }, '<');

    // Nắp mở quanh bản lề phía sau
    tl.to(lid.rotation, { x: -Math.PI * 0.78, duration: 1.0, ease: 'back.out(1.15)' }, '-=0.55');
    if (bow) {
      tl.to(bow.rotation, { z: 0.5, duration: 0.4, ease: 'power2.out' }, '<');
      tl.to(bow.rotation, { z: -0.1, duration: 0.9, ease: 'elastic.out(1, 0.4)' }, '>');
    }

    // Cột sáng + lõi sáng bùng lên
    if (light) tl.to(light, { intensity: 30, duration: 0.9, ease: 'power2.out' }, '-=0.8');
    if (beamRef.current) {
      tl.fromTo(
        beamRef.current.scale,
        { x: 0.08, y: 0.08, z: 0.08 },
        { x: 1, y: 1, z: 1, duration: 1.0, ease: 'power2.out' },
        '-=0.9'
      );
      tl.fromTo(
        (beamRef.current.material as THREE.MeshBasicMaterial),
        { opacity: 0 },
        { opacity: 0.55, duration: 0.5 },
        '<'
      );
    }
    if (ringRef.current) {
      tl.fromTo(
        ringRef.current.scale,
        { x: 0.6, y: 0.6, z: 0.6 },
        { x: 8, y: 8, z: 8, duration: 1.4, ease: 'power3.out' },
        '-=1.0'
      );
      tl.fromTo(
        (ringRef.current.material as THREE.MeshBasicMaterial),
        { opacity: 0.7 },
        { opacity: 0, duration: 1.4 },
        '<'
      );
    }
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (disabled || docked) return;
    if (phaseRef.current !== 'idle' || busyRef.current || openedRef.current) return;

    const next = clicksRef.current + 1;
    clicksRef.current = next;
    onBoxClick?.(next);

    if (next < TOTAL_CLICKS) {
      audioEngine.playBoxShake();
      if (next === 3) audioEngine.playWinRare();
      playClickResponse(next);
    } else {
      playOpeningSequence();
    }
  };

  // ── 5. Chuyển động phụ khi đứng yên (thở, nơ, nắp) ─────────
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Phát tín hiệu va chạm cho camera (dùng chung đồng hồ với useFrame này)
    if (pendingImpact.current > 0 && impactRef?.current) {
      impactRef.current.time = t;
      impactRef.current.power = pendingImpact.current;
      pendingImpact.current = 0;
    }

    // Vòng tròn ma thuật trên cỏ: hiện dần khi hộp đã mở, xoay chậm
    if (magicCircleRef.current) {
      const target = phaseRef.current === 'opened' ? 1 : 0;
      magicLevel.current += (target - magicLevel.current) * Math.min(1, delta * 1.5);
      const rings = magicCircleRef.current.children as THREE.Mesh[];
      if (rings[0]) {
        (
          rings[0].material as THREE.MeshBasicMaterial
        ).opacity = 0.32 * magicLevel.current;
        rings[0].rotation.z = t * 0.5;
        rings[0].scale.setScalar(1 + Math.sin(t * 1.8) * 0.03);
      }
      if (rings[1]) {
        (
          rings[1].material as THREE.MeshBasicMaterial
        ).opacity = 0.2 * magicLevel.current;
        rings[1].rotation.z = -t * 0.33;
        rings[1].scale.setScalar(1 + Math.sin(t * 1.8 + 1.2) * 0.04);
      }
    }

    if (floatRef.current && phaseRef.current === 'idle' && !busyRef.current) {
      floatRef.current.position.y = Math.sin(t * 2.1) * 0.028;
    }
    if (bowRef.current && phaseRef.current === 'idle') {
      bowRef.current.rotation.x = Math.sin(t * 3.2) * 0.05;
    }
    if (lidSecondaryRef.current && phaseRef.current === 'idle') {
      lidSecondaryRef.current.rotation.z = Math.sin(t * 2.6 + 1) * 0.012;
    }
    if (beamRef.current && phaseRef.current === 'opened') {
      beamRef.current.rotation.y = t * 0.5;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.34 + Math.sin(t * 2.4) * 0.09;
    }
    if (coreLightRef.current && phaseRef.current === 'opened') {
      coreLightRef.current.intensity = 16 + Math.sin(t * 2.8) * 5;
    }
  });

  const ROSE = '#FF9AA2';

  return (
    <group ref={dockRef}>
      {/* Bóng mềm trên thảm cỏ (nhóm này được animate khi hộp quà rơi xuống) */}
      <group ref={shadowRef}>
        <SoftShadow radius={1.28} opacity={0.34} position={[0, 0.014, 0]} />
      </group>

      {/* Sóng sáng khi chạm đất / khi mở hộp */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
        <ringGeometry args={[0.86, 1.02, 48]} />
        <meshBasicMaterial color="#FFE3EC" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Vòng tròn ma thuật trên cỏ — hiện dần khi hộp đã mở */}
      <group ref={magicCircleRef} position={[0, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.12, 1.3, 64, 1, 0, Math.PI * 1.6]} />
          <meshBasicMaterial
            color="#FFE9A8"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.45, 1.53, 64, 1, Math.PI * 0.4, Math.PI * 1.2]} />
          <meshBasicMaterial
            color="#FFC9E2"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Nhóm bị ảnh hưởng bởi cú rơi */}
      <group ref={fallRef} position={[0, 17, 0]}>
        {/* Nhóm trôi nhẹ khi đứng yên */}
        <group ref={floatRef} onClick={handleClick}>
          <pointLight ref={coreLightRef} position={[0, 0.55, 0]} color="#FFF6D5" intensity={0} distance={11} />

          {/* Cột sáng phát ra từ trong hộp */}
          <mesh ref={beamRef} position={[0, 1.05, 0]} scale={0.08}>
            <cylinderGeometry args={[0.42, 0.78, 2.1, 24, 1, true]} />
            <meshBasicMaterial
              color="#FFF3C4"
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* ── THÂN HỘP ── */}
          <group ref={bodyRef}>
            <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.36, 0.92, 1.36]} />
              <meshStandardMaterial color={ROSE} roughness={0.32} metalness={0.06} />
            </mesh>

            {/* Ruy băng vàng bọc quanh thân — bám sát bề mặt hộp */}
            <RibbonBands size={[1.36, 0.92, 1.36]} y={0.46} />

            {/* Đáy hộp đậm hơn cho cảm giác khối */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[1.3, 0.06, 1.3]} />
              <meshStandardMaterial color="#E97F91" roughness={0.4} />
            </mesh>

            {/* Lòng hộp phát sáng */}
            <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.62, 28]} />
              <meshBasicMaterial color="#FFF7D6" transparent opacity={0.95} />
            </mesh>
          </group>

          {/* ── NẮP (bản lề phía sau) ── */}
          <group ref={lidPivotRef} position={[0, 0.92, -0.7]}>
            <group ref={lidSecondaryRef}>
              <group position={[0, 0.09, 0.7]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.46, 0.2, 1.46]} />
                  <meshStandardMaterial color="#FF85A1" roughness={0.3} metalness={0.06} />
                </mesh>
                {/* Ruy băng trên nắp — cùng hướng với ruy băng thân hộp */}
                <RibbonBands size={[1.46, 0.2, 1.46]} y={0.01} />

                {/* Nơ vàng: hai vòng, nút giữa và hai đuôi ruy băng */}
                <group position={[0, 0.24, 0]}>
                  <GiftBow bowRef={bowRef} scale={0.94} reducedMotion={reducedMotion} />
                </group>
              </group>
            </group>
          </group>

          {/* Hạt hoa & sao bay ra khi nhấp / mở hộp */}
          {burst && <MagicBurst key={burst.key} power={burst.power} reducedMotion={reducedMotion} />}

          {/* Sao lấp lánh bay lên liên tục sau khi hộp đã mở */}
          {isOpened && <BoxSparkles reducedMotion={reducedMotion} />}
        </group>
      </group>
    </group>
  );
};
