import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type {
  AudioFact,
  EvidenceSegment,
  ObservationCoverage,
  TimeRange,
  VideoEvidence,
  VisualFact,
} from '../../src/shared/agent';

const ANALYSIS_VERSION = 'watch-party-p1.0';

export interface PerceiveInput {
  localPath: string;
  fingerprint: string;
  displayName: string;
  size: number;
  captionPath?: string;
  signal: AbortSignal;
  maxMediaSeconds: number;
}

function parseSrtOrVtt(raw: string): { range: TimeRange; text: string }[] {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const blocks = normalized.includes('WEBVTT')
    ? normalized.split(/\n\n+/).filter(b => /\d{2}:\d{2}/.test(b))
    : normalized.split(/\n\n+/);
  const cues: { range: TimeRange; text: string }[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    const timeLine = lines.find(l => l.includes('-->'));
    if (!timeLine) continue;
    const match = timeLine.match(/(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})/);
    if (!match) continue;
    const toMs = (h: string | undefined, m: string, s: string, ms: string) =>
      ((h ? Number(h.replace(':', '')) : 0) * 3600 + Number(m) * 60 + Number(s)) * 1000 + Number(ms);
    const startMs = toMs(match[1], match[2], match[3], match[4]);
    const endMs = toMs(match[5], match[6], match[7], match[8]);
    const text = lines.filter(l => l !== timeLine && !/^\d+$/.test(l)).join(' ').trim();
    if (text) cues.push({ range: { startMs, endMs }, text });
  }
  return cues;
}

function runFfprobeDuration(filePath: string, signal: AbortSignal): Promise<number | undefined> {
  return new Promise(resolve => {
    if (signal.aborted) return resolve(undefined);
    const child = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', filePath], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let out = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve(undefined);
    }, 8_000);
    const onAbort = () => {
      child.kill();
      clearTimeout(timer);
      resolve(undefined);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    child.stdout.on('data', (chunk: Buffer) => {
      out += chunk.toString('utf8');
    });
    child.on('error', () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      resolve(undefined);
    });
    child.on('close', () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      const seconds = Number.parseFloat(out.trim());
      resolve(Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : undefined);
    });
  });
}

function factId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

/**
 * Shared perception adapter for P1.
 * Produces honest coverage labels. Without caption/vision config this is metadata_only.
 * Native Gemini / sampled_av adapters can plug in later behind the same VideoEvidence shape.
 */
export async function perceiveLocalVideo(input: PerceiveInput): Promise<VideoEvidence> {
  if (input.signal.aborted) throw new Error('分析已取消');
  const limitations: string[] = [];
  const uncertainties: string[] = [];
  const visualFacts: VisualFact[] = [];
  const audioFacts: AudioFact[] = [];
  const segments: EvidenceSegment[] = [];

  const durationMs = await runFfprobeDuration(input.localPath, input.signal);
  if (durationMs === undefined) {
    limitations.push('本机未检测到可用的 ffprobe，时长与画面采样不可用。');
    uncertainties.push('视频真实时长未知。');
  } else if (durationMs / 1000 > input.maxMediaSeconds) {
    limitations.push(`视频约 ${Math.round(durationMs / 1000)} 秒，超过本任务 ${input.maxMediaSeconds} 秒媒体预算；仅分析前段或元数据。`);
  }

  let coverage: ObservationCoverage = 'metadata_only';
  const observedRanges: TimeRange[] = [];

  if (input.captionPath && fs.existsSync(input.captionPath)) {
    const raw = fs.readFileSync(input.captionPath, 'utf8');
    const cues = parseSrtOrVtt(raw).filter(c => c.range.endMs <= input.maxMediaSeconds * 1000 || !durationMs);
    if (cues.length) {
      coverage = 'transcript_only';
      limitations.push('当前仅读取字幕/旁白文本，不代表已看见画面动作。');
      cues.slice(0, 40).forEach((cue, index) => {
        audioFacts.push({
          id: factId('cap', index),
          range: cue.range,
          text: cue.text.slice(0, 240),
          confidence: 'medium',
        });
        segments.push({
          id: `seg-${index}`,
          range: cue.range,
          transcript: cue.text.slice(0, 240),
          visualFacts: [],
          audioFacts: [{ id: factId('cap', index), range: cue.range, text: cue.text.slice(0, 240), confidence: 'medium' }],
        });
        observedRanges.push(cue.range);
      });
    } else {
      limitations.push('找到字幕文件但未能解析时间轴。');
    }
  } else {
    limitations.push('未找到同名字幕（.vtt/.srt）。没有视觉模型配置时不会假装看懂画面。');
  }

  // Metadata facts always present — characters may react to title/filename honestly.
  const title = path.basename(input.displayName, path.extname(input.displayName));
  visualFacts.push({
    id: 'meta-title',
    text: `文件标题/文件名：${title}`,
    confidence: 'high',
  });
  visualFacts.push({
    id: 'meta-size',
    text: `本地文件约 ${(input.size / (1024 * 1024)).toFixed(2)} MB`,
    confidence: 'high',
  });
  if (durationMs !== undefined) {
    visualFacts.push({
      id: 'meta-duration',
      text: `探测到时长约 ${Math.round(durationMs / 1000)} 秒（ffprobe）`,
      confidence: 'medium',
    });
  }

  if (!segments.length) {
    segments.push({
      id: 'seg-meta',
      range: { startMs: 0, endMs: durationMs ?? 0 },
      visualFacts: [...visualFacts],
      audioFacts: [],
    });
    if (durationMs) observedRanges.push({ startMs: 0, endMs: Math.min(durationMs, input.maxMediaSeconds * 1000) });
  }

  return {
    id: crypto.randomUUID(),
    canonicalId: `local:${input.fingerprint}`,
    title,
    durationMs,
    coverage,
    observedRanges,
    analysisVersion: ANALYSIS_VERSION,
    sourceFingerprint: input.fingerprint,
    segments,
    limitations,
    uncertainties,
    createdAt: Date.now(),
    localPath: input.localPath,
  };
}

export function evidenceBrief(evidence: VideoEvidence): string {
  const lines = [
    `标题：${evidence.title}`,
    `覆盖：${evidence.coverage}`,
    evidence.durationMs !== undefined ? `时长：约 ${Math.round(evidence.durationMs / 1000)} 秒` : '时长：未知',
    ...evidence.limitations.map(l => `限制：${l}`),
    ...evidence.uncertainties.map(u => `不确定：${u}`),
  ];
  for (const seg of evidence.segments.slice(0, 12)) {
    if (seg.transcript) lines.push(`[${seg.range.startMs}-${seg.range.endMs}ms] 字幕：${seg.transcript}`);
    for (const v of seg.visualFacts.slice(0, 3)) lines.push(`画面/元数据：${v.text}`);
    for (const a of seg.audioFacts.slice(0, 3)) lines.push(`声音：${a.text}`);
  }
  return lines.join('\n');
}
