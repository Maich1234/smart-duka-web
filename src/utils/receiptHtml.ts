import QRCode from 'qrcode';

/**
 * Renders a QR as an inline SVG.
 *
 * Uses qrcode's synchronous create() and draws the matrix by hand rather than
 * the async toString(), so buildReceiptHtml stays synchronous. That matters:
 * printReceiptHtml calls window.open(), and awaiting anything first takes it
 * out of the click's call stack, where popup blockers kill it.
 *
 * One <path> rather than a grid of <rect> elements — thermal printers render
 * a single path far more reliably. Consecutive dark modules in a row are
 * merged into one run, which is what keeps the markup small.
 */
function qrSvg(text: string, sizePx = 120): string {
  try {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const count = modules.size;
    const data = modules.data;
    let path = '';
    for (let row = 0; row < count; row++) {
      let col = 0;
      while (col < count) {
        if (!data[row * count + col]) { col++; continue; }
        const start = col;
        while (col < count && data[row * count + col]) col++;
        path += `M${start} ${row}h${col - start}v1h-${col - start}z`;
      }
    }
    // quiet zone of 2 modules, required for scanners to lock on
    const q = 2;
    const box = count + q * 2;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" ` +
      `width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">` +
      `<rect width="${box}" height="${box}" fill="#fff"/>` +
      `<g transform="translate(${q},${q})" fill="#000"><path d="${path}"/></g>` +
      `</svg>`
    );
  } catch {
    // A receipt that prints without its QR beats one that doesn't print.
    return '';
  }
}

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

function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface SaleItem {
  productName?: string;
  name?: string;
  quantity: number;
  subtotal: number;
  discountAmount?: number;
  appliedPromotionLabel?: string;
}

interface Sale {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
  staff?: { _id: string; name: string };
  receiptToken?: string;
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
}

export function buildReceiptHtml(
  sale: Sale,
  shopName: string,
  shopPhone?: string,
  currency?: string,
  servedByName?: string,
  thankYouNote?: string,
  logoUrl?: string,
  motto?: string,
): string {
  const rows = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding:3px 0;font-size:11px">${escapeHtml(item.productName ?? item.name ?? '')}${
          item.discountAmount && item.discountAmount > 0 && item.appliedPromotionLabel
            ? `<br><span style="font-size:9px;color:#16a34a">${escapeHtml(item.appliedPromotionLabel)}</span>`
            : ''
        }</td>
        <td style="text-align:center;padding:3px 4px;font-size:11px">x${item.quantity}</td>
        <td style="text-align:right;padding-left:6px;font-size:11px;font-weight:bold">${formatCurrency(item.subtotal, currency)}</td>
      </tr>`,
    )
    .join('');

  const logoSection = logoUrl?.trim()
    ? `<div style="text-align:center;margin-bottom:6px"><img src="${escapeHtml(logoUrl)}" style="max-width:80px;max-height:80px;object-fit:contain" /></div>`
    : '';

  const mottoLine = motto?.trim()
    ? `<p style="text-align:center;margin:0 0 4px;font-size:9px;font-style:italic;color:#555">${escapeHtml(motto)}</p>`
    : '';

  const phoneLine = shopPhone
    ? `<p style="text-align:center;margin:0 0 4px;font-size:10px;color:#444">${escapeHtml(shopPhone)}</p>`
    : '';

  const mpesaSection =
    sale.paymentMethod === 'mpesa' && sale.mpesaReceiptNumber
      ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 10px;margin:8px 0">
          <p style="margin:0 0 3px;font-size:9px;font-weight:bold;color:#15803d;text-align:center">LIPA NA M-PESA CONFIRMED</p>
          <table style="width:100%;font-size:9px">
            <tr><td><b>Receipt</b></td><td style="text-align:right;font-family:monospace">${escapeHtml(sale.mpesaReceiptNumber)}</td></tr>
            ${sale.mpesaPhoneNumber ? `<tr><td><b>Customer</b></td><td style="text-align:right">${escapeHtml(sale.mpesaPhoneNumber)}</td></tr>` : ''}
          </table>
        </div>`
      : '';

  const receiptUrl = sale.receiptToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${sale.receiptToken}`
    : null;

  // The URL is printed under the code as well, so a customer whose camera
  // won't scan can still type it in.
  const qrSection = receiptUrl
    ? `<div style="text-align:center;margin-top:14px;padding-top:10px;border-top:1px dashed #000">
        <p style="margin:0 0 6px;font-size:9px;color:#666">Scan to verify this receipt &amp; rate your service</p>
        <div style="margin:0 auto 4px;line-height:0">${qrSvg(receiptUrl)}</div>
        <p style="margin:0;font-size:8px;color:#888;word-break:break-all">${escapeHtml(receiptUrl)}</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>@media print { body { margin: 0; } }</style>
</head>
<body style="font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:16px 8px;color:#000">
  ${logoSection}
  <h2 style="text-align:center;margin:0 0 2px;font-size:16px">${escapeHtml(shopName)}</h2>
  ${mottoLine}
  ${phoneLine}
  <p style="text-align:center;margin:0 0 10px;font-size:9px;color:#666">Smart Duka POS</p>
  <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
  <table style="width:100%;font-size:10px;margin-bottom:4px">
    <tr><td><b>Invoice</b></td><td style="text-align:right">${escapeHtml(sale.invoiceNumber)}</td></tr>
    <tr><td><b>Date</b></td><td style="text-align:right">${formatDateTime(sale.createdAt)}</td></tr>
    <tr><td><b>Served By</b></td><td style="text-align:right">${escapeHtml(sale.staff?.name ?? servedByName ?? '-')}</td></tr>
    <tr><td><b>Payment</b></td><td style="text-align:right">${sale.paymentMethod.toUpperCase()}</td></tr>
  </table>
  ${mpesaSection}
  <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid #000;font-size:10px">
        <th style="text-align:left;padding-bottom:3px">Item</th>
        <th style="text-align:center;padding-bottom:3px">Qty</th>
        <th style="text-align:right;padding-bottom:3px">Sub</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
  <table style="width:100%;font-size:14px;font-weight:bold">
    <tr>
      <td>TOTAL</td>
      <td style="text-align:right">${formatCurrency(sale.totalAmount, currency)}</td>
    </tr>
  </table>
  <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
  <p style="text-align:center;margin-top:16px;font-size:11px;font-style:italic;color:#000">${escapeHtml(thankYouNote?.trim() || 'Thank you, dear customer!')}</p>
  ${qrSection}
</body>
</html>`;
}

export function printReceiptHtml(html: string): void {
  const win = window.open('', '_blank', 'width=420,height=700,scrollbars=yes');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}
