import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isControlPhrase, parseFormatReply } from '../dist/studio-server.js';

test('Vietnamese continue phrases are control phrases', () => {
  assert.equal(isControlPhrase('tiếp tục'), true);
  assert.equal(isControlPhrase('bắt đầu'), true);
  assert.equal(isControlPhrase('tạo đi'), true);
});

test('existing zh/en control phrases still work', () => {
  assert.equal(isControlPhrase('继续'), true);
  assert.equal(isControlPhrase('continue'), true);
});

test('non-control Vietnamese sentence is not a control phrase', () => {
  assert.equal(isControlPhrase('làm video về sản phẩm của tôi'), false);
});

test('Vietnamese aspect keywords parse', () => {
  assert.equal(parseFormatReply('dọc 5s')?.aspect, '9:16 手机竖屏');
  assert.equal(parseFormatReply('ngang 10s')?.aspect, '16:9 横屏');
  assert.equal(parseFormatReply('vuông 5s')?.aspect, '1:1 方形');
});
