import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hadGenerationYet, GENERATED_MARKER } from '../dist/studio-server.js';

const asst = (content: string) => ({ role: 'assistant' as const, content });

test('detects via stable marker regardless of language', () => {
  assert.equal(hadGenerationYet([asst('✓ Khung 3/3 xong (outro) ' + GENERATED_MARKER)]), true);
});

test('still detects legacy Chinese markers (backward compat)', () => {
  assert.equal(hadGenerationYet([asst('✓ 故事板规划完成：3 帧')]), true);
});

test('still detects legacy English summary line', () => {
  assert.equal(hadGenerationYet([asst('✓ 3-frame storyboard generated (intent: explainer)')]), true);
});

test('no generation yet', () => {
  assert.equal(hadGenerationYet([asst('Pick a style first')]), false);
});
