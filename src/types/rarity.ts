export type RarityType = 'normal' | 'rare' | 'epic' | 'secret';

export interface RarityConfig {
  id: RarityType;
  name: string;
  vietnameseName: string;
  defaultOdds: number; // Percentage (e.g. 60, 25, 14, 1)
  color: string;
  glowColor: string;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  soundName: string;
}

export interface RarityOdds {
  normal: number;
  rare: number;
  epic: number;
  secret: number;
}
