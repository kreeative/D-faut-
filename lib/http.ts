import { config } from './config.ts';
import { log } from './logger.ts';

/**
 * Every outbound request in the scan goes through here. It enforces the three
 * rules that keep the scan a good citizen and keep us out of trouble:
 * a truthful User-Agent, robots.txt compliance, and one request per second
 * per host.
 */

const RATE_LIMIT_MS = 1000;
const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

const lastRequestAt = new Map<string, number>();
const robotsCache = new Map<string, RobotsRules>();

interface RobotsRules {
  /** Path prefixes disallowed for our UA (or for *). */
  disallow: string[];
  allow: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle(host: string): Promise<void> {
  const last = lastRequestAt.get(host);
  if (last !== undefined) {
    const wait = RATE_LIMIT_MS - (Date.now() - last);
    if (wait > 0) await sleep(wait);
  }
  lastRequestAt.set(host, Date.now());
}

/**
 * Parses only the directives we act on. Wildcards inside paths are treated as
 * prefix matches up to the wildcard, which errs toward not fetching.
 */
export function parseRobots(text: string, userAgent: string): RobotsRules {
  const rules: RobotsRules = { disallow: [], allow: [] };
  const uaToken = userAgent.split('/')[0]!.toLowerCase();
  let applies = false;
  let sawSpecific = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0]!.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      const agent = value.toLowerCase();
      if (agent === uaToken) {
        // A block naming us specifically wins; discard anything from '*'.
        if (!sawSpecific) {
          rules.disallow.length = 0;
          rules.allow.length = 0;
        }
        sawSpecific = true;
        applies = true;
      } else if (agent === '*' && !sawSpecific) {
        applies = true;
      } else {
        applies = false;
      }
      continue;
    }

    if (!applies) continue;
    if (field === 'disallow' && value) rules.disallow.push(value.split('*')[0]!);
    if (field === 'allow' && value) rules.allow.push(value.split('*')[0]!);
  }
  return rules;
}

export function isPathAllowed(rules: RobotsRules, pathname: string): boolean {
  const longest = (list: string[]) =>
    list.filter((p) => pathname.startsWith(p)).reduce((a, b) => (b.length > a.length ? b : a), '');
  const allow = longest(rules.allow);
  const deny = longest(rules.disallow);
  if (!deny) return true;
  // Most specific rule wins; ties go to allow, per the usual convention.
  return allow.length >= deny.length;
}

async function getRobots(origin: string): Promise<RobotsRules> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;

  let rules: RobotsRules = { disallow: [], allow: [] };
  try {
    await throttle(new URL(origin).host);
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'user-agent': config.userAgent },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // A 4xx means no robots file, which means no restrictions.
    if (res.ok) rules = parseRobots(await res.text(), config.userAgent);
  } catch (err) {
    // If robots.txt is unreachable we cannot prove we are allowed, so we treat
    // the host as off-limits for this run rather than guessing.
    log('warn', 'robots.unreachable', { origin, error: String(err) });
    rules = { disallow: ['/'], allow: [] };
  }
  robotsCache.set(origin, rules);
  return rules;
}

export class RobotsDisallowedError extends Error {
  constructor(url: string) {
    super(`robots.txt disallows ${url}`);
    this.name = 'RobotsDisallowedError';
  }
}

/** Fetches text, respecting robots.txt and per-host rate limits. */
export async function politeFetchText(url: string): Promise<string> {
  const parsed = new URL(url);
  const rules = await getRobots(parsed.origin);
  if (!isPathAllowed(rules, parsed.pathname)) {
    throw new RobotsDisallowedError(url);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await throttle(parsed.host);
      const res = await fetch(url, {
        headers: { 'user-agent': config.userAgent, accept: '*/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status} from ${parsed.host}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 500);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Resets memoised robots rules and throttle state. Used by tests. */
export function __resetHttpState(): void {
  robotsCache.clear();
  lastRequestAt.clear();
}
