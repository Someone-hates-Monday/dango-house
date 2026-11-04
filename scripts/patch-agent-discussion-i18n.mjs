import fs from 'node:fs';

// --- discussion.ts ---
{
  let s = fs.readFileSync('electron/social/discussion.ts', 'utf8');
  s = s.replace(
    `import { coverageLabel } from '../../src/shared/agent';
import { ids } from '../../src/shared/director';`,
    `import { coverageLabel } from '../../src/shared/agent';
import { ids } from '../../src/shared/director';
import type { AppLocale } from '../../src/shared/i18n';
import { defaultLocale } from '../../src/shared/i18n';
import { agentCopy } from '../../src/shared/dialogue/pack';`,
  );

  s = s.replace(
    `function opinionFromFact(id: CharacterId, evidence: VideoEvidence, fact: ReturnType<typeof collectFacts>[number]): CharacterOpinion {
  const name = byId[id].name;
  const cover = coverageLabel(evidence.coverage);
  const stamp = fact.atMs !== undefined ? \`（约 \${Math.round(fact.atMs / 1000)} 秒处）\` : '';
  const honest =
    evidence.coverage === 'metadata_only'
      ? \`我现在只能根据\${cover}说话，没看见完整画面。\`
      : evidence.coverage === 'transcript_only'
        ? \`我读到的是字幕证据\${stamp}，画面动作我不敢乱猜。\`
        : \`依据当前证据（\${cover}）\${stamp}：\`;

  const lines: Record<CharacterId, { reaction: string; interpretation: string }> = {
    xia: {
      reaction: '诶，这个点我记住了！',
      interpretation: \`\${honest}「\${fact.text}」——要是和吃饭有关我就更开心；没有的话，我也想边看边陪你。\`,
    },
    rin: {
      reaction: '我先把线索放整齐。',
      interpretation: \`\${honest}关于「\${fact.text}」，我想确认它是证据而不是标题想象。我们可以从这里慢慢聊。\`,
    },
    shiori: {
      reaction: '……我在听。',
      interpretation: \`\${honest}「\${fact.text}」。别急着下结论；需要的话我坐近一点陪你看。\`,
    },
    gemini: {
      reaction: '喵！灵感叮咚！',
      interpretation: \`\${honest}「\${fact.text}」里好像藏着一点新鲜感。要不要再找相关的下一条？\`,
    },
    glm: {
      reaction: '这笔陪伴很划算～',
      interpretation: \`\${honest}抓住「\${fact.text}」就够了，不必七个人复读同一句摘要。\`,
    },
    kimi: {
      reaction: '我夹好书签了。',
      interpretation: \`\${honest}把「\${fact.text}」记成可删除的观影笔记，不把它说成已经完整看完。\`,
    },
    grok: {
      reaction: '这个点我接住了。',
      interpretation: \`\${honest}别整段复读——「\${fact.text}」就够我吐槽/接梗一轮。\`,
    },
  };`,
    `function opinionFromFact(id: CharacterId, evidence: VideoEvidence, fact: ReturnType<typeof collectFacts>[number], locale: AppLocale = defaultLocale): CharacterOpinion {
  const cover = coverageLabel(evidence.coverage, locale);
  const sec = fact.atMs !== undefined ? Math.round(fact.atMs / 1000) : undefined;
  const stamp =
    sec === undefined
      ? ''
      : locale === 'en'
        ? \` (around \${sec}s)\`
        : locale === 'ja'
          ? \`（約\${sec}秒付近）\`
          : \`（约 \${sec} 秒处）\`;
  const honest =
    evidence.coverage === 'metadata_only'
      ? locale === 'en'
        ? \`I can only speak from \${cover} right now—I have not seen the full picture.\`
        : locale === 'ja'
          ? \`今は\${cover}だけが根拠。全部見たわけじゃない。\`
          : \`我现在只能根据\${cover}说话，没看见完整画面。\`
      : evidence.coverage === 'transcript_only'
        ? locale === 'en'
          ? \`I only have caption evidence\${stamp}; I will not invent on-screen action.\`
          : locale === 'ja'
            ? \`字幕の証拠\${stamp}だけ。画面の動きは推測しない。\`
            : \`我读到的是字幕证据\${stamp}，画面动作我不敢乱猜。\`
        : locale === 'en'
          ? \`From current evidence (\${cover})\${stamp}: \`
          : locale === 'ja'
            ? \`いまの証拠（\${cover}）\${stamp}：\`
            : \`依据当前证据（\${cover}）\${stamp}：\`;

  const packs: Record<AppLocale, Record<CharacterId, { reaction: string; interpretation: (t: string) => string }>> = {
    'zh-CN': {
      xia: { reaction: '诶，这个点我记住了！', interpretation: t => \`\${honest}「\${t}」——要是和吃饭有关我就更开心；没有的话，我也想边看边陪你。\` },
      rin: { reaction: '我先把线索放整齐。', interpretation: t => \`\${honest}关于「\${t}」，我想确认它是证据而不是标题想象。我们可以从这里慢慢聊。\` },
      shiori: { reaction: '……我在听。', interpretation: t => \`\${honest}「\${t}」。别急着下结论；需要的话我坐近一点陪你看。\` },
      gemini: { reaction: '喵！灵感叮咚！', interpretation: t => \`\${honest}「\${t}」里好像藏着一点新鲜感。要不要再找相关的下一条？\` },
      glm: { reaction: '这笔陪伴很划算～', interpretation: t => \`\${honest}抓住「\${t}」就够了，不必七个人复读同一句摘要。\` },
      kimi: { reaction: '我夹好书签了。', interpretation: t => \`\${honest}把「\${t}」记成可删除的观影笔记，不把它说成已经完整看完。\` },
      grok: { reaction: '这个点我接住了。', interpretation: t => \`\${honest}别整段复读——「\${t}」就够我吐槽/接梗一轮。\` },
    },
    en: {
      xia: { reaction: 'Ooh, I noted that bit!', interpretation: t => \`\${honest}"\${t}"—even better if food-related; either way I want to watch with you.\` },
      rin: { reaction: 'Let me straighten the clues.', interpretation: t => \`\${honest}About "\${t}", I want to confirm it is evidence, not title fantasy. We can talk from here.\` },
      shiori: { reaction: '…I’m listening.', interpretation: t => \`\${honest}"\${t}". No rush to conclude; I can sit closer if you want.\` },
      gemini: { reaction: 'Meow! Idea ding!', interpretation: t => \`\${honest}"\${t}" feels fresh. Want a related next one later?\` },
      glm: { reaction: 'Good companionship value~', interpretation: t => \`\${honest}Holding onto "\${t}" is enough—no seven identical summaries.\` },
      kimi: { reaction: 'Bookmark set.', interpretation: t => \`\${honest}I’ll save "\${t}" as a deletable watch note—not as having finished the whole video.\` },
      grok: { reaction: 'Caught that beat.', interpretation: t => \`\${honest}No full-summary echo—"\${t}" is enough for one riff.\` },
    },
    ja: {
      xia: { reaction: 'おっ、この点覚えた！', interpretation: t => \`\${honest}「\${t}」——ごはん関係ならもっと嬉しい。なくても一緒に見るよ。\` },
      rin: { reaction: '手がかりを整えるね。', interpretation: t => \`\${honest}「\${t}」について、タイトル想像じゃなく証拠か確認したい。ここからゆっくり話そう。\` },
      shiori: { reaction: '……聞いてる。', interpretation: t => \`\${honest}「\${t}」。急がなくていい。必要なら近くに座る。\` },
      gemini: { reaction: 'にゃ！ひらめき！', interpretation: t => \`\${honest}「\${t}」に新鮮さがある。関連の次も探す？\` },
      glm: { reaction: 'コスパいい同伴～', interpretation: t => \`\${honest}「\${t}」を掴むだけで十分。7人で同じ要約は不要。\` },
      kimi: { reaction: 'しおり挟んだ。', interpretation: t => \`\${honest}「\${t}」を消せる観影メモに。全部見たことにはしない。\` },
      grok: { reaction: 'その点、受け取った。', interpretation: t => \`\${honest}全文エコー禁止——「\${t}」で一回ツッコミ十分。\` },
    },
  };
  const lines = packs[locale];`,
  );

  s = s.replace(
    `  const chosen = lines[id];
  return {
    id: crypto.randomUUID(),
    characterId: id,
    evidenceIds: [evidence.id],
    reaction: chosen.reaction,
    interpretation: chosen.interpretation,`,
    `  const chosen = lines[id];
  return {
    id: crypto.randomUUID(),
    characterId: id,
    evidenceIds: [evidence.id],
    reaction: chosen.reaction,
    interpretation: chosen.interpretation(fact.text),`,
  );

  s = s.replace(
    `export function draftIndependentOpinions(evidence: VideoEvidence, speakers: CharacterId[]): CharacterOpinion[] {
  const facts = collectFacts(evidence);
  const used = new Set<string>();
  return speakers.map(id => {
    const fact = pickFact(id, facts, used);
    if (fact) used.add(fact.id);
    return opinionFromFact(id, evidence, fact ?? { id: 'fallback', kind: 'meta', text: evidence.title });
  });
}`,
    `export function draftIndependentOpinions(evidence: VideoEvidence, speakers: CharacterId[], locale: AppLocale = defaultLocale): CharacterOpinion[] {
  const facts = collectFacts(evidence);
  const used = new Set<string>();
  return speakers.map(id => {
    const fact = pickFact(id, facts, used);
    if (fact) used.add(fact.id);
    return opinionFromFact(id, evidence, fact ?? { id: 'fallback', kind: 'meta', text: evidence.title }, locale);
  });
}`,
  );

  s = s.replace(
    `export function planDiscussionTurns(opinions: CharacterOpinion[], maxTurns = 6): DiscussionTurn[] {
  const turns: DiscussionTurn[] = [];
  for (const opinion of opinions.slice(0, 3)) {
    turns.push({
      speaker: opinion.characterId,
      text: \`\${opinion.reaction} \${opinion.interpretation}\`,
      opinionId: opinion.id,
      actionHint: 'think',
      emotion: 'curious',
    });
    if (turns.length >= maxTurns) return turns;
  }
  if (opinions.length >= 2 && turns.length < maxTurns) {
    const a = opinions[0];
    const b = opinions[1];
    turns.push({
      speaker: b.characterId,
      text: \`\${byId[b.characterId].name}接一句：你刚说的「\${a.interpretation.slice(0, 42)}…」我同意要有依据；我自己抓的是另一处证据。\`,
      replyTo: a.id,
      actionHint: 'approach',
      emotion: 'happy',
    });
  }
  if (opinions.length >= 3 && turns.length < maxTurns) {
    const c = opinions[2];
    const peer = opinions[0];
    turns.push({
      speaker: c.characterId,
      text: \`补充给 \${byId[peer.characterId].name}：我不会复读同一句摘要。我的依据还是自己那条引用。\`,
      replyTo: peer.id,
      actionHint: 'wave',
      emotion: 'happy',
    });
  }
  return turns.slice(0, maxTurns);
}`,
    `export function planDiscussionTurns(opinions: CharacterOpinion[], maxTurns = 6, locale: AppLocale = defaultLocale): DiscussionTurn[] {
  const turns: DiscussionTurn[] = [];
  for (const opinion of opinions.slice(0, 3)) {
    turns.push({
      speaker: opinion.characterId,
      text: \`\${opinion.reaction} \${opinion.interpretation}\`,
      opinionId: opinion.id,
      actionHint: 'think',
      emotion: 'curious',
    });
    if (turns.length >= maxTurns) return turns;
  }
  if (opinions.length >= 2 && turns.length < maxTurns) {
    const a = opinions[0];
    const b = opinions[1];
    const snippet = a.interpretation.slice(0, 42);
    const reply =
      locale === 'en'
        ? \`\${byId[b.characterId].name} adds: about "\${snippet}…"—I agree we need receipts; I grabbed a different cite.\`
        : locale === 'ja'
          ? \`\${byId[b.characterId].name}の一言：「\${snippet}…」根拠は大事。私は別の証拠を掴んだ。\`
          : \`\${byId[b.characterId].name}接一句：你刚说的「\${snippet}…」我同意要有依据；我自己抓的是另一处证据。\`;
    turns.push({
      speaker: b.characterId,
      text: reply,
      replyTo: a.id,
      actionHint: 'approach',
      emotion: 'happy',
    });
  }
  if (opinions.length >= 3 && turns.length < maxTurns) {
    const c = opinions[2];
    const peer = opinions[0];
    const add =
      locale === 'en'
        ? \`For \${byId[peer.characterId].name}: I will not echo the same summary. My cite stays my own.\`
        : locale === 'ja'
          ? \`\${byId[peer.characterId].name}へ：同じ要約は繰り返さない。根拠は自分の引用のまま。\`
          : \`补充给 \${byId[peer.characterId].name}：我不会复读同一句摘要。我的依据还是自己那条引用。\`;
    turns.push({
      speaker: c.characterId,
      text: add,
      replyTo: peer.id,
      actionHint: 'wave',
      emotion: 'happy',
    });
  }
  return turns.slice(0, maxTurns);
}`,
  );

  s = s.replace(
    `export function assertSpeakerPool(speakers: CharacterId[]) {
  for (const id of speakers) if (!ids.includes(id)) throw new Error(\`未知角色：\${id}\`);
}`,
    `export function assertSpeakerPool(speakers: CharacterId[], locale: AppLocale = defaultLocale) {
  for (const id of speakers) if (!ids.includes(id)) throw new Error(agentCopy(locale, 'unknownChar', { id }));
}`,
  );

  fs.writeFileSync('electron/social/discussion.ts', s);
  console.log('discussion patched');
}

// --- runtime.ts ---
{
  let s = fs.readFileSync('electron/agent/runtime.ts', 'utf8');
  s = s.replace(
    `import { byId } from '../../src/shared/characters';
import { ids } from '../../src/shared/director';`,
    `import { byId } from '../../src/shared/characters';
import { ids } from '../../src/shared/director';
import type { AppLocale } from '../../src/shared/i18n';
import { defaultLocale } from '../../src/shared/i18n';
import { agentCopy } from '../../src/shared/dialogue/pack';`,
  );
  s = s.replace(
    `export interface RuntimeHooks {
  notify(ui: AgentUiState): void;
  perform(id: CharacterId, intent: { action: string; emotion?: string; bubble?: string; target?: string; duration?: number }, source?: 'local' | 'model'): string;
  say(speaker: CharacterId | 'system', text: string, kind?: 'error' | 'notice'): void;
  activeCharacters(): CharacterId[];
  mediaCacheDir: string;
}`,
    `export interface RuntimeHooks {
  notify(ui: AgentUiState): void;
  perform(id: CharacterId, intent: { action: string; emotion?: string; bubble?: string; target?: string; duration?: number }, source?: 'local' | 'model'): string;
  say(speaker: CharacterId | 'system', text: string, kind?: 'error' | 'notice'): void;
  activeCharacters(): CharacterId[];
  mediaCacheDir: string;
  locale?: () => AppLocale;
}`,
  );

  if (!s.includes('private L()')) {
    s = s.replace(
      `export class AgentRuntime {
  private tasks = new Map<TaskId, InternalTask>();
  private evidence = new Map<string, VideoEvidence>();
  private ui: AgentUiState = emptyAgentUi();
  readonly tools = new ToolRegistry();

  constructor(private hooks: RuntimeHooks) {
    this.registerDefaultTools();
  }`,
      `export class AgentRuntime {
  private tasks = new Map<TaskId, InternalTask>();
  private evidence = new Map<string, VideoEvidence>();
  private ui: AgentUiState = emptyAgentUi();
  readonly tools = new ToolRegistry();

  constructor(private hooks: RuntimeHooks) {
    this.registerDefaultTools();
  }
  private L(): AppLocale { return this.hooks.locale?.() ?? defaultLocale; }
  private a(key: string, vars?: Record<string, string | number>) { return agentCopy(this.L(), key, vars); }`,
    );
  }

  const replacements = [
    [`'导入本地短视频到隔离缓存并校验类型/大小'`, `this.a('importTool')`],
    [`summary: \`已导入「\${imported.displayName}」到本地缓存（指纹 \${imported.fingerprint}）。\``, `summary: this.a('imported', { name: imported.displayName, fp: imported.fingerprint })`],
    [`'对已导入视频生成带覆盖标注的共享证据'`, `this.a('analyzeTool')`],
    [`if (!localPath || !fs.existsSync(localPath)) throw new Error('缓存中找不到视频文件。');`, `if (!localPath || !fs.existsSync(localPath)) throw new Error(this.a('noCache'));`],
    [`summary: \`证据已生成：\${coverageLabel(evidence.coverage)}。\${evidence.limitations[0] ?? ''}\``, `summary: this.a('evidenceSummary', { cover: coverageLabel(evidence.coverage, this.L()), limit: evidence.limitations[0] ?? '' })`],
    [`'解析链接来源（P2 预留，当前诚实失败）'`, `this.a('resolveTool')`],
    [`lastMessage: '任务已领取',`, `lastMessage: this.a('claimed'),`],
    [`this.pushEvent(id, { kind: 'task_started', message: \`开始任务：\${summary.goal}\`, actor: summary.actor, actionHint: 'think', progress: 0.02 });`, `this.pushEvent(id, { kind: 'task_started', message: this.a('started', { goal: summary.goal }), actor: summary.actor, actionHint: 'think', progress: 0.02 });`],
    [`this.hooks.perform(summary.actor, { action: 'think', emotion: 'curious', bubble: '我来看看这条视频～', duration: 6 }, 'local');`, `this.hooks.perform(summary.actor, { action: 'think', emotion: 'curious', bubble: this.a('looking'), duration: 6 }, 'local');`],
    [`current.summary.error = error instanceof Error ? error.message : '任务失败';`, `current.summary.error = error instanceof Error ? error.message : this.a('failed');`],
    [`if (!task) throw new Error('任务不存在');`, `if (!task) throw new Error(this.a('missing'));`],
    [`this.pushEvent(id, { kind: 'task_cancelled', message: '任务已取消；之后到达的旧结果不会提交。', progress: task.summary.progress });`, `this.pushEvent(id, { kind: 'task_cancelled', message: this.a('cancelledLate'), progress: task.summary.progress });`],
    [`this.pushEvent(id, { kind: 'task_progress', message: '任务已暂停（轻量状态机；恢复后继续未完成步骤）。', progress: task.summary.progress });`, `this.pushEvent(id, { kind: 'task_progress', message: this.a('paused'), progress: task.summary.progress });`],
    [`this.pushEvent(id, { kind: 'task_progress', message: '任务已恢复。', progress: task.summary.progress });`, `this.pushEvent(id, { kind: 'task_progress', message: this.a('resumed'), progress: task.summary.progress });`],
    [`if (task.controller.signal.aborted) throw new Error('任务已取消');`, `if (task.controller.signal.aborted) throw new Error(this.a('cancelled'));`],
    [`if (Date.now() - task.summary.usage.startedAt > task.summary.budget.maxMs) throw new Error('任务超时预算已用尽');`, `if (Date.now() - task.summary.usage.startedAt > task.summary.budget.maxMs) throw new Error(this.a('timeout'));`],
    [`if (receipt.outcome === 'cancelled') throw new Error('任务已取消');`, `if (receipt.outcome === 'cancelled') throw new Error(this.a('cancelled'));`],
    [`else throw new Error(\`尚未实现的任务类型：\${task.request.kind}\`);`, `else throw new Error(this.a('unknownKind', { kind: task.request.kind }));`],
    [`if (!source) throw new Error('观影任务缺少视频来源');`, `if (!source) throw new Error(this.a('noSource'));`],
    [`message: '正在生成共享证据（不会假装已完整看完）…',`, `message: this.a('evidenceBusy'),`],
    [`if (!evidence) throw new Error('证据回执无效');`, `if (!evidence) throw new Error(this.a('badEvidence'));`],
    [`message: \`共享证据就绪：\${coverageLabel(evidence.coverage)}\`,`, `message: this.a('evidenceReady', { cover: coverageLabel(evidence.coverage, this.L()) }),`],
    [`message: evidence.limitations.join(' ') || \`覆盖范围：\${coverageLabel(evidence.coverage)}\`,`, `message: evidence.limitations.join(' ') || this.a('coverage', { cover: coverageLabel(evidence.coverage, this.L()) }),`],
    [`const opinions = draftIndependentOpinions(evidence, task.summary.speakers);`, `const opinions = draftIndependentOpinions(evidence, task.summary.speakers, this.L());`],
    [`message: \`\${byId[opinion.characterId].name}形成了独立观点\`,`, `message: this.a('opinionReady', { name: byId[opinion.characterId].name }),`],
    [`const turns = planDiscussionTurns(opinions, task.summary.budget.maxDiscussionTurns);`, `const turns = planDiscussionTurns(opinions, task.summary.budget.maxDiscussionTurns, this.L());`],
    [`assertSpeakerPool(speakers);`, `assertSpeakerPool(speakers, this.L());`],
  ];

  for (const [a, b] of replacements) {
    if (!s.includes(a)) console.warn('missing snippet:', a.slice(0, 60));
    else s = s.replaceAll(a, b);
  }

  // remaining Chinese completion messages
  s = s.replace(
    `this.hooks.say(
      'system',
      \`共同观影完成 · \${coverageLabel(evidence.coverage)}。推荐真实链接需要 P2 浏览检索；当前不会由模型编造 URL。\`,
      'notice',
    );`,
    `const doneCover = coverageLabel(evidence.coverage, this.L());
    const doneMsg =
      this.L() === 'en'
        ? \`Watch party done · \${doneCover}. Real recommendation links need P2 browsing; we will not invent URLs.\`
        : this.L() === 'ja'
          ? \`観影完了 · \${doneCover}。本物の推薦URLはP2閲覧が必要。モデルでURLは捏造しません。\`
          : \`共同观影完成 · \${doneCover}。推荐真实链接需要 P2 浏览检索；当前不会由模型编造 URL。\`;
    this.hooks.say('system', doneMsg, 'notice');`,
  );

  s = s.replace(
    `message: \`观影讨论结束（\${turns.length} 轮，发言 \${task.summary.speakers.map(id => byId[id].name).join('、')}）。\`,`,
    `message: (this.L() === 'en'
        ? \`Watch discussion finished (\${turns.length} turns; speakers \${task.summary.speakers.map(id => byId[id].name).join(', ')}).\`
        : this.L() === 'ja'
          ? \`観影トーク終了（\${turns.length}ターン、発言 \${task.summary.speakers.map(id => byId[id].name).join('、')}）。\`
          : \`观影讨论结束（\${turns.length} 轮，发言 \${task.summary.speakers.map(id => byId[id].name).join('、')}）。\`),`,
  );

  s = s.replace(
    `this.hooks.perform(listener, { action: 'shy', emotion: 'shy', bubble: '我先听着…', duration: 5 }, 'local');`,
    `this.hooks.perform(listener, { action: 'shy', emotion: 'shy', bubble: this.L()==='en'?'I’ll listen…':this.L()==='ja'?'まずは聞いてる…':'我先听着…', duration: 5 }, 'local');`,
  );
  s = s.replace(
    `this.hooks.perform(task.summary.actor, { action: 'wave', emotion: 'happy', bubble: '看完啦，依据都在证据里～', duration: 6 }, 'local');`,
    `this.hooks.perform(task.summary.actor, { action: 'wave', emotion: 'happy', bubble: this.L()==='en'?'Done—receipts are in the evidence~':this.L()==='ja'?'見終わった、根拠は証拠の中～':'看完啦，依据都在证据里～', duration: 6 }, 'local');`,
  );

  // fix aborted throws that appear multiple times - replaceAll already done for exact match
  s = s.replaceAll(`throw new Error('任务已取消')`, `throw new Error(this.a('cancelled'))`);

  fs.writeFileSync('electron/agent/runtime.ts', s);
  console.log('runtime patched');
}
