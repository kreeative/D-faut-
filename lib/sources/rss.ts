import { politeFetchText } from '../http.ts';
import { log } from '../logger.ts';
import type { Candidate } from '../types.ts';
import { RSS_FEEDS } from '../config.ts';
import { fingerprint, stripHtml } from './util.ts';

interface FeedItem {
  title: string;
  link: string;
  summary: string;
}

/**
 * Minimal RSS 2.0 / Atom item extractor. Feeds we poll are small and
 * well-formed; a full XML parser is a dependency this does not need.
 */
export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];

  for (const block of blocks) {
    const tag = (name: string): string => {
      const m = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
      if (!m?.[1]) return '';
      const inner = m[1].replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1');
      return stripHtml(inner);
    };

    const title = tag('title');
    // Atom puts the URL in an attribute rather than the element body.
    const hrefMatch = block.match(/<link\b[^>]*href=["']([^"']+)["']/i);
    const link = tag('link') || hrefMatch?.[1] || '';
    if (!title || !link) continue;

    items.push({
      title,
      link,
      summary: (tag('description') || tag('summary') || tag('content')).slice(0, 4000),
    });
  }
  return items;
}

/**
 * Job boards and maker feeds. Recurring paid postings are the cleanest demand
 * signal available without paying for data: somebody already opened a wallet.
 */
export async function collectRss(): Promise<Candidate[]> {
  const out: Candidate[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const items = parseFeed(await politeFetchText(feed.url));
      for (const item of items.slice(0, 25)) {
        out.push({
          fingerprint: fingerprint(feed.source, item.link),
          source: feed.source,
          title: item.title,
          body: item.summary,
          evidence_urls: [item.link],
          raw_signal: 0,
          collected_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      log('warn', 'source.rss.failed', { feed: feed.source, error: String(err) });
    }
  }
  return out;
}
