# Vietnamese Language Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generated frames + studio progress + UI chrome follow the user's chat language (Vietnamese / English / Chinese) instead of always defaulting to Chinese.

**Architecture:** A single server-side `detectUserLang()` reads the user's own chat text (never the pasted source material) and returns `'vi' | 'zh' | 'en'`. That code drives (a) an `OUTPUT LANGUAGE` directive injected into the content-generation prompts and (b) localized progress strings via `tServer()`. The prompt scaffold is de-Sinicized so nothing biases the model toward Chinese. The frontend already has an i18n system (`i18n.js`); we add a `vi` dictionary, migrate the few hardcoded Chinese strings in `app.js`, and make locale auto-detect from `navigator.language`.

**Tech Stack:** TypeScript (Node 20+, ESM), Node built-in test runner (`node --test --experimental-strip-types`), vanilla JS frontend (`project-studio/public/*.js`), no framework.

**Spec:** `docs/superpowers/specs/2026-06-09-vietnamese-frame-language-design.md`

**Branch:** `feat/vietnamese-language-support`

---

## File Structure

| File | Responsibility | Phase |
|---|---|---|
| `packages/cli/src/studio-server.ts` | `detectUserLang`, `LANG_NAME`, `outputLanguageDirective`, `tServer`+`SERVER_STRINGS`, prompt injection + de-Sinicize, progress localization, `GENERATED_MARKER` + `hadGenerationYet`, Vietnamese intent regexes | P1–P3 |
| `packages/cli/test/detect-user-lang.test.ts` | Unit tests for `detectUserLang` + `outputLanguageDirective` | P1 |
| `packages/cli/test/server-strings.test.ts` | Unit tests for `tServer` | P2 |
| `packages/cli/test/had-generation-yet.test.ts` | Unit tests for `hadGenerationYet` marker detection | P2 |
| `packages/cli/test/control-phrase-vi.test.ts` | Unit tests for Vietnamese control/aspect phrases | P3 |
| `packages/project-studio/public/i18n.js` | Add `vi` to `AVAILABLE_LOCALES`, `vi` dictionary, `navigator.language` resolution, `settings.language.vi*` keys | P2 |
| `packages/project-studio/public/app.js` | Migrate hardcoded Chinese strings to `t()`, add `vi` button to language picker, strip `GENERATED_MARKER` on render | P2 |

**Shared constants (defined once in Task 1, reused everywhere):**
- `detectUserLang(text): 'vi'|'zh'|'en'`
- `LANG_NAME: Record<string,string>`
- `outputLanguageDirective(lang): string`
- `GENERATED_MARKER = '<!--hv:generated-->'` (Task 7)

---

## PHASE 1 — Frame content language (the core fix)

### Task 1: Language detection helpers

**Files:**
- Modify: `packages/cli/src/studio-server.ts` (add near the other top-level helpers, e.g. just above `parseFormatReply` ~line 2262)
- Test: `packages/cli/test/detect-user-lang.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/test/detect-user-lang.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-video/cli test`
Expected: FAIL — `detectUserLang` / `outputLanguageDirective` not exported.

- [ ] **Step 3: Write minimal implementation**

In `packages/cli/src/studio-server.ts`, add:

```ts
/** Human name per detected language, used in the OUTPUT LANGUAGE prompt directive. */
const LANG_NAME: Record<string, string> = {
  vi: 'Vietnamese (Tiếng Việt)',
  zh: 'Chinese (中文)',
  en: 'English',
};

/**
 * Detect the language the USER is chatting in — from their own messages only,
 * never the pasted source material (the user's chat language always wins; see
 * spec §2 decision #3). Drives both the OUTPUT LANGUAGE prompt directive and the
 * server-side progress strings.
 *
 *   vi — any Vietnamese-specific letter/diacritic present (high precision; these
 *        code points appear in neither zh nor en). Toneless Vietnamese falls
 *        through to `en`, which is an acceptable neutral default.
 *   zh — Han characters present.
 *   en — default / ambiguous / empty (NEVER zh by default — that was the bug).
 */
export function detectUserLang(text: string): 'vi' | 'zh' | 'en' {
  const s = text || '';
  if (/[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴ]/.test(s)) {
    return 'vi';
  }
  if (/[一-鿿]/.test(s)) return 'zh';
  return 'en';
}

/** The OUTPUT LANGUAGE directive injected into every content-generation prompt. */
export function outputLanguageDirective(lang: 'vi' | 'zh' | 'en'): string {
  const name = LANG_NAME[lang] ?? LANG_NAME.en;
  return [
    `OUTPUT LANGUAGE (REQUIRED): Write every visible text node, the synopsis, and`,
    `all data labels/units in ${name} — the same language the user wrote their`,
    `request in. The source material may be in another language; translate its`,
    `facts, names, and numbers into ${name}. Keep proper nouns, brand/product`,
    `names, and code identifiers in their original script. Do NOT default to Chinese.`,
  ].join(' ');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @html-video/cli test`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/studio-server.ts packages/cli/test/detect-user-lang.test.ts
git commit -m "feat(studio): detectUserLang + outputLanguageDirective helpers"
```

---

### Task 2: Inject directive + de-Sinicize the split multi-frame prompts

This is the path users actually hit (`runSplitMultiFrameGenerate`). Compute `lang` once, inject the directive into the graph prompt and the per-frame prompt, and replace Chinese-biased scaffold labels with English.

**Files:**
- Modify: `packages/cli/src/studio-server.ts` — inside `runSplitMultiFrameGenerate` (graph prompt ~3162–3199; per-frame prompt ~3270–3290)

- [ ] **Step 1: Compute `lang` at the top of the function body**

In `runSplitMultiFrameGenerate`, right after `pickedStyle`/`styleLabel` are available (just before `// ---- Step 1: obtain the content graph ----`, ~line 3148), add:

```ts
  // Language the user is chatting in — drives the OUTPUT LANGUAGE directive
  // below AND the progress strings (Task 5). Source material is deliberately
  // excluded: the user's chat language wins (spec §2 #3).
  const lang = detectUserLang([openingTopic ?? '', ...contentTurns].join('\n'));
```

> Note: `contentTurns` is derived inside this function from `inputs`. If it is not yet in scope at this line, move this `const lang` line to just after `contentTurns` is defined.

- [ ] **Step 2: Inject directive into the graph prompt**

Find (graph prompt, ~3163):

```ts
  graphPromptParts.push(`Plan a ${frameCountReq}-frame HTML video storyboard. Output ONLY a content-graph JSON in a fenced \`\`\`json#content-graph block — no HTML, no prose outside.`);
  graphPromptParts.push('');
```

Replace with:

```ts
  graphPromptParts.push(`Plan a ${frameCountReq}-frame HTML video storyboard. Output ONLY a content-graph JSON in a fenced \`\`\`json#content-graph block — no HTML, no prose outside.`);
  graphPromptParts.push('');
  graphPromptParts.push(outputLanguageDirective(lang));
  graphPromptParts.push('');
```

- [ ] **Step 3: De-Sinicize the graph prompt scaffold labels**

In the graph prompt, replace the bilingual Chinese-leading labels with English-only. Exact replacements:

| Find | Replace |
|---|---|
| `` `- 类型 / type: ${pickedType || '(unspecified)'} (this is the FORMAT...` `` | `` `- type: ${pickedType || '(unspecified)'} (this is the FORMAT...` `` (drop `类型 / `) |
| `` `- 主题 / subject (LOCKED): the user opened with "${openingTopic}"...` `` | `` `- subject (LOCKED): the user opened with "${openingTopic}"...` `` (drop `主题 / `) |
| `` `- 内容 / content:` `` | `` `- content:` `` |
| `` `- 风格 / style: ${styleLabel}` `` | `` `- style: ${styleLabel}` `` |
| `` `- 总时长: ${totalDurationSec}s split across...` `` | `` `- total duration: ${totalDurationSec}s split across...` `` |

Also in the GROUNDING line (~3196), replace the Chinese banned-filler examples:

Find:
```ts
  graphPromptParts.push(`GROUNDING (REQUIRED): every node's text must come from the SOURCE MATERIAL above — quote its real product names, facts, numbers. The synopsis must name the source's actual subject. BANNED: generic filler about the content TYPE (e.g. "什么是概念解说", "信息密度×传播效率") that would fit any video. If a line could fit any topic, it's wrong.`);
```
Replace with:
```ts
  graphPromptParts.push(`GROUNDING (REQUIRED): every node's text must come from the SOURCE MATERIAL above — quote its real product names, facts, numbers. The synopsis must name the source's actual subject. BANNED: generic filler about the content TYPE that would fit any video (e.g. "what is an explainer", "information density × reach"). If a line could fit any topic, it's wrong.`);
```

And in the STRICT JSON line (~3240), the `「」 or 《》` guidance is fine to keep (it is about quoting, not output language) — leave it.

- [ ] **Step 4: Inject directive into the per-frame prompt**

Find (per-frame loop, ~3271):

```ts
    fp.push(`Generate ONE complete HTML page for frame "${nodeId}" of a ${graph.nodes.length}-frame video. Output ONE \`\`\`html block, nothing else.`);
    fp.push('');
```

Replace with:

```ts
    fp.push(`Generate ONE complete HTML page for frame "${nodeId}" of a ${graph.nodes.length}-frame video. Output ONE \`\`\`html block, nothing else.`);
    fp.push('');
    fp.push(outputLanguageDirective(lang));
    fp.push('');
```

> The `restyleOnly` branch (~3276) instructs "do NOT translate" to preserve existing wording — leave it. When restyling, the existing graph text is reused verbatim, so no language directive is needed; placing the directive before that branch is fine because restyle overrides wording anyway. To avoid a contradiction, only push the directive when NOT restyleOnly:

```ts
    if (!restyleOnly) {
      fp.push(outputLanguageDirective(lang));
      fp.push('');
    }
```

Use this `if (!restyleOnly)` form.

- [ ] **Step 5: De-Sinicize the per-frame `Subject (locked)` line**

Find (~3279):
```ts
      fp.push(`Subject (locked): "${openingTopic}". This frame is about this subject; "随机/随便" anywhere in the inputs means you pick details, not a new topic.`);
```
Replace with:
```ts
      fp.push(`Subject (locked): "${openingTopic}". This frame is about this subject; a vague placeholder ("random / anything / you decide") in the inputs means you pick details, not a new topic.`);
```

- [ ] **Step 6: Typecheck + build**

Run: `pnpm --filter @html-video/cli typecheck && pnpm --filter @html-video/cli build`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/studio-server.ts
git commit -m "feat(studio): output-language directive + de-Sinicized scaffold in split generate"
```

---

### Task 3: Same for the single-shot `generate` phase fallback

The `generate` phase (~2723) is the single-frame / fallback path. Apply the same directive + label de-Sinicization.

**Files:**
- Modify: `packages/cli/src/studio-server.ts` — `buildPrompt` `generate` branch (~2723–2860)

- [ ] **Step 1: Compute `lang` and inject the directive**

Find (~2745):
```ts
    const p: string[] = [];
    p.push(`Generate the HTML video file(s) the user just confirmed.`);
    p.push('');
```
Replace with:
```ts
    const p: string[] = [];
    p.push(`Generate the HTML video file(s) the user just confirmed.`);
    p.push('');
    const lang = detectUserLang([openingTopic ?? '', ...contentTurns].join('\n'));
    p.push(outputLanguageDirective(lang));
    p.push('');
```

- [ ] **Step 2: De-Sinicize the input labels**

In the `generate` branch replace these labels (keep the English side, drop the Chinese):

| Find | Replace |
|---|---|
| `` `- 类型 / type: ${pickedType || '(未指定)'}` `` | `` `- type: ${pickedType || '(unspecified)'}` `` |
| `` `- 内容 / content (what the user told us in the chat):` `` | `` `- content (what the user told us in the chat):` `` |
| `` `- 内容 / content: (the user did not specify...` `` | `` `- content: (the user did not specify...` `` |
| `` `- 风格 / style: ${styleLabel}` `` | `` `- style: ${styleLabel}` `` |
| `` `- 画面尺寸: ${aspect} (${resolution})` `` | `` `- canvas: ${aspect} (${resolution})` `` |
| `` `- 时长: ${collected.duration ?? '?'} 秒` `` | `` `- duration: ${collected.duration ?? '?'}s` `` |
| `` `- 帧数: ${collected.frame_count ?? (isMulti ? '4' : '1')}` `` | `` `- frames: ${collected.frame_count ?? (isMulti ? '4' : '1')}` `` |

- [ ] **Step 3: De-Sinicize the locked-subject + banned-filler lines**

Find (~2753):
```ts
      p.push(`If a content line below is a vague placeholder like "随机 / 随便 / anything / 你定 / whatever", it means "YOU choose the concrete details (selling points, framing, copy) — but the SUBJECT stays "${openingTopic}"". NEVER treat "随机" as the literal topic; do NOT make a video about randomness.`);
```
Replace with:
```ts
      p.push(`If a content line below is a vague placeholder like "random / anything / whatever / you decide", it means "YOU choose the concrete details (selling points, framing, copy) — but the SUBJECT stays "${openingTopic}"". NEVER treat the placeholder as the literal topic; do NOT make a video about randomness.`);
```

Find the multi-frame GROUNDING banned line (~2806):
```ts
        p.push(`- BANNED: generic motivational filler with no tie to the source ("看清本质", "第一性原理", "复杂表象之下", "you really understand…", "the logic behind…"). If a line would fit ANY article, it is wrong — replace it with something that could ONLY come from THIS source.`);
```
Replace with:
```ts
        p.push(`- BANNED: generic motivational filler with no tie to the source ("see the essence", "first principles", "beneath the complex surface", "you really understand…", "the logic behind…"). If a line would fit ANY article, it is wrong — replace it with something that could ONLY come from THIS source.`);
```

- [ ] **Step 4: Typecheck + build**

Run: `pnpm --filter @html-video/cli typecheck && pnpm --filter @html-video/cli build`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/studio-server.ts
git commit -m "feat(studio): output-language directive + de-Sinicized scaffold in single-shot generate"
```

---

### Task 4: Phase 1 end-to-end language verification (real agent, no mock)

Per project norm (CLAUDE.md): render/agent behavior MUST be verified end-to-end with a real agent, not "tsc passes + looks right".

**Files:** none (verification only)

- [ ] **Step 1: Build everything**

Run: `pnpm -r build`
Expected: all packages build.

- [ ] **Step 2: Start the studio**

Run: `node packages/cli/dist/bin.js studio` (background; needs a working agent on PATH or an Anthropic key configured)
Expected: `{"status":"ok","url":"http://127.0.0.1:3071",...}`

- [ ] **Step 3: Drive a Vietnamese multi-frame generation**

In the studio (or via the chat API), open a project and send a Vietnamese request, e.g.
`"Tạo video 4 khung giới thiệu Open Design — nhấn mạnh tốc độ và chi phí thấp"`.
Pick a multi-frame type, confirm, generate.

- [ ] **Step 4: Assert the content-graph + frames are Vietnamese**

Run:
```bash
PROJ=$(ls -t ~/.html-video/projects 2>/dev/null | head -1 || true)
# Inspect the written content-graph + first frame for Han characters.
node -e '
const fs=require("fs"),p=process.argv[1];
const cg=JSON.parse(fs.readFileSync(p,"utf8"));
const txt=JSON.stringify(cg);
const han=(txt.match(/[一-鿿]/g)||[]).length;
console.log("content-graph Han chars:", han, "(expect 0)");
process.exit(han===0?0:1);
' "<path-to-content-graph.json>"
```
Expected: `content-graph Han chars: 0`. Visible frame text reads as Vietnamese.

> If the project content-graph path is unknown, find it via the studio API `GET /api/projects/:id/content-graph`.

- [ ] **Step 5: Control checks**

Repeat Step 3 with a Chinese request → frames Chinese; with an English request → frames English. Confirms detection is following the chat, not hard-switched.

- [ ] **Step 6: No commit** (verification only). If a defect is found, fix in Task 2/3 and re-verify.

---

## PHASE 2 — Chrome (progress strings + UI i18n)

### Task 5: Server-side progress dictionary `tServer`

**Files:**
- Modify: `packages/cli/src/studio-server.ts` (add helper near `detectUserLang`)
- Test: `packages/cli/test/server-strings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/test/server-strings.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-video/cli test`
Expected: FAIL — `tServer` not exported.

- [ ] **Step 3: Write minimal implementation**

In `packages/cli/src/studio-server.ts` add:

```ts
/** Server-side progress strings, keyed by locale. Mirrors the frontend i18n. */
const SERVER_STRINGS: Record<string, Record<string, string>> = {
  en: {
    'progress.reuse_existing': '✓ Reusing existing copy: {n} frames',
    'progress.planning': '📋 Planning a {n}-frame storyboard…',
    'progress.plan_done': '✓ Storyboard planned: {n} frames ({intent})',
    'progress.frame_gen': '🎬 Generating frame {i}/{total} ({id})…',
    'progress.frame_retry': '  ↻ Frame {i} came back empty, retrying…',
    'progress.frame_remotion': '  ⚡ Rendering Remotion motion for frame {i} (rolling numbers / growing bars)…',
    'progress.frame_remotion_fail': '  ⚠️ Frame {i} could not be enhanced with Remotion (falling back to static HTML): {msg}',
    'progress.frame_done': '  ✓ Frame {i}/{total} done ({id})',
  },
  vi: {
    'progress.reuse_existing': '✓ Dùng lại nội dung sẵn có: {n} khung',
    'progress.planning': '📋 Đang lên kịch bản {n} khung…',
    'progress.plan_done': '✓ Đã lên kịch bản: {n} khung ({intent})',
    'progress.frame_gen': '🎬 Đang tạo khung {i}/{total} ({id})…',
    'progress.frame_retry': '  ↻ Khung {i} trả về rỗng, đang thử lại…',
    'progress.frame_remotion': '  ⚡ Đang dựng hiệu ứng Remotion cho khung {i} (số chạy / cột lớn dần)…',
    'progress.frame_remotion_fail': '  ⚠️ Khung {i} không tăng cường được bằng Remotion (quay về HTML tĩnh): {msg}',
    'progress.frame_done': '  ✓ Khung {i}/{total} xong ({id})',
  },
  zh: {
    'progress.reuse_existing': '✓ 沿用现有文案：{n} 帧',
    'progress.planning': '📋 规划 {n} 帧的故事板…',
    'progress.plan_done': '✓ 故事板规划完成：{n} 帧 ({intent})',
    'progress.frame_gen': '🎬 生成第 {i}/{total} 帧 ({id})…',
    'progress.frame_retry': '  ↻ 第 {i} 帧首试为空，重试…',
    'progress.frame_remotion': '  ⚡ 第 {i} 帧渲染 Remotion 动效 (数字滚动 / 柱子生长)…',
    'progress.frame_remotion_fail': '  ⚠️ 第 {i} 帧无法用 Remotion 增强（回落静态 HTML）：{msg}',
    'progress.frame_done': '  ✓ 第 {i}/{total} 帧完成 ({id})',
  },
};

/** Translate a server progress key for `lang`, substituting `{param}` tokens. */
export function tServer(lang: string, key: string, params?: Record<string, string | number>): string {
  const dict = SERVER_STRINGS[lang] ?? SERVER_STRINGS.en;
  let s = dict[key] ?? SERVER_STRINGS.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @html-video/cli test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/studio-server.ts packages/cli/test/server-strings.test.ts
git commit -m "feat(studio): tServer server-side progress i18n (en/vi/zh)"
```

---

### Task 6: Localize the 8 progress calls in `runSplitMultiFrameGenerate`

**Files:**
- Modify: `packages/cli/src/studio-server.ts` (lines 3158, 3161, 3258, 3266, 3348, 3370, 3376, 3382)

- [ ] **Step 1: Replace each `onProgress(...)` call**

`lang` is already in scope from Task 2. Apply these exact replacements:

| Line | Find | Replace |
|---|---|---|
| 3158 | `` onProgress(`✓ 沿用现有文案：${graph.nodes.length} 帧`); `` | `` onProgress(tServer(lang, 'progress.reuse_existing', { n: graph.nodes.length })); `` |
| 3161 | `` onProgress(`📋 规划 ${frameCountReq} 帧的故事板…`); `` | `` onProgress(tServer(lang, 'progress.planning', { n: frameCountReq })); `` |
| 3258 | `` onProgress(`✓ 故事板规划完成：${graph.nodes.length} 帧 (${graph.intent})`); `` | `` onProgress(tServer(lang, 'progress.plan_done', { n: graph.nodes.length, intent: graph.intent })); `` |
| 3266 | `` onProgress(`🎬 生成第 ${i + 1}/${graph.nodes.length} 帧 (${nodeId})…`); `` | `` onProgress(tServer(lang, 'progress.frame_gen', { i: i + 1, total: graph.nodes.length, id: nodeId })); `` |
| 3348 | `` onProgress(`  ↻ 第 ${i + 1} 帧首试为空，重试…`); `` | `` onProgress(tServer(lang, 'progress.frame_retry', { i: i + 1 })); `` |
| 3370 | `` onProgress(`  ⚡ 第 ${i + 1} 帧渲染 Remotion 动效 (数字滚动 / 柱子生长)…`); `` | `` onProgress(tServer(lang, 'progress.frame_remotion', { i: i + 1 })); `` |
| 3376 | `` onProgress(`  ⚠️ 第 ${i + 1} 帧无法用 Remotion 增强（回落静态 HTML）：${msg}`); `` | `` onProgress(tServer(lang, 'progress.frame_remotion_fail', { i: i + 1, msg })); `` |
| 3382 | `` onProgress(`  ✓ 第 ${i + 1}/${graph.nodes.length} 帧完成 (${nodeId})`); `` | `` onProgress(tServer(lang, 'progress.frame_done', { i: i + 1, total: graph.nodes.length, id: nodeId })); `` |

> Verify the variable names at each site (`frameCountReq`, `graph`, `nodeId`, `msg`, `i`) match the surrounding code before saving.

- [ ] **Step 2: Typecheck + build**

Run: `pnpm --filter @html-video/cli typecheck && pnpm --filter @html-video/cli build`
Expected: no errors.

- [ ] **Step 3: Verify no Chinese progress strings remain on that path**

Run: `grep -nP "onProgress\(\`[^)]*[\x{4e00}-\x{9fff}]" packages/cli/src/studio-server.ts`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/studio-server.ts
git commit -m "feat(studio): localize split-generate progress via tServer"
```

---

### Task 7: Language-agnostic generation marker (`hadGenerationYet` robustness)

Translating progress strings would break the Chinese-keyword completion detection at line 2216. Decouple it with a stable, render-invisible marker.

**Files:**
- Modify: `packages/cli/src/studio-server.ts` (define `GENERATED_MARKER`; append it on success; update `hadGenerationYet`)
- Modify: `packages/project-studio/public/app.js` (strip marker on render)
- Test: `packages/cli/test/had-generation-yet.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/test/had-generation-yet.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hadGenerationYet, GENERATED_MARKER } from '../dist/studio-server.js';

const asst = (content) => ({ role: 'assistant', content });

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-video/cli test`
Expected: FAIL — `GENERATED_MARKER` not exported.

- [ ] **Step 3: Define the marker and update `hadGenerationYet`**

In `packages/cli/src/studio-server.ts`, add near the top helpers:

```ts
/**
 * Stable, language-agnostic "a real generation happened" marker. Appended to the
 * persisted assistant message on success and matched by hadGenerationYet(). It is
 * an HTML comment so the chat renderer never shows it (app.js also strips it
 * defensively). Decouples phase detection from the (now localized) progress text.
 */
export const GENERATED_MARKER = '<!--hv:generated-->';
```

Update `hadGenerationYet` (~2208):

```ts
function hadGenerationYet(history: ChatMessage[]): boolean {
  return history.some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.includes(GENERATED_MARKER) ||
        /```json#content-graph|故事板规划完成|storyboard (generated|regenerated|restyled)|帧完成|frame .* (done|完成)/i.test(
          m.content,
        )),
  );
}
```

Export it for the test — change `function hadGenerationYet` to `export function hadGenerationYet`.

- [ ] **Step 4: Append the marker on generation success**

In the persist block (~1163), change:

```ts
        let persistText = summaryLine
          ? assistantText
              .replace(/```html[#\w-]*[\s\S]*?```/gi, '')
              .replace(/```json#content-graph[\s\S]*?```/i, '')
              .replace(/```json[\s\S]*?```/i, (m) =>
                /content-graph|"intent"\s*:|"nodes"\s*:/i.test(m) ? '' : m,
              )
              .trim() || summaryLine
          : assistantText;
```

to append the marker when a generation summary was produced:

```ts
        let persistText = summaryLine
          ? (assistantText
              .replace(/```html[#\w-]*[\s\S]*?```/gi, '')
              .replace(/```json#content-graph[\s\S]*?```/i, '')
              .replace(/```json[\s\S]*?```/i, (m) =>
                /content-graph|"intent"\s*:|"nodes"\s*:/i.test(m) ? '' : m,
              )
              .trim() || summaryLine)
          : assistantText;
        // Stamp a stable, render-invisible marker so phase detection survives
        // progress-string localization (Task 7).
        const isGenerationSummary = !!summaryLine && /storyboard (generated|regenerated|restyled)/i.test(summaryLine);
        if (isGenerationSummary && !persistText.includes(GENERATED_MARKER)) {
          persistText += ` ${GENERATED_MARKER}`;
        }
```

> `summaryLine` for the split path and the multi-frame extraction path already contains `storyboard generated/regenerated/restyled` (lines 1040–1041, 1151). The single-frame `frame X updated` / `updated the HTML preview` summaries intentionally do NOT stamp the marker — those are iterations, not first generations, matching the original semantics.

- [ ] **Step 5: Strip the marker in the frontend render**

In `packages/project-studio/public/app.js`, in `renderMessage` (~1545) change:

```ts
  // assistant: try each card protocol in turn
  const raw = m.content ?? '';
```
to:
```ts
  // assistant: try each card protocol in turn
  const raw = (m.content ?? '').replaceAll('<!--hv:generated-->', '');
```

- [ ] **Step 6: Run tests + build**

Run: `pnpm --filter @html-video/cli test && pnpm --filter @html-video/cli build`
Expected: PASS, no build errors.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/studio-server.ts packages/project-studio/public/app.js packages/cli/test/had-generation-yet.test.ts
git commit -m "feat(studio): language-agnostic generation marker for phase detection"
```

---

### Task 8: Frontend i18n — add the `vi` locale

**Files:**
- Modify: `packages/project-studio/public/i18n.js`

- [ ] **Step 1: Register the locale**

Change line 18:
```js
export const AVAILABLE_LOCALES = ['en', 'zh'];
```
to:
```js
export const AVAILABLE_LOCALES = ['en', 'zh', 'vi'];
```

- [ ] **Step 2: Auto-detect from `navigator.language`**

Replace `resolveInitialLocale` (~526–535):

```js
function resolveInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE_LOCALES.includes(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  // Auto-detect from the browser locale (vi-VN → vi, zh-CN → zh), else default.
  // Behavior change (was: always DEFAULT_LOCALE) to support Vietnamese users
  // without a manual switch; the Settings → Language picker still overrides.
  try {
    const navLang = (navigator.language || '').toLowerCase();
    const prefix = navLang.split('-')[0];
    if (AVAILABLE_LOCALES.includes(prefix)) return prefix;
  } catch {
    /* navigator unavailable */
  }
  return DEFAULT_LOCALE;
}
```

- [ ] **Step 3: Add the `vi` dictionary**

After the `zh: { ... }` block closes (line ~520, the `},` before the final `};`), insert a `vi:` block that mirrors EVERY key in the `en` block (lines 21–271). Rules:
- Keep keys identical to `en`.
- Translate each value to natural Vietnamese.
- Preserve every `{placeholder}` token and emoji verbatim.

Insert (full block — translate all ~220 keys; representative entries shown for each section, continue the same way for the rest):

```js
  vi: {
    'app.empty_pick_create': 'Chọn hoặc tạo một dự án',
    'app.empty_subtitle':
      'Mỗi dự án = một video HTML. Chọn template để xem baseline hình ảnh, chat với agent để điều khiển nội dung, sửa text từng khung ở cột giữa, xem kết quả bên phải.',
    'app.no_project': 'chưa có dự án',

    'sidebar.projects': 'Dự án',
    'sidebar.new': '+ Mới',
    'sidebar.collapse': 'Thu gọn thanh bên',
    'sidebar.empty_list': 'chưa có dự án',
    'sidebar.menu.rename': '✎ Đổi tên',
    'sidebar.menu.delete': '🗑 Xoá',
    'sidebar.rename_prompt': 'Tên dự án mới',
    'sidebar.delete_confirm': 'Xoá "{name}"? Không thể hoàn tác.',

    'toolbar.template': 'Template',
    'toolbar.template_pick': 'Tuỳ chọn · Chọn template',
    'toolbar.agent': 'Agent',
    'toolbar.model': 'Model',
    'toolbar.agent_none': '— không —',
    'toolbar.agent_ready': '● sẵn sàng',
    'toolbar.agent_install': '○ cài đặt',
    'toolbar.export_mp4': 'Xuất MP4',

    'composer.send': 'Gửi',
    'composer.attach': 'Đính kèm tệp',

    'settings.language.title': 'Ngôn ngữ',
    'settings.language.subtitle': 'Chọn ngôn ngữ hiển thị của studio.',
    'settings.language.en': 'English',
    'settings.language.en_sub': 'English interface',
    'settings.language.zh': '中文',
    'settings.language.zh_sub': '中文界面',
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.vi_sub': 'Giao diện tiếng Việt',

    // … continue translating EVERY remaining key present in the `en` block
    // (app.*, sidebar.*, toolbar.*, composer.*, chat.*, export.*, enhance.*,
    //  modal.*, settings.*, tpl_preview.*) into Vietnamese, preserving keys,
    //  {placeholders}, and emoji. Use the `en` block (lines 21–271) as the
    //  authoritative key list — the `vi` block must have the same key set.
  },
```

- [ ] **Step 4: Add the `vi` keys also to `en` and `zh` for the language picker**

Find `settings.language.zh_sub` in BOTH `en` and `zh` blocks; after it add:
- en block:
  ```js
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.vi_sub': 'Vietnamese interface',
  ```
- zh block:
  ```js
    'settings.language.vi': '越南语',
    'settings.language.vi_sub': '越南语界面',
  ```

- [ ] **Step 5: Verify key parity**

Run:
```bash
node -e '
const fs=require("fs");const src=fs.readFileSync("packages/project-studio/public/i18n.js","utf8");
const grab=(loc)=>{const m=new RegExp(loc+":\\s*\\{([\\s\\S]*?)\\n  \\}","m").exec(src);return new Set([...m[1].matchAll(/\x27([a-z0-9_.]+)\x27\s*:/gi)].map(x=>x[1]));};
const en=grab("en"),vi=grab("vi");
const missing=[...en].filter(k=>!vi.has(k));
console.log("missing in vi:", missing.length, missing.slice(0,20));
process.exit(missing.length===0?0:1);
'
```
Expected: `missing in vi: 0 []`. If non-zero, translate the listed keys and re-run.

- [ ] **Step 6: Commit**

```bash
git add packages/project-studio/public/i18n.js
git commit -m "feat(studio): add Vietnamese (vi) locale + navigator.language auto-detect"
```

---

### Task 9: Migrate hardcoded Chinese strings in `app.js` + add `vi` picker button

**Files:**
- Modify: `packages/project-studio/public/app.js` (form card ~1795–1803, confirm card ~1828–1829, toasts ~2069/2102/2110, language picker ~3197–3206)
- Modify: `packages/project-studio/public/i18n.js` (add the new keys to en/zh/vi)

- [ ] **Step 1: Add new i18n keys (all three locales)**

In `i18n.js`, add to `en`, `zh`, `vi` blocks (use the section where `composer.*` keys live):

```js
// en
'form.drop_hint': '📎 Drag / paste / choose files as material (logo, screenshot, CSV… optional)',
'form.add_file': '+ Add file',
'form.submit': 'Submit ↵',
'confirm.generate': '✓ Start generating',
'confirm.edit': '✏️ Edit',
'toast.save_failed': 'Save failed: {message}',
'toast.saved_changes': 'Saved {changed} change(s)',
```
```js
// zh
'form.drop_hint': '📎 拖拽 / 粘贴 / 选择文件作为素材（logo、截图、数据 CSV…可选）',
'form.add_file': '+ 添加文件',
'form.submit': '提交 ↵',
'confirm.generate': '✓ 开始生成',
'confirm.edit': '✏️ 修改',
'toast.save_failed': '保存失败：{message}',
'toast.saved_changes': '已保存 {changed} 处修改',
```
```js
// vi
'form.drop_hint': '📎 Kéo thả / dán / chọn tệp làm tư liệu (logo, ảnh chụp, CSV… tuỳ chọn)',
'form.add_file': '+ Thêm tệp',
'form.submit': 'Gửi ↵',
'confirm.generate': '✓ Bắt đầu tạo',
'confirm.edit': '✏️ Sửa',
'toast.save_failed': 'Lưu thất bại: {message}',
'toast.saved_changes': 'Đã lưu {changed} thay đổi',
```

- [ ] **Step 2: Replace the hardcoded strings in `app.js`**

| Location | Find | Replace |
|---|---|---|
| ~1795 | `📎 拖拽 / 粘贴 / 选择文件作为素材（logo、截图、数据 CSV…可选）` (inside template literal) | `${t('form.drop_hint')}` |
| ~1798 | `+ 添加文件` | `${t('form.add_file')}` |
| ~1802 | `提交 ↵` | `${t('form.submit')}` |
| ~1828 | `✓ 开始生成` | `${t('confirm.generate')}` |
| ~1829 | `✏️ 修改` | `${t('confirm.edit')}` |
| ~2069 | `` toast(`保存失败：${e.message}`, 'error'); `` | `` toast(t('toast.save_failed', { message: e.message }), 'error'); `` |
| ~2102 | `` toast(`已保存 ${changed} 处修改`, 'success'); `` | `` toast(t('toast.saved_changes', { changed }), 'success'); `` |
| ~2110 | `` toast(`保存失败：${e.message}`, 'error'); `` | `` toast(t('toast.save_failed', { message: e.message }), 'error'); `` |

- [ ] **Step 3: Add the `vi` button to the language picker**

In `renderSettingsLanguage` (~3202), after the `zh` button block and before the closing `</div>`, add:

```js
      <button data-lang="vi" class="${cur === 'vi' ? 'active' : ''}">
        <div class="lang-name">${esc(t('settings.language.vi'))}</div>
        <div class="lang-sub">${esc(t('settings.language.vi_sub'))}</div>
      </button>
```

- [ ] **Step 4: Verify no user-facing Chinese remains in app.js display strings**

Run: `grep -nP "(toast|push)\([^)]*[\x{4e00}-\x{9fff}]|>[^<]*[\x{4e00}-\x{9fff}][^<]*<" packages/project-studio/public/app.js`
Expected: only comments / intent-detection regexes remain (no display strings). Manually confirm any hit is a comment or a regex, not a rendered string.

- [ ] **Step 5: Build the studio bundle + smoke**

Run: `pnpm -r build && pnpm --filter @html-video/cli smoke`
Expected: build OK; smoke passes.

- [ ] **Step 6: Commit**

```bash
git add packages/project-studio/public/app.js packages/project-studio/public/i18n.js
git commit -m "feat(studio): migrate hardcoded Chinese UI strings to i18n + vi picker button"
```

---

### Task 10: Phase 2 manual verification

**Files:** none (verification only)

- [ ] **Step 1: Build + start studio**

Run: `pnpm -r build && node packages/cli/dist/bin.js studio`

- [ ] **Step 2: Force Vietnamese UI**

In the browser console at `http://127.0.0.1:3071`: `localStorage.setItem('hv.studio.locale','vi'); location.reload()`.
Expected: top-bar labels (Template/Agent/Model/Export), sidebar, composer, and Settings → Language all in Vietnamese; the picker shows a "Tiếng Việt" option, highlighted.

- [ ] **Step 3: Trigger a toast**

Edit a frame's text and save with an induced error (or save normally).
Expected: toast text is Vietnamese (`Đã lưu … thay đổi` / `Lưu thất bại: …`).

- [ ] **Step 4: Run a Vietnamese generation and watch progress**

Generate a multi-frame video with a Vietnamese prompt.
Expected: progress lines are Vietnamese (`📋 Đang lên kịch bản…`, `🎬 Đang tạo khung…`, `✓ Khung x/x xong`), and the run COMPLETES (phase detection still fires — verify the post-generation iteration menu/cards appear, confirming `hadGenerationYet` works via the marker).

- [ ] **Step 5: No commit** (verification only).

---

## PHASE 3 — Vietnamese intent parsing (robustness)

Extend the keyword regexes so a Vietnamese user typing free text (not just clicking cards) hits the right branch. Additive only — existing zh/en alternatives are preserved.

### Task 11: Vietnamese keywords for control + aspect parsing (unit-tested)

**Files:**
- Modify: `packages/cli/src/studio-server.ts` (`isControlPhrase` ~2106; `parseFormatReply` aspect ~2270–2273)
- Test: `packages/cli/test/control-phrase-vi.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/test/control-phrase-vi.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isControlPhrase, parseFormatReply } from '../dist/studio-server.js';

test('Vietnamese continue phrases are control phrases', () => {
  assert.equal(isControlPhrase('tiếp tục'), true);
  assert.equal(isControlPhrase('bắt đầu'), true);
  assert.equal(isControlPhrase('tạo đi'), true);
});

test('Vietnamese aspect keywords parse', () => {
  assert.equal(parseFormatReply('dọc 5s')?.aspect, '9:16 手机竖屏');
  assert.equal(parseFormatReply('ngang 10s')?.aspect, '16:9 横屏');
  assert.equal(parseFormatReply('vuông 5s')?.aspect, '1:1 方形');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-video/cli test`
Expected: FAIL (`isControlPhrase` not exported; Vietnamese keywords unmatched).

- [ ] **Step 3: Export + extend `isControlPhrase`**

Change `function isControlPhrase` to `export function isControlPhrase`, and extend the regex (~2109):

```ts
export function isControlPhrase(t: string): boolean {
  const s = t.trim().toLowerCase();
  return /^(继续|继续(刚刚|上次|之前)的?任务|接着|接着(来|做|生成)|下一步|开始(生成)?|生成(吧)?|go|continue|next|start|ok|好的?|行|走|动手|可以|确认|tiếp tục|tiếp|bắt đầu|bắt đầu (tạo|đi)|tạo đi|tạo luôn|tiếp đi|đồng ý|xác nhận|được|ừ|ok nhé)$/u.test(s);
}
```
> If the existing body differs (e.g. no `.toLowerCase()`), keep the existing structure and only widen the alternation with the Vietnamese terms; do not change matching semantics for zh/en.

- [ ] **Step 4: Extend aspect parsing in `parseFormatReply`**

Find (~2270–2273):
```ts
  if (ratioNorm === '16:9' || /横屏|landscape|宽屏/i.test(t)) out.aspect = '16:9 横屏';
  else if (ratioNorm === '9:16' || /竖屏|手机|portrait|vertical/i.test(t)) out.aspect = '9:16 手机竖屏';
  else if (ratioNorm === '1:1' || /方形|square/i.test(t)) out.aspect = '1:1 方形';
  else if (ratioNorm === '4:5' || /小红书|xiaohongshu|rednote/i.test(t)) out.aspect = '4:5 小红书';
```
Replace with (add Vietnamese synonyms):
```ts
  if (ratioNorm === '16:9' || /横屏|landscape|宽屏|ngang|nằm ngang/i.test(t)) out.aspect = '16:9 横屏';
  else if (ratioNorm === '9:16' || /竖屏|手机|portrait|vertical|dọc|thẳng đứng|điện thoại/i.test(t)) out.aspect = '9:16 手机竖屏';
  else if (ratioNorm === '1:1' || /方形|square|vuông/i.test(t)) out.aspect = '1:1 方形';
  else if (ratioNorm === '4:5' || /小红书|xiaohongshu|rednote/i.test(t)) out.aspect = '4:5 小红书';
```

- [ ] **Step 5: Run tests + build**

Run: `pnpm --filter @html-video/cli test && pnpm --filter @html-video/cli build`
Expected: PASS, no build errors. Also re-run the existing `parse-format-reply.test.ts` to confirm no regression: `pnpm --filter @html-video/cli test`.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/studio-server.ts packages/cli/test/control-phrase-vi.test.ts
git commit -m "feat(studio): Vietnamese keywords for control + aspect parsing"
```

---

### Task 12: Vietnamese keywords for the edit-intent / skip / free-rein regexes

These live inside the non-exported `detectPhase` (~1835–2044). Extend them in place; verify by inspection + the Phase-3 e2e check (no clean unit surface without a larger refactor, which is out of scope).

**Files:**
- Modify: `packages/cli/src/studio-server.ts` (lines ~1892, 1896, 1933, 1937, 1941, 2011, 2021)

- [ ] **Step 1: Extend the edit-intent regexes**

Apply these widenings (add Vietnamese alternatives; keep all existing terms):

| Line | Add to the alternation |
|---|---|
| ~1892 / ~1933 (style/视觉) | `|phong cách|kiểu|giao diện|màu|đổi (phong cách|kiểu|màu)|trông khác` |
| ~1896 / ~1937 (duration/时长) | `|thời lượng|độ dài|nhanh hơn|chậm hơn|ngắn hơn|dài hơn|bao nhiêu giây|nhịp` |
| ~1941 (content/文案) | `|nội dung|chủ đề|viết lại|đổi thành|giới thiệu|thêm (thông tin|số liệu|điểm nổi bật)` |

Example for ~1933:
```ts
    if (/风格|样式|配色|视觉|主题色|模板|template|style|换个?样子|赛博|极简|杂志|brutal|cyber|swiss|phong cách|kiểu|giao diện|màu|đổi (phong cách|kiểu|màu)|trông khác/i.test(trimmed)) {
```

- [ ] **Step 2: Extend the skip / free-rein regexes**

Find (~2011):
```ts
    const isSkip = /^(skip|跳过|够了|够|done|next|下一步|ok|好|不知道)$/i.test(trimmed)
```
Replace with:
```ts
    const isSkip = /^(skip|跳过|够了|够|done|next|下一步|ok|好|不知道|bỏ qua|đủ rồi|xong|tiếp|không biết)$/i.test(trimmed)
```

Find (~2021):
```ts
      /(随便|随机|随意|你定|你来定|你决定|都行|都可以|看着办|自由发挥|发挥|无所谓|任意|随你)/.test(trimmed);
```
Replace with:
```ts
      /(随便|随机|随意|你定|你来定|你决定|都行|都可以|看着办|自由发挥|发挥|无所谓|任意|随你|tùy|tuỳ|tùy bạn|sao cũng được|gì cũng được|bạn quyết|tự do|ngẫu nhiên)/.test(trimmed);
```

- [ ] **Step 3: Build**

Run: `pnpm --filter @html-video/cli build`
Expected: no errors.

- [ ] **Step 4: Manual e2e — Vietnamese free-text intents**

Start studio, in a generated project type (as free text, not via cards):
- `"bỏ qua"` during the content-gathering step → flow advances (treated as skip).
- `"đổi phong cách sang tối giản"` after generation → routes to the restyle/style branch (not a single-frame no-op).
- `"tiếp tục"` → advances.

Expected: each routes to the correct phase. (This exercises the same `detectPhase` branches the zh keywords hit.)

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/studio-server.ts
git commit -m "feat(studio): Vietnamese keywords for edit-intent / skip / free-rein detection"
```

---

## Final verification

- [ ] **Run the full test + smoke suite**

Run: `pnpm -r build && pnpm --filter @html-video/cli test && pnpm --filter @html-video/cli smoke`
Expected: all tests pass; smoke passes.

- [ ] **Full e2e sweep (real agent)**

1. Vietnamese prompt → frames Vietnamese, progress Vietnamese, UI Vietnamese, run completes.
2. English prompt → frames English.
3. Chinese prompt → frames Chinese (no regression for existing users).

- [ ] **Confirm branch state**

Run: `git log --oneline feat/vietnamese-language-support` — review the commit sequence.

---

## Spec coverage check

| Spec item | Task |
|---|---|
| `detectUserLang` (chat only, vi/zh/en, default en) | Task 1 |
| OUTPUT LANGUAGE directive in 3 prompt sites | Task 2 (graph+frame), Task 3 (single-shot) |
| De-Sinicize prompt scaffold | Task 2, Task 3 |
| `tServer` progress dictionary (en/zh/vi) | Task 5 |
| Localize 8 progress calls | Task 6 |
| Marker B6 (language-agnostic completion detection) | Task 7 |
| i18n `vi` dict + `AVAILABLE_LOCALES` + navigator.language | Task 8 |
| Migrate hardcoded `app.js` strings + vi picker | Task 9 |
| Vietnamese intent parsing | Task 11 (control/aspect), Task 12 (edit/skip/free-rein) |
| End-to-end real-agent verification | Task 4, Task 10, Task 12 step 4, Final |
| Edge cases (default en, fallback, backward-compat marker, vi key fallback) | Task 1, Task 5, Task 7 |
