import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { groundCorrection } from '../../../utils/groundSnap';
import { OrangeCat3D } from './OrangeCat3D';
import { Corgi3D } from './Corgi3D';
import { Duckling3D } from './Duckling3D';
import { PinkPig3D } from './PinkPig3D';
import { WhiteBunny3D } from './WhiteBunny3D';
import { ShibaInu3D } from './ShibaInu3D';
import { ChubbySeal3D } from './ChubbySeal3D';
import { Penguin3D } from './Penguin3D';
import { AngelCat3D } from './AngelCat3D';
import { TeddyBear3D } from './TeddyBear3D';
import { BabyDragon3D } from './BabyDragon3D';
import { CrownCat3D } from './CrownCat3D';
import { SecretMoonBunny3D } from './SecretMoonBunny3D';
import { SecretDestinyPup3D } from './SecretDestinyPup3D';
import { SecretAngelCat3D } from './SecretAngelCat3D';

interface CharacterRendererProps {
  characterType: string;
  scale?: number;
  interactive?: boolean;
  /** Vị trí trong scene (dùng để dịch nhân vật khi mở thiệp). */
  position?: [number, number, number];
}

/**
 * Khoảng nhấc model theo trục Y (nhân với scale) — chỉ là giá trị DỰ PHÒNG.
 * Component sẽ tự đo đáy thật của từng model rồi nhấc cho bàn chân chạm mặt cỏ.
 */
export const CHARACTER_GROUND_LIFT = 0.44;

/** Đường dẫn file của từng model — dùng cho trang xem trước khi phát triển. */
export const CHARACTER_SOURCE_FILES: Record<string, string> = {
  'cat-orange': 'src/components/3d/characters/OrangeCat3D.tsx',
  'dog-corgi': 'src/components/3d/characters/Corgi3D.tsx',
  duckling: 'src/components/3d/characters/Duckling3D.tsx',
  'pig-pink': 'src/components/3d/characters/PinkPig3D.tsx',
  'bunny-white': 'src/components/3d/characters/WhiteBunny3D.tsx',
  'dog-shiba': 'src/components/3d/characters/ShibaInu3D.tsx',
  'seal-chubby': 'src/components/3d/characters/ChubbySeal3D.tsx',
  penguin: 'src/components/3d/characters/Penguin3D.tsx',
  'cat-angel': 'src/components/3d/characters/AngelCat3D.tsx',
  'bear-heart': 'src/components/3d/characters/TeddyBear3D.tsx',
  'dragon-baby': 'src/components/3d/characters/BabyDragon3D.tsx',
  'cat-crown': 'src/components/3d/characters/CrownCat3D.tsx',
  'bunny-secret': 'src/components/3d/characters/SecretMoonBunny3D.tsx',
  'dog-destiny': 'src/components/3d/characters/SecretDestinyPup3D.tsx',
  'cat-seraphim': 'src/components/3d/characters/SecretAngelCat3D.tsx',
};

export const CharacterRenderer: React.FC<CharacterRendererProps> = ({
  characterType,
  scale = 1,
  interactive = true,
  position = [0, 0, 0],
}) => {
  const groundRef = useRef<THREE.Group>(null);
  const measuredRef = useRef(false);
  const attemptsRef = useRef(0);
  const [groundOffset, setGroundOffset] = useState(CHARACTER_GROUND_LIFT * scale);

  const isDecal = useCallback(
    (m: THREE.Material | undefined) =>
      !!m && (m as THREE.MeshBasicMaterial).type === 'MeshBasicMaterial' && m.transparent,
    []
  );

  /** Đáy hiện tại của model trong không gian thế giới (bỏ qua chi tiết trong suốt). */
  const measureBottom = useCallback((): number | null => {
    const root = groundRef.current;
    if (!root) return null;

    const box = new THREE.Box3();
    const meshBox = new THREE.Box3();
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const decalOnly = Array.isArray(mat) ? mat.every(isDecal) : isDecal(mat);
      if (decalOnly) return;
      meshBox.setFromObject(mesh);
      if (!meshBox.isEmpty()) box.union(meshBox);
    });

    if (box.isEmpty() || !Number.isFinite(box.min.y)) return null;
    return box.min.y;
  }, [isDecal]);

  /**
   * Bù dần cho tới khi đáy model nằm đúng mặt cỏ.
   * Dùng phép bù TƯƠNG ĐỐI (xem `groundCorrection`) rồi đo lại để tự kiểm tra.
   */
  const fixGroundOffset = useCallback(() => {
    if (attemptsRef.current >= 4) {
      measuredRef.current = true;
      return;
    }
    const minY = measureBottom();
    if (minY === null) return;
    if (Math.abs(minY) < 0.005) {
      measuredRef.current = true;
      return;
    }
    attemptsRef.current += 1;
    setGroundOffset((prev) => groundCorrection(prev, minY));
  }, [measureBottom]);

  // Đo lúc mount và đo lại vài lần (model có thể chưa dựng xong ngay)
  useEffect(() => {
    measuredRef.current = false;
    attemptsRef.current = 0;
    setGroundOffset(CHARACTER_GROUND_LIFT * scale);

    const timers = [0, 150, 700, 1400].map((delay) =>
      window.setTimeout(fixGroundOffset, delay)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [characterType, scale, fixGroundOffset]);

  // Bảo hiểm: bù ngay ở những frame đầu (chắc chắn model đã dựng xong)
  useFrame(() => {
    if (measuredRef.current) return;
    fixGroundOffset();
  });

  const renderCharacter = () => {
    switch (characterType) {
      // Normal
      case 'cat-orange':
        return <OrangeCat3D scale={scale} interactive={interactive} />;
      case 'dog-corgi':
        return <Corgi3D scale={scale} interactive={interactive} />;
      case 'duckling':
        return <Duckling3D scale={scale} interactive={interactive} />;
      case 'pig-pink':
        return <PinkPig3D scale={scale} interactive={interactive} />;

      // Rare
      case 'bunny-white':
        return <WhiteBunny3D scale={scale} interactive={interactive} />;
      case 'dog-shiba':
        return <ShibaInu3D scale={scale} interactive={interactive} />;
      case 'seal-chubby':
        return <ChubbySeal3D scale={scale} interactive={interactive} />;
      case 'penguin':
        return <Penguin3D scale={scale} interactive={interactive} />;

      // Epic
      case 'cat-angel':
        return <AngelCat3D scale={scale} interactive={interactive} />;
      case 'bear-heart':
        return <TeddyBear3D scale={scale} interactive={interactive} />;
      case 'dragon-baby':
        return <BabyDragon3D scale={scale} interactive={interactive} />;
      case 'cat-crown':
        return <CrownCat3D scale={scale} interactive={interactive} />;

      // Secret
      case 'bunny-secret':
        return <SecretMoonBunny3D scale={scale} interactive={interactive} />;
      case 'dog-destiny':
        return <SecretDestinyPup3D scale={scale} interactive={interactive} />;
      case 'cat-seraphim':
        return <SecretAngelCat3D scale={scale} interactive={interactive} />;

      default:
        return <WhiteBunny3D scale={scale} interactive={interactive} />;
    }
  };

  return (
    <group position={new THREE.Vector3(...position)}>
      <group ref={groundRef} position={[0, groundOffset, 0]}>
        {renderCharacter()}
      </group>
    </group>
  );
};
