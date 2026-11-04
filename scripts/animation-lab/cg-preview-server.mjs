import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.json': 'application/json' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const relative = url.pathname === '/' ? 'scripts/animation-lab/cg-preview.html' : decodeURIComponent(url.pathname).slice(1);
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !/^(test-results\/cg-lab\/|public\/|docs\/screenshots\/|scripts\/animation-lab\/cg-preview\.html$)/.test(relative) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  const size = fs.statSync(file).size;
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '');
  const start = range ? Number(range[1]) : 0;
  const end = range?.[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
  if (start > end || start >= size) { res.writeHead(416); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Length', end - start + 1);
  if (range) { res.statusCode = 206; res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`); }
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(file, { start, end }).pipe(res);
}).listen(4320, '127.0.0.1', () => console.log('CG design preview: http://127.0.0.1:4320/'));
