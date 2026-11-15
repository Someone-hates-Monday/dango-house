import type {AppLocale,ReplyOrigin} from './shared/types';

/** Historical unlabeled replies are not retroactively claimed to be AI output. */
export function MessageOrigin({origin,locale}:{origin?:ReplyOrigin;locale:AppLocale}){
 const model=origin?.backend==='model';
 const label=model?'AI':locale==='en'?(origin?'Demo':'History'):locale==='ja'?(origin?'デモ':'履歴'):(origin?'本地':'历史');
 const title=model?[origin.provider,origin.model].filter(Boolean).join(' · '):locale==='en'?'Local or historical reply, not a verified API response':locale==='ja'?'ローカルまたは過去の応答です':'本地演示或旧记录，不代表本次 API 生成';
 return <span className="message-origin" title={title}>{label}</span>;
}
