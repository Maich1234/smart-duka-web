/**
 * Renders a quotation into printable HTML, mirroring receiptHtml.ts's
 * structure but at A4 print size for a full business document rather than
 * the 280px thermal-receipt width.
 *
 * escapeHtml/formatCurrency are copied (not imported) from receiptHtml.ts —
 * small helpers, and this keeps the two renderers independent, matching how
 * the codebase already has no shared "printable document" base class.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount: number, currency = 'KES'): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * validUntil is stored server-side as a Date parsed from an ISO date-only
 * string (e.g. "2026-10-17"), which lands at UTC midnight. Comparing that
 * instant directly against `new Date()` — a naive `<` check — flips a
 * quotation to expired up to a day early for any shop east of UTC (Kenya is
 * UTC+3, so "valid until 17 Oct" would read as expired from 03:00 EAT on 17
 * Oct), and can render the wrong calendar day for any shop west of UTC.
 *
 * Both helpers below work off the UTC calendar-date components rather than
 * the raw instant, so "valid until 17 Oct" means all of 17 Oct in the
 * viewer's own local time, everywhere.
 */
function endOfValidUntilLocalDay(validUntil: string | Date): Date {
  const d = new Date(validUntil);
  // Rebuild the threshold from the UTC Y/M/D the date-only string
  // represented, as a LOCAL date one day later — the instant the quotation
  // actually stops being valid, in the viewer's own timezone.
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** True only once the day AFTER validUntil's calendar date has begun, in the viewer's local time — the final day is inclusive. */
export function isQuotationExpired(validUntil: string | Date): boolean {
  return new Date() >= endOfValidUntilLocalDay(validUntil);
}

/** Formats validUntil's UTC calendar date as a local date, so the displayed day never shifts because of the viewer's timezone offset. */
export function formatQuotationDate(validUntil: string | Date): string {
  const d = new Date(validUntil);
  const localMidnight = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return localMidnight.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface QuotationItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface QuotationData {
  quoteNumber: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogoUrl?: string;
  currency?: string;
  customerSnapshot: { name: string; phone?: string; email?: string };
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  validUntil: string;
  createdAt: string;
  status?: string;
  template?: QuotationTemplate;
}

export type QuotationTemplate = 'classic' | 'modern' | 'minimal';

/**
 * Renders the shop logo when present, otherwise nothing. Matches
 * receiptHtml.ts's logoSection pattern, sized down for a letterhead rather
 * than a centered receipt header.
 */
function logoSection(data: QuotationData): string {
  if (!data.shopLogoUrl?.trim()) return '';
  return `<img src="${escapeHtml(data.shopLogoUrl)}" style="max-height:40px;max-width:160px;object-fit:contain;display:block;margin-bottom:8px" />`;
}

/**
 * Item rows are shared verbatim across all three templates: the same
 * description/qty/unit-price/total columns, in plain (non-bold) weight —
 * this matches quotationPdfService.js's drawItemsTable, which never bolds
 * the items table in any template either. Visual distinction between
 * templates comes from the surrounding header/layout treatment, not from
 * re-weighting this table.
 */
function itemRows(data: QuotationData): string {
  return data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;font-size:12px">${escapeHtml(item.name)}${
          item.description ? `<br><span style="font-size:10px;color:#666">${escapeHtml(item.description)}</span>` : ''
        }</td>
        <td style="text-align:center;padding:8px 4px;font-size:12px">${item.quantity}</td>
        <td style="text-align:right;padding:8px 4px;font-size:12px">${formatCurrency(item.unitPrice, data.currency)}</td>
        <td style="text-align:right;padding:8px 0;font-size:12px">${formatCurrency(item.subtotal, data.currency)}</td>
      </tr>`,
    )
    .join('');
}

/**
 * Totals block, shared across templates. The Total row is set apart by
 * size and the template's accent color rather than bold weight — again
 * matching drawItemsTable's `fontSize(12).fillColor(headerColor)` treatment
 * for the Total line in quotationPdfService.js, so the printed/PDF forms of
 * the same template read as the same document.
 */
function totalsBlock(data: QuotationData, accentColor: string): string {
  return `
    <table style="width:100%;margin-top:12px">
      <tr><td></td><td style="text-align:right;padding:2px 0;font-size:12px;color:#555">Subtotal</td><td style="text-align:right;padding:2px 0;font-size:12px;width:110px">${formatCurrency(data.subtotal, data.currency)}</td></tr>
      ${data.taxAmount > 0 ? `<tr><td></td><td style="text-align:right;padding:2px 0;font-size:12px;color:#555">Tax (${data.taxRate}%)</td><td style="text-align:right;padding:2px 0;font-size:12px">${formatCurrency(data.taxAmount, data.currency)}</td></tr>` : ''}
      <tr><td></td><td style="text-align:right;padding:10px 0;font-size:15px;color:${accentColor}">Total</td><td style="text-align:right;padding:10px 0;font-size:15px;color:${accentColor}">${formatCurrency(data.total, data.currency)}</td></tr>
    </table>`;
}

function footerBlock(data: QuotationData): string {
  return `
    ${data.notes ? `<p style="font-size:11px;color:#555;margin-top:20px">Notes<br>${escapeHtml(data.notes)}</p>` : ''}
    <p style="text-align:center;font-size:10px;color:#999;margin-top:30px;border-top:1px solid #eee;padding-top:12px">
      Valid until ${formatQuotationDate(data.validUntil)}. This is a quotation, not a tax invoice.
    </p>`;
}

/** Classic: clean letterhead, teal accent, bold masthead. */
function classicHtml(data: QuotationData): string {
  const accent = '#0F766E';
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${accent};padding-bottom:16px">
      <div>
        ${logoSection(data)}
        <h1 style="margin:0;font-size:20px;color:#0F172A">${escapeHtml(data.shopName)}</h1>
        ${data.shopPhone ? `<p style="margin:4px 0 0;font-size:11px;color:#666">${escapeHtml(data.shopPhone)}</p>` : ''}
        ${data.shopAddress ? `<p style="margin:4px 0 0;font-size:11px;color:#666">${escapeHtml(data.shopAddress)}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h2 style="margin:0;font-size:16px;color:${accent};letter-spacing:1px">QUOTATION</h2>
        <p style="margin:4px 0 0;font-size:11px;color:#666">${escapeHtml(data.quoteNumber)}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#666">Issued ${formatDate(data.createdAt)}</p>
      </div>
    </div>
    <div style="margin-top:20px">
      <p style="font-size:10px;color:#999;margin:0">BILL TO</p>
      <p style="font-size:14px;font-weight:600;color:#0F172A;margin:4px 0">${escapeHtml(data.customerSnapshot.name)}</p>
      ${data.customerSnapshot.phone ? `<p style="font-size:11px;color:#666;margin:0">${escapeHtml(data.customerSnapshot.phone)}</p>` : ''}
    </div>
    <table style="width:100%;margin-top:24px;border-collapse:collapse">
      <thead><tr style="border-bottom:2px solid #0F172A">
        <th style="text-align:left;font-size:10px;color:#999;padding-bottom:6px">DESCRIPTION</th>
        <th style="text-align:center;font-size:10px;color:#999;padding-bottom:6px">QTY</th>
        <th style="text-align:right;font-size:10px;color:#999;padding-bottom:6px">UNIT PRICE</th>
        <th style="text-align:right;font-size:10px;color:#999;padding-bottom:6px">TOTAL</th>
      </tr></thead>
      <tbody>${itemRows(data)}</tbody>
    </table>
    ${totalsBlock(data, accent)}
    ${footerBlock(data)}
  `;
}

/** Modern: dark full-bleed header banner, same bold masthead treatment as classic but reversed on dark. */
function modernHtml(data: QuotationData): string {
  const accent = '#111827';
  return `
    <div style="background:${accent};color:#fff;padding:24px;margin:-40px -40px 24px;border-radius:0 0 12px 12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          ${logoSection(data)}
          <h1 style="margin:0;font-size:20px">${escapeHtml(data.shopName)}</h1>
          ${data.shopPhone ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af">${escapeHtml(data.shopPhone)}</p>` : ''}
          ${data.shopAddress ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af">${escapeHtml(data.shopAddress)}</p>` : ''}
        </div>
        <div style="text-align:right">
          <h2 style="margin:0;font-size:14px;letter-spacing:2px">QUOTATION</h2>
          <p style="margin:4px 0 0;font-size:11px;color:#9ca3af">${escapeHtml(data.quoteNumber)}</p>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between">
      <div>
        <p style="font-size:10px;color:#999;margin:0">BILL TO</p>
        <p style="font-size:14px;font-weight:600;color:#111827;margin:4px 0">${escapeHtml(data.customerSnapshot.name)}</p>
        ${data.customerSnapshot.phone ? `<p style="font-size:11px;color:#666;margin:0">${escapeHtml(data.customerSnapshot.phone)}</p>` : ''}
      </div>
      <p style="font-size:11px;color:#666">Issued ${formatDate(data.createdAt)}</p>
    </div>
    <table style="width:100%;margin-top:20px;border-collapse:collapse">
      <thead><tr style="border-bottom:2px solid ${accent}">
        <th style="text-align:left;font-size:10px;color:#999;padding-bottom:6px">DESCRIPTION</th>
        <th style="text-align:center;font-size:10px;color:#999;padding-bottom:6px">QTY</th>
        <th style="text-align:right;font-size:10px;color:#999;padding-bottom:6px">UNIT PRICE</th>
        <th style="text-align:right;font-size:10px;color:#999;padding-bottom:6px">TOTAL</th>
      </tr></thead>
      <tbody>${itemRows(data)}</tbody>
    </table>
    ${totalsBlock(data, accent)}
    ${footerBlock(data)}
  `;
}

/**
 * Minimal: lightest visual weight, no bold anywhere (matches
 * quotationPdfService.js's minimalTemplate, which never calls
 * `.font('Helvetica-Bold')`). Hierarchy comes from size, muted color and a
 * hairline rule instead of weight.
 */
function minimalHtml(data: QuotationData): string {
  const accent = '#374151';
  return `
    <div style="border-bottom:1px solid #eee;padding-bottom:14px">
      ${logoSection(data)}
      <p style="font-size:13px;color:#111;margin:0">${escapeHtml(data.shopName)}</p>
      ${data.shopPhone ? `<p style="font-size:10px;color:#999;margin:4px 0 0">${escapeHtml(data.shopPhone)}</p>` : ''}
      ${data.shopAddress ? `<p style="font-size:10px;color:#999;margin:4px 0 0">${escapeHtml(data.shopAddress)}</p>` : ''}
      <p style="font-size:10px;color:#999;margin:4px 0 0">Quotation ${escapeHtml(data.quoteNumber)} &middot; ${formatDate(data.createdAt)}</p>
    </div>
    <div style="margin-top:16px">
      <p style="font-size:10px;color:#999;margin:0">Bill to</p>
      <p style="font-size:13px;color:#111;margin:4px 0">${escapeHtml(data.customerSnapshot.name)}</p>
      ${data.customerSnapshot.phone ? `<p style="font-size:11px;color:#666;margin:0">${escapeHtml(data.customerSnapshot.phone)}</p>` : ''}
    </div>
    <table style="width:100%;margin-top:20px;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid #ddd">
        <th style="text-align:left;font-size:10px;color:#999;padding-bottom:6px;font-weight:400">Description</th>
        <th style="text-align:center;font-size:10px;color:#999;padding-bottom:6px;font-weight:400">Qty</th>
        <th style="text-align:right;font-size:10px;color:#999;padding-bottom:6px;font-weight:400">Unit price</th>
        <th style="text-align:right;font-size:10px;color:#999;padding-bottom:6px;font-weight:400">Total</th>
      </tr></thead>
      <tbody>${itemRows(data)}</tbody>
    </table>
    ${totalsBlock(data, accent)}
    ${footerBlock(data)}
  `;
}

const TEMPLATES: Record<QuotationTemplate, (data: QuotationData) => string> = {
  classic: classicHtml,
  modern: modernHtml,
  minimal: minimalHtml,
};

export function buildQuotationHtml(data: QuotationData, template: QuotationTemplate = 'classic'): string {
  const body = (TEMPLATES[template] ?? classicHtml)(data);
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>@page { size: A4; margin: 20mm; } @media print { body { margin: 0; } } body { font-family: -apple-system, Helvetica, Arial, sans-serif; }</style>
</head>
<body style="max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a">
  ${body}
</body>
</html>`;
}

/** Returns false when the popup was blocked, so callers can surface that instead of silently doing nothing. */
export function printQuotationHtml(html: string): boolean {
  const win = window.open('', '_blank', 'width=850,height=1100,scrollbars=yes');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
}
