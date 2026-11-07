import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {claudeClips} from '../src/shared/claude-clips.ts';

// Runtime routing/decoding check only. This does not approve animation anatomy or acting.
const out=path.resolve('test-results/claude-library');
const selected=process.argv.find(a=>a.startsWith('--clips='))?.slice(8).split(',');
fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};
delete env.ELECTRON_RUN_AS_NODE;
const report={scope:'source build; room manual library; not artistic acceptance',clips:[],errors:[],success:false};
const app=await electron.launch({args:[process.cwd()],env});
try{
  await app.firstWindow();
  let main;
  for(let i=0;i<100&&!main;i++){
    main=app.windows().find(p=>p.url().includes('view=chat'));
    if(!main)await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(main);
  main.on('pageerror',e=>report.errors.push(e.message));
  await main.evaluate(async()=>{
    await window.garden.dispatch({type:'settings',patch:{autonomous:false,mode:'demo'}});
    await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});
  });
  const selector='.room-character[data-character=rin] .claude-video-sprite';
  for(const clip of claudeClips.filter(c=>!selected||selected.includes(c.id))){
    report.currentClip=clip.id;
    if(clip.id!=='idle')await main.evaluate(clipId=>window.garden.dispatch({type:'play-clip',id:'rin',clipId}),clip.id);
    await main.waitForFunction(({selector,id})=>{
      const e=document.querySelector(selector),v=e?.querySelector('video');
      return e?.dataset.clip===id&&v?.readyState>=2&&!v.paused&&v.currentTime>.1;
    },{selector,id:clip.id},{timeout:25000});
    const media=await main.locator(selector+' video').evaluate(v=>{
      const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
      const ctx=c.getContext('2d');ctx.drawImage(v,0,0);
      const d=ctx.getImageData(0,0,c.width,c.height).data;
      let opaque=0;for(let i=3;i<d.length;i+=4)if(d[i]>230)opaque++;
      return{source:v.currentSrc.split('/').pop(),duration:v.duration,width:v.videoWidth,height:v.videoHeight,opaque,corners:[d[3],d[c.width*4-1],d[d.length-1]]};
    });
    assert.ok(media.duration>0&&media.opaque>1000,`${clip.id}: empty video`);
    assert.deepEqual(media.corners,[0,0,0],`${clip.id}: nontransparent corners`);
    report.clips.push({id:clip.id,...media});
    console.log(`PASS ${clip.id}: ${media.source}`);
    if(['rivalrySoft','fishShy','turnToLeft'].includes(clip.id))await main.screenshot({path:path.join(out,clip.id+'.png'),scale:'css'});
  }
  assert.deepEqual(report.errors,[]);
  delete report.currentClip;
  report.success=true;
}catch(e){report.failure=e.message;process.exitCode=1;}
finally{await app.close();fs.writeFileSync(path.join(out,selected?'selected-verification.json':'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
