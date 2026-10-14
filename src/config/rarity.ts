import type { RarityConfig, RarityType } from '../types/rarity';

export const DEFAULT_ODDS = {
  normal: 60,
  rare: 25,
  epic: 14,
  secret: 1,
};

export const RARITY_CONFIGS: Record<RarityType, RarityConfig> = {
  normal: {
    id: 'normal',
    name: 'Normal',
    vietnameseName: 'Thường',
    defaultOdds: 60,
    color: '#6BA4B8',
    glowColor: 'rgba(107, 164, 184, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 218, 220, 0.25), rgba(69, 123, 157, 0.35))',
    borderColor: '#A8DADC',
    badgeBg: '#457B9D',
    soundName: 'win_normal',
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    vietnameseName: 'Hiếm',
    defaultOdds: 25,
    color: '#9C6ADE',
    glowColor: 'rgba(156, 106, 222, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(187, 134, 252, 0.3), rgba(103, 58, 183, 0.4))',
    borderColor: '#BB86FC',
    badgeBg: '#7E57C2',
    soundName: 'win_rare',
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    vietnameseName: 'Sử Thi',
    defaultOdds: 14,
    color: '#FF6584',
    glowColor: 'rgba(255, 101, 132, 0.7)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 117, 140, 0.35), rgba(255, 126, 179, 0.45))',
    borderColor: '#FF758C',
    badgeBg: '#E91E63',
    soundName: 'win_epic',
  },
  secret: {
    id: 'secret',
    name: 'Secret',
    vietnameseName: 'Huyền Bí',
    defaultOdds: 1,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.9)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.45), rgba(255, 152, 0, 0.55))',
    borderColor: '#FFE082',
    badgeBg: '#FF8F00',
    soundName: 'win_secret',
  },
};
