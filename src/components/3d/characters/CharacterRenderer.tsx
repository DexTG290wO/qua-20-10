import React from 'react';
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
  /** Xem trước tĩnh (không diễn giải animation vòng lặp). */
  reducedMotion?: boolean;
}

export const CharacterRenderer: React.FC<CharacterRendererProps> = ({
  characterType,
  scale = 1,
  interactive = true,
  position = [0, 0, 0],
}) => {
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
      {renderCharacter()}
    </group>
  );
};
