import {useEffect,useRef,useState} from 'react';
import type {AppState} from './shared/types';
import './cg-moment.css';

const copy={
 'zh-CN':{label:'关系瞬间 · 试映',title:'只给你留的位置',line:'「别动，发饰歪了一点……好了。今天也坐我旁边吧。」',room:'在小屋试看 CG',desktop:'在桌面试看 CG',skip:'跳过',close:'关闭CG',collapse:'收起CG',replay:'继续看',note:'本地模型试片 · 默认静音',fallback:'静帧预览 · 视频未加载',hint:'需要 Claude 和 DeepSeek 在场，且未开启免打扰或专注'},
 en:{label:'Relationship moment · trial',title:'A seat beside me',line:'“Stay still, your hair is a little out of place… there. Sit next to me today?”',room:'Preview CG in room',desktop:'Preview CG on desktop',skip:'Skip',close:'Close CG',collapse:'Collapse CG',replay:'Continue',note:'Local model trial · muted',fallback:'Still preview · video unavailable',hint:'Claude and DeepSeek must be present; DND and focus must be off'},
 ja:{label:'関係のひととき · 試映',title:'あなたのための席',line:'「動かないで、髪飾りが少し……はい。今日も隣に座って？」',room:'小屋でCGを試映',desktop:'デスクトップでCGを試映',skip:'スキップ',close:'CGを閉じる',collapse:'CGをたたむ',replay:'続きを見る',note:'ローカルモデル試作 · 消音',fallback:'静止画プレビュー · 動画未読込',hint:'ClaudeとDeepSeekが在場し、集中・おやすみモードがオフの時に利用できます'},
};
const text=(state:AppState)=>copy[state.settings.locale]??copy['zh-CN'];
export function CGPreviewButtons({state}:{state:AppState}){
 const t=text(state),blocked=state.settings.dnd||!!state.focus||!state.presentIds.includes('rin')||!state.presentIds.includes('xia');
 const preview=(host:'room'|'desktop',button:HTMLButtonElement)=>{button.closest('details')?.removeAttribute('open');void window.garden.dispatch({type:'cg-preview',host});};
 return <details className="cg-preview-buttons" title={t.hint}><summary>✦ {t.label}</summary><div><button disabled={blocked} onClick={e=>preview('room',e.currentTarget)}>{t.room}</button><button disabled={blocked||!state.settings.petsVisible} onClick={e=>preview('desktop',e.currentTarget)}>{t.desktop}</button></div></details>;
}
export function CGMoment({state,host,primary=true}:{state:AppState;host:'room'|'desktop';primary?:boolean}){
 const session=state.cgSession,t=text(state),video=useRef<HTMLVideoElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const[collapsed,setCollapsed]=useState(false),[failed,setFailed]=useState(false);
 const visible=!!session&&session.host===host&&(host!=='desktop'||primary);
 const dismiss=()=>{if(session)void window.garden.dispatch({type:'cg-dismiss',sessionId:session.id});};
 useEffect(()=>{setCollapsed(false);setFailed(false);return()=>clearTimeout(timer.current);},[session?.id]);
 useEffect(()=>{if(!visible)return;const key=(event:KeyboardEvent)=>{if(event.key==='Escape')dismiss();};const hide=()=>{if(document.hidden)dismiss();};document.addEventListener('keydown',key);document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hide);};},[visible,session?.id]);
 useEffect(()=>{if(collapsed)video.current?.pause();else if(visible)void video.current?.play().catch(()=>{});},[collapsed,visible]);
 if(!visible)return null;
 if(collapsed)return <button className={`cg-memory-chip cg-memory-chip--${host}`} onClick={()=>setCollapsed(false)}>♡ {t.title} · {t.replay}</button>;
 return <section className={`cg-moment cg-moment--${host}`} aria-label={t.label} onClick={e=>e.stopPropagation()}>
  <div className="cg-moment-picture"><img src="./cg/rin-xia-hair-v1/poster.png" alt="Claude × DeepSeek"/>{!failed&&<video ref={video} src="./cg/rin-xia-hair-v1/clip.webm" poster="./cg/rin-xia-hair-v1/poster.png" muted autoPlay playsInline onError={()=>setFailed(true)} onEnded={()=>{clearTimeout(timer.current);timer.current=setTimeout(dismiss,3000);}}/>}<span className="cg-moment-label">{t.label}</span><div className="cg-moment-controls"><button aria-label={t.collapse} onClick={()=>setCollapsed(true)}>−</button><button aria-label={t.close} onClick={dismiss}>×</button></div></div>
  <div className="cg-moment-caption"><small>CLAUDE × DEEPSEEK</small><strong>{t.title}</strong><p>{t.line}</p><footer><span>{failed?t.fallback:t.note}</span><button onClick={dismiss}>{t.skip} ›</button></footer></div>
 </section>;
}
