/**
 * Central config. Everything the operator is likely to change lives here or in
 * env, never inline in a job.
 */

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

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

  anthropicApiKey: optional('ANTHROPIC_API_KEY'),
  supabaseUrl: optional('SUPABASE_URL'),
  supabaseServiceKey: optional('SUPABASE_SERVICE_ROLE_KEY'),
  resendApiKey: optional('RESEND_API_KEY'),
  notionApiKey: optional('NOTION_API_KEY'),
  notionOpportunityDbId: optional('NOTION_OPPORTUNITY_DB_ID'),

  digestFrom: env('DIGEST_FROM', 'engine@example.com'),
  digestTo: optional('DIGEST_TO'),

  /** Shared secret so only Vercel Cron can trigger the job route. */
  cronSecret: optional('CRON_SECRET'),

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
