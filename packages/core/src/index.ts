/**
 * @html-video/core — Public API surface.
 */

export * from './types/index.js';
export { HtmlVideoError } from './errors.js';
export type { ErrorCode } from './errors.js';
export { AssetStore } from './asset-store.js';
export type { AssetStoreOptions } from './asset-store.js';
export { EngineRegistry, TemplateRegistry, ProjectStore } from './registry.js';
export { ProjectOrchestrator } from './project.js';
export type {
  CreateProjectInput,
  ProjectOrchestratorDeps,
} from './project.js';
export {
  resolveMinimaxCredentials,
  generateTts,
  generateMusic,
} from './minimax.js';
export type { MinimaxCredentials, MinimaxAudioResult } from './minimax.js';

// Audio provider abstraction (edge-tts / cc0 / minimax behind one interface).
export type { AudioResult, AudioProviderConfig, TtsProvider, MusicProvider } from './audio/types.js';
export { AudioRegistry } from './audio/registry.js';
export type { ProviderStatus } from './audio/registry.js';
export { resolveEdgeVoice, generateEdgeTts, edgeTtsProvider } from './audio/edge-tts.js';
export { selectTrackByMood, generateCc0Music, cc0MusicProvider } from './audio/cc0-music.js';
export type { Cc0Track, Cc0Manifest } from './audio/cc0-music.js';
export { minimaxTtsProvider, minimaxMusicProvider } from './audio/minimax-provider.js';
