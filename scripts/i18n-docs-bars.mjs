import fs from 'node:fs';

function bar(zh, en, ja, hub) {
  return `**Language / 语言 / 言語:** [简体中文](${zh}) · [English](${en}) · [日本語](${ja}) · [Index](${hub})\n\n`;
}

const files = [
  ['CONTRIBUTING.zh-CN.md', ['CONTRIBUTING.zh-CN.md', 'CONTRIBUTING.en.md', 'CONTRIBUTING.ja.md', 'CONTRIBUTING.md']],
  ['CODE_OF_CONDUCT.zh-CN.md', ['CODE_OF_CONDUCT.zh-CN.md', 'CODE_OF_CONDUCT.en.md', 'CODE_OF_CONDUCT.ja.md', 'CODE_OF_CONDUCT.md']],
  ['docs/ROADMAP.zh-CN.md', ['ROADMAP.zh-CN.md', 'ROADMAP.en.md', 'ROADMAP.ja.md', 'ROADMAP.md']],
  ['docs/PRIVACY.zh-CN.md', ['PRIVACY.zh-CN.md', 'PRIVACY.en.md', 'PRIVACY.ja.md', 'PRIVACY.md']],
  ['docs/HANDOFF-AGENT-P0P1.zh-CN.md', ['HANDOFF-AGENT-P0P1.zh-CN.md', 'HANDOFF-AGENT-P0P1.en.md', 'HANDOFF-AGENT-P0P1.ja.md', 'HANDOFF-AGENT-P0P1.md']],
];

for (const [file, links] of files) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('**Language')) text = bar(...links) + text;
  fs.writeFileSync(file, text);
  console.log('ok', file);
}
