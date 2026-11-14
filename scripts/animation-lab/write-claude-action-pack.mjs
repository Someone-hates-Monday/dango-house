// Writes creative documents only. No cloud submission or production replacement.
import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';
const dir='docs/animation-lab/claude-action-pack-v1';fs.mkdirSync(dir,{recursive:true});
const reference='test-results/animation-lab/claude/interactions-v1/anchor-green.png';
const rows=[
['listen','认真倾听','P0','private-talk','双手抱稳原书，眼神看向用户，身体稍前倾，听完后温柔点头一次，再回正；不连续挥手','站姿锚即可'],
['welcome-back','合书等你回来','P0','return','先低头看已微开的书，察觉用户后抬眼，轻合书抱回胸前，露出明显但不夸张的欢迎笑意','需先准备与原书一致的微开书首帧'],
['rivalry-soft','被冷落的小不满','P0','rivalry','看向画外被选走的同伴，指尖轻轻收紧书缘，笑意稍停；再看用户，歪头带一点期待，最后恢复柔和；不鼓腮跺脚、不责备','站姿锚即可；画外方向在运行时匹配'],
['chosen-again','再次被选中的开心','P0','selected-return','原本目光旁移，听见自己名字后眼睛明亮一些，书轻抱近胸前，再略松开；看向用户含笑点头，像想掩饰却藏不住开心','站姿锚即可；不重制已有chat'],
['offer-seat','给你留了位置','P0','user-invite','左臂固定托书，右手朝自己身侧空位轻示意，目光从空位转向用户，温柔点头；右手最后回到书旁','先验左臂独立持书姿态；不画出新椅子'],
['reassure','认真安慰','P0','comfort','抱书看用户，肩膀稍松，头轻轻偏一点，眼神柔和地等一拍，再点头；笑容很轻，不露出怜悯或训诫神情','站姿锚即可；不要画用户手或抚脸动作'],
['fish-invite','主动喊大鱼过来','P0','pair-rin-xia','左臂抱书，目光看向画外左侧大鱼，右手小幅招一次，神情从认真变为带笨拙期待的温柔；随后收手抱书','左臂持书关键帧；单人差分不生成大鱼'],
['fish-shy','被大鱼靠近后书挡脸','P1','pair-reaction','察觉画外同伴靠近，肩膀微收，把原书轻抬至自己嘴唇下方，脸颊渐红，眼睛仍可见；偷看同伴一眼后缓缓把书降回胸前','先验书抬高不会遮眼或穿脸；单人差分'],
['gpt-joke','和龙娘交换眼神','P1','pair-rin-gpt','看向画外右侧GPT，轻抬眉，露出会意的柔笑，轻点头；GPT不入镜，Claude保持比龙娘更外露的温柔','站姿锚即可；不能生成角翼尾'],
['pov-read','邀请一起读一页','P1','user-shared-read','双手托同一本打开的书，先看书页，再抬眼看用户，把书微朝用户倾斜但不递出，停稳等待','需合格开书首帧；文字不可读即可，不生成字幕'],
['thinking','想清楚再回答','P1','working','低头看书，视线停顿思考，眉微收，随后抬眼认真看用户，舒展眉眼轻点头；双手始终持书','站姿锚即可；与已有bookmark不同，不反复理书签'],
['success','终于做好了','P1','task-success','先短暂放松肩膀，闭眼轻呼气，再睁眼看用户微笑，书稳稳抱住；不跳跃庆祝','站姿锚即可；必须真实完成事件后触发'],
['hesitate','谨慎重新检查','P1','task-uncertain','目光看向画外结果，眉头轻收，再垂眼思索，最终看回用户认真点头；不是难过自责，不冒汗特效','站姿锚即可；台词不伪称已修好错误'],
['goodnight','舍不得合上的书','P1','goodnight','看一眼书，再抬眼看用户，微微垂眼露出安静笑意，书抱近一点，最后自然放松站好；像轻声晚安而非突然睡着','站姿锚即可'],
['sleep-enter','抱书坐下打盹','P2','sleep-start','从站姿缓慢屈膝坐低，书一直托在两手中并安放到自己膝上，身体稳定后垂头闭眼','需坐姿/书在膝上终点钉板；结尾保持坐姿'],
['sleep-loop','抱书安静小憩','P2','sleep-loop','保持与入睡末帧相同的坐姿，双手和书停在膝上，只见轻微呼吸和极小发梢变化，闭眼安静休息','使用已验sleep-enter末帧；循环单独验接缝'],
['wake','醒来再站好','P2','sleep-end','从同一坐姿轻睁眼，先扶稳膝上书并抱回胸前，再缓慢起身，两脚落稳后看用户点头','使用已验睡姿首帧；动作全过程不得突然切站姿'],
['dock-down','伏在Dock边读书','P2','dock-rest','缓慢屈膝向统一支撑线低伏，双前臂支撑、书平放在两臂之间，低头看一眼再抬眼看用户','需Dock专用起止图；书有支撑不可悬空；不画真实系统Dock'],
['dock-up','收书从Dock起身','P2','dock-stand','先抬头，把支撑线上的书合好抱回胸前，收拢双臂，屈膝支撑缓慢站起，最后含笑看用户','以dock-down末帧作首帧；必须有起身过程'],
['walk-cycle','抱书轻步走','P2','move','身体微侧向画面左，双臂抱书，原地交替走四小步，鞋底有抬起和承重，头发随脚步轻跟随，躯干不平移','侧身持书钉板；程序推进坐标；不叠加视频位移'],
['recover-step','停步稳住书本','P2','move-stop','从微侧行走姿势渐渐减速，抱稳书，最后一脚落稳，身体回正，发丝随动减弱停稳','必须从已验walk步相匹配首帧；不摔倒换姿势'],
['hair-tidy','空出一只手理发丝','P1','rare-idle','左臂稳定抱书，右手轻将自己脸侧一缕头发拨回耳旁，随后收手；眼神先专注再看向用户柔笑','左臂持书关键帧；只整理自己，不新增对方手']
];
const identity='严格保持参考中同一位Q版Claude：橙色长发、琥珀瞳、花饰与黑丝带、白橙金裙装、同一本棕色花纹书、原头身比例与脚底位置。温柔认真、谨慎，带一点大小姐式拘谨与主动关心；不同于GPT的冰山式克制，眼神与笑意更温暖，仍不夸张蹦跳。只有两条手臂，手和书连续可追踪，不给Claude加角翼尾。';
const jobs=rows.map(([id,title,priority,trigger,action,prep])=>{
const transition=/sleep|wake|dock|recover/.test(id);const text=`Claude-${id}-A2｜${title}。建议5秒、720P、16:9，固定镜头，单次连续正向二维Q版动作。\n【参考角色】主身份/构图使用anchor-green；本动作需要新姿势时以已验收对应首帧替代开场，anchor-green仅锁身份，不能强迫每条从站姿开始。\n【身份】${identity}\n【演出】${transition?'前半秒保持已验起始姿势，0.5–4秒完成连续过程，最后1秒稳定在本动作终点；不强制回站姿。':'前半秒抱书静止，0.5–3.5秒完成动作，3.5–4.5秒连续收势，最后半秒稳定；特殊循环另验接缝。'}${action}。\n【画面】均匀纯绿底，无阴影、文字、字幕、粒子、浮现道具、镜头缩放或切镜。全身头发花饰手指鞋子始终完整留边，无外来人手/额外人物。不让书改变颜色花纹、变成其他物品、凭空消失或穿身体。只生成指定单一主活动。\n【前置】${prep}。若缺对应姿态图先准备静帧，不能直接提交。\n【交付】原片独立候选，不覆盖现有六类生产片；保留准备、行动与恢复，不倒放、不截去失败帧冒充完整。`;
fs.writeFileSync(path.join(dir,id+'.zh.txt'),text+'\n');return{id,title,priority,trigger,preparation:prep,prompt:id+'.zh.txt',designBasis:'project persona / original choreography; no claim of frame-by-frame fanwork reproduction',status:'prompt-only',productionApproved:false,replacePublic:false};});
fs.writeFileSync(path.join(dir,'jobs.json'),JSON.stringify({character:'rin',date:'2026-11-05',reference:{path:reference,sha256:crypto.createHash('sha256').update(fs.readFileSync(reference)).digest('hex')},preserveExisting:['idle','pat','affection','chat','rice','bookmark'],jobs},null,2));
fs.writeFileSync(path.join(dir,'INDEX.md'),'# Claude动作补全提示词\n\n先读[交接](../CLAUDE-ACTION-HANDOFF.zh-CN.md)。共'+jobs.length+'条，均为候选规格，不是已生成素材。\n\n'+jobs.map(j=>`- ${j.priority} [${j.title}](${j.prompt}) — ${j.preparation}`).join('\n')+'\n');console.log(JSON.stringify({jobs:jobs.length,missingPrompts:jobs.filter(j=>!fs.existsSync(path.join(dir,j.prompt))).length}));
