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
  assert.equal(r.music({ musicProvider: 'nope' }).id, 'cc0');
});

test('lists available providers with availability flags', async () => {
  const r = new AudioRegistry();
  const tts = await r.availableTts({});
  assert.ok(tts.find((p) => p.id === 'edge')?.ok);
  // MiniMax is listed but unavailable without a key.
  assert.equal(tts.find((p) => p.id === 'minimax')?.ok, false);
});
