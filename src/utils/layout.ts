/**
 * ─────────────────────────────────────────────────────────────
 *  Bố cục & khung nhìn cho tấm thiệp 3D.
 *
 *  Tách riêng thành hàm thuần (pure) để có thể kiểm thử:
 *   - thiệp có nằm gọn trong khung hình ở mọi tỉ lệ màn hình;
 *   - trên điện thoại, trang thư phải nằm giữa vùng nhìn thấy
 *     và không bị thanh công cụ che mất.
 * ─────────────────────────────────────────────────────────────
 */

/** Kích thước một trang thiệp (world units) — phải khớp GreetingCard3D. */
export const CARD_PANEL = {
  width: 1.42,
  height: 1.96,
  thickness: 0.045,
};

export const CAMERA_FOV_DEG = 45;

/** Khoảng trống tối thiểu quanh thiệp để không bị cắt mép. */
export const CARD_VIEW_MARGIN = { x: 0.18, y: 0.16 };

/**
 * Vùng chiều cao màn hình dành cho thiệp khi mở rộng (tỉ lệ 0 → 1 từ trên xuống).
 * Phần dưới chừa chỗ cho thanh công cụ + dòng gợi ý, phần trên chừa lề.
 */
export const CARD_READ_INSETS = { top: 0.05, bottom: 0.15 };

export interface CardReadInsets {
  top: number;
  bottom: number;
}

/**
 * Vùng chừa theo số đo thật của thanh công cụ (px) — trên điện thoại
 * hàng nút có thể xuống 2–3 hàng nên phần chừa phải khớp.
 * Luôn chừa ít nhất mức mặc định để hành vi trên màn rộng không đổi.
 */
export function getReadInsets(
  viewportHeightPx: number,
  toolbarHeightPx: number
): CardReadInsets {
  const viewport = Math.max(1, viewportHeightPx);
  const measured = Math.max(0, toolbarHeightPx) / viewport;
  const bottom = Math.min(0.45, Math.max(CARD_READ_INSETS.bottom, measured + 0.02));
  return { top: CARD_READ_INSETS.top, bottom };
}

/** Vị trí/độ nghiêng của thiệp khi đặt cạnh nhân vật (chế độ thu gọn). */
export const CARD_COMPACT_VIEW = {
  position: [-1.42, 1.12, 0.9] as [number, number, number],
  rotationY: 0.38,
  scale: 0.95,
};

/** Vị trí/độ nghiêng của thiệp khi mở rộng để đọc (hướng thẳng về camera). */
export const CARD_EXPANDED_VIEW = {
  position: [0, 1.14, 1.0] as [number, number, number],
  rotationY: 0,
  scale: 1.2,
};

export interface CardView {
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

/**
 * Vị trí thiệp ở chế độ thu gọn (đặt cạnh nhân vật).
 * Màn hình càng hẹp thì thiệp càng nhỏ và càng vào gần giữa
 * để không bao giờ tràn ra ngoài mép màn hình.
 */
export function getCompactCardView(aspect: number): CardView {
  if (aspect < 0.75) {
    return { position: [-0.4, 1.02, 1.05], rotationY: 0.18, scale: 0.48 };
  }
  if (aspect < 1.25) {
    return { position: [-0.78, 1.06, 1.0], rotationY: 0.24, scale: 0.62 };
  }
  return { position: [-1.42, 1.12, 0.9], rotationY: 0.38, scale: 0.95 };
}

/** Giá trị mặc định cho lần render đầu (trước khi biết tỉ lệ màn hình). */
export const CARD_COMPACT_DEFAULT: CardView = getCompactCardView(16 / 9);

/** Camera khi thiệp đang ở chế độ thu gọn. */
export function getCardStageCamera(aspect: number): {
  position: [number, number, number];
  lookAt: [number, number, number];
} {
  const zoomOut = aspect >= 1.8 ? 0 : Math.max(0, 2.4 - (aspect - 1.0) * 3.0);
  return { position: [0, 1.6, 4.6 + zoomOut], lookAt: [0, 1.0, 0.2] };
}

/** Vị trí/điểm nhìn của camera theo từng giai đoạn của game. */
export function getSceneCamera(
  phase: string,
  aspect: number
): { position: [number, number, number]; lookAt: [number, number, number] } {
  const zoomOut = aspect < 1.05 ? 2.2 : aspect < 1.4 ? 1.0 : 0;
  if (phase === 'intro') {
    return { position: [0, 3.4, 7.6 + zoomOut], lookAt: [0, 1.05, 0] };
  }
  if (phase === 'reward_stage' || phase === 'secret_reveal') {
    return { position: [0, 1.75, 4.7 + zoomOut], lookAt: [0, 0.85, 0] };
  }
  if (phase === 'letter_reading') {
    return { position: [0, 1.6, 4.6 + zoomOut], lookAt: [0, 1.0, 0.2] };
  }
  return { position: [0, 2.0, 4.9 + zoomOut], lookAt: [0, 0.85, 0] };
}

/**
 * Màn hình đủ rộng để xem cả hai trang (bìa + thư) cùng lúc.
 * Màn hình hẹp (điện thoại) chỉ xem MỘT trang cho chữ to, dễ đọc.
 */
export function isSpreadView(aspect: number): boolean {
  return aspect >= 1.25;
}

/** Trang nào đang được canh giữa khi màn hình hẹp (chỉ xem một trang). */
export type CardPage = 'letter' | 'portrait';

export interface CardReadLayout {
  /** true = xem cả hai trang; false = chỉ xem một trang (điện thoại). */
  spread: boolean;
  aspect: number;
  scale: number;
  /** Trang đang canh giữa khi xem một trang. */
  page: CardPage;
  /** Kích thước phần nội dung cần hiển thị (world units). */
  contentWidth: number;
  contentHeight: number;
  /** Tâm nội dung theo trục X (trang được chọn khi xem một trang). */
  contentCenterX: number;
  /** Góc mở của bìa: màn hẹp gấp bìa ra sau lưng để không lấp chỗ. */
  coverOpenAngle: number;
  /** Vị trí & điểm nhìn của camera. */
  camera: {
    position: [number, number, number];
    lookAt: [number, number, number];
    distance: number;
  };
  /** Vùng chiều cao khả dụng (0 → 1, tính từ trên xuống). */
  usable: { top: number; bottom: number };
  /** Độ lệch điểm nhìn theo trục Y (world) để thiệp nằm giữa vùng khả dụng. */
  usableOffsetY: number;
}

/**
 * Toàn bộ bố cục khi MỞ RỘNG để đọc thiệp:
 * - màn rộng: xem cả hai trang, bìa mở 3D bình thường;
 * - màn hẹp: chỉ xem MỘT trang (theo `page`), bìa gấp hẳn ra sau, camera
 *   nhìn đúng tâm trang đó và chừa chỗ cho thanh công cụ ở dưới.
 */
export function getCardReadLayout(
  aspect: number,
  fovDeg: number = CAMERA_FOV_DEG,
  insets: CardReadInsets = CARD_READ_INSETS,
  page: CardPage = 'letter'
): CardReadLayout {
  const spread = isSpreadView(aspect);
  const scale = CARD_EXPANDED_VIEW.scale;
  const contentWidth = CARD_PANEL.width * (spread ? 2 : 1) * scale;
  const contentHeight = CARD_PANEL.height * scale;
  const pageHalf = (CARD_PANEL.width * scale) / 2;
  const contentCenterX = spread ? 0 : page === 'portrait' ? -pageHalf : pageHalf;

  const usable = {
    top: insets.top,
    bottom: 1 - insets.bottom,
  };
  const usableHeightFraction = Math.max(0.2, usable.bottom - usable.top);
  const tanHalfFov = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const safeAspect = Math.max(0.2, aspect);

  const needHalfWidth = contentWidth / 2 + CARD_VIEW_MARGIN.x;
  const needHalfHeight = contentHeight / 2 + CARD_VIEW_MARGIN.y;

  const distanceForWidth = needHalfWidth / (tanHalfFov * safeAspect);
  const distanceForHeight = needHalfHeight / (tanHalfFov * usableHeightFraction);
  const distance = Math.max(2.7, distanceForWidth, distanceForHeight);

  const visibleHeight = 2 * distance * tanHalfFov;
  const usableCenter = (usable.top + usable.bottom) / 2;
  // Lệch điểm nhìn xuống dưới tâm thiệp để thiệp nằm giữa vùng khả dụng
  const usableOffsetY = -(0.5 - usableCenter) * visibleHeight;

  const [baseX, baseY, baseZ] = CARD_EXPANDED_VIEW.position;
  const lookAt: [number, number, number] = [
    baseX + contentCenterX,
    baseY + usableOffsetY,
    baseZ,
  ];

  return {
    spread,
    aspect,
    scale,
    page,
    contentWidth,
    contentHeight,
    contentCenterX,
    coverOpenAngle: spread ? -Math.PI * 0.94 : -Math.PI,
    camera: {
      position: [lookAt[0], lookAt[1], baseZ + distance],
      lookAt,
      distance,
    },
    usable,
    usableOffsetY,
  };
}

/** Kích thước thật (world) của phần thiệp cần hiển thị khi mở rộng. */
export function getExpandedCardExtent(
  aspect: number,
  page: CardPage = 'letter'
): {
  spread: boolean;
  width: number;
  height: number;
} {
  const layout = getCardReadLayout(aspect, CAMERA_FOV_DEG, CARD_READ_INSETS, page);
  return { spread: layout.spread, width: layout.contentWidth, height: layout.contentHeight };
}

/** Khoảng cách camera cần lùi để thiệp nằm gọn (kèm chừa chỗ thanh công cụ). */
export function getCardReadDistance(
  aspect: number,
  fovDeg: number = CAMERA_FOV_DEG,
  insets: CardReadInsets = CARD_READ_INSETS,
  page: CardPage = 'letter'
): number {
  return getCardReadLayout(aspect, fovDeg, insets, page).camera.distance;
}

/** Vị trí & điểm nhìn của camera ở chế độ đọc thiệp. */
export function getCardReadCamera(
  aspect: number,
  fovDeg: number = CAMERA_FOV_DEG,
  insets: CardReadInsets = CARD_READ_INSETS,
  page: CardPage = 'letter'
): { position: [number, number, number]; lookAt: [number, number, number]; distance: number } {
  return getCardReadLayout(aspect, fovDeg, insets, page).camera;
}

/**
 * Kiểm tra thiệp (ở chế độ mở rộng) có nằm trọn trong VÙNG KHẢ DỤNG
 * của màn hình hay không — tức không bị cắt mép và không bị thanh
 * công cụ che. Trả về cả số đo để hiển thị khi test.
 */
export function checkCardReadFits(
  aspect: number,
  fovDeg: number = CAMERA_FOV_DEG,
  insets: CardReadInsets = CARD_READ_INSETS,
  page: CardPage = 'letter'
): {
  fits: boolean;
  screenHalfHeightFraction: number;
  screenHalfWidthFraction: number;
  screenTop: number;
  screenBottom: number;
  screenLeft: number;
  screenRight: number;
  usable: { top: number; bottom: number };
} {
  const layout = getCardReadLayout(aspect, fovDeg, insets, page);
  const tanHalfFov = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const visibleHeight = 2 * layout.camera.distance * tanHalfFov;
  const visibleWidth = visibleHeight * Math.max(0.2, aspect);

  // Tâm thiệp so với điểm nhìn (theo trục Y thế giới)
  const centerOffsetY = -layout.usableOffsetY;
  const screenCenterY = 0.5 - centerOffsetY / visibleHeight;
  const screenCenterX = 0.5; // điểm nhìn đã canh đúng tâm nội dung

  const screenHalfHeightFraction =
    layout.contentHeight / 2 / visibleHeight + CARD_VIEW_MARGIN.y / visibleHeight;
  const screenHalfWidthFraction =
    layout.contentWidth / 2 / visibleWidth + CARD_VIEW_MARGIN.x / visibleWidth;

  const screenTop = screenCenterY - screenHalfHeightFraction;
  const screenBottom = screenCenterY + screenHalfHeightFraction;
  const screenLeft = screenCenterX - screenHalfWidthFraction;
  const screenRight = screenCenterX + screenHalfWidthFraction;

  const fits =
    screenTop >= layout.usable.top - 1e-9 &&
    screenBottom <= layout.usable.bottom + 1e-9 &&
    screenLeft >= -1e-9 &&
    screenRight <= 1 + 1e-9;

  return {
    fits,
    screenHalfHeightFraction,
    screenHalfWidthFraction,
    screenTop,
    screenBottom,
    screenLeft,
    screenRight,
    usable: layout.usable,
  };
}

/**
 * Kiểm tra thiệp ở chế độ THU GỌN (bìa đóng, đặt cạnh nhân vật)
 * có nằm trọn trong khung hình hay không.
 */
export function checkCardFits(params: {
  view: CardView;
  camera: { position: [number, number, number]; lookAt: [number, number, number] };
  aspect: number;
  spread: boolean;
  fovDeg?: number;
}): {
  fits: boolean;
  visibleHalfWidth: number;
  visibleHalfHeight: number;
  cardHalfWidth: number;
  cardHalfHeight: number;
  lateralOffset: number;
} {
  const { view, camera, aspect, spread, fovDeg = CAMERA_FOV_DEG } = params;
  const tanHalfFov = Math.tan((fovDeg * Math.PI) / 180 / 2);

  const forward = [
    camera.lookAt[0] - camera.position[0],
    camera.lookAt[1] - camera.position[1],
    camera.lookAt[2] - camera.position[2],
  ];
  const fLen = Math.hypot(forward[0], forward[1], forward[2]) || 1;
  const f = [forward[0] / fLen, forward[1] / fLen, forward[2] / fLen];

  const toCard = [
    view.position[0] - camera.position[0],
    view.position[1] - camera.position[1],
    view.position[2] - camera.position[2],
  ];
  const depth = Math.max(0.2, toCard[0] * f[0] + toCard[1] * f[1] + toCard[2] * f[2]);

  const right = [f[2], 0, -f[0]];
  const rLen = Math.hypot(right[0], right[1], right[2]) || 1;
  const r = [right[0] / rLen, right[1] / rLen, right[2] / rLen];
  const lateral = toCard[0] * r[0] + toCard[1] * r[1] + toCard[2] * r[2];

  const visibleHalfHeight = depth * tanHalfFov;
  const visibleHalfWidth = visibleHalfHeight * Math.max(0.2, aspect);

  const panelWidth = CARD_PANEL.width * (spread ? 2 : 1) * view.scale;
  const panelThickness = CARD_PANEL.thickness * view.scale;
  const cos = Math.abs(Math.cos(view.rotationY));
  const sin = Math.abs(Math.sin(view.rotationY));
  const cardHalfWidth = (panelWidth * cos + panelThickness * sin) / 2;
  const cardHalfHeight = (CARD_PANEL.height * view.scale + panelThickness * sin) / 2;

  const fits =
    Math.abs(lateral) + cardHalfWidth + CARD_VIEW_MARGIN.x <= visibleHalfWidth + 1e-9 &&
    cardHalfHeight + CARD_VIEW_MARGIN.y <= visibleHalfHeight + 1e-9;

  return {
    fits,
    visibleHalfWidth,
    visibleHalfHeight,
    cardHalfWidth,
    cardHalfHeight,
    lateralOffset: Math.abs(lateral),
  };
}

/**
 * Nhân vật 3D có đứng trong scene ở giai đoạn này không.
 * Khi mở thiệp (`letter_reading`) nhân vật KHÔNG còn đứng cạnh thiệp nữa —
 * hình 2D của nó đã được chụp sẵn và in vào trang thư (utils/cardRenderer.ts),
 * nhờ vậy thiệp là tâm điểm và không có hai nhân vật trùng nhau.
 */
export function shouldShowCharacterInScene(phase: string): boolean {
  return phase === 'reward_stage' || phase === 'secret_reveal';
}

/** Vị trí nhân vật trong scene theo chế độ hiển thị thiệp. */
export function getCharacterPosition(
  phase: string,
  cardExpanded: boolean
): [number, number, number] {
  if (phase !== 'letter_reading') {
    return [0, 0, 0];
  }
  return cardExpanded ? [2.7, 0, -1.1] : [1.2, 0, 0.75];
}

/** Tỉ lệ hiển thị nhân vật theo chế độ. */
export function getCharacterScale(phase: string, cardExpanded: boolean): number {
  if (phase !== 'letter_reading') return 1.25;
  return cardExpanded ? 0.9 : 0.95;
}
