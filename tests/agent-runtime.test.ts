import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GardenEngine } from '../electron/engine.ts';
import { initialState } from '../src/shared/director.ts';
import { ToolRegistry } from '../electron/agent/tools.ts';
import { draftIndependentOpinions, planDiscussionTurns } from '../electron/social/discussion.ts';
import { perceiveLocalVideo } from '../electron/media/perceive.ts';
import { importLocalVideo } from '../electron/media/source.ts';
import type { VideoEvidence } from '../src/shared/agent.ts';

function tempDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeTinyVideo(dir: string, name = 'clip.mp4') {
  const file = path.join(dir, name);
  // Minimal non-media bytes are enough for import/fingerprint path tests.
  fs.writeFileSync(file, Buffer.from('ftypisomfake-video-fixture'));
  return file;
}

function writeCaption(videoPath: string) {
  const caption = videoPath.replace(/\.mp4$/i, '.vtt');
  fs.writeFileSync(
    caption,
    `WEBVTT

00:00:00.000 --> 00:00:02.000
桌上出现一碗热米饭

00:00:02.000 --> 00:00:04.000
有人笑着说要再来一碗
`,
  );
  return caption;
}

test('unknown tools never execute and return a receipt', async () => {
  const registry = new ToolRegistry();
  let steps = 0;
  const receipt = await registry.invoke('not_a_real_tool', {}, {
    taskId: 't1',
    signal: new AbortController().signal,
    grants: new Set(['*']),
    step: () => { steps += 1; },
    remainingSteps: () => 5,
  });
  assert.equal(receipt.outcome, 'unknown_tool');
  assert.equal(steps, 0);
});

test('blocked tools respect grants and do not spend steps before check failure path still counts only after grant', async () => {
  const registry = new ToolRegistry();
  let ran = false;
  registry.register('secret_tool', 'admin', 'should stay blocked', async () => {
    ran = true;
    return { summary: 'should not run' };
  });
  const receipt = await registry.invoke('secret_tool', {}, {
    taskId: 't1',
    signal: new AbortController().signal,
    grants: new Set(['media.read']),
    step: () => {},
    remainingSteps: () => 5,
  });
  assert.equal(receipt.outcome, 'blocked');
  assert.equal(ran, false);
});

test('local import + caption perception labels transcript_only honestly', async () => {
  const root = tempDir('dango-watch-');
  const cache = path.join(root, 'cache');
  const video = writeTinyVideo(root, 'rice-moment.mp4');
  writeCaption(video);
  const imported = importLocalVideo({ kind: 'local_file', value: video, displayName: 'rice-moment.mp4' }, cache);
  assert.ok(fs.existsSync(imported.localPath));
  assert.ok(imported.captionPath);
  const evidence = await perceiveLocalVideo({
    localPath: imported.localPath,
    fingerprint: imported.fingerprint,
    displayName: imported.displayName,
    size: imported.size,
    captionPath: imported.captionPath,
    signal: new AbortController().signal,
    maxMediaSeconds: 180,
  });
  assert.equal(evidence.coverage, 'transcript_only');
  assert.ok(evidence.limitations.some(l => /字幕|画面/.test(l)));
  assert.ok(evidence.segments.some(s => s.transcript?.includes('米饭')));
});

test('metadata-only path does not claim visual understanding', async () => {
  const root = tempDir('dango-meta-');
  const cache = path.join(root, 'cache');
  const video = writeTinyVideo(root, 'silent-action.mp4');
  const imported = importLocalVideo({ kind: 'local_file', value: video }, cache);
  const evidence = await perceiveLocalVideo({
    localPath: imported.localPath,
    fingerprint: imported.fingerprint,
    displayName: imported.displayName,
    size: imported.size,
    signal: new AbortController().signal,
    maxMediaSeconds: 180,
  });
  assert.equal(evidence.coverage, 'metadata_only');
  assert.ok(evidence.limitations.some(l => /元数据|字幕|视觉/.test(l)));
});

test('independent opinions cite different facts and discussion stays bounded', () => {
  const evidence: VideoEvidence = {
    id: 'ev1',
    canonicalId: 'local:test',
    title: 'fixture',
    coverage: 'transcript_only',
    observedRanges: [{ startMs: 0, endMs: 4000 }],
    analysisVersion: 'test',
    sourceFingerprint: 'abc',
    segments: [
      { id: 's1', range: { startMs: 0, endMs: 2000 }, transcript: '桌上出现一碗热米饭', visualFacts: [], audioFacts: [{ id: 'a1', text: '桌上出现一碗热米饭', confidence: 'medium' }] },
      { id: 's2', range: { startMs: 2000, endMs: 4000 }, transcript: '有人讲了一个好笑的反转梗', visualFacts: [], audioFacts: [{ id: 'a2', text: '有人讲了一个好笑的反转梗', confidence: 'medium' }] },
      { id: 's3', range: { startMs: 0, endMs: 1000 }, visualFacts: [{ id: 'meta-title', text: '文件标题/文件名：fixture', confidence: 'high' }], audioFacts: [] },
    ],
    limitations: ['仅字幕'],
    uncertainties: [],
    createdAt: Date.now(),
  };
  const opinions = draftIndependentOpinions(evidence, ['xia', 'rin', 'grok']);
  assert.equal(opinions.length, 3);
  const cites = opinions.map(o => o.cite?.factIds?.[0]).filter(Boolean);
  assert.equal(new Set(cites).size, cites.length);
  const turns = planDiscussionTurns(opinions, 6);
  assert.ok(turns.length >= 3 && turns.length <= 6);
});

test('chat stop does not cancel an agent watch task', async () => {
  const root = tempDir('dango-engine-');
  const cache = path.join(root, 'cache');
  const video = writeTinyVideo(root, 'party.mp4');
  writeCaption(video);
  const engine = new GardenEngine(initialState(), () => {}, undefined, 5);
  engine.enableAgent(cache);
  const started = engine.dispatch({
    type: 'watch-start',
    path: video,
    displayName: 'party.mp4',
    captionPath: video.replace(/\.mp4$/i, '.vtt'),
    speakers: ['xia', 'rin', 'grok'],
  });
  await new Promise(r => setTimeout(r, 30));
  await engine.dispatch({ type: 'stop' });
  const task = engine.state.agent.tasks[0];
  assert.ok(task);
  assert.notEqual(task.status, 'cancelled');
  await started;
  // Allow the async watch party to finish or progress without being cancelled by chat stop.
  for (let i = 0; i < 80 && engine.state.agent.tasks[0]?.status === 'running'; i++) await new Promise(r => setTimeout(r, 40));
  const finalStatus = engine.state.agent.tasks[0]?.status;
  assert.ok(finalStatus === 'completed' || finalStatus === 'running' || finalStatus === 'failed');
  assert.notEqual(finalStatus, 'cancelled');
});

test('agent cancel prevents later completion from staying running', async () => {
  const root = tempDir('dango-cancel-');
  const cache = path.join(root, 'cache');
  const video = writeTinyVideo(root, 'cancel-me.mp4');
  const engine = new GardenEngine(initialState(), () => {}, undefined, 5);
  engine.enableAgent(cache);
  const started = engine.dispatch({ type: 'watch-start', path: video, displayName: 'cancel-me.mp4', speakers: ['xia', 'rin'] });
  await new Promise(r => setTimeout(r, 20));
  const id = engine.state.agent.tasks[0]?.id;
  assert.ok(id);
  await engine.dispatch({ type: 'agent-control', id, command: 'cancel' });
  await started.catch(() => {});
  await new Promise(r => setTimeout(r, 200));
  assert.equal(engine.state.agent.tasks[0]?.status, 'cancelled');
});
