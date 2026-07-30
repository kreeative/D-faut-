import { config } from './config.ts';
import { log } from './logger.ts';

/**
 * Returns whether the mail was actually handed to Resend. Callers report that
 * value rather than assuming success — a run that silently skipped the digest
 * because of missing config must not look identical to one that sent it.
 */
export async function sendEmail(subject: string, html: string): Promise<boolean> {
  if (!config.resendApiKey || !config.digestTo) {
    log('warn', 'email.skipped', { reason: 'RESEND_API_KEY or DIGEST_TO not configured' });
    return false;
  }
  const { Resend } = await import('resend');
  const resend = new Resend(config.resendApiKey);
  const { error } = await resend.emails.send({
    from: config.digestFrom,
    to: config.digestTo,
    subject,
    html,
  });
  if (error) throw new Error(`resend: ${error.message}`);
  log('info', 'email.sent', { subject });
  return true;
}
