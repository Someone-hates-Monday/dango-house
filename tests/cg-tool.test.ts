import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {requestText} from '../electron/provider';
import {generateReply,generateHousePlan} from '../electron/provider';
import {initialState} from '../src/shared/director';

test('OpenAI-compatible and Claude tool streams execute request_cg and return its queued receipt',async()=>{
 for(const provider of ['deepseek','claude']){
  let count=0,executed=0;
  const server=http.createServer(async(req,res)=>{
   let raw='';for await(const p of req)raw+=p;const b=JSON.parse(raw);count++;
   const isClaude=provider==='claude';let events:any[];
   if(count===1){
    assert.ok(b.tools.some((t:any)=>(t.name??t.function?.name)==='request_cg'));
    events=isClaude?[{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'cg-1',name:'request_cg'}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:'{"asset":"xia-reach-t1"}'}}]:[{choices:[{delta:{tool_calls:[{index:0,id:'cg-1',function:{name:'request_cg',arguments:'{"asset":"xia-reach-t1"}'}}]}}]}];
   }else{
    assert.match(JSON.stringify(b.messages),/queued/);
    events=isClaude?[{type:'content_block_delta',delta:{type:'text_delta',text:'（向你伸手）过来吧。'}}]:[{choices:[{delta:{content:'（向你伸手）过来吧。'}}]}];
   }
   res.writeHead(200,{'Content-Type':'text/event-stream'});res.end(events.map(e=>'data: '+JSON.stringify(e)+'\n\n').join('')+'data: [DONE]\n\n');
  });
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try{
   const port=(server.address() as any).port;
   const text=await requestText(provider,'fixture','fixture-key','fixture',[],new AbortController().signal,()=>{},{endpoint:`http://127.0.0.1:${port}`,cg:asset=>{executed++;assert.equal(asset,'xia-reach-t1');return '{"status":"queued"}';}});
   assert.equal(text,'（向你伸手）过来吧。');assert.equal(executed,1);assert.equal(count,2);
  }finally{server.close();}
 }
});

test('semantic fallback chooses CG for private acceptance and autonomous peer dialogue when initial output omitted it',async()=>{
 for(const mode of ['private','autonomous']){
  let calls=0;const server=http.createServer(async(req,res)=>{
   let raw='';for await(const p of req)raw+=p;const b=JSON.parse(raw);calls++;
   const decision=b.messages[0].content.startsWith('Decide whether');
   const content=decision?JSON.stringify({asset:mode==='private'?'xia-reach-t1':'rin-xia-cheek-t1'}):mode==='private'?'（向你伸手）来，靠近一点。':JSON.stringify({beats:[{actor:'rin',text:'靠过来一起休息吧。',audience:'companions',replyTo:'xia'},{actor:'xia',text:'好，我想挨着你。',audience:'companions',replyTo:'rin'}]});
   res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\ndata: [DONE]\n\n');
  });await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try{
   const s=initialState();s.relationship.mode='romance';s.settings.provider='deepseek';s.connections.deepseek={endpoint:`http://127.0.0.1:${(server.address() as any).port}`,model:'fixture',tools:true};
   if(mode==='private'){let asset='';await generateReply(s,'rin','抱抱我',async()=> 'fixture',new AbortController().signal,()=>{},undefined,undefined,undefined,a=>{asset=a;return 'queued';});assert.equal(asset,'xia-reach-t1');}
   else {const plan=await generateHousePlan(s,{id:'fixture',at:Date.now(),kind:'autonomous'},async()=> 'fixture',new AbortController().signal);assert.equal(plan.cgAsset,'rin-xia-cheek-t1');}
   assert.equal(calls,2);
  }finally{server.close();}
 }
});
