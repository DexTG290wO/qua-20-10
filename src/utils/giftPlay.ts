import type { ItemReward } from '../types/reward';
import type { RecipientMatchResult } from '../types/recipient';
import { DEFAULT_FALLBACK_LETTER } from '../config/recipients';
import { RARITY_CONFIGS } from '../config/rarity';
import { getRewardIntro } from '../config/messages';
import { getDisplayName } from './nameMatcher';
import { composeLetterBody, pickClosing, pickGreeting } from './greetingPicker';
import { resolveAssetUrl } from './assetUrl';
import type { CardTextData } from './cardRenderer';

/**
 * ─────────────────────────────────────────────────────────────
 *  Ghép nội dung cho MỘT lượt chơi.
 *
 *  Tách thành hàm thuần để:
 *   - App chỉ còn việc gọi và hiển thị;
 *   - kiểm thử được toàn bộ chuỗi: họ tên đầy đủ → tên hiển thị
 *     (2 từ cuối) → lời chúc đã chốt → nội dung thiệp 3D.
 *
 *  Module này KHÔNG quyết định phần thưởng (do utils/probability.ts
 *  quyết định trước đó) và KHÔNG đối chiếu hồ sơ (utils/nameMatcher.ts).
 * ─────────────────────────────────────────────────────────────
 */

export interface PlayContent {
  /** Lời chúc chính đã chốt cho lượt này (hiện ở thiệp). */
  greetingText: string;
  /** Câu kết ngắn của lượt này. */
  closingText: string;
  /** Tên hiển thị = hai từ cuối của họ tên người dùng nhập. */
  displayName: string;
  /** Họ tên đầy đủ đã chuẩn hoá (dùng cho việc đối chiếu). */
  fullName: string;
}

export const EMPTY_PLAY_CONTENT: PlayContent = {
  greetingText: '',
  closingText: '',
  displayName: 'bạn',
  fullName: '',
};

/** Họ tên đầy đủ đã chuẩn hoá từ kết quả đối chiếu. */
export function getFullName(result: RecipientMatchResult | null): string {
  if (!result) return '';
  return (
    result.normalizedInput ||
    result.effectiveDisplayName ||
    result.profile.displayName ||
    ''
  );
}

/**
 * Chốt nội dung cho lượt chơi hiện tại.
 * Lời chúc ưu tiên: bộ riêng của người nhận → bộ theo bậc độ hiếm → mặc định.
 */
export function pickPlayContent(
  result: RecipientMatchResult | null,
  reward: ItemReward | null
): PlayContent {
  const fullName = getFullName(result);
  const displayName = getDisplayName(fullName) || result?.profile.displayName || 'bạn';

  if (!result || !reward) {
    return { ...EMPTY_PLAY_CONTENT, displayName, fullName };
  }

  const recipientId = result.profile.id;
  return {
    greetingText: pickGreeting({ recipientId, rarity: reward.rarity }),
    closingText: pickClosing({ recipientId }),
    displayName,
    fullName,
  };
}

/** Dựng dữ liệu hiển thị cho tấm thiệp 3D (và cho ảnh xuất ra). */
export function buildCardData(params: {
  result: RecipientMatchResult | null;
  reward: ItemReward | null;
  content: PlayContent;
  /** Ảnh 2D chụp từ model 3D của nhân vật trúng thưởng (in vào trang thư). */
  companionImageUrl?: string;
}): CardTextData | null {
  const { result, reward, content, companionImageUrl } = params;
  if (!result || !reward) return null;

  const letter = result.profile.letter || DEFAULT_FALLBACK_LETTER;
  const fill = (raw: string | undefined) =>
    (raw ?? '').replace(/\{\{displayName\}\}/g, content.displayName);

  return {
    displayName: content.displayName,
    letter: {
      greeting: fill(letter.greeting),
      // Đoạn 1: lời chúc đã chốt cho lượt này
      // Đoạn 2: ghi chú riêng của hồ sơ (nếu có)
      // Đoạn 3: câu kết ngắn
      body: composeLetterBody([content.greetingText, letter.body, content.closingText]),
      signature: fill(letter.signature),
      postscript: fill(letter.postscript),
    },
    companionName: reward.vietnameseName.replace(/\s*\(Secret\)\s*$/i, ''),
    companionCatchphrase: reward.catchphrase,
    companionIntro: getRewardIntro(reward.id, reward.rarity),
    rarityLabel: RARITY_CONFIGS[reward.rarity].vietnameseName,
    rarityColor: RARITY_CONFIGS[reward.rarity].badgeBg,
    themeColor: reward.themeColor,
    accentColor: reward.accentColor,
    portraitUrl: resolveAssetUrl(result.profile.portraitUrl),
    companionImageUrl,
  };
}
