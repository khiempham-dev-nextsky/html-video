# Audio Provider Abstraction + edge-tts + CC0 Music — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the hard-wired MiniMax soundtrack with a pluggable provider layer, and add free providers: **edge-tts** (Vietnamese Neural narration, cloud, no key) and a **CC0 music library** (mood-matched), keeping MiniMax as an optional provider.

**Architecture:** A `TtsProvider` / `MusicProvider` interface (same `{bytes, ext, providerNote, durationSec?}` contract as today) + a registry. The studio endpoint resolves the configured provider from the registry instead of importing MiniMax directly. The export-time ffmpeg mix is unchanged (already format-agnostic). edge-tts is a cloud call (no model/RAM/disk/Python), so no hardware gate is needed.

**Tech Stack:** TypeScript (Node 20+, ESM, global `fetch`), `msedge-tts` (Node), ffmpeg (already a dep), Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-06-09-audio-provider-abstraction-design.md`
**Branch:** `design/audio-provider-abstraction`
**Context:** personal use (edge-tts unofficial endpoint accepted).

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/core/src/audio/types.ts` | `AudioResult`, `TtsProvider`, `MusicProvider`, `AudioProviderConfig` |
| `packages/core/src/audio/edge-tts.ts` | edge-tts provider (`resolveEdgeVoice`, `generateEdgeTts`) |
| `packages/core/src/audio/cc0-music.ts` | CC0 library provider (`selectTrackByMood`, `generateCc0Music`) |
| `packages/core/src/audio/minimax-provider.ts` | Wrap existing `generateTts`/`generateMusic` into the interface |
| `packages/core/src/audio/registry.ts` | `AudioRegistry` — register + resolve providers from config |
| `packages/core/src/index.ts` | Re-export the audio module |
| `assets/audio-cc0/` + `manifest.json` | Bundled CC0 tracks + license manifest |
| `packages/cli/src/media-config.ts` | Persist `audio` provider selection + voice |
| `packages/cli/src/studio-server.ts` | Rewire `/soundtrack` to the registry |
| `packages/project-studio/public/{app.js,i18n.js,index.html}` | Provider/voice picker + i18n |
| `packages/core/test/*.test.ts` | Unit tests (pure helpers + registry) |

---

## Task 1: Audio provider interface + types

**Files:** Create `packages/core/src/audio/types.ts`; Test `packages/core/test/audio-types.test.ts`

- [ ] **Step 1: Write the failing test** (a compile/shape smoke that imports the types via a dummy impl)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TtsProvider, MusicProvider, AudioResult } from '../dist/audio/types.js';

test('a minimal TtsProvider satisfies the interface', () => {
  const p: TtsProvider = {
    id: 'dummy', label: 'Dummy', requiresKey: false,
    async isAvailable() { return { ok: true }; },
    async generateTts() { return { bytes: Buffer.from('x'), ext: '.mp3', providerNote: 'n' } as AudioResult; },
  };
  assert.equal(p.id, 'dummy');
});
```

- [ ] **Step 2: Run → fail** `pnpm --filter @html-video/core test` (module missing)
- [ ] **Step 3: Implement** `packages/core/src/audio/types.ts`:

```ts
export interface AudioResult { bytes: Buffer; ext: string; providerNote: string; durationSec?: number }

export interface AudioProviderConfig {
  ttsProvider?: string;          // 'edge' | 'minimax'
  musicProvider?: string;        // 'cc0' | 'minimax'
  ttsVoiceId?: string;
  minimax?: { apiKey: string; baseUrl: string };
}

export interface TtsProvider {
  id: string;
  label: string;
  requiresKey: boolean;
  isAvailable(cfg: AudioProviderConfig): Promise<{ ok: boolean; reason?: string }>;
  listVoices?(): Array<{ id: string; label: string; lang: string }>;
  generateTts(opts: { text: string; voiceId?: string; lang?: string; cfg: AudioProviderConfig; signal?: AbortSignal }): Promise<AudioResult>;
}

export interface MusicProvider {
  id: string;
  label: string;
  requiresKey: boolean;
  isAvailable(cfg: AudioProviderConfig): Promise<{ ok: boolean; reason?: string }>;
  generateMusic(opts: { prompt: string; mood?: string; durationSec?: number; instrumental?: boolean; cfg: AudioProviderConfig; signal?: AbortSignal }): Promise<AudioResult>;
}
```

- [ ] **Step 4: Run → pass** `pnpm --filter @html-video/core test`
- [ ] **Step 5: Commit** `feat(core): audio provider interface + types`

---

## Task 2: edge-tts TTS provider

**Files:** Create `packages/core/src/audio/edge-tts.ts`; add dep `msedge-tts`; Test `packages/core/test/edge-tts.test.ts`

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter @html-video/core add msedge-tts`
Then verify the installed API shape (the `toStream` return differs across versions):
`node -e "const m=require('msedge-tts'); console.log(Object.keys(m)); console.log(Object.keys(m.OUTPUT_FORMAT).filter(k=>/MP3/.test(k)))"`
Expected: prints `MsEdgeTTS`, `OUTPUT_FORMAT`, and an MP3 format key (e.g. `AUDIO_24KHZ_48KBITRATE_MONO_MP3`).
If the MP3 constant name differs, use the one printed.

- [ ] **Step 2: Write the failing test** (pure voice-resolution helper — deterministic, offline)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEdgeVoice } from '../dist/audio/edge-tts.js';

test('explicit voiceId wins', () => {
  assert.equal(resolveEdgeVoice({ voiceId: 'vi-VN-NamMinhNeural' }), 'vi-VN-NamMinhNeural');
});
test('vi lang → HoaiMy default', () => {
  assert.equal(resolveEdgeVoice({ lang: 'vi' }), 'vi-VN-HoaiMyNeural');
});
test('unknown lang → vi default (this build targets Vietnamese)', () => {
  assert.equal(resolveEdgeVoice({}), 'vi-VN-HoaiMyNeural');
});
test('en / zh map to their neural voices', () => {
  assert.equal(resolveEdgeVoice({ lang: 'en' }), 'en-US-AriaNeural');
  assert.equal(resolveEdgeVoice({ lang: 'zh' }), 'zh-CN-XiaoxiaoNeural');
});
```

- [ ] **Step 3: Run → fail**
- [ ] **Step 4: Implement** `packages/core/src/audio/edge-tts.ts`:

```ts
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { HtmlVideoError } from '../errors.js';
import type { AudioResult, TtsProvider } from './types.js';

const VOICE_BY_LANG: Record<string, string> = {
  vi: 'vi-VN-HoaiMyNeural',
  en: 'en-US-AriaNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
};
const DEFAULT_VOICE = 'vi-VN-HoaiMyNeural';

/** Pick the edge voice: explicit id wins, else by lang, else Vietnamese default. */
export function resolveEdgeVoice(opts: { voiceId?: string; lang?: string }): string {
  const v = (opts.voiceId || '').trim();
  if (v) return v;
  return VOICE_BY_LANG[(opts.lang || 'vi').slice(0, 2)] ?? DEFAULT_VOICE;
}

/** Synthesize MP3 narration via Microsoft Edge's free Read-Aloud endpoint. */
export async function generateEdgeTts(opts: {
  text: string; voiceId?: string; lang?: string; signal?: AbortSignal;
}): Promise<AudioResult> {
  const text = (opts.text || '').trim();
  if (!text) throw new HtmlVideoError('invalid-input', 'narration text is empty');
  const voice = resolveEdgeVoice(opts);
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(text);
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      opts.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      audioStream.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
      audioStream.on('end', () => resolve());
      audioStream.on('error', reject);
    });
    const bytes = Buffer.concat(chunks);
    if (bytes.length === 0) throw new HtmlVideoError('render-failed', 'edge-tts returned empty audio');
    return { bytes, ext: '.mp3', providerNote: `edge-tts · ${voice} · ${bytes.length} bytes` };
  } catch (e) {
    if (e instanceof HtmlVideoError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new HtmlVideoError('render-failed', `edge-tts failed: ${msg} (needs internet; the Edge endpoint may have changed)`, true);
  }
}

export const edgeTtsProvider: TtsProvider = {
  id: 'edge',
  label: 'Edge TTS (free)',
  requiresKey: false,
  async isAvailable() { return { ok: true }; },
  listVoices: () => [
    { id: 'vi-VN-HoaiMyNeural', label: 'Tiếng Việt · Hoài My (nữ)', lang: 'vi' },
    { id: 'vi-VN-NamMinhNeural', label: 'Tiếng Việt · Nam Minh (nam)', lang: 'vi' },
    { id: 'en-US-AriaNeural', label: 'English · Aria', lang: 'en' },
    { id: 'zh-CN-XiaoxiaoNeural', label: '中文 · 晓晓', lang: 'zh' },
  ],
  generateTts: (o) => generateEdgeTts(o),
};
```

> If the installed `msedge-tts` `toStream` returns a `Readable` directly (not `{audioStream}`), adapt the destructuring per the Step-1 API check.

- [ ] **Step 5: Run → pass** (the pure helper tests)
- [ ] **Step 6: Real network smoke (manual, may skip offline)**

```bash
node -e '
import("./packages/core/dist/audio/edge-tts.js").then(async m => {
  const r = await m.generateEdgeTts({ text: "Xin chào, đây là giọng đọc thử bằng tiếng Việt.", lang: "vi" });
  require("fs").writeFileSync("/tmp/edge-vi.mp3", r.bytes);
  console.log(r.providerNote, "→ /tmp/edge-vi.mp3");
});'
```
Expected: a non-empty `/tmp/edge-vi.mp3` you can play. `ffprobe /tmp/edge-vi.mp3` shows a valid mp3 with duration > 0.

- [ ] **Step 7: Commit** `feat(core): edge-tts provider (free Vietnamese neural narration)`

---

## Task 3: CC0 music provider + bundled library

**Files:** Create `packages/core/src/audio/cc0-music.ts`, `assets/audio-cc0/manifest.json` (+ track files); Test `packages/core/test/cc0-music.test.ts`

- [ ] **Step 1: Source the tracks (content task)**

Collect 12–20 genuinely **CC0** instrumental tracks (e.g. from Pixabay Music CC0 / Free Music Archive CC0). Place under `assets/audio-cc0/*.mp3`. Write `assets/audio-cc0/manifest.json`:

```json
{
  "tracks": [
    { "file": "calm-ambient-01.mp3", "moods": ["calm", "ambient", "cinematic"], "bpm": 70, "license": "CC0-1.0", "source_url": "https://…" },
    { "file": "upbeat-corporate-01.mp3", "moods": ["upbeat", "corporate", "energetic"], "bpm": 120, "license": "CC0-1.0", "source_url": "https://…" }
  ]
}
```
> Verify each track's CC0 status and record `source_url` (mirrors RFC-07 provenance). Do NOT ship a track without a confirmed permissive license.

- [ ] **Step 2: Write the failing test** (pure mood-selection)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTrackByMood } from '../dist/audio/cc0-music.js';

const manifest = { tracks: [
  { file: 'a.mp3', moods: ['calm', 'ambient'], bpm: 70, license: 'CC0-1.0', source_url: 'x' },
  { file: 'b.mp3', moods: ['upbeat', 'energetic'], bpm: 120, license: 'CC0-1.0', source_url: 'y' },
]};

test('prompt mentioning a mood word picks the matching track', () => {
  assert.equal(selectTrackByMood(manifest, 'calm cinematic ambient, slow build')?.file, 'a.mp3');
  assert.equal(selectTrackByMood(manifest, 'fast upbeat energetic intro')?.file, 'b.mp3');
});
test('no mood match → first track (deterministic fallback)', () => {
  assert.equal(selectTrackByMood(manifest, 'something with no mood words')?.file, 'a.mp3');
});
test('empty manifest → null', () => {
  assert.equal(selectTrackByMood({ tracks: [] }, 'calm'), null);
});
```

- [ ] **Step 3: Run → fail**
- [ ] **Step 4: Implement** `packages/core/src/audio/cc0-music.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HtmlVideoError } from '../errors.js';
import type { AudioResult, MusicProvider } from './types.js';

export interface Cc0Track { file: string; moods: string[]; bpm?: number; license: string; source_url: string }
export interface Cc0Manifest { tracks: Cc0Track[] }

/** Choose the track whose moods best overlap the prompt's words. Deterministic:
 *  highest overlap wins; ties + no-match fall back to the first track. */
export function selectTrackByMood(manifest: Cc0Manifest, prompt: string): Cc0Track | null {
  const tracks = manifest.tracks ?? [];
  if (tracks.length === 0) return null;
  const words = new Set((prompt || '').toLowerCase().split(/[^a-z]+/).filter(Boolean));
  let best = tracks[0]!, bestScore = -1;
  for (const t of tracks) {
    const score = t.moods.reduce((n, m) => n + (words.has(m.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

const HERE = dirname(fileURLToPath(import.meta.url));
// dist/audio → repo assets/audio-cc0 (adjust depth if the build layout differs)
const LIBRARY_DIR = join(HERE, '..', '..', '..', '..', 'assets', 'audio-cc0');

/** Pick a CC0 track by mood and loop/trim it to durationSec via ffmpeg. */
export async function generateCc0Music(opts: {
  prompt: string; durationSec?: number; libraryDir?: string; signal?: AbortSignal;
}): Promise<AudioResult> {
  const dir = opts.libraryDir ?? LIBRARY_DIR;
  const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) as Cc0Manifest;
  const track = selectTrackByMood(manifest, opts.prompt);
  if (!track) throw new HtmlVideoError('invalid-input', 'CC0 music library is empty');
  const src = join(dir, track.file);
  const dur = Math.max(1, Math.round(opts.durationSec ?? 15));
  // Loop the source then hard-trim to dur seconds → MP3 bytes on stdout.
  const args = ['-y', '-stream_loop', '-1', '-i', src, '-t', String(dur), '-f', 'mp3', '-'];
  const bytes = await runFfmpegToBuffer(args, opts.signal);
  return { bytes, ext: '.mp3', providerNote: `cc0/${track.file} · ${track.license} · ${dur}s` };
}

function runFfmpegToBuffer(args: string[], signal?: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = []; let err = '';
    signal?.addEventListener('abort', () => proc.kill('SIGKILL'), { once: true });
    proc.stdout.on('data', (c) => out.push(Buffer.from(c)));
    proc.stderr.on('data', (c) => { err += c.toString(); });
    proc.on('error', (e) => reject(new HtmlVideoError('render-failed',
      (e as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'ffmpeg not found on PATH. Install with `brew install ffmpeg`.'
        : `ffmpeg failed: ${e.message}`)));
    proc.on('close', (code) => code === 0 && out.length
      ? resolve(Buffer.concat(out))
      : reject(new HtmlVideoError('render-failed', `ffmpeg cc0 mux exit ${code}: ${err.slice(-500)}`)));
  });
}

export const cc0MusicProvider: MusicProvider = {
  id: 'cc0',
  label: 'CC0 library (free)',
  requiresKey: false,
  async isAvailable() {
    try { await readFile(join(LIBRARY_DIR, 'manifest.json'), 'utf8'); return { ok: true }; }
    catch { return { ok: false, reason: 'CC0 library not bundled' }; }
  },
  generateMusic: (o) => generateCc0Music(o),
};
```

- [ ] **Step 5: Run → pass** (mood-selection tests)
- [ ] **Step 6: ffmpeg smoke (after at least one real track is added)**: generate a 5s clip, `ffprobe` shows ~5s mp3.
- [ ] **Step 7: Commit** `feat(core): CC0 music provider + mood selection + bundled manifest`

---

## Task 4: MiniMax provider wrapper

**Files:** Create `packages/core/src/audio/minimax-provider.ts`

- [ ] **Step 1: Implement** (wrap the existing functions — no behavior change):

```ts
import { generateTts as minimaxTts, generateMusic as minimaxMusic } from '../minimax.js';
import { HtmlVideoError } from '../errors.js';
import type { AudioResult, TtsProvider, MusicProvider } from './types.js';

function creds(cfg: { minimax?: { apiKey: string; baseUrl: string } }) {
  if (!cfg.minimax?.apiKey) throw new HtmlVideoError('invalid-input', 'MiniMax key not configured');
  return cfg.minimax;
}

export const minimaxTtsProvider: TtsProvider = {
  id: 'minimax', label: 'MiniMax (paid)', requiresKey: true,
  async isAvailable(cfg) { return cfg.minimax?.apiKey ? { ok: true } : { ok: false, reason: 'no key' }; },
  async generateTts(o): Promise<AudioResult> {
    const r = await minimaxTts({ text: o.text, ...(o.voiceId && { voiceId: o.voiceId }), creds: creds(o.cfg), ...(o.signal && { signal: o.signal }) });
    return { bytes: r.bytes, ext: r.ext, providerNote: r.providerNote, ...(r.durationSec !== undefined && { durationSec: r.durationSec }) };
  },
};

export const minimaxMusicProvider: MusicProvider = {
  id: 'minimax', label: 'MiniMax (paid)', requiresKey: true,
  async isAvailable(cfg) { return cfg.minimax?.apiKey ? { ok: true } : { ok: false, reason: 'no key' }; },
  async generateMusic(o): Promise<AudioResult> {
    const r = await minimaxMusic({ prompt: o.prompt, instrumental: o.instrumental ?? true, creds: creds(o.cfg), ...(o.signal && { signal: o.signal }) });
    return { bytes: r.bytes, ext: r.ext, providerNote: r.providerNote };
  },
};
```

- [ ] **Step 2: Typecheck** `pnpm --filter @html-video/core typecheck`
- [ ] **Step 3: Commit** `feat(core): wrap MiniMax in the provider interface`

---

## Task 5: Registry + core exports

**Files:** Create `packages/core/src/audio/registry.ts`; edit `packages/core/src/index.ts`; Test `packages/core/test/audio-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioRegistry } from '../dist/audio/registry.js';

test('defaults to edge + cc0 when config is empty', () => {
  const r = new AudioRegistry();
  assert.equal(r.tts({}).id, 'edge');
  assert.equal(r.music({}).id, 'cc0');
});
test('honors an explicit provider choice', () => {
  const r = new AudioRegistry();
  assert.equal(r.tts({ ttsProvider: 'minimax' }).id, 'minimax');
  assert.equal(r.music({ musicProvider: 'minimax' }).id, 'minimax');
});
test('unknown id falls back to the default', () => {
  const r = new AudioRegistry();
  assert.equal(r.tts({ ttsProvider: 'nope' }).id, 'edge');
});
test('lists available providers', async () => {
  const r = new AudioRegistry();
  const tts = await r.availableTts({});
  assert.ok(tts.find((p) => p.id === 'edge'));
});
```

- [ ] **Step 2: Run → fail**
- [ ] **Step 3: Implement** `packages/core/src/audio/registry.ts`:

```ts
import type { AudioProviderConfig, TtsProvider, MusicProvider } from './types.js';
import { edgeTtsProvider } from './edge-tts.js';
import { cc0MusicProvider } from './cc0-music.js';
import { minimaxTtsProvider, minimaxMusicProvider } from './minimax-provider.js';

export class AudioRegistry {
  private ttsProviders: TtsProvider[];
  private musicProviders: MusicProvider[];
  constructor(opts?: { tts?: TtsProvider[]; music?: MusicProvider[] }) {
    this.ttsProviders = opts?.tts ?? [edgeTtsProvider, minimaxTtsProvider];
    this.musicProviders = opts?.music ?? [cc0MusicProvider, minimaxMusicProvider];
  }
  tts(cfg: AudioProviderConfig): TtsProvider {
    return this.ttsProviders.find((p) => p.id === cfg.ttsProvider) ?? this.ttsProviders[0]!;
  }
  music(cfg: AudioProviderConfig): MusicProvider {
    return this.musicProviders.find((p) => p.id === cfg.musicProvider) ?? this.musicProviders[0]!;
  }
  async availableTts(cfg: AudioProviderConfig) {
    const out = [];
    for (const p of this.ttsProviders) out.push({ id: p.id, label: p.label, requiresKey: p.requiresKey, ...(await p.isAvailable(cfg)) });
    return out;
  }
  async availableMusic(cfg: AudioProviderConfig) {
    const out = [];
    for (const p of this.musicProviders) out.push({ id: p.id, label: p.label, requiresKey: p.requiresKey, ...(await p.isAvailable(cfg)) });
    return out;
  }
}
```

- [ ] **Step 4: Export from `index.ts`** — add:
```ts
export * from './audio/types.js';
export { AudioRegistry } from './audio/registry.js';
export { resolveEdgeVoice, generateEdgeTts, edgeTtsProvider } from './audio/edge-tts.js';
export { selectTrackByMood, generateCc0Music, cc0MusicProvider } from './audio/cc0-music.js';
export { minimaxTtsProvider, minimaxMusicProvider } from './audio/minimax-provider.js';
```

- [ ] **Step 5: Run → pass**; **build** `pnpm --filter @html-video/core build`
- [ ] **Step 6: Commit** `feat(core): audio registry + exports`

---

## Task 6: Config — provider selection

**Files:** `packages/cli/src/media-config.ts`

- [ ] **Step 1: Extend `MediaConfig`** to hold an `audio` block + accessors:

```ts
interface MediaConfig {
  minimax?: { apiKey?: string; baseUrl?: string };
  audio?: { ttsProvider?: string; musicProvider?: string; ttsVoiceId?: string };
}
```

Add a method that builds the `AudioProviderConfig` the registry expects (merging the resolved MiniMax creds):

```ts
import type { AudioProviderConfig } from '@html-video/core';

resolveAudioConfig(): AudioProviderConfig {
  const cfg = this.read();
  const mm = this.resolveMinimax();
  return {
    ttsProvider: cfg.audio?.ttsProvider ?? 'edge',
    musicProvider: cfg.audio?.musicProvider ?? 'cc0',
    ...(cfg.audio?.ttsVoiceId && { ttsVoiceId: cfg.audio.ttsVoiceId }),
    ...(mm && { minimax: mm }),
  };
}

setAudio(sel: { ttsProvider?: string; musicProvider?: string; ttsVoiceId?: string }): void {
  const cfg = this.read();
  cfg.audio = { ...cfg.audio, ...sel };
  this.write(cfg);
}
```

- [ ] **Step 2: Typecheck + build** `pnpm --filter @html-video/cli build`
- [ ] **Step 3: Commit** `feat(cli): persist audio provider selection`

---

## Task 7: Rewire the studio endpoint to the registry

**Files:** `packages/cli/src/studio-server.ts` (the `/soundtrack` handler ~411–512, + `ctx` wiring)

- [ ] **Step 1: Add an `AudioRegistry` to the CLI context** (singleton next to `mediaConfig`). In `context.ts`/bootstrap, construct `new AudioRegistry()` and expose `ctx.audio`.

- [ ] **Step 2: Replace the MiniMax-direct calls.** In the soundtrack handler:

Replace:
```ts
const creds = ctx.mediaConfig.resolveMinimax();
if (!creds) { sse({ type: 'audio_failed', message: 'MiniMax API key not configured…' }); res.end(); return; }
```
with:
```ts
const audioCfg = ctx.mediaConfig.resolveAudioConfig();
const ttsP = ctx.audio.tts(audioCfg);
const musicP = ctx.audio.music(audioCfg);
const ttsAvail = await ttsP.isAvailable(audioCfg);
const musicAvail = await musicP.isAvailable(audioCfg);
```

Replace the `generateMusic({...creds})` call with:
```ts
const music = await musicP.generateMusic({
  prompt: body.music!.prompt!.trim(),
  instrumental: body.music!.instrumental ?? true,
  durationSec: /* project video duration if known */ undefined,
  cfg: audioCfg,
});
```
and check `musicAvail.ok` first (emit `audio_failed` with `musicAvail.reason` if not).

Replace the `generateTts({...creds})` call with:
```ts
const nar = await ttsP.generateTts({
  text: body.narration!.text!.trim(),
  ...(body.narration!.voiceId !== undefined && { voiceId: body.narration!.voiceId }),
  ...(audioCfg.ttsVoiceId && { voiceId: audioCfg.ttsVoiceId }),
  lang: /* infer from narration text via detectUserLang */ detectUserLang(body.narration!.text!),
  cfg: audioCfg,
});
```
(check `ttsAvail.ok` first.)

> `nar.ext` may now be `.mp3` (edge) — unchanged. The asset store + `project.soundtrack` + export mix are untouched.

- [ ] **Step 3: Add a providers status endpoint** `GET /api/audio/providers` → `{ tts: await ctx.audio.availableTts(cfg), music: await ctx.audio.availableMusic(cfg), voices: ttsP.listVoices?.() ?? [] }` for the frontend picker.

- [ ] **Step 4: Build + smoke** `pnpm -r build && pnpm --filter @html-video/cli smoke`
- [ ] **Step 5: Commit** `feat(studio): resolve soundtrack via audio registry (edge/cc0/minimax)`

---

## Task 8: Frontend — provider + voice picker

**Files:** `packages/project-studio/public/{app.js,index.html,i18n.js}`

- [ ] **Step 1:** Settings → Audio: fetch `/api/audio/providers`; render a **TTS provider** select, a **voice** select (from `listVoices`, default `vi-VN-HoaiMyNeural`), and a **Music provider** select. Show the MiniMax key field only when a MiniMax provider is selected.
- [ ] **Step 2:** Persist selections via a `PUT /api/audio/config` → `ctx.mediaConfig.setAudio(...)`.
- [ ] **Step 3:** Add i18n keys (`settings.audio.tts_provider`, `…voice`, `…music_provider`, provider/voice labels) to en/zh/vi.
- [ ] **Step 4:** Default state shows **edge + cc0** with no key needed → the Soundtrack panel works out of the box.
- [ ] **Step 5: Commit** `feat(studio): audio provider + voice picker (defaults edge + cc0, no key)`

---

## Task 9: End-to-end verification (real)

- [ ] **Step 1:** `pnpm -r build && pnpm --filter @html-video/core test` — all unit tests pass.
- [ ] **Step 2:** Start studio. With defaults (edge + cc0), open a generated project, in Soundtrack: enter Vietnamese narration + a mood (e.g. "calm cinematic"). Generate.
  Expected: narration asset is a valid mp3 (edge voice), music asset is a CC0 track looped to length — both with **no API key configured**.
- [ ] **Step 3:** Export MP4. `ffprobe` the output: it has an audio stream; `ffmpeg -f null -` decodes clean. Play it — Vietnamese narration over the CC0 bed.
- [ ] **Step 4:** Switch TTS provider to MiniMax in Settings (with a key) → narration regenerates via MiniMax. Confirms the abstraction swaps cleanly.

---

## Spec coverage

| Spec item | Task |
|---|---|
| Provider interface (same contract) | Task 1 |
| edge-tts free Vietnamese TTS | Task 2 |
| CC0 mood-matched music | Task 3 |
| MiniMax as a provider | Task 4 |
| Registry + defaults (edge/cc0) | Task 5 |
| Config selection | Task 6 |
| Endpoint rewire (mix unchanged) | Task 7 |
| Frontend picker, no-key default | Task 8 |
| Real e2e (VN narration + mix) | Task 9 |

## Notes / risks (from spec)
- edge-tts unofficial endpoint → may break; needs internet. Acceptable for personal use.
- CC0 tracks must be license-verified with `source_url` recorded (Task 3 Step 1).
- `msedge-tts` API shape verified at install (Task 2 Step 1) before coding the stream handling.
