import type { RecommendationCard } from '../../src/shared/agent';
import type { CharacterId } from '../../src/shared/types';

export interface BrowseHit {
  url: string;
  title: string;
  opened: boolean;
}

/**
 * Visible Playwright search with an isolated profile.
 * Only URLs that successfully opened are returned as verified hits.
 * If Playwright is unavailable, fails honestly (no invented links).
 */
export async function browseForVideos(
  query: string,
  opts: { signal: AbortSignal; maxResults: number; profileDir: string },
): Promise<{ hits: BrowseHit[]; note: string }> {
  let chromium: typeof import('playwright').chromium | undefined;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return { hits: [], note: 'Playwright is not available in this build; browse task cannot invent URLs.' };
  }
  if (opts.signal.aborted) throw new Error('cancelled');

  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(`${query} short video`)}`;
  const context = await chromium.launchPersistentContext(opts.profileDir, {
    headless: false,
    viewport: { width: 1100, height: 720 },
  });
  const page = context.pages()[0] ?? (await context.newPage());
  const hits: BrowseHit[] = [];

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    if (opts.signal.aborted) throw new Error('cancelled');

    const anchors = await page.$$eval('a[href^="http"]', nodes =>
      nodes
        .map(a => ({ href: (a as HTMLAnchorElement).href, title: (a.textContent || '').trim() }))
        .filter(a => a.href && a.title.length > 8 && !/duckduckgo\.com/i.test(a.href))
        .slice(0, 12),
    );

    for (const candidate of anchors) {
      if (hits.length >= opts.maxResults) break;
      if (opts.signal.aborted) throw new Error('cancelled');
      if (hits.some(h => h.url === candidate.href)) continue;
      try {
        const tab = await context.newPage();
        const response = await tab.goto(candidate.href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        const ok = !!response && response.ok();
        await tab.close();
        if (ok) hits.push({ url: candidate.href, title: candidate.title.slice(0, 120), opened: true });
      } catch {
        /* skip failed opens — never forge success */
      }
    }
  } finally {
    await context.close().catch(() => {});
  }

  return {
    hits,
    note: hits.length
      ? `Opened ${hits.length} verified page(s) for “${query}”.`
      : `No pages opened successfully for “${query}”; no recommendation URLs invented.`,
  };
}

export function hitsToCards(hits: BrowseHit[], actor: CharacterId, query: string): RecommendationCard[] {
  return hits
    .filter(h => h.opened)
    .map(h => ({
      id: crypto.randomUUID(),
      verifiedUrl: h.url,
      title: h.title || h.url,
      whyForUser: `Verified open while searching for “${query}”.`,
      endorsedBy: [actor],
      evidenceLevel: 'inspected' as const,
      sourceQuery: query,
    }));
}
