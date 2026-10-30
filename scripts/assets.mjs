import fs from 'node:fs';
import zlib from 'node:zlib';
fs.mkdirSync('public/characters', { recursive: true }); fs.mkdirSync('build', { recursive: true });
// Original, code-drawn pixel characters. No external character/artwork is used.
const palettes = {
  xia: { hair: '#945344', shade: '#713e39', light: '#c7835b', dress: '#c76c48', trim: '#f6d891', eye: '#874331', back: '<path d="M8 23h9v24H8V35H4v-9h4zm39 0h9v23h-8V35h-4V25z" fill="#945344"/>', accessory: '<path d="M10 13h9v6h-9zm36 0h9v6h-9z" fill="#e9aa6c"/><path d="M12 12h5v3h-5zm36 0h5v3h-5z" fill="#fbda93"/>' },
  rin: { hair: '#a1b6b5', shade: '#6f9194', light: '#d1deda', dress: '#688c88', trim: '#e8e4c7', eye: '#476e79', back: '<path d="M11 20h42v31H11z" fill="#6f9194"/><path d="M9 22h8v28H9zm38 0h8v28h-8z" fill="#a1b6b5"/>', accessory: '<path d="M13 10h4V7h29v3h5v9H13z" fill="#5c7c79"/><path d="M16 15h32v4H16z" fill="#d7d4b2"/><path d="M43 6h3v6h-3zm-3 3h9v2h-9z" fill="#e8d89e"/>' },
  shiori: { hair: '#87718d', shade: '#5e546d', light: '#b19bb5', dress: '#9a7c9e', trim: '#e4c4d2', eye: '#695584', back: '<path d="M10 17h44v40H10z" fill="#5e546d"/><path d="M8 22h10v31H8zm38 0h10v31H46z" fill="#87718d"/>', accessory: '<path d="M12 15V3h4v3h4v4h4v6zm28 1v-6h4V6h4V3h4v13z" fill="#5e546d"/><path d="M15 12V8h3v4zm31 0V8h3v4z" fill="#d1a7b8"/><path d="M46 30h8v3h-8zm3-3h3v9h-3z" fill="#e4c4d2"/>' },
};
for (const [name, p] of Object.entries(palettes)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" shape-rendering="crispEdges"><ellipse cx="32" cy="76" rx="20" ry="3" fill="#514538" opacity=".12"/>${p.back}<path d="M19 49h26v20H19z" fill="${p.dress}"/><path d="M19 51h-5v13h5zm26 0h5v13h-5z" fill="${p.dress}"/><path d="M14 61h5v5h-5zm31 0h5v5h-5z" fill="#f6d6bc"/><path d="M21 67h8v7h-8zm14 0h8v7h-8z" fill="#f6d6bc"/><path d="M19 72h11v4H19zm15 0h11v4H34z" fill="${p.shade}"/><path d="M21 49h22v6H21z" fill="${p.trim}"/><path d="M29 51h6v6h-6z" fill="${p.shade}"/><path d="M19 58h26v4H19z" fill="${p.light}" opacity=".6"/><path d="M21 62h4v7h-4zm9 0h4v7h-4zm9 0h4v7h-4z" fill="${p.shade}" opacity=".3"/><path d="M18 14h28v4h5v25h-5v5H18v-5h-5V18h5z" fill="${p.hair}"/><path d="M18 24h28v18h-4v4H22v-4h-4z" fill="#f6d6bc"/><path d="M20 25h4v-4h5v8h6v-5h5v7h7V18H20z" fill="${p.hair}"/><path d="M17 17h26v4H17z" fill="${p.light}"/><path d="M13 24h6v18h-6zm32 4h6v14h-6z" fill="${p.hair}"/><path d="M23 32h4v6h-4zm14 0h4v6h-4z" fill="${p.eye}"/><path d="M24 32h2v2h-2zm14 0h2v2h-2z" fill="#fff9ed"/><path d="M20 39h6v2h-6zm18 0h6v2h-6z" fill="#e8a895"/><path d="M30 41h4v2h-4z" fill="#ba7c70"/>${p.accessory}</svg>`;
  fs.writeFileSync(`public/characters/${name}.svg`, svg);
}
// Portable PNG + ICO generator: the app icon is an original little garden window.
const size = 256; const bytes = Buffer.alloc((size * 4 + 1) * size);
const pixels = (x, y) => {
  if (x < 16 || y < 16 || x >= 240 || y >= 240) return [0, 0, 0, 0];
  if (x < 28 || y < 28 || x >= 228 || y >= 228) return [72, 80, 65, 255];
  if (x >= 118 && x < 138 || y >= 118 && y < 138) return [72, 80, 65, 255];
  if (x > 151 && x < 202 && y > 54 && y < 105) return [212, 152, 82, 255];
  if (y > 158 && (x < 118 ? y > 188 - x / 4 : y > 200 - (x - 128) / 2)) return [119, 146, 104, 255];
  return [241, 232, 211, 255];
};
for (let y = 0; y < size; y++) { bytes[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) { const color = pixels(x, y); for (let c = 0; c < 4; c++) bytes[y * (size * 4 + 1) + 1 + x * 4 + c] = color[c]; } }
const crc = data => { let c = 0xffffffff; for (const b of data) { c ^= b; for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return (c ^ 0xffffffff) >>> 0; };
const chunk = (name, data) => { const type = Buffer.from(name); const buffer = Buffer.alloc(data.length + 12); buffer.writeUInt32BE(data.length); type.copy(buffer, 4); data.copy(buffer, 8); buffer.writeUInt32BE(crc(Buffer.concat([type, data])), data.length + 8); return buffer; };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(bytes)), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync('public/icon.png', png);
const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4); ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
fs.writeFileSync('build/icon.ico', Buffer.concat([ico, png]));
console.log('Created 3 original character SVGs and application icons.');
