/**
 * Tiny i18n for the studio. No build step, no framework.
 *
 * Usage:
 *   import { t, setLocale, getLocale, AVAILABLE_LOCALES } from './i18n.js';
 *   t('toolbar.export_mp4')
 *   setLocale('zh')
 *
 * Locale resolution order:
 *   1. localStorage hv.studio.locale
 *   2. navigator.language prefix ("zh-CN" → "zh")
 *   3. DEFAULT_LOCALE = "en"
 *
 * Strings missing in the active locale fall back to en, then the key.
 */

export const DEFAULT_LOCALE = 'en';
export const AVAILABLE_LOCALES = ['en', 'zh', 'vi'];

const DICT = {
  en: {
    'app.empty_pick_create': 'Pick or create a project',
    'app.empty_subtitle':
      'Each project = one HTML video. Choose a template to see the visual baseline, chat with your agent to drive the content, edit per-frame text in the middle column, see the result on the right.',
    'app.no_project': 'no project',

    'sidebar.projects': 'Projects',
    'sidebar.new': '+ New',
    'sidebar.collapse': 'Collapse sidebar',
    'sidebar.empty_list': 'no projects yet',
    'sidebar.menu.rename': '✎ Rename',
    'sidebar.menu.delete': '🗑 Delete',
    'sidebar.rename_prompt': 'New project name',
    'sidebar.delete_confirm': 'Delete "{name}"? This cannot be undone.',

    'toolbar.template': 'Template',
    'toolbar.template_pick': 'Optional · Pick template',
    'toolbar.agent': 'Agent',
    'toolbar.model': 'Model',
    'toolbar.agent_none': '— none —',
    'toolbar.agent_ready': '● ready',
    'toolbar.agent_install': '○ install',
    'toolbar.export_mp4': 'Export MP4',

    'composer.placeholder.no_project': 'Pick a project first…',
    'composer.placeholder.detecting_agents': 'Describe the video while we check for agents…',
    'composer.placeholder.no_agent': 'Install Claude Code (claude CLI) to enable chat…',
    'composer.placeholder.focus':
      'Edit only this frame (click ✕ on the chip above to release)…',
    'composer.placeholder.no_template':
      'Describe a video, or paste an article link / GitHub repo to build one from it.',
    'composer.placeholder.with_template': 'Describe the video — content, names, data… or paste an article link / GitHub repo.',
    'composer.hint': 'Cmd / Ctrl + Enter · drag / paste files · drop a design.md / frame.md to lock brand + motion',
    'composer.send': 'Send',
    'composer.attach': 'Attach file',
    'composer.focus_chip': 'Editing only frame {order} {fid}',
    'composer.focus_clear': 'Clear focus',
    'form.drop_hint': '📎 Drag / paste / choose files as material (logo, screenshot, CSV… optional)',
    'form.add_file': '+ Add file',
    'form.submit': 'Submit ↵',
    'confirm.generate': '✓ Start generating',
    'confirm.edit': '✏️ Edit',
    'toast.save_failed': 'Save failed: {message}',
    'toast.saved_changes': 'Saved {changed} change(s)',
    'toast.error_generic': 'Error: {message}',
    'toast.init_failed': 'init failed: {message}',

    'chat.empty.title': 'Send a message to start',
    'chat.empty.body':
      'Tell the agent what you want — a single brand card, a multi-frame teaser, a data poster — and it will scaffold the HTML.',
    'chat.summary.form_submitted': '📋 Form submitted',
    'chat.summary.confirm_generate': '✓ Generate',
    'chat.summary.confirm_edit': '✏️ Edit',
    'chat.thinking': 'agent thinking',
    'chat.still_generating': '⏳ This project is still generating in the background — its result will appear here when done (reload preview to refresh).',
    'chat.placeholder.gen_html': '📄 *generating HTML…*',
    'chat.placeholder.plan_graph': '🧭 *planning storyboard…*',
    'chat.empty_reply':
      '⚠️ The agent returned an empty reply. Try rephrasing your request — e.g. tell it the brand / topic / 1-2 concrete details, or which kind of frame you want first.',

    'preview.placeholder.pick_project': 'Pick a project first.',
    'preview.placeholder.pick_template':
      'Send a chat to generate the first HTML.<br>Or pick a template up top for a quick start.',
    'preview.edit_text_on': '✓ Done editing',
    'preview.edit_text_off': '✎ Edit text',
    'preview.edit_text_title': 'Click any text in the preview to edit',
    'preview.edit_text_done_title': 'Finish editing',
    'preview.reload': '↻ Reload preview',
    'preview.no_hv_text':
      'This frame has no editable text (HTML missing data-hv-text).',

    'frames.label': 'Frames',
    'frames.view_graph': 'View graph',
    'frames.enhance': '⚡ Remotion',
    'frames.enhance_hint': 'Render this data frame natively with Remotion (numbers roll, bars grow)',
    'frames.enhanced_revert': '⚡ Remotion ✓ (revert)',
    'frames.enhancing': '⚡ {pct}%…',
    'enhance.done': '⚡ Frame rendered with Remotion',
    'enhance.failed': '⚡ Remotion failed: {message}',

    'text_pane.title': 'Frame text',
    'text_pane.no_project': 'No project.',
    'text_pane.empty_with_frames':
      'No editable text on this frame. Switch to another frame, or click ✎ Edit text on the canvas.',
    'text_pane.empty_no_frames':
      'No editable text yet. Send a chat to generate the first version of the HTML, then per-frame text fields appear here.',
    'text_pane.collapse': 'Collapse panel',
    'text_pane.save_state.idle': '—',
    'text_pane.save_state.typing': 'typing…',
    'text_pane.save_state.saving': 'saving…',
    'text_pane.save_state.saved': 'saved',
    'text_pane.save_state.error': 'error',

    'export.starting': '⏵ Starting MP4 export…',
    'export.button_running': '⏵ {pct}% · {stage}',
    'export.done_seconds': '✓ MP4 exported · {seconds}',
    'export.done_no_seconds': '✓ MP4 exported',
    'export.failed': '⚠️ Export failed: {message}',
    'export.stream_interrupted': 'Export stream interrupted: {message}',
    'export.failed_short': 'Export failed: {message}',
    'export.title': '🎬 MP4 ready',
    'export.reveal': 'Reveal in Finder',
    'export.copy_path': 'Copy path',
    'export.copied': 'Path copied',
    'export.copy_failed': 'Copy failed: {message}',
    'export.reveal_failed': 'Open failed: {message}',

    'soundtrack.title': '🎵 Add background music & narration',
    'soundtrack.summary_sub': 'AI music + voiceover, mixed into your export',
    'soundtrack.optional': 'optional',
    'soundtrack.hint': 'Background music + narration, mixed into the MP4 on export.',
    'soundtrack.music_label': 'Background music',
    'soundtrack.music_placeholder': 'Pick a style above, or describe your own — genre, mood, tempo',
    'soundtrack.preset_energetic': 'Energetic',
    'soundtrack.preset_calm': 'Calm',
    'soundtrack.preset_tech': 'Tech',
    'soundtrack.preset_narrative': 'Narrative',
    'soundtrack.preset_minimal': 'Minimal',
    'soundtrack.preset_epic': 'Epic',
    'soundtrack.narration_label': 'Narration / voiceover',
    'soundtrack.step_write': 'Write the script (text)',
    'soundtrack.step_voice': 'Synthesize the voice (audio)',
    'soundtrack.editing_frame': '· editing frame {n}/{total}',
    'soundtrack.draft_frame': '✨ Draft this frame',
    'soundtrack.draft_all': '✨ Draft all frames',
    'soundtrack.gen_music': '🎵 Generate music',
    'soundtrack.gen_narration': '🎙 Synthesize voiceover',
    'soundtrack.empty_music': 'Pick or describe a music style first.',
    'soundtrack.empty_narration': 'Add narration text first (✨ to draft it).',
    'soundtrack.frame_word': 'Frame',
    'soundtrack.total_word': 'Total',
    'soundtrack.drafting': 'Drafting…',
    'soundtrack.draft_need_frames': 'Generate the video first',
    'soundtrack.draft_failed': '⚠️ Draft failed: {message}',
    'soundtrack.narration_placeholder': 'One line per frame — click ✨ to draft from the video (leave empty for none)',
    'soundtrack.voice_label': 'Voice',
    'soundtrack.voice_male_warm': 'Male · Warm',
    'soundtrack.voice_male_pro': 'Male · Professional',
    'soundtrack.voice_male_deep': 'Male · Deep',
    'soundtrack.voice_female_anchor': 'Female · Anchor',
    'soundtrack.voice_female_mature': 'Female · Mature',
    'soundtrack.voice_female_sweet': 'Female · Sweet',
    'soundtrack.fit_durations': '⇄ Fit timing to narration',
    'soundtrack.fit_hint': 'Re-pace each frame by how much narration it has',
    'soundtrack.fitting': 'Fitting…',
    'soundtrack.fitted': '✓ Frame timing fit to narration · {sec}s total',
    'soundtrack.fit_failed': 'Could not fit timing',
    'soundtrack.music_volume': 'Music volume',
    'soundtrack.narration_volume': 'Narration volume',
    'soundtrack.generate': 'Generate soundtrack',
    'soundtrack.generating': 'Generating…',
    'soundtrack.clear': 'Clear',
    'soundtrack.starting': '⏵ Generating soundtrack…',
    'soundtrack.progress_music': '⏵ Generating background music…',
    'soundtrack.progress_narration': '⏵ Generating narration…',
    'soundtrack.done': '✓ Soundtrack ready — it will be mixed in on export',
    'soundtrack.failed': '⚠️ Soundtrack failed: {message}',
    'soundtrack.music_ready': 'Music',
    'soundtrack.narration_ready': 'Narration',
    'soundtrack.empty': 'Enter a music prompt and/or narration text first.',

    'graph.title': 'Content graph',
    'graph.download': '⬇ Download JSON',
    'graph.close': '✕',
    'graph.empty': '(no graph for this project)',
    'graph.error': 'error loading graph: {message}',

    'gallery.title': 'Pick a template',
    'gallery.close': '✕',

    'modal.new.title': 'New project',
    'modal.new.name_label': 'Name',
    'modal.new.name_placeholder': 'e.g. nexu-io launch teaser',
    'modal.new.intent_label': 'Intent (optional)',
    'modal.new.intent_placeholder': 'A one-line description of what this video is about',
    'modal.new.cancel': 'Cancel',
    'modal.new.create': 'Create',
    'modal.new.name_required': 'Name is required',
    'modal.new.created': 'Created "{name}"',
    'modal.new.failed': 'Failed to create project',

    'language.label': 'Language',

    'settings.title': 'Settings',
    'settings.tab.agent': 'Agent',
    'settings.tab.audio': 'Audio',
    'settings.tab.language': 'Language',
    'settings.tab.about': 'About',

    'settings.audio.title': 'Audio',
    'settings.audio.tts_provider': 'Narration (TTS) provider',
    'settings.audio.voice': 'Voice',
    'settings.audio.music_provider': 'Music provider',
    'settings.audio.minimax_section': 'MiniMax (optional — only for the MiniMax provider)',
    'settings.audio.needs_setup': 'needs key',
    'settings.audio.subtitle': 'API key for soundtrack generation (background music + narration).',
    'settings.audio.loading': 'Checking…',
    'settings.audio.api_key': 'API key',
    'settings.audio.api_key_placeholder': 'Paste your MiniMax API key',
    'settings.audio.region': 'API region',
    'settings.audio.region_intl': '🌐 International · api.minimax.io',
    'settings.audio.region_cn': '🇨🇳 China · api.minimaxi.com',
    'settings.audio.base_url': 'Base URL',
    'settings.audio.save': 'Save',
    'settings.audio.clear': 'Clear',
    'settings.audio.configured': '✓ Configured · {key} · from {source}',
    'settings.audio.not_configured': 'No MiniMax key configured yet.',
    'settings.audio.source_config': 'Settings',
    'settings.audio.source_env': 'environment',
    'settings.audio.saving': 'Saving…',
    'settings.audio.saved': '✓ Saved',
    'settings.audio.save_failed': 'Save failed: {message}',
    'settings.audio.need_key': 'Enter an API key first.',
    'settings.audio.hint': 'Stored locally in .html-video/media-config.json. Pick the region that matches your key — an api.minimax.io (International) key will NOT work against api.minimaxi.com (China), and vice-versa. The old api.minimaxi.chat host is retired.',

    'settings.agent.title': 'Agent',
    'settings.agent.subtitle': 'Pick the runtime that turns your chat into HTML.',
    'settings.agent.mode.local': 'Local CLI',
    'settings.agent.mode.byok': 'BYOK (API)',
    'settings.agent.detected': 'Detected agents ({count})',
    'settings.agent.test': 'Test',
    'settings.agent.testing': 'Testing…',
    'settings.agent.test_ok': 'OK · {ms}ms · {bytes}B',
    'settings.agent.test_fail': 'Failed: {message}',
    'settings.agent.empty_reply': 'Failed: agent returned an empty reply',
    'settings.agent.use': 'Use',
    'settings.agent.in_use': 'In use',
    'settings.agent.unavailable': 'Not installed',
    'agent.sign_in': 'Sign in',
    'agent.signing_in': 'Signing in…',
    'agent.signed_in': '✓ Signed in to AMR',
    'agent.sign_in_failed': 'Sign-in failed',
    'agent.recommended': 'Recommended · one login, many models',
    'settings.agent.byok.intro': 'Use your own Anthropic / OpenRouter API key. Reads from environment:',
    'settings.agent.byok.env_key': 'ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN',
    'settings.agent.byok.env_base': 'ANTHROPIC_BASE_URL (optional, defaults to api.anthropic.com)',
    'settings.agent.rescan': '↻ Rescan',
    'settings.agent.rescanned': 'Rescanned',

    'settings.language.title': 'Language',
    'settings.language.subtitle': 'Studio interface language. Re-renders instantly.',
    'settings.language.en': 'English',
    'settings.language.zh': '中文',
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.en_sub': 'EN',
    'settings.language.zh_sub': 'ZH-CN',
    'settings.language.vi_sub': 'VI',

    'settings.about.title': 'About',
    'settings.about.subtitle': 'html-video — open-source HTML→Video meta-layer for coding agents.',
    'settings.about.version': 'Version',
    'settings.about.repo': 'Repo',
    'settings.about.discord': 'Discord',
    'settings.about.license': 'License',
    'settings.about.related': 'Related',

    'toolbar.settings': 'Settings',

    'tpl_preview.cancel': 'Cancel',
    'tpl_preview.use': 'Use this template',
    'tpl_preview.replace_confirm': 'Replace current template with "{name}"? Existing preview content stays put — the agent can rebuild on next chat.',
    'tpl_preview.applied': 'Template: {name}',
    'tpl_preview.fps_dur': '{fps}fps · {duration}s · {aspect}',
    'tpl_preview.source_skill': 'Adapted from',
    'tpl_preview.source_origin': 'Design lineage',
    'tpl_preview.source_license': 'License',
  },

  zh: {
    'app.empty_pick_create': '挑一个项目或新建',
    'app.empty_subtitle':
      '每个项目 = 一个 HTML 视频。挑一个模板看视觉基线、跟 agent 聊驱动内容、在中间栏改逐帧文字、右边看效果。',
    'app.no_project': '未选项目',

    'sidebar.projects': '项目',
    'sidebar.new': '+ 新建',
    'sidebar.collapse': '收起侧栏',
    'sidebar.empty_list': '还没有项目',
    'sidebar.menu.rename': '✎ 重命名',
    'sidebar.menu.delete': '🗑 删除',
    'sidebar.rename_prompt': '新项目名',
    'sidebar.delete_confirm': '删除 "{name}"？此操作不可撤销。',

    'toolbar.template': '模板',
    'toolbar.template_pick': '可选 · 挑模板',
    'toolbar.agent': 'Agent',
    'toolbar.model': '模型',
    'toolbar.agent_none': '— 无 —',
    'toolbar.agent_ready': '● 就绪',
    'toolbar.agent_install': '○ 待装',
    'toolbar.export_mp4': '导出 MP4',

    'composer.placeholder.no_project': '先选一个项目…',
    'composer.placeholder.detecting_agents': '描述视频（正在探测 agent）…',
    'composer.placeholder.no_agent': '装 claude CLI 后即可聊天…',
    'composer.placeholder.focus': '只修改这一帧的内容（点掉上方芯片可恢复整片）…',
    'composer.placeholder.no_template': '描述视频，或粘一个文章链接 / GitHub repo 据此生成。',
    'composer.placeholder.with_template': '描述视频 — 内容、名字、数据…或粘文章链接 / GitHub repo。',
    'composer.hint': 'Cmd / Ctrl + Enter · 拖拽 / 粘贴文件 · 拖入 design.md / frame.md 锁定品牌+动效',
    'composer.send': '发送',
    'composer.attach': '附加文件',
    'composer.focus_chip': '仅修改第 {order} 帧 {fid}',
    'composer.focus_clear': '清除',
    'form.drop_hint': '📎 拖拽 / 粘贴 / 选择文件作为素材（logo、截图、数据 CSV…可选）',
    'form.add_file': '+ 添加文件',
    'form.submit': '提交 ↵',
    'confirm.generate': '✓ 开始生成',
    'confirm.edit': '✏️ 修改',
    'toast.save_failed': '保存失败：{message}',
    'toast.saved_changes': '已保存 {changed} 处修改',
    'toast.error_generic': '错误：{message}',
    'toast.init_failed': 'init 失败：{message}',

    'chat.empty.title': '发条消息开始',
    'chat.empty.body':
      '告诉 agent 想做什么 — 单帧标题卡、多帧预告片、数据大字报 — 它会搭出 HTML。',
    'chat.summary.form_submitted': '📋 提交了表单',
    'chat.summary.confirm_generate': '✓ 确认生成',
    'chat.summary.confirm_edit': '✏️ 改一下',
    'chat.thinking': 'agent 思考中',
    'chat.still_generating': '⏳ 这个项目仍在后台生成中 —— 完成后结果会出现在这里（点重载预览可刷新）。',
    'chat.placeholder.gen_html': '📄 *正在生成 HTML…*',
    'chat.placeholder.plan_graph': '🧭 *规划故事板…*',
    'chat.empty_reply':
      '⚠️ Agent 返回为空。试着重新表述 — 比如告诉它品牌 / 主题 / 1-2 个具体点，或者你想要什么类型的帧。',

    'preview.placeholder.pick_project': '先选一个项目。',
    'preview.placeholder.pick_template':
      '发一条消息让 agent 生成第一版 HTML。<br>或上方挑一个模板快开。',
    'preview.edit_text_on': '✓ 完成编辑',
    'preview.edit_text_off': '✎ 编辑文字',
    'preview.edit_text_title': '点画面里的文字直接修改',
    'preview.edit_text_done_title': '完成编辑',
    'preview.reload': '↻ 重载预览',
    'preview.no_hv_text': '当前帧没有可编辑的文字（HTML 缺 data-hv-text 标签）。',

    'frames.label': '分镜',
    'frames.view_graph': '看图谱',
    'frames.enhance': '⚡ Remotion',
    'frames.enhance_hint': '用原生 Remotion 渲染这个数据帧（数字滚动、柱子生长）',
    'frames.enhanced_revert': '⚡ Remotion ✓（还原）',
    'frames.enhancing': '⚡ {pct}%…',
    'enhance.done': '⚡ 该帧已用 Remotion 渲染',
    'enhance.failed': '⚡ Remotion 失败：{message}',

    'text_pane.title': '帧文字',
    'text_pane.no_project': '无项目。',
    'text_pane.empty_with_frames':
      '当前帧没有可编辑文字。切到别的帧，或在画面里点 ✎ 编辑文字。',
    'text_pane.empty_no_frames':
      '还没有可编辑的字段。发一条消息生成第一版 HTML，逐帧字段会出现在这里。',
    'text_pane.collapse': '收起面板',
    'text_pane.save_state.idle': '—',
    'text_pane.save_state.typing': '输入中…',
    'text_pane.save_state.saving': '保存中…',
    'text_pane.save_state.saved': '已保存',
    'text_pane.save_state.error': '错误',

    'export.starting': '⏵ 开始导出 MP4…',
    'export.button_running': '⏵ {pct}% · {stage}',
    'export.done_seconds': '✓ MP4 已导出 · {seconds}',
    'export.done_no_seconds': '✓ MP4 已导出',
    'export.failed': '⚠️ 导出失败：{message}',
    'export.stream_interrupted': '导出流中断：{message}',
    'export.failed_short': '导出失败：{message}',
    'export.title': '🎬 MP4 已就绪',
    'export.reveal': '在 Finder 中显示',
    'export.copy_path': '复制路径',
    'export.copied': '已复制路径',
    'export.copy_failed': '复制失败：{message}',
    'export.reveal_failed': '打开失败：{message}',

    'soundtrack.title': '🎵 添加背景音乐和配音',
    'soundtrack.summary_sub': 'AI 配乐 + 旁白，导出时自动混入',
    'soundtrack.optional': '可选',
    'soundtrack.hint': '背景音乐 + 旁白，导出时混入 MP4。',
    'soundtrack.music_label': '背景音乐',
    'soundtrack.music_placeholder': '选上面的风格，或自己描述 —— 风格、情绪、节奏',
    'soundtrack.preset_energetic': '动感',
    'soundtrack.preset_calm': '舒缓',
    'soundtrack.preset_tech': '科技',
    'soundtrack.preset_narrative': '叙事',
    'soundtrack.preset_minimal': '极简',
    'soundtrack.preset_epic': '史诗',
    'soundtrack.narration_label': '旁白 / 配音',
    'soundtrack.step_write': '第一步 · 写旁白文字',
    'soundtrack.step_voice': '第二步 · 合成配音（音频）',
    'soundtrack.editing_frame': '· 正在编辑第 {n}/{total} 帧',
    'soundtrack.draft_frame': '✨ AI 起草本页',
    'soundtrack.draft_all': '✨ AI 起草全部',
    'soundtrack.gen_music': '🎵 生成配乐',
    'soundtrack.gen_narration': '🎙 合成配音',
    'soundtrack.empty_music': '请先选或描述一个音乐风格。',
    'soundtrack.empty_narration': '请先填旁白文字（点 ✨ 可让 AI 起草）。',
    'soundtrack.frame_word': '画面',
    'soundtrack.total_word': '总时长',
    'soundtrack.drafting': '生成中…',
    'soundtrack.draft_need_frames': '请先生成视频',
    'soundtrack.draft_failed': '⚠️ 生成失败：{message}',
    'soundtrack.narration_placeholder': '每帧一句——点 ✨ 根据视频生成（留空则不加）',
    'soundtrack.voice_label': '音色',
    'soundtrack.voice_male_warm': '男声 · 温暖',
    'soundtrack.voice_male_pro': '男声 · 专业',
    'soundtrack.voice_male_deep': '男声 · 低沉',
    'soundtrack.voice_female_anchor': '女声 · 播音',
    'soundtrack.voice_female_mature': '女声 · 御姐',
    'soundtrack.voice_female_sweet': '女声 · 甜美',
    'soundtrack.fit_durations': '⇄ 时长适配配音',
    'soundtrack.fit_hint': '按每帧旁白长短重新分配各帧时长',
    'soundtrack.fitting': '适配中…',
    'soundtrack.fitted': '✓ 帧时长已适配配音 · 共 {sec}s',
    'soundtrack.fit_failed': '适配失败',
    'soundtrack.music_volume': '音乐音量',
    'soundtrack.narration_volume': '旁白音量',
    'soundtrack.generate': '生成配乐',
    'soundtrack.generating': '生成中…',
    'soundtrack.clear': '清除',
    'soundtrack.starting': '⏵ 正在生成配乐…',
    'soundtrack.progress_music': '⏵ 正在生成背景音乐…',
    'soundtrack.progress_narration': '⏵ 正在生成旁白…',
    'soundtrack.done': '✓ 配乐就绪 —— 导出时会自动混入',
    'soundtrack.failed': '⚠️ 配乐失败：{message}',
    'soundtrack.music_ready': '音乐',
    'soundtrack.narration_ready': '旁白',
    'soundtrack.empty': '请先填写音乐提示词或旁白文字。',

    'graph.title': '内容图谱',
    'graph.download': '⬇ 下载 JSON',
    'graph.close': '✕',
    'graph.empty': '（项目没有图谱）',
    'graph.error': '加载图谱失败：{message}',

    'gallery.title': '挑一个模板',
    'gallery.close': '✕',

    'modal.new.title': '新建项目',
    'modal.new.name_label': '名称',
    'modal.new.name_placeholder': '例如：nexu-io 发布预告',
    'modal.new.intent_label': '意图（可选）',
    'modal.new.intent_placeholder': '一句话说说这个视频在讲什么',
    'modal.new.cancel': '取消',
    'modal.new.create': '创建',
    'modal.new.name_required': '名称不能空',
    'modal.new.created': '已创建 "{name}"',
    'modal.new.failed': '创建项目失败',

    'language.label': '语言',

    'settings.title': '设置',
    'settings.tab.agent': 'Agent',
    'settings.tab.audio': '音频',
    'settings.tab.language': '界面语言',
    'settings.tab.about': '关于',

    'settings.audio.title': '音频',
    'settings.audio.tts_provider': '配音 (TTS) 提供方',
    'settings.audio.voice': '声音',
    'settings.audio.music_provider': '音乐提供方',
    'settings.audio.minimax_section': 'MiniMax（可选 — 仅 MiniMax 提供方需要）',
    'settings.audio.needs_setup': '需密钥',
    'settings.audio.subtitle': '配乐生成（背景音乐 + 旁白）所需的 API key。',
    'settings.audio.loading': '检查中…',
    'settings.audio.api_key': 'API key',
    'settings.audio.api_key_placeholder': '粘贴你的 MiniMax API key',
    'settings.audio.region': 'API 区域',
    'settings.audio.region_intl': '🌐 国际 · api.minimax.io',
    'settings.audio.region_cn': '🇨🇳 国内 · api.minimaxi.com',
    'settings.audio.base_url': 'Base URL',
    'settings.audio.save': '保存',
    'settings.audio.clear': '清除',
    'settings.audio.configured': '✓ 已配置 · {key} · 来自{source}',
    'settings.audio.not_configured': '尚未配置 MiniMax key。',
    'settings.audio.source_config': '设置',
    'settings.audio.source_env': '环境变量',
    'settings.audio.saving': '保存中…',
    'settings.audio.saved': '✓ 已保存',
    'settings.audio.save_failed': '保存失败：{message}',
    'settings.audio.need_key': '请先填写 API key。',
    'settings.audio.hint': '保存在本地 .html-video/media-config.json。请按你的 key 选对区域——国际版 api.minimax.io 的 key 在国内版 api.minimaxi.com 上无法使用，反之亦然；旧的 api.minimaxi.chat 域名已停用。',

    'settings.agent.title': 'Agent',
    'settings.agent.subtitle': '选一个运行时把你的对话翻成 HTML。',
    'settings.agent.mode.local': '本机 CLI',
    'settings.agent.mode.byok': 'BYOK (API)',
    'settings.agent.detected': '已检测到的 agent（{count}）',
    'settings.agent.test': '测试',
    'settings.agent.testing': '测试中…',
    'settings.agent.test_ok': '通过 · {ms}ms · {bytes}B',
    'settings.agent.test_fail': '失败：{message}',
    'settings.agent.empty_reply': '失败：agent 返回为空',
    'settings.agent.use': '使用',
    'settings.agent.in_use': '当前',
    'settings.agent.unavailable': '未安装',
    'agent.sign_in': '登录',
    'agent.signing_in': '登录中…',
    'agent.signed_in': '✓ 已登录 AMR',
    'agent.sign_in_failed': '登录失败',
    'agent.recommended': '推荐 · 一次登录，多种模型',
    'settings.agent.byok.intro': '直连 Anthropic / OpenRouter API。从环境变量读：',
    'settings.agent.byok.env_key': 'ANTHROPIC_API_KEY 或 ANTHROPIC_AUTH_TOKEN',
    'settings.agent.byok.env_base': 'ANTHROPIC_BASE_URL（可选，默认 api.anthropic.com）',
    'settings.agent.rescan': '↻ 重新扫描',
    'settings.agent.rescanned': '已重新扫描',

    'settings.language.title': '界面语言',
    'settings.language.subtitle': 'Studio 界面语言，切换立即生效。',
    'settings.language.en': 'English',
    'settings.language.zh': '中文',
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.en_sub': 'EN',
    'settings.language.zh_sub': 'ZH-CN',
    'settings.language.vi_sub': '越南语',

    'settings.about.title': '关于',
    'settings.about.subtitle': 'html-video — 开源的 HTML→视频 meta-layer，为 coding agent 设计。',
    'settings.about.version': '版本',
    'settings.about.repo': '代码仓库',
    'settings.about.discord': 'Discord',
    'settings.about.license': '许可',
    'settings.about.related': '相关项目',

    'toolbar.settings': '设置',

    'tpl_preview.cancel': '取消',
    'tpl_preview.use': '使用此模板',
    'tpl_preview.replace_confirm': '把当前模板替换为 "{name}"？现有预览不会被覆盖，下一轮 chat 时 agent 会按新模板重写。',
    'tpl_preview.applied': '已切换模板：{name}',
    'tpl_preview.fps_dur': '{fps}fps · {duration}秒 · {aspect}',
    'tpl_preview.source_skill': '改编自',
    'tpl_preview.source_origin': '设计渊源',
    'tpl_preview.source_license': '许可证',
  },

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

    'composer.placeholder.no_project': 'Chọn một dự án trước…',
    'composer.placeholder.detecting_agents': 'Mô tả video trong khi chúng tôi dò agent…',
    'composer.placeholder.no_agent': 'Cài Claude Code (claude CLI) để bật chat…',
    'composer.placeholder.focus':
      'Chỉ sửa khung này (bấm ✕ trên chip ở trên để bỏ chọn)…',
    'composer.placeholder.no_template':
      'Mô tả một video, hoặc dán link bài viết / repo GitHub để dựng từ đó.',
    'composer.placeholder.with_template': 'Mô tả video — nội dung, tên, số liệu… hoặc dán link bài viết / repo GitHub.',
    'composer.hint': 'Cmd / Ctrl + Enter · kéo / dán tệp · thả design.md / frame.md để khoá thương hiệu + chuyển động',
    'composer.send': 'Gửi',
    'composer.attach': 'Đính kèm tệp',
    'composer.focus_chip': 'Chỉ đang sửa khung {order} {fid}',
    'composer.focus_clear': 'Bỏ chọn khung',
    'form.drop_hint': '📎 Kéo thả / dán / chọn tệp làm tư liệu (logo, ảnh chụp, CSV… tuỳ chọn)',
    'form.add_file': '+ Thêm tệp',
    'form.submit': 'Gửi ↵',
    'confirm.generate': '✓ Bắt đầu tạo',
    'confirm.edit': '✏️ Sửa',
    'toast.save_failed': 'Lưu thất bại: {message}',
    'toast.saved_changes': 'Đã lưu {changed} thay đổi',
    'toast.error_generic': 'Lỗi: {message}',
    'toast.init_failed': 'init thất bại: {message}',

    'chat.empty.title': 'Gửi một tin nhắn để bắt đầu',
    'chat.empty.body':
      'Nói cho agent biết bạn muốn gì — một thẻ thương hiệu, một teaser nhiều khung, một poster dữ liệu — và nó sẽ dựng HTML.',
    'chat.summary.form_submitted': '📋 Đã gửi biểu mẫu',
    'chat.summary.confirm_generate': '✓ Tạo',
    'chat.summary.confirm_edit': '✏️ Sửa',
    'chat.thinking': 'agent đang nghĩ',
    'chat.still_generating': '⏳ Dự án này vẫn đang tạo ở chế độ nền — kết quả sẽ hiện ở đây khi xong (tải lại preview để làm mới).',
    'chat.placeholder.gen_html': '📄 *đang tạo HTML…*',
    'chat.placeholder.plan_graph': '🧭 *đang lên kịch bản…*',
    'chat.empty_reply':
      '⚠️ Agent trả về phản hồi rỗng. Thử diễn đạt lại yêu cầu — ví dụ nêu thương hiệu / chủ đề / 1-2 chi tiết cụ thể, hoặc loại khung bạn muốn trước.',

    'preview.placeholder.pick_project': 'Chọn một dự án trước.',
    'preview.placeholder.pick_template':
      'Gửi một tin nhắn để tạo HTML đầu tiên.<br>Hoặc chọn template ở trên để bắt đầu nhanh.',
    'preview.edit_text_on': '✓ Xong chỉnh sửa',
    'preview.edit_text_off': '✎ Sửa text',
    'preview.edit_text_title': 'Bấm vào bất kỳ text nào trong preview để sửa',
    'preview.edit_text_done_title': 'Hoàn tất chỉnh sửa',
    'preview.reload': '↻ Tải lại preview',
    'preview.no_hv_text':
      'Khung này không có text sửa được (HTML thiếu data-hv-text).',

    'frames.label': 'Khung',
    'frames.view_graph': 'Xem graph',
    'frames.enhance': '⚡ Remotion',
    'frames.enhance_hint': 'Dựng khung dữ liệu này bằng Remotion (số chạy, cột lớn dần)',
    'frames.enhanced_revert': '⚡ Remotion ✓ (hoàn tác)',
    'frames.enhancing': '⚡ {pct}%…',
    'enhance.done': '⚡ Đã dựng khung bằng Remotion',
    'enhance.failed': '⚡ Remotion thất bại: {message}',

    'text_pane.title': 'Text của khung',
    'text_pane.no_project': 'Chưa có dự án.',
    'text_pane.empty_with_frames':
      'Khung này không có text sửa được. Chuyển sang khung khác, hoặc bấm ✎ Sửa text trên canvas.',
    'text_pane.empty_no_frames':
      'Chưa có text sửa được. Gửi một tin nhắn để tạo HTML phiên bản đầu, rồi các ô text từng khung sẽ hiện ở đây.',
    'text_pane.collapse': 'Thu gọn bảng',
    'text_pane.save_state.idle': '—',
    'text_pane.save_state.typing': 'đang gõ…',
    'text_pane.save_state.saving': 'đang lưu…',
    'text_pane.save_state.saved': 'đã lưu',
    'text_pane.save_state.error': 'lỗi',

    'export.starting': '⏵ Đang bắt đầu xuất MP4…',
    'export.button_running': '⏵ {pct}% · {stage}',
    'export.done_seconds': '✓ Đã xuất MP4 · {seconds}',
    'export.done_no_seconds': '✓ Đã xuất MP4',
    'export.failed': '⚠️ Xuất thất bại: {message}',
    'export.stream_interrupted': 'Luồng xuất bị gián đoạn: {message}',
    'export.failed_short': 'Xuất thất bại: {message}',
    'export.title': '🎬 MP4 đã sẵn sàng',
    'export.reveal': 'Hiện trong Finder',
    'export.copy_path': 'Sao chép đường dẫn',
    'export.copied': 'Đã sao chép đường dẫn',
    'export.copy_failed': 'Sao chép thất bại: {message}',
    'export.reveal_failed': 'Mở thất bại: {message}',

    'soundtrack.title': '🎵 Thêm nhạc nền & lời thuyết minh',
    'soundtrack.summary_sub': 'Nhạc AI + lồng tiếng, trộn vào bản xuất của bạn',
    'soundtrack.optional': 'tuỳ chọn',
    'soundtrack.hint': 'Nhạc nền + thuyết minh, trộn vào MP4 khi xuất.',
    'soundtrack.music_label': 'Nhạc nền',
    'soundtrack.music_placeholder': 'Chọn một phong cách ở trên, hoặc tự mô tả — thể loại, tâm trạng, nhịp độ',
    'soundtrack.preset_energetic': 'Sôi động',
    'soundtrack.preset_calm': 'Êm dịu',
    'soundtrack.preset_tech': 'Công nghệ',
    'soundtrack.preset_narrative': 'Kể chuyện',
    'soundtrack.preset_minimal': 'Tối giản',
    'soundtrack.preset_epic': 'Hoành tráng',
    'soundtrack.narration_label': 'Thuyết minh / lồng tiếng',
    'soundtrack.step_write': 'Viết kịch bản (văn bản)',
    'soundtrack.step_voice': 'Tổng hợp giọng nói (âm thanh)',
    'soundtrack.editing_frame': '· đang sửa khung {n}/{total}',
    'soundtrack.draft_frame': '✨ Soạn cho khung này',
    'soundtrack.draft_all': '✨ Soạn cho tất cả khung',
    'soundtrack.gen_music': '🎵 Tạo nhạc',
    'soundtrack.gen_narration': '🎙 Tổng hợp lồng tiếng',
    'soundtrack.empty_music': 'Chọn hoặc mô tả một phong cách nhạc trước.',
    'soundtrack.empty_narration': 'Thêm lời thuyết minh trước (✨ để soạn tự động).',
    'soundtrack.frame_word': 'Khung',
    'soundtrack.total_word': 'Tổng',
    'soundtrack.drafting': 'Đang soạn…',
    'soundtrack.draft_need_frames': 'Hãy tạo video trước',
    'soundtrack.draft_failed': '⚠️ Soạn thất bại: {message}',
    'soundtrack.narration_placeholder': 'Mỗi khung một dòng — bấm ✨ để soạn từ video (để trống nếu không cần)',
    'soundtrack.voice_label': 'Giọng',
    'soundtrack.voice_male_warm': 'Nam · Ấm',
    'soundtrack.voice_male_pro': 'Nam · Chuyên nghiệp',
    'soundtrack.voice_male_deep': 'Nam · Trầm',
    'soundtrack.voice_female_anchor': 'Nữ · Dẫn chương trình',
    'soundtrack.voice_female_mature': 'Nữ · Trưởng thành',
    'soundtrack.voice_female_sweet': 'Nữ · Ngọt ngào',
    'soundtrack.fit_durations': '⇄ Khớp thời lượng theo thuyết minh',
    'soundtrack.fit_hint': 'Căn lại nhịp mỗi khung theo lượng thuyết minh',
    'soundtrack.fitting': 'Đang khớp…',
    'soundtrack.fitted': '✓ Đã khớp thời lượng khung theo thuyết minh · tổng {sec}s',
    'soundtrack.fit_failed': 'Không thể khớp thời lượng',
    'soundtrack.music_volume': 'Âm lượng nhạc',
    'soundtrack.narration_volume': 'Âm lượng thuyết minh',
    'soundtrack.generate': 'Tạo soundtrack',
    'soundtrack.generating': 'Đang tạo…',
    'soundtrack.clear': 'Xoá',
    'soundtrack.starting': '⏵ Đang tạo soundtrack…',
    'soundtrack.progress_music': '⏵ Đang tạo nhạc nền…',
    'soundtrack.progress_narration': '⏵ Đang tạo thuyết minh…',
    'soundtrack.done': '✓ Soundtrack đã sẵn sàng — sẽ được trộn vào khi xuất',
    'soundtrack.failed': '⚠️ Soundtrack thất bại: {message}',
    'soundtrack.music_ready': 'Nhạc',
    'soundtrack.narration_ready': 'Thuyết minh',
    'soundtrack.empty': 'Nhập mô tả nhạc và/hoặc lời thuyết minh trước.',

    'graph.title': 'Content graph',
    'graph.download': '⬇ Tải JSON',
    'graph.close': '✕',
    'graph.empty': '(dự án này chưa có graph)',
    'graph.error': 'lỗi tải graph: {message}',

    'gallery.title': 'Chọn một template',
    'gallery.close': '✕',

    'modal.new.title': 'Dự án mới',
    'modal.new.name_label': 'Tên',
    'modal.new.name_placeholder': 'vd: teaser ra mắt nexu-io',
    'modal.new.intent_label': 'Mục đích (tuỳ chọn)',
    'modal.new.intent_placeholder': 'Mô tả một dòng về nội dung video này',
    'modal.new.cancel': 'Huỷ',
    'modal.new.create': 'Tạo',
    'modal.new.name_required': 'Cần nhập tên',
    'modal.new.created': 'Đã tạo "{name}"',
    'modal.new.failed': 'Tạo dự án thất bại',

    'language.label': 'Ngôn ngữ',

    'settings.title': 'Cài đặt',
    'settings.tab.agent': 'Agent',
    'settings.tab.audio': 'Âm thanh',
    'settings.tab.language': 'Ngôn ngữ',
    'settings.tab.about': 'Giới thiệu',

    'settings.audio.title': 'Âm thanh',
    'settings.audio.tts_provider': 'Nhà cung cấp thuyết minh (TTS)',
    'settings.audio.voice': 'Giọng đọc',
    'settings.audio.music_provider': 'Nhà cung cấp nhạc nền',
    'settings.audio.minimax_section': 'MiniMax (tuỳ chọn — chỉ cần khi dùng provider MiniMax)',
    'settings.audio.needs_setup': 'cần key',
    'settings.audio.subtitle': 'API key để tạo soundtrack (nhạc nền + thuyết minh).',
    'settings.audio.loading': 'Đang kiểm tra…',
    'settings.audio.api_key': 'API key',
    'settings.audio.api_key_placeholder': 'Dán MiniMax API key của bạn',
    'settings.audio.region': 'Vùng API',
    'settings.audio.region_intl': '🌐 Quốc tế · api.minimax.io',
    'settings.audio.region_cn': '🇨🇳 Trung Quốc · api.minimaxi.com',
    'settings.audio.base_url': 'Base URL',
    'settings.audio.save': 'Lưu',
    'settings.audio.clear': 'Xoá',
    'settings.audio.configured': '✓ Đã cấu hình · {key} · từ {source}',
    'settings.audio.not_configured': 'Chưa cấu hình MiniMax key.',
    'settings.audio.source_config': 'Cài đặt',
    'settings.audio.source_env': 'biến môi trường',
    'settings.audio.saving': 'Đang lưu…',
    'settings.audio.saved': '✓ Đã lưu',
    'settings.audio.save_failed': 'Lưu thất bại: {message}',
    'settings.audio.need_key': 'Nhập API key trước.',
    'settings.audio.hint': 'Lưu cục bộ trong .html-video/media-config.json. Chọn vùng khớp với key của bạn — key api.minimax.io (Quốc tế) sẽ KHÔNG dùng được với api.minimaxi.com (Trung Quốc) và ngược lại. Host cũ api.minimaxi.chat đã ngừng.',

    'settings.agent.title': 'Agent',
    'settings.agent.subtitle': 'Chọn runtime biến chat của bạn thành HTML.',
    'settings.agent.mode.local': 'CLI cục bộ',
    'settings.agent.mode.byok': 'BYOK (API)',
    'settings.agent.detected': 'Agent phát hiện ({count})',
    'settings.agent.test': 'Kiểm tra',
    'settings.agent.testing': 'Đang kiểm tra…',
    'settings.agent.test_ok': 'OK · {ms}ms · {bytes}B',
    'settings.agent.test_fail': 'Thất bại: {message}',
    'settings.agent.empty_reply': 'Thất bại: agent trả về phản hồi rỗng',
    'settings.agent.use': 'Dùng',
    'settings.agent.in_use': 'Đang dùng',
    'settings.agent.unavailable': 'Chưa cài',
    'agent.sign_in': 'Đăng nhập',
    'agent.signing_in': 'Đang đăng nhập…',
    'agent.signed_in': '✓ Đã đăng nhập AMR',
    'agent.sign_in_failed': 'Đăng nhập thất bại',
    'agent.recommended': 'Khuyến nghị · một lần đăng nhập, nhiều model',
    'settings.agent.byok.intro': 'Dùng API key Anthropic / OpenRouter của riêng bạn. Đọc từ biến môi trường:',
    'settings.agent.byok.env_key': 'ANTHROPIC_API_KEY hoặc ANTHROPIC_AUTH_TOKEN',
    'settings.agent.byok.env_base': 'ANTHROPIC_BASE_URL (tuỳ chọn, mặc định api.anthropic.com)',
    'settings.agent.rescan': '↻ Quét lại',
    'settings.agent.rescanned': 'Đã quét lại',

    'settings.language.title': 'Ngôn ngữ',
    'settings.language.subtitle': 'Ngôn ngữ giao diện studio. Đổi là cập nhật ngay.',
    'settings.language.en': 'English',
    'settings.language.zh': '中文',
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.en_sub': 'EN',
    'settings.language.zh_sub': 'ZH-CN',
    'settings.language.vi_sub': 'VI',

    'settings.about.title': 'Giới thiệu',
    'settings.about.subtitle': 'html-video — meta-layer HTML→Video mã nguồn mở cho coding agent.',
    'settings.about.version': 'Phiên bản',
    'settings.about.repo': 'Repo',
    'settings.about.discord': 'Discord',
    'settings.about.license': 'Giấy phép',
    'settings.about.related': 'Liên quan',

    'toolbar.settings': 'Cài đặt',

    'tpl_preview.cancel': 'Huỷ',
    'tpl_preview.use': 'Dùng template này',
    'tpl_preview.replace_confirm': 'Thay template hiện tại bằng "{name}"? Nội dung preview hiện có vẫn giữ — agent có thể dựng lại ở lần chat sau.',
    'tpl_preview.applied': 'Template: {name}',
    'tpl_preview.fps_dur': '{fps}fps · {duration}s · {aspect}',
    'tpl_preview.source_skill': 'Phỏng theo',
    'tpl_preview.source_origin': 'Nguồn gốc thiết kế',
    'tpl_preview.source_license': 'Giấy phép',
  },
};

const STORAGE_KEY = 'hv.studio.locale';
let _locale = resolveInitialLocale();

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

export function getLocale() {
  return _locale;
}

export function setLocale(loc) {
  if (!AVAILABLE_LOCALES.includes(loc)) return;
  _locale = loc;
  try { localStorage.setItem(STORAGE_KEY, loc); } catch {}
  // Notify listeners (the studio app re-renders).
  document.dispatchEvent(new CustomEvent('hv-locale-change', { detail: { locale: loc } }));
}

/**
 * Apply i18n to static DOM elements. Markers:
 *   data-i18n="key"          → textContent
 *   data-i18n-attr="placeholder:key,title:key2"  → set those attrs
 *   data-i18n-html="key"     → innerHTML (caution: only for trusted keys)
 *
 * Call once after DOMContentLoaded and also on every locale change.
 */
export function applyDomI18n(root) {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  r.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  r.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const pairs = (el.dataset.i18nAttr || '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}

document.addEventListener('hv-locale-change', () => applyDomI18n());
document.addEventListener('DOMContentLoaded', () => applyDomI18n());

/**
 * Translate a key. `params` is a plain object whose keys substitute
 * `{key}` placeholders in the resolved string.
 */
export function t(key, params) {
  const dict = DICT[_locale] ?? DICT[DEFAULT_LOCALE];
  let s = dict[key];
  if (s === undefined) {
    // Fall back to English, then to the key itself.
    s = DICT[DEFAULT_LOCALE][key] ?? key;
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
