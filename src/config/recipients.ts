import type { RecipientProfile } from '../types/recipient';

// Thư mặc định (dùng chung) nằm trong config/messages.ts cho dễ chỉnh sửa.
export { DEFAULT_LETTER as DEFAULT_FALLBACK_LETTER } from './messages';

/**
 * ─────────────────────────────────────────────────────────────
 *  HỒ SƠ NGƯỜI NHẬN QUÀ
 *
 *  Đây là dữ liệu riêng tư — KHÔNG hiển thị cho người dùng cuối.
 *  Danh sách tên gợi ý / autocomplete đã được loại bỏ khỏi giao diện;
 *  người dùng chỉ nhập họ tên và hệ thống tự đối chiếu ngầm.
 *
 *  - `aliases`: các cách viết được chấp nhận (phân biệt hoa/thường,
 *    có/không dấu đều khớp được).
 *  - `odds`: tỷ lệ theo bậc độ hiếm. Chỉ Wang Yi có Secret cao nhất.
 *  - `letter`: nội dung thiệp, có thể chỉnh sửa tự do.
 * ─────────────────────────────────────────────────────────────
 */
export const RECIPIENTS: RecipientProfile[] = [
  {
    id: 'wang-yi',
    officialName: 'Wang Yi',
    aliases: ['Wang Yi', 'wang yi', 'Wang yi', 'WangYi', 'Yi', 'yi', 'YI', 'y i', 'Bé Yi', 'be yi'],
    displayName: 'Wang Yi',
    // 45 + 25 + 15 + 15 = 100. Đây là hồ sơ DUY NHẤT có Secret 15%,
    // cao hơn mọi hồ sơ khác (Mai Phương 5%, Lan Anh 0%).
    odds: {
      normal: 45,
      rare: 25,
      epic: 15,
      secret: 15,
    },
    secretItemId: 'bunny-secret', // Trúng Secret luôn nhận Thỏ Ánh Trăng Vĩnh Cửu
    portraitUrl: '/images/recipients/wang-yi.svg',
    themeColor: '#FFB6C1',
    accentColor: '#FFD700',
    letter: {
      greeting: 'Gửi {{displayName}},',
      body: `Cảm ơn bạn vì đã luôn dịu dàng và cố gắng — mong bạn cũng nhận lại được thật nhiều điều tử tế như thế.`,
      signature: 'Chúc bạn một ngày 20/10 thật hạnh phúc và an yên! 🌙✨',
      postscript: 'P.S. Món quà đặc biệt này được chuẩn bị dành riêng cho bạn.',
    },
    specialNote: 'Chủ nhân đặc biệt của Thỏ Ánh Trăng Vĩnh Cửu.',
  },
  {
    id: 'lan-anh',
    officialName: 'Lan Anh',
    aliases: ['Lan Anh', 'lan anh', 'LanAnh', 'Lan anh', 'Bé Lan', 'be lan'],
    displayName: 'Lan Anh',
    // Giữ nguyên tỷ lệ như ban đầu: 50 + 30 + 20 + 0 = 100.
    odds: {
      normal: 50,
      rare: 30,
      epic: 20,
      secret: 0,
    },
    themeColor: '#F48FB1',
    accentColor: '#CE93D8',
    letter: {
      greeting: 'Gửi {{displayName}},',
      body: `Cảm ơn bạn vì đã luôn là một người bạn đáng tin và dễ thương với mọi người xung quanh.`,
      signature: 'Thân mến chúc bạn ngày 20/10 ngập tràn niềm vui! 🌸',
    },
  },
  {
    id: 'mai-phuong',
    officialName: 'Mai Phương',
    aliases: ['Mai Phương', 'mai phuong', 'Mai Phuong', 'Phương', 'phuong', 'Bé Phương', 'be phuong'],
    displayName: 'Mai Phương',
    // Giữ nguyên tỷ lệ như ban đầu: 40 + 35 + 20 + 5 = 100.
    odds: {
      normal: 40,
      rare: 35,
      epic: 20,
      secret: 5,
    },
    secretItemId: 'dog-destiny',
    themeColor: '#FFAB91',
    accentColor: '#FFE082',
    letter: {
      greeting: 'Gửi {{displayName}},',
      body: `Mong bạn luôn giữ vững niềm tin, sự kiên định và có những người bạn đồng hành đáng yêu ở bên cạnh để sẻ chia.`,
      signature: 'Happy Vietnamese Women’s Day! 💖',
    },
  },
];
