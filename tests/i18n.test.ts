import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogKeys, translate, locales, defaultLocale } from '../src/shared/i18n/index.ts';
import { initialState, restoreState } from '../src/shared/director.ts';

test('zh-CN, en, and ja catalogs expose the same keys', () => {
  const zh = new Set(catalogKeys('zh-CN'));
  const en = new Set(catalogKeys('en'));
  const ja = new Set(catalogKeys('ja'));
  assert.deepEqual([...en].sort(), [...zh].sort());
  assert.deepEqual([...ja].sort(), [...zh].sort());
  assert.ok(zh.size > 80);
});

test('translate interpolates variables and falls back to zh-CN', () => {
  assert.match(translate('en', 'chat.praise', { name: 'Claude' }), /Claude/);
  assert.match(translate('ja', 'chat.praise', { name: 'Claude' }), /Claude/);
  assert.equal(translate('en', 'does.not.exist.anywhere'), 'does.not.exist.anywhere');
});

test('locale list covers three selectable languages', () => {
  assert.deepEqual(locales.map(l => l.id), ['zh-CN', 'en', 'ja']);
  assert.equal(defaultLocale, 'zh-CN');
});

test('settings locale restores and defaults to zh-CN', () => {
  const fresh = initialState();
  assert.equal(fresh.settings.locale, 'zh-CN');
  const saved = initialState();
  saved.settings.locale = 'ja';
  assert.equal(restoreState(saved).settings.locale, 'ja');
  assert.equal(restoreState({ version: 1, settings: { locale: 'nope' } }).settings.locale, 'zh-CN');
});
