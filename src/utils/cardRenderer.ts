import type { LetterConfig } from '../types/recipient';

/**
 * ─────────────────────────────────────────────────────────────
 *  Bộ vẽ thiệp 20/10 trên canvas 2D.
 *
 *  Được dùng cho:
 *   1. Texture dán lên mặt trong của tấm thiệp 3D trong scene.
 *   2. Xuất file PNG khi người dùng bấm "Lưu thiệp".
 *
 *  Phong cách: thiệp giấy mỹ thuật trong khu vườn hoa —
 *  kem ngà ấm, hồng phấn, đỏ rượu dịu cho tiêu đề, vàng sâm-panh
 *  cho viền/hoạ tiết. Viền MẢNH (không còn khung đôi dày), hoa lá
 *  chỉ nằm ở bốn góc nên không bao giờ tranh chữ.
 *
 *  Ưu tiên số một vẫn là ĐỘ DỄ ĐỌC:
 *   - chữ nâu đậm / đỏ rượu trên nền giấy kem, tương phản cao;
 *   - cỡ chữ lớn, giãn dòng thoáng, tự thu nhỏ vừa trang (không cắt chữ);
 *   - không dùng hiệu ứng phát sáng hay trong suốt trên mặt chữ.
 * ─────────────────────────────────────────────────────────────
 */

export const CARD_PAGE_WIDTH = 1000;
export const CARD_PAGE_HEIGHT = 1400;

export interface CardTextData {
  displayName: string;
  letter: LetterConfig;
  companionName: string;
  companionCatchphrase: string;
  companionIntro: string;
  rarityLabel: string;
  rarityColor: string;
  themeColor: string;
  accentColor: string;
  portraitUrl?: string;
  /** Ảnh 2D (chụp từ model 3D) của nhân vật trúng thưởng, in vào trang thư. */
  companionImageUrl?: string;
}

/**
 * Khung ảnh nhân vật in ở cuối trang thư. Chiều cao khối này là CỐ ĐỊNH
 * (không co theo hệ số auto-fit) nên ảnh luôn đủ lớn để nhìn, còn chữ
 * sẽ tự thu nhỏ lại để nhường chỗ.
 */
export const LETTER_PICTURE = {
  width: 320,
  height: 300,
  captionHeight: 52,
  gapAfter: 26,
};

/** Chiều cao cả khối ảnh (khung + chú thích + khoảng chừa) trong vùng chữ. */
export function getLetterPictureBlockHeight(): number {
  return LETTER_PICTURE.height + LETTER_PICTURE.captionHeight + LETTER_PICTURE.gapAfter;
}

/**
 * Bố cục trang "Người bạn đồng hành" (mặt thiệp chính sau khi nhận quà).
 * Thứ tự nội dung: tiêu đề nhỏ → chân dung → tên người nhận → tên phần
 * thưởng → nhãn bậc độ hiếm → mô tả → lời chúc → chân trang.
 */
export const COMPANION_CARD = {
  eyebrowY: 142,
  portraitTop: 182,
  portraitRadius: 158,
  textTop: 552,
  textBottom: 1246,
  footerY: 1302,
};

/**
 * Các bậc thích ứng bố cục khi lời chúc quá dài.
 * Bậc 1 là thiết kế chuẩn; nếu chữ không vừa, chân dung thu nhỏ lại và
 * vùng chữ được nới rộng (thay vì cắt bớt lời chúc hay thu chữ li ti).
 */
export interface CompanionLayoutVariant {
  portraitRadius: number;
  textTop: number;
  textBottom: number;
  showFooter: boolean;
  maxScale: number;
  minScale: number;
}

export const COMPANION_LAYOUT_VARIANTS: CompanionLayoutVariant[] = [
  { portraitRadius: 158, textTop: 552, textBottom: 1246, showFooter: true, maxScale: 1.08, minScale: 0.86 },
  { portraitRadius: 116, textTop: 480, textBottom: 1258, showFooter: true, maxScale: 1.0, minScale: 0.7 },
  { portraitRadius: 106, textTop: 468, textBottom: 1344, showFooter: false, maxScale: 0.9, minScale: 0.6 },
];

/** Bề rộng tối đa của khối chữ trên thiệp (px). */
export const COMPANION_TEXT_WIDTH = 716;

/** Kích thước ảnh nằm gọn trong khung mà KHÔNG cắt và vẫn giữ đúng tỉ lệ. */
export function fitContain(
  imgWidth: number,
  imgHeight: number,
  boxWidth: number,
  boxHeight: number
): { width: number; height: number } {
  const safeW = Math.max(1, imgWidth);
  const safeH = Math.max(1, imgHeight);
  const scale = Math.min(boxWidth / safeW, boxHeight / safeH);
  return { width: safeW * scale, height: safeH * scale };
}

// ── Bảng màu: kem ngà · hồng phấn · đỏ rượu · vàng sâm-panh ──
const PAPER_TOP = '#FFFCF6';
const PAPER_MID = '#FBF3E7';
const PAPER_BOTTOM = '#F6E9D9';
const INK = '#3B2A22'; // nâu đậm cho nội dung
const INK_SOFT = 'rgba(59, 42, 34, 0.82)';
const BURGUNDY = '#7E2C46'; // đỏ rượu dịu cho tiêu đề & chữ ký
const ROSE = '#B06A80';
const ROSE_SOFT = 'rgba(176, 106, 128, 0.45)';
const GOLD = '#C9A24D'; // vàng sâm-panh cho viền
const GOLD_SOFT = 'rgba(201, 162, 77, 0.6)';
const GOLD_FAINT = 'rgba(201, 162, 77, 0.3)';
const SAGE = 'rgba(147, 183, 158, 0.85)';
const MUTED = 'rgba(74, 56, 46, 0.66)';

// ── Cỡ chữ gốc của trang thư (nhân với hệ số auto-fit) ───────
const SIZE_GREETING = 56;
const SIZE_BODY = 42;
const SIZE_SIGN = 40;
const SIZE_PS = 28;
const SIZE_TITLE = 21;
const SIZE_BADGE = 22;

const PAD_X = 104;
const AREA_TOP = 268;
const AREA_BOTTOM = CARD_PAGE_HEIGHT - 176;
const MAX_FIT_SCALE = 1.3;
const MIN_FIT_SCALE = 0.62;

const FONT_SERIF = (size: number, weight = 700, italic = false) =>
  `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px "Playfair Display", Georgia, serif`;
const FONT_SANS = (size: number, weight = 500) =>
  `${weight} ${Math.round(size)}px "Quicksand", system-ui, sans-serif`;

interface TextLine {
  kind: 'text' | 'divider' | 'picture';
  text: string;
  font: string;
  color: string;
  start: number;
  end: number;
  align: 'left' | 'right' | 'center';
  x: number;
  gapAfter: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, paragraph: string, maxWidth: number): string[] {
  const words = paragraph.split(' ').filter((w) => w.length > 0);
  const out: string[] = [];
  if (words.length === 0) return out;

  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Chữ có giãn ký tự (nhãn nhỏ, chân trang) — căn giữa theo tâm. */
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
  font: string,
  color: string
) {
  const prevAlign = ctx.textAlign;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';

  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let x = cx - total / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i];
  }
  ctx.textAlign = prevAlign;
}

/** Vẽ một bông hoa 5 cánh nhỏ (chỉ dùng ở góc / đường phân cách). */
function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  petal: string,
  core = '#FFD97A'
) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(a) * r * 0.7,
      y + Math.sin(a) * r * 0.7,
      r * 0.52,
      r * 0.38,
      a,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
}

/** Chiếc lá nhỏ nghiêng theo góc cho trước. */
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  color = SAGE
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, length, length * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Tia sáng 4 cánh nhỏ (sparkle) — chỉ điểm xuyết, không phát sáng. */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Đường phân cách mảnh: hai nhánh vàng + hoa nhỏ ở giữa. */
function drawDividerFlourish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  halfWidth = 168,
  flowerR = 13
) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx - halfWidth, y, cx - 30, y);
  grad.addColorStop(0, 'rgba(201, 162, 77, 0)');
  grad.addColorStop(1, 'rgba(201, 162, 77, 0.75)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - halfWidth, y);
  ctx.lineTo(cx - 34, y);
  ctx.stroke();

  const grad2 = ctx.createLinearGradient(cx + 30, y, cx + halfWidth, y);
  grad2.addColorStop(0, 'rgba(201, 162, 77, 0.75)');
  grad2.addColorStop(1, 'rgba(201, 162, 77, 0)');
  ctx.strokeStyle = grad2;
  ctx.beginPath();
  ctx.moveTo(cx + 34, y);
  ctx.lineTo(cx + halfWidth, y);
  ctx.stroke();

  drawSparkle(ctx, cx - 30, y, 6, GOLD_SOFT);
  drawSparkle(ctx, cx + 30, y, 6, GOLD_SOFT);
  drawFlower(ctx, cx, y, flowerR, '#F5BFCB');
  ctx.restore();
}

/** Hạt giấy + sợi giấy rất mịn cho chất liệu giấy mỹ thuật (matte). */
function paintPaperSurface(ctx: CanvasRenderingContext2D) {
  const W = CARD_PAGE_WIDTH;
  const H = CARD_PAGE_HEIGHT;

  const grad = ctx.createLinearGradient(0, 0, W * 0.35, H);
  grad.addColorStop(0, PAPER_TOP);
  grad.addColorStop(0.5, PAPER_MID);
  grad.addColorStop(1, PAPER_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Nhiễu giấy tất định (cùng một thiệp luôn ra cùng một texture)
  let seed = 20251020;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 620; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 0.5 + rand() * 1.1;
    ctx.fillStyle = rand() > 0.45 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(186, 160, 124, 0.1)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(198, 172, 138, 0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const len = 60 + rand() * 180;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y + (rand() - 0.5) * 9, x + len, y);
    ctx.stroke();
  }

  // Viền mờ rất nhẹ ở rìa để mắt tập trung vào giữa trang
  const vignette = ctx.createRadialGradient(W / 2, H * 0.44, H * 0.3, W / 2, H * 0.5, H * 0.86);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
  vignette.addColorStop(1, 'rgba(196, 160, 124, 0.11)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

// Nền giấy được vẽ một lần rồi tái sử dụng — trang thư còn vẽ lại
// từng nhịp gõ chữ nên không thể dựng lại 600 hạt giấy mỗi nhịp.
let paperBackgroundCache: HTMLCanvasElement | null = null;

function getPaperBackground(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (paperBackgroundCache) return paperBackgroundCache;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_PAGE_WIDTH;
  canvas.height = CARD_PAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  paintPaperSurface(ctx);
  paperBackgroundCache = canvas;
  return canvas;
}

/**
 * Nền giấy đục + viền mảnh + hoa ở bốn góc.
 * Vùng chữ luôn trống để không có hoạ tiết nào nằm sau chữ.
 */
function drawPaperFrame(ctx: CanvasRenderingContext2D) {
  const W = CARD_PAGE_WIDTH;
  const H = CARD_PAGE_HEIGHT;

  ctx.clearRect(0, 0, W, H);

  const background = getPaperBackground();
  if (background && typeof ctx.drawImage === 'function') {
    ctx.drawImage(background, 0, 0);
  } else {
    paintPaperSurface(ctx);
  }

  // Viền mảnh vàng sâm-panh (thay cho khung đôi dày trước đây)
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.4;
  roundRect(ctx, 26, 26, W - 52, H - 52, 26);
  ctx.stroke();

  // Chỉ một đường hairline mờ bên trong để viền có chiều sâu, không chồng khung
  ctx.strokeStyle = GOLD_FAINT;
  ctx.lineWidth = 1;
  roundRect(ctx, 36, 36, W - 72, H - 72, 20);
  ctx.stroke();
  ctx.restore();

  drawCornerSprigs(ctx);
}

/** Cụm hoa lá nhỏ ở bốn góc — bốn góc đối xứng nhưng khác sắc độ. */
function drawCornerSprigs(ctx: CanvasRenderingContext2D) {
  const W = CARD_PAGE_WIDTH;
  const H = CARD_PAGE_HEIGHT;
  const corners: Array<[number, number, number, number, string, string]> = [
    [0, 0, 1, 1, '#F5BFCB', '#FBD8E0'],
    [W, 0, -1, 1, '#FBD8E0', '#F5BFCB'],
    [0, H, 1, -1, '#FBD8E0', '#F5BFCB'],
    [W, H, -1, -1, '#F5BFCB', '#FBD8E0'],
  ];

  for (const [ox, oy, sx, sy, petalA, petalB] of corners) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(sx, sy);

    drawLeaf(ctx, 68, 36, -0.5, 32);
    drawLeaf(ctx, 42, 72, 0.42, 26);
    drawFlower(ctx, 38, 38, 17, petalA);
    drawFlower(ctx, 76, 24, 10, petalB, '#FFE6A7');
    drawSparkle(ctx, 26, 88, 9, GOLD_SOFT);
    drawSparkle(ctx, 102, 58, 7, 'rgba(255, 255, 255, 0.95)');

    ctx.restore();
  }
}

/** Khối tiêu đề nhỏ ở đầu trang thư: nhãn bậc độ hiếm + dòng chữ dẫn. */
function drawHeader(ctx: CanvasRenderingContext2D, data: CardTextData) {
  const W = CARD_PAGE_WIDTH;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Nhãn bậc độ hiếm — viên thuốc mảnh, có viền vàng mờ bao ngoài
  ctx.font = FONT_SANS(SIZE_BADGE, 700);
  const badge = data.rarityLabel.toUpperCase();
  const badgeH = 46;
  const badgeW = Math.max(150, ctx.measureText(badge).width + 72);
  const bx = W / 2 - badgeW / 2;
  const by = 84;

  ctx.save();
  ctx.shadowColor = 'rgba(126, 44, 70, 0.16)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = data.rarityColor;
  roundRect(ctx, bx, by, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.4;
  roundRect(ctx, bx - 5, by - 5, badgeW + 10, badgeH + 10, (badgeH + 10) / 2);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(badge, W / 2, by + badgeH / 2 + 1);

  // Dòng chữ dẫn
  ctx.font = FONT_SANS(SIZE_TITLE, 700);
  ctx.fillStyle = 'rgba(126, 44, 70, 0.82)';
  ctx.fillText('20/10 — MỘT MÓN QUÀ NHỎ DÀNH CHO BẠN', W / 2, 196);

  // Đường phân cách + hoa nhỏ ở giữa
  drawDividerFlourish(ctx, W / 2, 238, 168, 13);
}

/**
 * Khung ảnh nhân vật trúng thưởng in ở cuối trang thư.
 * Ảnh là hình 2D chụp từ chính model 3D (xem CharacterSnapshot.tsx) nên
 * vẫn đúng nhân vật và đúng màu bậc độ hiếm. Nếu chưa có ảnh (chụp lỗi)
 * thì vẽ huy hiệu hoa dự phòng — khối này không bao giờ trống.
 */
function drawLetterPicture(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  cx: number,
  top: number,
  picture?: HTMLImageElement | null
): void {
  const W = LETTER_PICTURE.width;
  const H = LETTER_PICTURE.height;
  const x = cx - W / 2;

  // Bóng đổ mềm + nền giấy trắng
  ctx.save();
  ctx.shadowColor = 'rgba(126, 44, 70, 0.16)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, x, top, W, H, 20);
  ctx.fill();
  ctx.restore();

  // Viền vàng mảnh như khung ảnh
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.6;
  roundRect(ctx, x, top, W, H, 20);
  ctx.stroke();
  ctx.strokeStyle = GOLD_FAINT;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 7, top + 7, W - 14, H - 14, 14);
  ctx.stroke();

  // Vùng ảnh bên trong khung
  const pad = 13;
  const innerX = x + pad;
  const innerY = top + pad;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  ctx.save();
  roundRect(ctx, innerX, innerY, innerW, innerH, 13);
  ctx.clip();

  const grad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, data.themeColor);
  ctx.fillStyle = grad;
  ctx.fillRect(innerX, innerY, innerW, innerH);

  if (picture) {
    const fit = fitContain(picture.width, picture.height, innerW, innerH);
    ctx.drawImage(
      picture,
      innerX + (innerW - fit.width) / 2,
      innerY + (innerH - fit.height) / 2,
      fit.width,
      fit.height
    );
  } else {
    // Dự phòng: bó hoa nhỏ giữa khung
    const fx = innerX + innerW / 2;
    const fy = innerY + innerH / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(fx, fy, 62, 0, Math.PI * 2);
    ctx.fill();
    drawFlower(ctx, fx, fy, 54, '#F5BFCB');
  }
  ctx.restore();

  // Chú thích: tên nhân vật đồng hành
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = FONT_SANS(24, 700);
  ctx.fillStyle = BURGUNDY;
  ctx.fillText(data.companionName, cx, top + H + 36);
}

/**
 * Vẽ trang thư (mặt trong bên phải) với chữ hiện dần theo `revealChars`.
 * `Number.MAX_SAFE_INTEGER` = hiện toàn bộ (dùng khi xuất ảnh).
 * `picture` là ảnh 2D của nhân vật, in vào khối cuối trang.
 */
export function drawLetterPage(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  revealChars: number,
  picture?: HTMLImageElement | null
): void {
  drawPaperFrame(ctx);
  drawHeader(ctx, data);

  const maxWidth = CARD_PAGE_WIDTH - PAD_X * 2;

  // ── Tính layout ở một hệ số cỡ chữ nhất định ──
  const layoutAt = (scale: number) => {
    const greetingFont = FONT_SERIF(SIZE_GREETING * scale, 700);
    const bodyFont = FONT_SANS(SIZE_BODY * scale, 500);
    const signFont = FONT_SERIF(SIZE_SIGN * scale, 600, true);
    const psFont = FONT_SANS(SIZE_PS * scale, 500);

    const lines: TextLine[] = [];
    const heights: number[] = [];
    let cursor = 0;

    const pushText = (
      font: string,
      color: string,
      align: 'left' | 'right' | 'center',
      x: number,
      text: string,
      height: number,
      gapAfter = 0
    ) => {
      lines.push({
        kind: 'text',
        text,
        font,
        color,
        start: cursor,
        end: cursor + text.length,
        align,
        x,
        gapAfter,
      });
      heights.push(height);
      cursor += text.length + 1;
    };

    const pushParagraph = (
      raw: string,
      font: string,
      color: string,
      align: 'left' | 'right' | 'center',
      x: number,
      lineHeight: number,
      paragraphGap: number
    ) => {
      ctx.font = font;
      const wrapped = wrapText(ctx, raw, maxWidth);
      wrapped.forEach((line, idx) => {
        pushText(
          font,
          color,
          align,
          x,
          line,
          lineHeight,
          idx === wrapped.length - 1 ? paragraphGap : 0
        );
      });
    };

    pushParagraph(
      data.letter.greeting,
      greetingFont,
      BURGUNDY,
      'left',
      PAD_X,
      SIZE_GREETING * scale * 1.3,
      34 * scale
    );

    const paragraphs = (data.letter.body ?? '')
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    paragraphs.forEach((paragraph, idx) => {
      pushParagraph(
        paragraph,
        bodyFont,
        INK,
        'left',
        PAD_X,
        SIZE_BODY * scale * 1.62,
        idx === paragraphs.length - 1 ? 38 * scale : 26 * scale
      );
    });

    // Khối ảnh nhân vật — đặt ngay sau phần nội dung, trước chữ ký.
    // Chiều cao cố định nên auto-fit sẽ thu chữ lại để nhường chỗ.
    lines.push({
      kind: 'picture',
      text: '🖼',
      font: bodyFont,
      color: INK,
      start: cursor,
      end: cursor + 1,
      align: 'center',
      x: CARD_PAGE_WIDTH / 2,
      gapAfter: LETTER_PICTURE.gapAfter,
    });
    heights.push(getLetterPictureBlockHeight());
    cursor += 1;

    // Đường phân cách trước chữ ký
    lines.push({
      kind: 'divider',
      text: '─',
      font: bodyFont,
      color: GOLD,
      start: cursor,
      end: cursor + 1,
      align: 'right',
      x: CARD_PAGE_WIDTH - PAD_X,
      gapAfter: 20 * scale,
    });
    heights.push(52 * scale);
    cursor += 1;

    pushParagraph(
      data.letter.signature,
      signFont,
      BURGUNDY,
      'right',
      CARD_PAGE_WIDTH - PAD_X,
      SIZE_SIGN * scale * 1.46,
      0
    );

    if (data.letter.postscript) {
      pushParagraph(
        data.letter.postscript,
        psFont,
        MUTED,
        'left',
        PAD_X,
        SIZE_PS * scale * 1.55,
        0
      );
    }

    const total = heights.reduce((a, b) => a + b, 0);
    return { lines, heights, total };
  };

  // ── Tự chọn cỡ chữ lớn nhất mà vẫn nằm gọn trong trang ──
  const areaHeight = AREA_BOTTOM - AREA_TOP;
  let scale = MAX_FIT_SCALE;
  let layout = layoutAt(scale);
  while (layout.total > areaHeight && scale > MIN_FIT_SCALE) {
    scale = Math.max(MIN_FIT_SCALE, scale * 0.96);
    layout = layoutAt(scale);
  }

  let y = AREA_TOP + Math.max(0, (areaHeight - layout.total) / 2);

  // ── Vẽ ──
  ctx.textBaseline = 'alphabetic';

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const height = layout.heights[i];
    y += height;

    if (line.start >= revealChars) break;

    if (line.kind === 'picture') {
      drawLetterPicture(ctx, data, line.x, y - height, picture);
      continue;
    }

    if (line.kind === 'divider') {
      const dy = y - height * 0.35;
      ctx.strokeStyle = GOLD_SOFT;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(CARD_PAGE_WIDTH - PAD_X - 210, dy);
      ctx.lineTo(CARD_PAGE_WIDTH - PAD_X, dy);
      ctx.stroke();
      drawFlower(ctx, CARD_PAGE_WIDTH - PAD_X - 232, dy, 11, '#F5BFCB');
      continue;
    }

    const visible = Math.min(line.end, revealChars) - line.start;
    const partial = visible >= line.text.length ? line.text : line.text.slice(0, Math.max(0, visible));
    if (!partial) continue;

    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.textAlign = line.align;
    ctx.fillText(partial, line.x, y);

    // Con trỏ nhấp nháy ở chữ đang gõ
    if (visible < line.text.length && Math.floor(Date.now() / 400) % 2 === 0) {
      const w = ctx.measureText(partial).width;
      const cx = line.align === 'right' ? line.x - w : line.x + w;
      ctx.fillStyle = BURGUNDY;
      ctx.fillRect(cx + 4, y - height * 0.58, 4, height * 0.62);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  Trang "Người bạn đồng hành" — MẶT THIỆP CHÍNH sau khi nhận quà
// ─────────────────────────────────────────────────────────────

/** Cỡ chữ gốc trước khi nhân hệ số auto-fit. */
const COMPANION_SIZE = {
  name: 50,
  reward: 37,
  badge: 20,
  desc: 25,
  greet: 32,
};

interface CompanionLayout {
  scale: number;
  total: number;
  nameLines: string[];
  rewardLines: string[];
  descLines: string[];
  greetLines: string[];
  nameFont: string;
  rewardFont: string;
  badgeFont: string;
  descFont: string;
  greetFont: string;
  nameLh: number;
  rewardLh: number;
  descLh: number;
  greetLh: number;
  badgeH: number;
  gapNameReward: number;
  gapRewardBadge: number;
  gapBadgeDesc: number;
  gapDescDivider: number;
  dividerH: number;
  gapDividerGreet: number;
  greetSize: number;
}

/**
 * Đo toàn bộ khối chữ của mặt thiệp ở một hệ số cỡ chữ.
 * Hàm thuần theo `ctx` (chỉ đọc `measureText`) nên đo được nhiều lần
 * để chọn hệ số lớn nhất mà nội dung vẫn nằm gọn trong trang.
 */
function measureCompanionLayout(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  scale: number
): CompanionLayout {
  const maxWidth = COMPANION_TEXT_WIDTH;
  const nameFont = FONT_SERIF(COMPANION_SIZE.name * scale, 700);
  const rewardFont = FONT_SERIF(COMPANION_SIZE.reward * scale, 600);
  const badgeFont = FONT_SANS(COMPANION_SIZE.badge * scale, 700);
  const descFont = FONT_SANS(COMPANION_SIZE.desc * scale, 500);
  const greetFont = FONT_SERIF(COMPANION_SIZE.greet * scale, 600, true);

  ctx.font = nameFont;
  const nameLines = wrapText(ctx, data.displayName || 'bạn', maxWidth);
  ctx.font = rewardFont;
  const rewardLines = wrapText(ctx, data.companionName, maxWidth);
  ctx.font = descFont;
  const descLines = wrapText(ctx, data.companionIntro, maxWidth);
  ctx.font = greetFont;
  const greetLines = wrapText(ctx, `“${data.companionCatchphrase}”`, maxWidth - 36);

  const nameLh = COMPANION_SIZE.name * scale * 1.22;
  const rewardLh = COMPANION_SIZE.reward * scale * 1.3;
  const descLh = COMPANION_SIZE.desc * scale * 1.56;
  const greetLh = COMPANION_SIZE.greet * scale * 1.62;
  const badgeH = 46 * scale;
  const gapNameReward = 10 * scale;
  const gapRewardBadge = 14 * scale;
  const gapBadgeDesc = 30 * scale;
  const gapDescDivider = 30 * scale;
  const dividerH = 30 * scale;
  const gapDividerGreet = 26 * scale;

  const total =
    nameLines.length * nameLh +
    gapNameReward +
    rewardLines.length * rewardLh +
    gapRewardBadge +
    badgeH +
    gapBadgeDesc +
    descLines.length * descLh +
    gapDescDivider +
    dividerH +
    gapDividerGreet +
    greetLines.length * greetLh;

  return {
    scale,
    total,
    nameLines,
    rewardLines,
    descLines,
    greetLines,
    nameFont,
    rewardFont,
    badgeFont,
    descFont,
    greetFont,
    nameLh,
    rewardLh,
    descLh,
    greetLh,
    badgeH,
    gapNameReward,
    gapRewardBadge,
    gapBadgeDesc,
    gapDescDivider,
    dividerH,
    gapDividerGreet,
    greetSize: COMPANION_SIZE.greet * scale,
  };
}

/** Nhãn bậc độ hiếm dạng viên thuốc, màu theo bậc (Thường/Hiếm/Sử thi/Secret). */
function drawRarityPill(
  ctx: CanvasRenderingContext2D,
  label: string,
  cx: number,
  top: number,
  height: number,
  color: string,
  font: string
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  const text = label.toUpperCase();
  const width = Math.max(140, ctx.measureText(text).width + 66);

  ctx.shadowColor = 'rgba(126, 44, 70, 0.18)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  roundRect(ctx, cx - width / 2, top, width, height, height / 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.4;
  roundRect(ctx, cx - width / 2 - 5, top - 5, width + 10, height + 10, (height + 10) / 2);
  ctx.stroke();

  drawSparkle(ctx, cx - width / 2 - 20, top + height / 2, 7, GOLD_SOFT);
  drawSparkle(ctx, cx + width / 2 + 20, top + height / 2, 7, GOLD_SOFT);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, cx, top + height / 2 + 1);
}

/** Chân dung tròn trong khung vàng mảnh + quầng sáng hồng rất dịu. */
function drawPortraitMedallion(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  cx: number,
  cy: number,
  radius: number,
  portrait?: HTMLImageElement | null
) {
  // Quầng sáng hồng phấn phía sau (không chiếu lên chữ)
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.42, cx, cy, radius * 1.62);
  glow.addColorStop(0, 'rgba(249, 196, 210, 0.5)');
  glow.addColorStop(0.62, 'rgba(249, 196, 210, 0.16)');
  glow.addColorStop(1, 'rgba(249, 196, 210, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.62, 0, Math.PI * 2);
  ctx.fill();

  // Đĩa trắng + bóng mềm giúp chân dung tách khỏi nền giấy
  ctx.save();
  ctx.shadowColor = 'rgba(126, 44, 70, 0.2)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ảnh chân dung — cắt tròn kiểu "cover", giữ đúng tỉ lệ (không bóp méo)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (portrait && portrait.width > 0 && portrait.height > 0) {
    const scale = Math.max((radius * 2) / portrait.width, (radius * 2) / portrait.height);
    const w = portrait.width * scale;
    const h = portrait.height * scale;
    ctx.drawImage(portrait, cx - w / 2, cy - h / 2, w, h);
  } else {
    // Dự phòng: đoá hoa pastel vẽ bằng gradient theo màu phần thưởng
    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, radius);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, data.themeColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      const petal = ctx.createLinearGradient(0, 0, 0, -radius * 0.62);
      petal.addColorStop(0, '#FFFFFF');
      petal.addColorStop(1, data.accentColor);
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.42, radius * 0.19, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawFlower(ctx, cx, cy, radius * 0.3, '#FFF0F4', '#FFD97A');
  }
  ctx.restore();

  // Viền: vàng mảnh bên ngoài + hairline hồng bên trong
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = ROSE_SOFT;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // Hoa nhỏ ở hai bên chân dung + vài tia sáng
  drawFlower(ctx, cx - radius - 6, cy + radius - 30, 12, '#F5BFCB');
  drawFlower(ctx, cx + radius + 6, cy + radius - 30, 12, '#FBD8E0', '#FFE6A7');
  drawSparkle(ctx, cx - radius * 0.74, cy - radius * 0.8, 10, GOLD_SOFT);
  drawSparkle(ctx, cx + radius * 0.8, cy - radius * 0.58, 8, 'rgba(255, 255, 255, 0.95)');
}

/**
 * Vẽ mặt thiệp chính: "Người bạn đồng hành".
 *
 * Thứ tự nội dung (theo thiết kế):
 *   1. Tiêu đề nhỏ "NGƯỜI BẠN ĐỒNG HÀNH"
 *   2. Chân dung người nhận (khung tròn vàng mảnh)
 *   3. Tên hiển thị của người nhận
 *   4. Tên phần thưởng + nhãn bậc độ hiếm
 *   5. Mô tả ngắn về nhân vật
 *   6. Lời chúc riêng (in nghiêng, là tâm điểm cảm xúc)
 *   7. Chân trang "Một món quà nhỏ cho ngày 20/10"
 */
export function drawCompanionPage(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  _tint = '#FDF1F4',
  portrait?: HTMLImageElement | null
): void {
  drawPaperFrame(ctx);

  const W = CARD_PAGE_WIDTH;
  const cx = W / 2;

  ctx.textBaseline = 'alphabetic';

  // 1. Tiêu đề nhỏ
  drawSpacedText(ctx, 'NGƯỜI BẠN ĐỒNG HÀNH', cx, COMPANION_CARD.eyebrowY, 4, FONT_SANS(19, 700), ROSE);

  ctx.save();
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 252, COMPANION_CARD.eyebrowY + 18);
  ctx.lineTo(cx - 96, COMPANION_CARD.eyebrowY + 18);
  ctx.moveTo(cx + 96, COMPANION_CARD.eyebrowY + 18);
  ctx.lineTo(cx + 252, COMPANION_CARD.eyebrowY + 18);
  ctx.stroke();
  drawFlower(ctx, cx - 72, COMPANION_CARD.eyebrowY + 18, 6, '#F9C4D2');
  drawFlower(ctx, cx + 72, COMPANION_CARD.eyebrowY + 18, 6, '#F9C4D2');
  drawSparkle(ctx, cx, COMPANION_CARD.eyebrowY + 18, 7, GOLD_SOFT);
  ctx.restore();

  // Chọn bậc bố cục: ưu tiên thiết kế chuẩn, chỉ thu nhỏ chân dung / nới
  // vùng chữ khi lời chúc quá dài — không bao giờ cắt bớt lời chúc.
  let variant = COMPANION_LAYOUT_VARIANTS[0];
  let available = variant.textBottom - variant.textTop;
  let layout = measureCompanionLayout(ctx, data, variant.maxScale);
  for (const candidate of COMPANION_LAYOUT_VARIANTS) {
    const area = candidate.textBottom - candidate.textTop;
    let scale = candidate.maxScale;
    let measured = measureCompanionLayout(ctx, data, scale);
    while (measured.total > area && scale > candidate.minScale) {
      scale = Math.max(candidate.minScale, scale - 0.03);
      measured = measureCompanionLayout(ctx, data, scale);
    }
    variant = candidate;
    available = area;
    layout = measured;
    if (measured.total <= area) break;
  }

  // 2. Chân dung
  const radius = variant.portraitRadius;
  const portraitCy = COMPANION_CARD.portraitTop + radius;
  drawPortraitMedallion(ctx, data, cx, portraitCy, radius, portrait);

  // 3 → 6. Khối chữ
  let y = variant.textTop + Math.max(0, (available - layout.total) / 2);

  ctx.textAlign = 'center';

  // 3. Tên người nhận — serif, đỏ rượu, điểm nhấn nhưng không lấn lời chúc
  ctx.font = layout.nameFont;
  ctx.fillStyle = BURGUNDY;
  for (const line of layout.nameLines) {
    y += layout.nameLh;
    ctx.fillText(line, cx, y - layout.nameLh * 0.26);
  }
  // Gạch chân mảnh dưới tên
  const nameWidth = Math.max(
    ...layout.nameLines.map((l) => {
      ctx.font = layout.nameFont;
      return ctx.measureText(l).width;
    }),
    120
  );
  const underlineY = y + 6;
  drawDividerFlourish(ctx, cx, underlineY, Math.min(150, nameWidth * 0.72), 8);

  y += layout.gapNameReward;

  // 4a. Tên phần thưởng
  ctx.font = layout.rewardFont;
  ctx.fillStyle = INK;
  for (const line of layout.rewardLines) {
    y += layout.rewardLh;
    ctx.fillText(line, cx, y - layout.rewardLh * 0.26);
  }

  y += layout.gapRewardBadge;

  // 4b. Nhãn bậc độ hiếm
  drawRarityPill(ctx, data.rarityLabel, cx, y, layout.badgeH, data.rarityColor, layout.badgeFont);
  y += layout.badgeH;

  y += layout.gapBadgeDesc;

  // 5. Mô tả nhân vật — nhỏ hơn lời chúc, nâu dịu
  ctx.font = layout.descFont;
  ctx.fillStyle = INK_SOFT;
  for (const line of layout.descLines) {
    y += layout.descLh;
    ctx.fillText(line, cx, y - layout.descLh * 0.26);
  }

  y += layout.gapDescDivider;
  drawDividerFlourish(ctx, cx, y + layout.dividerH * 0.4, 130, 11);
  y += layout.dividerH;

  y += layout.gapDividerGreet;

  // 6. Lời chúc — tâm điểm cảm xúc, in nghiêng serif
  const greetStartY = y;
  ctx.font = layout.greetFont;
  ctx.fillStyle = BURGUNDY;
  for (const line of layout.greetLines) {
    y += layout.greetLh;
    ctx.fillText(line, cx, y - layout.greetLh * 0.26);
  }
  const greetEndY = y - layout.greetLh * 0.26;

  // Dấu ngoặc kép trang trí hai đầu lời chúc (rất nhẹ, không đè chữ)
  ctx.save();
  ctx.font = FONT_SERIF(layout.greetSize * 1.85, 700);
  ctx.fillStyle = 'rgba(201, 162, 77, 0.34)';
  const widest = Math.max(
    ...layout.greetLines.map((l) => {
      ctx.font = layout.greetFont;
      return ctx.measureText(l).width;
    }),
    120
  );
  ctx.textAlign = 'right';
  ctx.fillText('“', cx - widest / 2 - 10, greetStartY + layout.greetLh * 0.6);
  ctx.textAlign = 'left';
  ctx.fillText('”', cx + widest / 2 + 10, greetEndY + layout.greetLh * 0.42);
  ctx.restore();

  // 7. Chân trang (bỏ khi lời chúc dài đã chiếm trọn trang)
  if (variant.showFooter) {
    drawDividerFlourish(ctx, cx, COMPANION_CARD.footerY - 26, 120, 9);
    drawSpacedText(
      ctx,
      'MỘT MÓN QUÀ NHỎ CHO NGÀY 20/10',
      cx,
      COMPANION_CARD.footerY,
      3.2,
      FONT_SANS(18, 600),
      MUTED
    );
  }
}

/** Vẽ bìa ngoài của tấm thiệp. */
export function drawCoverPanel(ctx: CanvasRenderingContext2D, data: CardTextData): void {
  const W = CARD_PAGE_WIDTH;
  const H = CARD_PAGE_HEIGHT;
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, data.themeColor);
  grad.addColorStop(0.65, '#FBDDE6');
  grad.addColorStop(1, data.accentColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Viền mảnh (thay khung đôi dày cũ)
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3.6;
  roundRect(ctx, 26, 26, W - 52, H - 52, 32);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, 38, 38, W - 76, H - 76, 26);
  ctx.stroke();

  // Dây hoa thưa ở mép trên và mép dưới
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    drawFlower(ctx, 120 + t * (W - 240), 122 + Math.sin(t * Math.PI * 3) * 18, 14, i % 2 ? '#FFFFFF' : '#F9C4D2');
    drawFlower(ctx, 120 + t * (W - 240), H - 122 - Math.sin(t * Math.PI * 3) * 18, 12, i % 2 ? '#F9C4D2' : '#FFFFFF');
  }

  const cx = W / 2;

  // Trái tim lớn ở giữa bìa
  const cy = 620;
  ctx.save();
  ctx.shadowColor = 'rgba(126, 44, 70, 0.18)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 92);
  ctx.bezierCurveTo(cx - 152, cy - 24, cx - 70, cy - 128, cx, cy - 40);
  ctx.bezierCurveTo(cx + 70, cy - 128, cx + 152, cy - 24, cx, cy + 92);
  ctx.fill();
  ctx.restore();

  // Vòng hoa nhỏ quanh trái tim
  drawFlower(ctx, cx - 96, cy - 74, 15, '#FBD8E0');
  drawFlower(ctx, cx + 96, cy - 74, 15, '#FBD8E0');
  drawLeaf(ctx, cx - 124, cy - 40, -0.6, 24);
  drawLeaf(ctx, cx + 124, cy - 40, 0.6, 24);

  ctx.textAlign = 'center';
  ctx.font = FONT_SERIF(72, 700);
  ctx.fillStyle = BURGUNDY;
  ctx.fillText('Happy', cx, cy + 196);
  ctx.fillText("Women's Day", cx, cy + 276);

  ctx.font = FONT_SANS(28, 700);
  ctx.fillStyle = 'rgba(126, 44, 70, 0.85)';
  ctx.fillText('20 / 10', cx, cy + 336);

  // Tên người nhận ở bìa
  ctx.font = FONT_SANS(44, 700);
  const name = data.displayName || 'bạn';
  const pillW = Math.min(W - 200, ctx.measureText(name).width + 130);
  ctx.save();
  ctx.shadowColor = 'rgba(126, 44, 70, 0.14)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  roundRect(ctx, cx - pillW / 2, cy + 396, pillW, 86, 43);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.4;
  roundRect(ctx, cx - pillW / 2, cy + 396, pillW, 86, 43);
  ctx.stroke();

  ctx.fillStyle = BURGUNDY;
  ctx.fillText(`Dành tặng ${name}`, cx, cy + 456);
}

/** Tạo ảnh PNG (dataURL) gồm hai trang thiệp cạnh nhau để tải về. */
export function renderCardPng(
  data: CardTextData,
  portrait?: HTMLImageElement | null,
  picture?: HTMLImageElement | null
): string {
  const out = document.createElement('canvas');
  out.width = CARD_PAGE_WIDTH * 2 + 60;
  out.height = CARD_PAGE_HEIGHT + 80;
  const ctx = out.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFF7FA';
  ctx.fillRect(0, 0, out.width, out.height);

  const left = document.createElement('canvas');
  left.width = CARD_PAGE_WIDTH;
  left.height = CARD_PAGE_HEIGHT;
  const leftCtx = left.getContext('2d');
  if (leftCtx) {
    drawCompanionPage(leftCtx, data, '#FDF1F4', portrait);
    ctx.drawImage(left, 20, 40);
  }

  const right = document.createElement('canvas');
  right.width = CARD_PAGE_WIDTH;
  right.height = CARD_PAGE_HEIGHT;
  const rightCtx = right.getContext('2d');
  if (rightCtx) {
    drawLetterPage(rightCtx, data, Number.MAX_SAFE_INTEGER, picture);
    ctx.drawImage(right, CARD_PAGE_WIDTH + 40, 40);
  }

  return out.toDataURL('image/png');
}

/** Tải ảnh (chân dung) về dưới dạng HTMLImageElement. */
export function loadImage(url: string, timeoutMs = 4000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    let settled = false;
    const done = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      done(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/** Đợi font Google tải xong rồi mới vẽ canvas (tránh chữ bị fallback). */
export function whenFontsReady(timeoutMs = 1500): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
