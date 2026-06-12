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

test('a minimal MusicProvider satisfies the interface', () => {
  const p: MusicProvider = {
    id: 'dummy', label: 'Dummy', requiresKey: false,
    async isAvailable() { return { ok: true }; },
    async generateMusic() { return { bytes: Buffer.from('x'), ext: '.mp3', providerNote: 'n' } as AudioResult; },
  };
  assert.equal(p.requiresKey, false);
});
