/**
 * @html-video/core — CC0 music provider.
 *
 * Background music from a bundled, license-clean library (CC0) instead of a paid
 * generative API. A prompt's mood words pick the best-matching track, then ffmpeg
 * loops/trims it to the video length. Zero infra: just audio files + ffmpeg
 * (already required for export). Each track records its license + source_url,
 * mirroring the template provenance discipline (RFC-07).
 */

import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HtmlVideoError } from '../errors.js';
import type { AudioResult, MusicProvider } from './types.js';

export interface Cc0Track {
  file: string;
  moods: string[];
  bpm?: number;
  license: string;
  source_url: string;
}
export interface Cc0Manifest { tracks: Cc0Track[] }

/**
 * Choose the track whose moods best overlap the prompt's words. Deterministic:
 * highest overlap wins; no match (or empty prompt) falls back to the first track.
 */
export function selectTrackByMood(manifest: Cc0Manifest, prompt: string): Cc0Track | null {
  const tracks = manifest.tracks ?? [];
  if (tracks.length === 0) return null;
  const words = new Set((prompt || '').toLowerCase().split(/[^a-z]+/).filter(Boolean));
  let best = tracks[0]!;
  let bestScore = -1;
  for (const t of tracks) {
    const score = t.moods.reduce((n, m) => n + (words.has(m.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

const HERE = dirname(fileURLToPath(import.meta.url));
// dist/audio → repo-root/assets/audio-cc0 (monorepo-local; studio runs from the repo).
const LIBRARY_DIR = join(HERE, '..', '..', '..', '..', 'assets', 'audio-cc0');

async function loadManifest(dir: string): Promise<Cc0Manifest> {
  const raw = await readFile(join(dir, 'manifest.json'), 'utf8');
  return JSON.parse(raw) as Cc0Manifest;
}

/** Pick a CC0 track by mood and loop/trim it to durationSec via ffmpeg → MP3 bytes. */
export async function generateCc0Music(opts: {
  prompt: string; durationSec?: number; libraryDir?: string; signal?: AbortSignal;
}): Promise<AudioResult> {
  const dir = opts.libraryDir ?? LIBRARY_DIR;
  const manifest = await loadManifest(dir);
  const track = selectTrackByMood(manifest, opts.prompt);
  if (!track) throw new HtmlVideoError('invalid-input', 'CC0 music library is empty');
  const src = join(dir, track.file);
  const dur = Math.max(1, Math.round(opts.durationSec ?? 15));
  // Loop the source, then hard-trim to dur seconds → MP3 on stdout.
  const args = ['-y', '-stream_loop', '-1', '-i', src, '-t', String(dur), '-f', 'mp3', '-'];
  const bytes = await runFfmpegToBuffer(args, opts.signal);
  return { bytes, ext: '.mp3', providerNote: `cc0/${track.file} · ${track.license} · ${dur}s`, durationSec: dur };
}

function runFfmpegToBuffer(args: string[], signal?: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    let err = '';
    signal?.addEventListener('abort', () => proc.kill('SIGKILL'), { once: true });
    proc.stdout.on('data', (c) => out.push(Buffer.from(c)));
    proc.stderr.on('data', (c) => { err += c.toString(); });
    proc.on('error', (e) => reject(new HtmlVideoError(
      'render-failed',
      (e as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'ffmpeg not found on PATH. Install with `brew install ffmpeg` (macOS).'
        : `ffmpeg failed: ${e.message}`,
    )));
    proc.on('close', (code) => (code === 0 && out.length
      ? resolve(Buffer.concat(out))
      : reject(new HtmlVideoError('render-failed', `ffmpeg cc0 mux exit ${code}: ${err.slice(-500)}`))));
  });
}

export const cc0MusicProvider: MusicProvider = {
  id: 'cc0',
  label: 'CC0 library (free)',
  requiresKey: false,
  async isAvailable() {
    try {
      const m = await loadManifest(LIBRARY_DIR);
      return (m.tracks?.length ?? 0) > 0 ? { ok: true } : { ok: false, reason: 'CC0 library is empty' };
    } catch {
      return { ok: false, reason: 'CC0 library not bundled' };
    }
  },
  generateMusic: (o) => generateCc0Music(o),
};
