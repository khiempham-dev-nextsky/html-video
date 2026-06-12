/**
 * @html-video/core — edge-tts provider.
 *
 * Free neural narration via Microsoft Edge's online Read-Aloud endpoint (no API
 * key). Default Vietnamese voices: vi-VN-HoaiMyNeural (female) / NamMinhNeural
 * (male). It is a cloud call — no local model, RAM, disk, or Python — so it runs
 * unchanged on low-memory machines. Caveat: the endpoint is unofficial (it may
 * change) and needs internet; acceptable for personal use.
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import type { Readable } from 'node:stream';
import { HtmlVideoError } from '../errors.js';
import type { AudioResult, TtsProvider } from './types.js';

const VOICE_BY_LANG: Record<string, string> = {
  vi: 'vi-VN-HoaiMyNeural',
  en: 'en-US-AriaNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
};
const DEFAULT_VOICE = 'vi-VN-HoaiMyNeural';

/** Pick the edge voice: explicit id wins, else by 2-letter lang, else Vietnamese. */
export function resolveEdgeVoice(opts: { voiceId?: string; lang?: string }): string {
  const v = (opts.voiceId || '').trim();
  if (v) return v;
  return VOICE_BY_LANG[(opts.lang || 'vi').slice(0, 2)] ?? DEFAULT_VOICE;
}

function collectStream(stream: Readable, signal?: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    if (signal) {
      if (signal.aborted) { reject(new Error('aborted')); return; }
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }
    stream.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/** Synthesize MP3 narration via Microsoft Edge's free Read-Aloud endpoint. */
export async function generateEdgeTts(opts: {
  text: string; voiceId?: string; lang?: string; signal?: AbortSignal;
}): Promise<AudioResult> {
  const text = (opts.text || '').trim();
  if (!text) throw new HtmlVideoError('invalid-input', 'narration text is empty');
  const voice = resolveEdgeVoice(opts);
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    // toStream returns the streams synchronously; audio flows asynchronously.
    const { audioStream } = tts.toStream(text);
    const bytes = await collectStream(audioStream as unknown as Readable, opts.signal);
    if (bytes.length === 0) throw new HtmlVideoError('render-failed', 'edge-tts returned empty audio');
    return { bytes, ext: '.mp3', providerNote: `edge-tts · ${voice} · ${bytes.length} bytes` };
  } catch (e) {
    if (e instanceof HtmlVideoError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new HtmlVideoError(
      'render-failed',
      `edge-tts failed: ${msg} (needs internet; the Edge endpoint may have changed)`,
      true,
    );
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
