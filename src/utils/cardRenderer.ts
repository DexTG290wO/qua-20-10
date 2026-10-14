import type { LetterConfig } from '../types/recipient';

/**
 * ─────────────────────────────────────────────────────────────
 *  Bộ vẽ thiệp 20/10 trên canvas 2D.
 *
 *  Được dùng cho:
 *   1. Texture dán lên mặt trong của tấm thiệp 3D trong scene.
 *   2. Xuất file PNG khi người dùng bấm "Lưu thiệp".
 *
 *  Ưu tiên số một là ĐỘ DỄ ĐỌC:
 *   - chữ nâu đậm / đỏ rượu trên nền giấy kem đục, tương phản cao;
 *   - cỡ chữ lớn, giãn dòng thoáng, tự động thu nhỏ nếu quá dài;
 *   - hoa trang trí chỉ nằm ở bốn góc, không bao giờ nằm sau chữ;
 *   - không dùng hiệu ứng phát sáng hay trong suốt trên mặt giấy.
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
}

// ── Bảng màu tương phản cao trên nền giấy kem ────────────────
const PAPER_TOP = '#FFFDF6';
const PAPER_MID = '#FCF6E9';
const PAPER_BOTTOM = '#F7EADB';
const INK = '#3A2A22'; // nâu đậm cho nội dung
const BURGUNDY = '#8C2F4A'; // đỏ rượu cho tiêu đề & chữ ký
const GOLD = '#C9A24D';
const BLUSH = 'rgba(199, 138, 158, 0.55)';
const MUTED = 'rgba(74, 56, 46, 0.68)';

// ── Cỡ chữ gốc (nhân với hệ số auto-fit) ─────────────────────
const SIZE_GREETING = 56;
const SIZE_BODY = 42;
const SIZE_SIGN = 40;
const SIZE_PS = 28;
const SIZE_TITLE = 21;
const SIZE_BADGE = 22;

const PAD_X = 104;
const AREA_TOP = 292;
const AREA_BOTTOM = CARD_PAGE_HEIGHT - 196;
const MAX_FIT_SCALE = 1.34;
const MIN_FIT_SCALE = 0.62;

const FONT_SERIF = (size: number, weight = 700, italic = false) =>
  `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px "Playfair Display", Georgia, serif`;
const FONT_SANS = (size: number, weight = 500) =>
  `${weight} ${Math.round(size)}px "Quicksand", system-ui, sans-serif`;

interface TextLine {
  kind: 'text' | 'divider';
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

/**
 * Nền giấy đục + viền + hoa ở bốn góc.
 * Vùng chữ (PAD_X → W-PAD_X, AREA_TOP → AREA_BOTTOM) luôn trống
 * để không có hoạ tiết nào nằm sau chữ.
 */
function drawPaperFrame(ctx: CanvasRenderingContext2D) {
  const W = CARD_PAGE_WIDTH;
  const H = CARD_PAGE_HEIGHT;

  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W * 0.35, H);
  grad.addColorStop(0, PAPER_TOP);
  grad.addColorStop(0.5, PAPER_MID);
  grad.addColorStop(1, PAPER_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Viền ngoài vàng nhạt
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 7;
  roundRect(ctx, 24, 24, W - 48, H - 48, 30);
  ctx.stroke();

  // Viền trong hồng nhạt
  ctx.strokeStyle = BLUSH;
  ctx.lineWidth = 3;
  roundRect(ctx, 44, 44, W - 88, H - 88, 22);
  ctx.stroke();

  // Hoa trang trí — CHỈ ở bốn góc, nằm ngoài vùng chữ
  drawFlower(ctx, 80, 80, 23, '#F5BFCB');
  drawFlower(ctx, W - 80, 80, 20, '#FBD8E0', '#FFE6A7');
  drawFlower(ctx, 80, H - 80, 20, '#FBD8E0', '#FFE6A7');
  drawFlower(ctx, W - 80, H - 80, 23, '#F5BFCB');

  // Lá nhỏ ở góc trên
  ctx.fillStyle = 'rgba(147, 197, 160, 0.85)';
  for (const [lx, ly, la] of [
    [128, 74, -0.5],
    [W - 128, 74, 0.5],
    [128, H - 74, 0.5],
    [W - 128, H - 74, -0.5],
  ]) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(la);
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Khối tiêu đề nhỏ ở đầu trang: nhãn bậc độ hiếm + dòng chữ dẫn. */
function drawHeader(ctx: CanvasRenderingContext2D, data: CardTextData) {
  const W = CARD_PAGE_WIDTH;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Nhãn bậc độ hiếm
  ctx.font = FONT_SANS(SIZE_BADGE, 700);
  const badge = data.rarityLabel.toUpperCase();
  const badgeW = ctx.measureText(badge).width + 56;
  ctx.fillStyle = data.rarityColor;
  roundRect(ctx, W / 2 - badgeW / 2, 96, badgeW, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(badge, W / 2, 122);

  // Dòng chữ dẫn
  ctx.font = FONT_SANS(SIZE_TITLE, 700);
  ctx.fillStyle = 'rgba(140, 47, 74, 0.78)';
  ctx.fillText('20/10 — MỘT MÓN QUÀ NHỎ DÀNH CHO BẠN', W / 2, 208);

  // Đường phân cách + hoa nhỏ ở giữa
  ctx.strokeStyle = 'rgba(201, 162, 77, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 190, 252);
  ctx.lineTo(W / 2 - 34, 252);
  ctx.moveTo(W / 2 + 34, 252);
  ctx.lineTo(W / 2 + 190, 252);
  ctx.stroke();
  drawFlower(ctx, W / 2, 252, 15, '#F5BFCB');
}

/**
 * Vẽ trang thư (mặt trong bên phải) với chữ hiện dần theo `revealChars`.
 * `Number.MAX_SAFE_INTEGER` = hiện toàn bộ (dùng khi xuất ảnh).
 */
export function drawLetterPage(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  revealChars: number
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
      SIZE_GREETING * scale * 1.32,
      30 * scale
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
        SIZE_BODY * scale * 1.55,
        idx === paragraphs.length - 1 ? 34 * scale : 22 * scale
      );
    });

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
      gapAfter: 18 * scale,
    });
    heights.push(52 * scale);
    cursor += 1;

    pushParagraph(
      data.letter.signature,
      signFont,
      BURGUNDY,
      'right',
      CARD_PAGE_WIDTH - PAD_X,
      SIZE_SIGN * scale * 1.4,
      0
    );

    if (data.letter.postscript) {
      pushParagraph(
        data.letter.postscript,
        psFont,
        MUTED,
        'left',
        PAD_X,
        SIZE_PS * scale * 1.5,
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

    if (line.kind === 'divider') {
      ctx.strokeStyle = 'rgba(201, 162, 77, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CARD_PAGE_WIDTH - PAD_X - 210, y - height * 0.35);
      ctx.lineTo(CARD_PAGE_WIDTH - PAD_X, y - height * 0.35);
      ctx.stroke();
      drawFlower(ctx, CARD_PAGE_WIDTH - PAD_X - 232, y - height * 0.35, 12, '#F5BFCB');
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

/** Vẽ trang bên trái (mặt trong) — huy hiệu người bạn đồng hành. */
export function drawCompanionPage(
  ctx: CanvasRenderingContext2D,
  data: CardTextData,
  _tint = '#FDF1F4',
  portrait?: HTMLImageElement | null
): void {
  drawPaperFrame(ctx);

  const W = CARD_PAGE_WIDTH;
  const H = CARD_PAGE_HEIGHT;
  const cx = W / 2;
  let y = 232;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = FONT_SANS(21, 700);
  ctx.fillStyle = 'rgba(140, 47, 74, 0.72)';
  ctx.fillText('NGƯỜI BẠN ĐỒNG HÀNH', cx, y);
  y += 62;

  const ringR = 158;

  if (portrait) {
    // Ảnh chân dung cắt tròn trong khung vàng
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, y + ringR, ringR - 9, 0, Math.PI * 2);
    ctx.clip();
    const scale = Math.max((ringR * 2) / portrait.width, (ringR * 2) / portrait.height);
    const w = portrait.width * scale;
    const h = portrait.height * scale;
    ctx.drawImage(portrait, cx - w / 2, y + ringR - h / 2, w, h);
    ctx.restore();
  } else {
    const grad = ctx.createRadialGradient(cx, y + ringR, 12, cx, y + ringR, ringR);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, data.themeColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, y + ringR, ringR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      ctx.save();
      ctx.translate(cx, y + ringR);
      ctx.rotate(a);
      const petal = ctx.createLinearGradient(0, 0, 0, -88);
      petal.addColorStop(0, '#FFFFFF');
      petal.addColorStop(1, data.accentColor);
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.ellipse(0, -54, 26, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#FFD97A';
    ctx.beginPath();
    ctx.arc(cx, y + ringR, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, y + ringR, ringR, 0, Math.PI * 2);
  ctx.stroke();

  y += ringR * 2 + 96;

  ctx.font = FONT_SERIF(48, 700);
  ctx.fillStyle = BURGUNDY;
  ctx.fillText(data.companionName, cx, y);
  y += 58;

  ctx.font = FONT_SANS(22, 700);
  ctx.fillStyle = data.rarityColor;
  ctx.fillText(data.rarityLabel.toUpperCase(), cx, y);
  y += 66;

  ctx.font = FONT_SANS(33, 500);
  ctx.fillStyle = INK;
  const introLines = wrapText(ctx, data.companionIntro, W - 260);
  for (const line of introLines) {
    ctx.fillText(line, cx, y);
    y += 50;
  }

  y += 34;
  ctx.font = FONT_SERIF(34, 600, true);
  ctx.fillStyle = 'rgba(140, 47, 74, 0.9)';
  const catchLines = wrapText(ctx, `“${data.companionCatchphrase}”`, W - 280);
  for (const line of catchLines) {
    ctx.fillText(line, cx, y);
    y += 48;
  }

  // Nhãn nhỏ ở đáy trang
  ctx.font = FONT_SANS(20, 500);
  ctx.fillStyle = MUTED;
  ctx.fillText('Một món quà nhỏ cho ngày 20/10', cx, H - 116);
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

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 9;
  roundRect(ctx, 28, 28, W - 56, H - 56, 34);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  roundRect(ctx, 52, 52, W - 104, H - 104, 24);
  ctx.stroke();

  // Dây hoa ở mép trên và mép dưới
  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    drawFlower(ctx, 100 + t * (W - 200), 124 + Math.sin(t * Math.PI * 3) * 22, 16, i % 2 ? '#FFFFFF' : '#F9C4D2');
    drawFlower(ctx, 100 + t * (W - 200), H - 124 - Math.sin(t * Math.PI * 3) * 22, 14, i % 2 ? '#F9C4D2' : '#FFFFFF');
  }

  const cx = W / 2;

  // Trái tim lớn ở giữa bìa
  const cy = 620;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 92);
  ctx.bezierCurveTo(cx - 152, cy - 24, cx - 70, cy - 128, cx, cy - 40);
  ctx.bezierCurveTo(cx + 70, cy - 128, cx + 152, cy - 24, cx, cy + 92);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = FONT_SERIF(72, 700);
  ctx.fillStyle = BURGUNDY;
  ctx.fillText('Happy', cx, cy + 196);
  ctx.fillText("Women's Day", cx, cy + 276);

  ctx.font = FONT_SANS(28, 700);
  ctx.fillStyle = 'rgba(140, 47, 74, 0.85)';
  ctx.fillText('20 / 10', cx, cy + 336);

  // Tên người nhận ở bìa
  ctx.font = FONT_SANS(44, 700);
  const name = data.displayName || 'bạn';
  const pillW = Math.min(W - 200, ctx.measureText(name).width + 130);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  roundRect(ctx, cx - pillW / 2, cy + 396, pillW, 86, 43);
  ctx.fill();
  ctx.fillStyle = BURGUNDY;
  ctx.fillText(`Dành tặng ${name}`, cx, cy + 456);
}

/** Tạo ảnh PNG (dataURL) gồm hai trang thiệp cạnh nhau để tải về. */
export function renderCardPng(data: CardTextData, portrait?: HTMLImageElement | null): string {
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
    drawLetterPage(rightCtx, data, Number.MAX_SAFE_INTEGER);
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
