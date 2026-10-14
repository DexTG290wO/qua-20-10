import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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
  const [groundOffset, setGroundOffset] = useState(CHARACTER_GROUND_LIFT * scale);

  const isDecal = useCallback(
    (m: THREE.Material | undefined) =>
      !!m && (m as THREE.MeshBasicMaterial).type === 'MeshBasicMaterial' && m.transparent,
    []
  );

  /** Đo đáy thật của model (bỏ qua chi tiết trong suốt) → khoảng cần nhấc. */
  const measureGroundOffset = useCallback((): number | null => {
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
    return -box.min.y;
  }, [isDecal]);

  // Đo lúc mount và đo lại sau ít frame (model có thể chưa dựng xong ngay)
  useEffect(() => {
    measuredRef.current = false;
    setGroundOffset(CHARACTER_GROUND_LIFT * scale);

    const tryMeasure = () => {
      const offset = measureGroundOffset();
      if (offset === null) return;
      measuredRef.current = true;
      setGroundOffset(offset);
    };

    tryMeasure();
    const t1 = window.setTimeout(tryMeasure, 150);
    const t2 = window.setTimeout(tryMeasure, 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [characterType, scale, measureGroundOffset]);

  // Bảo hiểm: đo ngay ở frame render đầu tiên (chắc chắn model đã dựng xong)
  useFrame(() => {
    if (measuredRef.current) return;
    const offset = measureGroundOffset();
    if (offset === null) return;
    measuredRef.current = true;
    setGroundOffset(offset);
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
