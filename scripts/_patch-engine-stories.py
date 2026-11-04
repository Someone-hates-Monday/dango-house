from pathlib import Path

p = Path("electron/engine.ts")
text = p.read_text(encoding="utf-8")

# imports
old_imp = "import { inferCastPreset, presentForPreset, speakingCast, presentCast, isPresent, isSpeaking, normalizePresentIds } from '../src/shared/cast';"
new_imp = """import { inferCastPreset, presentForPreset, speakingCast, presentCast, isPresent, isSpeaking, normalizePresentIds } from '../src/shared/cast';
import { SceneDirector } from '../src/shared/scene-director';
import { pushCompanionEvent, clearCompanionEvents } from '../src/shared/events';
import { planChoseHer, planSeatShare, planStarFox, planStory, choseHerRivals, privateReturnLine, rivalLine } from '../src/shared/companion-stories';
import { bumpBond } from '../src/shared/bonds';"""
if old_imp not in text:
    raise SystemExit("import missing")
text = text.replace(old_imp, new_imp, 1)

# scene field -> director
text = text.replace(
    "  private scene: {at:number;actor:CharacterId;intent:AvatarIntent;speech?:string}[] = [];",
    "  private director = new SceneDirector();\n  /** @deprecated mirror of director.pending for older helpers */\n  private get scene() { return this.director.pending(); }\n  private set scene(steps: {at:number;actor:CharacterId;intent:AvatarIntent;speech?:string}[]) {\n    const cast = [...new Set(steps.map(s => s.actor))];\n    this.director.replaceRaw(steps, { id: `raw-${Date.now()}`, source: 'legacy', priority: 'reaction', cast }, Date.now());\n  }",
    1,
)

# ensure companionEvents in ctor
text = text.replace(
    "    if (!this.state.characterProviders) this.state.characterProviders = {};",
    "    if (!this.state.characterProviders) this.state.characterProviders = {};\n    if (!Array.isArray(this.state.companionEvents)) this.state.companionEvents = [];",
    1,
)

# stop() should clear director - find stop method
if "stop() {" in text or "stop(){" in text:
    text = text.replace(
        "this.scene = [];",
        "this.director.clear();",
    )

# private-open block replace
old_po = """      case 'private-open': {
        this.stop();
        if(!ids.includes(action.id))return;this.state.selected=action.id;const now=Date.now();if(this.privateOpened?.id===action.id&&now-this.privateOpened.at<20000){this.publish();return;}this.privateOpened={id:action.id,at:now};this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);
        const address=this.state.relationship.address||(this.locale()==='en'?'you':this.locale()==='ja'?'あなた':'你');
        const greeting=privateGreeting(this.locale(),action.id,address);
        applyFavor(this.state,action.id,0);
        this.perform(action.id,{action:'celebrate',emotion:'happy',bubble:greeting.slice(0,52),duration:9},'local',now,{kind:'chat',startedAt:now});this.addPrivate(action.id,action.id,greeting);
        this.scene=speakingCast(this.state).filter(id=>id!==action.id).slice(0,2).map((actor,i)=>({at:now+900+i*1100,actor,intent:{action:i===0?'approach':'shy',target:i===0?action.id:undefined,emotion:'shy',bubble:jealousLine(this.locale(),actor),duration:8}}));
        this.queueRivalryEscalation(action.id,now);
        this.publish();return;
      }"""

new_po = """      case 'private-open': {
        this.stop();
        if(!ids.includes(action.id))return;
        if(!isPresent(this.state,action.id)){
          this.add('system', this.t('cast.needInvite',{name:byId[action.id].name}), 'notice');
          this.publish();return;
        }
        this.state.selected=action.id;const now=Date.now();
        if(this.privateOpened?.id===action.id&&now-this.privateOpened.at<20000){this.publish();return;}
        this.privateOpened={id:action.id,at:now};
        this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);
        const address=this.state.relationship.address||(this.locale()==='en'?'you':this.locale()==='ja'?'あなた':'你');
        const greeting=privateGreeting(this.locale(),action.id,address);
        applyFavor(this.state,action.id,0);
        this.perform(action.id,{action:'celebrate',emotion:'happy',bubble:greeting.slice(0,52),duration:9},'local',now,{kind:'chat',startedAt:now});
        this.addPrivate(action.id,action.id,greeting);
        const plan=planChoseHer(this.state,action.id,now);
        if(plan){
          const steps=plan.beats.map(b=>({at:now+b.atOffset,actor:b.actor,intent:b.intent,speech:b.speech}));
          this.director.schedule({id:`chose-${action.id}-${now}`,cast:plan.cast,source:'chose-her',priority:'user',steps},now);
          this.state.companionEvents=pushCompanionEvent(this.state.companionEvents,{at:now,kind:'chose-companion',actors:plan.cast,trigger:'private-open',result:plan.variant,recall:plan.recall});
        }
        this.queueRivalryEscalation(action.id,now);
        this.publish();return;
      }
      case 'private-return': {
        if(!ids.includes(action.id))return;
        const now=Date.now();
        const rivals=choseHerRivals(this.state,action.id);
        const line=privateReturnLine(action.id,rivals,this.state.companionEvents,this.state.settings.pairTone??'warm');
        if(isSpeaking(this.state,action.id)||isPresent(this.state,action.id)){
          this.perform(action.id,{action:'wave',emotion:'happy',bubble:line.slice(0,52),duration:8},'local',now);
          this.add(action.id,line);
        }
        this.state.companionEvents=pushCompanionEvent(this.state.companionEvents,{at:now,kind:'private-return',actors:[action.id,...rivals],trigger:'private-return',result:'wrap',recall:line.slice(0,120)});
        this.privateOpened=null;
        this.publish();return;
      }
      case 'companion-story': {
        const now=Date.now();
        const storyId=action.id==='chose-her-return'?'chose-her':action.id;
        if(action.id==='chose-her-return'){
          await this.dispatch({type:'private-return',id:action.favored&&ids.includes(action.favored)?action.favored:this.state.selected});
          return;
        }
        let plan=planStory(this.state,storyId as 'chose-her'|'seat-share'|'star-fox',now);
        if(action.id==='chose-her'&&action.favored&&ids.includes(action.favored)){
          const prev=this.state.selected;this.state.selected=action.favored;plan=planChoseHer(this.state,action.favored,now);this.state.selected=prev;
        }
        if(!plan||!plan.beats.length){this.add('system',this.t('cast.storySkip'),'notice');this.publish();return;}
        if(!this.director.canSchedule(plan.id,now)&&plan.id!=='chose-her'){this.add('system',this.t('cast.storyCooldown'),'notice');this.publish();return;}
        const steps=plan.beats.map(b=>({at:now+b.atOffset,actor:b.actor,intent:b.intent,speech:b.speech}));
        this.director.schedule({id:`${plan.id}-${now}`,cast:plan.cast,source:plan.id,priority:'user',steps,onComplete:{kind:plan.id,actors:plan.cast,recall:plan.recall}},now);
        if(plan.bondBump){
          bumpBond(this.state.bonds,plan.bondBump.a,plan.bondBump.b,plan.bondBump.delta);
          bumpBond(this.state.bonds,plan.bondBump.b,plan.bondBump.a,Math.max(1,Math.floor(plan.bondBump.delta/2)));
        }
        const kind=plan.id==='seat-share'?'seat-share':plan.id==='star-fox'?'star-fox-care':'other';
        this.state.companionEvents=pushCompanionEvent(this.state.companionEvents,{at:now,kind,actors:plan.cast,trigger:'companion-story',result:plan.variant,recall:plan.recall});
        this.tick(now);
        this.publish();return;
      }
      case 'clear-companion-events': {
        this.state.companionEvents=clearCompanionEvents();
        break;
      }"""

if old_po not in text:
    raise SystemExit("private-open missing")
text = text.replace(old_po, new_po, 1)

# tick due scene handling - replace scene due loop
old_due = "for(const item of due){if(!isSpeaking(this.state,item.actor)||(item.intent.target&&ids.includes(item.intent.target as CharacterId)&&!isSpeaking(this.state,item.intent.target as CharacterId)))continue;try{this.perform(item.actor,item.intent,'local',now);if(item.speech)this.add(item.actor,item.speech);}catch{}}"
# Find actual due line
import re
m = re.search(r"const due=this\.scene\.filter\(.*?for\(const item of due\)\{.*?;\}", text, re.S)
if not m:
    # try simpler
    idx = text.find("for(const item of due){")
    if idx < 0:
        raise SystemExit("due loop missing")
    print("found due at", idx)
else:
    print("regex due ok")

# Replace stop clearing - already did scene=[]
# Fix cast-present to clear director
text = text.replace(
    "this.scene = this.scene.filter(item => item.actor !== action.id && item.intent.target !== action.id);",
    "this.director.dropMissing(this.state.presentIds);",
    1,
)
text = text.replace(
    """          this.scene = this.scene.filter(item =>
            this.state.presentIds.includes(item.actor) &&
            (!item.intent.target || this.state.presentIds.includes(item.intent.target as CharacterId) || !ids.includes(item.intent.target as CharacterId))
          );""",
    "          this.director.dropMissing(this.state.presentIds);",
    1,
)

# tick: use director.due
# Find: const due=this.scene.filter
old_tick_scene = None
for line in text.splitlines():
    if "const due=" in line and "scene" in line:
        old_tick_scene = line.strip()
        break
print("due line:", old_tick_scene)

p.write_text(text, encoding="utf-8")
print("partial patch written; due loop needs manual fix if needed")
