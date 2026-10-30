import fs from 'node:fs';
import path from 'node:path';
const root='test-results/animation-lab/cast-interactions-v1';
const data=JSON.parse(fs.readFileSync(path.join(root,'jobs.json'),'utf8'));
// Imports write isolated status files so two character jobs can run together.
for(const job of data.jobs){const state=path.join(job.folder,'import-status.json');if(fs.existsSync(state)&&!job.productionApproved&&!job.status.startsWith('rejected'))Object.assign(job,JSON.parse(fs.readFileSync(state,'utf8')));}
fs.writeFileSync(path.join(root,'jobs.json'),JSON.stringify(data,null,2)+'\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={'already-shipped-p1':'已采用完整 P1','prepared':'已备提示词，尚未提交','generating':'平台生成中','generated-awaiting-download':'已出片，待原片下载','awaiting-visual-review':'原片已处理，待逐帧验收','source-imported':'已导入原片','quota-blocked':'平台提示额度不足','awaiting-confirmation':'平台待参数确认','rejected-by-user':'用户已淘汰：尾巴结构错误','accepted-after-local-review':'已接入 v0.3.5，保留原片供复查'};
const cards=data.jobs.map(j=>{
 const video=fs.existsSync(path.join(j.folder,'draft.webm'))?`<video src="${j.character}/${j.action}/draft.webm" controls playsinline preload="metadata"></video>`:j.status==='already-shipped-p1'?'<video src="/public/video/gpt/pat-pixverse-p1.webm" controls playsinline preload="metadata"></video>':`<img src="/${esc(j.reference)}" alt="${esc(j.character)} 角色参考">`;
 return `<article><h2>${esc(j.title)}</h2><p class="status">${esc(labels[j.status]??j.status)}</p>${video}<p>${j.url?`<a href="${esc(j.url)}" target="_blank">打开平台会话</a> · `:''}<a href="${j.character}/${j.action}/prompt.txt">完整动作提示词</a></p><small>${j.productionApproved?'已通过用户验收并接入':'尚未接入正式应用；预览和参数正确不代表美术验收通过。'}</small></article>`;
}).join('');
fs.writeFileSync(path.join(root,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>五位 AI 娘 · 配套互动制作</title><style>body{font:15px/1.65 system-ui;max-width:1300px;margin:30px auto;padding:0 22px;background:#faf4fb;color:#59445e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px}article{background:white;border:1px solid #e7d9e8;border-radius:16px;padding:16px}h1{font-size:26px}h2{font-size:18px;margin:0}.status{color:#93658e}video,img{width:100%;aspect-ratio:16/9;object-fit:contain;background:#302837;border-radius:9px}a{color:#8c598b}small{color:#88758c}.note{background:#eee3f2;padding:15px;border-radius:12px}</style><h1>五位 AI 娘 · 配套互动制作</h1><p class="note">GPT 摸头保留你选择的原版完整 5 秒 P1。本轮逐项补齐摸头、收到喜爱、私聊、米饭和偶发小动作；已备提示词不等于已经生成。新片保留完整正向过程，经过角色一致性、全身裁切、透明边缘、动作和恢复过程检查后才接入。</p><div class="grid">${cards}</div></html>`);
console.log('Updated interaction review page.');
