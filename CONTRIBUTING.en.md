# Contributing

**Language / 语言 / 言語:** [简体中文](CONTRIBUTING.zh-CN.md) · [English](CONTRIBUTING.en.md) · [日本語](CONTRIBUTING.ja.md)

Thank you for helping Dango House. Issues and PRs in Chinese, English, or Japanese are welcome.

## Before you start

Check existing issues. Small fixes can go straight to a PR; discuss new dependencies, persistence formats, provider protocols, or major features first. Never submit keys, private chats, accounts, user databases, or unredacted screenshots.

Windows x64 / Node.js 22.15+. Run `npm.cmd ci`, `npm.cmd run dev`; run `npm.cmd test` and `npm.cmd run build` before submitting. Window, Dock, IPC, and animation changes also need relevant desktop checks.

Use isolated desktop profiles. Mock protocol responses; live API checks require explicit opt-in with quota costs explained.

## Code conventions

- Clarity first; TypeScript; follow nearby style.
- Keep `src/shared` pure; Electron owns IPC/state; React owns presentation.
- Preserve context isolation, sandbox, cancellation, and redacted errors.
- Focused PRs with triggers, results, and validation.
- Keep accessibility labels and keyboard access.

## Animation, assets & stories

Check structure, foot contact, loops, and recovery. Play narrative reactions forward. Document creators, tools, terms, and hashes. Code is MIT; art and persona adaptations keep their own terms. Disclose AI assistance.

Stories should stay warm and playful. Rivalry is gentle banter, never humiliation.

## Non-code contributions

Welcome: animation polish, licensed art leads, UI translations (catalogs in `src/shared/i18n/`), bug reports, short scenes, and desktop smoke testing notes.

## Language of docs

Ship docs as **separate zh-CN / en / ja pages** with a language bar—not three languages stacked in one file. The in-app UI language is chosen under Connections & Preferences.
