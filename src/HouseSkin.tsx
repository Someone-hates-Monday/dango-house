/** The existing brand's heart roof and shared plinth, drawn at the user's room size. */
export function HouseSkin({width,height}:{width:number;height:number}){
 const m=width/2;
 return <svg className="house-shell" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
  <path d={`M18 76 L${m} 29 L${width-18} 76 V${height-32} Q${width-18} ${height-18} ${width-35} ${height-18} H35 Q18 ${height-18} 18 ${height-32}Z`} fill="#fff1df" stroke="#9c667c" strokeWidth="3"/>
  <path d={`M11 79 L${m} 29 L${width-11} 79`} fill="none" stroke="#74354f" strokeWidth="20" strokeLinejoin="round" strokeLinecap="round"/>
  <path d={`M11 79 L${m} 29 L${width-11} 79`} fill="none" stroke="#f5a0aa" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round"/>
  <path d={`M${m} 28 C${m-28} 13 ${m-17} -7 ${m} 9 C${m+17} -7 ${m+28} 13 ${m} 28Z`} fill="#f5a0aa" stroke="#74354f" strokeWidth="4" strokeLinejoin="round"/>
  {[[-10,45],[2,45],[-10,57],[2,57]].map(([x,y],i)=><rect key={i} x={m+x} y={y} width="8" height="8" rx="2" fill="#ab728d"/>)}
 </svg>;
}
/** Pointer-through for the transparent corners of the house-shaped native host. */
export function inHouseSilhouette(x:number,y:number,width:number,height:number){
 if(x<0||x>width||y<0||y>height)return false;
 if(y>=80)return x>=8&&x<=width-8;
 if(y<=30&&Math.abs(x-width/2)<=22)return true;
 const inset=Math.max(0,(width/2-11)*(1-(y-19)/60));
 return x>=inset&&x<=width-inset;
}
