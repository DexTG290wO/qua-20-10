import {
  CLOSING_WISHES,
  GREETINGS_BY_RARITY,
  GREETINGS_DEFAULT,
  RECIPIENT_GREETINGS,
} from '../config/messages';
import type { RarityType } from '../types/rarity';

/**
 * ─────────────────────────────────────────────────────────────
 *  Chọn lời chúc cho mỗi lượt chơi.
 *
 *  Tách hoàn toàn khỏi:
 *   - `utils/probability.ts`  → quyết định phần thưởng
 *   - `utils/nameMatcher.ts`  → đối chiếu hồ sơ người nhận
 *   - các component 3D/UI     → chỉ hiển thị kết quả đã chọn
 * ─────────────────────────────────────────────────────────────
 */

export interface GreetingPickOptions {
  /** id hồ sơ người nhận (nếu đã khớp). */
  recipientId?: string;
  /** bậc độ hiếm của phần thưởng đã chốt. */
  rarity?: RarityType;
  /** Cho phép tiêm hàm random khác (dùng cho test). */
  random?: () => number;
  /** Bỏ qua lịch sử chống lặp (dùng cho test). */
  allowRepeat?: boolean;
}

const GUEST_KEY = '__guest__';
const lastGreeting = new Map<string, string>();
const lastClosing = new Map<string, string>();

const keyFor = (recipientId?: string) => recipientId ?? GUEST_KEY;

/**
 * Thứ tự ưu tiên lấy bộ lời chúc:
 * 1. Bộ riêng của hồ sơ người nhận.
 * 2. Bộ theo bậc độ hiếm của phần thưởng.
 * 3. Bộ mặc định.
 */
export function getGreetingPool(recipientId?: string, rarity?: RarityType): string[] {
  const specific = recipientId ? RECIPIENT_GREETINGS[recipientId] : undefined;
  if (specific && specific.length > 0) return specific;

  if (rarity) {
    const byRarity = GREETINGS_BY_RARITY[rarity];
    if (byRarity && byRarity.length > 0) return byRarity;
  }

  return GREETINGS_DEFAULT;
}

/** Chọn một phần tử trong bộ, tránh lặp lại `previous` nếu còn lựa chọn khác. */
export function pickFromPool(
  pool: string[],
  previous?: string,
  random: () => number = Math.random
): string {
  if (pool.length === 0) return '';
  if (pool.length === 1) return pool[0];

  const fresh = previous ? pool.filter((item) => item !== previous) : pool;
  const usable = fresh.length > 0 ? fresh : pool;

  const raw = random();
  const index = Math.min(usable.length - 1, Math.max(0, Math.floor(raw * usable.length)));
  return usable[index];
}

/** Chọn lời chúc cho lượt chơi hiện tại và ghi nhớ để không lặp ở lượt sau. */
export function pickGreeting(options: GreetingPickOptions = {}): string {
  const { recipientId, rarity, random = Math.random, allowRepeat = false } = options;
  const pool = getGreetingPool(recipientId, rarity);
  const previous = allowRepeat ? undefined : lastGreeting.get(keyFor(recipientId));
  const chosen = pickFromPool(pool, previous, random);

  if (chosen) lastGreeting.set(keyFor(recipientId), chosen);
  return chosen;
}

/** Chọn câu kết ngắn (đoạn thứ hai của thiệp) và cũng tránh lặp liên tiếp. */
export function pickClosing(options: GreetingPickOptions = {}): string {
  const { recipientId, random = Math.random, allowRepeat = false } = options;
  const previous = allowRepeat ? undefined : lastClosing.get(keyFor(recipientId));
  const chosen = pickFromPool(CLOSING_WISHES, previous, random);

  if (chosen) lastClosing.set(keyFor(recipientId), chosen);
  return chosen;
}

/** Ghép các đoạn văn thành nội dung thiệp (bỏ đoạn rỗng). */
export function composeLetterBody(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0)
    .join('\n\n');
}

/** Xoá lịch sử chống lặp (dùng trong test). */
export function resetGreetingHistory(): void {
  lastGreeting.clear();
  lastClosing.clear();
}

/** Lời chúc đã dùng ở lượt gần nhất của một người nhận (dùng trong test). */
export function getLastGreeting(recipientId?: string): string | undefined {
  return lastGreeting.get(keyFor(recipientId));
}
