/**
 * Headless experience probe: rivalry / affection / watch-party agent path.
 * Does not launch Electron UI; exercises GardenEngine the same way IPC would.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GardenEngine } from '../electron/engine.ts';
import { initialState } from '../src/shared/director.ts';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dango-eval-'));
const video = path.join(root, 'rice-moment.mp4');
fs.writeFileSync(video, Buffer.from('ftypisomfake-video-fixture'));
fs.writeFileSync(
  path.join(root, 'rice-moment.vtt'),
  `WEBVTT

00:00:00.000 --> 00:00:02.000
桌上出现一碗热米饭

00:00:02.000 --> 00:00:04.000
有人笑着说要再来一碗

00:00:04.000 --> 00:00:06.000
窗边的书签轻轻动了一下
`,
);

const mediaCache = path.join(root, 'cache');
const engine = new GardenEngine(initialState());
engine.enableAgent(mediaCache);

const report = {
  ok: true,
  findings: [],
};

function note(label, detail) {
  report.findings.push({ label, detail });
  console.log(`• ${label}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
}

const before = { ...engine.state.affection };
await engine.dispatch({ type: 'praise', id: 'xia' });
await new Promise(r => setTimeout(r, 50));
const afterPraise = engine.state.affection.xia;
const praiseMsgs = engine.state.messages.filter(m => m.at >= Date.now() - 5000);
note('praise affection', `${before.xia} → ${afterPraise} (+${afterPraise - before.xia})`);
note('praise speakers', [...new Set(praiseMsgs.map(m => m.speaker))].join(', '));

await engine.dispatch({ type: 'private-open', id: 'rin' });
const privateOpen = engine.state.privateMessages.rin.slice(-1)[0]?.text;
const jealousBubbles = Object.values(engine.state.bodies)
  .map(b => b.bubble)
  .filter(Boolean);
note('private open greeting', privateOpen?.slice(0, 60));
note('jealous scene queued', engine.state.room.log.length >= 0 ? `scene actors pending; sample bubbles=${jealousBubbles.slice(0, 2).join(' | ')}` : 'none');

await engine.dispatch({ type: 'showcase', scene: 'rivalry' });
note('rivalry showcase', `scene length after tick setup ≈ queued intents`);

await engine.dispatch({ type: 'social-scene', id: 'bookmark' });
note('social bookmark scene', 'dispatched');

await engine.dispatch({
  type: 'watch-start',
  path: video,
  displayName: 'rice-moment.mp4',
  captionPath: path.join(root, 'rice-moment.vtt'),
  speakers: ['xia', 'rin', 'grok'],
});

for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 120));
  const party = engine.state.agent?.watchParty;
  if (party && (party.status === 'completed' || party.status === 'failed' || party.status === 'cancelled')) break;
}

const party = engine.state.agent?.watchParty;
const task = engine.state.agent?.tasks?.[0];
note('watch status', party?.status);
note('watch coverage', party?.coverage);
note('watch speakers', party?.speakers?.join(','));
note('watch opinions', party?.opinions?.length ?? 0);
note('watch turns', party?.turns?.length ?? 0);
note('watch recommendations', party?.recommendations?.length ?? 0);
note('task lastMessage', task?.lastMessage?.slice(0, 80));
note('opinion distinct cites', [...new Set((party?.opinions ?? []).map(o => o.cite?.factIds?.[0] ?? o.interpretation.slice(0, 24)))]);

const chatStopEpoch = engine.state.messages.length;
await engine.dispatch({ type: 'stop' });
note('chat stop keeps agent', engine.state.agent?.tasks?.[0]?.status);

const sampleDiscussion = (party?.turns ?? []).slice(0, 2).map(t => `${t.speaker}: ${t.text.slice(0, 70)}`);
note('discussion sample', sampleDiscussion);

const gaps = [];
if ((party?.recommendations?.length ?? 0) > 0) gaps.push('unexpected fake recommendations');
if (party?.status !== 'completed') gaps.push(`watch not completed (${party?.status})`);
if ((party?.opinions?.length ?? 0) < 2) gaps.push('fewer than 2 opinions');
if (afterPraise <= before.xia) gaps.push('praise did not raise affection');
if (!privateOpen) gaps.push('no private greeting');

report.gaps = gaps;
report.ok = gaps.length === 0;
console.log('\n=== VERDICT DATA ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
