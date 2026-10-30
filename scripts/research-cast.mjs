import fs from 'node:fs/promises';
const sources=[];
for(const bvid of ['BV1tE9XBbErS','BV1PTHB6BEbA','BV1EMpK6rEsN','BV1WUhE63En4','BV1eMeS6SETU']){
  const url=`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  try{const response=await fetch(url,{signal:AbortSignal.timeout(12000)});const data=await response.json();sources.push({bvid,url:`https://www.bilibili.com/video/${bvid}/`,status:response.status,code:data.code,title:data.data?.title,author:data.data?.owner?.name,description:data.data?.desc});}catch(error){sources.push({bvid,error:String(error)});}
}
await fs.writeFile('docs/群像来源核查.json',JSON.stringify({checkedAt:new Date().toISOString(),method:'Public metadata only; no video playback or transcription',sources},null,2));console.log(JSON.stringify(sources));
