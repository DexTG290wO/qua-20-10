import type { RecipientMatchResult, RecipientProfile } from '../types/recipient';

/**
 * Remove Vietnamese accents for optional normalized matching
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
}

/**
 * Clean & normalize a raw input name:
 * 1. Trim leading and trailing whitespace
 * 2. Collapse multiple spaces into one
 * 3. Unicode normalization (NFC)
 */
export function normalizeName(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Tên hiển thị trên thiệp = HAI từ cuối của họ tên người dùng nhập.
 *
 * Quy tắc:
 * 1. Cắt khoảng trắng đầu/cuối.
 * 2. Gộp nhiều khoảng trắng liên tiếp thành một.
 * 3. Tách thành các từ.
 * 4. Từ 2 từ trở lên → lấy 2 từ cuối.
 * 5. Chỉ 1 từ → giữ nguyên.
 * 6. Giữ nguyên chính tả, chữ hoa/thường và dấu tiếng Việt.
 *
 * Lưu ý: hàm này chỉ dùng cho phần HIỂN THỊ. Việc đối chiếu hồ sơ
 * người nhận vẫn dùng họ tên đầy đủ (xem `matchRecipient`).
 */
export function getDisplayName(fullName: string): string {
  const normalized = normalizeName(fullName);
  if (!normalized) return '';

  const words = normalized.split(' ');
  if (words.length <= 2) return normalized;

  return words.slice(-2).join(' ');
}

/**
 * Validate that there are no conflicting/duplicate aliases assigned across different profiles.
 * Throws or logs detailed error if conflicts exist.
 */
export function detectAliasClashes(profiles: RecipientProfile[]): { hasConflict: boolean; errors: string[] } {
  const seenAliases = new Map<string, string>(); // lowercase alias -> profileId
  const errors: string[] = [];

  for (const profile of profiles) {
    const allAliases = [profile.officialName, ...profile.aliases];
    for (const rawAlias of allAliases) {
      const normalized = normalizeName(rawAlias).toLowerCase();
      if (!normalized) continue;

      if (seenAliases.has(normalized)) {
        const existingId = seenAliases.get(normalized)!;
        if (existingId !== profile.id) {
          errors.push(
            `Alias trùng lặp: "${rawAlias}" được dùng cho cả [${existingId}] và [${profile.id}].`
          );
        }
      } else {
        seenAliases.set(normalized, profile.id);
      }
    }
  }

  return {
    hasConflict: errors.length > 0,
    errors,
  };
}

/**
 * Match user input against recipient profiles with strict precedence:
 * 1. Exact case-insensitive match on normalized aliases or officialName
 * 2. Exact unaccented match (if enabled)
 * Returns RecipientMatchResult or null if no confident match.
 */
export function matchRecipient(
  rawInput: string,
  profiles: RecipientProfile[],
  options: { allowUnaccented?: boolean } = { allowUnaccented: true }
): RecipientMatchResult | null {
  const normalizedInput = normalizeName(rawInput);
  if (!normalizedInput) return null;

  const lowerInput = normalizedInput.toLowerCase();
  const unaccentedInput = removeVietnameseAccents(lowerInput);

  // 1. Exact match on officialName or Aliases
  for (const profile of profiles) {
    const candidateAliases = [profile.officialName, ...profile.aliases];

    for (const alias of candidateAliases) {
      const normAlias = normalizeName(alias);
      if (normAlias.toLowerCase() === lowerInput) {
        const effectiveDisplayName = normalizedInput.length > 0
          ? normalizedInput
          : profile.displayName;

        return {
          profile,
          matchedAlias: alias,
          normalizedInput,
          effectiveDisplayName,
        };
      }
    }
  }

  // 2. Unaccented match if enabled
  if (options.allowUnaccented) {
    for (const profile of profiles) {
      const candidateAliases = [profile.officialName, ...profile.aliases];

      for (const alias of candidateAliases) {
        const normAlias = normalizeName(alias);
        const unaccentedAlias = removeVietnameseAccents(normAlias.toLowerCase());

        if (unaccentedAlias === unaccentedInput) {
          return {
            profile,
            matchedAlias: alias,
            normalizedInput,
            effectiveDisplayName: profile.displayName || normalizedInput,
          };
        }
      }
    }
  }

  return null;
}
