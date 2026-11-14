import type {AppState,CgAssetId} from './types';

export const isPairIntimacy=(asset:CgAssetId)=>asset==='rin-xia-cheek-t1'||asset==='rin-xia-fish-leads-t2';
export const isUserIntimacy=(asset:CgAssetId)=>asset==='xia-reach-t1'||asset==='gpt-close-t1'||asset==='rin-xia-welcome-t1';
export function allowsEventCg(state:AppState,asset:CgAssetId){
 if(state.settings.cgAutoplay===false)return false;
 if(isPairIntimacy(asset)&&state.settings.pairRomance===false)return false;
 if(isUserIntimacy(asset)&&state.relationship.mode!=='romance')return false;
 return true;
}
export function affectionCgFor(id:string):CgAssetId|undefined{
 return id==='rin'?'xia-reach-t1':id==='shiori'?'gpt-close-t1':undefined;
}
