import fs from 'node:fs';

function hub(name) {
  return `# ${name}

**Language / 语言 / 言語:** [简体中文](${name}.zh-CN.md) · [English](${name}.en.md) · [日本語](${name}.ja.md)
`;
}

const planZh = fs.readFileSync('docs/AGENT-WATCH-PARTY-PLAN.md', 'utf8');
const refsZh = fs.readFileSync('docs/AGENT-REFERENCES.md', 'utf8');

fs.writeFileSync('docs/AGENT-WATCH-PARTY-PLAN.md', hub('AGENT-WATCH-PARTY-PLAN'));
fs.writeFileSync('docs/AGENT-REFERENCES.md', hub('AGENT-REFERENCES'));

fs.writeFileSync(
  'docs/AGENT-WATCH-PARTY-PLAN.zh-CN.md',
  planZh.replace(
    /^# .+/,
    '# 从桌宠到会逛会看的伙伴\n\n**Language / 语言 / 言語:** [简体中文](AGENT-WATCH-PARTY-PLAN.zh-CN.md) · [English](AGENT-WATCH-PARTY-PLAN.en.md) · [日本語](AGENT-WATCH-PARTY-PLAN.ja.md)',
  ),
);

fs.writeFileSync(
  'docs/AGENT-REFERENCES.zh-CN.md',
  refsZh.replace(
    /^# .+/,
    '# Agent、浏览与视频参考索引\n\n**Language / 语言 / 言語:** [简体中文](AGENT-REFERENCES.zh-CN.md) · [English](AGENT-REFERENCES.en.md) · [日本語](AGENT-REFERENCES.ja.md)',
  ),
);

fs.writeFileSync(
  'docs/AGENT-WATCH-PARTY-PLAN.en.md',
  `# From desktop pets to browsing companions

**Language / 语言 / 言語:** [简体中文](AGENT-WATCH-PARTY-PLAN.zh-CN.md) · [English](AGENT-WATCH-PARTY-PLAN.en.md) · [日本語](AGENT-WATCH-PARTY-PLAN.ja.md)

Research and code review: 2026-11-01. **Proposal plus an in-progress P0/P1 scaffold** (local import, task runtime, honest evidence labels, offline watch discussion). Browsing discovery, vision/native video understanding, verified recommendation URLs, and live co-watching are still unimplemented. Handoff: [HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md). Reference catalog: [AGENT-REFERENCES.md](AGENT-REFERENCES.md).

## Recommendation

Start with a short-video watch party: a user supplies a link/file, one perception module analyzes it, two or three characters discuss it, then recommend a verified next video. Build cancellation, recovery, and budget controls underneath; add autonomous browsing and live co-watching afterward.

Preferred stack: retain Electron/TypeScript; Playwright for visible browser actions; SQLite for tasks/evidence/preferences; FFmpeg for media; either Gemini's native video interface or captions/ASR plus sampled frames and a vision model; existing text providers for character dialogue; LangGraph.js for resumable workflows (or keep the lightweight state machine until proven).

## Three experiences

1. **Task agents** — one operator per browser tab; characters volunteer, director picks; failures surface honestly.
2. **Browsing outings** — start with explicit tasks; later opt-in outings with budgets; Dock shows expandable bubbles only.
3. **Watch parties** — offline/local first (P0/P1 done scaffold), then live spoiler-safe co-watching; never invent recommendation URLs.

## Acceptance (P0/P1)

- Import local short video into isolated cache
- Shared evidence with honest coverage labels
- 2–3 speakers with distinct cites; chat Stop does not cancel agent tasks
- Pause/resume/cancel via task tray

## Deferred

Vision/native video, Playwright discovery, LangGraph.js adoption decision, live co-watching, real next-URL recommendations.

The Chinese page keeps the full original research write-up.
`,
);

fs.writeFileSync(
  'docs/AGENT-WATCH-PARTY-PLAN.ja.md',
  `# デスクトップペットから「見て・巡る」仲間へ

**Language / 语言 / 言語:** [简体中文](AGENT-WATCH-PARTY-PLAN.zh-CN.md) · [English](AGENT-WATCH-PARTY-PLAN.en.md) · [日本語](AGENT-WATCH-PARTY-PLAN.ja.md)

調査日：2026-11-01。**提案＋P0/P1 足場**（ローカル取り込み、タスク実行、正直な証拠ラベル、オフライン観影トーク）。閲覧で探す・視覚/ネイティブ動画理解・実在推薦URL・リアルタイム同伴は未実装。引き継ぎは [HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md)。参考一覧は [AGENT-REFERENCES.md](AGENT-REFERENCES.md)。

## 方針

短尺の「いっしょに見る」を先に：リンク/ローカル → 理解 → 2〜3人が根拠つきで話す → 検証済みの次本。取消・再開・予算の Agent 基盤を同時に。

推奨スタック：Electron/TS、Playwright、SQLite、FFmpeg、Gemini ネイティブ動画または字幕/ASR+抽帧+視覚、既存テキスト接続、必要なら LangGraph.js（当面は軽量ステートマシン可）。

## 受け入れ（P0/P1）

隔離キャッシュへのローカル短尺取り込み、カバー注釈つき共有証拠、2〜3人の独立引用、チャット停止は Agent を止めない、タスクトレイで pause/resume/cancel。

詳細な原文は中国語ページを参照。
`,
);

fs.writeFileSync(
  'docs/AGENT-REFERENCES.en.md',
  `# Agent, browser & video references

**Language / 语言 / 言語:** [简体中文](AGENT-REFERENCES.zh-CN.md) · [English](AGENT-REFERENCES.en.md) · [日本語](AGENT-REFERENCES.ja.md)

Checked 2026-11-01: **29 GitHub projects** plus official video documentation. Priorities are project-specific judgments, not completed integration. Pin and recheck releases, terms, and dependencies before use. Architecture: [AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md).

## Reading order

Prefer 1, 6, 12, 15–19 first; then character UX 21–23; evaluate realtime/experimental options later.

## Highlights

- **Browsers:** Playwright (preferred foundation), Playwright MCP, Stagehand, Browser Use, Firecrawl
- **Orchestration:** LangGraph.js (preferred candidate), Mastra, MCP TypeScript SDK, Vercel AI SDK
- **Video / media:** FFmpeg, Whisper / ASR options, Gemini native video docs, frame-sampling + vision patterns
- **UX references:** CrossPet-adjacent community pets and watch-together patterns (see Chinese page for numbered list with licenses)

The Chinese page keeps the full numbered catalog with upstream links and selection notes.
`,
);

fs.writeFileSync(
  'docs/AGENT-REFERENCES.ja.md',
  `# Agent・閲覧・動画の参考索引

**Language / 语言 / 言語:** [简体中文](AGENT-REFERENCES.zh-CN.md) · [English](AGENT-REFERENCES.en.md) · [日本語](AGENT-REFERENCES.ja.md)

確認日：2026-11-01。**GitHub 29 件**＋公式動画ドキュメント。優先/候補は本プロジェクトの判断であり、統合完了や負荷試験の結果ではない。採用時は release/commit を固定し直し、依存とモデル条項を再確認。構成は [AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md)。

## 読む順

まず 1・6・12・15–19、次に 21–23 の体験、その後リアルタイム/実験系。番号付きの全文は中国語ページ。

## 要約

- ブラウザ：Playwright（基盤候補）、MCP、Stagehand、Browser Use、Firecrawl
- オーケストレーション：LangGraph.js、Mastra、MCP SDK、Vercel AI SDK
- 動画：FFmpeg、ASR、Gemini ネイティブ動画、抽帧＋視覚
`,
);

// docs README: point to language hubs without stacking bodies
let docsReadme = fs.readFileSync('docs/README.md', 'utf8');
if (!docsReadme.includes('Language hubs')) {
  docsReadme = docsReadme.replace(
    '## 当前入口 / Current guides',
    '## Language hubs\n\nPick one language per document (do not stack zh/en/ja in one page). Root README / CONTRIBUTING / COC / ROADMAP / PRIVACY / SECURITY and Agent plan/refs follow this pattern.\n\n## 当前入口 / Current guides',
  );
  fs.writeFileSync('docs/README.md', docsReadme);
}

console.log('agent docs split');
