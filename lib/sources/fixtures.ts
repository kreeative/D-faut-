import type { Candidate } from '../types.ts';
import { fingerprint } from './util.ts';

/**
 * Offline stand-ins for a real collection pass. They exist so the full
 * pipeline — dedupe, scoring, gating, ranking, digest — can be exercised and
 * verified without network access or API keys.
 */
const RAW: { source: string; title: string; body: string; url: string; signal: number }[] = [
  {
    source: 'reddit/r/smallbusiness',
    title: 'Paid a lawyer $900 for a subcontractor agreement I could have filled in myself',
    body: 'Small trades business. I needed a subcontractor agreement and got quoted $900. The actual document was four pages and mostly boilerplate with my details dropped in. I would happily pay $150 for a jurisdiction-correct fill-in-the-blanks version I could reuse.',
    url: 'https://www.reddit.com/r/smallbusiness/comments/aaa1/paid_a_lawyer_900',
    signal: 412,
  },
  {
    source: 'reddit/r/NewTubers',
    title: 'Is there a tool that generates thumbnail variants from one design?',
    body: 'I make three thumbnails per video to A/B test and it eats an hour each time. I would pay for something that takes one base design plus my title and spits out five on-brand variants.',
    url: 'https://www.reddit.com/r/NewTubers/comments/bbb2/thumbnail_variants',
    signal: 268,
  },
  {
    source: 'reddit/r/resumes',
    title: 'Resume rewrite services want $400 and take a week',
    body: 'Every service I looked at is $250-500 and needs a call plus a week of back and forth. I just want my existing resume restructured for a specific job posting, today.',
    url: 'https://www.reddit.com/r/resumes/comments/ccc3/resume_rewrite_pricing',
    signal: 531,
  },
  {
    source: 'reddit/r/freelance',
    title: 'Client proposal template that does not look like everyone else on Upwork',
    body: 'I close maybe one in six proposals. Everything free looks identical. Would pay for a proposal system with pricing tables and scope language I can adapt per client.',
    url: 'https://www.reddit.com/r/freelance/comments/ddd4/proposal_template',
    signal: 190,
  },
  {
    source: 'reddit/r/Entrepreneur',
    title: 'Looking for a consultant to redesign our whole onboarding flow',
    body: 'We need someone to audit our SaaS onboarding, interview our customers, and deliver a redesign over about six weeks. Budget is flexible for the right person.',
    url: 'https://www.reddit.com/r/Entrepreneur/comments/eee5/onboarding_consultant',
    signal: 88,
  },
  {
    source: 'reddit/r/podcasting',
    title: 'Show notes are the worst part of podcasting',
    body: 'Two hours per episode writing show notes, timestamps and a summary. I would pay monthly for something that turns the audio into publishable notes in my voice.',
    url: 'https://www.reddit.com/r/podcasting/comments/fff6/show_notes',
    signal: 344,
  },
  {
    source: 'reddit/r/GetStudying',
    title: 'Made a study plan spreadsheet, people keep asking for it',
    body: 'Built a spreadsheet that takes an exam date and syllabus and lays out a spaced-repetition schedule. Posted a screenshot and about forty people asked me to send it.',
    url: 'https://www.reddit.com/r/GetStudying/comments/ggg7/study_plan_sheet',
    signal: 622,
  },
  {
    source: 'reddit/r/graphic_design',
    title: 'Brand kit deliverable takes me longer than the logo',
    body: 'The logo is two hours. Assembling the brand guidelines PDF with colour codes, type scale and usage rules is six. Same structure every time.',
    url: 'https://www.reddit.com/r/graphic_design/comments/hhh8/brand_kit_time',
    signal: 205,
  },
  {
    source: 'weworkremotely',
    title: 'Contract: Build custom internal reporting dashboards, ongoing',
    body: 'Seeking a contractor for ongoing bespoke dashboard work against our warehouse. Requirements will evolve. Long-term engagement, weekly calls.',
    url: 'https://weworkremotely.com/remote-jobs/iii9-dashboards',
    signal: 0,
  },
  {
    source: 'weworkremotely-design',
    title: 'Freelance: Pitch deck design, recurring need, 4-6 decks per month',
    body: 'Venture firm needs founder pitch decks reformatted to our house template. Content supplied, purely layout and polish. Recurring monthly volume.',
    url: 'https://weworkremotely.com/remote-jobs/jjj10-pitch-decks',
    signal: 0,
  },
  {
    source: 'indiehackers',
    title: 'Charging $49 for a Notion template pack, $3k first month',
    body: 'Packaged the operating system I built for my own agency as a Notion template with SOPs. Sold on a single page with Stripe checkout. No support burden so far.',
    url: 'https://www.indiehackers.com/post/kkk11-notion-template',
    signal: 0,
  },
  {
    source: 'reddit/r/cscareerquestions',
    title: 'Would pay for interview flashcards tailored to a specific job description',
    body: 'Generic system design flashcards are everywhere. I want a deck generated from the actual posting I am interviewing for, with the company stack.',
    url: 'https://www.reddit.com/r/cscareerquestions/comments/lll12/tailored_flashcards',
    signal: 297,
  },
  {
    source: 'reddit/r/smallbusiness',
    title: 'Anyone know a bookkeeper who can untangle two years of mixed personal and business expenses?',
    body: 'Behind on books since 2023. Need a human to go through the statements, categorise everything and talk to my accountant.',
    url: 'https://www.reddit.com/r/smallbusiness/comments/mmm13/bookkeeper_cleanup',
    signal: 156,
  },
  {
    source: 'reddit/r/freelance',
    title: 'Invoice and late-payment chaser templates, would pay',
    body: 'Chasing late invoices is the most demoralising part of freelancing. Want a set of escalating email templates plus an invoice format that gets paid faster.',
    url: 'https://www.reddit.com/r/freelance/comments/nnn14/invoice_chasers',
    signal: 233,
  },
];

export function fixtureCandidates(): Candidate[] {
  const now = new Date().toISOString();
  return RAW.map((r) => ({
    fingerprint: fingerprint(r.source, r.url),
    source: r.source,
    title: r.title,
    body: r.body,
    evidence_urls: [r.url],
    raw_signal: r.signal,
    collected_at: now,
  }));
}
