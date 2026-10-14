import type { RarityOdds } from './rarity';

export interface LetterConfig {
  greeting: string;
  body: string;
  signature: string;
  postscript?: string;
}

export interface RecipientProfile {
  id: string;
  officialName: string;
  aliases: string[];
  displayName: string;
  odds?: Partial<RarityOdds>;
  allowedItems?: string[];
  secretItemId?: string;
  letter: LetterConfig;
  portraitUrl?: string;
  themeColor?: string;
  accentColor?: string;
  customGreetingPrefix?: string;
  specialNote?: string;
}

export interface RecipientMatchResult {
  profile: RecipientProfile;
  matchedAlias: string;
  normalizedInput: string;
  effectiveDisplayName: string;
}
