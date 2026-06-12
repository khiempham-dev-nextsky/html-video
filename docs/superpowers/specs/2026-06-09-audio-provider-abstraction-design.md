# Thiết kế: Trừu tượng hoá Audio Provider + TTS free (edge-tts) + nhạc CC0

> Ngày: 2026-06-09 · Trạng thái: spec ĐÃ CHỐT (design-only) · Branch: `design/audio-provider-abstraction`
> Bối cảnh dùng: **cá nhân** (rào cản license/ToS thương mại không áp dụng).

## 1. Mục tiêu

Bỏ tình trạng **fix cứng 1 provider trả phí (MiniMax)** cho soundtrack. Thay bằng **kiến trúc provider
cắm thêm được**, và bổ sung provider **free**:
- **TTS (thuyết minh): `edge-tts`** — giọng Microsoft Edge Neural, **free, không key**, giọng tiếng Việt
  `vi-VN-HoaiMyNeural` (nữ) / `vi-VN-NamMinhNeural` (nam). Gọi cloud → **không model/RAM/disk/Python**.
- **Music (nhạc nền): thư viện CC0** chọn theo mood (license-clean, zero-infra).
- Giữ **MiniMax** như provider trả phí tuỳ chọn.

## 2. Luồng hiện tại (đã khảo sát)

```
1. CONFIG    packages/cli/src/media-config.ts → .html-video/media-config.json (key MiniMax) | env
2. PROVIDER  packages/core/src/minimax.ts
             generateTts(opts)   → { bytes: Buffer, ext: '.mp3', providerNote, durationSec? }
             generateMusic(opts) → { bytes: Buffer, ext: '.mp3', providerNote }
3. ENDPOINT  packages/cli/src/studio-server.ts  POST /api/projects/:id/soundtrack
             resolveMinimax() → generateMusic/generateTts → addBufferAsset → project.soundtrack
4. MIX       packages/core/src/project.ts  exportMp4 → ffmpeg -i music -i narration → volume/afade/amix
```

**Hai phát hiện then chốt:**
- **Tầng 4 (mix) đã agnostic** — chỉ đọc file audio rồi ffmpeg trộn (nuốt MP3/WAV/bất kỳ). **Đổi provider KHÔNG đụng mix.**
- **Hợp đồng provider chỉ là 2 hàm trả `{ bytes, ext, providerNote, durationSec? }`** → ranh giới trừu tượng hoá tự nhiên.

## 3. Quyết định provider (đã chốt)

### 3.1 TTS = edge-tts

| Tiêu chí | edge-tts |
|---|---|
| Chi phí | **Free, không key, không quota thực tế** |
| Giọng VN | `vi-VN-HoaiMyNeural` (nữ), `vi-VN-NamMinhNeural` (nam) — Neural, tự nhiên/chuẩn |
| Hạ tầng | **Gọi cloud (HTTP), không model/RAM/disk/Python** → chạy mượt trên máy 8GB |
| Output | stream MP3 → Buffer (khớp hợp đồng `{bytes, ext:'.mp3'}`) |
| Tích hợp Node | npm `msedge-tts` (Node thuần): `setMetadata(voice, MP3)` → `toStream(text)` |
| Đánh đổi | Cần **mạng**; endpoint Edge **không chính thức** (chấp nhận được cho cá nhân); MS có thể đổi/chặn → phải update lib |

**Đã cân nhắc & loại (ghi để khỏi đề xuất lại):**
- **OmniVoice (k2-fsa)** — Apache-2.0, local, VN có; nhưng **nặng trên 8GB** (~6GB disk, PyTorch+MPS). Để ngỏ làm
  *tuỳ chọn offline tương lai* khi cần chạy không mạng / máy mạnh hơn.
- **Coqui XTTS-v2 / viXTTS** — chất lượng VN tốt nhưng **license non-commercial** + cần Python ≤3.12. Cá nhân thì
  dùng được, nhưng nặng và không hợp nếu sau này ship → **không chọn làm default**.

### 3.2 Music = thư viện CC0 theo mood

- Bundle ~12-20 track **CC0** dưới `assets/audio-cc0/` + manifest `{ file, mood[], bpm, license, source_url }`.
- `generateMusic(prompt, mood?, durationSec?)` → chọn track khớp mood → ffmpeg **loop/trim** về đúng độ dài video.
- License-clean, zero-infra. Giữ MiniMax cho ai muốn generative.

## 4. Cấu hình máy (tham chiếu) — vì sao chọn cloud/zero-infra

Máy hiện tại: **Apple M2 · 8GB RAM · 20GB disk trống · Python 3.13**. RAM 8GB + 20GB disk là nút thắt cho model
local (OmniVoice/viXTTS sát ngưỡng). **edge-tts (cloud) + CC0 (file tĩnh) né hoàn toàn ràng buộc này** → không cần
doctor-gate phần cứng, không tải GB, không venv. Đây là lý do chính chốt 2 hướng free này.

## 5. Kiến trúc đề xuất

### 5.1 Interface (giữ đúng hợp đồng hiện có)

```ts
// packages/core/src/audio/types.ts
export interface AudioResult { bytes: Buffer; ext: string; providerNote: string; durationSec?: number }

export interface TtsProvider {
  id: string;                       // 'edge' | 'minimax'
  label: string;
  requiresKey: boolean;
  isAvailable(cfg): Promise<{ ok: boolean; reason?: string }>;
  listVoices?(): Array<{ id: string; label: string; lang: string }>;
  generateTts(opts: { text: string; voiceId?: string; lang?: string; signal?: AbortSignal }): Promise<AudioResult>;
}
export interface MusicProvider {
  id: string;                       // 'cc0' | 'minimax'
  label: string;
  requiresKey: boolean;
  isAvailable(cfg): Promise<{ ok: boolean; reason?: string }>;
  generateMusic(opts: { prompt: string; mood?: string; durationSec?: number; instrumental?: boolean; signal?: AbortSignal }): Promise<AudioResult>;
}
```

### 5.2 Provider mới

- `packages/core/src/audio/edge-tts.ts` — `EdgeTtsProvider` dùng `msedge-tts`. Voice mặc định theo `lang`
  (`vi` → `vi-VN-HoaiMyNeural`). `toStream` → gom Buffer → `{ bytes, ext:'.mp3', providerNote, durationSec? }`.
  `isAvailable` = luôn ok (không cần key); lỗi mạng → ném có thông điệp thân thiện.
- `packages/core/src/audio/cc0-music.ts` — `Cc0MusicProvider` đọc manifest, chọn track theo mood, ffmpeg loop/trim.
- `packages/core/src/audio/minimax-provider.ts` — bọc `generateTts/generateMusic` cũ vào interface (giữ nguyên logic).

### 5.3 Registry + config

- `packages/core/src/audio/registry.ts`: đăng ký provider, trả danh sách `isAvailable`.
- `media-config.ts` mở rộng: `audio: { ttsProvider?: 'edge'|'minimax'; musicProvider?: 'cc0'|'minimax'; ttsVoiceId?; minimax?: {...} }`.
  **Mặc định: ttsProvider = `edge`, musicProvider = `cc0`** (đều free, chạy ngay không cần key).

### 5.4 Endpoint + Mix

- `studio-server.ts` `/soundtrack`: thay `resolveMinimax()` + gọi trực tiếp → `registry.tts(cfg).generateTts(...)` /
  `registry.music(cfg).generateMusic(...)`. Lưu asset + `project.soundtrack` **giữ nguyên**.
- **Tầng 4 (mix) KHÔNG đổi.**

### 5.5 Frontend

- Settings → Âm thanh: dropdown **TTS provider** + **Music provider** (chỉ hiện provider available) + chọn **giọng** (HoaiMy/NamMinh).
  MiniMax key thành mục con khi chọn provider MiniMax. Mặc định edge + cc0 → **dùng được ngay, không cần nhập key**.
- i18n: thêm key nhãn provider/giọng (vi/en/zh) theo pattern hiện có.

## 6. Rủi ro & lưu ý

- **edge-tts là endpoint không chính thức** → có thể bị đổi/chặn; cần mạng. Chấp nhận cho cá nhân; nếu sau ship
  thương mại thì chuyển sang Azure Speech (cùng giọng, có key) hoặc OmniVoice local.
- **CC0 library**: phải kiểm từng track đúng CC0 + ghi `source_url` (giống RFC-07 provenance).
- **Format**: edge-tts trả MP3 → vào ffmpeg mix ngon, không cần transcode.

## 7. Ngoài phạm vi (lần này)

- Generative music OSS (MusicGen/Stable Audio) — để ngỏ khi có máy GPU.
- OmniVoice/viXTTS local — để ngỏ làm "tuỳ chọn offline" tương lai (interface đã chừa chỗ).
- Voice cloning từ giọng người dùng.

## 8. Việc tiếp theo

→ Viết implementation plan: interface → edge-tts provider (TDD) → cc0-music provider + bundle track →
minimax-provider wrap → registry → config → endpoint rewire → frontend picker → e2e (xuất narration VN + mix MP4).
