import type { ItemReward } from './reward';
import type { RecipientMatchResult } from './recipient';

export type GamePhase =
  | 'intro'           // Hộp quà rơi từ trên cao xuống & nảy
  | 'box_idle'        // Hộp quà đã đáp, chờ người dùng nhấp (1-4 lần)
  | 'box_opening'     // Nắp hộp mở, luồng sáng ma thuật bùng lên
  | 'name_input'      // Nhập họ và tên người nhận
  | 'roulette'        // Vòng quay phần thưởng kiểu CS2
  | 'secret_reveal'   // Màn lộ diện đặc biệt khi trúng Secret
  | 'reward_stage'    // Sân khấu 3D cho phần thưởng thường/hiếm/sử thi
  | 'letter_reading'  // Thiệp 3D mở ra, chữ hiện dần từng cụm
;

export interface GameState {
  phase: GamePhase;
  boxClickCount: number;
  recipientResult: RecipientMatchResult | null;
  wonItem: ItemReward | null;
  rouletteItems: ItemReward[];
  isMuted: boolean;
  bgmPlaying: boolean;
  reducedMotion: boolean;
}
