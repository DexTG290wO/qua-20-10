/**
 * ─────────────────────────────────────────────────────────────
 *  Bố cục & khung nhìn cho tấm thiệp 3D.
 *
 *  Tách riêng thành hàm thuần (pure) để có thể kiểm thử: "thiệp có
 *  nằm gọn trong khung hình ở mọi tỉ lệ màn hình hay không".
 *  Component `SceneContainer` chỉ việc dùng lại các giá trị này.
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

/**
 * Camera khi thiệp đang ở chế độ thu gọn.
 * Màn hình hẹp được lùi camera mượt mà (không nhảy bậc) để khung hình
 * luôn đủ rộng cho tấm thiệp.
 */
export function getCardStageCamera(aspect: number): {
  position: [number, number, number];
  lookAt: [number, number, number];
} {
  const zoomOut = aspect >= 1.8 ? 0 : Math.max(0, 2.4 - (aspect - 1.0) * 3.0);
  return { position: [0, 1.6, 4.6 + zoomOut], lookAt: [0, 1.0, 0.2] };
}

/** Giá trị mặc định cho lần render đầu (trước khi biết tỉ lệ màn hình). */
export const CARD_COMPACT_DEFAULT: CardView = getCompactCardView(16 / 9);

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
  return { position: [0, 2.0, 4.9 + zoomOut], lookAt: [0, 0.78, 0] };
}

/**
 * Kiểm tra thiệp có nằm trọn trong khung hình hay không.
 * Dùng hình chiếu bảo thủ (bao gồm cả phần nhô ra của độ dày thiệp).
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

  // Hệ trục camera (camera luôn nhìn gần như song song trục -Z)
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

  // Trục ngang của camera (right = normalize(f × up))
  const right = [f[2], 0, -f[0]];
  const rLen = Math.hypot(right[0], right[1], right[2]) || 1;
  const r = [right[0] / rLen, right[1] / rLen, right[2] / rLen];
  const lateral = toCard[0] * r[0] + toCard[1] * r[1] + toCard[2] * r[2];

  const visibleHalfHeight = depth * tanHalfFov;
  const visibleHalfWidth = visibleHalfHeight * Math.max(0.2, aspect);

  // Bề rộng hình chiếu của thiệp (kể cả độ dày khi nghiêng)
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
 * Màn hình đủ rộng để xem cả hai trang (bìa + thư) cùng lúc.
 * Màn hình hẹp sẽ chỉ xem trang thư cho chữ to, dễ đọc.
 */
export function isSpreadView(aspect: number): boolean {
  return aspect >= 1.25;
}

/** Kích thước thật (world) của phần thiệp cần hiển thị khi mở rộng. */
export function getExpandedCardExtent(aspect: number): {
  spread: boolean;
  width: number;
  height: number;
} {
  const spread = isSpreadView(aspect);
  return {
    spread,
    width: CARD_PANEL.width * (spread ? 2 : 1) * CARD_EXPANDED_VIEW.scale,
    height: CARD_PANEL.height * CARD_EXPANDED_VIEW.scale,
  };
}

/**
 * Khoảng cách camera cần lùi để toàn bộ thiệp (đã mở rộng) nằm gọn
 * trong khung hình, kèm lề an toàn.
 */
export function getCardReadDistance(aspect: number, fovDeg: number = CAMERA_FOV_DEG): number {
  const { width, height } = getExpandedCardExtent(aspect);
  const tanHalfFov = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const safeAspect = Math.max(0.2, aspect);

  const neededHeight = height / 2 + CARD_VIEW_MARGIN.y;
  const neededWidth = width / 2 + CARD_VIEW_MARGIN.x;

  const distance = Math.max(
    neededHeight / tanHalfFov,
    neededWidth / (tanHalfFov * safeAspect)
  );

  // Không đưa camera quá sát thiệp (tránh phối cảnh bị méo)
  return Math.max(2.7, distance);
}

/** Vị trí & điểm nhìn của camera ở chế độ đọc thiệp. */
export function getCardReadCamera(
  aspect: number,
  fovDeg: number = CAMERA_FOV_DEG
): { position: [number, number, number]; lookAt: [number, number, number]; distance: number } {
  const distance = getCardReadDistance(aspect, fovDeg);
  const [cx, cy, cz] = CARD_EXPANDED_VIEW.position;
  return {
    position: [cx, cy, cz + distance],
    lookAt: [cx, cy, cz],
    distance,
  };
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
