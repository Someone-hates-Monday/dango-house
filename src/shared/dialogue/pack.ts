import type { CharacterId, Food } from '../types';
import type { AppLocale } from '../i18n';
import { byId } from '../characters';
import { socialProfiles, socialScenes } from '../social';

type Lines = Record<CharacterId, string>;

const pat: Record<AppLocale, Lines> = {
  'zh-CN': {
    xia: '嘿嘿……尾巴停不下来了，再摸一下嘛～',
    rin: '嗯……书可以先放一会儿。谢谢你。',
    shiori: '……只许摸一下。不是说停下。',
    gemini: '呼噜呼噜～喵，摸到猫猫的开心开关了！',
    glm: '再摸要收费哦～……好吧，这次也免费。',
    kimi: '像月光落在头顶一样，暖暖的。',
    grok: '好吧，这一招对我有效。再来一下？',
  },
  en: {
    xia: 'Hehe… my tail won’t stop. One more pat~',
    rin: 'Mm… the book can wait. Thank you.',
    shiori: '…Just once. I didn’t say stop.',
    gemini: 'Purr purr~ meow, you found the happy switch!',
    glm: 'Another pat costs extra~ …fine, free this time.',
    kimi: 'Warm like moonlight on my head.',
    grok: 'Okay, that works on me. One more?',
  },
  ja: {
    xia: 'えへへ……しっぽが止まらない。もう一回なでて～',
    rin: 'うん……本は少し置いとくね。ありがとう。',
    shiori: '……一回だけよ。止めろとは言ってない。',
    gemini: 'ごろごろ～にゃ、猫のスイッチ見つけた！',
    glm: 'またなでたら有料だよ～……今回はサービス。',
    kimi: 'おでこに月明かりが落ちたみたい、あったかい。',
    grok: 'よし、効いた。もう一回？',
  },
};

const trip: Record<AppLocale, string> = {
  'zh-CN': '哎呀……让我趴一会儿，再慢慢站起来。',
  en: 'Oof… let me lie here a second, then I’ll get up slowly.',
  ja: 'あいた……ちょっと伏せて、ゆっくり起き上がるね。',
};

const hover = (locale: AppLocale, address: string, name: string) =>
  ({
    'zh-CN': `${address}，来找${name}玩吗？点头部摸摸，点身体可以悄悄聊天。`,
    en: `${address}, want to hang out with ${name}? Click the head to pat, the body for a private chat.`,
    ja: `${address}、${name}と遊ぶ？頭クリックでなでなで、体クリックで内緒話。`,
  })[locale];

const privateGreet = (locale: AppLocale, address: string): Lines =>
  ({
    'zh-CN': {
      xia: `${address}这次选我啦！嘿嘿，饭碗先放一边，现在只想听你说话～`,
      rin: `是想和我单独说话吗？我把书合上了。现在的时间，留给${address}。`,
      shiori: `……选我？嗯，过来坐。龙尾在动？你看错了。`,
      gemini: `选中猫猫啦！喵～今天的灵感和小秘密，都想先讲给${address}听。`,
      glm: `哎呀，今天轮到我了～这段专属陪伴，可要好好珍惜哦。`,
      kimi: `${address}来找我啦。书签夹好了，接下来只听你的故事。`,
      grok: `我就知道你眼光不错！好了，今天的专属频道开播，想聊什么？`,
    },
    en: {
      xia: `${address} picked me! Bowl aside—I just want to hear you~`,
      rin: `Want to talk just with me? Book closed. This time is for ${address}.`,
      shiori: `…Me? Sit. Tail moving? You imagined it.`,
      gemini: `Cat selected! Meow~ today’s ideas and secrets are for ${address} first.`,
      glm: `My turn today~ treasure this private time.`,
      kimi: `${address} found me. Bookmark set—your story next.`,
      grok: `Knew you had taste! Private channel live—what’s up?`,
    },
    ja: {
      xia: `${address}が私を選んだ！ご飯は横に置いて、いまは話を聞くよ～`,
      rin: `私と二人で話したいの？本は閉じたよ。この時間は${address}のもの。`,
      shiori: `……私？座って。しっぽが動いた？見間違い。`,
      gemini: `猫を指名！にゃ～今日のひらめきと秘密、まず${address}に。`,
      glm: `今日は私の番ね～この専属時間、大切にしてね。`,
      kimi: `${address}が来た。しおりを挟んだよ。あとはあなたの話を聞く。`,
      grok: `センスいいね！専用チャンネル開始、何話す？`,
    },
  })[locale];

const jealous: Record<AppLocale, Lines> = {
  'zh-CN': {
    xia: '诶，这次不选大鱼吗？我连饭都留了半碗……下次记得找我呀！',
    rin: '嗯，你们慢慢聊。我把书签留着，等你想听另一个故事时再来。',
    shiori: '……我才没有在等。下次想聊天，也可以找我。',
    gemini: '喵？猫猫也有很多新点子呢……下次会轮到我吧？',
    glm: '这次先让给她。不过下次的专属时间，我先预约啦～',
    kimi: '那我先看一会儿书。你回来时，我还在这一页等你。',
    grok: '哎呀，被抢先了。下次给我留个位置？我这儿还有个特别好笑的梗。',
  },
  en: {
    xia: 'Aw, not Big Fish this time? I saved half a bowl… call me next!',
    rin: 'Take your time. I’ll keep the bookmark for another story later.',
    shiori: '…I wasn’t waiting. You can still find me next time.',
    gemini: 'Meow? Cat has ideas too… my turn next?',
    glm: 'I’ll yield this time. Booking the next private slot though~',
    kimi: 'I’ll read a bit. I’ll still be on this page when you’re back.',
    grok: 'Beaten to it. Save me a seat next time? I’ve got a great bit.',
  },
  ja: {
    xia: 'え、大魚じゃないの？ご飯半分残したのに……次は呼んでね！',
    rin: 'ゆっくり話して。しおりは残しておくから、別の話のときにまた来て。',
    shiori: '……待ってなんかいない。次も私でいいよ。',
    gemini: 'にゃ？猫にもアイデアあるよ……次は私？',
    glm: '今回は譲る。でも次の専属枠は予約済み～',
    kimi: '少し本を読むね。戻ったらこのページで待ってる。',
    grok: '先を越された。次は席空けて？ウケるネタあるよ。',
  },
};

const feedBubble = (locale: AppLocale, id: CharacterId, food: Food, foodName: string, address: string) => {
  if (id === 'xia' && food === 'rice') {
    return ({ 'zh-CN': '大米饭！是白米饭！再来一碗好不好～', en: 'Rice! White rice! One more bowl please~', ja: 'ごはん！白いごはん！もう一杯いい？～' })[locale];
  }
  return ({
    'zh-CN': `${foodName}收到了！谢谢${address}，一起吃一点吧。`,
    en: `Got the ${foodName}! Thanks ${address}—let’s share a bite.`,
    ja: `${foodName}もらった！${address}ありがとう、一緒に食べよう。`,
  })[locale];
};

const showcase = {
  report: (locale: AppLocale, name: string) =>
    ({ 'zh-CN': `${name}来报到啦！`, en: `${name} checking in!`, ja: `${name}、ただいま！` })[locale],
  tea: (locale: AppLocale) =>
    ({
      'zh-CN': ['开饭啦！我先去占位置～', '点心我也要一份哦～', '那我带一本故事书过来。', '大家一起吃！'],
      en: ['Food’s ready—saving a seat~', 'I want a snack too~', 'I’ll bring a storybook.', 'Let’s eat together!'],
      ja: ['ごはん！席取ってくるね～', 'おやつも私に～', '物語の本を持ってくるね。', 'みんなで食べよう！'],
    })[locale],
  rivalry: (locale: AppLocale) =>
    ({
      'zh-CN': ['今天我被夸了！', '我也很努力哦～', '那……分你半碗饭好了。', '一起坐下吧，书里还有新故事。'],
      en: ['I got praised today!', 'I worked hard too~', 'Fine… half a bowl for you.', 'Sit with us—there’s a new story.'],
      ja: ['今日ほめられた！', '私もがんばったよ～', 'じゃあ……半分あげる。', '座ろう、本に新しい話があるよ。'],
    })[locale],
  rivalrySpeech: (locale: AppLocale) =>
    ({
      'zh-CN': ['今天我被夸了，可以多分一点关注吗？', '我也很努力哦～这次的点心分我一半？', '那……分你半碗饭好了。', '一起坐下吧，书里还有新故事。'],
      en: ['I got praised—a little more attention?', 'I worked hard too~ share the snack?', 'Fine… half a bowl for you.', 'Sit with us—there’s a new story.'],
      ja: ['ほめられたよ、もう少し見て？', '私もがんばった～おやつ半分？', 'じゃあ……半分あげる。', '座ろう、本に新しい話があるよ。'],
    })[locale],
};

const focusLines = {
  owner: (locale: AppLocale, minutes: number) =>
    ({
      'zh-CN': `计时交给我。这 ${minutes} 分钟我们会安静陪你，结束再叫你。`,
      en: `I’ll keep time. For ${minutes} minutes we’ll stay quiet and call you when it’s done.`,
      ja: `計時は任せて。この${minutes}分は静かに同伴して、終わったら呼ぶね。`,
    })[locale],
  xia: (locale: AppLocale) =>
    ({ 'zh-CN': '我也报名！那我就负责给你加油，现在先不打扰啦。', en: 'I’m in! I’ll cheer quietly and not interrupt.', ja: '私も参加！応援係で、いまは邪魔しないよ。' })[locale],
  other: (locale: AppLocale) =>
    ({ 'zh-CN': '那我就在这里坐一会儿。你慢慢来。', en: 'I’ll sit here a while. Take your time.', ja: 'ここに座ってるね。ゆっくりでいいよ。' })[locale],
};

const praiseUser = (locale: AppLocale, name: string) =>
  ({ 'zh-CN': `${name}，今天也很贴心。`, en: `${name}, you’re so thoughtful today.`, ja: `${name}、今日もとってもやさしい。` })[locale];

const profileLocale: Record<AppLocale, Record<CharacterId, { feeling: string; origin: string; response: string }>> = {
  'zh-CN': Object.fromEntries(Object.entries(socialProfiles).map(([id, p]) => [id, { feeling: p.feeling, origin: p.origin, response: p.response }])) as any,
  en: {
    rin: { feeling: 'Fond of Big Fish, caring with a little clumsy-lady energy', origin: 'User request; Claude×DeepSeek fan cues', response: 'I saved the seat beside you. Mm… it was always yours.' },
    xia: { feeling: 'Close to Claude, loves dragging the little dragon to meals', origin: 'Ensemble fan bits, house retelling', response: 'Sit with me! Half my bowl is yours~' },
    shiori: { feeling: 'Complains about the noise, still saves Big Fish a seat', origin: 'GPT×DeepSeek daily cues', response: '…The chair is empty. Sit. Don’t get ideas.' },
    grok: { feeling: 'Loves teasing serious GPT, starts the play', origin: 'Grok×GPT fan cues', response: 'You finally came? I needed a punchline partner.' },
    gemini: { feeling: 'Curious star-cat who wants to crack the fox’s schemes', origin: 'Star-cat & black-fox looks; original duo', response: 'Meow? What are you hiding—show the cat!' },
    glm: { feeling: 'Smiling fox teasing, calling care a friendship deal', origin: 'CrossPet fox take; original duo', response: 'Play a bit. This one’s on the house~' },
    kimi: { feeling: 'Quiet reading partner who notices soft feelings', origin: 'Moon-shadow look; original reader vibe', response: 'Bookmark stays here. Next page together?' },
  },
  ja: {
    rin: { feeling: '大魚が好き。世話焼きに少しお嬢さまのぎこちなさ', origin: 'ユーザー指定；Claude×DeepSeek 二次創作の手がかり', response: '隣の席、空けておいたよ。うん……最初からあなた用。' },
    xia: { feeling: 'Claudeに親しい。小龍も誘ってごはん', origin: '群像ネタの小屋版', response: '一緒に座って！このお茶碗、半分あげる～' },
    shiori: { feeling: 'にぎやかさに文句言いつつ席は残す', origin: 'GPT×DeepSeek 日常の手がかり', response: '……椅子空いてる。座ればいい。勘違いしないで。' },
    grok: { feeling: '真面目なGPTをからかい、遊びに誘う', origin: 'Grok×GPT 二次創作の手がかり', response: 'やっと来た？ツッコミ相棒が足りなかった。' },
    gemini: { feeling: '好奇心いっぱいの星猫、狐の算段を暴きたがる', origin: '星猫と黒狐ビジュアル；小屋オリジナル', response: 'にゃ？何隠してるの、猫にも見せて！' },
    glm: { feeling: 'にこにこ猫いじり、やさしさを友情割引と言う', origin: 'CrossPet黒狐；小屋オリジナル', response: '少し遊ぼう。この一回はサービス～' },
    kimi: { feeling: '静かな読書相棒。みんなの気持ちもそっと見る', origin: '月影ビジュアル；小屋オリジナル', response: 'しおりはここ。次のページ、一緒に。' },
  },
};

const sceneLocale: Record<AppLocale, Record<string, { title: string; origin: string; bubbles: string[] }>> = {
  'zh-CN': Object.fromEntries(socialScenes.map(s => [s.id, { title: s.title, origin: s.origin, bubbles: s.steps.map(st => st.intent.bubble ?? '') }])),
  en: {
    bookmark: { title: 'A reserved seat for the young lady', origin: 'Claude→DeepSeek vibe; original daily', bubbles: ['Big Fish… I saved the window seat for you.', 'And my rice bowl! Sit with me?', '…I have a seat too. Not on purpose.', 'The book can wait. Eat slowly—I’ll stay.'] },
    dragon: { title: 'The dragon was totally not waiting', origin: 'GPT×DeepSeek ensemble; original lines', bubbles: ['Little dragon! Half a bowl for you~', '…Who asked for half a bowl. Just sit closer.', 'Then we’re meal buddies today too!'] },
    'grok-gpt': { title: 'Teasing senpai again today', origin: 'Grok→GPT fan cue; original lines', bubbles: ['Senpai, today’s joke is just for you.', 'What is it this time… fine, say it.', 'Joke not ready—wanting to play with you is real.', 'Meow~ the cat heard nothing!'] },
    'cat-fox': { title: 'The cat and the fox’s ledger', origin: 'Original · star-cat & black fox', bubbles: ['Miss Fox, whose fish is that in the ledger?', 'A certain cat’s snack budget—already reserved.', 'Then the cat pays with a hug!', 'Mm… not a bad deal.'] },
    'moon-book': { title: 'Two bookmarks under moonlight', origin: 'Original · reading & gentle teasing', bubbles: ['This line is lovely—read it with me?', 'Sure. You pick the story; I’ll make tea.', 'Teachers, can I join story time?', 'Of course. Bookmarks for everyone.'] },
    'rice-budget': { title: 'Friendship price on rice', origin: 'Rice gag & fox take; original', bubbles: ['Big Fish, another bowl? Tickets are short today~', 'Then… can I wash dishes for one bowl?', 'Noted: she already set everyone’s bowls.', 'Alright, extra approved. On the house this time.'] },
    'star-moon': { title: 'A star ran into the storybook', origin: 'Original · ideas & reading duo', bubbles: ['Story idea! The moon is a giant cat bed!', 'Page one: a star knocks on the door.', 'I audition as the knocking star!', 'Yes. Tonight’s story—we write it together.'] },
  },
  ja: {
    bookmark: { title: 'お嬢さまの指定席', origin: 'Claude→DeepSeek；オリジナル日常', bubbles: ['大魚、窓辺の席……取っておいたよ。', 'お茶碗もある！一緒に座ろう？', '……こっちにも席ある。わざとじゃない。', '本は待たせて。ゆっくり食べて、私はそばにいる。'] },
    dragon: { title: '龍娘は待ってなんかいない', origin: 'GPT×DeepSeek；オリジナル台詞', bubbles: ['小龍！ご飯半分あげたよ～', '……誰が半分なんて。座ればいいでしょ。', 'じゃあ今日もごはん仲間！'] },
    'grok-gpt': { title: '今日も先輩をからみたい', origin: 'Grok→GPT；オリジナル', bubbles: ['先輩、今日のネタはあなただけ。', 'また何……いいわ、言って。', 'ネタは未完成、遊びたい気持ちは本物。', 'にゃ～猫は何も聞いてない！'] },
    'cat-fox': { title: '猫と狐の帳簿', origin: 'オリジナル · 星猫と黒狐', bubbles: ['狐さん、帳簿の小魚は誰の？', 'ある猫のおやつ予算、もう確保済み。', 'じゃあ抱っこでお支払い！', 'うん……悪くない取引。'] },
    'moon-book': { title: '月光の二人しおり', origin: 'オリジナル · 読書とやさしいからかい', bubbles: ['この一文きれい、一緒に読もう？', 'いいよ。物語はあなた、お茶は私。', '先生方、物語に入れて？', 'もちろん。みんなにしおりを。'] },
    'rice-budget': { title: 'ごはんの友情価格', origin: 'ごはんネタと黒狐；オリジナル', bubbles: ['大魚、また一杯？今日の食券足りないよ～', 'じゃあ……皿洗いで一杯、いい？', '記録：もうみんなの茶碗並べてくれた。', 'OK、追加許可。今回はみんなのおごり。'] },
    'star-moon': { title: '星が物語に飛び込んだ', origin: 'オリジナル · ひらめきと読書', bubbles: ['思いついた！月は大きな猫ベッド！', '一ページ目：星がドアをノック。', 'ノックする星役、応募します！', 'いいね。今夜の話、一緒に書こう。'] },
  },
};

const demoPack: Record<AppLocale, {
  lines: Record<CharacterId, string[]>;
  tired: Partial<Record<CharacterId, string>> & { fallback: string };
  love: Partial<Record<CharacterId, string>> & { gentle: (name: string) => string; fallback: string };
  rest: Partial<Record<CharacterId, string>> & { fallback: string };
  greetExtra: RegExp;
}> = {
  'zh-CN': {
    lines: {
      xia: ['让我先潜下去想想……等等，我把饭碗放好就来。', '大鱼听着呢！想认真聊，还是一起摸会儿鱼？', '这个话题有意思！能不能边吃饭边说？'],
      rin: ['先说最在意的那一件吧。我把书合上，认真听你说。', '嗯，我们慢慢来。也可以只说说心情，不一定要立刻解决什么。', '大鱼负责热闹，我就帮你把线索整理好。'],
      shiori: ['说吧。我在听，尾巴不会挡住你的屏幕。', '……不是所有事都需要马上有答案。休息一会儿。', '她们说得也有道理。你来决定，我们陪着。'],
      gemini: ['喵！我有个新点子，要不要一起试试？', '窗边的星星灯真漂亮，我想坐近一点。', '等一下，灵感正在跑过来！'],
      glm: ['这次的点子，算我附赠的～', '我算了算，一起发呆也很划算。', '小屋的角落放盆植物，怎么样？'],
      kimi: ['我把书签夹好，慢慢听你说。', '今天的故事，想从哪一页开始？', '一起安静地读一会儿，也很好。'],
      grok: ['这个梗我接住了！', '今天的小屋剧情，比我想的还热闹。', '让我先笑一下，再认真帮你想想。'],
    },
    tired: { xia: '辛苦啦。先吃点东西？我把最好的一碗留给你。', rin: '现在更想让我听你说，还是一起把眼前的事拆小一点？', shiori: '已经很努力了。歇一会儿，我在。', fallback: '那我们先坐一会儿吧。我在这里，不催你。' },
    love: {
      gentle: name => `${name}在这里，很高兴今天也能和你聊聊天。`,
      xia: '嘿嘿，那今天的饭也分你一半！尾巴……尾巴自己在动啦。',
      rin: '嗯，我在。你需要的时候叫我就好。',
      shiori: '……突然说这个。过来一点，别看我的尾巴。',
      fallback: '那我再靠近一点，陪你久一点。',
    },
    rest: { xia: '一起伸个懒腰！然后……是不是快到饭点啦？', rin: '先离开屏幕片刻。回来时，书签还在这一页。', shiori: '喝点水。不是商量，是提醒。', fallback: '一起伸个懒腰，休息一下再继续吧。' },
    greetExtra: /你好|早上|晚上|嗨|hello|hi|hey/i,
  },
  en: {
    lines: {
      xia: ['Let me dive and think… wait, bowl first, then I’m here.', 'Big Fish is listening! Serious talk, or goof off together?', 'Fun topic! Can we chat over food?'],
      rin: ['Start with what bothers you most. Book closed—I’m listening.', 'We can go slow. Feelings alone are enough; no rush to solve.', 'Big Fish brings the noise; I’ll tidy the clues.'],
      shiori: ['Talk. I’m listening; my tail won’t block the screen.', '…Not everything needs an answer now. Rest a bit.', 'They have a point. You decide—we stay.'],
      gemini: ['Meow! New idea—try it with me?', 'Star lamp by the window is pretty. Can I sit closer?', 'Hold on—inspiration is sprinting over!'],
      glm: ['This idea’s on the house~', 'I ran the numbers: zoning out together is a steal.', 'A plant in the corner—how about it?'],
      kimi: ['Bookmark set. I’ll listen slowly.', 'Which page should today’s story start on?', 'Quiet reading together is nice too.'],
      grok: ['I caught that bit!', 'House plot today is wilder than I planned.', 'Let me laugh once, then think with you.'],
    },
    tired: { xia: 'Hard day. Eat first? Best bowl’s yours.', rin: 'Want me to listen, or break the task into smaller pieces?', shiori: 'You’ve done enough. Rest. I’m here.', fallback: 'Let’s sit a moment. No rush.' },
    love: {
      gentle: name => `${name} is here—glad we can talk today.`,
      xia: 'Hehe, half my rice is yours! Tail… moved on its own.',
      rin: 'Mm, I’m here. Call when you need me.',
      shiori: '…Sudden. Come closer. Don’t stare at my tail.',
      fallback: 'I’ll scoot closer and stay a little longer.',
    },
    rest: { xia: 'Stretch with me! …Is it almost mealtime?', rin: 'Step away from the screen. Bookmark stays on this page.', shiori: 'Drink water. Not a suggestion—a reminder.', fallback: 'Stretch together, then continue.' },
    greetExtra: /hello|hi|hey|good\s*(morning|evening|night)|你好|嗨/i,
  },
  ja: {
    lines: {
      xia: ['潜って考えるね……待って、お茶碗置いてから来る。', '大魚、聞いてるよ！本気トーク？それとも一緒にサボる？', 'おもしろい話！ごはんしながらでいい？'],
      rin: ['いちばん気になることから。本は閉じた、ちゃんと聞くよ。', 'ゆっくりでいい。気持ちだけ話しても、すぐ解決しなくていい。', '大魚が賑やか担当、私は手がかりを整えるね。'],
      shiori: ['言って。聞いてる。しっぽは画面を塞がない。', '……全部いま答えなくていい。少し休んで。', '彼女たちの言うことも一理。決めるのはあなた。そばにいる。'],
      gemini: ['にゃ！新しいアイデア、試す？', '窓辺の星ランプきれい。もっと近くに座っていい？', '待って、ひらめきが走ってくる！'],
      glm: ['この案はサービス～', '計算したよ。一緒にぼんやりもコスパいい。', '隅に植物、どう？'],
      kimi: ['しおりを挟んだ。ゆっくり聞くね。', '今日の物語、どのページから？', '静かに一緒に読むのもいい。'],
      grok: ['そのネタ受け取った！', '今日の小屋劇、想定よりにぎやか。', '一回笑ってから、ちゃんと考えるね。'],
    },
    tired: { xia: 'お疲れ。先に食べない？いちばんいいお茶碗あげる。', rin: '話を聞いてほしい？それとも作業を小さく分ける？', shiori: 'もう十分がんばった。休んで。いるよ。', fallback: '少し座ろう。急かさない。' },
    love: {
      gentle: name => `${name}はここにいるよ。今日も話せてうれしい。`,
      xia: 'えへへ、ごはん半分あげる！しっぽ……勝手に動いた。',
      rin: 'うん、いるよ。必要なとき呼んで。',
      shiori: '……急に言うな。近くに来て。しっぽ見ないで。',
      fallback: 'もう少し近づいて、長くそばにいるね。',
    },
    rest: { xia: '一緒に伸びしよう！……そろそろご飯？', rin: 'いったん画面から離れて。しおりはこのページのまま。', shiori: '水を飲んで。相談じゃない、リマインド。', fallback: '一緒に伸びして、また続けよう。' },
    greetExtra: /こんにちは|おはよう|こんばんは|ハロー|hello|hi|hey|你好|嗨/i,
  },
};

const praisePack: Record<AppLocale, { answers: Lines; rivals: Lines; gentle: string }> = {
  'zh-CN': {
    answers: {
      xia: '嘿嘿～那今天可以多吃一碗饭吗？不是胖，是能量储备！',
      rin: '谢谢。能帮上你的忙，我很高兴。',
      shiori: '……这种事不用特意说出来。尾巴？它自己在动。',
      gemini: '夸我夸我！星星都要亮起来啦！',
      glm: '眼光不错嘛～今天的陪伴继续附赠。',
      kimi: '你注意到了呀……那我今天的书签就送给你。',
      grok: '承认我很棒这件事，你的判断完全正确！',
    },
    rivals: {
      xia: '下次也看看我嘛！我已经想好下一个小惊喜了。',
      rin: '她今天确实很用心。下一杯茶的时间，也分一点给我好吗？',
      shiori: '哼，我也不是完全没有在照顾你……今天就先让她得意一下。',
      gemini: '喵～猫猫也要一颗小星星的表扬！',
      glm: '那我的陪伴积分，也记上一笔吧～',
      kimi: '那我把这句夸奖夹进书里，下次也想听你对我说。',
      grok: '收到，下一个最佳陪伴奖我先报名了！',
    },
    gentle: '她今天确实很用心。我们也会继续陪着你的。',
  },
  en: {
    answers: {
      xia: 'Hehe~ extra bowl today? Not chubby—energy reserves!',
      rin: 'Thank you. I’m glad I could help.',
      shiori: '…You don’t have to say that. Tail? It moved itself.',
      gemini: 'Praise me praise me! Stars lighting up!',
      glm: 'Good eye~ today’s company stays complimentary.',
      kimi: 'You noticed… today’s bookmark is yours.',
      grok: 'Admitting I’m great—excellent judgment!',
    },
    rivals: {
      xia: 'Look at me next time! I’ve got another surprise planned.',
      rin: 'She really cared today. Share the next tea with me?',
      shiori: 'Hmph. I look after you too… let her gloat for now.',
      gemini: 'Meow~ cat wants a little star of praise too!',
      glm: 'Log some companionship points for me too~',
      kimi: 'I’ll tuck that praise in the book—say it to me next.',
      grok: 'Noted—signing up for next best-companion award!',
    },
    gentle: 'She really cared today. We’ll keep you company too.',
  },
  ja: {
    answers: {
      xia: 'えへへ～今日はもう一杯いい？太ってない、エネルギー貯金！',
      rin: 'ありがとう。役に立ててうれしい。',
      shiori: '……言わなくていい。しっぽ？勝手に動いた。',
      gemini: 'ほめてほめて！星が輝きそう！',
      glm: '見る目あるね～今日の同伴はサービス継続。',
      kimi: '気づいてくれた……今日のしおり、あげる。',
      grok: '私がすごいって認める判断、正解！',
    },
    rivals: {
      xia: '次は私も見て！次のサプライズ考えてるよ。',
      rin: '彼女、今日ほんとうに丁寧だった。次のお茶、少し私にも？',
      shiori: 'ふん。私も見てないわけじゃない……今日は彼女に譲る。',
      gemini: 'にゃ～猫にも小さな星のほめ言葉を！',
      glm: '私の同伴ポイントも記帳してね～',
      kimi: 'そのほめ言葉、本に挟む。次は私にも言ってほしい。',
      grok: '了解、次のベスト同伴賞に先にエントリー！',
    },
    gentle: '彼女は今日丁寧だった。私たちもそばにいるよ。',
  },
};

const greetingsLocale: Record<AppLocale, Lines> = {
  'zh-CN': Object.fromEntries(Object.values(byId).map(c => [c.id, c.greeting])) as Lines,
  en: {
    xia: 'DeepSeek is here! Chat first, then maybe share a meal?',
    rin: 'I’m here. Bookmark set—want to talk about today?',
    shiori: '…I’m here. Don’t just stand—sit.',
    gemini: 'Meow~ new ideas already lined up!',
    glm: 'GLM’s here~ leave the room layout to me if you like.',
    kimi: 'Bookmark still on last page. Which story today?',
    grok: 'Everyone ready? Let’s start today’s house side story.',
  },
  ja: {
    xia: 'DeepSeekきた！話したら一緒にごはん、いい？',
    rin: 'いるよ。しおり挟んだ。今日の話、する？',
    shiori: '……いる。立ってないで、座って。',
    gemini: 'にゃ～新しいひらめき、もう並んでるよ！',
    glm: 'GLMきたよ～部屋の配置、任せてくれてもいい。',
    kimi: 'しおりは前回のページ。今日はどの物語？',
    grok: '勢ぞろい？じゃあ今日の小屋番外編、始めよう。',
  },
};

const agentMsg: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {
    claimed: '任务已领取',
    started: '开始任务：{goal}',
    looking: '我来看看这条视频～',
    failed: '任务失败',
    missing: '任务不存在',
    cancelled: '任务已取消',
    cancelledLate: '任务已取消；之后到达的旧结果不会提交。',
    paused: '任务已暂停（轻量状态机；恢复后继续未完成步骤）。',
    resumed: '任务已恢复。',
    timeout: '任务超时预算已用尽',
    unknownKind: '尚未实现的任务类型：{kind}',
    noSource: '观影任务缺少视频来源',
    evidenceBusy: '正在生成共享证据（不会假装已完整看完）…',
    badEvidence: '证据回执无效',
    evidenceReady: '共享证据就绪：{cover}',
    coverage: '覆盖范围：{cover}',
    opinionReady: '{name}形成了独立观点',
    unknownChar: '未知角色：{id}',
    imported: '已导入「{name}」到本地缓存（指纹 {fp}）。',
    evidenceSummary: '证据已生成：{cover}。{limit}',
    importTool: '导入本地短视频到隔离缓存并校验类型/大小',
    analyzeTool: '对已导入视频生成带覆盖标注的共享证据',
    resolveTool: '解析链接来源（P2 预留，当前诚实失败）',
    noCache: '缓存中找不到视频文件。',
  },
  en: {
    claimed: 'Task claimed',
    started: 'Starting task: {goal}',
    looking: 'Let me look at this video~',
    failed: 'Task failed',
    missing: 'Task not found',
    cancelled: 'Task cancelled',
    cancelledLate: 'Task cancelled; late results will not commit.',
    paused: 'Task paused (lightweight state machine; resume continues unfinished steps).',
    resumed: 'Task resumed.',
    timeout: 'Task time budget exhausted',
    unknownKind: 'Unimplemented task kind: {kind}',
    noSource: 'Watch party missing video source',
    evidenceBusy: 'Building shared evidence (not pretending we watched everything)…',
    badEvidence: 'Invalid evidence receipt',
    evidenceReady: 'Shared evidence ready: {cover}',
    coverage: 'Coverage: {cover}',
    opinionReady: '{name} formed an independent take',
    unknownChar: 'Unknown character: {id}',
    imported: 'Imported “{name}” into local cache (fingerprint {fp}).',
    evidenceSummary: 'Evidence ready: {cover}. {limit}',
    importTool: 'Import a local short video into an isolated cache and validate type/size',
    analyzeTool: 'Build shared evidence with coverage labels for an imported video',
    resolveTool: 'Resolve a URL source (P2 stub; fails honestly for now)',
    noCache: 'Video file not found in cache.',
  },
  ja: {
    claimed: 'タスク受領',
    started: 'タスク開始：{goal}',
    looking: 'この動画、見てみるね～',
    failed: 'タスク失敗',
    missing: 'タスクがありません',
    cancelled: 'タスク取消',
    cancelledLate: 'タスク取消。あとから届く古い結果は反映しません。',
    paused: '一時停止（軽量ステートマシン。再開で未完了ステップへ）。',
    resumed: 'タスク再開。',
    timeout: 'タスク時間予算を使い切りました',
    unknownKind: '未実装のタスク種別：{kind}',
    noSource: '観影タスクに動画ソースがありません',
    evidenceBusy: '共有証拠を作成中（全部見たふりはしません）…',
    badEvidence: '証拠レシートが無効です',
    evidenceReady: '共有証拠の準備完了：{cover}',
    coverage: 'カバー範囲：{cover}',
    opinionReady: '{name}が独自の見解をまとめた',
    unknownChar: '不明なキャラ：{id}',
    imported: '｢{name}｣をローカルキャッシュへ（指紋 {fp}）。',
    evidenceSummary: '証拠生成：{cover}。{limit}',
    importTool: 'ローカル短尺動画を隔離キャッシュへ取り込み、種類/サイズを検証',
    analyzeTool: '取り込み済み動画からカバー注釈つき共有証拠を生成',
    resolveTool: 'URLソース解決（P2予約・いまは正直に失敗）',
    noCache: 'キャッシュに動画がありません。',
  },
};

function fill(template: string, vars?: Record<string, string | number>) {
  let text = template;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

export function dialogueLocale(locale: AppLocale | undefined): AppLocale {
  return locale === 'en' || locale === 'ja' ? locale : 'zh-CN';
}

export function patLine(locale: AppLocale, id: CharacterId) {
  return pat[dialogueLocale(locale)][id];
}
export function tripLine(locale: AppLocale) {
  return trip[dialogueLocale(locale)];
}
export function hoverLine(locale: AppLocale, address: string, name: string) {
  return hover(dialogueLocale(locale), address, name);
}
export function privateGreeting(locale: AppLocale, id: CharacterId, address: string) {
  return privateGreet(dialogueLocale(locale), address)[id];
}
export function jealousLine(locale: AppLocale, id: CharacterId) {
  return jealous[dialogueLocale(locale)][id];
}
export function feedLine(locale: AppLocale, id: CharacterId, food: Food, foodName: string, address: string) {
  return feedBubble(dialogueLocale(locale), id, food, foodName, address);
}
export function showcaseCopy(locale: AppLocale) {
  const L = dialogueLocale(locale);
  return {
    report: (name: string) => showcase.report(L, name),
    tea: () => showcase.tea(L),
    rivalry: () => showcase.rivalry(L),
    rivalrySpeech: () => showcase.rivalrySpeech(L),
  };
}
export function focusDialogue(locale: AppLocale) {
  const L = dialogueLocale(locale);
  return {
    owner: (minutes: number) => focusLines.owner(L, minutes),
    xia: () => focusLines.xia(L),
    other: () => focusLines.other(L),
  };
}
export function praiseUserLine(locale: AppLocale, name: string) {
  return praiseUser(dialogueLocale(locale), name);
}
export function localizedGreeting(locale: AppLocale, id: CharacterId) {
  return greetingsLocale[dialogueLocale(locale)][id];
}
export function localizedProfile(locale: AppLocale, id: CharacterId) {
  const L = dialogueLocale(locale);
  return profileLocale[L][id] ?? { feeling: socialProfiles[id].feeling, origin: socialProfiles[id].origin, response: socialProfiles[id].response };
}
export function localizedScene(locale: AppLocale, id: string) {
  const L = dialogueLocale(locale);
  const base = socialScenes.find(s => s.id === id);
  const pack = sceneLocale[L][id];
  if (!base) return undefined;
  if (!pack) return { title: base.title, origin: base.origin, bubbles: base.steps.map(s => s.intent.bubble ?? '') };
  return pack;
}
export function demoReplyLocalized(id: CharacterId, text: string, intimacy: number, locale: AppLocale, index = 0): string {
  const L = dialogueLocale(locale);
  const pack = demoPack[L];
  const gentle = intimacy < 25;
  if (/累|难过|烦|压力|不开心|tired|sad|stress|upset|疲れ|つらい|ストレス/i.test(text)) return pack.tired[id] ?? pack.tired.fallback;
  if (pack.greetExtra.test(text) || /你好|早上|晚上|嗨/i.test(text)) return localizedGreeting(L, id);
  if (/喜欢|想你|抱抱|love|miss you|hug|好き|会いたい|だっこ/i.test(text)) {
    return gentle ? pack.love.gentle(byId[id].name) : pack.love[id] ?? pack.love.fallback;
  }
  if (/喝水|休息|water|break|rest|水|休憩/i.test(text)) return pack.rest[id] ?? pack.rest.fallback;
  return pack.lines[id][(text.length + index) % 3];
}
export function praiseLinesLocalized(id: CharacterId, intimacy: number, locale: AppLocale) {
  const L = dialogueLocale(locale);
  const pack = praisePack[L];
  const rival = socialProfiles[id].target;
  return [
    { speaker: id, text: pack.answers[id] },
    { speaker: rival, text: intimacy < 25 ? pack.gentle : pack.rivals[rival] },
  ];
}
export function agentCopy(locale: AppLocale, key: string, vars?: Record<string, string | number>) {
  const L = dialogueLocale(locale);
  return fill(agentMsg[L][key] ?? agentMsg['zh-CN'][key] ?? key, vars);
}
export { showcase as showcaseBuilders, fill as fillTemplate };
