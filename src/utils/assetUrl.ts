/**
 * Đổi đường dẫn tài nguyên trong `public/` thành URL đúng với `base` của Vite.
 *
 * Vite tự xử lý `base` cho JS/CSS/font, nhưng các đường dẫn viết trong file
 * dữ liệu (ví dụ `portraitUrl` của hồ sơ người nhận) là chuỗi runtime nên phải
 * tự ghép. Nhờ vậy web chạy đúng cả khi deploy ở tên miền gốc lẫn thư mục con
 * (GitHub Pages dạng `/<repo>/`).
 */
export function resolveAssetUrl(path?: string): string | undefined {
  if (!path) return undefined;

  // Đã là URL tuyệt đối / data URI thì giữ nguyên
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  return normalizedBase + path.replace(/^\/+/, '');
}
