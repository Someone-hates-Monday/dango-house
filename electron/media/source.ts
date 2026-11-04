import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { MediaSourceRef } from '../../src/shared/agent';

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mkv', '.mov', '.m4v', '.avi']);
const CAPTION_EXT = new Set(['.vtt', '.srt', '.txt']);

export function assertSafeLocalMedia(filePath: string) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('请选择本地视频文件。');
  const resolved = path.resolve(filePath);
  if (!path.isAbsolute(resolved)) throw new Error('仅支持绝对路径的本地文件。');
  if (/[\0]/.test(resolved)) throw new Error('路径无效。');
  const ext = path.extname(resolved).toLowerCase();
  if (!VIDEO_EXT.has(ext)) throw new Error(`暂不支持 ${ext || '无扩展名'} 文件，请使用常见短视频格式。`);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) throw new Error('目标不是普通文件。');
  const maxBytes = 250 * 1024 * 1024;
  if (stat.size <= 0) throw new Error('文件为空。');
  if (stat.size > maxBytes) throw new Error('文件超过 250MB 上限，请先裁成短视频。');
  return { resolved, stat, ext };
}

export function fingerprintFile(filePath: string, size: number, mtimeMs: number) {
  const hash = crypto.createHash('sha256');
  hash.update(filePath);
  hash.update(String(size));
  hash.update(String(Math.floor(mtimeMs)));
  // Sample head/tail for a cheap content fingerprint without reading the whole file.
  const fd = fs.openSync(filePath, 'r');
  try {
    const head = Buffer.alloc(Math.min(64 * 1024, size));
    fs.readSync(fd, head, 0, head.length, 0);
    hash.update(head);
    if (size > head.length) {
      const tail = Buffer.alloc(Math.min(64 * 1024, size));
      fs.readSync(fd, tail, 0, tail.length, Math.max(0, size - tail.length));
      hash.update(tail);
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex').slice(0, 32);
}

export function findSidecarCaption(videoPath: string, explicit?: string) {
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (fs.existsSync(resolved) && CAPTION_EXT.has(path.extname(resolved).toLowerCase())) return resolved;
  }
  const base = videoPath.replace(/\.[^.]+$/, '');
  for (const ext of ['.vtt', '.srt', '.zh.vtt', '.zh.srt', '.en.vtt', '.en.srt', '.txt']) {
    const candidate = `${base}${ext}`;
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

export function importLocalVideo(ref: MediaSourceRef, cacheDir: string) {
  if (ref.kind !== 'local_file') throw new Error('当前版本优先支持本地短视频文件；链接来源接口已预留。');
  const { resolved, stat } = assertSafeLocalMedia(ref.value);
  fs.mkdirSync(cacheDir, { recursive: true });
  const fingerprint = fingerprintFile(resolved, stat.size, stat.mtimeMs);
  const ext = path.extname(resolved).toLowerCase() || '.mp4';
  const dest = path.join(cacheDir, `${fingerprint}${ext}`);
  if (!fs.existsSync(dest)) fs.copyFileSync(resolved, dest);
  const caption = findSidecarCaption(resolved, ref.sidecarCaptionPath);
  let captionDest: string | undefined;
  if (caption) {
    captionDest = path.join(cacheDir, `${fingerprint}${path.extname(caption).toLowerCase()}`);
    if (!fs.existsSync(captionDest)) fs.copyFileSync(caption, captionDest);
  }
  return {
    localPath: dest,
    originalPath: resolved,
    fingerprint,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    displayName: ref.displayName || path.basename(resolved),
    captionPath: captionDest,
  };
}

/** URL intake is intentionally a stub seam for P2 — returns a typed rejection, not a fake success. */
export function resolveUrlSource(_ref: MediaSourceRef): never {
  throw new Error('链接解析尚未接入真实检索/下载。请先导入本地短视频；URL 接口已预留，不会假装已看完。');
}
