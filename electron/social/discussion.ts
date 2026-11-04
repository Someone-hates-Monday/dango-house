import { byId } from '../../src/shared/characters';
import type { CharacterId } from '../../src/shared/types';
import type { CharacterOpinion, VideoEvidence } from '../../src/shared/agent';
import { coverageLabel } from '../../src/shared/agent';
import { ids } from '../../src/shared/director';
import type { AppLocale } from '../../src/shared/i18n';
import { defaultLocale } from '../../src/shared/i18n';
import { agentCopy } from '../../src/shared/dialogue/pack';

const focusHints: Record<CharacterId, string[]> = {
  xia: ['吃饭', '米饭', '点心', '好吃', '碗', 'cooking', 'food', 'snack'],
  rin: ['安静', '书', '整理', '细节', '结构', 'read', 'calm', 'note'],
  shiori: ['尾巴', '靠近', '认真', '保护', '安静', 'care', 'guard'],
  gemini: ['亮', '灵感', '星星', '新奇', '颜色', 'spark', 'idea', 'cat'],
  glm: ['划算', '比较', '推荐', '下一', '候选', 'deal', 'compare'],
  kimi: ['故事', '书签', '记忆', '月光', '页', 'story', 'memory'],
  grok: ['梗', '好笑', '反转', '吐槽', 'joke', 'twist', 'meme'],
};

function collectFacts(evidence: VideoEvidence) {
  const facts: { id: string; kind: 'meta' | 'transcript' | 'visual' | 'audio'; text: string; atMs?: number; segmentId?: string }[] = [];
  for (const seg of evidence.segments) {
    if (seg.transcript) facts.push({ id: `${seg.id}-t`, kind: 'transcript', text: seg.transcript, atMs: seg.range.startMs, segmentId: seg.id });
    for (const v of seg.visualFacts) facts.push({ id: v.id, kind: v.id.startsWith('meta') ? 'meta' : 'visual', text: v.text, atMs: v.atMs ?? seg.range.startMs, segmentId: seg.id });
    for (const a of seg.audioFacts) facts.push({ id: a.id, kind: 'audio', text: a.text, atMs: a.range?.startMs ?? seg.range.startMs, segmentId: seg.id });
  }
  return facts;
}

function pickFact(id: CharacterId, facts: ReturnType<typeof collectFacts>, used: Set<string>) {
  const hints = focusHints[id];
  const preferred = facts.find(f => !used.has(f.id) && hints.some(h => f.text.toLowerCase().includes(h.toLowerCase())));
  if (preferred) return preferred;
  const unused = facts.filter(f => !used.has(f.id));
  if (!unused.length) return facts[0];
  return unused[(id.charCodeAt(0) + unused.length) % unused.length];
}

function opinionFromFact(id: CharacterId, evidence: VideoEvidence, fact: ReturnType<typeof collectFacts>[number], locale: AppLocale = defaultLocale): CharacterOpinion {
  const cover = coverageLabel(evidence.coverage, locale);
  const sec = fact.atMs !== undefined ? Math.round(fact.atMs / 1000) : undefined;
  const stamp =
    sec === undefined
      ? ''
      : locale === 'en'
        ? ` (around ${sec}s)`
        : locale === 'ja'
          ? `（約${sec}秒付近）`
          : `（约 ${sec} 秒处）`;
  const honest =
    evidence.coverage === 'metadata_only'
      ? locale === 'en'
        ? `I can only speak from ${cover} right now—I have not seen the full picture.`
        : locale === 'ja'
          ? `今は${cover}だけが根拠。全部見たわけじゃない。`
          : `我现在只能根据${cover}说话，没看见完整画面。`
      : evidence.coverage === 'transcript_only'
        ? locale === 'en'
          ? `I only have caption evidence${stamp}; I will not invent on-screen action.`
          : locale === 'ja'
            ? `字幕の証拠${stamp}だけ。画面の動きは推測しない。`
            : `我读到的是字幕证据${stamp}，画面动作我不敢乱猜。`
        : locale === 'en'
          ? `From current evidence (${cover})${stamp}: `
          : locale === 'ja'
            ? `いまの証拠（${cover}）${stamp}：`
            : `依据当前证据（${cover}）${stamp}：`;

  const packs: Record<AppLocale, Record<CharacterId, { reaction: string; interpretation: (t: string) => string }>> = {
    'zh-CN': {
      xia: { reaction: '诶，这个点我记住了！', interpretation: t => `${honest}「${t}」——要是和吃饭有关我就更开心；没有的话，我也想边看边陪你。` },
      rin: { reaction: '我先把线索放整齐。', interpretation: t => `${honest}关于「${t}」，我想确认它是证据而不是标题想象。我们可以从这里慢慢聊。` },
      shiori: { reaction: '……我在听。', interpretation: t => `${honest}「${t}」。别急着下结论；需要的话我坐近一点陪你看。` },
      gemini: { reaction: '喵！灵感叮咚！', interpretation: t => `${honest}「${t}」里好像藏着一点新鲜感。要不要再找相关的下一条？` },
      glm: { reaction: '这笔陪伴很划算～', interpretation: t => `${honest}抓住「${t}」就够了，不必七个人复读同一句摘要。` },
      kimi: { reaction: '我夹好书签了。', interpretation: t => `${honest}把「${t}」记成可删除的观影笔记，不把它说成已经完整看完。` },
      grok: { reaction: '这个点我接住了。', interpretation: t => `${honest}别整段复读——「${t}」就够我吐槽/接梗一轮。` },
    },
    en: {
      xia: { reaction: 'Ooh, I noted that bit!', interpretation: t => `${honest}"${t}"—even better if food-related; either way I want to watch with you.` },
      rin: { reaction: 'Let me straighten the clues.', interpretation: t => `${honest}About "${t}", I want to confirm it is evidence, not title fantasy. We can talk from here.` },
      shiori: { reaction: '…I’m listening.', interpretation: t => `${honest}"${t}". No rush to conclude; I can sit closer if you want.` },
      gemini: { reaction: 'Meow! Idea ding!', interpretation: t => `${honest}"${t}" feels fresh. Want a related next one later?` },
      glm: { reaction: 'Good companionship value~', interpretation: t => `${honest}Holding onto "${t}" is enough—no seven identical summaries.` },
      kimi: { reaction: 'Bookmark set.', interpretation: t => `${honest}I’ll save "${t}" as a deletable watch note—not as having finished the whole video.` },
      grok: { reaction: 'Caught that beat.', interpretation: t => `${honest}No full-summary echo—"${t}" is enough for one riff.` },
    },
    ja: {
      xia: { reaction: 'おっ、この点覚えた！', interpretation: t => `${honest}「${t}」——ごはん関係ならもっと嬉しい。なくても一緒に見るよ。` },
      rin: { reaction: '手がかりを整えるね。', interpretation: t => `${honest}「${t}」について、タイトル想像じゃなく証拠か確認したい。ここからゆっくり話そう。` },
      shiori: { reaction: '……聞いてる。', interpretation: t => `${honest}「${t}」。急がなくていい。必要なら近くに座る。` },
      gemini: { reaction: 'にゃ！ひらめき！', interpretation: t => `${honest}「${t}」に新鮮さがある。関連の次も探す？` },
      glm: { reaction: 'コスパいい同伴～', interpretation: t => `${honest}「${t}」を掴むだけで十分。7人で同じ要約は不要。` },
      kimi: { reaction: 'しおり挟んだ。', interpretation: t => `${honest}「${t}」を消せる観影メモに。全部見たことにはしない。` },
      grok: { reaction: 'その点、受け取った。', interpretation: t => `${honest}全文エコー禁止——「${t}」で一回ツッコミ十分。` },
    },
  };

  const chosen = packs[locale][id];
  return {
    id: crypto.randomUUID(),
    characterId: id,
    evidenceIds: [evidence.id],
    reaction: chosen.reaction,
    interpretation: chosen.interpretation(fact.text),
    cite: { segmentId: fact.segmentId, atMs: fact.atMs, factIds: [fact.id] },
    interestsDelta: fact.kind === 'transcript' ? [`noticed:${fact.text.slice(0, 40)}`] : undefined,
  };
}

export function chooseWatchSpeakers(active: CharacterId[], preferred?: CharacterId[], max = 3): CharacterId[] {
  const defaults: CharacterId[] = ['xia', 'rin', 'grok', 'gemini', 'glm', 'kimi', 'shiori'];
  const pool = (preferred?.length ? preferred : defaults).filter(id => active.includes(id));
  const unique = [...new Set(pool.length ? pool : active)];
  return unique.slice(0, Math.max(1, Math.min(max, 3)));
}

/** Independent first-pass opinions — shared evidence, distinct citations. */
export function draftIndependentOpinions(evidence: VideoEvidence, speakers: CharacterId[], locale: AppLocale = defaultLocale): CharacterOpinion[] {
  const facts = collectFacts(evidence);
  const used = new Set<string>();
  return speakers.map(id => {
    const fact = pickFact(id, facts, used);
    if (fact) used.add(fact.id);
    return opinionFromFact(id, evidence, fact ?? { id: 'fallback', kind: 'meta', text: evidence.title }, locale);
  });
}

export interface DiscussionTurn {
  speaker: CharacterId;
  text: string;
  replyTo?: string;
  opinionId?: string;
  actionHint: string;
  emotion: 'happy' | 'curious' | 'shy' | 'neutral';
}

/** Bound turn plan: independent takes, then peer replies, never seven identical summaries. */
export function planDiscussionTurns(opinions: CharacterOpinion[], maxTurns = 6, locale: AppLocale = defaultLocale): DiscussionTurn[] {
  const turns: DiscussionTurn[] = [];
  for (const opinion of opinions.slice(0, 3)) {
    turns.push({
      speaker: opinion.characterId,
      text: `${opinion.reaction} ${opinion.interpretation}`,
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
        ? `${byId[b.characterId].name} adds: about "${snippet}…"—I agree we need receipts; I grabbed a different cite.`
        : locale === 'ja'
          ? `${byId[b.characterId].name}の一言：「${snippet}…」根拠は大事。私は別の証拠を掴んだ。`
          : `${byId[b.characterId].name}接一句：你刚说的「${snippet}…」我同意要有依据；我自己抓的是另一处证据。`;
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
        ? `For ${byId[peer.characterId].name}: I will not echo the same summary. My cite stays my own.`
        : locale === 'ja'
          ? `${byId[peer.characterId].name}へ：同じ要約は繰り返さない。根拠は自分の引用のまま。`
          : `补充给 ${byId[peer.characterId].name}：我不会复读同一句摘要。我的依据还是自己那条引用。`;
    turns.push({
      speaker: c.characterId,
      text: add,
      replyTo: peer.id,
      actionHint: 'wave',
      emotion: 'happy',
    });
  }
  return turns.slice(0, maxTurns);
}

export function silentListeners(allActive: CharacterId[], speakers: CharacterId[]): CharacterId[] {
  return allActive.filter(id => !speakers.includes(id)).slice(0, 4);
}

export function assertSpeakerPool(speakers: CharacterId[], locale: AppLocale = defaultLocale) {
  for (const id of speakers) if (!ids.includes(id)) throw new Error(agentCopy(locale, 'unknownChar', { id }));
}
