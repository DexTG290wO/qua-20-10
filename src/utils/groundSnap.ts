/**
 * Phép bù để đưa đáy model 3D về đúng mặt cỏ.
 *
 * `measuredMinY` là đáy model ĐO ĐƯỢC khi đang áp offset `currentOffset`,
 * nên đây là phép bù TƯƠNG ĐỐI: trừ đi phần đang lệch.
 *
 * Nếu gán thẳng `offset = -measuredMinY` (coi như đo trên model chưa áp offset)
 * thì model sẽ bị đẩy lún xuống dưới cỏ một đoạn đúng bằng offset đang có.
 */
export function groundCorrection(currentOffset: number, measuredMinY: number): number {
  return currentOffset - measuredMinY;
}
