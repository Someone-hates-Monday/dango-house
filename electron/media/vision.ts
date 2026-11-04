import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { ObservationCoverage, VideoEvidence, VisualFact } from '../../src/shared/agent';

export interface VisionAdapterInput {
  localPath: string;
  signal: AbortSignal;
  maxFrames?: number;
}

/**
 * Optional FFmpeg frame-sampling adapter.
 * When ffmpeg is missing or frames cannot be extracted, returns null so callers keep metadata/transcript coverage.
 * Does not call a vision model — only upgrades coverage to sampled_av with low-confidence frame placeholders.
 */
export async function sampleVisualFacts(input: VisionAdapterInput): Promise<{ facts: VisualFact[]; coverage: ObservationCoverage } | null> {
  const maxFrames = Math.max(1, Math.min(input.maxFrames ?? 3, 6));
  const outDir = path.join(path.dirname(input.localPath), `.frames-${path.basename(input.localPath, path.extname(input.localPath))}`);
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch {
    return null;
  }

  const pattern = path.join(outDir, 'frame-%02d.jpg');
  const ok = await new Promise<boolean>(resolve => {
    if (input.signal.aborted) return resolve(false);
    const child = spawn(
      'ffmpeg',
      ['-y', '-i', input.localPath, '-vf', `fps=1/${Math.max(2, Math.floor(12 / maxFrames))}`, '-frames:v', String(maxFrames), pattern],
      { windowsHide: true, stdio: 'ignore' },
    );
    const timer = setTimeout(() => {
      child.kill();
      resolve(false);
    }, 12_000);
    const onAbort = () => {
      child.kill();
      clearTimeout(timer);
      resolve(false);
    };
    input.signal.addEventListener('abort', onAbort, { once: true });
    child.on('error', () => {
      clearTimeout(timer);
      input.signal.removeEventListener('abort', onAbort);
      resolve(false);
    });
    child.on('close', code => {
      clearTimeout(timer);
      input.signal.removeEventListener('abort', onAbort);
      resolve(code === 0);
    });
  });

  if (!ok) {
    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch { /* ignore */ }
    return null;
  }

  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.jpg')).sort().slice(0, maxFrames);
  if (!files.length) {
    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch { /* ignore */ }
    return null;
  }

  const facts: VisualFact[] = files.map((file, i) => ({
    id: `frame-${i}`,
    atMs: i * 2000,
    text: `Sampled frame stored locally (${file}); no vision model interpreted the pixels yet.`,
    confidence: 'low' as const,
  }));

  return { facts, coverage: 'sampled_av' };
}

/** Merge optional vision into existing evidence without claiming full watch-through. */
export function mergeVisionIntoEvidence(evidence: VideoEvidence, vision: { facts: VisualFact[]; coverage: ObservationCoverage }): VideoEvidence {
  const segments = evidence.segments.length
    ? evidence.segments.map((seg, i) =>
        i === 0 ? { ...seg, visualFacts: [...seg.visualFacts, ...vision.facts] } : seg,
      )
    : [
        {
          id: 'vision-0',
          range: { startMs: 0, endMs: evidence.durationMs ?? 6000 },
          visualFacts: vision.facts,
          audioFacts: [],
        },
      ];

  const limitations = [
    ...evidence.limitations,
    'Frame samples were extracted; pixel content was not described by a vision model.',
  ];

  return {
    ...evidence,
    coverage: vision.coverage,
    segments,
    limitations,
    uncertainties: [...evidence.uncertainties, 'sampled_av without model captions'],
  };
}
