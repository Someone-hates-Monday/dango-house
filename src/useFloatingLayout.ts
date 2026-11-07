import {useEffect} from 'react';
import './floating-layout.css';
import {placeFloating,type FloatRect} from './shared/floating-layout';
let users=0,dispose:(()=>void)|undefined;
const rect=(e:Element):FloatRect=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,width:r.width,height:r.height};};
function start(){
 let frame=0,last=0;
 const titles=new Map<HTMLElement,string|null>();
 const tick=(now:number)=>{frame=requestAnimationFrame(tick);if(now-last<140)return;last=now;
  for(const [e,title] of titles){if(title===null)e.removeAttribute('title');else e.title=title;}titles.clear();
  const viewport={left:8,top:8,width:Math.max(1,innerWidth-16),height:Math.max(1,innerHeight-16)};
  const shown=(e:HTMLElement)=>e.getClientRects().length>0&&getComputedStyle(e).display!=='none';
  const panels=[...document.querySelectorAll<HTMLElement>('.companion-interactions.compact[open] > .companion-panel')].filter(shown);
  const cgs=[...document.querySelectorAll<HTMLElement>('.cg-moment,.cg-memory-chip')].filter(shown);
  const bubbles=[...document.querySelectorAll<HTMLElement>('.pet-bubble,.room-speech')].filter(shown);
  const tools=[...document.querySelectorAll<HTMLElement>('.pet-tools')].filter(e=>shown(e)&&Number(getComputedStyle(e).opacity)>.5).map(rect);
  const occupied:FloatRect[]=[...tools];
  for(const e of [...panels,...cgs,...bubbles]){
   e.style.translate='none';e.style.visibility='';e.removeAttribute('data-space-hidden');
   const isPanel=panels.includes(e),isCG=cgs.includes(e);
   if(isPanel){e.style.maxHeight=`${Math.min(310,viewport.height)}px`;e.style.maxWidth=`${viewport.width}px`;}
   const stage=e.closest('.dollhouse');const bounds=stage?(()=>{const s=rect(stage);return{left:Math.max(8,s.left+8),top:Math.max(8,s.top+8),width:Math.max(1,Math.min(innerWidth-8,s.left+s.width-8)-Math.max(8,s.left+8)),height:Math.max(1,Math.min(innerHeight-8,s.top+s.height-8)-Math.max(8,s.top+8))};})():viewport;
   const natural=rect(e);
   const bodies=[...document.querySelectorAll<HTMLElement>('.desktop-pet .pet-body,.room-character')].filter(shown).map(rect);
   const preferred=natural;
   const placed=placeFloating(preferred,bounds,[...occupied,...bodies]);
   // CG yields to an explicit menu when space is exhausted; it pauses through
   // its existing collapse control instead of hiding an interactive video.
   if(!placed){
    if(isCG&&e.matches('.cg-moment')&&panels.length){e.querySelector<HTMLButtonElement>('.cg-moment-controls button')?.click();continue;}
    if(!isPanel&&!isCG){e.style.visibility='hidden';e.dataset.spaceHidden='true';const owner=e.closest('.desktop-pet,.room-character');const target=owner?.querySelector<HTMLElement>('.pet-body')??owner as HTMLElement|null;if(target){titles.set(target,target.getAttribute('title'));target.title=[target.title,e.textContent].filter(Boolean).join('\n');}continue;}
   }
   const p=placed??{...natural,left:Math.max(bounds.left,Math.min(bounds.left+bounds.width-natural.width,natural.left)),top:Math.max(bounds.top,Math.min(bounds.top+bounds.height-natural.height,natural.top))};
   e.style.translate=`${p.left-natural.left}px ${p.top-natural.top}px`;
   occupied.push({...p,width:natural.width,height:natural.height});
  }
 };
 frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);for(const [e,title]of titles){if(title===null)e.removeAttribute('title');else e.title=title;}document.querySelectorAll<HTMLElement>('.companion-panel,.pet-bubble,.room-speech,.cg-moment,.cg-memory-chip').forEach(e=>{e.style.translate='';e.style.visibility='';e.removeAttribute('data-space-hidden');});};
}
/** Shared per-renderer layout; multiple mounts never run competing solvers. */
export function useFloatingLayout(){useEffect(()=>{if(users++===0)dispose=start();return()=>{if(--users===0){dispose?.();dispose=undefined;}};},[]);}
