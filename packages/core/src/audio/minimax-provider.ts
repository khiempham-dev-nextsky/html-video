/**
 * @html-video/core — MiniMax wrapped in the provider interface.
 *
 * Keeps the existing MiniMax narration/music behavior unchanged; only adapts the
 * call shape so MiniMax sits alongside edge-tts / cc0 in the registry. Credentials
 * come from the resolved AudioProviderConfig.
 */

import { generateTts as minimaxTts, generateMusic as minimaxMusic } from '../minimax.js';
import { HtmlVideoError } from '../errors.js';
import type { AudioResult, AudioProviderConfig, TtsProvider, MusicProvider } from './types.js';

function requireCreds(cfg: AudioProviderConfig): { apiKey: string; baseUrl: string } {
  if (!cfg.minimax?.apiKey) {
    throw new HtmlVideoError('invalid-input', 'MiniMax key not configured — add it in Settings → Audio.');
  }
  return cfg.minimax;
}

export const minimaxTtsProvider: TtsProvider = {
  id: 'minimax',
  label: 'MiniMax (paid)',
  requiresKey: true,
  async isAvailable(cfg) {
    return cfg.minimax?.apiKey ? { ok: true } : { ok: false, reason: 'no API key' };
  },
  async generateTts(o): Promise<AudioResult> {
    const r = await minimaxTts({
      text: o.text,
      ...(o.voiceId && { voiceId: o.voiceId }),
      creds: requireCreds(o.cfg),
      ...(o.signal && { signal: o.signal }),
    });
    return {
      bytes: r.bytes,
      ext: r.ext,
      providerNote: r.providerNote,
      ...(r.durationSec !== undefined && { durationSec: r.durationSec }),
    };
  },
};

export const minimaxMusicProvider: MusicProvider = {
  id: 'minimax',
  label: 'MiniMax (paid)',
  requiresKey: true,
  async isAvailable(cfg) {
    return cfg.minimax?.apiKey ? { ok: true } : { ok: false, reason: 'no API key' };
  },
  async generateMusic(o): Promise<AudioResult> {
    const r = await minimaxMusic({
      prompt: o.prompt,
      instrumental: o.instrumental ?? true,
      creds: requireCreds(o.cfg),
      ...(o.signal && { signal: o.signal }),
    });
    return { bytes: r.bytes, ext: r.ext, providerNote: r.providerNote };
  },
};
