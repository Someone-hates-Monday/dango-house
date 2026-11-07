import type {ClaudeClip} from './claude-animation';

/**
 * Per-clip display tweaks. Prefer matching torso width to idle (~209px @ 640×360).
 * Do NOT use full alpha bbox height for feed clips — crumbs/dishes inflate height and
 * cause over-shrink (rice previously zoomed to ~0.82 and looked too small).
 */
type Fit={zoom:number;/** translateY in % of video height */liftPct:number};

/** Only true framing outliers. Re-measure torso before adding entries. */
export const claudeClipFit:Partial<Record<ClaudeClip,Fit>>={
  // pat/reassure are ~2–3% short — leave alone (imperceptible). rice needs no zoom.
};

export function claudeVideoTransform(clip:ClaudeClip,mirror=false):string|undefined{
  const fit=claudeClipFit[clip];
  const parts:string[]=[];
  if(mirror)parts.push('scaleX(-1)');
  if(fit){
    parts.push(`translateY(${fit.liftPct}%)`);
    parts.push(`scale(${fit.zoom})`);
  }
  return parts.length?parts.join(' '):undefined;
}
