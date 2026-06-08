import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectUserLang, outputLanguageDirective } from '../dist/studio-server.js';

test('Vietnamese with diacritics → vi', () => {
  assert.equal(detectUserLang('Tạo cho tôi một video giới thiệu sản phẩm'), 'vi');
  assert.equal(detectUserLang('làm video về cây cầu'), 'vi');
});

test('Chinese (Han) → zh', () => {
  assert.equal(detectUserLang('做一个介绍产品的视频'), 'zh');
});

test('English → en', () => {
  assert.equal(detectUserLang('make a product launch video'), 'en');
});

test('empty / whitespace → en (neutral default, not zh)', () => {
  assert.equal(detectUserLang(''), 'en');
  assert.equal(detectUserLang('   '), 'en');
});

test('Vietnamese signal wins even when Latin words present', () => {
  assert.equal(detectUserLang('video về Open Design — nhấn mạnh tốc độ'), 'vi');
});

test('outputLanguageDirective names the language and forbids Chinese default', () => {
  const vi = outputLanguageDirective('vi');
  assert.match(vi, /Vietnamese/);
  assert.match(vi, /Do NOT default to Chinese/);
  const en = outputLanguageDirective('en');
  assert.match(en, /English/);
});
