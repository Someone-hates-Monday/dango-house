import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {idleVideos,patVideos} from '../src/reaction-pack.ts';

// Media provenance check, not visual recognition or proof of what a prior window displayed.
const rejected=new Set([
  '98190d86c7307693348f40a5e617e81c982ac1e387d35d4892dfe540005d3604', // S1 with 16 stale identity frames appended
  'acb909b6868bde6b3dcb248eb8b5f2add42f147c6535cedf067e4d6dedc0697a',
  'acbf437c795d4db36552bc6e6434b69a2e562625347f62298f2997590973bf3b',
]);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function* files(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())yield*files(p);else yield p;}}
const report={mapped:[],checkedMedia:0,errors:[],success:false};
try{
  for(const [action,src] of Object.entries({idle:idleVideos.gpt,pat:patVideos.gpt})){
    assert.ok(src&&src.startsWith('./video/gpt/'));
    const publicFile=path.join('public',src);
    const digest=sha(publicFile);assert.ok(!rejected.has(digest),`rejected ${action}`);
    const builtFile=path.join('dist',src);
    assert.equal(sha(builtFile),digest,`${action}: stale build media`);
    report.mapped.push({action,src,sha256:digest});
  }
  for(const dir of ['public','dist'])for(const p of files(dir)){
    if(!/\.(webm|mp4|gif)$/i.test(p))continue;
    report.checkedMedia++;
    assert.ok(!rejected.has(sha(p)),`rejected candidate copied into ${p}`);
  }
  report.success=true;
}catch(e){report.errors.push(e.message);process.exitCode=1;}
const out='test-results/gpt-asset-cleanup';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'boundary-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
