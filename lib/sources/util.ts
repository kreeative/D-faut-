import { createHash } from 'node:crypto';

/**
 * Strips tracking params and fragments so the same post found twice produces
 * the same fingerprint.
 */
export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith('utm_') || key === 'ref' || key === 'ref_src') {
        u.searchParams.delete(key);
      }
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return raw.trim();
  }
}

export function fingerprint(source: string, url: string): string {
  return createHash('sha256').update(`${source}|${canonicalUrl(url)}`).digest('hex').slice(0, 32);
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/**
 * RSS descriptions arrive with markup escaped (`&lt;p&gt;`), so decoding has to
 * happen between two stripping passes or the tags survive as literal text. The
 * second pass only matches things that actually open like a tag, which keeps a
 * decoded `&lt;` used as a less-than sign in prose from swallowing the rest of
 * the sentence.
 */
const TAG = /<\/?[a-zA-Z!][^>]*>/g;

export function stripHtml(s: string): string {
  return decodeEntities(s.replace(TAG, ' '))
    .replace(TAG, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when the text carries at least one of the vertical's pain keywords. */
export function matchesPain(text: string, keywords: string[]): boolean {
  const hay = text.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}
