import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tServer } from '../dist/studio-server.js';

test('en planning string with param', () => {
  assert.equal(tServer('en', 'progress.planning', { n: 4 }), '📋 Planning a 4-frame storyboard…');
});

test('vi planning string with param', () => {
  assert.match(tServer('vi', 'progress.planning', { n: 4 }), /4/);
  assert.ok(!/[一-鿿]/.test(tServer('vi', 'progress.planning', { n: 4 })), 'no Han chars in vi');
});

test('zh keeps original Chinese', () => {
  assert.match(tServer('zh', 'progress.planning', { n: 4 }), /规划/);
});

test('unknown locale falls back to en', () => {
  assert.equal(tServer('xx', 'progress.frame_done', { i: 1, total: 3, id: 'intro' }),
    '  ✓ Frame 1/3 done (intro)');
});

test('unknown key returns the key', () => {
  assert.equal(tServer('en', 'progress.nope'), 'progress.nope');
});
