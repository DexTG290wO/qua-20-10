# 20/10 Mystery Gift — Kawaii Flower Garden Edition

Mini-game 3D mở hộp quà nhân ngày Phụ nữ Việt Nam 20/10.
Hộp quà rơi xuống khu vườn hoa, người dùng nhấp 4 lần để mở, nhập họ tên,
quay vòng phần thưởng rồi nhận nhân vật 3D kèm tấm thiệp chúc mừng 3D.

## Công nghệ

- React 19 + TypeScript + Vite
- Three.js qua `@react-three/fiber` (không dùng ảnh 2D cho nhân vật/khu vườn)
- GSAP cho các timeline animation
- Tailwind CSS v4 cho giao diện HTML
- Web Audio API cho toàn bộ âm thanh (không cần file mp3)

## Câu lệnh

```bash
npm install       # cài phụ thuộc
npm run dev       # chạy môi trường phát triển (Vite)
npm run build     # kiểm tra TypeScript + build production vào dist/
npm test          # chạy bộ kiểm thử logic (tsx test-runner.ts)
npm run lint      # oxlint
npm run preview   # xem trước bản build production
```

## Đưa lên web (deploy)

Trang này là **web tĩnh** — build xong chỉ cần đưa thư mục `dist/` lên hosting.

```bash
npm ci            # hoặc npm install
npm run build     # tạo dist/
npm run preview   # kiểm tra bản build ở http://localhost:4173
```

Cách đưa lên:

| Host | Cách làm |
| --- | --- |
| **GitHub Pages** | Push code lên GitHub, bật Pages = GitHub Actions → workflow có sẵn tự build & deploy. Xem mục A bên dưới. |
| **Cloudflare Pages** | Nối Git hoặc upload trực tiếp bằng wrangler. Xem mục B bên dưới. |
| **Netlify / Vercel** | Build command: `npm run build` · Publish/Output directory: `dist` |
| **Hosting thường (cPanel, VPS…)** | Upload **toàn bộ nội dung bên trong `dist/`** vào thư mục web (thường là `public_html`) |

---

### A. Up lên GitHub

#### A1. Đưa mã nguồn lên GitHub (repo mới)

```bash
git init
git add .
git commit -m "Mini-game 20/10"
git branch -M main
git remote add origin https://github.com/<tên-bạn>/<tên-repo>.git
git push -u origin main
```

> Không cần commit thư mục `dist/` hay `node_modules/` — `.gitignore` đã loại sẵn.

#### A2. Bật GitHub Pages

1. Vào repo → **Settings** → **Pages**.
2. Phần **Source**, chọn **GitHub Actions** (đừng chọn "Deploy from a branch").
3. Xong. Mỗi lần `git push` lên nhánh `main`, workflow
   `.github/workflows/deploy-pages.yml` sẽ tự: cài → chạy test → build → phát hành.
4. Xem tiến trình ở tab **Actions** của repo.
5. Địa chỉ web: **`https://<tên-bạn>.github.io/<tên-repo>/`**

Workflow tự truyền `BASE_PATH=/<tên-repo>/` vì GitHub Pages phục vụ ở thư mục con.
**Trường hợp đặc biệt:** nếu repo của bạn tên đúng dạng `<tên-bạn>.github.io`
(user/organization page) thì web nằm ở gốc — mở workflow và đổi
`BASE_PATH: /${{ github.event.repository.name }}/` thành `BASE_PATH: /`.
Repo private cần tài khoản GitHub Pro mới bật được Pages.

#### A3. Muốn tự build rồi up tay lên nhánh `gh-pages`?

```bash
npm run build
npx gh-pages -d dist        # hoặc copy tay nội dung dist/ lên nhánh gh-pages
```

Nhớ build kèm `BASE_PATH` nếu web nằm ở thư mục con (xem mục C).

---

### B. Up lên Cloudflare (Pages)

#### B1. Nối Git — tự build mỗi lần push (khuyến nghị)

1. Đăng nhập Cloudflare → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → chọn repo vừa push ở mục A1.
2. Điền:

| Trường | Giá trị |
| --- | --- |
| Framework preset | `Vite` (hoặc `None`) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | để trống (nếu repo ở gốc) |
| Environment variables | không cần — Node lấy từ `.nvmrc` |

3. **Save and Deploy** → web chạy ở `https://<tên-project>.pages.dev`.
4. Muốn dùng tên miền riêng: **Custom domains** → thêm domain, Cloudflare tự cấp SSL.

Cloudflare chạy `npm ci` (lockfile trong repo đã khớp), và trang chỉ có **một route
duy nhất** nên **không cần** `_redirects` / `_headers` / Functions.

#### B2. Không nối Git — upload trực tiếp bằng wrangler

```bash
npm install -g wrangler     # hoặc dùng npx
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name=qua-20-10
```

Lần sau chỉ cần `npm run build` rồi chạy lại lệnh `wrangler pages deploy`.

---

### C. Deploy vào thư mục con

Mặc định `vite.config.ts` dùng `base: '/'` (đúng cho Cloudflare/Vercel/tên miền gốc).
Nếu web nằm trong thư mục con, đặt `BASE_PATH` trước khi build:

```bash
# Linux / macOS / GitHub Actions
BASE_PATH=/qua/ npm run build

# PowerShell (Windows)
$env:BASE_PATH="/qua/"; npm run build
```

Hoặc tạo file **`.env.local`** ở gốc dự án (đã được `.gitignore` bỏ qua):

```
BASE_PATH=/qua/
```

Việc này áp dụng cho cả đường dẫn ảnh trong `public/` (ví dụ chân dung người nhận),
nhờ helper `src/utils/assetUrl.ts`.

---

Lưu ý chung khi deploy:

- Không cần biến môi trường bí mật, không cần backend, không có API key nào trong mã nguồn.
- Ảnh/font: trang dùng Google Fonts qua CDN. Muốn chạy hoàn toàn offline thì tải font
  về `public/fonts` và sửa `index.html` + `src/utils/cardRenderer.ts`.
- Toàn bộ dữ liệu người nhận (`src/config/recipients.ts`) nằm trong bundle phía client —
  người biết kỹ thuật có thể đọc được. Đừng đặt thông tin nhạy cảm trong đó.
- `dist/` (1.4 MB, gzip ~380 KB) nằm trong `.gitignore` — không commit lên repo.

## Nơi cấu hình (chỉ sửa dữ liệu, không cần chạm vào animation)

| Nội dung cần sửa | Tệp |
| --- | --- |
| Hồ sơ người nhận, alias, tỷ lệ, thư riêng | `src/config/recipients.ts` |
| Bộ lời chúc (mặc định / theo bậc / theo người nhận) | `src/config/messages.ts` |
| Cách chọn lời chúc ngẫu nhiên (chống lặp) | `src/utils/greetingPicker.ts` |
| Ghép tên hiển thị + lời chúc cho một lượt chơi | `src/utils/giftPlay.ts` |
| Danh sách phần thưởng & nhân vật 3D | `src/config/rewards.ts` |
| Tỷ lệ mặc định + màu/nhãn bậc độ hiếm | `src/config/rarity.ts` |
| Thuật toán chọn phần thưởng | `src/utils/probability.ts` |
| Cách đối chiếu họ tên (không dấu, khoảng trắng, alias) | `src/utils/nameMatcher.ts` |
| Bố cục chữ trên thiệp (canvas 2D) | `src/utils/cardRenderer.ts` |
| Vị trí/khoảng cách camera cho thiệp | `src/utils/layout.ts` |
| Nơ & ruy băng hộp quà | `src/components/3d/GiftBow.tsx` |
| Mô hình nhân vật 3D | `src/components/3d/characters/*` |
| Khu vườn hoa 3D | `src/components/3d/FlowerGarden3D.tsx` |
| Hình học cánh hoa / sao / cỏ dùng chung | `src/components/3d/ProceduralFlora.ts` |
| Hộp quà & timeline mở nắp | `src/components/3d/GiftBox3D.tsx` |
| Thiệp 3D (thu gọn / mở rộng) | `src/components/3d/GreetingCard3D.tsx` |

### Tên hiển thị trên thiệp

`getDisplayName()` trong `src/utils/nameMatcher.ts` lấy **hai từ cuối** của họ tên
người dùng nhập (chuẩn hoá khoảng trắng, giữ nguyên dấu và chữ hoa/thường):

| Nhập vào | Hiển thị |
| --- | --- |
| `Nguyễn Hải Anh` | `Hải Anh` |
| `Trần Minh Châu` | `Minh Châu` |
| `Nguyễn Thị Thu Hà` | `Thu Hà` |
| `Wang Yi` | `Wang Yi` |
| `Yi` | `Yi` |

Việc **đối chiếu hồ sơ** vẫn dùng họ tên đầy đủ đã chuẩn hoá
(`matchRecipient`), không dùng tên hiển thị — nên hai người khác nhau có cùng
hai từ cuối vẫn không bị nhận nhầm.

### Lời chúc thay đổi giữa các lượt chơi

- `src/config/messages.ts` chứa: `GREETINGS_DEFAULT` (14 câu), `GREETINGS_NORMAL`,
  `GREETINGS_RARE`, `GREETINGS_EPIC`, `GREETINGS_SECRET` (mỗi bộ 5–8 câu),
  `CLOSING_WISHES` (câu kết ngắn) và `RECIPIENT_GREETINGS` (bộ riêng theo hồ sơ).
- Thứ tự ưu tiên: **bộ riêng của người nhận → bộ theo bậc độ hiếm → bộ mặc định**.
- `pickGreeting()` được gọi **một lần** khi phần thưởng được chốt, kết quả được
  lưu vào state của lượt chơi nên không đổi giữa các lần re-render/animation.
- Lời chúc vừa dùng được ghi nhớ theo từng người nhận để **không lặp lại liên tiếp**.
- Nội dung thiệp = lời chúc đã chốt + ghi chú riêng của hồ sơ (nếu có) + câu kết.

### Thêm một người nhận mới

```ts
// src/config/recipients.ts
{
  id: 'nguyen-lan',
  officialName: 'Nguyễn Lan',
  aliases: ['Nguyễn Lan', 'Lan', 'Bé Lan'], // hoa/thường & có dấu/không dấu đều khớp
  displayName: 'Lan',
  odds: { normal: 60, rare: 25, epic: 14, secret: 1 }, // phải cộng lại đúng 100
  letter: { greeting: 'Gửi {{displayName}},', body: '...', signature: '...' },
}
```

### Tỷ lệ phần thưởng

Bốn bậc: `normal`, `rare`, `epic`, `secret`. Mỗi hồ sơ có thể khai báo `odds`
riêng; hồ sơ không khai báo sẽ dùng `DEFAULT_ODDS` trong `src/config/rarity.ts`.
`normalizeOdds()` tự chuẩn hoá để bốn giá trị luôn cộng đúng 100% và không âm.

**Lưu ý:** chỉ hồ sơ `wang-yi` được đặt Secret cao nhất (15%); các hồ sơ khác giữ
nguyên tỷ lệ ban đầu (Mai Phương 5%, Lan Anh 0%). Phần thưởng được **chốt trước**
khi vòng quay bắt đầu, nên kết quả hiển thị luôn khớp với kết quả quay.

## Ghi chú thiết kế

- **Thiệp 3D hai chế độ.** Sau khi lộ diện phần thưởng, thiệp xuất hiện ở dạng
  **thu gọn** (bìa hướng về người xem, có tên người nhận) đặt cạnh nhân vật.
  Bấm nút "Đọc thiệp" hoặc chạm vào thiệp để chuyển sang **khung đọc mở rộng**:
  camera đưa thẳng góc về thiệp, bìa mở ra quanh gáy thật, chữ hiện dần và luôn
  nằm trong khung hình ở mọi tỉ lệ màn hình (`src/utils/layout.ts`).
- **Trên điện thoại** (`src/utils/layout.ts` → `getCardReadLayout`): chỉ hiển thị
  **một trang thư** cho chữ to, camera canh đúng tâm trang (không lệch sang phải),
  bìa gấp hẳn ra sau, và phần dưới màn hình được chừa sẵn chỗ cho thanh công cụ
  (`CARD_READ_INSETS`) nên nút bấm không bao giờ che chữ. Trên màn rộng thì vẫn
  xem cả hai trang như một tấm thiệp mở.
- **Ánh sáng & bóng đổ.** Đèn viền phía sau giúp nhân vật/hộp quà tách khỏi nền,
  bóng đổ dùng gradient mềm (`SoftShadow`) thay cho vòng cứng, nhân vật có nhịp
  "thở" nhẹ sau khi xuất hiện.
- **Hiệu ứng mở hộp quà.** Hạt bay theo **đường xoáy ốc hai lớp** (lớp sau trễ hơn),
  vòng tròn ma thuật xoay chậm trên cỏ khi hộp đã mở, sao lấp lánh bay lên liên tục,
  và camera **rung theo lực va chạm** khi hộp rơi, khi nhấp và khi nắp bật mở.
- **Ưu tiên độ dễ đọc.** Mặt giấy có chữ dùng vật liệu *không nhận sáng*
  (`meshBasicMaterial` + `toneMapped={false}`) nên không bao giờ bị cháy sáng;
  chữ nâu đậm/đỏ rượu trên nền kem đục, tự động chọn cỡ chữ lớn nhất vừa trang
  (đo được tỉ lệ tương phản ~13:1), hoa trang trí chỉ ở bốn góc nên không nằm sau chữ.
- **Nơ & ruy băng** (`src/components/3d/GiftBow.tsx`): hai dải ruy băng bám sát
  mặt hộp theo hai trục (dải ngang nằm trên dải dọc như dây buộc thật), nơ có hai
  vòng, nút giữa và hai đuôi có độ dày thật; các vòng và đuôi phản ứng theo
  chuyển động của hộp khi rung hoặc khi mở nắp.
- **Không còn giao diện quản trị.** Nút "Quản trị / Xem hồ sơ", modal quản trị và
  danh sách người nhận đã bị loại bỏ hoàn toàn khỏi luồng ứng dụng.
- **Không gợi ý tên.** Ô nhập chỉ có một trường duy nhất, không autocomplete và
  không hiển thị danh sách người nhận đã cấu hình.
- Việc đối chiếu họ tên diễn ra ngầm; tên không khớp hồ sơ nào sẽ dùng thư mặc
  định và tỷ lệ mặc định.
- Toàn bộ hồ sơ/alias nằm trong bundle phía client. Đây **không phải** ranh giới
  bảo mật — không đặt thông tin nhạy cảm trong mã nguồn frontend.
- Game tôn trọng `prefers-reduced-motion`: giảm hiệu ứng rơi, hạt và hiệu ứng lộ diện.

## Kiểm thử tự động

`npm test` chạy `test-runner.ts` (156 bài kiểm tra), bao gồm:

- Nhận diện alias Wang Yi + người nhận thường (có/không dấu, khoảng trắng thừa).
- Tách tên hiển thị (2 từ cuối), giữ nguyên dấu tiếng Việt.
- Bộ lời chúc: không trùng lặp, đủ dài, có dấu, mỗi bậc đủ số câu.
- Cách mở đầu đa dạng và không có nội dung tình cảm/người yêu.
- Chọn lời chúc: đúng thứ tự ưu tiên, không lặp liên tiếp, đổi giữa các lượt.
- Ghép nội dung một lượt chơi: họ tên → tên hiển thị → thiệp (dùng đúng hàm mà App dùng).
- Bố cục thiệp: hình chiếu thiệp nằm gọn trong khung ở 11 tỉ lệ màn hình khác nhau
  (0.45 → 2.4), ở cả chế độ thu gọn và mở rộng.
- Ruy băng/nơ: kích thước dải, vị trí vệt sáng, độ dày, hình học đuôi nơ hợp lệ.
- Phần thưởng: tỷ lệ cộng đúng 100%, chỉ Wang Yi có Secret cao nhất, giữ nguyên
  tỷ lệ các hồ sơ khác, và không bị ảnh hưởng bởi việc chọn lời chúc.
