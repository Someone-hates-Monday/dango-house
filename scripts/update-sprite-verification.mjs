import fs from 'node:fs';
const file='scripts/verify-sprites.mjs';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace("cell.row===6&&[0,3].includes(cell.column)","cell.row===7&&[0,1,2,3].includes(cell.column)"));
