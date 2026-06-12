import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTrackByMood } from '../dist/audio/cc0-music.js';

const manifest = {
  tracks: [
    { file: 'a.mp3', moods: ['calm', 'ambient'], bpm: 70, license: 'CC0-1.0', source_url: 'x' },
    { file: 'b.mp3', moods: ['upbeat', 'energetic'], bpm: 120, license: 'CC0-1.0', source_url: 'y' },
  ],
};

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
