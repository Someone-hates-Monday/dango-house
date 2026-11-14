/** Preferred CG card size from free space above a pair; contract targets, not hard constants. */
export function cgCardSize(availableWidth: number, availableHeight: number, host: 'room' | 'desktop') {
  const maxW = host === 'room' ? 340 : 360;
  const minW = host === 'room' ? 200 : 220;
  const width = Math.max(minW, Math.min(maxW, availableWidth * 0.72, availableHeight * 1.4));
  const height = width * 9 / 16 + (host === 'room' ? 96 : 88);
  return {width, height};
}

type Box = {left: number; top: number; width: number; height: number};
type Bounds = {left: number; top: number; width: number; height: number};

/** Midpoint above two character boxes; null when either is missing or space is too tight. */
export function pairOverheadAnchor(
  a: Box,
  b: Box,
  bounds: Bounds,
  host: 'room' | 'desktop',
) {
  return groupOverheadAnchor([a,b],bounds,host);
}

/** One card for the entire cast, centered over all participants rather than the first two. */
export function groupOverheadAnchor(boxes:readonly Box[],bounds:Bounds,host:'room'|'desktop'){
  if(!boxes.length)return null;
  const midX=boxes.reduce((sum,b)=>sum+b.left+b.width/2,0)/boxes.length;
  const tops=Math.min(...boxes.map(b=>b.top));
  const gap = 12;
  const availW = Math.max(1, bounds.width - 16);
  const availH = Math.max(1, tops - bounds.top - gap);
  if (availH < 96) return null;
  const size = cgCardSize(availW, availH, host);
  const left = Math.max(bounds.left + 8, Math.min(bounds.left + bounds.width - size.width - 8, midX - size.width / 2));
  const top = Math.max(bounds.top + 8, tops - gap - size.height);
  if (top + size.height > tops - 4) return null;
  return {left, top, ...size};
}

/** Overhead above a single character (POV / solo clips). */
export function soloOverheadAnchor(a: Box, bounds: Bounds, host: 'room' | 'desktop') {
  const midX = a.left + a.width / 2;
  const tops = a.top;
  const gap = 12;
  const availW = Math.max(1, bounds.width - 16);
  const availH = Math.max(1, tops - bounds.top - gap);
  if (availH < 96) return null;
  const size = cgCardSize(availW, availH, host);
  const left = Math.max(bounds.left + 8, Math.min(bounds.left + bounds.width - size.width - 8, midX - size.width / 2));
  const top = Math.max(bounds.top + 8, tops - gap - size.height);
  if (top + size.height > tops - 4) return null;
  return {left, top, ...size};
}

/** User-forced expand when overhead is too tight: center-top of the stage. */
export function fallbackStageAnchor(
  bounds: {left: number; top: number; width: number; height: number},
  host: 'room' | 'desktop',
) {
  const availW = Math.max(1, bounds.width - 16);
  const availH = Math.max(160, Math.min(bounds.height * 0.5, host === 'room' ? 280 : 300));
  const size = cgCardSize(availW, availH, host);
  const left = bounds.left + Math.max(8, (bounds.width - size.width) / 2);
  const top = bounds.top + 8;
  return {left, top, ...size};
}
