import { politeFetchText } from '../http.ts';
import { log } from '../logger.ts';
import type { Candidate } from '../types.ts';
import { VERTICALS } from '../config.ts';
import { fingerprint, matchesPain } from './util.ts';

interface RedditChild {
  data: {
    title?: string;
    selftext?: string;
    permalink?: string;
    url?: string;
    ups?: number;
    num_comments?: number;
    over_18?: boolean;
    stickied?: boolean;
  };
}

/**
 * Reddit's public .json endpoints — the documented read-only surface, no login,
 * no HTML scraping. Sorted by top/week so we see what actually resonated.
 */
export async function collectReddit(): Promise<Candidate[]> {
  const out: Candidate[] = [];

  for (const vertical of VERTICALS) {
    for (const sub of vertical.subreddits) {
      const url = `https://www.reddit.com/r/${sub}/top.json?t=week&limit=25`;
      try {
        const parsed = JSON.parse(await politeFetchText(url)) as {
          data?: { children?: RedditChild[] };
        };
        for (const child of parsed.data?.children ?? []) {
          const d = child.data;
          if (!d.title || !d.permalink || d.over_18 || d.stickied) continue;

          const body = (d.selftext ?? '').slice(0, 4000);
          // A post has to look like paid pain, not chatter, to cost us a scorer call.
          if (!matchesPain(`${d.title} ${body}`, vertical.painKeywords)) continue;

          const link = `https://www.reddit.com${d.permalink}`;
          out.push({
            fingerprint: fingerprint('reddit', link),
            source: `reddit/r/${sub}`,
            title: d.title,
            body,
            evidence_urls: [link],
            raw_signal: (d.ups ?? 0) + (d.num_comments ?? 0) * 2,
            collected_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        // One dead subreddit must not fail the whole scan.
        log('warn', 'source.reddit.failed', { sub, error: String(err) });
      }
    }
  }
  return out;
}
