import type { LetterConfig } from '../types/recipient';
import type { RarityType } from '../types/rarity';

/**
 * ─────────────────────────────────────────────────────────────
 *  NỘI DUNG LỜI CHÚC 20/10
 *
 *  Toàn bộ câu chữ nằm ở đây để có thể chỉnh sửa mà không cần
 *  chạm vào logic animation hay giao diện 3D.
 *
 *  Các nhóm chính:
 *   - GREETINGS_DEFAULT / _NORMAL / _RARE / _EPIC / _SECRET:
 *     lời chúc theo bậc độ hiếm của phần thưởng.
 *   - RECIPIENT_GREETINGS: lời chúc riêng cho từng hồ sơ người nhận.
 *   - CLOSING_WISHES: câu kết ngắn, ghép thành đoạn thứ hai của thiệp.
 *
 *  Việc CHỌN lời chúc nằm ở `src/utils/greetingPicker.ts` (tách logic
 *  khỏi dữ liệu), còn phần thưởng do `src/utils/probability.ts` quyết định.
 * ─────────────────────────────────────────────────────────────
 */

/** Thư mặc định — khung chung cho người chưa có hồ sơ riêng. */
export const DEFAULT_LETTER: LetterConfig = {
  greeting: 'Gửi {{displayName}},',
  body: '', // nội dung chính lấy từ bộ lời chúc ngẫu nhiên bên dưới
  signature: 'Chúc bạn ngày 20/10 ngập tràn niềm vui và may mắn! 💐',
  postscript: '',
};

// ─────────────────────────────────────────────────────────────
//  Lời chúc chung (dùng khi hồ sơ chưa có bộ lời chúc riêng
//  và bậc độ hiếm không có bộ riêng)
// ─────────────────────────────────────────────────────────────
export const GREETINGS_DEFAULT: string[] = [
  'Chúc bạn ngày 20/10 thật nhiều niềm vui, luôn tự tin, rạng rỡ và gặp thật nhiều điều dễ thương trong cuộc sống!',
  'Điều mình mong nhất hôm nay là bạn có đủ dũng khí để theo đuổi điều mình thích, đủ bình yên để tận hưởng những điều giản dị và thật nhiều lý do để mỉm cười.',
  'Bạn xứng đáng được nhìn thấy những điều tốt đẹp ở chính mình — hôm nay và cả những ngày sau nữa.',
  'Hy vọng ngày hôm nay sẽ mang đến cho bạn những bất ngờ đáng yêu, những lời chúc chân thành và thật nhiều khoảnh khắc khiến bạn vui vẻ.',
  'Cứ giữ lấy sự hồn nhiên, lòng tốt và nguồn năng lượng tích cực ấy nhé, mình tin những điều bạn đang cố gắng rồi sẽ dần thành hiện thực.',
  'Mỗi ngày của bạn nên có một niềm vui nhỏ, một điều đáng mong chờ và những người khiến bạn thấy được quan tâm — hôm nay lại càng nên như thế.',
  'Hãy cứ tự tin thử những điều mới mẻ, và đừng quên tự hào về những tiến bộ của chính mình.',
  'Ngày 20/10 này, mong bạn nhận được thật nhiều điều ngọt ngào và luôn tìm thấy niềm vui trong những chuyện bình thường nhất.',
  'Phía trước của bạn nên có thêm nhiều cơ hội tốt, những người bạn tuyệt vời và những kỷ niệm đáng nhớ — mình mong là như vậy.',
  'Chúc bạn luôn vui vẻ, bình an, gặp nhiều may mắn và có thật nhiều khoảnh khắc đẹp để sau này nhớ lại vẫn mỉm cười.',
  'Ước gì hôm nay bạn làm được điều mình muốn, gặp được những người khiến bạn thấy nhẹ lòng và có đủ thời gian cho chính mình.',
  'Dịu dàng với bản thân một chút cũng là cách bạn trân trọng chính mình — hôm nay thử làm điều đó nhé.',
  'Hôm nay bạn được nghỉ ngơi theo cách mình thích, không phải vội vàng vì bất cứ điều gì. Một ngày 20/10 thật thoải mái nhé!',
  'Bạn luôn cần một nơi để quay về khi mệt, những người để sẻ chia, và một trái tim đủ rộng cho những điều tử tế — mong bạn có đủ cả ba.',
];

/** Bậc Thường: lời chúc ngắn, vui vẻ, thân thiện. */
export const GREETINGS_NORMAL: string[] = [
  'Hôm nay là ngày của bạn nên cứ vui hết cỡ nhé — thật nhiều năng lượng và thật nhiều tiếng cười!',
  'Món quà nhỏ này muốn nhắn rằng: ăn ngon, ngủ sâu và giữ tâm trạng thật dễ chịu mỗi ngày nhé.',
  'Hy vọng bạn nhận được ít nhất một điều bất ngờ khiến mình cười thật tươi trong hôm nay.',
  'Cần một chỗ dựa êm ái khi mệt, một lý do để cười khi buồn — mong bạn luôn có đủ cả hai.',
  'Đồ uống yêu thích trong tay, những lời khen dành trọn cho bạn, và một ngày thật nhẹ lòng nhé!',
  'Cứ thoải mái như đang ở nhà, và để mọi lo toan chậm lại một chút trong hôm nay.',
  'Tiếng cười, món ăn ngon và những người bạn dễ mến — đó là những gì mình chúc bạn có trong ngày 20/10 này.',
  'Không cần làm gì to tát, chỉ cần hôm nay bạn thấy vui và được sống đúng nhịp của mình là đủ.',
];

/** Bậc Hiếm: lời chúc sâu sắc, riêng tư hơn. */
export const GREETINGS_RARE: string[] = [
  'Điều mình quý nhất ở bạn là sự kiên nhẫn và cách bạn luôn tử tế với người khác — mong bạn cũng dịu dàng với chính mình như thế.',
  'Giữa những điều ồn ào, mong bạn luôn giữ được sự bình tĩnh và tìm thấy hướng đi đúng cho riêng mình.',
  'Những nỗ lực lặng lẽ của bạn rồi sẽ được nhìn thấy — bạn xứng đáng với những điều tốt đẹp đến muộn nhưng bền lâu.',
  'Ước gì bạn có thêm thật nhiều thời gian cho những điều mình thích, và bớt đi những việc phải cố gắng gượng.',
  'Bạn xứng đáng được đối xử tử tế đúng cách và được sống đúng với con người mình — mình mong điều đó đến sớm.',
  'Cứ vững vàng như bạn vẫn thế nhé, và khi cần thì yếu lòng một chút cũng chẳng sao cả.',
  'Niềm vui nằm ở những điều nhỏ bé mỗi ngày, và bạn — người luôn đối xử tốt với mọi người — xứng đáng có thật nhiều niềm vui như thế.',
  'Hãy kiên nhẫn với bản thân, dịu dàng với những người thân, và đủ can đảm để bắt đầu lại khi cần.',
];

/** Bậc Sử Thi: lời chúc hào hứng, giàu hình ảnh hơn. */
export const GREETINGS_EPIC: string[] = [
  'Món quà này đã chờ bạn rất lâu — chúc ngày 20/10 của bạn thật rực rỡ, và mọi điều ước nhỏ xinh lần lượt thành hiện thực.',
  'Hôm nay như có một chút phép màu: vũ trụ gửi đến bạn một món quà kèm lời hứa rằng những điều tốt đẹp đang trên đường tới.',
  'Đủ mạnh mẽ để bước tiếp, đủ bình yên để tận hưởng — mong bạn luôn tỏa sáng theo cách riêng của mình.',
  'Phía trước bạn là thật nhiều may mắn, những người bạn tốt và những cơ hội chỉ đến một lần trong đời.',
  'Ước gì bạn đủ dũng cảm để mơ lớn, đủ kiên nhẫn để đi đến cùng và đủ trân trọng bản thân để không bỏ rơi chính mình.',
  'Những điều bạn âm thầm mong ước rồi sẽ lần lượt thành hiện thực, theo cách dịu dàng và đúng lúc nhất.',
];

/** Bậc Huyền Bí: lời chúc đặc biệt, giàu cảm xúc nhưng vẫn gần gũi. */
export const GREETINGS_SECRET: string[] = [
  'Chỉ một lần trong rất nhiều lần mới gặp được món quà này, và nó đã chọn đúng bạn — mong bạn luôn là điều đặc biệt trong mắt những người trân trọng mình.',
  'Đây là lời chúc được cất riêng từ rất lâu: mong bạn luôn được sống trong bình yên, được đối xử bằng cả tấm lòng và không bao giờ nghi ngờ giá trị của chính mình.',
  'Điều quý giá nhất không phải vầng trăng kia, mà là người đã kiên nhẫn đi một hành trình dài để trở thành bạn của ngày hôm nay.',
  'Những ngày tháng phía trước của bạn nên có ánh sáng, có người đồng hành, và thật nhiều lý do để tin rằng mọi thứ đang dần tốt lên.',
  'Mong bạn có một ngày 20/10 đáng nhớ, và luôn nhớ rằng mình xứng đáng với những điều dịu dàng nhất trên đời này.',
  'Cả khu vườn hôm nay như sáng hơn một chút vì có bạn — mong bạn luôn bình an, được trân trọng và luôn thấy mình thật đáng giá.',
];

/**
 * Câu kết ngắn — ghép thành đoạn thứ hai của thiệp khi người nhận
 * không có ghi chú riêng. Giúp thiệp luôn có 2 đoạn dễ đọc.
 */
export const CLOSING_WISHES: string[] = [
  'Mong bạn giữ được nụ cười ấy trong thật nhiều ngày nhé!',
  'Chúc bạn một ngày thật bình an và thư thái.',
  'Nhớ dành cho mình một chút thời gian để nghỉ ngơi nữa nhé!',
  'Mong mọi điều tốt đẹp sẽ đến với bạn đúng lúc bạn cần.',
  'Hãy cứ là chính bạn, theo cách dịu dàng nhất.',
  'Hy vọng bạn luôn thấy mình đáng giá và đáng được trân trọng.',
];

/**
 * Lời chúc riêng theo từng hồ sơ (key = id trong config/recipients.ts).
 * Nếu một hồ sơ có bộ này, nó được ưu tiên và vẫn thay đổi giữa các lượt chơi.
 */
export const RECIPIENT_GREETINGS: Record<string, string[]> = {
  'wang-yi': [
    'Nhân ngày 20/10, chúc bạn có một ngày thật dịu dàng và trọn vẹn. Mong bạn luôn tự tin với những điều làm nên nét riêng của mình, và cũng đủ bao dung để cho bản thân được nghỉ ngơi một chút.',
    'Những cố gắng thầm lặng của bạn đều đáng được nhìn thấy, kể cả khi chẳng ai kịp nói ra. Chúc bạn một ngày 20/10 ấm áp và thật bình yên.',
    'Chú thỏ ánh trăng nhỏ bé này sẽ cùng bạn giữ lấy những điều yên lành nhất. Chúc bạn luôn rạng rỡ và gặp được những người khiến cuộc sống trở nên đáng yêu hơn!',
  ],
  'lan-anh': [
    'Mong bạn giữ được sự tươi tắn và nụ cười rạng rỡ trên từng bước đường mình đi, cùng những khoảng lặng nhỏ để thấy lòng nhẹ nhõm hơn.',
    'Những điều tử tế bạn dành cho mọi người rồi cũng sẽ tìm đường quay trở lại với bạn, thật nhiều và thật dịu dàng.',
  ],
  'mai-phuong': [
    'Hoa thơm, những lời khen chân thành và cả những điều bất ngờ nho nhỏ — mong bạn nhận được tất cả trong ngày 20/10 này.',
    'Đừng quên dành cho mình những ngày ưu ái bản thân, bạn xứng đáng với những điều dịu dàng nhất. Chúc bạn luôn rực rỡ trong khu vườn của chính mình!',
  ],
};

/** Tập lời chúc theo bậc độ hiếm. */
export const GREETINGS_BY_RARITY: Record<RarityType, string[]> = {
  normal: GREETINGS_NORMAL,
  rare: GREETINGS_RARE,
  epic: GREETINGS_EPIC,
  secret: GREETINGS_SECRET,
};

/** Lời dẫn ngắn theo từng bậc độ hiếm (hiện ở màn lộ diện phần thưởng). */
export const RARITY_INTROS: Record<RarityType, string> = {
  normal: 'Một người bạn nhỏ ấm áp vừa chọn bạn làm chủ nhân cho ngày 20/10 này.',
  rare: 'Có chút may mắn dịu dàng vừa gõ cửa — món quà này đã chờ bạn rất lâu rồi.',
  epic: 'Một món quà đặc biệt hiếm khi xuất hiện đã tìm đúng bạn để trao đi.',
  secret:
    'Điều quý giá nhất của khu vườn đã chọn bạn — chỉ một lần trong rất nhiều lần mới có thể gặp.',
};

/** Lời dẫn ngắn riêng cho từng nhân vật (key = id trong config/rewards.ts). */
export const CHARACTER_INTROS: Record<string, string> = {
  'cat-orange':
    'Mèo Cam thích sưởi nắng sớm và tin rằng một giấc ngủ ngon có thể chữa lành gần hết những mệt mỏi.',
  'dog-corgi':
    'Cún Corgi chân ngắn chạy rất nhanh, đặc biệt là khi nghe thấy tiếng gọi tên bạn.',
  duckling:
    'Vịt Con Bơ Sữa luôn nghiêng đầu lắng nghe, kể cả những câu chuyện chưa kịp thành lời.',
  'pig-pink':
    'Heo Hồng Dâu Tây tin rằng hạnh phúc đôi khi chỉ là ăn ngon, ngủ sâu và không phải lo nghĩ gì.',
  'bunny-white':
    'Thỏ Trắng Hoa Tuyết mang theo một đóa cúc họa mi và chút trong trẻo của buổi sớm mùa thu.',
  'dog-shiba':
    'Shiba Inu Mặt Bánh Bao cài khăn xanh, sẵn sàng lắng nghe và gật gù cổ vũ mọi dự định của bạn.',
  'seal-chubby':
    'Hải Cẩu Mochi Tròn Xoe lười biếng nhưng vỗ vây rất nhiệt tình mỗi khi bạn làm được điều gì đó.',
  penguin:
    'Chim Cánh Cụt Đeo Nơ cúi chào rất trang trọng và luôn nghiêm túc khen bạn hết lời.',
  'cat-angel':
    'Mèo Thiên Thần Cánh Mộng khẽ vỗ đôi cánh, âm thầm canh giữ những giấc mơ bạn chưa kể với ai.',
  'bear-heart':
    'Gấu Bông Ôm Trái Tim Bất Diệt chỉ muốn gửi bạn một cái ôm thật chặt và thật ấm.',
  'dragon-baby':
    'Rồng Con Bụi Sao thở ra những bong bóng ngũ sắc và tin rằng điều ước nào cũng có thể thành sự thật.',
  'cat-crown':
    'Mèo Hoàng Gia Vương Miện Vàng nhắc bạn rằng vương miện chỉ lung linh khi bạn đeo nó bằng sự tự tin.',
  'bunny-secret':
    'Thỏ Ánh Trăng Vĩnh Cửu mang theo cả vầng trăng khuyết — người bạn đồng hành chỉ dành riêng cho người được chọn.',
  'dog-destiny':
    'Cún Con Định Mệnh Tinh Vân vượt nhiều dải ngân hà chỉ để tìm đúng bạn vào ngày hôm nay.',
  'cat-seraphim':
    'Mèo Thiên Thần Đại Hồng Hoang đáp xuống khu vườn này với bốn cánh vàng và một lời chúc phúc dành riêng cho bạn.',
};

/** Lấy lời dẫn phù hợp, luôn có phương án dự phòng theo bậc độ hiếm. */
export function getRewardIntro(rewardId: string, rarity: RarityType): string {
  return CHARACTER_INTROS[rewardId] ?? RARITY_INTROS[rarity] ?? DEFAULT_LETTER.signature;
}
