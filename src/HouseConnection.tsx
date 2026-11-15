import {useEffect,useState} from 'react';
import type {AppState} from './shared/types';
import {providers} from './shared/characters';
import {useI18n} from './useI18n';
import {connectBrain} from './connect-brain';

export function HouseConnection({state,onConnected}:{state:AppState;onConnected:()=>void}){
 const {t,locale}=useI18n(state);
 const [provider,setProvider]=useState(state.settings.provider),[model,setModel]=useState(state.connections[state.settings.provider]?.model??state.settings.model),[endpoint,setEndpoint]=useState(state.connections[state.settings.provider]?.endpoint??'');
 const [key,setKey]=useState(''),[saved,setSaved]=useState<string[]>([]),[working,setWorking]=useState(false),[notice,setNotice]=useState(''),[tools,setTools]=useState(state.connections[state.settings.provider]?.tools!==false);
 useEffect(()=>{void window.garden.keyStatus().then(setSaved);},[]);
 const choose=(id:string)=>{setProvider(id);setModel(state.connections[id]?.model??'');setEndpoint(state.connections[id]?.endpoint??providers.find(p=>p.id===id)!.endpoint);setTools(state.connections[id]?.tools!==false);setKey('');setNotice('');};
 const submit=async()=>{setWorking(true);setNotice('');try{await connectBrain({provider,model,endpoint,tools,key});setKey('');onConnected();}catch(error){setKey('');setSaved(await window.garden.keyStatus());setNotice(error instanceof Error?error.message.replace(/^Error invoking remote method '[^']+': Error: /,''):t('settings.connectFail'));}finally{setWorking(false);}};
 return <div className="house-connection">
  <p className="house-connection-intro">{locale==='en'?'One connection lets everyone join the conversation.':locale==='ja'?'一つの接続で、みんなと話せます。':'连接一次，大家就能和你聊天。'}</p>
  <form onSubmit={e=>{e.preventDefault();void submit();}}>
   <label>{t('settings.brainPick')}<select aria-label={t('settings.brainPick')} value={provider} onChange={e=>choose(e.target.value)}>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label>{t('settings.model')}<input aria-label={t('settings.model')} value={model} maxLength={120} placeholder={provider==='deepseek'?'deepseek-flash':t('settings.modelPh')} onChange={e=>setModel(e.target.value)}/></label>
   {provider==='deepseek'&&<div className="house-model-examples">{['deepseek-flash','deepseek-v4-pro'].map(id=><button type="button" key={id} onClick={()=>setModel(id)}>{id}</button>)}</div>}
   <label>{t('settings.key')}<input aria-label={t('settings.key')} type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder={saved.includes(provider)?t('settings.keySaved'):t('settings.keyNew')}/></label>
   <details><summary>{t('settings.endpoint')}</summary><input aria-label={t('settings.endpoint')} value={endpoint} onChange={e=>setEndpoint(e.target.value)}/><label className="house-tool-toggle"><input type="checkbox" checked={tools} onChange={e=>setTools(e.target.checked)}/><span>{t('settings.tools')}</span></label></details>
   {notice&&<p className="house-connect-error" role="alert">{notice}</p>}
   <button className="house-connect-submit" disabled={working||!model.trim()||(!key.trim()&&!saved.includes(provider))}>{working?t('settings.connecting'):t('settings.connectAndStart')}</button>
  </form>
  <button className="house-advanced" onClick={()=>window.garden.window('show-settings')}>{locale==='en'?'Residents, relationships & advanced settings':locale==='ja'?'住人・関係・詳細設定':'伙伴、关系与更多设置'} ›</button>
 </div>;
}
