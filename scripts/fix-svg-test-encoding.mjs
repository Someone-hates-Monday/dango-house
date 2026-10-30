import fs from 'node:fs';
const file='scripts/verify-sprites.mjs';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace("String.fromCharCode(...new TextEncoder().encode(new XMLSerializer().serializeToString(svg)))","Array.from(new TextEncoder().encode(new XMLSerializer().serializeToString(svg)),b=>String.fromCharCode(b)).join('')"));
