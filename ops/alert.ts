import { sendEmail } from '../lib/email.ts';
import { escapeHtml } from '../emails/digest.ts';
import { log } from '../lib/logger.ts';

/**
 * Exception alerts only. A healthy run sends the digest and nothing else.
 */
export async function alert(subject: string, detail: string): Promise<void> {
  log('error', 'alert', { subject, detail });
  try {
    await sendEmail(
      `[sleep-engine] ${subject}`,
      `<pre style="font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(detail)}</pre>`,
    );
  } catch (err) {
    // If alerting itself fails there is nowhere left to escalate to; the log
    // line above is the record.
    log('error', 'alert.delivery_failed', { error: String(err) });
  }
}
