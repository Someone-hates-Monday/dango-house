import fs from 'node:fs';
let s=fs.readFileSync('src/main.tsx','utf8');const start=s.indexOf('function DesktopPet('),end=s.indexOf('function PrivateWindow(',start);if(start>=0&&end>start)s=s.slice(0,start)+s.slice(end);if(!s.includes("from './DesktopPet'"))s=s.replace("import './style.css';","import { DesktopPet } from './DesktopPet';\nimport './style.css';");fs.writeFileSync('src/main.tsx',s);
