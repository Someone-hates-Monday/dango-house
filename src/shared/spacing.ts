export interface CastBox {id:string;x:number;y:number;width:number;height:number}
export interface CastBounds {left:number;right:number;top:number;bottom:number}
// x is the horizontal centre and y is the feet position. At most half of the
// smaller occupied rectangle may be covered by any one neighbour.
export function overlapFraction(a:CastBox,b:CastBox){
  const width=Math.max(0,Math.min(a.x+a.width/2,b.x+b.width/2)-Math.max(a.x-a.width/2,b.x-b.width/2));
  const height=Math.max(0,Math.min(a.y,b.y)-Math.max(a.y-a.height,b.y-b.height));
  return width*height/Math.min(a.width*a.height,b.width*b.height);
}
export function coveredFraction(target:CastBox,others:CastBox[]){
  const rects=others.map(b=>({left:Math.max(target.x-target.width/2,b.x-b.width/2),right:Math.min(target.x+target.width/2,b.x+b.width/2),top:Math.max(target.y-target.height,b.y-b.height),bottom:Math.min(target.y,b.y)})).filter(r=>r.right>r.left&&r.bottom>r.top);
  const xs=[...new Set(rects.flatMap(r=>[r.left,r.right]))].sort((a,b)=>a-b);let area=0;
  for(let i=1;i<xs.length;i++){
    const ys=rects.filter(r=>r.left<xs[i]&&r.right>xs[i-1]).map(r=>[r.top,r.bottom]).sort((a,b)=>a[0]-b[0]);
    let length=0,from=0,to=0;for(const[a,b]of ys){if(a>to){length+=to-from;from=a;to=b;}else to=Math.max(to,b);}length+=to-from;area+=(xs[i]-xs[i-1])*length;
  }
  return area/(target.width*target.height);
}
export function separateCast(cast:CastBox[],bounds:CastBounds):Record<string,CastBox>{
  const placed:CastBox[]=[];
  const clamp=(p:CastBox):CastBox=>({...p,x:Math.max(bounds.left,Math.min(bounds.right,p.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,p.y))});
  const fits=(p:CastBox)=>{if(!placed.every(q=>overlapFraction(p,q)<=.5+1e-9))return false;const all=[...placed,p];return all.every(a=>coveredFraction(a,all.filter(b=>b.id!==a.id))<=.5+1e-9);};
  for(const desired of cast){
    const origin=clamp(desired);let chosen=origin;
    if(!fits(origin)){
      let best=Infinity;
      const stepX=desired.width*.51,stepY=desired.height*.51;
      for(let dy=-cast.length;dy<=cast.length;dy++)for(let dx=-cast.length;dx<=cast.length;dx++){
        const candidate=clamp({...origin,x:origin.x+dx*stepX,y:origin.y+dy*stepY});
        const score=(candidate.x-origin.x)**2+(candidate.y-origin.y)**2;
        if(score<best&&fits(candidate)){best=score;chosen=candidate;}
      }
      // The normal desktop and room have ample capacity for the seven residents.
      // A dense fallback scans the remaining surface when a narrow layout needs it.
      if(best===Infinity)for(let y=bounds.top;y<=bounds.bottom;y+=stepY)for(let x=bounds.left;x<=bounds.right;x+=stepX){const p={...origin,x,y};const score=(x-origin.x)**2+(y-origin.y)**2;if(score<best&&fits(p)){best=score;chosen=p;}}
    }
    placed.push(chosen);
  }
  return Object.fromEntries(placed.map(p=>[p.id,p]));
}
