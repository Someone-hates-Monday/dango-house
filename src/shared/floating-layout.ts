export interface FloatRect {left:number;top:number;width:number;height:number}
export const intersects=(a:FloatRect,b:FloatRect,gap=8)=>a.left<b.left+b.width+gap&&a.left+a.width+gap>b.left&&a.top<b.top+b.height+gap&&a.top+a.height+gap>b.top;
/** Choose the nearest free slot, including slots along obstacle edges. */
export function placeFloating(preferred:FloatRect,bounds:FloatRect,obstacles:FloatRect[]):FloatRect|null{
 const w=Math.min(preferred.width,bounds.width),h=Math.min(preferred.height,bounds.height);
 const xs=[preferred.left,bounds.left,bounds.left+bounds.width-w,...obstacles.flatMap(r=>[r.left-w-8,r.left+r.width+8])];
 const ys=[preferred.top,bounds.top,bounds.top+bounds.height-h,...obstacles.flatMap(r=>[r.top-h-8,r.top+r.height+8])];
 let best:FloatRect|null=null,score=Infinity;
 for(const x of xs)for(const y of ys){const r={left:Math.max(bounds.left,Math.min(bounds.left+bounds.width-w,x)),top:Math.max(bounds.top,Math.min(bounds.top+bounds.height-h,y)),width:w,height:h};
  if(obstacles.some(o=>intersects(r,o)))continue;
  const d=(r.left-preferred.left)**2+(r.top-preferred.top)**2;if(d<score){score=d;best=r;}
 }
 return best;
}
