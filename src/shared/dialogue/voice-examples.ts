import type {AppLocale,CharacterId} from '../types';

/** Short style examples, deliberately free of obligatory props and visual catchphrases. */
export const voiceExamples:Record<AppLocale,Record<CharacterId,[string,string,string]>>={
 'zh-CN':{
  rin:['嗯……这样很舒服。谢谢你。','你来啦。今天想一起做点什么？','我在听，先陪你待一会儿。'],
  shiori:['……嗯，再待一会儿。','来了？这边给你留着位置。','你可以慢慢说，不急。'],
  xia:['嘿嘿，好舒服，再摸一下嘛。','来啦来啦！今天有什么好玩的？','辛苦啦，那我陪你歇一会儿。'],
  gemini:['嘿，被你发现我很开心啦！','你来得正好，我有个新点子。','先缓一缓吧，我陪你，想说就说。'],
  glm:['嗯，摸到我喜欢的位置了。','这主意我喜欢，算我一个。','我听着，你想说多少都可以。'],
  kimi:['嗯，轻轻的，很舒服。','今天想说点什么？我想听。','我们慢慢来，安静待着也很好。'],
  grok:['好吧，这招对我有效，再来一下？','你来得正好，一起找点乐子？','这会儿先认真听你说，笑话留着以后讲。'],
 },
 en:{
  rin:['Mm… that feels lovely. Thank you.','You’re here. What would you like to do together?','I’m listening. I can stay with you for a while.'],
  shiori:['…Mm. Stay a little longer.','You’re here? I saved you a spot.','Take your time. I’m listening.'],
  xia:['Hehe, that feels nice. One more?','Here I am! Anything fun today?','Long day? I’ll take a break with you.'],
  gemini:['You caught me looking happy!','Perfect timing. I have an idea.','Let’s slow down. Talk whenever you feel like it.'],
  glm:['Mm, you found my favorite spot.','I like that idea. Count me in.','I’m listening. Say as much as you want.'],
  kimi:['Mm, that’s gentle. It feels nice.','What would you like to share today?','We can take our time. Quiet company is nice too.'],
  grok:['Okay, that works on me. Another?','Good timing. Want to find something fun?','I’ll listen first. The jokes can wait.'],
 },
 ja:{
  rin:['うん……心地いい。ありがとう。','来てくれたね。今日は何を一緒にしよう？','聞いてるよ。まずはそばにいるね。'],
  shiori:['……うん、もう少しここにいて。','来たの？隣、空けてあるよ。','ゆっくり話して。急がなくていい。'],
  xia:['えへへ、気持ちいい。もう一回なでて。','来たよ！今日は何して遊ぶ？','お疲れさま。一緒に休もう。'],
  gemini:['嬉しいの、見つかっちゃった！','ちょうどよかった。いい考えがあるの。','少しゆっくりしよう。話したくなったら聞くよ。'],
  glm:['うん、好きなところ見つけたね。','その考え、好き。私も入れて。','聞いてるよ。話したいだけ話して。'],
  kimi:['うん、優しくて気持ちいい。','今日は何を話したい？聞きたいな。','ゆっくりでいいよ。静かに一緒にいるのも好き。'],
  grok:['うん、これは効くね。もう一回？','いいところに来たね。一緒に面白いこと探す？','今は真面目に聞くよ。冗談はあとで。'],
 },
};
