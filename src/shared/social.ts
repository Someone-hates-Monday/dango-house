import type { AvatarIntent, CharacterId } from './types';

// Visual and story sources are separate: these are short original scenes, not video transcripts.
export const socialProfiles: Record<CharacterId, { target: CharacterId; feeling: string; origin: string; response: string }> = {
  rin: {target:'xia',feeling:'喜欢大鱼，认真照顾里藏着一点大小姐的笨拙',origin:'用户指定；Claude×DeepSeek 同人作品线索',response:'我给你留了旁边的位置。嗯……本来就是留给你的。'},
  xia: {target:'rin',feeling:'亲近 Claude，也爱拉着小龙娘一起干饭',origin:'群像同人梗的应用演绎',response:'一起坐嘛！我这碗饭可以分你一半～'},
  shiori: {target:'xia',feeling:'嘴上嫌热闹，却会替大鱼留座位',origin:'GPT×DeepSeek 同人日常线索',response:'……椅子空着，坐就是了。别误会。'},
  grok: {target:'shiori',feeling:'爱逗一本正经的 GPT，主动找她玩',origin:'Grok×GPT 同人作品线索',response:'你终于过来啦？我正缺一个接梗搭档。'},
  gemini: {target:'glm',feeling:'好奇心旺盛的星猫，总想拆穿狐狸的小算盘',origin:'星猫与黑狐视觉特征；小屋原创搭档',response:'喵？偷偷准备了什么，让猫猫也看看！'},
  glm: {target:'gemini',feeling:'笑眯眯地逗猫猫，把关心说成友情优惠',origin:'CrossPet 黑狐演绎；小屋原创搭档',response:'陪你玩一会儿。这一单，算友情赠送～'},
  kimi: {target:'rin',feeling:'安静的陪读搭档，也会悄悄观察大家的小心思',origin:'月影形象；小屋原创陪读性格',response:'我把书签留在这里。一起读下一页吧。'},
};
export type SocialStep = {actor:CharacterId;intent:AvatarIntent};
export const socialScenes: {id:string;title:string;cast:CharacterId[];origin:string;steps:SocialStep[]}[] = [
  {id:'bookmark',title:'大小姐的专属座位',cast:['rin','xia','shiori'],origin:'Claude→DeepSeek 关系取向；原创日常',steps:[
    {actor:'rin',intent:{action:'approach',target:'xia',emotion:'shy',bubble:'大鱼，窗边的位置……我替你留着。'}},
    {actor:'xia',intent:{action:'jump',emotion:'happy',bubble:'还有我的饭碗！我们一起坐好不好？'}},
    {actor:'shiori',intent:{action:'shy',emotion:'shy',bubble:'……我这边也有位置。不是特意留的。'}},
    {actor:'rin',intent:{action:'shy',emotion:'happy',bubble:'书可以等一会儿。你先慢慢吃，我陪你。'}},
  ]},
  {id:'dragon',title:'龙娘才没有等你',cast:['shiori','xia'],origin:'GPT×DeepSeek 群像日常；原创对白',steps:[
    {actor:'xia',intent:{action:'approach',target:'shiori',emotion:'happy',bubble:'小龙娘！我给你留了半碗饭～'}},
    {actor:'shiori',intent:{action:'shy',emotion:'shy',bubble:'……谁要你的半碗饭。你坐过来就行。'}},
    {actor:'xia',intent:{action:'celebrate',emotion:'happy',bubble:'那我们今天也是饭搭子啦！'}},
  ]},
  {id:'grok-gpt',title:'今天也想逗逗前辈',cast:['grok','shiori','gemini'],origin:'Grok→GPT 同人关系线索；原创对白',steps:[
    {actor:'grok',intent:{action:'approach',target:'shiori',emotion:'happy',bubble:'前辈，今天的笑话只给你一个人听。'}},
    {actor:'shiori',intent:{action:'think',emotion:'curious',bubble:'又是什么……好吧，你说。'}},
    {actor:'grok',intent:{action:'jump',emotion:'happy',bubble:'笑话还没想好，想找你玩是真的。'}},
    {actor:'gemini',intent:{action:'wave',emotion:'happy',bubble:'喵～猫猫假装没有听见！'}},
  ]},
  {id:'cat-fox',title:'猫猫与狐狸的账本',cast:['gemini','glm'],origin:'小屋原创 · 星猫与黑狐搭档',steps:[
    {actor:'gemini',intent:{action:'approach',target:'glm',emotion:'curious',bubble:'狐狸小姐，账本里画的小鱼是给谁的？'}},
    {actor:'glm',intent:{action:'think',emotion:'happy',bubble:'某只猫今天的点心预算呀，已经替你留好了。'}},
    {actor:'gemini',intent:{action:'jump',emotion:'happy',bubble:'那猫猫用一个抱抱付账！'}},
    {actor:'glm',intent:{action:'shy',emotion:'shy',bubble:'嗯……这笔买卖，倒也不亏。'}},
  ]},
  {id:'moon-book',title:'月光下的双人书签',cast:['kimi','rin','grok'],origin:'小屋原创 · 陪读与善意打趣',steps:[
    {actor:'kimi',intent:{action:'approach',target:'rin',emotion:'happy',bubble:'这页的句子很好看，想和你一起读。'}},
    {actor:'rin',intent:{action:'read',emotion:'happy',bubble:'好呀。今天你挑故事，我来泡茶。'}},
    {actor:'grok',intent:{action:'wave',emotion:'curious',bubble:'两位老师，讲故事能不能带上我？'}},
    {actor:'kimi',intent:{action:'shy',emotion:'happy',bubble:'当然。我给大家都留了书签。'}},
  ]},
  {id:'rice-budget',title:'大米饭的友情价',cast:['glm','xia','kimi'],origin:'干饭梗与黑狐演绎；原创对白',steps:[
    {actor:'glm',intent:{action:'approach',target:'xia',emotion:'curious',bubble:'大鱼，又添一碗？今天的饭票可不够啦～'}},
    {actor:'xia',intent:{action:'sad',emotion:'sad',bubble:'那……我用洗碗换一碗，可以嘛？'}},
    {actor:'kimi',intent:{action:'wave',emotion:'happy',bubble:'我记下了：她今天已经帮大家摆好了碗。'}},
    {actor:'glm',intent:{action:'celebrate',emotion:'happy',bubble:'好吧，加餐通过。这次算大家请你。'}},
  ]},
  {id:'star-moon',title:'星星跑进了故事书',cast:['gemini','kimi','grok'],origin:'小屋原创 · 灵感与陪读搭档',steps:[
    {actor:'gemini',intent:{action:'approach',target:'kimi',emotion:'happy',bubble:'我想到一个故事！月亮其实是一只大猫窝！'}},
    {actor:'kimi',intent:{action:'read',emotion:'curious',bubble:'那第一页就写：一颗星星来敲门。'}},
    {actor:'grok',intent:{action:'jump',emotion:'happy',bubble:'我申请扮演负责敲门的那颗星星！'}},
    {actor:'kimi',intent:{action:'wave',emotion:'happy',bubble:'好呀。今晚的故事，由我们一起写。'}},
  ]},
];
export function relationshipKey(from:CharacterId,to:CharacterId){return `${from}>${to}`;}
export function defaultBonds(){return Object.fromEntries(Object.entries(socialProfiles).map(([from,p])=>[`${from}>${p.target}`,from==='rin'?65:35]));}
