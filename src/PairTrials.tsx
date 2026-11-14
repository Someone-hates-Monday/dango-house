import type {AppState,CgAssetId} from './shared/types';
import {isPresent} from './shared/cast';
import {cgClip} from './shared/cg-catalog';
import './cg-moment.css';

function clipReady(state:AppState,asset:CgAssetId){
  return !state.settings.dnd&&!state.focus&&cgClip(asset).participants.every(id=>isPresent(state,id));
}

/** Claude×DeepSeek beats — stories/yuri settle into CG; manual rows still meet+talk then play. */
export function PairTrials({state}:{state:AppState}){
  const pair=isPresent(state,'rin')&&isPresent(state,'xia')&&!state.settings.dnd&&!state.focus;
  const send=(action:Parameters<typeof window.garden.dispatch>[0])=>void window.garden.dispatch(action);
  const cg=(asset:CgAssetId)=>clipReady(state,asset);
  return <div className="cg-pair-trials" data-pair="rin-xia">
    <span>小屋里的亲密时刻</span>
    <button disabled={!pair} onClick={()=>send({type:'companion-story',id:'seat-share'})}>
      一起坐坐
      <small>给她留一个身旁的位置</small>
    </button>
    <button disabled={!pair||state.settings.pairRomance===false} onClick={()=>send({type:'yuri-scene',id:'rin-xia-seat'})}>
      和她贴贴
      <small>先靠近，再安静地依偎一会儿</small>
    </button>
    <button disabled={!cg('rin-xia-hair-v1')} onClick={()=>send({type:'cg-preview',host:'room'})}>
      整理发饰（小屋）
      <small>先靠近，替她理好发饰</small>
    </button>
    <button disabled={!cg('rin-xia-hair-v1')||!state.settings.petsVisible} onClick={()=>send({type:'cg-preview',host:'desktop'})}>
      整理发饰（桌面）
      <small>在桌面上，也能陪她待一会儿</small>
    </button>
    <button disabled={!cg('rin-xia-window-seat-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'rin-xia-window-seat-t1'})}>
      窗边留座（小屋）
      <small>想看看她们接下来的故事吗？</small>
    </button>
    <button disabled={!cg('rin-xia-bookmark-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'rin-xia-bookmark-t1'})}>
      共读书签（小屋）
      <small>想看看她们接下来的故事吗？</small>
    </button>
    <button disabled={!cg('rin-xia-share-bowl-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'rin-xia-share-bowl-t1'})}>
      递半碗（小屋）
      <small>她愿意把这一碗分享给你</small>
    </button>
    <button disabled={!cg('rin-xia-fish-leads-t2')} onClick={()=>send({type:'cg-preview',host:'room',asset:'rin-xia-fish-leads-t2'})}>
      鱼先靠肩（小屋）
      <small>鱼主动靠近，她会怎样回应？</small>
    </button>
    <button disabled={!cg('rin-xia-cheek-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'rin-xia-cheek-t1'})}>
      贴脸相依（小屋）
      <small>想看看她们接下来的故事吗？</small>
    </button>
    <button disabled={!cg('xia-reach-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'xia-reach-t1'})}>
      伸手邀你（小屋）
      <small>Claude 想牵你的手</small>
    </button>
    <button disabled={!cg('gpt-close-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'gpt-close-t1'})}>
      龙娘近景（小屋）
      <small>她有话想悄悄对你说</small>
    </button>
    <button disabled={!cg('rin-xia-welcome-t1')} onClick={()=>send({type:'cg-preview',host:'room',asset:'rin-xia-welcome-t1'})}>
      中间留座（小屋）
      <small>想看看她们接下来的故事吗？</small>
    </button>
    <button disabled={!pair} onClick={()=>send({type:'companion-visit',id:'rin',target:'xia'})}>
      去找她说说话
      <small>靠近、聊聊，再一起待一会儿</small>
    </button>
  </div>;
}
