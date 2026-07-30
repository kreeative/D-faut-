import { runMarketScan } from '../../../../jobs/market-scan.ts';
import { config } from '../../../../lib/config.ts';
import { log } from '../../../../lib/logger.ts';

export const dynamic = 'force-dynamic';
// Scoring 60 candidates takes minutes, well past the default function timeout.
export const maxDuration = 300;

/**
 * Vercel Cron entrypoint. Scheduled in vercel.json for 07:00 UTC on Sundays,
 * which is 03:00 in America/Toronto during EDT and 02:00 during EST. Vercel
 * Cron has no timezone support; for a 3am job the winter drift is harmless.
 */
export async function GET(request: Request): Promise<Response> {
  // Vercel signs cron requests with CRON_SECRET as a bearer token.
  if (config.cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${config.cronSecret}`) {
      return new Response('unauthorized', { status: 401 });
    }
  }

  try {
    const result = await runMarketScan();
    return Response.json({ ok: true, ...result, top: undefined });
  } catch (err) {
    log('error', 'cron.market_scan_failed', { error: String(err) });
    // 500 so the failure is visible in Vercel's cron history, not just the logs.
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
