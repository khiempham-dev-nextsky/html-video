/**
 * @html-video/core — audio provider abstraction.
 *
 * One contract for narration (TTS) and background music, identical to what the
 * studio already consumes: a provider returns decoded audio `bytes` plus a file
 * `ext`, a human note, and an optional duration. Swapping providers therefore
 * never touches the export-time ffmpeg mix (which only reads the stored file).
 */

export interface AudioResult {
  /** Decoded audio bytes (e.g. MP3). */
  bytes: Buffer;
  /** File extension to store under (e.g. '.mp3'). */
  ext: string;
  /** Human-readable note of what was produced (provider · voice/track · size). */
  providerNote: string;
  /** Reported duration in seconds, if known. */
  durationSec?: number;
}

/** Resolved selection + credentials passed to providers at call time. */
export interface AudioProviderConfig {
  /** Selected TTS provider id (default 'edge'). */
  ttsProvider?: string;
  /** Selected music provider id (default 'cc0'). */
  musicProvider?: string;
  /** Preferred TTS voice id (provider-specific). */
  ttsVoiceId?: string;
  /** MiniMax credentials, when the MiniMax provider is selected. */
  minimax?: { apiKey: string; baseUrl: string };
}

export interface TtsProvider {
  id: string;
  label: string;
  /** True if the provider needs an API key configured before it can run. */
  requiresKey: boolean;
  isAvailable(cfg: AudioProviderConfig): Promise<{ ok: boolean; reason?: string }>;
  /** Voices the UI can offer; omitted when the provider has none to list. */
  listVoices?(): Array<{ id: string; label: string; lang: string }>;
  generateTts(opts: {
    text: string;
    voiceId?: string;
    lang?: string;
    cfg: AudioProviderConfig;
    signal?: AbortSignal;
  }): Promise<AudioResult>;
}

export interface MusicProvider {
  id: string;
  label: string;
  requiresKey: boolean;
  isAvailable(cfg: AudioProviderConfig): Promise<{ ok: boolean; reason?: string }>;
  generateMusic(opts: {
    prompt: string;
    mood?: string;
    durationSec?: number;
    instrumental?: boolean;
    cfg: AudioProviderConfig;
    signal?: AbortSignal;
  }): Promise<AudioResult>;
}
