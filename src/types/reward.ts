import type { RarityType } from './rarity';

export interface ItemReward {
  id: string;
  name: string;
  vietnameseName: string;
  rarity: RarityType;
  characterType: string;
  description: string;
  catchphrase: string;
  themeColor: string;
  accentColor: string;
  sparkleEmoji: string;
  personality: string;
  title: string;
}
