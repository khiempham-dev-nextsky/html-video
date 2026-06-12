import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEdgeVoice } from '../dist/audio/edge-tts.js';

test('explicit voiceId wins', () => {
  assert.equal(resolveEdgeVoice({ voiceId: 'vi-VN-NamMinhNeural' }), 'vi-VN-NamMinhNeural');
});

test('vi lang → HoaiMy default', () => {
  assert.equal(resolveEdgeVoice({ lang: 'vi' }), 'vi-VN-HoaiMyNeural');
});

test('unknown / empty lang → vi default (this build targets Vietnamese)', () => {
  assert.equal(resolveEdgeVoice({}), 'vi-VN-HoaiMyNeural');
  assert.equal(resolveEdgeVoice({ lang: 'xx' }), 'vi-VN-HoaiMyNeural');
});

test('en / zh map to their neural voices', () => {
  assert.equal(resolveEdgeVoice({ lang: 'en' }), 'en-US-AriaNeural');
  assert.equal(resolveEdgeVoice({ lang: 'zh' }), 'zh-CN-XiaoxiaoNeural');
});
