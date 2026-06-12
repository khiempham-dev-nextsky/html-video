/**
 * @html-video/core — audio provider registry.
 *
 * Resolves the configured TTS / music provider (defaulting to the free edge-tts
 * and CC0 providers) and lists availability for the Settings UI. Providers are
 * injectable for testing.
 */

import type { AudioProviderConfig, TtsProvider, MusicProvider } from './types.js';
import { edgeTtsProvider } from './edge-tts.js';
import { cc0MusicProvider } from './cc0-music.js';
import { minimaxTtsProvider, minimaxMusicProvider } from './minimax-provider.js';

export interface ProviderStatus { id: string; label: string; requiresKey: boolean; ok: boolean; reason?: string }

export class AudioRegistry {
  private readonly ttsProviders: TtsProvider[];
  private readonly musicProviders: MusicProvider[];

  constructor(opts?: { tts?: TtsProvider[]; music?: MusicProvider[] }) {
    // First entry is the default; edge + cc0 are free and need no key.
    this.ttsProviders = opts?.tts ?? [edgeTtsProvider, minimaxTtsProvider];
    this.musicProviders = opts?.music ?? [cc0MusicProvider, minimaxMusicProvider];
  }

  tts(cfg: AudioProviderConfig): TtsProvider {
    return this.ttsProviders.find((p) => p.id === cfg.ttsProvider) ?? this.ttsProviders[0]!;
  }

  music(cfg: AudioProviderConfig): MusicProvider {
    return this.musicProviders.find((p) => p.id === cfg.musicProvider) ?? this.musicProviders[0]!;
  }

  async availableTts(cfg: AudioProviderConfig): Promise<ProviderStatus[]> {
    const out: ProviderStatus[] = [];
    for (const p of this.ttsProviders) {
      out.push({ id: p.id, label: p.label, requiresKey: p.requiresKey, ...(await p.isAvailable(cfg)) });
    }
    return out;
  }

  async availableMusic(cfg: AudioProviderConfig): Promise<ProviderStatus[]> {
    const out: ProviderStatus[] = [];
    for (const p of this.musicProviders) {
      out.push({ id: p.id, label: p.label, requiresKey: p.requiresKey, ...(await p.isAvailable(cfg)) });
    }
    return out;
  }
}
