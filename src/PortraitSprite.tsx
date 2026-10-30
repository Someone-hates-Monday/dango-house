import type {Character,Embodiment} from './shared/types';
export function PortraitSprite({character,body}:{character:Character;body:Embodiment}){
  const active=body.until>Date.now();
  return <span className={`portrait-stage portrait-${active?body.emotion:'neutral'}`} data-character={character.id} data-form="portrait" title="社区正常比例立绘 · 本地呼吸与情绪轻动效"><img src={`./portraits/${character.file}-alpha-v1.png`} alt={`${character.name} · 正常比例立绘`} draggable={false}/><span className="portrait-caption">正常比例立绘 · 轻动效</span>{active&&body.emotion==='happy'&&<span className="portrait-heart">♥</span>}</span>;
}
