// Pin the reviewed identity independently of reused atlas URLs in older builds/caches.
export const gptRigAsset = './animated/gpt.webp?v=white-dragon-v5-6d7cd4d4';
export function rigTextureSource(file:string,staticArt:boolean,asset?:string){
  return staticArt?`./community/${file}/idle.webp`:asset?`./${asset}`:file==='gpt'?gptRigAsset:`./animated/${file}.webp`;
}
