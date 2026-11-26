import { BarChart3, Package, Receipt } from 'lucide-react';

export function ReceiptVerificationPreview() {
  return (
    <figure className="workflow-preview">
      <figcaption><Receipt size={17} aria-hidden="true" /> Receipt verification example</figcaption>
      <dl className="preview-lines">
        <div><dt>Receipt</dt><dd>DQ-0042</dd></div>
        <div><dt>Payment</dt><dd>M-Pesa</dd></div>
        <div className="preview-total"><dt>Total</dt><dd>KES 240</dd></div>
      </dl>
      <p className="preview-receipt"><strong>Receipt verified</strong></p>
    </figure>
  );
}

export function StockPreview() {
  return (
    <figure className="workflow-preview">
      <figcaption><Package size={17} aria-hidden="true" /> Stock alert example</figcaption>
      <dl className="preview-lines">
        <div><dt>Sugar, 1 kg</dt><dd className="preview-alert">3 left · Low stock</dd></div>
        <div><dt>Cooking oil, 1 L</dt><dd>14 left</dd></div>
        <div><dt>Maize flour, 2 kg</dt><dd>19 left</dd></div>
      </dl>
    </figure>
  );
}

export function SalesPreview() {
  return (
    <figure className="workflow-preview">
      <figcaption><BarChart3 size={17} aria-hidden="true" /> Daily sales example</figcaption>
      <dl className="preview-lines">
        <div className="preview-summary"><dt>Daily total</dt><dd>KES 8,450</dd></div>
        <div><dt>M-Pesa</dt><dd>KES 5,100</dd></div>
        <div><dt>Cash</dt><dd>KES 3,350</dd></div>
      </dl>
    </figure>
  );
}
