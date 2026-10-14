import { RECIPIENTS } from './src/config/recipients.ts';
import { matchRecipient, detectAliasClashes, getDisplayName } from './src/utils/nameMatcher.ts';
import { normalizeOdds, determineRecipientReward } from './src/utils/probability.ts';
import { DEFAULT_ODDS } from './src/config/rarity.ts';
import { REWARDS_BY_RARITY, REWARD_MAP } from './src/config/rewards.ts';
import {
  CLOSING_WISHES,
  getRewardIntro,
  GREETINGS_BY_RARITY,
  GREETINGS_DEFAULT,
  RARITY_INTROS,
  RECIPIENT_GREETINGS,
} from './src/config/messages.ts';
import {
  composeLetterBody,
  getGreetingPool,
  getLastGreeting,
  pickClosing,
  pickGreeting,
  resetGreetingHistory,
} from './src/utils/greetingPicker.ts';
import {
  CARD_PANEL,
  CARD_EXPANDED_VIEW,
  CARD_VIEW_MARGIN,
  checkCardFits,
  getCardReadCamera,
  getCardReadDistance,
  getCompactCardView,
  getCardStageCamera,
  getExpandedCardExtent,
  getCharacterPosition,
  isSpreadView,
  CAMERA_FOV_DEG,
} from './src/utils/layout.ts';
import {
  createPetalGeometry,
  createFourPointStarGeometry,
  createFivePointStarGeometry,
  createThickPetalGeometry,
  createGrassTuftGeometry,
} from './src/components/3d/ProceduralFlora.ts';
import { createRibbonTailGeometry, getRibbonBandLayout } from './src/components/3d/GiftBow.tsx';
import {
  buildCardData,
  getFullName,
  pickPlayContent,
} from './src/utils/giftPlay.ts';

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    console.log(`✅ [PASS] ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures += 1;
    console.error(`❌ [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG ===\n');

// ── 1. Nhận diện alias của Wang Yi ─────────────────────────
console.log('--- Test 1: Nhận diện alias Wang Yi ---');
const wangProfile = RECIPIENTS.find((p) => p.id === 'wang-yi');
if (!wangProfile) {
  console.error('Không tìm thấy profile wang-yi');
  process.exit(1);
}

const wangNames = ['Wang Yi', 'Yi', 'yi', 'YI', '  wang   yi  ', 'WangYi', 'wang yi', 'Bé Yi'];
for (const name of wangNames) {
  const result = matchRecipient(name, RECIPIENTS);
  check(
    `"${name}" → wang-yi`,
    result?.profile.id === 'wang-yi',
    result ? `hiển thị "${result.effectiveDisplayName}"` : 'không khớp'
  );
}

// ── 1b. Người nhận thường (có dấu / không dấu / khoảng trắng thừa) ──
console.log('--- Test 1b: Người nhận thường ---');
const regularCases: Array<[string, string]> = [
  ['  lan   anh ', 'lan-anh'],
  ['LAN ANH', 'lan-anh'],
  ['Bé Lan', 'lan-anh'],
  ['mai phuong', 'mai-phuong'],
  ['MAI PHƯƠNG', 'mai-phuong'],
  ['Phương', 'mai-phuong'],
  ['  phương  ', 'mai-phuong'],
];
for (const [name, expectedId] of regularCases) {
  const r = matchRecipient(name, RECIPIENTS);
  check(`"${name}" → ${expectedId}`, r?.profile.id === expectedId, r ? r.profile.id : 'không khớp');
}

// ── 2. Tên không có trong danh sách ────────────────────────
console.log('\n--- Test 2: Tên không tồn tại ---');
const unknownResult = matchRecipient('Người Lạ Ơi 123', RECIPIENTS);
check('Tên không tồn tại trả về null (không gán bừa)', unknownResult === null);

// ── 3. Phát hiện trùng lặp alias ───────────────────────────
console.log('\n--- Test 3: Phát hiện trùng lặp alias ---');
const mockClashingProfiles = [
  { id: 'user-a', officialName: 'User A', aliases: ['Alice', 'Bé Yêu'], displayName: 'A', letter: { greeting: '', body: '', signature: '' } },
  { id: 'user-b', officialName: 'User B', aliases: ['Bé Yêu', 'Bob'], displayName: 'B', letter: { greeting: '', body: '', signature: '' } },
];
const clashCheck = detectAliasClashes(mockClashingProfiles);
check('Phát hiện alias trùng lặp', clashCheck.hasConflict && clashCheck.errors.length > 0, clashCheck.errors[0]);
check('Hồ sơ thật không có alias trùng lặp', !detectAliasClashes(RECIPIENTS).hasConflict);

// ── 4. Tỷ lệ Secret của Wang Yi ────────────────────────────
console.log('\n--- Test 4: Tỷ lệ phần thưởng của Wang Yi ---');
const wangOdds = normalizeOdds(wangProfile.odds || {});
console.log(
  `Tỷ lệ Wang Yi: Thường=${wangOdds.normal}%, Hiếm=${wangOdds.rare}%, Sử thi=${wangOdds.epic}%, Secret=${wangOdds.secret}%`
);
check('Wang Yi Secret = 15%', wangOdds.secret === 15, `${wangOdds.secret}`);

// ── 5. Chỉ Wang Yi có Secret cao nhất, tổng = 100 ──────────
console.log('\n--- Test 5: So sánh Secret giữa các hồ sơ ---');
const secretByProfile = RECIPIENTS.map((p) => ({
  id: p.id,
  secret: normalizeOdds(p.odds || {}).secret,
}));
const wangSecret = secretByProfile.find((p) => p.id === 'wang-yi')!.secret;
const others = secretByProfile.filter((p) => p.id !== 'wang-yi');
check(
  'Wang Yi có Secret cao hơn mọi hồ sơ khác',
  others.every((o) => wangSecret > o.secret),
  secretByProfile.map((p) => `${p.id}=${p.secret}%`).join(', ')
);
check('Wang Yi Secret < 100%', wangSecret < 100, `${wangSecret}%`);

for (const p of RECIPIENTS) {
  const odds = normalizeOdds(p.odds || {});
  const sum = odds.normal + odds.rare + odds.epic + odds.secret;
  check(
    `Tổng tỷ lệ của ${p.id} = 100%`,
    Math.abs(sum - 100) < 0.0001 && odds.normal >= 0 && odds.rare >= 0 && odds.epic >= 0 && odds.secret >= 0,
    `${sum.toFixed(4)}%`
  );
}

// ── 6. Không rebalance hồ sơ khác ──────────────────────────
console.log('\n--- Test 6: Giữ nguyên tỷ lệ các hồ sơ khác ---');
const lanAnh = RECIPIENTS.find((p) => p.id === 'lan-anh')!;
const maiPhuong = RECIPIENTS.find((p) => p.id === 'mai-phuong')!;
const lanOdds = normalizeOdds(lanAnh.odds || {});
const maiOdds = normalizeOdds(maiPhuong.odds || {});
check('Lan Anh giữ 50/30/20/0', lanOdds.normal === 50 && lanOdds.rare === 30 && lanOdds.epic === 20 && lanOdds.secret === 0);
check('Mai Phương giữ 40/35/20/5', maiOdds.normal === 40 && maiOdds.rare === 35 && maiOdds.epic === 20 && maiOdds.secret === 5);

// ── 7. Secret của Wang Yi luôn là Bunny Secret ─────────────
console.log('\n--- Test 7: Vật phẩm Secret của Wang Yi ---');
let gotSecret = false;
let secretOk = true;
for (let i = 0; i < 800 && !gotSecret; i++) {
  const roll = determineRecipientReward(wangProfile);
  if (roll.rolledTier === 'secret') {
    gotSecret = true;
    secretOk = roll.reward.id === 'bunny-secret';
  }
}
check('Trúng Secret → luôn nhận bunny-secret', secretOk, gotSecret ? 'đã quan sát thấy' : 'không trúng trong 800 lượt (vẫn hợp lệ)');

// ── 8. Secret 0% không bao giờ trúng ───────────────────────
console.log('\n--- Test 8: Hồ sơ 0% Secret ---');
let lanAnhLeak = false;
for (let i = 0; i < 300; i++) {
  if (determineRecipientReward(lanAnh).rolledTier === 'secret') lanAnhLeak = true;
}
check('Lan Anh (0% Secret) không bao giờ trúng Secret', !lanAnhLeak);

// ── 9. Tên người dùng luôn được dùng để hiển thị ───────────
console.log('\n--- Test 9: Tên hiển thị trên thiệp ---');
const typed = matchRecipient('  wang   yi  ', RECIPIENTS);
check('Tên hiển thị = tên người dùng nhập (đã chuẩn hoá)', typed?.effectiveDisplayName === 'wang yi', `"${typed?.effectiveDisplayName}"`);

// ── 10. Placeholder trong thư ──────────────────────────────
console.log('\n--- Test 10: Định dạng thư ---');
const greetingFormatted = wangProfile.letter.greeting.replace(/\{\{displayName\}\}/g, 'Yi');
check('Placeholder {{displayName}} thay thế chính xác', greetingFormatted === 'Gửi Yi,', greetingFormatted);
check(
  'Bộ lời chúc mặc định đủ phong phú (≥10 câu)',
  GREETINGS_DEFAULT.length >= 10,
  `${GREETINGS_DEFAULT.length} câu`
);

// ── 11. Thư riêng cho từng hồ sơ ───────────────────────────
console.log('\n--- Test 11: Thư riêng & lời dẫn theo nhân vật/bậc ---');
const bodies = RECIPIENTS.map((p) => p.letter.body);
check('Mỗi hồ sơ có nội dung thư riêng', new Set(bodies).size === bodies.length);
check('Lời dẫn theo bậc độ hiếm tồn tại', Boolean(RARITY_INTROS.normal && RARITY_INTROS.rare && RARITY_INTROS.epic && RARITY_INTROS.secret));
check('Lời dẫn riêng cho từng nhân vật', getRewardIntro('bunny-secret', 'secret').includes('trăng'));

// ── 12. Cấu hình phần thưởng hợp lệ ────────────────────────
console.log('\n--- Test 12: Cấu hình phần thưởng ---');
check('Có đủ 4 bậc độ hiếm', 
  REWARDS_BY_RARITY.normal.length > 0 &&
  REWARDS_BY_RARITY.rare.length > 0 &&
  REWARDS_BY_RARITY.epic.length > 0 &&
  REWARDS_BY_RARITY.secret.length > 0
);
check('Mọi reward id là duy nhất', Object.keys(REWARD_MAP).length === 15, `${Object.keys(REWARD_MAP).length} phần thưởng`);
check('Tỷ lệ mặc định cộng lại = 100%', DEFAULT_ODDS.normal + DEFAULT_ODDS.rare + DEFAULT_ODDS.epic + DEFAULT_ODDS.secret === 100);

// ── 13. Hình học thủ tục (cánh hoa / sao / cỏ) hợp lệ ──────
console.log('\n--- Test 13: Hình học hoa lá & sao ---');
function validateGeometry(label: string, geom: { attributes: Record<string, { array: ArrayLike<number>; count: number }>; index: { array: ArrayLike<number>; count: number } | null; computeBoundingSphere: () => void; boundingSphere: { radius: number } | null }) {
  const pos = geom.attributes.position;
  let finite = true;
  for (let i = 0; i < pos.array.length; i++) {
    if (!Number.isFinite(pos.array[i])) {
      finite = false;
      break;
    }
  }
  let normalsOk = true;
  const nor = geom.attributes.normal;
  if (nor) {
    for (let i = 0; i < nor.array.length; i++) {
      if (!Number.isFinite(nor.array[i])) {
        normalsOk = false;
        break;
      }
    }
  }
  geom.computeBoundingSphere();
  const radiusOk = !!geom.boundingSphere && Number.isFinite(geom.boundingSphere.radius) && geom.boundingSphere.radius > 0;

  let indexOk = true;
  if (geom.index) {
    const idx = geom.index.array;
    for (let i = 0; i < idx.length; i++) {
      if (idx[i] < 0 || idx[i] >= pos.count) {
        indexOk = false;
        break;
      }
    }
  }

  check(
    `${label}: toạ độ hữu hạn, pháp tuyến hợp lệ, bán kính bao hợp lệ`,
    finite && normalsOk && radiusOk && indexOk,
    `r=${geom.boundingSphere ? geom.boundingSphere.radius.toFixed(3) : 'NaN'}`
  );
}

validateGeometry('Cánh hoa cong', createPetalGeometry(0.3, 0.19, 0.06));
validateGeometry('Cánh hoa dày (rose)', createThickPetalGeometry(0.24, 0.19, 0.04));
validateGeometry('Sao 4 cánh', createFourPointStarGeometry(0.11, 0.032));
validateGeometry('Sao 5 cánh', createFivePointStarGeometry(1, 0.45));
validateGeometry('Búi cỏ', createGrassTuftGeometry(6, 0.42));

// ── 14. Tên hiển thị = hai từ cuối ─────────────────────────
console.log('\n--- Test 14: Tách tên hiển thị (2 từ cuối) ---');
const displayCases: Array<[string, string]> = [
  ['Nguyễn Hải Anh', 'Hải Anh'],
  ['Trần Minh Châu', 'Minh Châu'],
  ['Lê Ngọc Bảo', 'Ngọc Bảo'],
  ['Phạm Thị Linh', 'Thị Linh'],
  ['Wang Yi', 'Wang Yi'],
  ['Yi', 'Yi'],
  ['  Nguyễn   Hải   Anh  ', 'Hải Anh'],
  ['Nguyễn Thị Thu Hà', 'Thu Hà'],
  ['Đỗ Mỹ Linh', 'Mỹ Linh'],
  ['', ''],
];
for (const [input, expected] of displayCases) {
  const got = getDisplayName(input);
  check(`getDisplayName("${input}") → "${expected}"`, got === expected, `nhận "${got}"`);
}
check(
  'Giữ nguyên dấu & chữ hoa tiếng Việt',
  getDisplayName('  ĐỖ   Mỹ   LINH ') === 'Mỹ LINH'
);
check(
  'Tên 3+ từ luôn lấy đúng 2 từ cuối',
  getDisplayName('Nguyễn Văn Minh Quân').split(' ').length === 2
);

// ── 15. Chất lượng bộ lời chúc ─────────────────────────────
console.log('\n--- Test 15: Bộ lời chúc 20/10 ---');
check('Có ít nhất 10 lời chúc chung', GREETINGS_DEFAULT.length >= 10, `${GREETINGS_DEFAULT.length} câu`);

const rarityEntries: Array<[string, string[]]> = [
  ['normal', GREETINGS_BY_RARITY.normal],
  ['rare', GREETINGS_BY_RARITY.rare],
  ['epic', GREETINGS_BY_RARITY.epic],
  ['secret', GREETINGS_BY_RARITY.secret],
];
for (const [name, list] of rarityEntries) {
  check(`Bộ "${name}" có ≥5 lời chúc`, list.length >= 5, `${list.length} câu`);
}

const allMessages = [
  ...GREETINGS_DEFAULT,
  ...GREETINGS_BY_RARITY.normal,
  ...GREETINGS_BY_RARITY.rare,
  ...GREETINGS_BY_RARITY.epic,
  ...GREETINGS_BY_RARITY.secret,
  ...CLOSING_WISHES,
];
check('Không có câu nào trùng lặp', new Set(allMessages).size === allMessages.length, `${allMessages.length} câu`);
check(
  'Mọi câu đều kết thúc bằng dấu câu',
  allMessages.every((m) => /[.!?…]$/.test(m.trim()))
);
check(
  'Độ dài mỗi câu hợp lý (30–400 ký tự)',
  allMessages.every((m) => m.trim().length >= 30 && m.trim().length <= 400)
);
check(
  'Câu chúc đều có dấu tiếng Việt',
  allMessages.every((m) => /[ăâêôơưđáàảãạếệốồộớờợúùủũụýỳỷỹỵ]/i.test(m))
);

// Không có hai câu nào "na ná" nhau: kiểm tra độ trùng từ (Jaccard)
const wordsOf = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[.,!?…“”"]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
let maxSimilarity = 0;
let worstPair = '';
for (let i = 0; i < allMessages.length; i++) {
  for (let j = i + 1; j < allMessages.length; j++) {
    const a = wordsOf(allMessages[i]);
    const b = wordsOf(allMessages[j]);
    let shared = 0;
    for (const w of a) if (b.has(w)) shared++;
    const union = new Set([...a, ...b]).size;
    const similarity = union === 0 ? 0 : shared / union;
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      worstPair = `"${allMessages[i].slice(0, 26)}…" / "${allMessages[j].slice(0, 26)}…"`;
    }
  }
}
check(
  'Không có hai câu nào gần giống nhau (trùng từ < 0.8)',
  maxSimilarity < 0.8,
  `cao nhất ${maxSimilarity.toFixed(2)} — ${worstPair}`
);
check('Có ít nhất 3 hồ sơ có bộ lời chúc riêng', Object.keys(RECIPIENT_GREETINGS).length >= 3);

// ── 15b. Cách mở đầu đa dạng & không nhắc chuyện tình cảm ──
console.log('\n--- Test 15b: Cách mở đầu & nội dung lời chúc ---');
const recipientMessages = Object.values(RECIPIENT_GREETINGS).flat();
const greetingOnly = [
  ...GREETINGS_DEFAULT,
  ...GREETINGS_BY_RARITY.normal,
  ...GREETINGS_BY_RARITY.rare,
  ...GREETINGS_BY_RARITY.epic,
  ...GREETINGS_BY_RARITY.secret,
  ...recipientMessages,
];

// 1) Không có từ mở đầu nào lấn át
const firstWordCounts = new Map<string, number>();
for (const message of greetingOnly) {
  const word = message.split(' ')[0];
  firstWordCounts.set(word, (firstWordCounts.get(word) ?? 0) + 1);
}
let topWord = '';
let topWordCount = 0;
for (const [word, count] of firstWordCounts) {
  if (count > topWordCount) {
    topWord = word;
    topWordCount = count;
  }
}
const maxShare = topWordCount / greetingOnly.length;
check(
  'Không có từ mở đầu nào chiếm quá 25% số câu',
  maxShare <= 0.25,
  `"${topWord}" ×${topWordCount}/${greetingOnly.length} (${(maxShare * 100).toFixed(0)}%)`
);

// 2) Nhiều kiểu mở đầu khác nhau
const twoWordOpenings = new Set(greetingOnly.map((message) => message.split(' ').slice(0, 2).join(' ')));
check(
  'Cách mở đầu đa dạng (≥70% khác nhau)',
  twoWordOpenings.size >= greetingOnly.length * 0.7,
  `${twoWordOpenings.size} kiểu mở đầu / ${greetingOnly.length} câu`
);

// 3) "Chúc bạn…/Mong bạn…" không còn là lối mở đầu chính
const formulaicOpenings = greetingOnly.filter((message) => /^(Chúc bạn|Mong bạn)/.test(message)).length;
check(
  '"Chúc bạn/Mong bạn" không còn là lối mở đầu chính (≤15%)',
  formulaicOpenings <= Math.ceil(greetingOnly.length * 0.15),
  `${formulaicOpenings}/${greetingOnly.length} câu`
);

// 4) Không nhắc chuyện tình cảm / người yêu
const romancePattern =
  /yêu thương|người yêu|người thương|tình yêu|một nửa|đôi lứa|yêu đương|hẹn hò|crush|thầm thương/i;
const romanceHits = [...allMessages, ...greetingOnly].filter((message) => romancePattern.test(message));
check(
  'Không nhắc chuyện tình cảm / người yêu',
  romanceHits.length === 0,
  romanceHits.length ? romanceHits[0].slice(0, 40) : 'sạch'
);

// ── 16. Chọn lời chúc theo lượt chơi ───────────────────────
console.log('\n--- Test 16: Chọn lời chúc ngẫu nhiên ---');
check(
  'Ưu tiên bộ riêng của hồ sơ',
  getGreetingPool('wang-yi', 'normal') === RECIPIENT_GREETINGS['wang-yi']
);
check(
  'Không có bộ riêng → dùng bộ theo bậc độ hiếm',
  getGreetingPool('khong-ton-tai', 'secret') === GREETINGS_BY_RARITY.secret
);
check('Không có bậc → dùng bộ mặc định', getGreetingPool('khong-ton-tai', undefined) === GREETINGS_DEFAULT);

resetGreetingHistory();
const sequence: string[] = [];
for (let i = 0; i < 14; i++) {
  sequence.push(pickGreeting({ recipientId: 'khach-a', rarity: 'normal', random: () => 0 }));
}
let consecutiveRepeat = false;
for (let i = 1; i < sequence.length; i++) {
  if (sequence[i] === sequence[i - 1]) consecutiveRepeat = true;
}
check('Không lặp lại liên tiếp cho cùng người nhận', !consecutiveRepeat);
check(
  'Lời chúc thay đổi giữa các lượt chơi',
  new Set(sequence).size > 1,
  `${new Set(sequence).size} câu khác nhau / ${sequence.length} lượt`
);

resetGreetingHistory();
const secretPick = pickGreeting({ recipientId: 'khach-b', rarity: 'secret', random: () => 0 });
check('Bậc Secret dùng bộ Secret', GREETINGS_BY_RARITY.secret.includes(secretPick));
check('Lời chúc đã dùng được ghi nhớ', getLastGreeting('khach-b') === secretPick);

resetGreetingHistory();
const wangPick = pickGreeting({ recipientId: 'wang-yi', rarity: 'normal', random: () => 0.9 });
check('Wang Yi dùng bộ lời chúc riêng', RECIPIENT_GREETINGS['wang-yi'].includes(wangPick));

resetGreetingHistory();
const closing = pickClosing({ recipientId: 'khach-a', random: () => 0.4 });
check('Câu kết lấy từ CLOSING_WISHES', CLOSING_WISHES.includes(closing));

// Bộ 2 phần tử luôn đổi qua lại
resetGreetingHistory();
const twoPart = RECIPIENT_GREETINGS['lan-anh'];
const picks = [
  pickGreeting({ recipientId: 'lan-anh', rarity: 'rare', random: () => 0 }),
  pickGreeting({ recipientId: 'lan-anh', rarity: 'rare', random: () => 0 }),
];
check(
  'Bộ 2 lời chúc vẫn đổi giữa hai lượt',
  picks[0] !== picks[1] && twoPart.includes(picks[0]) && twoPart.includes(picks[1]),
  picks.map((p) => p.slice(0, 18)).join(' | ')
);

// ── 17. Bố cục thiệp theo tỉ lệ màn hình ───────────────────
console.log('\n--- Test 17: Thiệp nằm gọn trong khung hình ---');
const aspectList = [0.45, 0.6, 0.75, 0.9, 1.0, 1.25, 1.4, 1.6, 1.78, 2.1, 2.4];
const tanHalfFov = Math.tan((CAMERA_FOV_DEG * Math.PI) / 180 / 2);
for (const aspect of aspectList) {
  const extent = getExpandedCardExtent(aspect);
  const camera = getCardReadCamera(aspect);
  const halfHeight = camera.distance * tanHalfFov;
  const halfWidth = halfHeight * aspect;
  const needWidth = extent.width / 2 + CARD_VIEW_MARGIN.x;
  const needHeight = extent.height / 2 + CARD_VIEW_MARGIN.y;
  const fits = halfHeight + 1e-6 >= needHeight && halfWidth + 1e-6 >= needWidth;
  check(
    `aspect ${aspect} — ${extent.spread ? '2 trang' : '1 trang'} nằm gọn`,
    fits,
    `cần ${needWidth.toFixed(2)}×${needHeight.toFixed(2)}, có ${halfWidth.toFixed(2)}×${halfHeight.toFixed(2)}`
  );
}
check('Màn hình rộng xem cả hai trang', isSpreadView(1.6) && isSpreadView(1.25));
check('Màn hình hẹp chỉ xem trang thư', !isSpreadView(1.0) && !isSpreadView(0.45));
check(
  'Camera đọc thiệp đặt thẳng trước thiệp',
  Math.abs(getCardReadCamera(1.6).position[0] - CARD_EXPANDED_VIEW.position[0]) < 1e-6 &&
    Math.abs(getCardReadCamera(1.6).position[2] - CARD_EXPANDED_VIEW.position[2]) > 2
);
check('Khoảng cách đọc tối thiểu hợp lý', getCardReadDistance(1.78) >= 2.7, `${getCardReadDistance(1.78).toFixed(2)}`);

const compactChar = getCharacterPosition('letter_reading', false);
const expandedChar = getCharacterPosition('letter_reading', true);
const wideCompactView = getCompactCardView(1.78);
const compactCardRight =
  wideCompactView.position[0] + (CARD_PANEL.width * wideCompactView.scale) / 2;
const CHARACTER_RADIUS = 0.62;
check(
  'Thiệp thu gọn không đè lên nhân vật',
  compactChar[0] - CHARACTER_RADIUS > compactCardRight,
  `thiệp tới x=${compactCardRight.toFixed(2)}, nhân vật từ x=${(compactChar[0] - CHARACTER_RADIUS).toFixed(2)}`
);
check(
  'Thiệp thu gọn (màn hẹp) cũng không đè lên nhân vật',
  getCompactCardView(0.5).position[0] + (CARD_PANEL.width * getCompactCardView(0.5).scale) / 2 <
    compactChar[0] - CHARACTER_RADIUS
);
check(
  'Thiệp mở rộng không bị nhân vật che chữ',
  Math.abs(expandedChar[0]) > CARD_PANEL.width * CARD_EXPANDED_VIEW.scale + 0.3,
  `nhân vật x=${expandedChar[0]}`
);

// Thiệp (cả hai chế độ) phải nằm trọn trong khung hình ở mọi tỉ lệ màn hình
console.log('\n--- Test 17b: Thiệp không tràn mép màn hình ---');
for (const aspect of aspectList) {
  const compactView = getCompactCardView(aspect);
  const compactFit = checkCardFits({
    view: compactView,
    camera: getCardStageCamera(aspect),
    aspect,
    spread: false,
  });
  check(
    `aspect ${aspect}: thiệp thu gọn nằm trọn khung`,
    compactFit.fits,
    `cần ${(compactFit.lateralOffset + compactFit.cardHalfWidth).toFixed(2)} ≤ ${compactFit.visibleHalfWidth.toFixed(2)} ngang, cao ${compactFit.cardHalfHeight.toFixed(2)} ≤ ${compactFit.visibleHalfHeight.toFixed(2)}`
  );

  const readCam = getCardReadCamera(aspect);
  const expandedFit = checkCardFits({
    view: CARD_EXPANDED_VIEW,
    camera: { position: readCam.position, lookAt: readCam.lookAt },
    aspect,
    spread: isSpreadView(aspect),
  });
  check(
    `aspect ${aspect}: thiệp mở rộng nằm trọn khung`,
    expandedFit.fits,
    `ngang ${(expandedFit.cardHalfWidth).toFixed(2)} ≤ ${expandedFit.visibleHalfWidth.toFixed(2)}, cao ${expandedFit.cardHalfHeight.toFixed(2)} ≤ ${expandedFit.visibleHalfHeight.toFixed(2)}`
  );
}

// ── 18. Tích hợp tên hiển thị / lời chúc / phần thưởng ──────
console.log('\n--- Test 18: Tích hợp ---');
check(
  'Họ tên đầy đủ dùng để đối chiếu, không bị cắt ngắn',
  matchRecipient('Hải Anh', RECIPIENTS) === null &&
    matchRecipient('Nguyễn Hải Anh', RECIPIENTS) === null
);
check(
  'Wang Yi vẫn khớp và tên hiển thị giữ nguyên',
  matchRecipient('Wang Yi', RECIPIENTS)?.profile.id === 'wang-yi' &&
    getDisplayName('Wang Yi') === 'Wang Yi'
);
check(
  'Nội dung thiệp ghép đúng 3 đoạn',
  composeLetterBody(['Lời chúc A', 'Ghi chú riêng B', 'Câu kết C']).split('\n\n').length === 3
);
check('Đoạn rỗng bị loại khỏi thiệp', composeLetterBody(['A', '', undefined, '  ', 'B']) === 'A\n\nB');

// Chọn lời chúc nhiều lần không được ảnh hưởng tới tỷ lệ phần thưởng
resetGreetingHistory();
for (let i = 0; i < 40; i++) {
  pickGreeting({ recipientId: 'kiem-tra', rarity: 'normal' });
  pickClosing({ recipientId: 'kiem-tra' });
}
check(
  'Tỷ lệ Wang Yi vẫn là 45/25/15/15 sau khi chọn lời chúc',
  wangOdds.normal === 45 && wangOdds.rare === 25 && wangOdds.epic === 15 && wangOdds.secret === 15
);
check(
  'Tỷ lệ các hồ sơ khác không đổi',
  normalizeOdds(lanAnh.odds || {}).secret === 0 && normalizeOdds(maiPhuong.odds || {}).secret === 5
);

// ── 19. Ruy băng & nơ ──────────────────────────────────────
console.log('\n--- Test 19: Ruy băng & nơ hộp quà ---');
const boxSize: [number, number, number] = [1.36, 0.92, 1.36];
const lidSize: [number, number, number] = [1.46, 0.2, 1.46];
const PROUD = 0.018;
const BAND = 0.22;

for (const [label, size] of [
  ['thân hộp', boxSize],
  ['nắp hộp', lidSize],
] as Array<[string, [number, number, number]]>) {
  const layout = getRibbonBandLayout(size, BAND, PROUD);
  const [w, h, d] = size;

  check(
    `${label}: dải A bám sát bốn mặt (dày ${PROUD} mỗi phía)`,
    layout.bandA.size[0] === BAND &&
      layout.bandA.size[1] === h + PROUD * 2 &&
      layout.bandA.size[2] === d + PROUD * 2
  );
  check(
    `${label}: dải B vuông góc, cùng bề rộng ruy băng`,
    layout.bandB.size[0] === w + PROUD * 2 &&
      layout.bandB.size[2] === BAND &&
      layout.bandB.size[1] === h + PROUD * 2 + 0.014
  );
  check(
    `${label}: dải B nằm TRÊN dải A (không z-fighting)`,
    layout.liftedHeight > h + PROUD * 2,
    `cao hơn ${(layout.liftedHeight - (h + PROUD * 2)).toFixed(4)}`
  );
  check(
    `${label}: vệt satin mặt nắp dải B đặt đúng trên bề mặt`,
    Math.abs(layout.topHighlightY - layout.highlightThickness / 2 - layout.liftedHeight / 2) < 1e-9
  );
  check(
    `${label}: vệt satin hai bên đặt đúng trên mặt dải A`,
    Math.abs(layout.sideHighlightY - layout.highlightThickness / 2 - (h / 2 + PROUD)) < 1e-9
  );
  check(
    `${label}: vệt sáng mặt trước nhô nhẹ khỏi mặt hộp`,
    layout.frontHighlightZ > d / 2 + PROUD
  );
  check(
    `${label}: đoạn vệt satin hai bên có độ dài dương`,
    layout.sideSegmentWidth > 0 && layout.sideSegmentWidth < w / 2
  );
}

validateGeometry('Đuôi nơ', createRibbonTailGeometry(0.4, 0.09, 0.016, 0.1));
validateGeometry('Đuôi nơ (gương)', createRibbonTailGeometry(0.34, 0.085, 0.015, -0.08));
{
  const tail = createRibbonTailGeometry(0.4, 0.09, 0.016, 0.1) as unknown as {
    computeBoundingBox: () => void;
    boundingBox: { min: { y: number }; max: { y: number } };
  };
  tail.computeBoundingBox();
  check(
    'Đuôi nơ đủ dài và có độ dày',
    Math.abs(tail.boundingBox.max.y - tail.boundingBox.min.y) > 0.3,
    `dài ${(tail.boundingBox.max.y - tail.boundingBox.min.y).toFixed(3)}`
  );
}

// ── 20. Ghép nội dung một lượt chơi (tích hợp thật) ─────────
console.log('\n--- Test 20: Chuỗi họ tên → tên hiển thị → thiệp ---');
const typedName = '  Nguyễn   Hải   Anh  ';
const matchedRegular = matchRecipient(typedName, RECIPIENTS);
const guestResult = {
  profile: {
    id: 'guest',
    officialName: 'Nguyễn Hải Anh',
    aliases: ['Nguyễn Hải Anh'],
    displayName: 'Nguyễn Hải Anh',
    letter: {
      greeting: 'Gửi {{displayName}},',
      body: 'Mong bạn luôn có những khoảng lặng nhỏ để thở.',
      signature: 'Chúc bạn ngày 20/10 thật vui!',
      postscript: '',
    },
  },
  matchedAlias: 'Nguyễn Hải Anh',
  normalizedInput: 'Nguyễn Hải Anh',
  effectiveDisplayName: 'Nguyễn Hải Anh',
};
const normalReward = REWARDS_BY_RARITY.normal[0];

resetGreetingHistory();
const content = pickPlayContent(matchedRegular ?? guestResult, normalReward);
check('Họ tên đầy đủ được giữ nguyên cho việc đối chiếu', content.fullName === 'Nguyễn Hải Anh', content.fullName);
check('Tên hiển thị = 2 từ cuối', content.displayName === 'Hải Anh', content.displayName);
check('Lời chúc thuộc bộ Thường', GREETINGS_BY_RARITY.normal.includes(content.greetingText));

const card = buildCardData({ result: guestResult, reward: normalReward, content });
check('Thiệp chào đúng tên hiển thị', card?.letter.greeting === 'Gửi Hải Anh,', card?.letter.greeting);
check(
  'Lời chúc đã chốt nằm trong nội dung thiệp',
  Boolean(card?.letter.body.includes(content.greetingText))
);
check('Câu kết đã chốt nằm trong nội dung thiệp', Boolean(card?.letter.body.includes(content.closingText)));
check(
  'Tên hiển thị KHÔNG bị dùng làm khoá đối chiếu',
  matchRecipient('Hải Anh', RECIPIENTS) === null
);

// Lượt chơi khác phải có lời chúc khác nhưng cùng phần thưởng.
// KHÔNG reset lịch sử ở đây — chính cơ chế chống lặp phải đảm bảo điều đó.
const second = pickPlayContent(guestResult, normalReward);
const secondCard = buildCardData({ result: guestResult, reward: normalReward, content: second });
check(
  'Lượt chơi sau hiển thị lời chúc khác (nhờ chống lặp)',
  second.greetingText !== content.greetingText,
  `"${content.greetingText.slice(0, 24)}…" ≠ "${second.greetingText.slice(0, 24)}…"`
);
check(
  'Nhưng phần thưởng vẫn do thuật toán tỷ lệ quyết định',
  secondCard?.companionName === card?.companionName
);
check('Lượt chơi giữ nguyên lời chúc khi đọc lại', buildCardData({ result: guestResult, reward: normalReward, content }).letter.body === card?.letter.body);
check(
  'getFullName lấy từ họ tên đã chuẩn hoá',
  getFullName(guestResult) === 'Nguyễn Hải Anh'
);

// Wang Yi: tên hiển thị giữ nguyên, lời chúc riêng, phần thưởng tối đa
resetGreetingHistory();
const wangResult = matchRecipient('Wang Yi', RECIPIENTS)!;
const wangContent = pickPlayContent(wangResult, normalReward);
check('Wang Yi giữ tên hiển thị "Wang Yi"', wangContent.displayName === 'Wang Yi');
check('Wang Yi dùng bộ lời chúc riêng', RECIPIENT_GREETINGS['wang-yi'].includes(wangContent.greetingText));
check(
  'Wang Yi: phần thưởng Secret vẫn cao nhất sau mọi thay đổi',
  normalizeOdds(wangProfile.odds || {}).secret === 15
);

if (failures > 0) {
  console.error(`\n❌ CÓ ${failures} BÀI KIỂM THỬ THẤT BẠI`);
  process.exit(1);
}
console.log('\n=== TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100% ===');
