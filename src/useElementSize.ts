import {useEffect,useState,type RefObject} from 'react';
export function useElementSize(ref:RefObject<HTMLElement|null>){
  const[size,setSize]=useState({width:1000,height:450});
  useEffect(()=>{const node=ref.current;if(!node)return;const update=()=>setSize({width:node.clientWidth,height:node.clientHeight});update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect();},[ref]);
  return size;
}
