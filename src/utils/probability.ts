import { DEFAULT_ODDS } from '../config/rarity';
import { REWARD_MAP, REWARDS_BY_RARITY } from '../config/rewards';
import type { RarityOdds, RarityType } from '../types/rarity';
import type { RecipientProfile } from '../types/recipient';
import type { ItemReward } from '../types/reward';

/**
 * Normalizes odds so the sum is guaranteed to equal 100.
 */
export function normalizeOdds(odds: Partial<RarityOdds>): RarityOdds {
  const merged: RarityOdds = {
    normal: odds.normal ?? DEFAULT_ODDS.normal,
    rare: odds.rare ?? DEFAULT_ODDS.rare,
    epic: odds.epic ?? DEFAULT_ODDS.epic,
    secret: odds.secret ?? DEFAULT_ODDS.secret,
  };

  const safeNormal = Math.max(0, merged.normal);
  const safeRare = Math.max(0, merged.rare);
  const safeEpic = Math.max(0, merged.epic);
  const safeSecret = Math.max(0, merged.secret);

  const total = safeNormal + safeRare + safeEpic + safeSecret;

  if (total <= 0) {
    return { ...DEFAULT_ODDS };
  }

  return {
    normal: (safeNormal / total) * 100,
    rare: (safeRare / total) * 100,
    epic: (safeEpic / total) * 100,
    secret: (safeSecret / total) * 100,
  };
}

/**
 * Rolls a rarity tier using the normalized odds.
 */
export function rollRarityTier(odds: RarityOdds): RarityType {
  const rand = Math.random() * 100;

  if (odds.secret > 0 && rand < odds.secret) {
    return 'secret';
  }

  const epicThreshold = odds.secret + odds.epic;
  if (rand < epicThreshold) {
    return 'epic';
  }

  const rareThreshold = epicThreshold + odds.rare;
  if (rand < rareThreshold) {
    return 'rare';
  }

  return 'normal';
}

/**
 * Determines the predetermined reward for a given recipient.
 */
export function determineRecipientReward(profile: RecipientProfile): {
  reward: ItemReward;
  rolledTier: RarityType;
  effectiveOdds: RarityOdds;
} {
  const effectiveOdds = normalizeOdds(profile.odds || {});
  const rolledTier = rollRarityTier(effectiveOdds);

  if (rolledTier === 'secret') {
    if (profile.secretItemId && REWARD_MAP[profile.secretItemId]) {
      return {
        reward: REWARD_MAP[profile.secretItemId],
        rolledTier,
        effectiveOdds,
      };
    }

    const secrets = REWARDS_BY_RARITY.secret;
    const chosen = secrets[Math.floor(Math.random() * secrets.length)];
    return {
      reward: chosen,
      rolledTier,
      effectiveOdds,
    };
  }

  let pool = REWARDS_BY_RARITY[rolledTier];
  if (profile.allowedItems && profile.allowedItems.length > 0) {
    const filtered = pool.filter((item) => profile.allowedItems!.includes(item.id));
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return {
    reward: chosen,
    rolledTier,
    effectiveOdds,
  };
}
