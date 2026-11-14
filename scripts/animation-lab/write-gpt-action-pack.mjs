// Documentation/prompt packaging only. Never submits generation jobs or edits production assets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {deepseekClips} from '../../src/shared/deepseek-clips.ts';
const root='docs/animation-lab/gpt-action-pack-v1';
fs.mkdirSync(root,{recursive:true});
const base='test-results/animation-lab/jimeng-jobs/gpt-rice-c1/paste/';
const refs={Q0:base+'03-anchor-greenscreen.png',Q1:base+'01-idle-canonical.png',QS:base+'05-tail-structure-34.png',QT:base+'02-thinking-pose.png',P1:'public/video/gpt/pat-pixverse-p1.webm',CG:'public/portraits/gpt.jpg'};
const refRecords=Object.entries(refs).map(([id,file])=>({id,path:file,available:fs.existsSync(file),sha256:fs.existsSync(file)?crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'):null}));
const rows=[
['affection','收到喜爱','P0','点击回应-开心跃动','先看向用户，眼睑略放松，嘴角只扬起一点；移开视线半秒再看回来，脸颊只有淡淡暖色，不张嘴大笑','尾尖低位轻摆一次再停','无道具'],
['private-chat','被选私聊','P0','点击回应-元气挥手','察觉被点名，微抬眼，身体朝镜头前倾一点，轻点头示意正在听；双手自然留在身侧，不热情连挥手','尾巴低位收近脚边再放松','无道具'],
['rice','投喂白饭','P0','吃白饭','开场已有一只小白碗托在自己的左手，右手持勺；看一眼碗再看用户，舀一小口送入口中，轻点头致谢，最后仍持碗站稳；不狼吞虎咽','尾尖低位小摆一次','需先验收持碗首帧；Q0不是持碗图，不可假装现成'],
['pat-alt','摸头轻回应','P1','点击回应-害羞惊讶','感到熟悉用户关爱后缓慢垂眼，头微低，肩膀放松；一瞬淡红后抬眼，神情仍沉静；不出现摸她的人手','同一尾身向近侧脚踝外轻收，再连续舒展','P1保留；仅做差分候选，不重做旧片'],
['greeting','鼠标靠近问候','P0','点击回应-元气挥手','先用眼神注意镜头，轻转头约十度，抬一只手至胸侧小幅示意一次，放回；像熟悉的朋友靠近','尾尖仅一次轻微跟随','无道具'],
['listen','认真倾听','P0','碎碎念-对屏碎碎念','目光安稳看向镜头，略侧头，听完后轻点头一次；眉眼柔和但保留清冷轮廓，不连续说话','尾巴自然放松，不机械摆动','无道具'],
['rivalry','轻微吃醋','P0','点击回应-傲娇生气','目光先看画外另一人，再回到用户；轻抿唇，双臂不交叉，只将一只手收近胸前，最后带克制的期待看你；没有愤怒指责','尾尖向自己脚边收一下再停','他人不入单人片；画外目标方向记在工单'],
['relieved','被重新选中','P0','女仆屈膝礼仪','短暂停顿，绷紧的眉眼松开，轻呼气，微微点头，不做夸张庆祝','低位尾尖轻舒展一次','无道具'],
['return','私聊返回','P0','点击回应-元气挥手','从画外视线转回镜头，轻轻颔首，嘴角短暂放松，恢复端正站姿','尾尖从稍内收的位置平顺回中性','无道具'],
['think','冷静思考','P1','工作状态-思考冒泡','目光略向上，一只手轻触自己下巴，停顿思考，再自然放下；眉头只微收，不生成头顶符号','尾巴只作姿势补偿','可辅QT，但Q0仍为构图基准'],
['success','完成后的认可','P1','工作状态-雀跃庆祝','先看向画外完成的事情，再朝用户小幅点头；短暂自信浅笑后平静恢复，不跳跃','尾尖低位一次短摆','无道具'],
['tired','疲惫休息','P1','工作状态-垂头叹气冒汗','肩膀稍落，短暂闭眼缓慢呼气，再睁眼看用户，表情是疲惫而非责备','尾身放松但不摔落拍地','无汗滴文字特效'],
['stretch','舒展肩颈','P1','超大伸懒腰','一只手轻扶另一侧肩部，缓慢舒展肩颈，放下手，保持优雅端正；不大幅举臂遮角','尾巴平衡性微动一次','无道具'],
['yawn','困倦哈欠','P1','哈欠连天','轻抬一手遮住小幅哈欠，半垂眼，再放手看向用户；不是夸张大嘴','尾尖内收一点后停','无道具'],
['sleep-enter','入睡','P1','睡觉-开始','开场站立，缓慢屈膝低坐，双手收在自己膝旁，微低头闭眼，稳稳停在坐姿；不瞬间趴倒','尾巴留身体侧外，随坐下低位收拢','需先验收坐姿目标帧；结尾不回站立'],
['sleep-loop','安静小憩','P1','睡觉-循环','开场与结尾均为同一闭眼低坐姿，只见微弱呼吸和极小发梢变化，身体不平移','尾巴自然停稳，不左右摇','使用sleep-enter验收末帧；不要Q0站姿首帧'],
['wake','醒来起身','P1','睡觉-起来','从同一低坐姿睁眼，先抬头，手扶自己的膝，缓慢起身站稳，最后目光看向用户','尾巴顺着起身展开到身体右侧低位','使用sleep-loop姿态首帧；不得瞬切站姿'],
['walk-left','向左短走','P2','原地左转奔跑','身体轻向画面左侧转，连续走两小步，左右脚交替承重，脚底真实接地，停稳后转回略正面','尾巴在身后低位随步伐滞后，不扫到腿前','位移素材；程序不得再重复叠加同等位移'],
['walk-in-place','原地行走循环','P2','原地左转奔跑','轻侧身向左，原地交替走四小步，左右腿动作不同相，髋部保持原处，鞋底有抬起与落地；首末步态相容','尾巴低位小幅随身体平衡','运动脚本只推进坐标；禁滑步；左右需分别审镜像饰物'],
['trip','失衡并恢复','P2','被吓一跳','一只脚小绊，身体前倾半步，双手向自己身体两侧平衡，重新落脚站稳，不摔倒、不瞬间换姿势','尾身低位帮助平衡，不甩高','完整恢复；若要倒地另做起身段'],
['drag','被拖拽悬空','P2','被鼠标拖拽悬空反馈','双脚缓慢离开原地一点，目光平静中带意外，膝盖略屈，手靠身侧；停留再轻落地屈膝缓冲站稳','尾巴自然垂在低位，不打结','悬空反馈独立态；不能同时程序再做二次弹跳'],
['dock-down','Dock趴下','P2','原地小憩沉眠','从端正站姿缓慢屈膝，前倾并双前臂放到统一水平支撑线，伏低休息，头仍可看用户；全过程重心连续','尾身留在支撑线后侧，不能穿过前臂','需独立Dock姿态钉板；不在视频里画真实系统Dock'],
['dock-up','Dock站起','P2','睡觉-起来','从前臂支撑的低伏姿势抬头，双臂收回，屈膝支撑缓慢起身，再看向用户点头','尾身低位展开并停稳','起点用dock-down验收末帧；统一支撑线'],
['read','翻阅资料','P2','工作状态-清点归档','自己双手已拿着一本小册子，只用右手翻一页，视线读完再看用户，神情认真','尾尖只在看用户时轻动','新道具首帧先审批；不要借Claude书本身份'],
['tea','收到茶','P2','吃午餐','自己双手已有一杯无标识温茶，低头闻一下，再轻抿一口，放回胸腹前，微点头致谢','尾尖低位放松一次','持杯首帧；不用白饭道具图替代'],
['gift','收到礼物','P2','拆礼物','手中已有一只小礼盒，轻扶盒盖打开一小段，看到内容后目光柔和，看向用户，盒子始终可追踪','尾尖只小摆一次','盒盖不可瞬间消失；先出道具首帧'],
['idle-look','偶尔看看你','P1','东张西望','保持安静站姿，目光先向画外轻扫，再回到镜头，眨眼一次；不连续左右摇头','尾巴只在回看时一次轻微低位随动','现有idle不替换；低频特殊待机'],
['comfort','安静安慰','P1','碎碎念-对屏碎碎念','神情认真，头稍微降低与用户目光平齐，一只手轻按自己胸前，停顿陪伴，再轻点头；不夸张怜悯','尾巴向自己身侧稍收，停稳','不伸出画外摸用户；动作不需要真人手'],
['pair-look-ds','看向大鱼','P1','是啊，吃什么','看向画面左侧的画外同伴，表情从冷静变为很浅的柔和，轻点头示意位置，随后保持朝左目光','尾尖一次低位小动','单人关系差分；不生成大鱼；目标在左需程序匹配'],
['pair-look-claude','看向Claude','P1','女仆屈膝礼仪','看向画面右侧画外同伴，抬一点眉，嘴角略动像接住一句玩笑，轻微颔首后保持目光','尾尖内收后放松一次','单人关系差分；不要复制Claude花饰书本'],
['pair-bystander','旁观她们靠近','P1','点击回应-傲娇生气','先看画面左侧，短暂垂眼，轻抿唇，再看用户，微抬下巴像等待自己也被想起；不翻白眼不生气指责','尾尖收近自己脚侧再停','用于两人互动旁支；不抢主戏'],
['play-cube','专注魔方','P2','原地专心玩魔方','双手已有一只魔方，做一次清楚的小转动，专注审视后微点头，不抛接','尾巴平稳低位','先验收持物结构；对应DS原地专心玩魔方']
];
const identity='同一位二维Q版西方白龙GPT，银白长发、淡紫瞳、分段骨质龙角、小型膜翼、环状发饰和白紫裙装；严格保持图1头身比例与衣装。她比Claude更冷艳、沉静、克制，对熟悉用户亲和而不热闹：眼睑略放松、短暂浅笑、轻点头，禁止大张嘴傻笑、连跳、撒泼。';
const tail='只有一条尾巴：骨盆后方粗根（翼根下）→身体右侧向下弯的粗尾身→底部脚踝附近逐渐收成唯一细尖。上方靠身粗段是根不是尖。结构图只解释连接，不复制侧伸姿势。尾尖保持膝下脚边，动作由根带动、尖稍后跟随，最后停稳；无第二尖、鳍、叶片、箭头、毛簇，无抬尾到翼旁、无穿裙穿腿。';
// DS is a coverage check only. Remove unrelated activities rather than reskinning them.
const excluded=new Set(['play-cube','read','gift','tea','stretch','trip','drag']);
const signature=[
['reserved-seat','嘴硬留座','P0','project','先看身侧空位，再看用户，一只手轻示意靠近自己的一侧，目光移开半秒又回来，嘴角只有一点点松动','尾尖悄悄移近空位方向，再低位停稳','项目原创；座位不入单人素材，用视线与手势表达'],
['praise-denial','被夸却不承认','P0','project','听到夸奖先平静抬眼，像要维持淡定，短暂停顿后视线旁移，轻抿唇又放松，不做口型；最后认真看回用户','脸上克制，尾尖却低位轻摆一次出卖开心','项目原创；不要照搬大鱼鼓腮'],
['quiet-wait','陪你忙自己的事','P1','project','先看用户，确认对方忙碌后轻点头，视线移至旁边，安静站好；结束前短暂回看，不催促','尾巴放松在身体侧，不持续摆动','项目原创；不新增书本魔方'],
['fish-tease','被大鱼逗到','P1','fanwork-topic','看向画外左侧同伴，微抬眉像没料到对方调侃，稍偏头，压住笑意后目光柔和，最后克制点头','尾尖轻收一下，再缓慢放松','题材来自戛然而纸女同事篇；细节为原创演法，非已看过的镜头复刻'],
['help-ack','替你处理好了','P1','project','从画外工作方向抬眼看用户，轻点头确认，单手掌心向上小幅示意结果，随后自然收手；自信而亲近','尾尖稳定，仅身体收势时跟随','项目原创；具体工具结果由真实回执后触发'],
['soft-goodnight','晚安前多看一眼','P1','project','看向用户，轻垂眼再抬起，像将道别延后半拍，露出很浅的笑后轻点头，回安静姿态','尾巴朝自己身侧轻收，停稳','项目原创；朋友版不加脸红，男友版可淡红'],
['reunion','等到你回来','P0','project','起初目光朝侧面，察觉用户回来后先迅速看向镜头，随即恢复从容，肩膀松开，微微点头；藏住雀跃但看得出安心','尾尖比表情稍早出现一次低位小摆，之后停稳','项目原创；与Claude主动欢迎区分']
];
const designedRows=[...rows.filter(r=>!excluded.has(r[0])),...signature];
const jobs=designedRows.map(([id,name,priority,ds,action,tailAction,note],i)=>{
const special=/sleep|wake|dock/.test(id);const props=/rice|tea|gift|cube|read/.test(id);
const prompt=`GPT-${id}-D1｜${name}。5秒、720P、16:9、固定镜头、单镜头连续正向二维Q版动画。\n【图引用】上传后核实实际编号：图1=${special?'本动作已验收起始姿势（尚需准备，未准备不提交）':props?'已验收持物首帧（尚需准备，未准备不提交）':'Q0绿幕站姿'}，负责构图和比例；图2=Q1唯一外观锚；图3=QS尾结构解释，禁止复制其侧伸幅度。每张只参考指定用途，不生成拼图/文字/多个人。\n【身份与气质】${identity}\n【动作】${special?'0–0.5秒起始姿势，0.5–4秒完成如下单一过程，4–5秒停稳；状态转换不强制回站姿。':'0–0.5秒开场稳定，0.5–3.5秒完成动作，3.5–4.5秒连续收势，4.5–5秒停稳；持物片保留道具，循环片另验接缝。'}${action}。\n【尾巴表演】${tailAction}。${tail}\n【画面】均匀纯绿底，无渐变、投影、文字、粒子或音频；全身、角翼尾鞋留足边距，构图不缩放，不靠裁掉尾巴躲错。无新增人物或外来手。新道具仅限本条指定物。背景绿不是透明，后处理再验alpha。\n【交付】独立候选，不覆盖已验收idle/P1。${note}。`;
const file=`${id}.zh.txt`;fs.writeFileSync(path.join(root,file),prompt+'\n');return{id,name,priority,designBasis:id==='fish-tease'?{kind:'fanwork-topic-original-choreography',url:'https://www.bilibili.com/video/BV1WUhE63En4/',scope:'title/description verified; shot reference pending'}:{kind:'project-persona-and-user-brief',source:'src/shared/characters.ts',scope:'original choreography, not community canon'},refs:['Q0','Q1','QS'],requiredPreparation:special||props?note:null,promptFile:file,productionApproved:false,replacePublic:false,status:'prompt-ready-not-generated',runtimeAction:'proposed-not-wired'};});
fs.writeFileSync(path.join(root,'jobs.json'),JSON.stringify({date:'2026-11-05',scope:'prompt-package-only',references:refRecords,jobs},null,2));
const mapping=deepseekClips.map(c=>({sourceId:c.id,title:c.title,decision:'coverage-reference-only-not-a-GPT-production-order',mappedJobs:[]}));
fs.writeFileSync(path.join(root,'deepseek-coverage.json'),JSON.stringify(mapping,null,2));
fs.writeFileSync(path.join(root,'INDEX.md'),'# GPT 动作提示词索引\n\n独立完整提示词共 '+jobs.length+' 条。先看 ../GPT-ACTION-BATCH-HANDOFF.zh-CN.md。道具／Dock／睡眠工单未备起始图前不得提交。\n\n'+jobs.map(j=>`- ${j.priority} [${j.name}](${j.promptFile}) — ${j.requiredPreparation??'中性参考组；逐条验收'}`).join('\n')+'\n');
console.log(JSON.stringify({jobs:jobs.length,deepseekSources:mapping.length,missingReferences:refRecords.filter(r=>!r.available)}));
