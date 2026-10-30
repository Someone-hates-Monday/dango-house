import fs from 'node:fs';
import path from 'node:path';
const recipe=JSON.parse(fs.readFileSync('docs/animation-lab/cast-v1.json','utf8'));
const root='test-results/animation-lab/cast-interactions-v1';
fs.mkdirSync(root,{recursive:true});
const common='请实际调用可用每日免费额度生成10秒720p、16:9固定镜头二维Q版桌宠视频，如需充值或订阅则停止。参数已经确认，请直接生成视频，不必再次询问。仅以本条上传图为唯一角色与开场基准。全程同一角色，保持脸、眼睛、发型、发饰、衣装、头身比例、配色和全部身体部件完全一致，人物大小和脚底位置稳定；全身及耳朵、头发、尾巴、鞋子完整在画面内，留出安全边距。均匀纯绿背景，没有文字、水印式文字、字幕、图案、发光、特效、新人物、外来人手或手臂。静音，无走动跳跃、无镜头移动或缩放。每次单一小幅动作，连续正向演出，不倒放、不交叉换图、不瞬间切姿势。';
const labels={pat:'摸头回应',affection:'收到喜爱',chat:'被选中私聊',rice:'投喂大米饭',special:'偶发小动作'};
const rice={gpt:'克制地微微惊讶，双手接稳一只小白瓷饭碗，拿小勺吃一小口，认真咀嚼后浅浅点头致谢，尾巴低位轻轻摆一次，收好碗勺恢复原站姿。',gemini:'猫耳好奇竖起，接过一小碗白米饭，拿小勺吃一口，满足眯眼、耳朵轻松舒展，收好碗勺回正。',glm:'会心微笑，双手端起小碗白米饭，拿小勺慢慢吃一口，像在说这次算友情价一样含笑点头，收好碗勺回正。',kimi:'温柔低头，接稳小碗白米饭，拿小勺细细吃一口，满足地轻轻点头，收好碗勺回到安静站姿。',grok:'先露出被照顾到的惊喜笑容，接过小碗白米饭，拿小勺吃一口后俏皮地轻眨一只眼，收好碗勺、微笑回正。'};
const jobs=[];
for(const c of recipe.characters){
 for(const action of Object.keys(labels)){
  const id=`${c.file}-${action}-a1`,title=`${c.name}${labels[action]}A1`;
  const reference=c.file==='gpt'?'test-results/animation-lab/cast-v1/gpt/reference-audit/tail-anchor-builtin-v2-720.png':`test-results/animation-lab/cast-v1/${c.file}/anchor.png`;
  const motion=action==='rice'?rice[c.file]:c[action];
  const tail=c.file==='gpt'?'白龙尾根始终连接裙后骨盆、翼根下方，粗尾身从身体右侧向下弯，底部自然收细并向左收尖为唯一末端。尾巴跟随心情连续小幅运动，不静止贴片、不添加箭头、叶片、鳍或第二根尾巴，不横扫双腿，不穿过裙腿，动作减弱后回到参考弯曲。':'';
  const timeline=`0–1秒参考站姿；1–3秒产生反应；3–6秒完整演出：${motion} 6–9秒连续恢复参考站姿和原有全部肢体位置；9–10秒睁眼站稳。`;
  const prompt=`${title}。${common}${timeline}${tail}${action==='rice'?'唯一新增道具是小饭碗和小勺，不出现人手；碗勺须完整在画面中。':action==='pat'?'不添加新道具。摸头动作只演角色回应，手形由应用叠加，不生成现实人手。':'不添加新道具，不生成外来人手。'}`;
  const folder=path.join(root,c.file,action);fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'prompt.txt'),prompt+'\n');
  jobs.push({id,title,character:c.file,action,reference,folder:folder.replaceAll('\\','/'),prompt:prompt,status:c.file==='gpt'&&action==='pat'?'already-shipped-p1':'prepared',productionApproved:c.file==='gpt'&&action==='pat',source:c.file==='gpt'&&action==='pat'?'public/video/gpt/pat-pixverse-p1.webm':null});
 }
}
const manifest=path.join(root,'jobs.json');
// Preserve actual submissions and review decisions when regenerating recipes.
const previous=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')).jobs:[];
for(const job of jobs){const old=previous.find(x=>x.id===job.id);if(old&&old.status!=='prepared')Object.assign(job,old);}
fs.writeFileSync(manifest,JSON.stringify({version:1,created:'2026-10-30',baseRelease:'0.3.4',rule:'Prepared is not submitted; generated is not visually approved. Existing shipped packs remain in place.',jobs},null,2)+'\n');
console.log(`Prepared ${jobs.length} distinct jobs; GPT P1 pat remains shipped.`);
