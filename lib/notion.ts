import { config } from './config.ts';
import { log } from './logger.ts';
import { MAX_TOTAL, type ScoredOpportunity } from './types.ts';

/**
 * Pushes the ranked list into the operator's Notion database. Notion is the
 * admin surface — there is no custom dashboard to build or maintain.
 *
 * The target database needs these properties:
 *   Name (title), Score (number), Source (text), Offer (text),
 *   Riskiest assumption (text), Evidence (url), Verdict (select), Scanned (date)
 */
export async function pushToNotion(rows: ScoredOpportunity[]): Promise<number> {
  if (!config.notionApiKey || !config.notionOpportunityDbId) {
    log('warn', 'notion.skipped', { reason: 'NOTION_API_KEY or NOTION_OPPORTUNITY_DB_ID not configured' });
    return 0;
  }

  const { Client } = await import('@notionhq/client');
  const notion = new Client({ auth: config.notionApiKey });
  let written = 0;

  for (const row of rows) {
    try {
      await notion.pages.create({
        parent: { database_id: config.notionOpportunityDbId },
        properties: {
          Name: { title: [{ text: { content: row.one_line_offer || row.title } }] },
          Score: { number: row.total },
          Source: { rich_text: [{ text: { content: row.source } }] },
          Offer: { rich_text: [{ text: { content: row.one_line_offer } }] },
          'Riskiest assumption': { rich_text: [{ text: { content: row.riskiest_assumption } }] },
          Evidence: { url: row.evidence_urls[0] ?? null },
          Verdict: { select: { name: row.verdict } },
          Scanned: { date: { start: row.collected_at } },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                { text: { content: `${row.total}/${MAX_TOTAL} — ${scoreBreakdown(row)}` } },
              ],
            },
          },
        ],
      } as any);
      written++;
    } catch (err) {
      // A malformed Notion schema should not fail the scan; the DB and email
      // still have the data.
      log('warn', 'notion.row_failed', { fingerprint: row.fingerprint, error: String(err) });
    }
  }
  log('info', 'notion.pushed', { written, attempted: rows.length });
  return written;
}

function scoreBreakdown(row: ScoredOpportunity): string {
  return Object.entries(row.scores)
    .map(([axis, value]) => `${axis}: ${value}`)
    .join(', ');
}
