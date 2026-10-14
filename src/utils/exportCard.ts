import { renderCardPng, loadImage, type CardTextData } from './cardRenderer';

/** Tải một dataURL xuống dưới dạng file. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Xuất thiệp 20/10 thành ảnh PNG.
 *
 * Ảnh được vẽ lại từ chính bộ vẽ canvas dùng cho tấm thiệp 3D
 * (utils/cardRenderer.ts) nên luôn khớp nội dung đang hiển thị và
 * không phụ thuộc vào trạng thái WebGL của scene.
 */
export async function exportCardAsImage(
  data: CardTextData,
  filename: string = 'Thiep-20-10.png'
): Promise<boolean> {
  try {
    const portrait = data.portraitUrl ? await loadImage(data.portraitUrl) : null;
    const dataUrl = renderCardPng(data, portrait);
    if (!dataUrl) return false;
    downloadDataUrl(dataUrl, filename);
    return true;
  } catch (err) {
    console.error('Failed to export card image:', err);
    return false;
  }
}
