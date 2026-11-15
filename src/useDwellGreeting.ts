import {useEffect,useRef,useState} from 'react';

/** One acknowledgement per deliberate pointer visit, independent of API latency. */
export function useDwellGreeting(enabled:boolean,greet:()=>void,delay=800){
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const latest=useRef(greet);latest.current=greet;
 const [noticed,setNoticed]=useState(false);
 const cancel=()=>{clearTimeout(timer.current);timer.current=undefined;setNoticed(false);};
 useEffect(()=>{if(!enabled)cancel();return()=>clearTimeout(timer.current);},[enabled]);
 useEffect(()=>{window.addEventListener('blur',cancel);return()=>{clearTimeout(timer.current);window.removeEventListener('blur',cancel);};},[]);
 return {noticed,enter:()=>{if(!enabled)return;clearTimeout(timer.current);timer.current=setTimeout(()=>{timer.current=undefined;setNoticed(true);latest.current();},delay);},leave:cancel,cancel};
}
