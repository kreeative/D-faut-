/**
 * Central config. Everything the operator is likely to change lives here or in
 * env, never inline in a job.
 */

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/**
 * Credentials are exposed as getters throughout, so they read through to the
 * environment on every access. Capturing them at import time silently ignores
 * anything that populates the environment later — a dotenv call, a test, a
 * runtime override.
 */
function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const config = {
  /**
   * Read through to the environment on every access rather than captured at
   * import time: ESM hoists static imports, so a caller that sets
   * SCAN_DRY_RUN at the top of its own module still loads this one first.
   */
  get dryRun(): boolean {
    return process.env.SCAN_DRY_RUN === '1';
  },

  /**
   * The scorer model. The build brief named claude-sonnet-4-6, but that model
   * does not support structured outputs (output_config.format), which this
   * pipeline depends on for schema-validated scores. Sonnet 5 does, at the same
   * tier. Change this one string to move the whole pipeline to another model.
   */
  model: env('ANTHROPIC_MODEL', 'claude-sonnet-5'),
  /** Depth/cost dial. medium is the balance point for a scoring workload. */
  effort: env('ANTHROPIC_EFFORT', 'medium'),

  /**
   * Persist to a JSON file instead of Supabase. Lets a first real run need
   * nothing but an Anthropic key.
   */
  get localStore(): boolean {
    return process.env.SCAN_LOCAL_STORE === '1';
  },
  localStorePath: env('SCAN_LOCAL_STORE_PATH', '.data/scan-state.json'),

  get anthropicApiKey(): string | undefined {
    return optional('ANTHROPIC_API_KEY');
  },

  /** Free tier at aistudio.google.com/apikey — no credit card required. */
  get geminiApiKey(): string | undefined {
    return optional('GEMINI_API_KEY');
  },
  geminiModel: env('GEMINI_MODEL', 'gemini-2.5-flash'),
  get supabaseUrl(): string | undefined {
    return optional('SUPABASE_URL');
  },
  get supabaseServiceKey(): string | undefined {
    return optional('SUPABASE_SERVICE_ROLE_KEY');
  },
  get resendApiKey(): string | undefined {
    return optional('RESEND_API_KEY');
  },
  get notionApiKey(): string | undefined {
    return optional('NOTION_API_KEY');
  },
  get notionOpportunityDbId(): string | undefined {
    return optional('NOTION_OPPORTUNITY_DB_ID');
  },

  digestFrom: env('DIGEST_FROM', 'engine@example.com'),
  get digestTo(): string | undefined {
    return optional('DIGEST_TO');
  },

  /** Shared secret so only Vercel Cron can trigger the job route. */
  get cronSecret(): string | undefined {
    return optional('CRON_SECRET');
  },

  /** Hard ceiling on candidates scored per run. Directly caps the API bill. */
  maxCandidates: Number(env('SCAN_MAX_CANDIDATES', '60')),
  /** Concurrent scorer calls. Low enough to stay well inside rate limits. */
  scoreConcurrency: Number(env('SCAN_CONCURRENCY', '4')),
  /** How many make it to Notion. */
  notionTopN: Number(env('SCAN_NOTION_TOP_N', '10')),
  /** How many make it into the email digest. */
  digestTopN: Number(env('SCAN_DIGEST_TOP_N', '3')),

  userAgent:
    'SleepEngineMarketScan/0.1 (one-operator market research; contact via repo owner)',
};

/**
 * What the operator edits to change what gets scanned. Deliberately data, not
 * code — picking a vertical should take two minutes, not a deploy review.
 */
export interface Vertical {
  name: string;
  /** Public Reddit JSON endpoints are polled for these. */
  subreddits: string[];
  /**
   * Words that mark a post as a paid-pain signal rather than chatter. A post
   * has to hit at least one to become a candidate.
   */
  painKeywords: string[];
}

export const VERTICALS: Vertical[] = [
  {
    name: 'small-business-ops',
    subreddits: ['smallbusiness', 'Entrepreneur', 'freelance'],
    painKeywords: [
      'template', 'spreadsheet', 'contract', 'invoice', 'proposal',
      'checklist', 'workflow', 'hire someone', 'pay someone', 'looking for a tool',
    ],
  },
  {
    name: 'creator-tools',
    subreddits: ['NewTubers', 'podcasting', 'graphic_design'],
    painKeywords: [
      'thumbnail', 'preset', 'template', 'script', 'brand kit',
      'i would pay', 'worth paying', 'is there a tool',
    ],
  },
  {
    name: 'study-and-career',
    subreddits: ['resumes', 'GetStudying', 'cscareerquestions'],
    painKeywords: [
      'resume', 'cover letter', 'portfolio', 'study plan', 'flashcards',
      'i would pay', 'paid for', 'template',
    ],
  },
];

/**
 * RSS feeds polled every run. Kept to feeds that are published for consumption
 * — no HTML scraping, no logged-in surfaces.
 */
export const RSS_FEEDS: { source: string; url: string }[] = [
  { source: 'weworkremotely', url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss' },
  { source: 'weworkremotely-design', url: 'https://weworkremotely.com/categories/remote-design-jobs.rss' },
  { source: 'indiehackers', url: 'https://www.indiehackers.com/feed.xml' },
];
