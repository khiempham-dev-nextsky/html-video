# Thiết kế: Hỗ trợ sinh nội dung tiếng Việt (auto theo ngôn ngữ user)

> Ngày: 2026-06-09 · Branch: `feat/vietnamese-language-support` · Trạng thái: spec (chờ review)

## 1. Vấn đề

Hiện tại studio sinh frame **luôn ra tiếng Trung**, kể cả khi user chat bằng tiếng Việt
hoặc tiếng Anh. Người dùng Việt không dùng được sản phẩm.

### Nguyên nhân gốc (đã xác minh trong code)

Có 2 đường sinh nội dung trong `packages/cli/src/studio-server.ts`:

- `generate` phase — single-frame (dòng ~2723)
- `runSplitMultiFrameGenerate` — multi-frame, **đây là đường user thực sự chạy** (dòng ~3091)

Cả hai prompt sinh **content-graph + HTML frame** đều **KHÔNG có chỉ thị ngôn ngữ đầu ra**.
Chỉ thị `"in the user's language"` chỉ tồn tại ở các prompt *hội thoại* (hỏi đáp, thẻ xác nhận),
không có ở prompt sinh nội dung video.

Khi thiếu anchor, model mặc định ra tiếng Trung vì **toàn bộ khung prompt thiên tiếng Trung**:

- Nhãn song ngữ thiên Trung: `类型/内容/风格/主题/时长/帧数`
- Ví dụ "cấm dùng" bằng tiếng Trung: `看清本质`, `第一性原理`, `什么是概念解说`
- Placeholder tiếng Trung: `随机/随便/你定`
- Thông báo tiến trình hardcode tiếng Trung: `规划…`, `故事板规划完成`, `生成第 N 帧`

## 2. Quyết định (đã chốt với user)

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Cơ chế chọn ngôn ngữ | **Tự động theo ngôn ngữ user gõ** |
| 2 | Phạm vi | **Toàn bộ**: nội dung frame + thông báo tiến trình + nhãn UI |
| 3 | Khi bài nguồn khác ngôn ngữ chat | **Ngôn ngữ chat của user luôn thắng** (dịch nguồn nếu cần) |
| 4 | Phương án kỹ thuật | **P3 — Lai**: server detect gợi ý + chỉ thị prompt + khử tiếng Trung scaffold + i18n |

## 3. Kiến trúc

### Nguyên tắc trung tâm

Một hàm detect duy nhất ở server là **nguồn sự thật** cho ngôn ngữ nội dung:

```
detectUserLang(openingTopic + contentTurns)  → 'vi' | 'zh' | 'en'
  // CHỈ dùng chat của user, BỎ QUA bài nguồn (honor quyết định #3)
  // vi: có dấu tiếng Việt (ăâđêôơư + dấu thanh) hoặc từ vi phổ biến
  // zh: có chữ Hán (一-鿿)
  // else: en (mặc định trung tính — KHÔNG phải zh)
```

`lang` này điều khiển **2 thứ ở backend**:
- (a) chỉ thị ngôn ngữ trong prompt sinh nội dung
- (b) thông báo tiến trình (qua `tServer(lang, key)`)

Frontend UI dùng **i18n riêng** theo `navigator.language` (cơ chế đã có sẵn trong `i18n.js`)
→ trình duyệt `vi-VN` tự ra UI tiếng Việt, không cần thread locale từ frontend xuống backend.

### Chỉ thị prompt sẽ chèn (cốt lõi P1)

```
OUTPUT LANGUAGE (REQUIRED): Write every visible text node, the synopsis, and all
data labels/units in {LANG_NAME} — the same language the user wrote their request in.
The source material may be in another language; translate its facts, names, and numbers
into {LANG_NAME}. Keep proper nouns, brand/product names, and code identifiers in their
original script. Do NOT default to Chinese.
```

`{LANG_NAME}` = `Vietnamese (Tiếng Việt)` | `English` | `Chinese (中文)`.

## 4. Phân phase (ship tăng dần, cô lập rủi ro)

### Phase 1 — Nội dung frame (must-have, giá trị cao nhất)

Sửa đúng lời than gốc; có thể ship riêng.

- **B3** — tính `lang` từ `openingTopic`+`contentTurns`, chèn chỉ thị `OUTPUT LANGUAGE` vào:
  - graph prompt (`runSplitMultiFrameGenerate`, ~3162)
  - per-frame prompt (~3270)
  - single-shot generate phase (~2745)
- **B4** — khử tiếng Trung scaffold: nhãn `类型/内容/风格/主题/时长/帧数` → English; bỏ ví dụ
  cấm & placeholder tiếng Trung trong 3 prompt trên.

### Phase 2 — Chrome (hiển thị)

Phụ thuộc P1 đã có `lang`.

- **B1** — helper mới `detectUserLang(text)` + map `LANG_NAME` (khối helper đầu file).
- **B2** — helper mới `tServer(lang, key, params)`: từ điển nhỏ cho 8 chuỗi tiến trình (en/zh/vi).
- **B5** — thay 8 `onProgress("…中文…")` → `onProgress(tServer(lang,'progress.x',{…}))`
  tại dòng 3158, 3161, 3258, 3266, 3348, 3370, 3376, 3382.
- **B6** — marker dòng 2216 → match token ổn định, **vẫn giữ match marker Trung cũ**
  (tương thích ngược cho project đang chạy dở).
- **F1** — thêm `'vi'` vào `AVAILABLE_LOCALES` trong `i18n.js`.
- **F2** — thêm khối `vi: { … }` dịch ~220 key trong `i18n.js`.
- **F3** — migrate chuỗi CJK hiển thị trong `app.js` (nút form `提交↵`/`+添加文件`/`📎拖拽…`,
  nút confirm `✓开始生成`/`✏️修改`, toast `保存失败`/`已保存N处修改`) sang `t()`; thêm key vào en/zh/vi.

### Phase 3 — Parse intent tiếng Việt (robustness)

Additive, rủi ro thấp; tách để không phình P1.

- **B7** — thêm từ đồng nghĩa tiếng Việt vào ~10 regex parse input tại dòng
  1892, 1896, 1933, 1937, 1941, 2011, 2021, 2109, 2270-2273, 2714
  (đổi phong cách / thời lượng / nội dung / bỏ qua / tiếp tục / ngẫu nhiên / tỉ lệ khung).

## 5. Danh sách file chạm

| File | Thay đổi |
|---|---|
| `packages/cli/src/studio-server.ts` | B1–B7 (backend: detect, tServer, prompt, progress, marker, regex) |
| `packages/project-studio/public/i18n.js` | F1, F2 (locale `vi` + từ điển) |
| `packages/project-studio/public/app.js` | F3 (migrate chuỗi hardcode sang `t()`) |

## 6. Xử lý lỗi (edge cases)

- `detectUserLang`: input ngắn/rỗng/mơ hồ → mặc định **`en`** (trung tính, không phải `zh`).
- `tServer` thiếu key → fallback `en` → trả về chính key (giống i18n frontend).
- Marker B6: giữ match cả marker tiếng Trung cũ → project đang generate dở không vỡ.
- `vi` thiếu key trong i18n → cơ chế fallback `en` → key đã có sẵn, không cần thêm.
- Bài nguồn rất dài & khác ngôn ngữ: chỉ thị nhấn mạnh "dịch sang {LANG_NAME}",
  không để source material kéo output trôi ngôn ngữ.

## 7. Test (end-to-end thật — KHÔNG mock, theo chuẩn dự án)

> Chuẩn dự án (CLAUDE.md): các fix liên quan render/agent **phải xác minh end-to-end với
> agent thật**, không tin "tsc pass + logic nhìn đúng".

1. **detectUserLang** — assert nhanh với mẫu vi / zh / en / pha trộn.
2. **P1 (cốt lõi)** — chạy 1 chat **tiếng Việt** qua generate bằng agent thật → đọc
   content-graph + frame HTML → khẳng định visible text **không còn chữ Hán** và đúng tiếng Việt.
   Đối chứng: input tiếng Trung → Trung; English → English.
3. **P2** — mở studio với locale `vi` (`localStorage hv.studio.locale='vi'` hoặc browser vi-VN)
   → nhãn UI + toast + dòng tiến trình ra tiếng Việt; xác nhận generation **vẫn hoàn tất**
   (marker B6 còn hoạt động, frames hiện ra).
4. **P3** — gõ "đổi phong cách" / "bỏ qua" / "tiếp tục" → vào đúng nhánh xử lý.

## 8. Ngoài phạm vi (YAGNI)

- Không thêm dropdown chọn ngôn ngữ thủ công (user đã chọn cơ chế auto; i18n đã hỗ trợ
  override qua `localStorage` nếu cần sau này).
- Không dịch comment code (không hiển thị cho user).
- Không đụng template content tiếng Trung (là dữ liệu mẫu của từng template, không phải
  ngôn ngữ output — output do prompt + i18n điều khiển).
- Không thêm ngôn ngữ thứ 4 ngoài vi/zh/en ở vòng này.
