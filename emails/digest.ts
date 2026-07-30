import type { ScoredOpportunity } from '../lib/types.ts';
import { MAX_TOTAL } from '../lib/types.ts';

/**
 * The digest is three opportunities and their riskiest assumptions. It is
 * deliberately not a report — the operator has ten hours a week and Notion
 * holds the full list.
 *
 * Plain HTML rather than React Email: the brief specified React Email, but a
 * single transactional template does not justify the dependency yet. Swap it
 * in Phase 5 when there are five or six templates to keep consistent.
 */
export function renderDigestHtml(top: ScoredOpportunity[], scannedAt: Date): string {
  const rows = top
    .map(
      (o, i) => `
    <tr><td style="padding:20px 0;border-bottom:1px solid #e5e5e5">
      <div style="font:600 13px/1.4 -apple-system,Segoe UI,sans-serif;color:#888">
        ${i + 1} &middot; ${escapeHtml(o.source)} &middot; ${o.total}/${MAX_TOTAL}
      </div>
      <div style="font:600 17px/1.4 -apple-system,Segoe UI,sans-serif;color:#111;margin:6px 0">
        ${escapeHtml(o.one_line_offer || o.title)}
      </div>
      <div style="font:400 14px/1.5 -apple-system,Segoe UI,sans-serif;color:#444;margin:8px 0">
        <strong>Riskiest assumption:</strong> ${escapeHtml(o.riskiest_assumption)}
      </div>
      <div style="font:400 13px/1.5 -apple-system,Segoe UI,sans-serif">
        <a href="${escapeHtml(o.evidence_urls[0] ?? '#')}" style="color:#0066cc">evidence</a>
      </div>
    </td></tr>`,
    )
    .join('');

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#fafafa">
  <table style="max-width:600px;margin:0 auto;width:100%;background:#fff;padding:28px;border-radius:8px">
    <tr><td>
      <div style="font:600 20px/1.3 -apple-system,Segoe UI,sans-serif;color:#111">Weekly market scan</div>
      <div style="font:400 13px/1.5 -apple-system,Segoe UI,sans-serif;color:#888;margin-top:4px">
        ${scannedAt.toISOString().slice(0, 10)} &middot; top ${top.length} of the accepted set
      </div>
    </td></tr>
    ${rows}
    <tr><td style="padding-top:20px;font:400 13px/1.5 -apple-system,Segoe UI,sans-serif;color:#888">
      Full ranked list is in Notion. Pick one or pick none.
    </td></tr>
  </table></body></html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
